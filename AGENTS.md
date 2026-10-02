# Repository Agent Guide

## Knowledge Management

- Source code, executable configuration, migrations, and lockfiles are the final truth. If the wiki disagrees with them, follow the source and correct or mark the wiki stale.
- Before a large or cross-cutting change, read `wiki/index.md`, then read only the linked architecture, concept, and decision pages relevant to the task.
- Small, local fixes do not require a wiki update.
- Update the wiki only when a change affects:
  - architecture;
  - dependency or framework strategy;
  - an API contract;
  - state-management strategy;
  - authentication or authorization;
  - routing architecture;
  - build or deployment flow; or
  - another durable technical decision that a future coding agent is likely to need.
- Keep `wiki/index.md` short and navigational. Put detail in the smallest relevant page.
- Wiki pages use OKF v0.2-compatible Markdown with YAML frontmatter. Do not add metadata without a concrete maintenance purpose.
- Record durable decisions in `wiki/decisions/` using Context, Decision, Alternatives, and Consequences sections.
- Do not create component-by-component documentation, source inventories, generated API dumps, a database, a vector store, RAG infrastructure, or other knowledge runtime dependencies.
- The existing `memory-bank/` directory is legacy context and may be stale. Do not treat it as authoritative or update it unless a task explicitly asks for it.

