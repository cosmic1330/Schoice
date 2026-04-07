---
id: G-003
type: Global Constraint
status: Active
last_updated: 2026-04-07
---

# G-003: 資料庫雙軌架構原則 (SQLite & Supabase)

## Description
專案的資料儲存體系被嚴格劃分為「本地龐大時序資料 (SQLite)」與「雲端用戶與基本面資料 (Supabase)」兩部分，開發與串接時不可混殽其職責。

### 1. 本地端技術線圖庫 (SQLite / Cloud Schema 映射)
主要處理 K 線與計算後的技術指標結果，資料量巨大：
- **基礎資料表**: `stock`
- **K線時序表**: `daily_deal`, `weekly_deal`, `hourly_deal`，含有開高低收量 (o, h, l, c, v)。
- **技術指標表**: `daily_skills`, `weekly_skills`, `hourly_skills`，內含多達 50+ 欄位的衍生指標 (MA, MACD, KD, RSI, 布林通道等)。
- **操作原則**: 這部分通常是由外部運算後匯入，前端查詢時透過 Tauri SQL plugin 以唯讀與快取為原則執行。

### 2. 雲端互動與基本面庫 (Supabase Schema)
主要處理「用戶狀態」與「基本/籌碼面財務資料」：
- **使用者與權限**: 整合 Supabase Auth，包含 `profiles` 紀錄方案、`user_prompts` 儲存用戶的自訂選股條件。
- **關注清單**: `watch_stock`，採用 `user_id` 與 `stock_id` 做複合主鍵管理。
- **公司基本面**: `financial_metric` (如本益比、殖利率)。
- **進階財報與籌碼**: `recent_fundamental` (最近四季 EPS、最近四個月營收與年增率等)、`investor_positions` (最近四周大戶與外資持股比)。
- **操作原則**: 這部分必須嚴格遵循 Supabase 的 RLS (Row-Level Security) 機制，確保只能讀改當下 Authentication 使用者的資料；財務資訊則為全域唯讀呈現。

## History
- **v1 (Current):** 補齊基於 cloud_schema.sql 與 superbase_schema.sql 所設立雙軌資料庫分離原則 - Updated on 2026-04-07 due to User Input

## Technical Notes
- Linked Source: `[[../../cloud_schema.sql]]`, `[[../../superbase_schema.sql]]`
