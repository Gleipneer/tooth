from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db import SessionLocal
from app.main import app
from app.models import User


def test_signup_login_duplicate_and_wrong_password() -> None:
    email = f"auth-{uuid.uuid4()}@example.com"
    password = "valid-pass-123"
    with TestClient(app) as client:
        signup = client.post("/api/v1/auth/signup", json={"email": email, "password": password})
        assert signup.status_code == 201
        assert signup.json()["email"] == email

        duplicate = client.post("/api/v1/auth/signup", json={"email": email, "password": password})
        assert duplicate.status_code == 409
        assert "already registered" in duplicate.json()["detail"]

        wrong = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrong-pass-123"},
        )
        assert wrong.status_code == 401
        assert "Invalid email or password" in wrong.json()["detail"]

        ok = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert ok.status_code == 200
        token = ok.json()["access_token"]

        me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == email

    with SessionLocal() as db:
        db.execute(delete(User).where(User.email == email))
        db.commit()
