# System capabilities and usage (current repo state)

This document describes what Tooth currently does in this repository, based on implemented code and scripts.

## What Tooth is today

Tooth is a single-user writing system with:

- a FastAPI backend (`backend/app/main.py`)
- a React/Vite web app (`frontend/src/App.tsx`)
- filesystem text storage for raw texts/drafts (`backend/app/storage.py`)
- PostgreSQL metadata and relations (models + migrations in `backend/app/models.py` and `backend/migrations/`)
- an operator CLI (`scripts/tooth`) and operator status web surface (`ops/operator.html`)

## Interfaces that currently exist

- **User web UI:** yes, the React app (`frontend/src/App.tsx`)
- **Operator web UI:** yes, served by `scripts/operator_server.py` and backed by `data/runtime/state.json`
- **Operator CLI:** yes, `scripts/tooth` (installable with `scripts/install_tooth_cli.sh`)
- **Backend API:** yes, under `/api/v1` via routers in `backend/app/main.py`

## What users can do in the current web app

From the signed-in workspace (`frontend/src/App.tsx`), users can:

- create an account with email + password from the auth form
- log in (bootstrap user is created on backend startup)
- create and list projects
- create/import raw texts
- create drafts from raw texts
- save draft versions, branch drafts, freeze/unfreeze drafts
- inspect draft history and diffs
- run AI assist and inspect routing/context/token metadata
- run project search (`fts`, `semantic`, `hybrid`)
- paste text for AI analysis, then accept/reject/defer staged ingest items
- create books, add outline nodes, assign raw texts, and download Markdown export

## CLI/operator capabilities that currently exist

The `tooth` CLI supports:

- `tooth` or `tooth start`
- `tooth status`
- `tooth stop`
- `tooth restart`
- `tooth logs`
- `tooth doctor`
- `tooth tui`

Current behavior:

- starts backend, frontend, and operator web server
- chooses ports with bounded fallback when defaults are occupied
- writes runtime state to `data/runtime/state.json`
- reports live status using PID + HTTP probes
- exposes recent process logs
- checks local prerequisites and whether `OPENAI_API_KEY` is configured (without printing secrets)

## AI layer behavior right now

Implemented in `backend/app/api_ai.py` and `backend/app/ai/orchestrator.py`:

- AI assist endpoint: `POST /api/v1/ai/assist`
- operations history endpoint: `GET /api/v1/ai/operations`
- cheap-first routing with optional escalation
- bounded context assembly and inspectable context bundle
- optional retrieval snippets when `use_retrieval=true`
- explicit non-auto-write UX in frontend (`AIAssistPanel`): copy/ignore, no silent application

If `OPENAI_API_KEY` is missing, assist returns 503.

## Search/retrieval behavior right now

Implemented in `backend/app/api_search.py` + retrieval modules:

- endpoint: `GET /api/v1/projects/{project_id}/search`
- modes: `fts`, `semantic`, `hybrid`
- semantic/hybrid require configured OpenAI key
- responses include rank metadata; frontend displays mode, scores, and meta

## Paste staging/review behavior right now

Implemented in `backend/app/api_ingest.py` + `frontend/src/components/PasteIngestPanel.tsx`:

- analyze endpoint: `POST /api/v1/ai/paste-analyze`
- candidate listing: `GET /api/v1/projects/{project_id}/ingest-candidates`
- review actions: accept/reject/defer endpoints
- raw texts are created only on explicit accept and only from whitelisted `create_`* intents
- no silent canonical writes

## Book/outline/export behavior right now

Implemented in `backend/app/api_book.py` and `backend/app/book_export.py`:

- create/list books per project
- create/list outline nodes
- create/list assignments from outline node to raw text
- book TOC endpoint
- Markdown export endpoint (`/books/{book_id}/export`) used by `BooksPanel`

Export is read-only over source objects (does not mutate raw text/drafts).

## Backend/frontend startup behavior currently implemented

- Dev scripts:
  - `scripts/dev_backend.sh` (venv + deps + migrations + uvicorn --reload)
  - `scripts/dev_frontend.sh` (npm install + vite dev)
- Operator startup:
  - `scripts/tooth start` launches backend/frontend/operator together and writes runtime manifest

## API groups currently present

Routers included in `backend/app/main.py`:

- core/auth/project/rawtext/draft routes (`backend/app/api.py`)
- AI routes (`backend/app/api_ai.py`)
- search routes (`backend/app/api_search.py`)
- ingest review routes (`backend/app/api_ingest.py`)
- book/export routes (`backend/app/api_book.py`)

## Deferred / not implemented in this repo state

Per current canonical docs (`docs/00_IMPLEMENTATION_ENTRYPOINT.md`, `tasks/todo.md`):

- multi-user collaboration
- offline sync
- advanced import/export formats (for example EPUB/PDF)
- archive-wide AI analysis/graph features
- public sharing/social layers

These are not documented here as active capabilities.