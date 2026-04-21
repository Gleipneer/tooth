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

## Deferred (explicit per `docs/03_PHASED_MASTER_PLAN.md`)

- Multi-user, offline sync, advanced import/export formats, graph narrative tools, public sharing.
