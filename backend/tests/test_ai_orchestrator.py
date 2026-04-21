"""Orchestrator tests: cheap-only vs escalated paths with mocked provider calls."""

from __future__ import annotations

import uuid
from unittest.mock import MagicMock

import pytest

from app.ai import orchestrator as orch
from app.config import Settings


def _settings() -> Settings:
    return Settings(
        database_url="postgresql+psycopg://x:x@localhost:1/x",
        jwt_secret_key="x" * 32,
        openai_cheap_model="cheap-model",
        openai_expensive_model="deep-model",
        openai_default_model=None,
        ai_max_cheap_rounds=3,
    )


@pytest.fixture
def db_session() -> MagicMock:
    s = MagicMock()
    return s


@pytest.fixture
def user_project() -> tuple[MagicMock, MagicMock]:
    u = MagicMock()
    u.id = uuid.uuid4()
    p = MagicMock()
    p.id = uuid.uuid4()
    return u, p


def test_run_assist_cheap_only_uses_cheap_model_twice(
    monkeypatch: pytest.MonkeyPatch,
    db_session: MagicMock,
    user_project: tuple[MagicMock, MagicMock],
) -> None:
    user, project = user_project
    client = MagicMock()
    settings = _settings()
    queue: list[tuple[dict, dict]] = [
        (
            {"task_class": "summarize", "needs_escalation": False, "reason": "ok"},
            {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        ),
        (
            {
                "suggestions": [
                    {"id": "1", "title": "t", "body": "b", "apply_kind": "note"},
                ],
                "confidence": 0.9,
            },
            {"prompt_tokens": 20, "completion_tokens": 10, "total_tokens": 30},
        ),
    ]

    def fake_chat(_client: object, **kwargs: object) -> tuple[dict, dict]:
        return queue.pop(0)

    monkeypatch.setattr(orch, "chat_json", fake_chat)

    op, body, _reason = orch.run_assist(
        db=db_session,
        user=user,
        project=project,
        draft=None,
        user_message="Short question about this draft.",
        client=client,
        settings=settings,
    )

    assert op.route_final == "cheap_only"
    assert op.escalated is False
    assert op.cheap_rounds == 2
    assert body.get("confidence") == 0.9
    db_session.add.assert_called_once()
    db_session.commit.assert_called_once()


def test_run_assist_escalated_uses_summary_then_deep(
    monkeypatch: pytest.MonkeyPatch,
    db_session: MagicMock,
    user_project: tuple[MagicMock, MagicMock],
) -> None:
    user, project = user_project
    client = MagicMock()
    settings = _settings()
    queue: list[tuple[dict, dict]] = [
        (
            {"task_class": "editorial_deep", "needs_escalation": True, "reason": "needs depth"},
            {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
        ),
        (
            {"bullets": ["point"]},
            {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
        ),
        (
            {
                "suggestions": [
                    {"id": "1", "title": "deep", "body": "x", "apply_kind": "note"},
                ],
                "confidence": 0.8,
            },
            {"prompt_tokens": 50, "completion_tokens": 40, "total_tokens": 90},
        ),
    ]

    def fake_chat(_client: object, **kwargs: object) -> tuple[dict, dict]:
        return queue.pop(0)

    monkeypatch.setattr(orch, "chat_json", fake_chat)

    op, body, _reason = orch.run_assist(
        db=db_session,
        user=user,
        project=project,
        draft=None,
        # Avoid planner rule keywords (e.g. continuity, chapter) so the cheap planner runs first.
        user_message="Please analyze how the second paragraph supports the argument.",
        client=client,
        settings=settings,
    )

    assert op.route_final == "escalated"
    assert op.escalated is True
    # Planner (cheap) + summary (cheap) before deep model.
    assert op.cheap_rounds == 2
    assert body.get("suggestions")


def test_run_assist_rule_keyword_skips_planner(
    monkeypatch: pytest.MonkeyPatch,
    db_session: MagicMock,
    user_project: tuple[MagicMock, MagicMock],
) -> None:
    """Keyword rule forces escalation; planner JSON is not called first."""
    user, project = user_project
    client = MagicMock()
    settings = _settings()
    queue: list[tuple[dict, dict]] = [
        (
            {"bullets": ["b1"]},
            {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
        ),
        (
            {
                "suggestions": [
                    {"id": "1", "title": "r", "body": "w", "apply_kind": "note"},
                ],
                "confidence": 0.7,
            },
            {"prompt_tokens": 2, "completion_tokens": 2, "total_tokens": 4},
        ),
    ]
    planner_calls = 0

    def fake_chat(_client: object, **kwargs: object) -> tuple[dict, dict]:
        nonlocal planner_calls
        system = kwargs.get("system", "")
        if "routing planner" in str(system).lower() or "Plan routing" in str(system):
            planner_calls += 1
        return queue.pop(0)

    monkeypatch.setattr(orch, "chat_json", fake_chat)

    op, _body, reason = orch.run_assist(
        db=db_session,
        user=user,
        project=project,
        draft=None,
        user_message="Please rewrite the opening for tone.",
        client=client,
        settings=settings,
    )

    assert planner_calls == 0
    assert reason == "rule_keyword_escalation"
    assert op.route_final == "escalated"
