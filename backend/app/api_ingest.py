from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.openai_client import get_sync_client
from app.ai.paste_analyze import run_paste_analyze
from app.config import get_settings
from app.db import get_db_session
from app.dependencies import get_current_user, get_ingest_review_for_user, get_project_for_user
from app.models import IngestReviewItem, Project, RawText, User, utcnow
from app.raw_text_index import try_index_raw_text
from app.schemas import (
    IngestAcceptResponse,
    IngestReviewListItem,
    PasteAnalyzeRequest,
    PasteAnalyzeResponse,
)
from app.storage import TextStorage

router = APIRouter(tags=["ingest"])
logger = logging.getLogger("tooth.api.ingest")


@router.post("/ai/paste-analyze", response_model=PasteAnalyzeResponse)
def paste_analyze(
    payload: PasteAnalyzeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> PasteAnalyzeResponse:
    """Structured analysis of pasted text; stages review item — does not create raw texts."""
    settings = get_settings()
    if len(payload.pasted_text) > settings.paste_max_chars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pasted text exceeds paste_max_chars ({settings.paste_max_chars})",
        )
    client = get_sync_client(settings)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI provider not configured (OPENAI_API_KEY missing)",
        )
    project = get_project_for_user(payload.project_id, user, db)
    try:
        op, item, analysis = run_paste_analyze(
            db=db,
            user=user,
            project=project,
            pasted_text=payload.pasted_text,
            client=client,
            settings=settings,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("paste_analyze_failed error=%s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI provider request failed",
        ) from exc

    usage = json.loads(op.token_usage_json)
    return PasteAnalyzeResponse(
        operation_id=op.id,
        review_item_id=item.id,
        analysis=analysis,
        token_usage=usage,
    )


@router.get("/projects/{project_id}/ingest-candidates", response_model=list[IngestReviewListItem])
def list_ingest_candidates(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[IngestReviewListItem]:
    project = get_project_for_user(project_id, user, db)
    rows = db.scalars(
        select(IngestReviewItem)
        .where(IngestReviewItem.project_id == project.id, IngestReviewItem.user_id == user.id)
        .order_by(IngestReviewItem.created_at.desc())
    ).all()
    return [
        IngestReviewListItem(
            id=r.id,
            project_id=r.project_id,
            status=r.status,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in rows
    ]


@router.post("/ingest-review/{item_id}/accept", response_model=IngestAcceptResponse)
def accept_ingest_review(
    item_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> IngestAcceptResponse:
    """Create raw texts only from create_raw_text / create_many_raw_texts intents (explicit)."""
    item = get_ingest_review_for_user(item_id, user, db)
    if item.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item is not pending")

    data = json.loads(item.payload_json)
    analysis = data.get("paste_analysis")
    if not isinstance(analysis, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid staged payload",
        )

    project = db.get(Project, item.project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    settings = get_settings()
    client = get_sync_client(settings)
    storage = TextStorage()
    created_ids: list[uuid.UUID] = []

    for intent in analysis.get("write_intents", []):
        if not isinstance(intent, dict):
            continue
        kind = intent.get("kind")
        if kind == "create_raw_text":
            title = str(intent.get("title", "Untitled"))[:255]
            body = str(intent.get("body", ""))
            if not body.strip():
                continue
            rt = RawText(
                id=uuid.uuid4(),
                project_id=project.id,
                title=title,
                media_type="text/markdown",
                origin="paste_accept",
                content_path="",
            )
            rt.content_path = storage.write_raw_text(rt.id, body)
            try_index_raw_text(rt, body, client)
            db.add(rt)
            created_ids.append(rt.id)
            logger.info(
                "ingest_accept_create_raw_text raw_text_id=%s review_id=%s",
                rt.id,
                item.id,
            )
        elif kind == "create_many_raw_texts":
            items = intent.get("items", [])
            if not isinstance(items, list):
                continue
            for it in items:
                if not isinstance(it, dict):
                    continue
                title = str(it.get("title", "Untitled"))[:255]
                body = str(it.get("body", ""))
                if not body.strip():
                    continue
                rt = RawText(
                    id=uuid.uuid4(),
                    project_id=project.id,
                    title=title,
                    media_type="text/markdown",
                    origin="paste_accept",
                    content_path="",
                )
                rt.content_path = storage.write_raw_text(rt.id, body)
                try_index_raw_text(rt, body, client)
                db.add(rt)
                created_ids.append(rt.id)
                logger.info(
                    "ingest_accept_create_many raw_text_id=%s review_id=%s",
                    rt.id,
                    item.id,
                )

    item.status = "accepted"
    item.updated_at = utcnow()
    db.commit()

    return IngestAcceptResponse(
        review_item_id=item.id,
        created_raw_text_ids=created_ids,
        status=item.status,
    )


@router.post("/ingest-review/{item_id}/reject", response_model=IngestReviewListItem)
def reject_ingest_review(
    item_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> IngestReviewListItem:
    item = get_ingest_review_for_user(item_id, user, db)
    if item.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item is not pending")
    item.status = "rejected"
    item.updated_at = utcnow()
    db.commit()
    db.refresh(item)
    logger.info("ingest_rejected review_id=%s", item.id)
    return IngestReviewListItem(
        id=item.id,
        project_id=item.project_id,
        status=item.status,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.post("/ingest-review/{item_id}/defer", response_model=IngestReviewListItem)
def defer_ingest_review(
    item_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> IngestReviewListItem:
    item = get_ingest_review_for_user(item_id, user, db)
    if item.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item is not pending")
    item.status = "deferred"
    item.updated_at = utcnow()
    db.commit()
    db.refresh(item)
    logger.info("ingest_deferred review_id=%s", item.id)
    return IngestReviewListItem(
        id=item.id,
        project_id=item.project_id,
        status=item.status,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )
