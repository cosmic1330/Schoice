# 異動日誌 (Change Log)

按時間順序記錄系統的重大變更與決策。

## 2026-04-22
- **2026-04-22**: 完成 REQ-011，將月營收狀態整合至 `stock_health_view` 並新增 Migration v14。
- **2026-04-22**: 修正 Sync Data 持久化失敗問題 (Conversation d487c047)
- [Sync/Architectural] 重構同步掃描邏輯，引入 SQLite View (`stock_health_view`) 以匯總檢視該股票的日線進度以及基本面、籌碼面的齊全度。當基本面或籌碼數據 (`has_ext_data` 為 false) 不全時，引擎將自動拒絕將該股票標記為滿血 (`fresh`)，防堵過往忽略了基本面未確實更新的漏網之魚現象。
- [Sync/Fix] 修復週轉率為 0 的問題：修正 `SyncEngine` 中 `issued_shares` 從資料庫讀取後未正確賦值回 `stock` 物件的漏洞，確保計算公式能讀取到正確股本。 (REQ-012)

## 2026-04-21
- [UI/Perf] [REQ-008] 修復 `ResultTable` 抖動、搜尋延遲與動畫效能：重構資料抓取為批次 Join、同步 `Suspense` 尺寸並移除耗能的 `layout` 動畫。
- [Scraper/Fix] [REQ-007] 強化 Fundamental 頁面資料讀取優先序：實作 SQLite 優先、Supabase 補充的合併策略，並補完缺失的指標 Mapping。
- [Sync/Fix] [REQ-010] 修復週資料重複與盤中寫入異常：調整 `isMarketOpen` 判定並實作 `isWeekFinalized` 檢查，確保不寫入未定型的盤中週資料。
- [Scraper/Fix] 修復 `financial_metric` 下載為 null 的問題。重構 Yahoo 爬蟲選擇器並修正缺失數據判定邏輯 (REQ-006)。

## 2026-04-20
- [Sync] 修正並優化週交易資料更新邏輯：修復日期檢查表錯誤，並實施「強制更新最後兩筆 K 線」策略，確保週期交替時（如週五結算與下週一開盤）數據能被完全校準。
- [UI/Chart] 將 `ResultTable` 的 `UltraTiny` 系列圖表（日、時、週）由折線圖替換為 K 線圖（Candlestick）。
- [UI/Chart] 實現自定義 K 線渲染組件 `UltraTinyCandlestickChart`，整合 OHLC 影線與多重均線顯示。
- [DB/Query] 更新日、時、週線查詢語句，獲取完整的 OHLC 數據。
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
