# 異動日誌 (Change Log)

按時間順序記錄系統的重大變更與決策。

## 2026-04-07
- [System] 落實徹底的變更分離：建立 `constraints` 專用資料夾，賦予 `G-XXX` 絕對命名權限，並修改 `index.md` 與其 TL;DR。
- [System] 升級為 Lazy Load Edition：重構 `.agent/rules`，並於 `index.md` 加入 TL;DR 及知識地圖，實現全預載轉動態按需讀取。
- [System] 檢索 Git 遺失的舊版文件 (如 `goal.md`, `PRD.md`)，將 MUI 相關之 UI/UX 限制恢復為全局約束 `REQ-005`，並將 SQL 自動生成等目標補進 `prd.md`。
- [System] 依照最新 Lean Memory Bank 規範重構目錄：遷移約束至 `active-tasks/` 並清理已完成的 REQ 檔案。
- [System] 深度掃描 `.sql` 與 `_OPTIMIZATION.md` 相關文件，補發覺系統存在效能渲染約束與分離的資料庫雲端架構。
- [System] 新增 `REQ-003`、`REQ-004`，將專案的 React/SQLite 優化原則以及 Supabase/SQLite 雙軌儲存架構正式列入約束中。
- [System] 擴寫更新 `architecture.md` 及 `tech-stack.md` 補齊全盤細節。
- [System] 新增 `REQ-002`，將 `StorePrompt` 與 `PromptItem` 的定義提升為系統全局約束 (Global Constraint)。
- [System] 初始化 Memory Bank 結構 (依據 `[llm-wiki-memory-bank-schema.md]`)
