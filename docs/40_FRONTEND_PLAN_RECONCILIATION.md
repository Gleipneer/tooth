# Frontend Plan Reconciliation

This document reconciles frontend planning archives against current Tooth repo truth.

## Zip files found

- `tooth_frontend_plan.zip` (v1)
- `tooth_frontend_plan_v2.zip` (v2)

Both were extracted successfully into a temporary analysis area:
- `/tmp/tooth_frontend_plan_analysis/zip1`
- `/tmp/tooth_frontend_plan_analysis/zip2`

## Inventory summary

### v1 contents (9 markdown planning docs + 2 images)

- `README.md`
- `PHASE_A_GOVERNANCE_REPAIR.md`
- `PHASE_B_SHELL_AND_ROUTING.md`
- `PHASE_C_AUTH.md`
- `PHASE_D_PROJECT_RAW_DRAFT.md`
- `PHASE_E_CHAT.md`
- `PHASE_F_SEARCH_AND_INGEST.md`
- `PHASE_G_BOOK_WORKSPACE.md`
- `PHASE_H_POLISH_AND_ACCESSIBILITY.md`
- images: `app_shell_example.png`, `chat_view_example.png`

### v2 contents (v1 + additional control docs/images)

- All v1 phase docs
- Added:
  - `00_MASTER_EXECUTION_PLAN.md`
  - `01_FRONTEND_ARCHITECTURE_AND_INTEGRATION.md`
  - `02_ROUTE_MAP_AND_SCREEN_SPECS.md`
  - `03_DESIGN_SYSTEM_SPEC.md`
  - `04_COMPONENT_OWNERSHIP_AND_STATE_MODEL.md`
  - `05_ACCEPTANCE_GATES_FRONTEND.md`
  - `06_FRONTEND_INTEGRATION_PLAYBOOK.md`
  - `99_AGENT_EXECUTION_PROMPT.md`
- additional images:
  - `workspace_example.png`
  - `books_view_example.png`
  - `mobile_chat_example.png`

## Zip vs zip (overlap and contradictions)

### Overlap

- v2 preserves all v1 phase documents unchanged.
- Core phase sequencing is the same (A through H).

### Differences

- v2 adds stronger execution scaffolding (architecture spec, route spec, component/state ownership, migration playbook, frontend gates).
- v2 is strictly more complete than v1 for orchestration and risk control.

### Internal contradictions in either plan set

- No hard v1-v2 contradiction in phase intent.
- v2 introduces stronger constraints, but these are additive and compatible with v1.

## Alignment with current repo truth

Strong alignments:

- Correctly identifies monolithic frontend (`App.tsx`) and need for route-based shell.
- Correctly prioritizes state/query foundation before visual polish.
- Correctly preserves backend-first truth and explicit-apply/non-silent-write constraints.
- Correctly identifies missing canonical docs `docs/17_BACKEND_API_CONTRACTS.md` and `docs/18_DATABASE_SCHEMA_AND_STORAGE_MODEL.md`.
- Correctly emphasizes runtime API-binding truth and avoiding hidden wrong-port assumptions.

## Misalignments, risky assumptions, and scope errors

### Misaligned with current backend/API reality

- Search expectations in `PHASE_F_SEARCH_AND_INGEST.md` mention grouped results across raw texts/drafts/AI operations with snippets; current search API returns raw-text scoped hits only (`raw_text_id`, `title`, `score`, `rank_kind`, `meta`). Draft/AI-operation search grouping is not current backend behavior.
- `PHASE_G_BOOK_WORKSPACE.md` assumes node title edits, node deletion, assignment deletion, and reorder update endpoints; these are not present in current backend API.
- `PHASE_G_BOOK_WORKSPACE.md` implies “multiple export formats”; current backend exposes Markdown export only.
- `PHASE_F_SEARCH_AND_INGEST.md` says accepted ingest candidates create raw texts via `POST /projects/{projectId}/rawtexts`; actual workflow is explicit staged accept via `POST /ingest-review/{item_id}/accept`.

### Too vague or risky

- Streaming AI response requirement in `PHASE_E_CHAT.md` is aspirational; current backend contract does not define a streaming assist endpoint.
- `PHASE_B_SHELL_AND_ROUTING.md` prescribes adding a query layer and UI primitives but lacks concrete migration checkpoints tied to existing panel parity (v2 playbook partially fixes this).
- `PHASE_H_POLISH_AND_ACCESSIBILITY.md` includes optional keyboard shortcuts and broad tooling assumptions; good ideas, but non-critical and potentially scope-expanding if treated as mandatory in first implementation pass.

### Scope tension to control

- Several docs use “premium/modern” language that can trigger visual overreach; must remain subordinate to route/state/workflow parity and existing product invariants.

## What should become canonical vs discarded

### Canonical to keep

- v2 as base package (not v1 alone).
- Phase ordering A-H.
- v2 documents:
  - `00_MASTER_EXECUTION_PLAN.md`
  - `01_FRONTEND_ARCHITECTURE_AND_INTEGRATION.md`
  - `02_ROUTE_MAP_AND_SCREEN_SPECS.md`
  - `04_COMPONENT_OWNERSHIP_AND_STATE_MODEL.md`
  - `05_ACCEPTANCE_GATES_FRONTEND.md`
  - `06_FRONTEND_INTEGRATION_PLAYBOOK.md`

### Keep with correction notes

- `PHASE_E_CHAT.md` (remove streaming assumption as requirement).
- `PHASE_F_SEARCH_AND_INGEST.md` (align search and ingest behavior to real backend contracts).
- `PHASE_G_BOOK_WORKSPACE.md` (mark update/delete/reorder features as conditional on explicit backend contract changes, not assumed current capability).
- `03_DESIGN_SYSTEM_SPEC.md` (use as guardrails, not feature checklist).

### Discard as canonical control source

- `99_AGENT_EXECUTION_PROMPT.md` should not be canonical governance in-repo; it is a helper prompt, not authoritative contract doc.

## Final recommendation

- **Recommendation: merge both by adopting v2 as canonical base, with explicit repo-truth corrections from this reconciliation.**
- Do not use v1 alone.
- Do not execute directly from zip text without the corrections captured here and in `docs/41` and `docs/42`.
