# 異動日誌 (Change Log)

按時間順序記錄系統的重大變更與決策。

## 2026-04-20
- [Sync] 實現 Supabase 三大表格 (`recent_fundamental`, `investor_positions`, `financial_metric`) 同步至本地 SQLite (Migration v12)。
- [Sync] 更新 `SyncDatabaseHelper` 以顯式欄位安全寫入數據。
- [Sync] 重構 `fetchStockExtData` 採用的雙軌策略：優先抓取 Supabase，若數據缺漏則自動降級 (Fallback) 至 Yahoo 爬蟲。
- [Scraper] 根據 n8n 參考強化 Yahoo 備援抓取器，實現三頁面並行抓取 (`/profile`, `/revenue`, `/major-holders`)，精確對齊 EPS、營收與籌碼面數據的映射邏輯。
- [Query] 實作「本地優先，雲端備援」策略於 `StockFundamentalQueryBuilder`，顯著提升基本面選股掃描速度。
- [Sync] 引入「過期資料判定」機制，解決舊資料阻礙備援抓取的問題（週籌碼 > 7天）。

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
