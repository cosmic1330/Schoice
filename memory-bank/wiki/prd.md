# 產品需求文件 (Product Requirements Document)

## 總覽 (Overview)
Schoice 是一個允許使用者透過組合多個條件 (Prompts) 來建立自定義選股策略的軟體，可視為一個選股/策略決策輔助工具。

## 核心功能 (Core Features)
1. **跨時框策略組合**: 支援日線 (daily)、週線 (weekly)、小時線 (hourly) 的條件設定。
2. **靈活條件建構 (特殊規則約束)**:
   - 系統依賴 `StorePrompt` 型別作為條件建置最小單位 (定義了時間, 指標, 運算子的比較)。
   - 系統依賴 `PromptItem` 封裝整個跨時框 (`PromptValue`) 策略，以執行過濾。
   - 關於此部分的詳細型別與邏輯規則，已列為系統全域約束，參見 `REQ-002`。
3. **多元指標庫**:
   - 基礎價格與成交量。
   - 移動平均線 (MA/EMA 及扣抵值)。
   - 技術指標 (MACD, RSI, KD, 布林通道等)。
   - 一目均衡表 (轉換線, 基準線等) 及市場指標。

## 進階應用 (Advanced Features)
- **自動化 SQL 查詢生成 (Query Generator)**: 系統設計目標包含基於使用者需求，自動對應資料庫結構來生成 SQL 查詢語句 (Automatically generate SQL queries based on the database)，然後將查詢結果視覺化至畫面的表格與 UI 系列中。

## 目標受眾 (Target Audience)
需要透過技術指標、價量資料建立及過濾投資標的的散戶或專業分析人員。
