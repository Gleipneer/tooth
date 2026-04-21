from __future__ import annotations

import json
from typing import Any

from openai import BadRequestError, OpenAI

from app.config import Settings


def get_sync_client(settings: Settings) -> OpenAI | None:
    if not settings.openai_api_key:
        return None
    kwargs: dict[str, Any] = {"api_key": settings.openai_api_key}
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    return OpenAI(**kwargs)


def expensive_model_name(settings: Settings) -> str:
    return settings.openai_default_model or settings.openai_expensive_model


def chat_json(
    client: OpenAI,
    *,
    model: str,
    system: str,
    user: str,
    max_tokens: int = 2_048,
) -> tuple[dict[str, Any], dict[str, int]]:
    """Single chat completion with JSON object response. Returns (parsed, usage_counts)."""
    create_kwargs: dict[str, Any] = {
        "model": model,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    try:
        resp = client.chat.completions.create(**create_kwargs, max_tokens=max_tokens)
    except BadRequestError as exc:
        # Newer models reject max_tokens in favor of max_completion_tokens.
        err_text = str(exc).lower()
        if "max_tokens" in err_text or "max_completion_tokens" in err_text:
            resp = client.chat.completions.create(
                **create_kwargs,
                max_completion_tokens=max_tokens,
            )
        else:
            raise
    content = resp.choices[0].message.content or "{}"
    parsed: dict[str, Any] = json.loads(content)
    usage = resp.usage
    counts = {
        "prompt_tokens": usage.prompt_tokens if usage else 0,
        "completion_tokens": usage.completion_tokens if usage else 0,
        "total_tokens": usage.total_tokens if usage else 0,
    }
    return parsed, counts
