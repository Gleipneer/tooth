"""Populate search_text + optional embedding for a raw text row (after file write)."""

from __future__ import annotations

import logging

from openai import OpenAI

from app.ai.embeddings import embed_text, embedding_to_json
from app.config import Settings, get_settings
from app.models import RawText
from app.text_bounds import truncate_for_search

logger = logging.getLogger("tooth.raw_text_index")


def try_index_raw_text(
    raw_text: RawText,
    content: str,
    client: OpenAI | None,
    settings: Settings | None = None,
) -> None:
    """Set bounded search_text; compute embedding when client is configured."""
    settings = settings or get_settings()
    raw_text.search_text = truncate_for_search(content)
    if client is None:
        return
    try:
        emb, _usage = embed_text(client, content, settings)
        raw_text.embedding_json = embedding_to_json(emb)
        raw_text.embedding_model = settings.openai_embedding_model
    except Exception as exc:  # noqa: BLE001
        logger.warning("embedding_index_failed raw_text_id=%s err=%s", raw_text.id, exc)
