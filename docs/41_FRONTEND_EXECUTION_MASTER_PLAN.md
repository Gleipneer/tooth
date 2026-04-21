# Frontend Execution Master Plan (Canonical)

This is the canonical plan for the upcoming frontend implementation pass, reconciled against live repo/API/runtime truth.

## Execution posture

- Planning-to-implementation handoff only after governance and contract baselines are explicit.
- Refactor in place; do not replace backend architecture.
- Preserve product invariants: single-user scope, explicit apply, immutable raw texts, no silent writes.
- Frontend work order is dependency-first, not polish-first.
- Writing-first correction is now explicit product direction: the user starts from pages/canvas/chat, not raw backend object forms.
- Raw text/draft/version must remain real backend truth, but be mostly under-the-hood in default UX.

## Phase order and dependencies

## Phase 0 - Contract/Governance lock

### Required outputs

- Create `docs/17_BACKEND_API_CONTRACTS.md` from live backend routers/schemas.
- Create `docs/18_DATABASE_SCHEMA_AND_STORAGE_MODEL.md` from models/storage code.
- Record frontend-plan reconciliation completion in `tasks/todo.md`.

### Gate

- Implementation does not start until `docs/17` and `docs/18` exist and are code-accurate.

## Phase 1 - Shell, route map, and state/query foundation

### Decisions to lock first

- Canonical route map for auth, projects, raw text, draft, chat, search, ingest, books.
- Shell layout shape and navigation model.
- State/query strategy (recommended: query/caching layer + URL as selection truth).
- Migration strategy for retiring monolithic `App.tsx` safely.

### Work

- Introduce route-based app skeleton.
- Introduce query/state layer for server state.
- Build shared UI primitives and consistent status-state components.
- Keep runtime API binding truthful (preserve manifest/env-driven proxy behavior).

### Gate

- Route navigation works.
- Correct backend target remains visible/truthful under dynamic ports.
- Build and tests pass.

## Phase 2 - Auth surfaces and session hardening

### Work

- Route-based sign-in/sign-up pages.
- Preserve signup->login flow and `auth/me` bootstrap behavior.
- Session persistence and sign-out flow in shell.
- 401 handling policy (clear session + redirect).

### Gate

- Live signup/signin/signout pass.
- Reload/session continuity pass.

## Phase 3 - Project/raw text/draft core workflows

### Work

- Route pages for writing-first “Pages Studio”:
  - left: project/pages/books/fragments navigation and page list
  - center: page canvas/editor with obvious new-page/paste entry
  - right: AI chat/context attached to current page
- Auto-create/resolve working draft when a page (raw text) is created or selected, where safe.
- Keep advanced draft internals available but not primary first-step UX.
- Remove duplicated lifecycle logic where possible via query hooks.

### Gate

- End-to-end project->raw text->draft flow works in live UI.
- History/diff/freeze actions are discoverable and accurate.

## Phase 4 - Chat/editor integration

### Work

- Integrate AI assist into draft-centered workspace (or routed chat with clear draft/project context).
- Maintain explicit copy/ignore/apply-safe workflow.
- Display routing/context/token metadata in non-noisy UI.

### Guardrail

- Streaming is optional unless backend contract explicitly supports it.

### Gate

- Live AI assist workflow works against actual backend.
- Explicit apply/no silent write invariant preserved.

## Phase 5 - Search and ingest

### Work

- Route-based search page aligned to actual search contract (raw-text scoped hits).
- Link hits back into workspace, landing in editable page context.
- Route-based ingest page aligned to staged ingest contract:
  - analyze
  - candidate list
  - accept/reject/defer
- Use writer-understandable language for staged decisions ("keep/discard/later"), not queue-admin wording.

### Guardrail

- Do not implement imagined draft/AI-op grouped search unless backend contract changes.

### Gate

- Live search + ingest flows pass end-to-end.

## Phase 6 - Books workspace

### Work

- Route-based books workspace with current backend capabilities:
  - book list/create
  - node create/list
  - assignment create/list
  - markdown export
  - optional TOC view if surfaced
- Present structure and assignments in writer-readable manuscript language (chapter/section/page) while preserving backend truth.

### Guardrail

- Node edit/delete/reorder and assignment delete are conditional on explicit backend API expansion; not assumed baseline.

### Gate

- Live book creation, node creation, assignment, export pass.

## Phase 7 - Polish and accessibility

### Work

- Normalize visual system and interaction consistency.
- Fill loading/error/empty-state gaps.
- Responsive behavior and keyboard/screen-reader basics.

### Gate

- Accessibility checks pass for critical flows.
- Responsive sanity validated on narrow/medium/desktop layouts.

## Model/subagent execution design

## Lead model (GPT-5.4) should own

- Route map and shell architecture choices.
- State/query architecture and migration boundaries.
- Chat/editor integration semantics.
- Runtime/API-binding truth checks.
- Phase gate decisions and final integration review.

## Lower-cost executor/subagents may own (bounded tasks)

- Mechanical component extraction and refactors.
- UI primitive implementation under locked design constraints.
- Domain page wiring once architecture decisions are fixed.
- Test authoring and fixture updates.
- Documentation sync passes.

## Suggested bounded task slicing

- `P0A` contract docs (`docs/17`, `docs/18`)
- `P1A` router/shell scaffolding
- `P1B` query/state migration scaffolding
- `P2` auth pages + session policy
- `P3A` projects/raw texts
- `P3B` drafts/history/diff
- `P4` chat integration
- `P5` search/ingest
- `P6` books
- `P7` polish/a11y

## Review gates and stop conditions

## Mandatory review at each phase end

- Verify against live backend contracts, not planned contracts.
- Run frontend tests and build.
- Run focused live UI checks for the phase domain.
- Update `tasks/todo.md` with completed/remaining items.

## Stop conditions

- Any required endpoint behavior differs from current backend contract.
- Runtime/API target truth regresses or becomes ambiguous.
- Explicit-apply/no-silent-write invariant is at risk.
- Scope widens into deferred product areas.

## Definition of done for frontend pass

- Route-based shell is primary and monolithic stacked page is retired.
- Auth, project/raw text/draft, chat, search/ingest, books all work with live backend.
- Runtime/API binding remains truthful with dynamic ports.
- UX consistency is substantially improved without scope creep.
- Tests/build and manual proofs are recorded.
- Docs and task ledger reflect final architecture and behavior truthfully.
