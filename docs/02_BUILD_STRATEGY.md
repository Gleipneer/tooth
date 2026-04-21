# Build Strategy

This document defines how Tooth should be built, in what order, and with what execution discipline.

## Canonical strategy

Build Tooth as a sequence of bounded vertical slices on top of frozen product invariants.

That means:

- start with storage truth, not AI spectacle
- prove one deployable slice before opening adjacent systems
- keep Ubuntu operations and rollback in scope from the start
- let later complexity inherit from proven contracts

## Architecture stance

Tooth should be built as:

- `frontend`: React-based conversation-first application
- `backend`: Python API + worker services
- `database`: PostgreSQL with `pgvector`
- `queue`: Redis-compatible broker
- `storage`: filesystem for canonical text bodies
- `deployment`: single-node Ubuntu with `systemd` and Nginx for MVP

## Strong choices now

These choices are strong enough to proceed without further planning delay:

- single-user first
- hybrid storage model
- explicit-apply AI
- deterministic and inspectable context assembly
- bounded async treatment for heavy jobs
- deploy first to a single Ubuntu host

## Deliberately deferred choices

These are intentionally not frozen yet:

- exact editor engine
- exact background job framework
- exact PDF/EPUB renderer
- exact frontend component library
- exact embedding model

They should be validated during the correct phase, not prematurely.

## MVP actually means

For Tooth, MVP does not mean "all docs implemented." It means a coherent, deployable writer workflow where a single user can:

- get in securely
- ingest text
- preserve immutable raw text
- produce drafts safely
- use bounded AI assistance
- search and assemble material
- export a simple book result
- run and recover the system on Ubuntu

## First deployable slice

The first deployable slice is narrower than MVP:

- local authentication
- project CRUD
- import plain text and Markdown
- immutable raw text persistence
- draft creation from a raw text
- minimal UI shell to inspect those objects
- logs, backup path, rollback notes

No semantic retrieval, book engine, or AI orchestration is required in this first slice.

## Dependency order

The hard dependency order is:

1. repo scaffolding and tooling
2. auth/session baseline
3. PostgreSQL schema + migrations
4. filesystem storage abstraction
5. project/raw text/draft APIs
6. import flow
7. minimal frontend shell
8. first-slice validation
9. editor/version history
10. chat/AI orchestration
11. retrieval/search
12. book engine
13. export hardening
14. observability and cost dashboards
15. release hardening

## Cost and risk control

- keep expensive AI capabilities out of the first slice
- require async boundaries for large jobs
- add only the services needed for the current phase
- prefer additive migrations
- avoid introducing speculative infra before the first deployable workflow exists

## Rollback and backup posture

- every phase should leave the repo more reversible, not less
- schema changes need migration discipline from the start
- filesystem text persistence must be atomic
- first release workflow must include a backup checkpoint and rollback note

## Model quality escalation

Start with `Composer 2` for:

- repo scaffolding
- route/model boilerplate
- simple UI shell composition
- doc-aligned plumbing work

Escalate to `GPT-5.4` when:

- choosing or proving the editor stack
- implementing diff/version semantics
- designing retrieval/context assembly behavior
- implementing structured AI outputs and apply safety
- debugging cross-layer architectural tension
- touching migrations, deployment risk, or rollback-sensitive changes

Rule: if Composer 2 starts producing repeated corrections on the same architectural surface, escalate instead of iterating blindly.
