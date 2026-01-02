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
