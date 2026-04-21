"""Project-scoped search: PostgreSQL FTS + optional semantic ranking."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from typing import Any

from openai import OpenAI
from sqlalchemy import bindparam, select, text
from sqlalchemy.orm import Session

from app.ai.embeddings import embed_text
from app.config import Settings, get_settings
from app.models import RawText
from app.retrieval.similarity import cosine_similarity


@dataclass(frozen=True)
class SearchHit:
    raw_text_id: uuid.UUID
    title: str
    score: float
    rank_kind: str  # fts | semantic | hybrid


def fts_search(
    db: Session,
    *,
    project_id: uuid.UUID,
    query: str,
    limit: int,
) -> list[SearchHit]:
    """Full-text search within a single project (bounded)."""
    if not query.strip():
        return []
    lim = max(1, min(limit, 200))
    sql = text(
        """
        SELECT id, title,
          ts_rank(
            to_tsvector(
              'english',
              coalesce(title, '') || ' ' || coalesce(search_text, '')
            ),
            plainto_tsquery('english', :q)
          ) AS r
        FROM raw_texts
        WHERE project_id = :pid
          AND archived = false
          AND to_tsvector(
            'english',
            coalesce(title, '') || ' ' || coalesce(search_text, '')
          ) @@ plainto_tsquery('english', :q)
        ORDER BY r DESC
        LIMIT :lim
        """
    ).bindparams(
        bindparam("q"),
        bindparam("pid"),
        bindparam("lim"),
    )
    rows = db.execute(sql, {"q": query, "pid": project_id, "lim": lim}).all()
    return [
        SearchHit(raw_text_id=row.id, title=row.title, score=float(row.r), rank_kind="fts")
        for row in rows
    ]


def semantic_search(
    db: Session,
    *,
    client: OpenAI,
    project_id: uuid.UUID,
    query: str,
    settings: Settings | None = None,
) -> tuple[list[SearchHit], dict[str, Any]]:
    """Embedding similarity over stored vectors (project-scoped, bounded scan)."""
    settings = settings or get_settings()
    max_scan = settings.semantic_scan_max_raw_texts
    max_out = settings.search_max_results
    if not query.strip():
        return [], {}

    q_emb, q_usage = embed_text(client, query, settings)

    rows = db.scalars(
        select(RawText)
        .where(
            RawText.project_id == project_id,
            RawText.archived.is_(False),
            RawText.embedding_json.is_not(None),
        )
        .limit(max_scan)
    ).all()

    scored: list[tuple[float, RawText]] = []
    for r in rows:
        try:
            emb = json.loads(r.embedding_json or "[]")
            if not isinstance(emb, list):
                continue
            vec = [float(x) for x in emb]
        except (json.JSONDecodeError, TypeError, ValueError):
            continue
        s = cosine_similarity(q_emb, vec)
        scored.append((s, r))

    scored.sort(key=lambda x: x[0], reverse=True)
    hits = [
        SearchHit(raw_text_id=rt.id, title=rt.title, score=s, rank_kind="semantic")
        for s, rt in scored[:max_out]
    ]
    return hits, {"embedding_usage": q_usage, "model": settings.openai_embedding_model}


def hybrid_search(
    db: Session,
    *,
    client: OpenAI,
    project_id: uuid.UUID,
    query: str,
    settings: Settings | None = None,
) -> tuple[list[SearchHit], dict[str, Any]]:
    """Merge FTS and semantic ranks with transparent scores (bounded)."""
    settings = settings or get_settings()
    fts_hits = fts_search(db, project_id=project_id, query=query, limit=settings.search_max_results)
    sem_hits, meta = semantic_search(
        db,
        client=client,
        project_id=project_id,
        query=query,
        settings=settings,
    )

    by_id: dict[uuid.UUID, tuple[float, float]] = {}
    for h in fts_hits:
        by_id[h.raw_text_id] = (h.score, 0.0)
    for h in sem_hits:
        prev = by_id.get(h.raw_text_id, (0.0, 0.0))
        by_id[h.raw_text_id] = (prev[0], h.score)

    titles: dict[uuid.UUID, str] = {h.raw_text_id: h.title for h in fts_hits}
    for h in sem_hits:
        titles.setdefault(h.raw_text_id, h.title)

    merged: list[SearchHit] = []
    for rid, (fts_s, sem_s) in by_id.items():
        # Normalize FTS rank (often < 1) and cosine (0–1) into a simple sum for transparency.
        combined = fts_s + sem_s
        merged.append(
            SearchHit(
                raw_text_id=rid,
                title=titles.get(rid, ""),
                score=combined,
                rank_kind="hybrid",
            )
        )
    merged.sort(key=lambda x: x.score, reverse=True)
    return merged[: settings.search_max_results], meta
