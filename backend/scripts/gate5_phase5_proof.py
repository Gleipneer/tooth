#!/usr/bin/env python3
"""Gate 5 smoke: FTS search + optional paste-analyze (requires DB; OpenAI for paste)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.chdir(BACKEND_ROOT)

from app.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


def main() -> int:
    get_settings.cache_clear()
    settings = get_settings()
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"email": settings.bootstrap_email, "password": settings.bootstrap_password},
        )
        if login.status_code != 200:
            print("FAIL login", login.status_code, file=sys.stderr)
            return 1
        token = login.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}
        projects = client.get("/api/v1/projects", headers=auth)
        if projects.status_code != 200 or not projects.json():
            print("SKIP: need at least one project for search smoke", file=sys.stderr)
            return 0
        pid = projects.json()[0]["id"]
        r = client.get(
            f"/api/v1/projects/{pid}/search",
            params={"q": "the", "mode": "fts"},
            headers=auth,
        )
        if r.status_code != 200:
            print("FAIL fts search", r.status_code, r.text[:300], file=sys.stderr)
            return 1
        body = r.json()
        print("fts_search_ok", {"hits": len(body.get("hits", [])), "mode": body.get("mode")})

        if settings.openai_api_key:
            pr = client.post(
                "/api/v1/ai/paste-analyze",
                headers={**auth, "Content-Type": "application/json"},
                json={
                    "project_id": pid,
                    "pasted_text": "Fragment A\n\n---\n\nFragment B",
                },
            )
            if pr.status_code != 200:
                print("NOTE paste-analyze", pr.status_code, pr.text[:200], file=sys.stderr)
            else:
                print("paste_analyze_ok", {"review_item_id": pr.json().get("review_item_id")})
        else:
            print("SKIP paste-analyze (no OPENAI_API_KEY)")

    print("OK gate5 smoke")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
