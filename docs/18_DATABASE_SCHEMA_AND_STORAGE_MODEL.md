# Database Schema and Storage Model

Code-derived from `backend/app/models.py`, `backend/app/storage.py`, `backend/app/db.py`, and current API usage.

## Storage model summary

- Hybrid storage:
  - Canonical text content in filesystem under `data/`
  - Metadata/relations in PostgreSQL
- DB configured by `DATABASE_URL` in `backend/.env` (`backend/app/config.py`).
- SQLAlchemy engine/session defined in `backend/app/db.py` (`SessionLocal`).

## Filesystem layout

- Root data directory: `Settings.data_dir` (default repo `data/`)
- TextStorage creates:
  - `data/raw/`
  - `data/drafts/`
  - `data/imports/`
- Write pattern (`TextStorage._atomic_write`):
  - writes temp file `.{uuid}.tmp`
  - atomic `os.replace` to `{uuid}.md`
- Relative path references persisted in DB:
  - raw texts: `raw/{uuid}.md`
  - drafts: `drafts/{uuid}.md`

## Table inventory

## `users`

- PK: `id` (UUID)
- Columns:
  - `email` (unique, indexed)
  - `password_hash`
  - `is_active`
  - `created_at`
- Relationships:
  - one-to-many `projects`

## `projects`

- PK: `id` (UUID)
- FK:
  - `owner_id -> users.id` (indexed)
- Columns:
  - `name`
  - `description` (nullable text)
  - `archived`
  - `created_at`
- Relationships:
  - many `raw_texts`
  - many `drafts`
  - many `ingest_review_items`
  - many `books`

## `raw_texts`

- PK: `id` (UUID)
- FK:
  - `project_id -> projects.id` (indexed)
- Columns:
  - `title`
  - `content_path` (unique; filesystem relative path)
  - `media_type`
  - `origin`
  - `archived`
  - `created_at`
  - `search_text` (nullable; bounded mirror for FTS)
  - `embedding_json` (nullable; serialized embedding vector)
  - `embedding_model` (nullable)
- Relationships:
  - many `drafts`

## `drafts`

- PK: `id` (UUID)
- FK:
  - `project_id -> projects.id` (indexed)
  - `raw_text_id -> raw_texts.id` (indexed)
  - `parent_draft_id -> drafts.id` (nullable, indexed)
- Columns:
  - `title`
  - `branch_name`
  - `status` (`in_progress` / `frozen` in current API flows)
  - `content_path` (unique; filesystem relative path)
  - `created_at`
  - `archived`
- Relationships:
  - self-referential parent relation (`parent_draft`)

## `ai_operations`

- PK: `id` (UUID)
- FK:
  - `user_id -> users.id` (indexed)
  - `project_id -> projects.id` (indexed)
  - `draft_id -> drafts.id` (nullable, indexed)
- Columns:
  - `task_class`
  - `route_final`
  - `escalated`
  - `cheap_rounds`
  - `models_used_json`
  - `token_usage_json`
  - `context_bundle_json`
  - `response_json`
  - `created_at`

## `ingest_review_items`

- PK: `id` (UUID)
- FK:
  - `project_id -> projects.id` (indexed)
  - `user_id -> users.id` (indexed)
  - `ai_operation_id -> ai_operations.id` (nullable)
- Columns:
  - `status` (`pending`, `accepted`, `rejected`, `deferred`)
  - `payload_json`
  - `created_at`
  - `updated_at`
- Purpose:
  - stores staged ingest decisions; raw texts are created only on explicit accept.

## `books`

- PK: `id` (UUID)
- FK:
  - `project_id -> projects.id` (indexed)
- Columns:
  - `title`
  - `archived`
  - `created_at`
- Relationships:
  - many `outline_nodes`
  - many `book_assignments`

## `outline_nodes`

- PK: `id` (UUID)
- FK:
  - `book_id -> books.id` (indexed)
  - `parent_id -> outline_nodes.id` (nullable, indexed)
- Columns:
  - `title`
  - `sort_order`
  - `created_at`
- Relationships:
  - self tree (`parent` / `children`)
  - many `book_assignments` via `slot_assignments`

## `book_assignments`

- PK: `id` (UUID)
- FK:
  - `book_id -> books.id` (indexed)
  - `outline_node_id -> outline_nodes.id` (indexed)
  - `raw_text_id -> raw_texts.id` (indexed)
- Columns:
  - `sort_order`
  - `created_at`
- Purpose:
  - links raw texts to outline nodes without mutating source files.

## Referential and behavior rules (current implementation)

- Ownership checks in dependencies (`get_project_for_user`, `get_book_for_user`, `get_draft_for_user`, `get_ingest_review_for_user`) enforce single-user project scoping.
- Raw text and draft content is read/written via filesystem paths from DB records.
- Export (`/books/{id}/export`) synthesizes markdown without mutating raw/draft files.
- Ingest accept path whitelists write-intent kinds before raw text creation.
