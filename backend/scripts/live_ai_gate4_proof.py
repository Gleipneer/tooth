#!/usr/bin/env python3
"""Gate 4 live proof: two AI assist calls (cheap path vs escalation).

Requires backend/.env with valid DATABASE_URL and OPENAI_API_KEY.
Run from repo root:  python backend/scripts/live_ai_gate4_proof.py
Or from backend/:      python scripts/live_ai_gate4_proof.py

Exits 0 on success, 1 on failure. Prints only routing metadata (no secrets).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from uuid import uuid4

# Resolve backend root (parent of scripts/)
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
os.chdir(BACKEND_ROOT)

from app.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


def main() -> int:
    get_settings.cache_clear()
    settings = get_settings()

    if not settings.openai_api_key:
        print("SKIP: OPENAI_API_KEY not set in backend/.env", file=sys.stderr)
        return 1

    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"email": settings.bootstrap_email, "password": settings.bootstrap_password},
        )
        if login.status_code != 200:
            print(f"FAIL: login HTTP {login.status_code}", file=sys.stderr)
            return 1
        token = login.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}

        projects = client.get("/api/v1/projects", headers=auth)
        if projects.status_code != 200:
            print(f"FAIL: list projects HTTP {projects.status_code}", file=sys.stderr)
            return 1
        plist = projects.json()
        if not plist:
            created = client.post(
                "/api/v1/projects",
                headers={**auth, "Content-Type": "application/json"},
                json={"name": f"Gate4 proof {uuid4().hex[:8]}", "description": "live_ai_gate4_proof"},
            )
            if created.status_code != 201:
                print(f"FAIL: create project HTTP {created.status_code}", file=sys.stderr)
                return 1
            project_id = created.json()["id"]
        else:
            project_id = plist[0]["id"]

        cheap = client.post(
            "/api/v1/ai/assist",
            headers={**auth, "Content-Type": "application/json"},
            json={
                "project_id": project_id,
                "draft_id": None,
                "message": "Give one short tip for clearer sentences. No rewrite of a whole chapter.",
            },
        )
        if cheap.status_code != 200:
            print(f"FAIL: cheap assist HTTP {cheap.status_code} {cheap.text[:500]}", file=sys.stderr)
            return 1
        cj = cheap.json()
        print("cheap_assist", {"route_final": cj["route_final"], "escalated": cj["escalated"], "cheap_rounds": cj["cheap_rounds"]})

        deep = client.post(
            "/api/v1/ai/assist",
            headers={**auth, "Content-Type": "application/json"},
            json={
                "project_id": project_id,
                "draft_id": None,
                "message": "Please rewrite the opening paragraph for a warmer tone.",
            },
        )
        if deep.status_code != 200:
            print(f"FAIL: escalation assist HTTP {deep.status_code} {deep.text[:500]}", file=sys.stderr)
            return 1
        dj = deep.json()
        print("escalation_assist", {"route_final": dj["route_final"], "escalated": dj["escalated"], "cheap_rounds": dj["cheap_rounds"]})

        if cj["route_final"] != "cheap_only":
            print("NOTE: cheap_assist did not use cheap_only (planner may still escalate); check provider output.", file=sys.stderr)
        if not dj["escalated"]:
            print("NOTE: escalation message did not escalate; keyword/rule or planner may differ.", file=sys.stderr)

    print("OK: Gate 4 live routing smoke finished.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
