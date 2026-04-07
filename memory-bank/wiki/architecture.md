# 系統架構 (Architecture)

## 整體設計 (High-Level Design)
Schoice 採用 Tauri 架構，結合網頁前端 (React) 與 Rust 後端，打造跨平台桌面應用程式。

- **前端 (Frontend)**: 
  負責 UI 呈現、使用者互動、多語系 (i18next)、並透過 Zustand 管理策略組合與選單狀態。自訂策略建構器會產出符合 `PromptItem` 的架構供後端或本地儲存使用。
  強烈依賴 `React.memo` 與本地快取 (`useQueryCache`, `useChartData`) 以維持大表單 (`ResultTable`) 之頁面效能，防止重渲染瀑布。
- **後端 (Backend & Database)**: 
  Schoice 採取「雙軌資料庫架構」分擔職責：
  1. **本地端 (SQLite via Tauri SQL Plugin)**: 存放每日/週/小時的巨量 K 線與技術指標 (`deals`, `skills` 等資料表)，供快速回測與圖表渲染。
  2. **雲端端 (Supabase)**: 負責會員登入、使用者收藏清單 (`watch_stock`)、自訂策略保存 (`user_prompts`)、以及更新較不頻繁的基本面與籌碼面資料 (`recent_fundamental`, `investor_positions` 等)。

## 專案核心特徵
- `src/` : Frontend React 源碼，含全局資料型別定義檔 `src/types.ts`。
- `src-tauri/` : Backend Tauri (Rust) 源碼。
- **核心資料引擎約束**: 
  系統強烈依賴自有的規則結構，包含單一條件 `StorePrompt` 與完整策略封裝 `PromptItem`。任何更動或策略自動生成都須遵守此一特殊規則 (參見 `REQ-002`)。
- **效能與雙軌串接限制**:
  系統嚴格要求 React 渲染效能記憶化手段，且分離 SQLite 即時計算與 Supabase 基本面雲端儲存，相關邊界設計請參閱全域約束 `REQ-003`、`REQ-004`。
