"""OpenAI embedding helper for semantic retrieval (bounded input)."""

from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from app.config import Settings


def embed_text(client: OpenAI, text: str, settings: Settings) -> tuple[list[float], dict[str, Any]]:
    """Return embedding vector and raw usage metadata."""
    clipped = text[: settings.embedding_max_chars]
    resp = client.embeddings.create(model=settings.openai_embedding_model, input=clipped)
    emb = list(resp.data[0].embedding)
    usage: dict[str, Any] = {}
    u = getattr(resp, "usage", None)
    if u is not None:
        usage = {
            "prompt_tokens": int(getattr(u, "prompt_tokens", 0) or 0),
            "total_tokens": int(getattr(u, "total_tokens", 0) or 0),
        }
    return emb, usage


def embedding_to_json(emb: list[float]) -> str:
    return json.dumps(emb, separators=(",", ":"))
