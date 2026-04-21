# Tooth Task Ledger

## Current objective

Repo-defined MVP **Phases 1–7** and **Gates 1–7** are satisfied for the **current slice**: foundation, first deployable vertical, editor/versioning, bounded AI chat with explicit apply, project-scoped search + paste ingest with staging, books/outline/export, and operational scripts plus release documentation.

## Execution checklist

- [x] Gates 1–4 (foundation + auth + drafts + AI assist discipline)
- [x] Gate 5: FTS + semantic/hybrid search, bounded retrieval, paste analyze + ingest review + explicit accept
- [x] Gate 6: books, outline nodes, assignments, deterministic Markdown export, UI (`BooksPanel`)
- [x] Gate 7: `docs/30_RELEASE_OPERATIONS.md`, systemd example, `scripts/gate7_ops_proof.sh`, backup/restore scripts documented
- [x] AI assist: optional `use_retrieval` + bounded FTS snippets (UI + API wiring)
- [x] README and `docs/09_ENVIRONMENT.md` aligned with implemented behavior

## Regression / preservation

- `backend/app/ai/openai_client.py` — `max_completion_tokens` retry unchanged.
- AI suggestions are not auto-applied; paste ingest requires explicit accept for raw text creation.
- Book export does not mutate raw files or draft content.

## Validation (last run — update when re-verifying)

- [x] `cd backend && ruff check app tests && pytest` (16 tests)
- [x] `cd frontend && npm test && npm run build`
- [x] `DATABASE_URL=postgresql+psycopg://tooth:tooth@127.0.0.1:55432/tooth alembic upgrade head` (after `scripts/start_local_postgres.sh`)
- [x] `bash scripts/gate6_book_proof.sh` (full backend ruff + pytest)
- [x] `bash scripts/gate7_ops_proof.sh` (backup script)
- [ ] Optional: `OPENAI_API_KEY` set — live `/api/v1/ai/assist` with `use_retrieval: true`
- [ ] Optional: `TOOTH_API_BASE=http://127.0.0.1:8000 bash scripts/gate7_ops_proof.sh` when API is up (health curl)

## Blockers

- None known for the documented MVP slice.

## Operator layer (current run)

- [x] `tooth` command lifecycle added (`start|status|stop|restart|logs|doctor|tui`)
- [x] Runtime state manifest and log surfaces under `data/runtime/`
- [x] Conflict-aware port selection with bounded fallback
- [x] Web operator surface with live state polling
- [x] Tailscale URL detection/display (best effort, non-secret)
- [x] Final proof pass for operator commands and conflict behavior

## Auth/bootstrap regression fix

- [x] Diagnosed login `500` root cause from backend runtime logs (DB auth failure on 127.0.0.1:5432)
- [x] Fixed backend startup path to ensure local Postgres + consistent local DB URL fallback
- [x] Verified bootstrap user exists and login/auth session succeed
- [x] Re-ran backend tests, frontend tests/build, and migration sanity

## Auth hardening (email + password accounts)

- [x] Added account creation endpoint (`POST /api/v1/auth/signup`) with duplicate email protection
- [x] Added minimal signup/signin toggle in UI and preserved authenticated workspace entry
- [x] Added local session token persistence in browser storage
- [x] Verified live signup, duplicate rejection, wrong-password rejection, login, and authenticated session

## Runtime/API binding truth hardening

- [x] Root-caused mismatch between default frontend proxy fallback (`127.0.0.1:8000`) and conflict-shifted Tooth backend ports
- [x] Added explicit frontend API target to runtime manifest (`urls.frontend_api_target`)
- [x] Updated `tooth status` output to print backend URL and frontend API target
- [x] Updated Vite proxy fallback to read backend URL from runtime state before legacy `8000` fallback
- [x] Re-validated live UI signup/login against runtime-reported backend URL

## Pre-frontend audit (truth pass)

- [x] Audited real frontend stack, structure, state model, styling strategy, runtime API binding behavior
- [x] Inventoried actual backend endpoint surface from router code and mapped frontend usage status
- [x] Produced canonical pre-frontend audit document at `docs/39_PRE_FRONTEND_AUDIT.md`
- [x] Recorded missing canonical docs (`docs/17_*`, `docs/18_*`) as governance/contract risk in audit

## Deferred (explicit per `docs/03_PHASED_MASTER_PLAN.md`)

- Multi-user, offline sync, advanced import/export formats, graph narrative tools, public sharing.
