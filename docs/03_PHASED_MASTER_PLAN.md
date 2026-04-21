# Phased Master Plan

This is the total implementation plan for Tooth. It is phase-based, dependency-aware, and explicit about what is frozen, what remains open, and when model quality should increase.

## Canonical product decision

- `Tooth` is the canonical project name.
- The source corpus called the product `Text OS`; that corpus is now interpreted as the main source material for Tooth.
- Tooth is a self-hosted, single-user-first writing system, not a generic note app, not a ghostwriter, and not a collaboration platform in its first build.

## MVP decision

The Tooth MVP is:

- Ubuntu-hosted single-user deployment
- local authentication
- project and collection organization
- plain text and Markdown import
- immutable raw text storage on filesystem
- draft creation, branching, and diff-aware version history
- conversation-first workspace with bounded AI suggestions and explicit apply
- project-scoped full-text plus semantic retrieval
- simple book outline and Markdown export
- audit logging, cost guardrails, backup/restore, rollback posture

## First deployable slice decision

The first deployable slice is:

- login
- project CRUD
- raw text import
- immutable raw text persistence
- draft creation from raw text
- minimal workspace UI
- logs, backup proof, and rollback notes

This slice is intentionally pre-AI and pre-book-engine.

## What must be frozen before code starts

Freeze these now:

- project naming and doc precedence
- single-user MVP boundary
- Ubuntu deployment target
- hybrid storage model
- explicit-apply AI rule
- first deployable slice
- acceptance gates
- rollback and backup expectation
- cost-aware runtime posture

## What may remain open

These can remain open during early implementation:

- editor framework
- job framework
- exact export renderer
- exact embedding model
- final visual system

## Intentionally deferred choices

These are deferred on purpose:

- multi-user support
- offline sync
- docx/pdf/epub import
- EPUB/PDF export
- archive-wide motif analysis
- graph-based narrative tools
- public sharing and social features

## Phase plan

### Phase 0 - Repo normalization and execution freeze

Goal:

- establish canonical docs, task discipline, phase gates, and execution rules

Outputs:

- planning package
- naming normalization
- decision log
- open questions register

Recommended model:

- `Composer 2`

Escalate to `GPT-5.4` if:

- the source docs conflict in a way that changes storage, scope, or deployment posture

Status:

- complete in planning terms

### Phase 1 - Foundation scaffold

Goal:

- create backend/frontend/infra/test structure and baseline tooling without widening scope

Core work:

- repo scaffolding
- pinned dependencies and environment definitions
- migration framework
- local auth/session baseline
- PostgreSQL connection baseline
- filesystem storage abstraction

Recommended model:

- `Composer 2`

Increase to `GPT-5.4` at:

- first sign of ambiguity around migration boundaries, auth posture, or storage atomicity

Acceptance dependency:

- cannot start Phase 2 until schema, storage, and auth foundations are coherent

### Phase 2 - First deployable slice

Goal:

- ship the ingestion-to-draft vertical slice

Core work:

- project CRUD
- raw text import for plain text/Markdown
- immutable raw text persistence
- draft creation from imported text
- minimal app shell to browse project/raw text/draft
- logging, backup notes, rollback notes

Recommended model:

- start with `Composer 2`

Increase to `GPT-5.4` at:

- API and storage mismatch
- UI data-flow instability
- file/DB consistency problems
- first slice threatens to absorb search, AI, or book complexity

Hard non-goals in this phase:

- semantic search
- AI orchestration
- full editor diffing
- book engine
- advanced exports

### Phase 3 - Editor and versioning core

Goal:

- turn the draft model into a real writing surface with safe version history

Core work:

- editor framework selection
- read-only raw text view vs editable draft view
- autosave and snapshot/version creation
- branching and freeze semantics
- diff/history UI

Recommended model:

- `GPT-5.4`

Why quality increases here:

- this is the first phase where implementation choices can permanently distort the product
- editor, diff, and draft semantics are architecture-sensitive

Do not let Composer 2 lead this phase without supervision.

### Phase 4 - Chat workspace and AI orchestration

Goal:

- add bounded AI assistance that respects Tooth's invariants

Core work:

- conversation model wiring
- context pinning and visibility
- structured output parsing
- suggestion cards
- apply/ignore flow
- audit logging for AI calls
- fallback and cost controls for bounded chat tasks

Recommended model:

- `GPT-5.4`

Reason:

- prompt assembly, structured output safety, context inspection, and apply behavior are core product integrity surfaces

### Phase 5 - Retrieval and search

Goal:

- implement search that helps both users and AI without violating determinism

Core work:

- PostgreSQL FTS
- project-scoped semantic embeddings
- retrieval ranking
- context trimming rules
- evidence links back to source objects

Recommended model:

- `GPT-5.4`

Reason:

- retrieval bugs will silently poison AI quality and user trust

### Phase 6 - Book engine and export path

Goal:

- implement outline-based assembly and first export path

Core work:

- book CRUD
- outline node model
- assignment model
- TOC generation
- Markdown export
- export job boundary

Recommended model:

- `Composer 2` for CRUD and UI wiring
- `GPT-5.4` for outline semantics, assignment integrity, and export edge cases

Handoff point:

- Composer 2 can build the first pass
- GPT-5.4 should take over before finalizing structure behavior and export correctness

### Phase 7 - Ubuntu hardening, observability, and release readiness

Goal:

- make Tooth deployable and supportable

Core work:

- systemd/Nginx/worker/scheduler setup
- backup and restore drills
- rollback rehearsal
- logging and alerting baseline
- cost monitoring baseline
- smoke tests and release checklist

Recommended model:

- `GPT-5.4`

Reason:

- deployment, rollback, and operational blast radius are too important for low-rigor iteration

## Staff-engineer-approved execution order

Use this exact order:

1. scaffold foundations
2. prove the first deployable slice
3. select and implement editor/versioning core
4. add AI/chat with explicit apply
5. add retrieval/search
6. add book engine and Markdown export
7. harden Ubuntu operations and observability
8. only then consider post-MVP expansion

## Dependency rules

- Do not start multiple architectural fronts at once.
- Do not start semantic retrieval before the first slice exists.
- Do not start AI orchestration before draft/version semantics exist.
- Do not start advanced export before outline assignment is stable.
- Do not call the product "MVP complete" before Ubuntu operational gates pass.
