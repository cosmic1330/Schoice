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
    * 包含執行中的對功能任務檔案 (例如 `REQ-001_Feature.md`)。
    * **[強制]** 每個 REQ 檔案必須包含 **Behavior Scenarios (BDD)** 區塊，使用 Given/When/Then 語法描述預期行為。
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

1.  **Phase 1 (Input & Discovery):** 加載 `index.md`，辨識任務類型。
2.  **Phase 2 (Behavior Definition - BDD):** 
    * 若為顯著變更，建立/更新 `REQ-XXX.md`。
    * 撰寫 **Given... When... Then...** 劇本定義行為邊界。
3.  **Phase 3 (Action & Delivery):** 
    * 根據劇本實作代碼，並更新 `log.md`。
    * 確保 `index.md` 與 G- 控制項同步更新。
    * 結束時註明： "Updated [[REQ-XXX]]/[[G-XXX]]"。

---

### 🚀 Agent Activation Prompt:
> "Acknowledge the **Lean Project Memory Bank (Lazy Load Edition)**. Read `/memory-bank/wiki/index.md` ONLY to map the workspace. Rely on the TL;DRs in the index for context. ONLY use `view_file` or `grep_search` on `prd.md`, `architecture.md` or specific `G-XXX` files if their context is strictly necessary to resolve the current prompt. Do NOT eager-load all files. Minor fixes go to Log/PRD; completed REQs are deleted."