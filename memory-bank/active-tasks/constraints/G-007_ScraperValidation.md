# G-007: 爬蟲驗證與改版適應測試規範 (Scraper Validation & Diagnostics)

## 1. 規範目的與適用場景
當發生 Yahoo 股市或外部網站改版、基本面同步失敗或資料庫營收/EPS數值異常時，**禁止直接盲目修改核心爬蟲模組 (`stockScraper.ts`)**。必須優先使用獨立的驗證指令碼進行隔離測試，確認 DOM 結構變化與解析邏輯正確後，方可更新正式代碼。

## 2. 獨立驗證指令碼地圖 (Scratch Scripts Map)
所有測試與診斷指令碼存放在專案根目錄的 `/scratch/` 資料夾下，可直接透過 `npx ts-node scratch/<script_name>.ts` 運行。

### 核心驗證指令碼
*   **`scratch/test_new_scraper_final.ts` (推薦優先使用)**
    *   **用途**：完整驗證上市 (`.TW`) 與上櫃 (`.TWO`) 股票的最新月份營收表與 Profile EPS 區塊解析邏輯。
    *   **執行方式**：`npx ts-node scratch/test_new_scraper_final.ts`

### 結構剖析與診斷指令碼
*   **`scratch/test_new_structure.ts`**
    *   **用途**：專司印出 Yahoo 股市新版 `.table-body-wrapper .table-row` 表格內部每一行的標籤與 Class 樹，適用於偵測未來表格欄位增減。
*   **`scratch/test_revenue_html.ts`**
    *   **用途**：抓取並搜尋營收頁面中包含「營收」或特定年份文字的父節點 HTML 結構。
*   **`scratch/test_profile_structure.ts`** / **`scratch/test_eps_grid.ts`**
    *   **用途**：深度追蹤 Profile 基本面與財報獲利能力區塊的排版與 DOM 節點層級。

## 3. 開發與修復流程指引 (Workflow)
1.  **隔離重現**：運行 `test_new_scraper_final.ts` 觀察目標股票（如 `2330` 或 `8069`）是否能正確解析數值。
2.  **DOM 診斷**：若解析出空值或錯位，運行 `test_new_structure.ts` 分析最新網頁 DOM 樹。
3.  **單體校驗**：在 scratch 指令碼內調校 cheerio 選擇器或 regex 比對邏輯，確認終端機輸出 100% 正確。
4.  **套用核心**：將調校完畢的解析邏輯套用回 `src/tools/stockScraper.ts`，並記錄至 `log.md`。
