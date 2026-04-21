# Acceptance Gates

These gates control movement between phases. A phase is not done because code exists; it is done when the gate is passed.

## Gate 0 - Planning complete

Required proof:

- canonical docs exist at repo root and under `docs/`
- source archive conflicts are documented
- MVP and first deployable slice are explicitly stated
- open questions are separated from locked decisions
- task and lessons files exist

Failure conditions:

- repo naming still ambiguous
- source archive statements still compete with canonical docs
- first implementation target is still vague

## Gate 1 - Foundation scaffold ready

Required proof:

- backend/frontend/infra/test structure exists
- pinned dependency and environment setup exists
- migration path exists
- local auth/session approach is implemented or clearly scaffolded
- storage abstraction boundary exists for filesystem + PostgreSQL

Failure conditions:

- schema changes would require ad hoc manual DB edits
- storage writes are not atomic or have no plan
- auth is still undefined

Recommended model:

- `Composer 2`
- escalate to `GPT-5.4` if migration or storage design becomes unstable

## Gate 2 - First deployable slice passed

Required proof:

- user can log in
- user can create a project
- user can import plain text or Markdown
- imported raw text is stored immutably
- user can create a draft from a raw text
- minimal UI can open and inspect project/raw text/draft
- key actions produce logs
- backup path is documented and tested at least once
- rollback steps are written and credible

Failure conditions:

- file and DB state can drift without detection
- the UI depends on unimplemented AI/search/book behavior
- no restore path has been exercised

Recommended model:

- `Composer 2` for most work
- `GPT-5.4` if data integrity or slice boundaries wobble

## Gate 3 - Editor/versioning core passed

Required proof:

- editable drafts work without mutating raw texts
- version history is inspectable
- branching semantics are coherent
- diff presentation is usable
- freeze/archive rules are enforced

Failure conditions:

- editor implementation leaks inconsistent document state
- diff or branch semantics are unclear to users
- version history is not trustworthy

Recommended model:

- `GPT-5.4`

## Gate 4 - AI/chat core passed

Required proof:

- conversations are tied to valid project/text context
- context is inspectable before execution
- AI outputs are structured and parse reliably
- apply/ignore behavior is explicit and reversible
- audit logs record AI call details
- heavy AI requests are bounded or queued

Failure conditions:

- AI can silently alter canonical text
- user cannot inspect context
- fallback/error handling is vague

Recommended model:

- `GPT-5.4`

## Gate 5 - Retrieval/search passed

Required proof:

- FTS works reliably
- project-scoped semantic retrieval returns linked evidence
- context trimming rules are enforced
- retrieval quality is evaluated against a small benchmark set

Failure conditions:

- retrieval crosses project boundaries unexpectedly
- ranking is opaque and untestable
- prompt context becomes unbounded

Recommended model:

- `GPT-5.4`

## Gate 6 - Book/export passed

Required proof:

- books and outline nodes behave coherently
- assignments preserve object integrity
- TOC is generated correctly
- Markdown export is deterministic and reversible from source objects

Failure conditions:

- export mutates source content
- outline semantics are unstable
- assignment integrity is lossy

Recommended model:

- mixed: `Composer 2` for lower-risk work, `GPT-5.4` for final semantics

## Gate 7 - Release readiness passed

Required proof:

- Ubuntu deployment works on a clean host
- services restart cleanly after reboot
- backup and restore drill succeeds
- rollback drill succeeds
- logs and health checks are inspectable
- cost warnings and heavy-job protections work

Failure conditions:

- database, queue, or debug ports are exposed incorrectly
- rollback is theoretical only
- backup has never been tested
- heavy jobs can starve the host

Recommended model:

- `GPT-5.4`