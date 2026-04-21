"""Tests for OpenAI chat_json compatibility (max_tokens vs max_completion_tokens)."""

from __future__ import annotations

from unittest.mock import MagicMock

from openai import BadRequestError

from app.ai.openai_client import chat_json


def test_chat_json_retries_with_max_completion_tokens() -> None:
    client = MagicMock()
    calls: list[dict] = []

    def create(**kwargs: object) -> MagicMock:
        calls.append(kwargs)
        if len(calls) == 1:
            raise BadRequestError(
                "unsupported max_tokens",
                response=MagicMock(status_code=400),
                body={"error": {"message": "Use max_completion_tokens instead"}},
            )
        out = MagicMock()
        out.choices = [MagicMock(message=MagicMock(content='{"x": 1}'))]
        out.usage = MagicMock(prompt_tokens=1, completion_tokens=2, total_tokens=3)
        return out

    client.chat.completions.create = create

    parsed, usage = chat_json(
        client,
        model="test-model",
        system="sys",
        user="user",
        max_tokens=100,
    )

    assert parsed == {"x": 1}
    assert usage["total_tokens"] == 3
    assert "max_tokens" in calls[0]
    assert "max_completion_tokens" in calls[1]
