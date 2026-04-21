"""Bounded retrieval snippets for AI context assembly (inspectable, project-scoped)."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.models import RawText
from app.retrieval.search import fts_search
from app.storage import TextStorage


def fts_snippets_for_ai(
    db: Session,
    *,
    project_id: uuid.UUID,
    query: str,
    excerpt_chars: int,
    max_hits: int,
    settings: Settings | None = None,
) -> list[dict[str, object]]:
    """Return ranked FTS hits with bounded file excerpts (same project only)."""
    settings = settings or get_settings()
    lim = max(1, min(max_hits, settings.search_max_results))
    hits = fts_search(db, project_id=project_id, query=query, limit=lim)
    storage = TextStorage()
    out: list[dict[str, object]] = []
    for h in hits:
        rt = db.get(RawText, h.raw_text_id)
        if rt is None or rt.archived:
            continue
        try:
            full = storage.read_text(rt.content_path)
        except OSError:
            full = ""
        excerpt = full[:excerpt_chars]
        out.append(
            {
                "raw_text_id": str(rt.id),
                "title": rt.title,
                "rank_kind": h.rank_kind,
                "score": h.score,
                "excerpt": excerpt,
                "excerpt_truncated": len(full) > excerpt_chars,
            }
        )
    return out
