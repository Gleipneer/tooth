# Open Questions

These are the real unresolved items that remain after canonicalization. They are not placeholders. Each one has a recommended direction.

## OQ-001 - Exact editor framework

Question:

- Which editor stack best supports Markdown-aware drafting, selection actions, comments, branching-friendly semantics, and diff presentation?

Why still open:

- This is implementation-sensitive and easy to get wrong without a thin proof.

Recommended direction:

- run a bounded evaluation of `Tiptap/ProseMirror` first
- compare only if a hard blocker appears

When to resolve:

- start of Phase 3

Recommended model:

- `GPT-5.4`

## OQ-002 - Background job framework

Question:

- Which Python job framework best fits single-host Ubuntu MVP operations without overcomplication?

Why still open:

- Multiple viable options exist, and the right answer depends on operational simplicity and retry behavior.

Recommended direction:

- favor the simplest durable queue/worker model that works cleanly with Redis-compatible infrastructure and systemd

When to resolve:

- late Phase 1 or early Phase 2, before import jobs expand

Recommended model:

- `Composer 2`, escalate if trade-offs become non-obvious

## OQ-003 - Embedding model and retrieval benchmark

Question:

- Which embedding approach gives acceptable project-scoped retrieval quality for long-form writing?

Why still open:

- The source corpus defines architecture but not a benchmark-backed final model choice.

Recommended direction:

- implement the retrieval interfaces first
- evaluate model choices against a small gold set during Phase 5

When to resolve:

- Phase 5

Recommended model:

- `GPT-5.4`

## OQ-004 - Export renderer beyond Markdown

Question:

- What stack should render EPUB/PDF later without corrupting book semantics or consuming too much operational complexity?

Why still open:

- Markdown export is enough for MVP-adjacent progress; richer export should follow proven outline behavior.

Recommended direction:

- defer beyond first build
- keep export interfaces clean and renderer-agnostic

When to resolve:

- post-Phase 6, before P1 export expansion

Recommended model:

- `GPT-5.4`

## OQ-005 - Public HTTPS or private VPN-first deployment

Question:

- Should the first real deployment be public HTTPS or private-only access via VPN/Tailscale?

Why still open:

- Both fit the source docs, but the operator's real risk tolerance and usage pattern matter.

Recommended direction:

- begin with private-only deployment if possible
- add public exposure only after the operational path is proven

When to resolve:

- Phase 7

Recommended model:

- `GPT-5.4`

## OQ-006 - Retention policy for generated exports and attachments

Question:

- What should be retained indefinitely vs pruned automatically?

Why still open:

- It affects storage growth, audit posture, and user expectations.

Recommended direction:

- keep raw text and drafts durable
- allow generated exports to be regenerable and thus prunable under policy

When to resolve:

- before production hardening in Phase 7

Recommended model:

- `Composer 2`

## Not-open items

These are explicitly not open anymore:

- single-user-first MVP posture
- hybrid storage model
- explicit-apply AI policy
- Ubuntu deployment target
- first deployable slice definition

Do not reopen them casually during implementation.
