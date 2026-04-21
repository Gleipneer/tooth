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

## Frontend plan reconciliation (zip plans vs repo truth)

- [x] Located and extracted provided frontend plan zips (`tooth_frontend_plan.zip`, `tooth_frontend_plan_v2.zip`)
- [x] Reconciled zip plans against repo docs, live backend/API surfaces, and current frontend/runtime behavior
- [x] Produced reconciliation doc at `docs/40_FRONTEND_PLAN_RECONCILIATION.md`
- [x] Produced canonical execution design at `docs/41_FRONTEND_EXECUTION_MASTER_PLAN.md`
- [x] Produced open questions/risks at `docs/42_FRONTEND_OPEN_QUESTIONS_AND_RISKS.md`

## Frontend implementation preflight (next run before coding)

- [x] Create `docs/17_BACKEND_API_CONTRACTS.md` from live backend router/schema code
- [x] Create `docs/18_DATABASE_SCHEMA_AND_STORAGE_MODEL.md` from models/storage code
- [x] Lock route map, shell shape, and query/state strategy decisions in code structure (per `docs/41` and locked decisions)
- [x] Confirm first implementation tranche scope and implement scaffold only (Shell+Routing+State+editor boundary+draft-integrated chat placement)

## Frontend foundation lock-in (current run)

- [x] Introduce route skeleton and app shell scaffold (`frontend/src/routes`, `frontend/src/layout`)
- [x] Wire TanStack Query provider at app root (`frontend/src/app/AppProviders.tsx`)
- [x] Add editor boundary/adapter with textarea baseline (`frontend/src/editor/*`)
- [x] Add draft-integrated split-view chat route scaffold (`/projects/:projectId/drafts/:draftId`)
- [x] Preserve existing monolithic workspace as temporary legacy route (`/legacy`) to avoid over-scoped rebuild in this run
- [ ] Next tranche: migrate auth/projects/raw/draft flows from legacy page into route-native pages behind the new shell

## Frontend completion pass (route-native usability)

- [x] Replace scaffold routing with authenticated route-native shell and persistent navigation
- [x] Implement session provider with login persistence and recovery to `/auth`
- [x] Implement real workspace route for project/raw/draft creation and selection
- [x] Keep draft editing/version/branch/freeze/unfreeze flows functional inside route-native workspace
- [x] Keep draft-integrated chat model in the writing workspace (editor + AI panel in same draft context)
- [x] Implement project-scoped Search, Ingest, and Books screens with route navigation
- [x] Add raw text file import in workspace (`/projects` flow)
- [x] Improve books assignment readability (titles instead of truncated IDs)
- [x] Verify frontend tests/build and backend compatibility
- [x] Verify runtime binding truth (`tooth status`: frontend API target == backend URL)

## Final visual/manual QA and release-readiness verification

- [x] Run live browser walkthrough across auth, workspace, drafts/versioning, AI assist, search, ingest, and books flows
- [x] Verify responsive sanity in narrow/mobile and wider desktop viewport sizes
- [x] Fix small route-state regressions found during manual QA (`/auth` redirect when already signed in; draft selection from route/query state)
- [x] Re-run frontend test/build and backend compatibility tests after QA fixes

## Writing-first UX correction (AI Pages pivot)

- [x] Re-anchor primary `/projects` flow around writing-first pages + canvas + attached AI, while preserving raw/draft/version backend truth
- [x] Implement safe auto-draft creation when opening a page with no draft
- [x] Add obvious entry points for new page, paste/import text, and continue writing
- [x] Reposition navigation language toward writer mental model (`Pages`, `Fragments`, `Books`)
- [x] Follow-up tranche: reduce secondary form friction in `Ingest` and `Books` screens to match writing-first shell quality

## Writing-first consistency pass (Ingest + Books + Search)

- [x] Reframe Ingest language and actions around writer decisions (bring text, stage, keep/discard/later)
- [x] Route accepted ingest output directly back into Pages Studio writing context
- [x] Reframe Books around manuscript shaping language and add clearer structure + assignment readability
- [x] Reframe Search language toward resurfacing writing and opening editor context
- [x] Ensure raw-only deep links auto-resolve working draft in Pages Studio
- [x] Verify live browser flows for Ingest -> Pages, Books readability, Search -> Pages, and cross-route coherence
- [x] Re-run frontend tests/build after consistency pass

## Writer Mode reset (new primary experience)

- [x] Add new primary route `/write` and make it default post-auth landing
- [x] Implement Writer Mode 3-column layout (light nav + editor + attached AI)
- [x] Keep raw/draft/version truth under the hood with automatic working-draft resolution
- [x] Add first-use empty state actions (`Start writing`, `Paste text`, `Import file`)
- [x] Add first-project creation directly in Writer Mode to avoid first-use dead-end
- [x] Demote previous `/projects` studio into secondary advanced route
- [x] Rewire Search/Ingest return links to Writer Mode context (`/write?project=...&raw=...`)
- [x] Run browser proof for sign-in landing, new-page writing, pasted-page writing, and attached AI flow
- [x] Re-run frontend tests/build after Writer Mode implementation

## Deferred (explicit per `docs/03_PHASED_MASTER_PLAN.md`)

- Multi-user, offline sync, advanced import/export formats, graph narrative tools, public sharing.
