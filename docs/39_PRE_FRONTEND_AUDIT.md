# Pre-Frontend Audit (Canonical)

This audit is implementation-truth only, based on current code in `frontend/src`, `backend/app`, runtime scripts, and current runtime manifest.

## Scope and evidence

- Scope: pre-frontend execution audit only (no redesign/polish work).
- Primary evidence:
  - `frontend/src/App.tsx`, `frontend/src/components/*`, `frontend/src/lib/api.ts`, `frontend/vite.config.ts`
  - `backend/app/main.py`, `backend/app/api*.py`, `backend/app/schemas.py`, `backend/app/models.py`
  - `scripts/tooth`, `scripts/lib/tooth_common.sh`, `scripts/operator_server.py`, `ops/operator.html`, `data/runtime/state.json`
- Canonical doc gap discovered:
  - `docs/17_BACKEND_API_CONTRACTS.md` is missing.
  - `docs/18_DATABASE_SCHEMA_AND_STORAGE_MODEL.md` is missing.
  - This is now a governance risk; this file acts as the current canonical frontend-facing contract snapshot.

## 1) Current frontend reality

### Stack

- React 18 + TypeScript + Vite (`frontend/vite.config.ts`).
- Vitest for frontend tests.
- No external query/state/cache library (no React Query, Zustand, Redux).
- Plain CSS in a single stylesheet (`frontend/src/styles.css`).

### App structure

- Single root component (`App.tsx`) with all workflow state lifted to top-level.
- Panel composition under one page shell:
  - `ProjectsPanel`
  - `RawTextsPanel`
  - `DraftsPanel`
  - `DetailPanels`
  - `AIAssistPanel`
  - `SearchPanel`
  - `PasteIngestPanel`
  - `BooksPanel`
- No route segmentation; no URL-based workspace state.

### Routes/views/panels

- Browser route: single view (`/`) in SPA dev mode.
- In-app UI flow:
  - Unauthenticated: `LoginForm` (sign in/sign up toggle).
  - Authenticated: stacked panel workspace with all major surfaces in one long page.

### State management pattern

- `useState` + `useEffect` + `useCallback` only.
- Request lifecycle managed manually per feature (pending/error/result state variables).
- Cross-panel coupling via parent state in `App.tsx`.
- Token persistence via `localStorage` key `tooth_access_token`.

### Styling strategy

- One global stylesheet (`styles.css`) with utility-like class names and panel-level classes.
- No design token system, no CSS module boundary, no theme system.
- Layout mostly one-column stacked cards with simple responsive detail grid.

### API client strategy

- Centralized fetch wrapper in `frontend/src/lib/api.ts`.
- Relative API prefix `"/api/v1"` for browser calls.
- Vite dev proxy handles backend host/port.
- Error normalization through `readErrorMessage`.
- Contract typing exists but some endpoints are defined without current UI usage.

### Auth/session flow

- Sign up: `POST /api/v1/auth/signup` then immediate sign-in.
- Sign in: `POST /api/v1/auth/login`.
- Session check: `GET /api/v1/auth/me`.
- Token stored in `localStorage`; cleared on sign out.
- App boot attempts `fetchMe` + `listProjects`; failure clears user state but does not always clear token automatically.

### Runtime base URL / backend URL behavior

- `tooth start` sets `VITE_API_PROXY_TARGET` to selected backend port.
- Runtime manifest now includes:
  - `urls.backend`
  - `urls.frontend_api_target`
- `tooth status` prints backend URL and frontend API target.
- `vite.config.ts` fallback order:
  1. `VITE_API_PROXY_TARGET`
  2. `data/runtime/state.json` -> `urls.backend`
  3. legacy fallback `http://127.0.0.1:8000`
- Current live state confirms backend/frontend/operator split ports in `data/runtime/state.json`.

### Known frontend weaknesses/regressions

- No route map; deep-link and browser history are effectively absent.
- `App.tsx` is overgrown and highly coupled (auth, projects, raw texts, drafts, versions, books, ingest, search, AI all orchestrated in one component).
- Manual fetch orchestration repeated across panels and `App.tsx` effects.
- Error/loading/empty handling quality varies by panel and action.
- Long stacked UX creates cognitive overload; critical user flow boundaries are weak.
- Legacy fallback to `:8000` still exists if manifest is absent and env not set (lower risk now, not zero risk).

## 2) Backend contract inventory (actual current API surface)

Status key:

- `used` = actively called by current frontend
- `partially used` = related surface used, but endpoint/feature path not represented in UI
- `unused` = implemented but not called by frontend
- `miswired / risky` = callable but currently carries notable runtime/UX risk

### Auth/core

- `GET /api/v1/healthz`
  - Request: none
  - Response: `{ status, app_name }`
  - Frontend status: `used` (`HealthPanel`)
- `POST /api/v1/auth/signup`
  - Request: `{ email, password(min 8) }`
  - Response: `{ id, email, is_active }`
  - Frontend status: `used` (`LoginForm`)
- `POST /api/v1/auth/login`
  - Request: `{ email, password(min 8) }`
  - Response: `{ access_token, token_type }`
  - Frontend status: `used`
- `GET /api/v1/auth/me`
  - Request: bearer token
  - Response: `{ id, email, is_active }`
  - Frontend status: `used`

### Projects

- `GET /api/v1/projects`
  - Request: bearer token
  - Response: `ProjectResponse[]`
  - Frontend status: `used`
- `POST /api/v1/projects`
  - Request: `{ name, description? }`
  - Response: `ProjectResponse`
  - Frontend status: `used`
- `GET /api/v1/projects/{project_id}`
  - Request: bearer token
  - Response: `ProjectResponse`
  - Frontend status: `unused` (client function exists, no panel call)

### Raw texts

- `POST /api/v1/projects/{project_id}/rawtexts`
  - Request: `{ title, content, media_type?, origin? }`
  - Response: raw text with inline `content`
  - Frontend status: `used`
- `GET /api/v1/projects/{project_id}/rawtexts`
  - Request: bearer token
  - Response: `RawTextListItem[]`
  - Frontend status: `used`
- `POST /api/v1/projects/{project_id}/rawtexts/import`
  - Request: multipart file (`text/plain|text/markdown`)
  - Response: raw text with inline `content`
  - Frontend status: `unused` (API client function exists, UI has no file-import form)
- `GET /api/v1/rawtexts/{raw_text_id}`
  - Request: bearer token
  - Response: raw text with inline `content`
  - Frontend status: `used`

### Draft/version/branch/freeze

- `GET /api/v1/projects/{project_id}/drafts?raw_text_id=...`
  - Request: bearer token + optional filter
  - Response: `DraftListItem[]`
  - Frontend status: `used`
- `POST /api/v1/rawtexts/{raw_text_id}/drafts`
  - Request: `{ title, branch_name? }`
  - Response: `DraftResponse` (with `content`)
  - Frontend status: `used`
- `GET /api/v1/drafts/{draft_id}`
  - Request: bearer token
  - Response: `DraftResponse`
  - Frontend status: `used`
- `GET /api/v1/drafts/{draft_id}/versions`
  - Request: bearer token
  - Response: `DraftListItem[]`
  - Frontend status: `used`
- `POST /api/v1/drafts/{draft_id}/save_version`
  - Request: `{ content, title? }`
  - Response: new `DraftResponse`
  - Frontend status: `used`
- `POST /api/v1/drafts/{draft_id}/branch`
  - Request: `{ title, branch_name, content? }`
  - Response: `DraftResponse`
  - Frontend status: `used`
- `POST /api/v1/drafts/{draft_id}/freeze`
  - Request: none
  - Response: `DraftResponse`
  - Frontend status: `used`
- `POST /api/v1/drafts/{draft_id}/unfreeze`
  - Request: none
  - Response: `DraftResponse`
  - Frontend status: `used`
- `GET /api/v1/drafts/{draft_id}/diff`
  - Request: bearer token
  - Response: `{ draft_id, parent_draft_id, baseline_type, diff }`
  - Frontend status: `used`

### AI

- `POST /api/v1/ai/assist`
  - Request: `{ project_id, draft_id?, message, use_retrieval, retrieval_query? }`
  - Response: operation/routing metadata + context bundle + suggestions + token usage
  - Frontend status: `used`
- `GET /api/v1/ai/operations?project_id=...&limit=...`
  - Request: bearer token
  - Response: operation list
  - Frontend status: `used`

### Search

- `GET /api/v1/projects/{project_id}/search?q=...&mode=fts|semantic|hybrid`
  - Request: bearer token
  - Response: `{ query, mode, hits[], meta }`
  - Frontend status: `used`

### Ingest/review

- `POST /api/v1/ai/paste-analyze`
  - Request: `{ project_id, pasted_text }`
  - Response: `{ operation_id, review_item_id, analysis, token_usage }`
  - Frontend status: `used`
- `GET /api/v1/projects/{project_id}/ingest-candidates`
  - Request: bearer token
  - Response: `IngestReviewListItem[]`
  - Frontend status: `used`
- `POST /api/v1/ingest-review/{item_id}/accept`
  - Request: none
  - Response: `{ review_item_id, created_raw_text_ids[], status }`
  - Frontend status: `used`
- `POST /api/v1/ingest-review/{item_id}/reject`
  - Request: none
  - Response: `IngestReviewListItem`
  - Frontend status: `used`
- `POST /api/v1/ingest-review/{item_id}/defer`
  - Request: none
  - Response: `IngestReviewListItem`
  - Frontend status: `used`

### Books/outline/export

- `POST /api/v1/projects/{project_id}/books`
  - Request: `{ title }`
  - Response: `BookResponse`
  - Frontend status: `used`
- `GET /api/v1/projects/{project_id}/books`
  - Request: bearer token
  - Response: `BookResponse[]`
  - Frontend status: `used`
- `POST /api/v1/books/{book_id}/nodes`
  - Request: `{ title, parent_id?, sort_order }`
  - Response: `OutlineNodeResponse`
  - Frontend status: `used` (only top-level creation in UI)
- `GET /api/v1/books/{book_id}/nodes`
  - Request: bearer token
  - Response: `OutlineNodeResponse[]`
  - Frontend status: `used`
- `POST /api/v1/books/{book_id}/assignments`
  - Request: `{ outline_node_id, raw_text_id, sort_order }`
  - Response: `BookAssignmentResponse`
  - Frontend status: `used`
- `GET /api/v1/books/{book_id}/assignments`
  - Request: bearer token
  - Response: `BookAssignmentResponse[]`
  - Frontend status: `used`
- `GET /api/v1/books/{book_id}/export`
  - Request: bearer token
  - Response: markdown download (`text/markdown`)
  - Frontend status: `used`
- `GET /api/v1/books/{book_id}/toc`
  - Request: bearer token
  - Response: TOC entries
  - Frontend status: `unused` (no frontend client for TOC endpoint)

### Operator/runtime (frontend-adjacent)

- `GET /api/state` (operator server, not FastAPI API prefix)
  - Request: none
  - Response: runtime manifest + live probes
  - Frontend status: `unused` by main app, `used` by `ops/operator.html`
- `tooth status` output + `data/runtime/state.json`
  - Frontend status: `miswired / risky` if frontend is started outside `tooth` lifecycle and without explicit proxy target.

## 3) Domain object map for UI

- Project
  - User needs: name, description, created date, selection context.
  - User actions: list, create, select.
  - UI home: `ProjectsPanel`.
- Raw text
  - User needs: title, origin, media type, immutable content view.
  - User actions: create (manual), list, select, inspect.
  - UI home: `RawTextsPanel` + raw section in `DetailPanels`.
- Draft
  - User needs: title, branch, status, full content, relation to raw text.
  - User actions: create, select, edit working content, save version.
  - UI home: `DraftsPanel` + draft section in `DetailPanels`.
- Version
  - User needs: version list order, status, diff baseline.
  - User actions: inspect versions, switch selected version, view diff.
  - UI home: `DetailPanels`.
- AI operation
  - User needs: route/escalation/trust metadata, context bundle, token usage, suggestions.
  - User actions: run assist, inspect result/history, copy/ignore suggestions.
  - UI home: `AIAssistPanel`.
- Staged ingest item
  - User needs: pending status, structured analysis payload, provenance.
  - User actions: analyze paste, accept, reject, defer.
  - UI home: `PasteIngestPanel`.
- Book
  - User needs: title, project scope, selected book context.
  - User actions: create/list/select/export.
  - UI home: `BooksPanel`.
- Outline node
  - User needs: section title/order/parent relation.
  - User actions: add node (currently flat in UI), inspect list.
  - UI home: `BooksPanel`.
- Assignment
  - User needs: mapping of section to raw text.
  - User actions: create assignment, inspect assignments.
  - UI home: `BooksPanel`.

## 4) Workflow map (real current user flows + weak spots)

- Sign up / sign in
  - Current flow: toggle mode in `LoginForm`; signup then login; token persisted.
  - Weak spots: no explicit token-expiry handling UX; session failure feedback is basic.
- Create project
  - Current flow: form in `ProjectsPanel`.
  - Weak spots: no pagination/sorting/filtering; no edit/archive UI.
- Create/import raw text
  - Current flow: manual create with textarea only.
  - Weak spots: import API exists but no file-import UI surface; capability gap.
- Create draft
  - Current flow: create draft from selected raw text in `DraftsPanel`.
  - Weak spots: branch naming guidance minimal; no branch map visualization.
- Save version / branch / freeze
  - Current flow: in `DetailPanels`, with save/branch/freeze actions.
  - Weak spots: dense action cluster; no destructive action confirmation; no clear "current head" affordance.
- Run AI assist
  - Current flow: `AIAssistPanel`, optional retrieval, copy/ignore suggestions.
  - Weak spots: no inline apply path to editor; no side-by-side with draft editor.
- Search corpus
  - Current flow: `SearchPanel` query + mode, render hit list.
  - Weak spots: results not linked to selecting/opening raw text; no snippet preview.
- Paste -> staged ingest -> accept/reject/defer
  - Current flow: `PasteIngestPanel` analyze then review actions.
  - Weak spots: staged candidates list is shallow; no candidate detail history view.
- Create book / node / assignment / export
  - Current flow: `BooksPanel` create book, add node, assign raw text, export markdown.
  - Weak spots: no hierarchy visualization for outline; assignment display is ID-truncated and non-human-friendly.

## 5) Frontend technical risks

- API-base/runtime binding risk
  - Reduced by manifest-aware proxy resolution, but non-zero fallback risk remains if runtime manifest absent and env unset (falls back to `:8000`).
- Stale process / wrong port risk
  - If frontend is run separately from `tooth start`, operator/runtime truth can diverge from user expectation.
- Auth/session edge cases
  - Token is persisted but not proactively invalidated on repeated auth failures; recovery path is coarse.
- Duplicated fetch logic
  - Lifecycle code repeated across many effects and panels; no shared query abstraction.
- Lack of route structure
  - No URL-addressable workspace entities (project/raw/draft/book), weak deep-linking and refresh resilience.
- Lack of component boundaries
  - `App.tsx` acts as orchestration and state monolith; high coupling and change blast radius.
- Layout/state coupling
  - Vertical mega-page ties unrelated domains together and increases rerender/state coordination complexity.
- Missing or uneven UX states
  - Error/loading/empty states are present but inconsistent in depth and actionability.
- CSS/UX brittleness
  - Global stylesheet and broad selectors risk regressions when adding richer layout systems.
- Contract governance risk
  - Missing canonical docs `17` and `18` means backend/frontend contract authority is currently code-derived only.

## 6) Pre-frontend decisions to lock before major implementation

- Route map
  - Define canonical route segments for auth, project workspace, raw text detail, draft detail/history, AI, search, ingest, books.
- App shell shape
  - Decide persistent shell layout vs per-surface pages; define panel persistence rules.
- Navigation model
  - Decide primary navigation (left rail/top tabs/route-driven) and selection persistence semantics.
- Chat/editor integration model
  - Decide suggestion-to-editor apply pattern and whether AI panel is co-located with draft editor.
- Detail pane model
  - Decide raw/draft/history split layout and mobile fallback behavior.
- State/query library decision
  - Decide if moving from manual effects to query/caching abstraction (highly recommended before large frontend expansion).
- Editor strategy
  - Decide whether to keep textarea baseline or move to richer editor abstraction for diff/history/apply flows.
- Component foundation strategy
  - Decide whether to standardize primitives (form controls, list patterns, status states) before broad UX work.
- Reuse vs rebuild boundary
  - Lock which current API layer/types remain source of truth and which UI containers are rewritten.

## 7) Ready-made building block recommendations

- Recommendation: **refactor in place**, preserving backend contracts and most of `frontend/src/lib/api.ts`.
- Do **not** adopt a giant starter repo; current API and domain surfaces are already real and should anchor the rebuild.
- Reuse candidates:
  - API client/types in `lib/api.ts` (retain and tighten usage map).
  - Existing panel business logic as extraction source.
  - Runtime/operator truth path (`state.json`, `tooth status`, proxy target flow).
- Must-change foundations:
  - App shell/routing structure (current single-page stack is a scaling bottleneck).
  - State/query orchestration (manual effect graph should be replaced by a predictable query/state layer).
  - Component primitives (inputs/list/panel/status patterns) for consistency and testability.
- Chat/editor foundation:
  - Keep current AI contract, but redesign UI integration around draft context and explicit apply workflows.

## 8) Recommended frontend work order (dependency + user value)

1. Shell first
  - Introduce route map + app shell + navigation + shared loading/error primitives.
2. Auth second
  - Move auth/session into dedicated route/state boundary; harden token invalidation and session recovery UX.
3. Project/raw text/draft core surfaces
  - Rebuild project -> raw text -> draft flow with clear route-driven selection and detail panes.
4. Chat/editor integration
  - Integrate AI assist with draft editing surface and explicit suggestion apply pathway.
5. Search + ingest
  - Add linked result navigation; improve staged ingest review clarity and status flows.
6. Books surface
  - Improve outline hierarchy interaction and assignment readability before any visual polish pass.
7. Operator links/context
  - Add runtime truth entrypoints from UI (backend URL, operator URL, health visibility) for operational clarity.
8. Polish + accessibility pass
  - Only after structural and workflow correctness are in place.

## Brutal readiness verdict

- Backend/API surface is broad enough and stable enough for serious frontend execution.
- Frontend architecture is currently the primary bottleneck (monolithic state, no route model, inconsistent UX depth).
- Repo is **conditionally ready** for full frontend execution **only if** shell/routing/state decisions above are locked first.