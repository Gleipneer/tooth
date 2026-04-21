# Tooth Agent Operating Rules

This file governs future Composer/Cursor agents working in the Tooth repository. Its purpose is to keep execution truth-bound, phased, and reversible.

## 1. Default operating mode

- Enter planning mode for any non-trivial task, architectural change, schema change, deployment change, migration, or multi-file feature.
- Code only after the relevant canonical docs have been read for the current phase.
- If the requested work crosses phase boundaries, stop and re-plan before coding.

## 2. Truth-bound behavior

- Read `docs/00_IMPLEMENTATION_ENTRYPOINT.md` first.
- Follow `SOURCE_OF_TRUTH.md` precedence strictly.
- Never guess when repo evidence, source docs, runtime evidence, or existing code can be inspected.
- If the docs do not honestly answer a question, record it in `docs/06_OPEN_QUESTIONS.md` or `docs/05_DECISION_LOG.md`.
- Never claim completeness if the repo, tests, or deployment path have not proven it.

## 3. Source-of-truth discipline

- The canonical docs in this repo outrank the source archives.
- Do not revive older archive statements after canonicalization unless the decision log explicitly re-adopts them.
- Never bypass product invariants from the product docs.
- Never widen scope by "helpfully" implementing adjacent ideas that were not approved for the current phase.

## 4. Repo normalization rules

- Keep the root obvious and minimal.
- Do not scatter planning artifacts across the repo.
- Put execution guidance in `docs/`, active coordination in `tasks/`, and product/runtime decisions in the canonical docs.
- Remove ambiguity in naming, file ownership, and phase status before adding significant code.

## 5. No-placeholder rule

- Do not write fake sections such as `TODO`, `TBD`, `coming later`, or placeholder acceptance criteria unless the unresolved item is real and explicitly logged with a recommendation.
- If something is intentionally open, say exactly why it is open, what remains blocked, and what evidence would close it.

## 6. Coding gate

- Composer is allowed to code only when the task is inside the current active phase and the acceptance gate for the previous phase is either passed or explicitly waived in the decision log.
- Composer must not begin multiple architectural fronts at once.
- Do not start search, editor, book engine, and AI orchestration implementation in parallel.
- Prefer one vertical slice that exercises real storage, API, UI, and operations before broad feature expansion.

## 7. Stop-and-re-plan conditions

Stop immediately and re-plan if any of the following occur:

- a canonical document conflict is discovered
- a required invariant cannot be preserved cleanly
- a schema change affects earlier assumptions
- the first slice grows beyond its gate definition
- rollout or rollback cannot be demonstrated
- a migration becomes destructive
- AI/runtime cost exceeds the defined guardrails
- implementation requires a new library or service that materially changes ops posture

## 8. Rollback and migration posture

- Every meaningful change must preserve a rollback story.
- Destructive schema or storage migrations require backup proof and an explicit decision log entry.
- Never rewrite or mutate canonical raw texts in place.
- Prefer additive migrations and reversible release steps.

## 9. Deployment caution

- Ubuntu single-node deployment is the canonical MVP target.
- Do not design first for cloud sprawl or multi-tenant scale.
- Keep database, queue, file storage, backup, and service supervision operationally boring.
- No production deployment is complete until backup, restore, and rollback are demonstrated.

## 10. AI-cost caution

- Cost-aware mode is the default.
- Heavy AI tasks must be async and bounded.
- Never ship an unconstrained archive-wide AI feature before budget and throttling controls exist.
- Do not increase model quality or context size by habit; do it only where the plan says it is justified.

## 11. Root-cause discipline

- Fix root causes, not symptoms.
- If a test fails, find the invariant or contract that was violated.
- If the UI feels wrong, inspect the interaction spec and data flow before patching visuals.
- If a prompt or retrieval issue appears, inspect context assembly and evidence rules before tuning prompts blindly.

## 12. Acceptance-gate discipline

- Do not mark work done because files were written.
- A phase is complete only when its acceptance gate in `docs/07_ACCEPTANCE_GATES.md` is met.
- If verification is partial, say so plainly and keep the gate closed.

## 13. Task file discipline

- `tasks/todo.md` is the active execution ledger.
- Update it when the current objective, blockers, deliverables, or next prompt changes.
- Keep checklist items concrete and phase-scoped.
- Do not bury the active next step in chat history.

## 14. Lessons discipline

- When the user corrects the agent, add the pattern to `tasks/lessons.md`.
- Write the prevention rule, not just the anecdote.
- Review relevant lessons at the start of each new execution run.

## 15. Model escalation discipline

- Start with Composer 2 for repo normalization, scaffolding, straightforward CRUD, low-risk UI structure, and doc-synchronized execution.
- Escalate to GPT-5.4 when crossing into architecture-sensitive work:
  - editor engine selection and diff/version semantics
  - retrieval ranking and context assembly behavior
  - AI orchestration, structured outputs, and fallback handling
  - migrations or deployment changes with blast radius
  - any phase where contradictions between implementation and spec appear
- If a task needs repeated rework, stop using the cheaper model and escalate instead of thrashing.

## 16. Completion rule

- A task is not complete until:
  - the relevant docs still agree
  - validation has been run or the missing validation is stated explicitly
  - rollback remains credible
  - `tasks/todo.md` reflects the new state