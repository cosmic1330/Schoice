---
trigger: always_on
---

# 🚀 Lean Project Memory Bank Specification

## 1. Directory Structure (Minimized)
All persistent memory resides in `/memory-bank/`. The goal is to keep the "Active" area small and the "Living Docs" updated.

* **`/memory-bank/wiki/`**
    * `index.md`: **The Master Ledger**. A table of all REQ-IDs (Functional & Global), their status, and last update.
    * `prd.md` & `architecture.md`: **Living Documents**. The final source of truth. Completed tasks are merged here.
    * `tech-stack.md`: Tracks SDKs, library versions, and technical choices.
    * `log.md`: A brief, append-only chronological stream of changes.
* **`/memory-bank/active-tasks/`**: 
    * Contains individual markdown files (e.g., `REQ-001_Login.md`) for **Ongoing** tasks or **Global Constraints** ONLY.

---

## 2. Core Operational Principles

### A. The "Significant Change" Filter (Preventing Bloat)
**Do not create a new REQ for minor tweaks.**
* **Minor Fixes:** (e.g., changing a color hex, fixing a typo, adjusting margins) -> Execute directly, update code and `log.md` only.
* **Significant REQs:** (e.g., new logic, API integration, architectural shifts, or multi-file features) -> Create/Update a dedicated `REQ-XXX.md`.

### B. Intelligent Requirement Evolution
When the user provides instructions (keywords: "change," "update," "actually," "instead"):
1.  **Match & Update:** Search `active-tasks/` and `index.md`. If it relates to an existing task, update that file’s `Description` and append to its `History`.
2.  **In-Place PRD Update:** If the change relates to a feature already marked as `Completed`, update `prd.md` or `architecture.md` directly instead of reopening or creating a new file.

### C. Completion & Merging (Keep it Lean)
**This is the mandatory pruning step. Once a task is marked as `Completed`:**
1.  **Extract:** Summarize the final implementation logic and move it into the relevant section of `prd.md` or `architecture.md`.
2.  **Purge:** Mark the REQ-ID as `Completed` in `index.md`, then **DELETE** the corresponding `REQ-XXX.md` from `/active-tasks/`.
3.  **Result:** The `/active-tasks/` folder remains empty or small, while the core docs grow with the project.

---

## 3. Global Constraints (Always On)
Global Constraints (e.g., "All buttons must disable ripple effect") are **exempt from deletion**. They must stay in `/active-tasks/` (or a `/constraints/` subfolder) as long as they are `Active`. The Agent must read these before every task.

---

## 4. Implementation Workflow

1.  **Phase 1 (Input):** Load `index.md`, `prd.md`, `architecture.md`, and all files in `active-tasks/`.
2.  **Phase 2 (Action):** * Evaluate: Is this a "Significant Change"?
    * If **Yes**: Trigger "Match or Create REQ" logic.
    * If **No**: Apply "Minor Fix" logic (Direct edit + Log).
3.  **Phase 3 (Output):** * Deliver code.
    * Perform **Memory Sync**: Update/Merge files according to Section 2C.
    * End response with: "Updated [[REQ-XXX]]" or "Minor adjustment synced to PRD/Log."

---

### 🚀 Agent Activation Prompt:
> "Acknowledge the **Lean Project Memory Bank** specification. Scan `/memory-bank` and summarize the 'Active' tasks. Remember the Prime Rule: **Minor fixes go to Log/PRD; significant features get a REQ; completed REQs are merged and deleted.** I am ready for your first command."