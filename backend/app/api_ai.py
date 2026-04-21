from __future__ import annotations

import logging
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.openai_client import get_sync_client
from app.ai.orchestrator import operation_to_response_dict, run_assist
from app.config import get_settings
from app.db import get_db_session
from app.dependencies import get_current_user, get_draft_for_user, get_project_for_user
from app.models import AIOperation, User
from app.schemas import (
    AIAssistRequest,
    AIAssistResponse,
    AIOperationListItem,
    AISuggestionItem,
)

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger("tooth.api.ai")


@router.post("/assist", response_model=AIAssistResponse)
def ai_assist(
    payload: AIAssistRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AIAssistResponse:
    settings = get_settings()
    client = get_sync_client(settings)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI provider not configured (OPENAI_API_KEY missing)",
        )

    project = get_project_for_user(payload.project_id, user, db)
    draft = None
    if payload.draft_id is not None:
        draft = get_draft_for_user(payload.draft_id, user, db)
        if draft.project_id != project.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Draft does not belong to project",
            )

    try:
        op, response_body, planner_reason = run_assist(
            db=db,
            user=user,
            project=project,
            draft=draft,
            user_message=payload.message,
            client=client,
            settings=settings,
            use_retrieval=payload.use_retrieval,
            retrieval_query=payload.retrieval_query,
        )
    except Exception as exc:
        logger.exception("ai_assist_failed error=%s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI provider request failed",
        ) from exc

    data = operation_to_response_dict(op, response_body, planner_reason)
    return AIAssistResponse(
        operation_id=data["operation_id"],
        task_class=data["task_class"],
        route_final=data["route_final"],
        escalated=data["escalated"],
        cheap_rounds=data["cheap_rounds"],
        planner_reason=data.get("planner_reason"),
        context_bundle=data["context_bundle"],
        suggestions=[
            AISuggestionItem(
                id=str(s.get("id", uuid.uuid4())),
                title=str(s.get("title", "")),
                body=str(s.get("body", "")),
                apply_kind=str(s.get("apply_kind", "note")),
            )
            for s in data["suggestions"]
            if isinstance(s, dict)
        ],
        confidence=float(data.get("confidence", 0.5)),
        token_usage=data["token_usage"],
    )


@router.get("/operations", response_model=list[AIOperationListItem])
def list_ai_operations(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[AIOperationListItem]:
    get_project_for_user(project_id, user, db)
    rows = db.scalars(
        select(AIOperation)
        .where(AIOperation.project_id == project_id, AIOperation.user_id == user.id)
        .order_by(AIOperation.created_at.desc())
        .limit(limit)
    ).all()
    return [
        AIOperationListItem(
            id=r.id,
            project_id=r.project_id,
            draft_id=r.draft_id,
            task_class=r.task_class,
            route_final=r.route_final,
            escalated=r.escalated,
            cheap_rounds=r.cheap_rounds,
            created_at=r.created_at,
        )
        for r in rows
    ]
