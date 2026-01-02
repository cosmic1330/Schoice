# 修復 Register/Content.tsx 中的 TypeScript 類型錯誤

## 問題描述

在 `src/pages/Register/Content.tsx` 中，`handleSubmit` 函數的參數類型被定義為 `React.FormEvent<HTMLFormElement>`，但由於 `StyledCard` 是基於 MUI `Box` 的組件，即使指定了 `component="form"`，TypeScript 仍預期其 `onSubmit` 處理器接收 `FormEvent<HTMLDivElement>`。這導致了類型不匹配錯誤。

## 擬議變更

### 1. 修改 `src/pages/Register/Content.tsx`

- 調整 `handleSubmit` 的參數類型為 `React.FormEvent` 或匹配 `HTMLDivElement`。
- 考慮到通用性，使用 `React.FormEvent` 是最簡單且有效的方案。

#### [MODIFY] [Content.tsx](file:///Users/yangjunyu/rust_project/schoice/src/pages/Register/Content.tsx)

```diff
-  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
+  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
   };
```

##

---

## 修復 Login/Register 頁面 StyledCard component="form" 類型錯誤 (2026-01-02)

### 擬議變更

- 調整 `StyledCard` 定義，恢復多態特性。
- 將登入/註冊邏輯從按鈕 `onClick` 遷移至 `form` 的 `onSubmit` 事件。
- 統一 `handleSubmit` 參數類型為 `React.FormEvent` 以相容 MUI 組件的 `onSubmit` 類型要求。

### 驗證計畫 ✅

- TypeScript 類型錯誤已消除。
- 確保按下 Enter 鍵或點擊按鈕均能觸發表單提交。

---

## 讓 PromptAdd 頁面內容可捲動但不顯示卷軸 (2026-01-02)

### 擬議變更

- 在 `src/pages/Schoice/PromptAdd/index.tsx` 中使用 `Box` 包裹 `Container`。
- 設定 `Box` 的高度為 `100%` 並開啟 `overflowY: "auto"`。
- 添加隱藏卷軸的 CSS 樣式 (針對 Webkit, Firefox, IE/Edge)。

### 驗證計畫 ✅

- 頁面內容超出視窗時可捲動。
- 捲動時看不到卷軸。

---

## 讓其他頁面內容可捲動但不顯示卷軸 (2026-01-02)

### 擬議變更

- 為以下頁面添加 `Box` 包裹 `Container`，並設定 `height: 100%`, `overflowY: "auto"` 以及隱藏卷軸樣式：
  - `src/pages/Schoice/PromptEdit/index.tsx`
  - `src/pages/Schoice/Setting/index.tsx`
  - `src/pages/Schoice/Favorite/index.tsx`
  - `src/pages/Schoice/Fundamental/index.tsx`
  - `src/pages/Schoice/Backtest/index.tsx`
  - `src/pages/Schoice/Trash/index.tsx`

### 驗證計畫 ✅

- 確保所有修改的頁面在內容超出時可捲動。
- 確保所有頁面捲動時不顯示卷軸。

---

## 在 PromptChart.tsx 中添加股票選擇器 (2026-01-02)

### 擬議變更

- 在 `src/components/Prompt/PromptChart.tsx` 中：
  - 引入 `Autocomplete`, `useExampleData` 等必要依賴。
  - 實現從 `store.json` 讀取股票選單的邏輯。
  - 增加股票選擇與更新按鈕的 UI。
  - 點擊更新時，更新全域 `exampleChartId` 並重新抓取範例資料。

### 驗證計畫 ✅

- 確保 PromptChart 上方出現股票選擇器。
- 確保選擇新股票並點擊更新後，圖表會根據新資料重繪。

---

## 股票選擇器 UI 優化：切換模式 (2026-01-02)

### 擬議變更

- 在 `src/components/Prompt/PromptChart.tsx` 中：
  - 增加 `isEditing` 狀態，預設為 `false`。
  - **預覽模式 (`!isEditing`)**：僅顯示目前股票 ID 與「切換」按鈕。
  - **編輯模式 (`isEditing`)**：顯示股票選擇器、「更新」與「取消」按鈕。
  - 點擊「切換」進入編輯模式；點擊「更新」或「取消」返回預覽模式。

### 驗證計畫 ✅

- 確保預設只顯示簡潔的資訊。
- 確保可透過點擊「切換」展開選擇器。
- 確保更新後或取消後能正確收合選擇器。

---

## 讓 PromptChart 資料來源顯示股票名稱 (2026-01-02)

### 擬議變更

- 在 `src/components/Prompt/PromptChart.tsx` 中：
  - 修改 `Typography` 顯示邏輯。
  - 除了 `exampleChartId` 外，同時顯示 `selectedOption.stock_name`。

### 驗證計畫 ✅

- 確保顯示格式為「圖表資料來源：[ID] [名稱]」（例如：圖表資料來源：1102 台泥）。

---

## 支援 PromptChart 週線條件 (2026-01-02)

### 擬議變更

- 在 `src/components/Prompt/PromptChart.tsx` 中：
  - 啟用 `weekMapping`。
  - 實作 `weeklyDates` 邏輯，篩選符合週線條件的日期。
  - 更新圖表匹配邏輯，納入 `weeklyDates` 判斷。

### 驗證計畫 ✅

- 確保設定週線條件後，圖表能正確在對應日期標示紅線。
