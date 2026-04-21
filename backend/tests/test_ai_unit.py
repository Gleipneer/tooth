"""Unit tests for AI routing, context bounds, and no-key API behavior."""

import uuid
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.ai.context import build_context_bundle
from app.ai.planner import rule_prefers_escalation
from app.config import Settings, get_settings
from app.db import get_db_session
from app.dependencies import get_current_user
from app.main import app
from app.models import User


def test_rule_prefers_escalation_detects_keywords() -> None:
    assert rule_prefers_escalation("Please rewrite chapter 3 for continuity") is True
    assert rule_prefers_escalation("Fix a typo in the second paragraph") is False


def test_context_bundle_truncates() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://x:x@localhost:1/x",
        jwt_secret_key="x" * 32,
        ai_max_context_chars=20,
        ai_max_user_message_chars=10,
    )
    long_draft = "a" * 100
    long_msg = "b" * 50
    b = build_context_bundle(draft_excerpt=long_draft, user_message=long_msg, settings=settings)
    assert b["draft_truncated"] is True
    assert len(b["draft_excerpt"]) == 20
    assert b["user_truncated"] is True
    assert len(b["user_message"]) == 10


def test_ai_assist_503_without_openai_client(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.api_ai.get_sync_client", lambda _s: None)
    get_settings.cache_clear()

    uid = uuid.uuid4()
    fake = User(
        email="t@example.com",
        password_hash="x",
        is_active=True,
    )
    fake.id = uid

    def _user() -> User:
        return fake

    def _db() -> object:
        yield MagicMock()

    app.dependency_overrides[get_current_user] = _user
    app.dependency_overrides[get_db_session] = _db
    try:
        with TestClient(app) as client:
            r = client.post(
                "/api/v1/ai/assist",
                json={
                    "project_id": str(uuid.uuid4()),
                    "message": "hello",
                },
            )
        assert r.status_code == 503
        assert "OPENAI_API_KEY" in r.json()["detail"]
    finally:
        app.dependency_overrides.clear()
        get_settings.cache_clear()
