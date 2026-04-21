# Environment configuration

This document describes the canonical environment files for Tooth as implemented today. It does not invent secrets or provider accounts; it records where configuration lives and which variables the code loads.

## Canonical runtime files

| Surface | Canonical file | Loaded by |
| --- | --- | --- |
| Backend API | `backend/.env` | `backend/app/config.py` (`Settings`, pydantic-settings) |
| Frontend dev server | `frontend/.env` | Vite (`VITE_*` only) |

`scripts/dev_backend.sh` and `scripts/dev_frontend.sh` copy `.env.example` to `.env` when `.env` is missing.

Backend settings always read `backend/.env` via an absolute path derived from `backend/app/config.py`, so changing the shell current working directory does not change which file is loaded.

## Backend variables (current `Settings`)

All backend keys are plain environment variables (case-insensitive names accepted by pydantic-settings). The authoritative list is `backend/app/config.py` and `backend/.env.example`.

Phase 4 uses the same names as the OpenAI Python SDK for the base client: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_DEFAULT_MODEL`. The API also reads `OPENAI_CHEAP_MODEL`, `OPENAI_EXPENSIVE_MODEL`, and bounded-context settings `AI_MAX_CONTEXT_CHARS`, `AI_MAX_USER_MESSAGE_CHARS`, `AI_MAX_CHEAP_ROUNDS` (see `backend/app/config.py` and `backend/.env.example`). `OPENAI_API_KEY` is required for `/api/v1/ai/assist` to return 200; without it the endpoint responds with 503. The API client retries with `max_completion_tokens` when the provider rejects `max_tokens` (model-dependent).

Phase 5 adds project-scoped `GET /api/v1/projects/{id}/search` (FTS always; semantic/hybrid require embeddings via the same API key). Raw texts store a bounded `search_text` mirror for PostgreSQL FTS and optional `embedding_json` for similarity. Paste ingest uses `POST /api/v1/ai/paste-analyze` and explicit `POST /api/v1/ingest-review/{id}/accept` to create raw texts — never silent writes. Relevant settings: `OPENAI_EMBEDDING_MODEL`, `EMBEDDING_MAX_CHARS`, `SEARCH_MAX_RESULTS`, `SEMANTIC_SCAN_MAX_RAW_TEXTS`, `PASTE_MAX_CHARS` (see `backend/app/config.py`).

Phase 6 adds books, outline nodes, and assignments linking outline sections to raw texts. Markdown export is read-only over stored files. Phase 4 AI assist can optionally merge bounded FTS snippets when `use_retrieval` is true: `AI_RETRIEVAL_EXCERPT_CHARS`, `AI_RETRIEVAL_MAX_HITS` (see `backend/app/config.py`).

## Frontend variables

Only `VITE_API_PROXY_TARGET` is used (see `frontend/vite.config.ts`). The browser calls relative `/api/...`; the dev server proxies `/api` to this target.

## Ubuntu: where to put the real API key

Edit `backend/.env` on the server (same path as in the deployment checkout). Do not commit that file.

After changing `backend/.env`, restart the backend process so settings reload (settings are cached in-process). If you use systemd, restart the unit that runs `uvicorn`, for example:

`sudo systemctl restart <your-tooth-backend-unit>`

An example unit file is `infra/tooth-backend.service.example`; copy and edit paths before use.

Replace `<your-tooth-backend-unit>` with the actual unit name on that host.
