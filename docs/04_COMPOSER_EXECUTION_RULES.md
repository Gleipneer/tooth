# Composer Execution Rules

This document is the compact operating guide for future Composer runs.

## Default run sequence

For every non-trivial run:

1. read `docs/00_IMPLEMENTATION_ENTRYPOINT.md`
2. read `SOURCE_OF_TRUTH.md`
3. read the current phase section in `docs/03_PHASED_MASTER_PLAN.md`
4. read `tasks/todo.md`
5. read `tasks/lessons.md`
6. execute only the current phase scope

## Composer may code when

- the task belongs to the active phase
- the previous gate is passed or explicitly waived
- the target files and boundaries are known
- the work does not silently widen product scope

## Composer must stay in planning mode when

- a task spans multiple phases
- the docs disagree
- the change includes migrations, deployment, or rollback-sensitive operations
- implementation choice will lock product architecture
- the next move is unclear after two failed attempts

## Model-quality guidance

### Stay on Composer 2 for

- repo scaffolding
- configuration wiring
- straightforward CRUD/API work
- simple UI composition
- low-risk refactors inside already-frozen boundaries
- tests that directly verify established contracts

### Hand off to GPT-5.4 for

- editor framework evaluation or integration
- version history and diff semantics
- AI orchestration and structured output flows
- retrieval ranking or context assembly behavior
- migrations with data risk
- operational hardening, deployment, backup, or rollback changes
- contradictory evidence between spec and implementation

### Mandatory escalation rule

If Composer 2 produces repeated corrections, unstable architecture, or unclear design trade-offs on the same surface, stop and escalate to GPT-5.4 instead of burning cycles.

## Exact task discipline

- Keep `tasks/todo.md` current.
- Mark blockers explicitly.
- Keep the "next recommended Composer prompt" section ready for handoff.
- Do not rely on chat memory as the project ledger.

## Lessons discipline

- If the user corrects a pattern, add it to `tasks/lessons.md`.
- If the agent discovers a recurring repo-specific failure mode, add it there too.
- Turn mistakes into prevention rules.

## Acceptance-gate discipline

- Never move phases because the code "looks close."
- Run or describe the exact validation needed by `docs/07_ACCEPTANCE_GATES.md`.
- Keep gates closed when verification is incomplete.

## Stop conditions

Stop and re-plan immediately if:

- an invariant would be broken
- a migration is destructive
- the current slice starts expanding sideways
- AI cost/risk controls are missing for the requested feature
- deployment or rollback posture becomes unclear

## Deliverable discipline

Every substantive run should leave behind:

- code or docs aligned to the active phase
- updated `tasks/todo.md`
- explicit validation results or known gaps
- a clear next prompt for the next Composer run
