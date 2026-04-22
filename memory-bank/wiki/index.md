# 萬物之簿 (The Master Ledger & Knowledge Map)

這是專案的總控台、知識地圖與需求索引。請優先以本篇提供的摘要作上下文，如有需要深入細節才去 `view_file` 相關文件。

## 🗺️ 知識地圖 (Knowledge Map)
- **⚙️ 架構與設計**: 詳見 `architecture.md` (前後端分工、Tauri、Rust 邏輯)
- **📖 產品與規格**: 詳見 `prd.md` (選股策略邏輯、SQL 自動生成目標)
- **🛠️ 技術堆疊**: 詳見 `tech-stack.md` (套件版本與 Tauri Plugin)
- **📜 歷史日誌**: 詳見 `log.md` (記錄近期系統狀態變更，過舊紀錄移至 `log-archive.md`)

## 狀態說明 (Status Schema)
- 🟢 **Active** (執行中/有效)
- 🟡 **Pending** (待處理)
- 🔵 **Completed** (已完成)
- 🔴 **Cancelled** (已取消)

## 需求列表 (Requirements Index)

### 核心與全局約束 (Active Global Constraints)
*(存放於 `../active-tasks/constraints/` 目錄)*

- 🟢 **[G-001: 策略資料結構與特殊規則約束](../active-tasks/constraints/G-001_DataSchema.md)**
  - *TL;DR: 強制依賴 `StorePrompt` 與 `PromptItem` 作為單一條件與完整策略的型別標準。*
- 🟢 **[G-002: 效能與本地端資料庫優化原則](../active-tasks/constraints/G-002_Performance.md)**
  - *TL;DR: 表單限用 `React.memo` 防渲染瀑布，SQLite 必須走快取避免 N+1 重複查詢。*
- 🟢 **[G-003: 資料庫雙軌架構原則](../active-tasks/constraints/G-003_DualDatabase.md)**
  - *TL;DR: SQLite (本機) 專司 K線與技術分析；Supabase (雲端) 專司會員、關注清單與財報基本面。*
- 🟢 **[G-004: 前端 UI 與組件開發規範](../active-tasks/constraints/G-004_UIAndMUI.md)**
  - *TL;DR: 綁定 MUI Theme，全面捨棄舊版，改用 `Grid` (原 `Grid2`)，禁用寫死文字，一律使用 `/locale` 配置多語系。*
- 🟢 **[G-005: 數據同步一致性與日期格式規範](../active-tasks/constraints/G-005_SyncDataConsistency.md)**
  - *TL;DR: 強制使用 `YYYYMMDD` 格式；包含併發限制(1)、隨機延遲與 3 分鐘自動熔斷機制。*
- 🟢 **[G-006: BDD 行為驅動開發規範表](../active-tasks/REQ-000_Template.md)**
  - *TL;DR: 所有顯著開發必須包含 Given/When/Then 劇本，確保在實作前定義清晰行為邊界。*

### 功能需求 (Functional Requirements)
*(已完成的任務檔案已依據 Lean 規範刪除，內容併入主文檔)*
- 🔵 REQ-001: 建立 Memory Bank (Completed)
- 🔵 REQ-004: [Yahoo 同步抗性與自動修復 (BDD 實例)](../active-tasks/REQ-004_YahooSyncResilience.md) (Completed)
- 🔵 REQ-005: 替換超小型線圖為 K 線圖 (Completed)
- 🔵 REQ-006: 修復 Financial Metric 下載數據為空的問題 (Completed)
- 🟢 REQ-007: [強化 Fundamental 頁面資料讀取優先序](../active-tasks/REQ-007_FundamentalDataPriority.md) (Active)
- 🔵 REQ-008: [修復 ResultTable 抖動問題](../active-tasks/REQ-008_FixResultTableJitter.md) (Completed)
- 🔵 REQ-009: [Result UI 重新設計](../active-tasks/REQ-009_ResultUIDesign.md) (Completed)
- 🟢 REQ-010: [修復週資料重複與盤中寫入異常](../active-tasks/REQ-010_FixWeeklyDataDuplication.md) (Active)
- 🔵 REQ-011: [將月營收狀態加入 stock_health_view](../active-tasks/REQ-011_AddMonthlyRevenueToHealthView.md) (Completed)
46: - 🔵 REQ-012: [修復週轉率計算異常](../active-tasks/REQ-012_FixTurnoverRateZero.md) (Completed)
