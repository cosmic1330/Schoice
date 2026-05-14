# REQ-015: 修正 Yahoo 基本面爬蟲同步失效及改版適應

## 1. 需求背景與問題分析
在系統自動同步股票基本面與籌碼資訊時，發生跨月後無法取得新月份營收與第一季 EPS 的狀況。經追查確認有兩大主因：
1. **網頁 DOM 結構改版**：Yahoo 股市的營收表 (`/revenue`) 改版為 `.table-body-wrapper .table-row`，導致原有的 `.table-grid` 選擇器抓取為空。
2. **網址編碼與過期判定**：爬蟲原先未支援上櫃公司 (`.TWO`)，且同步引擎對於 `has_ext_data` 的檢查只要曾經成功抓取過便標記為 `fresh`，缺乏跨月份自動偵測資料庫營收落後的過期判定。

## 2. Behavior Scenarios (BDD)

### 劇本一：營收與基本面爬取適應新版 DOM 與市場別
- **Given**: 目標股票屬於上櫃公司（如 6223），且 Yahoo 股市營收表採用新版 `.table-row` 結構。
- **When**: 呼叫 `fetchStockExtData` 並傳入 `marketType: "上櫃"` 時。
- **Then**: 爬蟲正確使用 `.TWO` 後綴發送 HTTP 請求，並透過解析 `.table-row` 內部的 `ul li` 清單，精確提取當月營收、月增率、年增率與累計營收。

### 劇本二：跨月份同步引擎過期判定
- **Given**: 現在時間為五月中旬，但資料庫中目標股票的 `revenue_last_month` 仍為三月份。
- **When**: 系統啟動 `SyncEngine.start()` 進行全市場掃描時。
- **Then**: 同步引擎自動比對當前月份與最後營收月份，判定該股票進度落後，將其標記為 `stale` 並啟動基本面同步。

## 3. 架構與實作指引
- `src/tools/stockScraper.ts`：更新 `scrapeYahooExtData` 支援 `marketType` 參數與新舊版 DOM 解析雙軌相容。
- `src/classes/SyncEngine.ts`：更新 `start()` 函數中的掃描判定，引入營收落後檢查邏輯。
