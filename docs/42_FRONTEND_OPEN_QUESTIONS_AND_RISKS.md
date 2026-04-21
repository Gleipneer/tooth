# Frontend Open Questions and Risks

Only real unresolved items and risks are listed here.

## Open questions (require explicit choice before coding)

- Should `docs/17_BACKEND_API_CONTRACTS.md` and `docs/18_DATABASE_SCHEMA_AND_STORAGE_MODEL.md` be created as a hard prerequisite before any frontend implementation branch starts? (recommended: yes)
- Chat placement decision:
  - primary mode as a dedicated route (`/projects/:projectId/chat`), or
  - draft-integrated pane in `/projects/:projectId/drafts/:draftId` with optional route alias?
- State/query library decision:
  - adopt TanStack Query now, or keep manual fetch lifecycle during first migration tranche?
- Editor strategy decision:
  - keep textarea baseline for first pass, or adopt richer editor now (with integration risk/cost)?
- Migration toggle strategy:
  - temporary legacy/new shell switch during rollout, or direct cut-over after phase parity branch?

## Direction update from live UX evidence

- User-reported confusion is accepted as production evidence: current object/form-first workflow is not an acceptable primary model.
- Canonical direction for current frontend passes: writing-first “AI Pages” interaction with backend object model preserved under the hood.

## Confirmed plan-vs-repo mismatches

- Planned search grouping (raw text + draft + AI operation result groups) does not match current backend search contract (raw-text scoped hits only).
- Planned ingest acceptance via direct raw-text create endpoint is not the actual staged accept contract (`/ingest-review/{item_id}/accept`).
- Planned books capabilities (node edit/delete/reorder, assignment delete, multiple export formats) exceed current backend API.
- Planned streaming chat behavior is not guaranteed by current backend API contract.

## High-confidence frontend risks

- Architecture risk: reintroducing monolithic state in a new root while migrating away from current `App.tsx`.
- Runtime truth risk: accidental fallback to wrong backend target if frontend is started outside managed flow without explicit target.
- Scope risk: visual “premium polish” work starting before route/state/workflow foundations are stable.
- Contract drift risk: frontend implementing assumptions from zip docs instead of actual live API surfaces.
- Migration risk: deleting legacy panels before route-level parity proof is complete.

## Areas of lower confidence

- Effort and complexity of integrating richer editor and chat in the same phase without introducing regressions.
- Exact responsive interaction model (inspector, side panes, chat/editor switching) across narrow screens.

## Must-validate-before-build checklist

- Runtime binding truth:
  - frontend resolves to runtime-selected backend URL under `tooth start`.
- API contract truth:
  - endpoint request/response shapes in `frontend/src/lib/api.ts` match live backend.
- Data flow truth:
  - search and ingest UI plans map to actual backend behavior.
- Books truth:
  - UI scope constrained to currently available endpoints unless backend changes are explicitly planned/approved.

## Human decisions required

- Approve canonical plan source: reconciled v2 + repo-truth corrections (`docs/40`, `docs/41`, `docs/42`).
- Approve whether to permit any backend endpoint additions in the frontend pass (recommended default: no, unless explicitly approved and phase-scoped).
- Approve chat/editor placement preference for first production-grade frontend iteration.
