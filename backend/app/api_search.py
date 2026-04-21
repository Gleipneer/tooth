from __future__ import annotations

import logging
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.ai.openai_client import get_sync_client
from app.config import get_settings
from app.db import get_db_session
from app.dependencies import get_current_user, get_project_for_user
from app.models import User
from app.retrieval.search import SearchHit as RetrievalHit
from app.retrieval.search import fts_search, hybrid_search, semantic_search
from app.schemas import SearchHit, SearchResponse

router = APIRouter(tags=["search"])
logger = logging.getLogger("tooth.api.search")


def _to_schema_hit(h: RetrievalHit) -> SearchHit:
    return SearchHit(
        raw_text_id=h.raw_text_id,
        title=h.title,
        score=h.score,
        rank_kind=h.rank_kind,
    )


@router.get("/projects/{project_id}/search", response_model=SearchResponse)
def project_search(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
    q: str = Query(min_length=1, max_length=500),
    mode: Literal["fts", "semantic", "hybrid"] = Query(default="fts"),
) -> SearchResponse:
    """Project-scoped search (FTS and/or embedding similarity)."""
    settings = get_settings()
    project = get_project_for_user(project_id, user, db)
    meta: dict[str, object] = {}
    lim = settings.search_max_results

    if mode == "fts":
        hits = fts_search(db, project_id=project.id, query=q, limit=lim)
        return SearchResponse(
            query=q,
            mode=mode,
            hits=[_to_schema_hit(h) for h in hits],
            meta=meta,
        )

    client = get_sync_client(settings)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Semantic search requires OPENAI_API_KEY",
        )

    if mode == "semantic":
        sh, meta = semantic_search(
            db,
            client=client,
            project_id=project.id,
            query=q,
            settings=settings,
        )
        hits = [_to_schema_hit(h) for h in sh]
        return SearchResponse(query=q, mode=mode, hits=hits, meta=meta)

    sh, meta = hybrid_search(
        db,
        client=client,
        project_id=project.id,
        query=q,
        settings=settings,
    )
    hits = [_to_schema_hit(h) for h in sh]
    logger.info("project_search project_id=%s mode=%s hits=%s", project_id, mode, len(hits))
    return SearchResponse(query=q, mode=mode, hits=hits, meta=meta)
