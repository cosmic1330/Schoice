# REQ-005: 同步看板視窗聯動與手動管理規範

## 1. 需求描述 (Description)
建立主畫面與同步看板視窗之間穩定的狀態同步機制，並將視窗的開啟/關閉權利完全交還給使用者。

## 2. 行為劇本 (Behavior Scenarios - BDD)

### Scenario 1: 手動關閉看板的聯動感應
- **Given** 同步看板視窗已開啟。
- **When** 使用者點擊看板視窗右上角的 `X` (手動關閉)。
- **Then** 
  - 看板組件在銷毀前發送 `sync:worker_closed` 事件。
  - 主畫面接收到事件，並立即將按鈕狀態從「開啟看板」切換為「啟動同步引擎」。
  - 主畫面的同步統計數據重置。

### Scenario 2: 任務結束保持視窗開啟 (No Auto-Close)
- **Given** 同步任務已開始執行。
- **When** 發生下列任何一種停止情況：
  - 任務執行成功 (Success)。
  - 任務發生錯誤 (Error)。
  - 任務被手動停止 (Stopped)。
- **Then** 看板視窗必須 **保持開啟**，不得自動執行關閉動作，以便使用者進行最後的數據查閱。

## 3. 實作確認 (Implementation Checklist)
- [x] 移除 `SyncWorker` 中的 `close()` 自動觸發器。
- [x] 移除 `SyncCenter` 中的 `win.close()` 自動觸發器。
- [x] 在 `SyncWorker` 卸載時廣播 `sync:worker_closed`。
- [x] `SyncCenter` 實作全域 `sync:worker_closed` 監聽。

## 4. 狀態 (Status)
- **CreatedAt**: 2026-04-19
- **Status**: 🔵 Completed
