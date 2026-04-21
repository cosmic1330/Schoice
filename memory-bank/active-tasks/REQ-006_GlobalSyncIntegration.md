# REQ-006: 同步引擎全域整合與清爽介面規範

## 1. 需求描述 (Description)
整合 BottomBar 與全新 SyncEngine，取代舊有的更新機制，並在保持介面簡潔 (Clean UI) 的前提下實現數據總量的異步更新。

## 2. 行為劇本 (Behavior Scenarios - BDD)

### Scenario 1: 從 BottomBar 快速啟動
- **Given** 使用者處於 Schoice 主頁面。
- **When** 點擊更新按鈕。
- **Then** 
  - 若看板未開啟，則建立並啟動 `SyncWorker`。
  - 若看板已開啟，則將視窗置頂並發起新的同步指令。

### Scenario 2: 非即時性的數據數字同步
- **Given** 同步引擎正在執行 (`syncing` 或 `scanning`)。
- **When** 時間每經過 10 秒鐘。
- **Then** `DataCount` 組件應自動向資料庫查詢最新的 `DailyDeal` 數量並刷新顯示。

### Scenario 3: 狀態感知的簡約 UI
- **Given** 引擎切換不同狀態。
- **When** 查看 `UpdateDeals` 按鈕。
- **Then** 
  - `syncing`: 顯示旋轉圖示，隱藏冗餘文字以「保持清爽」。
  - `cooling`: 顯示暖色載入圈，提示處於規避模式。
  - `idle`: 顯示標準同步圖示。

## 3. 實作確認 (Implementation Checklist)
- [x] 抽離 `useSyncLaunch` 複用邏輯。
- [x] `DataCount` 實作 10s 週期的 `setInterval` 刷新機制。
- [x] `UpdateDeals` 移除舊版 `useHighConcurrencyDeals`。
- [x] `SyncCenter` 同步切換至新 Hook 實作。

## 4. 狀態 (Status)
- **CreatedAt**: 2026-04-19
- **Status**: 🔵 Completed
