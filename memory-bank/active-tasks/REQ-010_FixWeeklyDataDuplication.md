# REQ-010: 修復週資料重複與盤中寫入異常

## 1. 說明
使用者回報在盤中執行同步後，盤後再次同步會導致週資料產生重複紀錄（多出一筆）。這是因為 `SyncEngine` 目前的「隔日/盤中寫入限制」邏輯不夠精確，且 Yahoo Finance 的週資料時間戳在週內可能會變動（例如從週初變為當日），導致 `INSERT OR REPLACE` 無法正確覆蓋舊資料。

## 2. 核心問題
- `isMarketOpen` 判定過於簡單：00:00 - 13:45 一律視為盤中，包含了週末與週一凌晨。
- 週資料過濾邏輯：僅依賴 `isMarketOpen` 且未區分週資料的特殊性（週資料在週五收盤前都是 incomplete）。
- 緩衝區邏輯：`thresholdT` (3期緩衝) 會強制重複寫入最近三筆，若這三筆中有日期變動的週資料，就會產生重複。

## 3. 被影響組件
- `src/classes/SyncEngine.ts`: 同步邏輯主體。
- `src/components/ResultTable/Charts/WeeklyUltraTinyLineChart.tsx`: 呈現異常 K 棒。

## 4. 行為劇本 (BDD)

### 場景 1：盤中保護機制 (Weekly)
- **Given** 目前是週二 10:00 (台股開盤中)
- **When** 執行週資料同步
- **Then** payload 中最後一筆資料（當週）應被強制排除，不寫入資料庫

### 場景 2：收盤後最終資料寫入 (Weekly)
- **Given** 目前是週五 20:00 (週五收盤後，週資料已定型)
- **When** 執行週資料同步
- **Then** payload 中最後一筆資料應被寫入資料庫

### 場景 3：週末同步
- **Given** 目前是週六 10:00 (週末休息)
- **When** 執行週資料同步
- **Then** 應正常同步週五定型的週資料，且不應因為 `isMarketOpen` 為錯誤的 true 而判定為盤中跳過

## 5. 預期結果
- 資料庫中的 `weekly_deal` 不再出現同一週內有多個日期的情況。
- 迷你線圖顯示正常。
