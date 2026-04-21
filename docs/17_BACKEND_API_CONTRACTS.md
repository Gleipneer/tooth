# Backend API Contracts

Code-derived from `backend/app/main.py`, `backend/app/api.py`, `backend/app/api_ai.py`, `backend/app/api_search.py`, `backend/app/api_ingest.py`, `backend/app/api_book.py`, and `backend/app/schemas.py`.

Base prefix: `/api/v1`

## Auth and Health

- `GET /healthz`
  - Auth: none
  - Request: none
  - Response: `HealthResponse { status, app_name }`
  - Errors: `503` when DB unavailable

- `POST /auth/signup`
  - Auth: none
  - Request: `SignupRequest { email, password(min 8, max 200) }`
  - Response: `201 UserResponse { id, email, is_active }`
  - Errors: `409` duplicate email, `503` DB unavailable

- `POST /auth/login`
  - Auth: none
  - Request: `LoginRequest { email, password(min 8) }`
  - Response: `TokenResponse { access_token, token_type }`
  - Errors: `401` invalid credentials, `503` DB unavailable

- `GET /auth/me`
  - Auth: bearer token
  - Request: none
  - Response: `UserResponse { id, email, is_active }`

## Projects

- `GET /projects`
  - Auth: bearer token
  - Response: `ProjectResponse[] { id, name, description, archived, created_at }`

- `POST /projects`
  - Auth: bearer token
  - Request: `ProjectCreate { name(1..200), description? }`
  - Response: `201 ProjectResponse`

- `GET /projects/{project_id}`
  - Auth: bearer token
  - Response: `ProjectResponse`
  - Errors: `404` not found / not owned

## Raw Texts

- `POST /projects/{project_id}/rawtexts`
  - Auth: bearer token
  - Request: `RawTextCreate { title, content, media_type?, origin? }`
  - Response: `201 RawTextImportResponse { id, title, media_type, origin, archived, created_at, content }`

- `GET /projects/{project_id}/rawtexts`
  - Auth: bearer token
  - Response: `RawTextListItem[] { id, title, media_type, origin, archived, created_at }`

- `POST /projects/{project_id}/rawtexts/import`
  - Auth: bearer token
  - Request: multipart file upload (`text/plain`, `text/markdown`, `text/x-markdown`)
  - Response: `201 RawTextImportResponse`
  - Errors: `400` unsupported file type

- `GET /rawtexts/{raw_text_id}`
  - Auth: bearer token
  - Response: `RawTextImportResponse`
  - Errors: `404` not found / not owned

## Drafts, Versions, Branching

- `GET /projects/{project_id}/drafts`
  - Auth: bearer token
  - Query: `raw_text_id?`
  - Response: `DraftListItem[] { id, raw_text_id, parent_draft_id, title, branch_name, status, archived, created_at }`

- `POST /rawtexts/{raw_text_id}/drafts`
  - Auth: bearer token
  - Request: `DraftCreate { title, branch_name? }`
  - Response: `201 DraftResponse { ...DraftListItem, content }`

- `GET /drafts/{draft_id}`
  - Auth: bearer token
  - Response: `DraftResponse`

- `GET /drafts/{draft_id}/versions`
  - Auth: bearer token
  - Response: `DraftListItem[]` (same branch/raw_text lineage)

- `POST /drafts/{draft_id}/save_version`
  - Auth: bearer token
  - Request: `DraftVersionCreate { content, title? }`
  - Response: `201 DraftResponse` (new draft version)
  - Errors: `409` when draft is frozen

- `POST /drafts/{draft_id}/branch`
  - Auth: bearer token
  - Request: `DraftBranchCreate { title, branch_name, content? }`
  - Response: `201 DraftResponse` (new branch draft)

- `POST /drafts/{draft_id}/freeze`
  - Auth: bearer token
  - Response: `DraftResponse` (status becomes `frozen`)

- `POST /drafts/{draft_id}/unfreeze`
  - Auth: bearer token
  - Response: `DraftResponse` (status becomes `in_progress`)

- `GET /drafts/{draft_id}/diff`
  - Auth: bearer token
  - Response: `DraftDiffResponse { draft_id, parent_draft_id, baseline_type, diff }`

## AI Assist

- `POST /ai/assist`
  - Auth: bearer token
  - Request: `AIAssistRequest { project_id, draft_id?, message, use_retrieval, retrieval_query? }`
  - Response: `AIAssistResponse { operation_id, task_class, route_final, escalated, cheap_rounds, planner_reason?, context_bundle, suggestions[], confidence, token_usage }`
  - Errors: `503` AI not configured, `400` draft/project mismatch, `502` provider failure

- `GET /ai/operations`
  - Auth: bearer token
  - Query: `project_id`, `limit(1..200, default 50)`
  - Response: `AIOperationListItem[]`

## Search

- `GET /projects/{project_id}/search`
  - Auth: bearer token
  - Query: `q(1..500)`, `mode=fts|semantic|hybrid`
  - Response: `SearchResponse { query, mode, hits: SearchHit[], meta }`
  - Notes:
    - FTS works without AI key.
    - semantic/hybrid require `OPENAI_API_KEY`.
  - Errors: `503` for semantic/hybrid when AI key missing

## Ingest Review

- `POST /ai/paste-analyze`
  - Auth: bearer token
  - Request: `PasteAnalyzeRequest { project_id, pasted_text(max 50000) }`
  - Response: `PasteAnalyzeResponse { operation_id, review_item_id, analysis, token_usage }`
  - Errors: `400` oversized payload, `503` AI not configured, `502` provider failure

- `GET /projects/{project_id}/ingest-candidates`
  - Auth: bearer token
  - Response: `IngestReviewListItem[] { id, project_id, status, created_at, updated_at }`

- `POST /ingest-review/{item_id}/accept`
  - Auth: bearer token
  - Request: none
  - Response: `IngestAcceptResponse { review_item_id, created_raw_text_ids[], status }`
  - Notes: creates raw texts only from whitelisted `create_raw_text` / `create_many_raw_texts` intents in staged analysis.

- `POST /ingest-review/{item_id}/reject`
  - Auth: bearer token
  - Request: none
  - Response: `IngestReviewListItem` (status `rejected`)

- `POST /ingest-review/{item_id}/defer`
  - Auth: bearer token
  - Request: none
  - Response: `IngestReviewListItem` (status `deferred`)

## Books and Export

- `POST /projects/{project_id}/books`
  - Auth: bearer token
  - Request: `BookCreate { title }`
  - Response: `201 BookResponse { id, project_id, title, archived, created_at }`

- `GET /projects/{project_id}/books`
  - Auth: bearer token
  - Response: `BookResponse[]`

- `POST /books/{book_id}/nodes`
  - Auth: bearer token
  - Request: `OutlineNodeCreate { title, parent_id?, sort_order }`
  - Response: `201 OutlineNodeResponse { id, book_id, parent_id, title, sort_order, created_at }`
  - Errors: `400` parent not in book

- `GET /books/{book_id}/nodes`
  - Auth: bearer token
  - Response: `OutlineNodeResponse[]`

- `POST /books/{book_id}/assignments`
  - Auth: bearer token
  - Request: `BookAssignmentCreate { outline_node_id, raw_text_id, sort_order }`
  - Response: `201 BookAssignmentResponse { id, book_id, outline_node_id, raw_text_id, sort_order, created_at }`
  - Errors: `400` node/book mismatch or raw_text project mismatch, `404` raw_text not found

- `GET /books/{book_id}/assignments`
  - Auth: bearer token
  - Response: `BookAssignmentResponse[]`

- `GET /books/{book_id}/export`
  - Auth: bearer token
  - Response: markdown attachment (`text/markdown; charset=utf-8`)

- `GET /books/{book_id}/toc`
  - Auth: bearer token
  - Response: `BookTocResponse { book_id, title, entries }`
