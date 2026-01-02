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

---

## 優化 Ichimoku Cloud 計算效能

### 已完成變更

- 修改 [src/pages/Detail/IchimokuCloud/ichimoku.ts](file:///Users/yangjunyu/rust_project/schoice/src/pages/Detail/IchimokuCloud/ichimoku.ts)
  - 使用 `@ch20026103/anysis` 庫的 `Ichimoku` 類別替換原有的手動計算邏輯。
  - 將 O(N\*M) 的迴圈計算優化為 O(N) 的串流計算。

### 驗證結果

- **Manual Verification**:
  - 已確認代碼編譯無誤。
  - 使用者應驗證 Ichimoku Cloud 頁面載入速度與圖表顯示正確性。

### 進一步優化 IchimokuCloud.tsx 組件

### 已完成變更

- 修改 [src/pages/Detail/IchimokuCloud/IchimokuCloud.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Detail/IchimokuCloud/IchimokuCloud.tsx)
  - 分離 `useMemo` 依賴：
    - `fullData`：僅在 `deals` 變更時重新計算完整的 Ichimoku 和信號邏輯。
    - `chartData`：在 `visibleCount` 或 `rightOffset` 變更時，僅進行陣列切片 (Slice)，避免重複進行昂貴的數學運算。
  - 修正 Checklist 與 Score 的資料來源，直接使用 `fullData` 來確保分析結果總是基於最新資料，不受縮放影響。

### 驗證結果

- **Manual Verification**:
  - 使用者應嘗試縮放和拖曳圖表，預期操作流暢度有顯著提升。
  - 確認信號箭頭與右側清單內容正確。
