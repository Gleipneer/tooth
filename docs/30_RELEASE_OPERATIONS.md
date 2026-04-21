# Release operations (Ubuntu / single-node)

This document is retained for compatibility. Canonical operator flow now lives in `docs/30_UBUNTU_DEPLOYMENT_AND_OPERATIONS.md`.

## Scope

Use this file as a short companion to release-readiness checks; use the canonical Ubuntu ops runbook for day-to-day startup, status, and recovery.

## Process model

- **Backend:** FastAPI via Uvicorn, listening on a host/port you configure (often behind a reverse proxy).
- **Frontend:** Static assets built with `npm run build`; served by the reverse proxy or a static file server.
- **PostgreSQL:** Required; connection string in `backend/.env` as `DATABASE_URL` (or the equivalent `database_url` key loaded by pydantic-settings).

See `infra/tooth-backend.service.example` for a systemd unit template. Adjust `User`, `WorkingDirectory`, and `EnvironmentFile` to match your deployment checkout.

## Health

- **Liveness:** `GET /api/v1/healthz` on the API (no auth required).

Use this in load balancers or systemd `ExecStartPost` only if your orchestrator supports it; otherwise poll from monitoring.

## Configuration reload

Settings are loaded at process start. After changing `backend/.env`, restart the backend service so new values apply.

## Backup

- **Script:** `scripts/backup_local.sh` dumps the database and copies `data/raw` and `data/drafts` under `data/backups/<timestamp>/`.
- **Environment:** Set `DATABASE_URL` if your Postgres is not the default in the script.

## Restore drill

- **Script:** `scripts/restore_local.sh <backup-dir>` is a **rehearsal** helper used in development: it restores SQL into `tooth_restore` and copies raw/draft trees to `data/restore_check/`. Production restores should follow the same logical steps (restore DB + restore files) using your host’s admin procedures.

## Rollback

Rollback is **redeploy previous artifact + restore from backup**, not an in-app toggle. Keep at least one known-good backup before upgrades.

## Cost and heavy work

- AI endpoints require `OPENAI_API_KEY` for success responses; without it, assist returns 503 with a clear message.
- Search semantic/hybrid modes and embedding generation require the same key; FTS works without it.
- Bounded settings (`AI_MAX_*`, `SEARCH_MAX_RESULTS`, `PASTE_MAX_CHARS`, `ai_retrieval_*`) are documented in `docs/09_ENVIRONMENT.md` and `backend/app/config.py`.

## Gate proofs

- **Gate 6 (book/export):** `scripts/gate6_book_proof.sh` (runs automated tests for export determinism).
- **Gate 7 (ops/release):** `scripts/gate7_ops_proof.sh` (backup script dry-run + optional live health check when `TOOTH_API_BASE` is set).
