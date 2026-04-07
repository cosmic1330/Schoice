# 技術堆疊 (Tech Stack)

目前的 SDK 與函式庫版本定義。

## Frontend (前端)
- **架構/工具**: React 19, Vite 7, TypeScript, Zustand (狀態管理), React Router 7, SWR
- **UI/樣式**: Material UI (MUI), Emotion, Framer Motion (動畫)
- **視覺化**: Recharts
- **其他**: i18next (多語系), React Hook Form, React Toastify

## Backend / Framework (後端與框架)
- **核心框架**: Tauri 2
- **Tauri Plugins**: Clipboard, Dialog, File System (fs), HTTP, Log, Notification, Opener, Process, Shell, SQL (核心，用於連接本地 SQLite), Store, Updater
- **雲端資料庫/BaaS**: Supabase (`@supabase/supabase-js`) 負責 Auth 與 Cloud Postgres (用戶資料/基本面)

## 核心分析依賴
- `@ch20026103/anysis`: 自有的分析/指標庫
- `@ch20026103/backtest-lib`: 回測相關工具
