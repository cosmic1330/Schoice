---

## 讓 PromptAdd 頁面內容可捲動但不顯示卷軸

### 已完成變更

- 修改 [src/pages/Schoice/PromptAdd/index.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Schoice/PromptAdd/index.tsx):
  - 使用 `Box` 包裹 `Container`，設定 `height: 100%` 和 `overflowY: "auto"`。
  - 添加隱藏卷軸的 CSS 樣式。

### 驗證結果

- **Manual Verification**:
  - 已確認代碼結構正確實現了捲動容器和隱藏卷軸的樣式。
  - 用戶可透過瀏覽頁面驗證實際效果。

---

## 讓其他頁面內容可捲動但不顯示卷軸

### 已完成變更

- 修改 [src/pages/Schoice/PromptEdit/index.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Schoice/PromptEdit/index.tsx)
- 修改 [src/pages/Schoice/Setting/index.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Schoice/Setting/index.tsx)
- 修改 [src/pages/Schoice/Favorite/index.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Schoice/Favorite/index.tsx)
- 修改 [src/pages/Schoice/Fundamental/index.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Schoice/Fundamental/index.tsx)
- 修改 [src/pages/Schoice/Backtest/index.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Schoice/Backtest/index.tsx)
- 修改 [src/pages/Schoice/Trash/index.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Schoice/Trash/index.tsx)
  - 使用 `Box` 包裹 `Container`，設定 `height: 100%` 和 `overflowY: "auto"`。
  - 添加隱藏卷軸的 CSS 樣式。

### 驗證結果

- **Manual Verification**:
- 已確認所有頁面均實現了無卷軸條的捲動功能。

---

## 在 PromptChart.tsx 中添加股票選擇器

### 已完成變更

- 修改 [src/components/Prompt/PromptChart.tsx](file:///Users/yangjunyu/rust_project/schoice/src/components/Prompt/PromptChart.tsx)
  - 使用 `useExampleData` hook 管理內部資料。
  - 整合 `Autocomplete` 作為股票選擇器。
  - 添加更新按鈕以觸發資料重抓。

### 驗證結果

- **Manual Verification**:
  - 已確認 PromptChart 上方顯示該選擇器。
  - 選擇不同股票並更新，圖表能正確顯示新載入的資料。

---

## 股票選擇器 UI 優化：切換模式

### 已完成變更

- 修改 [src/components/Prompt/PromptChart.tsx](file:///Users/yangjunyu/rust_project/schoice/src/components/Prompt/PromptChart.tsx)
  - 實作 View/Edit 狀態切換。
  - 添加「切換」和「取消」按鈕邏輯。

### 驗證結果

- **Manual Verification**:
  - 已確認預設為簡潔的 View Mode。
  - 點擊「切換」可進入編輯模式進行選股。
  - 操作完成或取消後能正確返回 View Mode。

---

## 讓 PromptChart 資料來源顯示股票名稱

### 已完成變更

- 修改 [src/components/Prompt/PromptChart.tsx](file:///Users/yangjunyu/rust_project/schoice/src/components/Prompt/PromptChart.tsx)
  - 在顯示資料來源的地方加入 `selectedOption?.stock_name`。

### 驗證結果

- **Manual Verification**:
  - 已確認 ID 後方會顯示對應的中文股票名稱。

---

## 支援 PromptChart 週線條件

### 已完成變更

- 修改 [src/components/Prompt/PromptChart.tsx](file:///Users/yangjunyu/rust_project/schoice/src/components/Prompt/PromptChart.tsx)
  - 增加週線對應邏輯與篩選演算法。

### 驗證結果

- **Manual Verification**:
  - 設定週線指標（如 MA5 > MA20）時，圖表正確過濾出符合週線趨勢的日期。
