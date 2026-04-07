---
trigger: always_on
---

# 🚀 Lean Project Memory Bank Specification (Lazy Load Edition)

## 1. Directory Structure (Minimized & Lazy)
All persistent memory resides in `/memory-bank/`. The goal is to keep token usage low while maintaining full context searchability.

* **`/memory-bank/wiki/`**
    * `index.md`: **The Master Ledger & Knowledge Map**. The ONLY file loaded by default. Contains TL;DRs of active constraints and points to where other knowledge lives.
    * `prd.md` & `architecture.md`: **Living Documents**. Loaded *dynamically* via tools only when needed. Completed tasks merge here. Must use structured Markdown Headers (`##`, `###`) for precise search.
    * `tech-stack.md`: Tracks SDKs, library versions, and technical choices.
    * `log.md`: Chronological stream of recent changes (Keep under 15-20 entries).
    * `log-archive.md`: Storage for older logs to prevent bloat.
* **`/memory-bank/active-tasks/`**: 
    * Contains markdown files (e.g., `REQ-001_Feature.md`) for **Ongoing** functional tasks. Once completed, they are merged and deleted.
* **`/memory-bank/active-tasks/constraints/`**:
    * A dedicated vault for **Global Constraints**. These are permanent and exempt from deletion. 
    * MUST use the `G-` prefix (e.g., `G-001_DataSchema.md`).

---

## 2. Core Operational Principles

### A. The "Significant Change" Filter (Preventing Bloat)
**Do not create a new REQ for minor tweaks.**
* **Minor Fixes:** Execute directly, update code and `log.md` only.
* **Significant REQs:** Create/Update a dedicated `REQ-XXX.md` in `active-tasks/`.

### B. Intelligent Requirement Evolution & Lazy Reading
1.  **Read Map First:** Always check `index.md` first. Read the 1-sentence TL;DRs of constraints.
2.  **Fetch on Demand:** If a constraint (`G-XXX`) or feature is highly relevant, use `view_file`/`grep_search` to read the full file. NEVER eager-load everything.
3.  **Match & Update:** Search `active-tasks/` and `index.md`. If it relates to an existing task, update its `Description` keeping TL;DR updated in `index.md`.
4.  **In-Place PRD Update:** Update `prd.md` or `architecture.md` directly for features already completed.

### C. Completion, Merging & Log Rotation
1.  **Extract:** Summarize the final implementation logic and move it into the relevant section of `prd.md` or `architecture.md`.
2.  **Purge:** Mark the REQ-ID as `Completed` in `index.md`, then **DELETE** the corresponding `REQ-XXX.md` from `/active-tasks/`. (Note: `G-` constraints are never deleted).
3.  **Rotate Log:** If `log.md` exceeds ~15 entries, move older entries to `log-archive.md`.

---

## 3. Global Constraints (Always On via TL;DR)
Global Constraints stay inside `/active-tasks/constraints/`. Every constraint (`G-XXX`) MUST have a 1-sentence TL;DR maintained in `index.md`. The Agent relies entirely on the TL;DRs for daily context and only opens the full `G-` file when deep details are strictly needed for the task at hand. This prevents token bloat.

---

## 4. Implementation Workflow

1.  **Phase 1 (Input):** Load `index.md` ONLY.
2.  **Phase 2 (Action):** 
    * Read TL;DRs in index. Use `view_file` or `grep_search` if detailed context is needed.
    * Evaluate: Is this a "Significant Change"?
    * If **Yes**: Match or Create REQ in active-tasks.
    * If **No**: Apply "Minor Fix" logic.
3.  **Phase 3 (Output):** 
    * Deliver code.
    * Update/Merge files, ensure `index.md` TL;DRs and G- constraints remain accurate.
    * End response with: "Updated [[REQ-XXX]]/[[G-XXX]]" or "Minor adjustment synced to PRD/Log."

---

### 🚀 Agent Activation Prompt:
> "Acknowledge the **Lean Project Memory Bank (Lazy Load Edition)**. Read `/memory-bank/wiki/index.md` ONLY to map the workspace. Rely on the TL;DRs in the index for context. ONLY use `view_file` or `grep_search` on `prd.md`, `architecture.md` or specific `G-XXX` files if their context is strictly necessary to resolve the current prompt. Do NOT eager-load all files. Minor fixes go to Log/PRD; completed REQs are deleted."