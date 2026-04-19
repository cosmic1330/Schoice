# REQ-004: Yahoo 同步引擎抗性與自動修復 (Resilience & Auto-Resume)

## 1. 需求描述 (Description)
解決 Yahoo Finance 同步過程中因頻繁請求導致的 IP 封鎖與 RangeError (Status 0) 問題。核心目標是建立一套具備「智慧熔斷」與「原地自動恢復」能力的系統，確保資料抓取過程無需人工干預。

## 2. 行為劇本 (Behavior Scenarios - BDD)

### Scenario 1: 自動偵測封鎖並進入冷卻 (Circuit Breaker)
- **Given** 同步引擎正在執行且尚未被封鎖。
- **When** Yahoo 伺服器回傳 403, 429 狀態碼或觸發 RangeError (Status 0/IP 封鎖)。
- **Then** 
  - 系統應立刻設定 **3 分鐘** 的全域安全冷卻期。
  - 同步狀態切換為 `cooling`。
  - 同步看板應顯示 **黃色脈動警告橫幅**。
  - 日誌顯示：`[BLOCK] 偵測到伺服器存取過於頻繁，進入安全冷卻期...`。

### Scenario 2: 任務原地立定 (Pre-emptive Block)
- **Given** 全域冷卻期已生效，且有 1 個同步任務執行中。
- **When** 任務遇到封鎖後，重新嘗試執行前。
- **Then** 任務在執行任何資料庫或網路動作前，應先於路口「原地立定」並等待冷卻結束。

### Scenario 3: 冷卻結束後的自動恢復 (Auto-Resume)
- **Given** 系統處於 `cooling` 狀態且倒數結束。
- **When** 第一個任務檢測到冷卻時間歸零。
- **Then** 
  - 狀態切換回 `syncing`。
  - 廣播日誌：`冷卻結束，恢復同步任務。` (僅顯示一次)。
  - 從剛才出錯或立定的股票「原地」接續抓取，不跳過股票、不重啟 flow。

### Scenario 4: 防報錯自動關閉機制 (Safe Window Maintenance)
- **Given** 同步看板視窗已開啟。
- **When** 發生 `error` 或進入 `cooling` 狀態。
- **Then** 視窗應保持開啟狀態供使用者監控，不得執行自動關閉。

## 3. 實作確認 (Implementation Checklist)
- [x] `logFetch.ts` 統一拋出帶有 `[BLOCK]` 前綴的錯誤。
- [x] `SyncEngine.ts` 實作預防性 `waitForCoolDown` 檢查。
- [x] `SyncWorker` 實作黃色警告橫幅與倒數 UI。
- [x] `SyncCenter` 調整自動關閉邏輯，僅在 `success` 時觸發 5 秒延遲關閉。

## 4. 狀態 (Status)
- **CreatedAt**: 2026-04-19
- **Status**: 🔵 Completed (功能已上線並驗證成功)
