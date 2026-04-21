# REQ-007: 強化 Fundamental 頁面資料讀取優先序 (Sqlite First)

## 1. 現狀分析
*   **問題**: Fundamental 頁面在讀取基本面資料指標時，雖然有「本地優先」邏輯，但目前的判斷標準（只要本地有一筆就用本地）過於嚴格，導致若本地資料同步尚未完成（例如只有少數幾支股票），搜尋結果會大幅缺失，且未觸發雲端補充。
*   **遺留問題**: `StockFundamentalQueryBuilder.ts` 中的指標 Mapping 被部分移除，導致許多條件失效。

## 2. 預期行為 (BDD)
*   **Given**: 用戶進入 Fundamental 頁面進行選股。
*   **When**: 觸發搜尋邏輯。
*   **Then**: 
    1. 系統優先從 SQLite 獲取表格內容。
    2. 若 SQLite 資料量過少（例如 < 1000 筆，台灣股市主板約 1700+），則主動向 Supabase 獲取補充數據。
    3. 合併數據（以 SQLite 覆蓋 Supabase，確保本地修改優先）。

## 3. 實作任務表
- [ ] 補完 `src/classes/StockFundamentalQueryBuilder.ts` 的完整映射關係表。
- [ ] 修改 `getStocksByConditions` 的資料獲取邏輯：
    - [ ] 增加「資料量檢查機制」。
    - [ ] 實作「Local & Cloud 合併策略」。
- [ ] 確保 `index.tsx` 在載入策略時能正確顯示進度。

## 4. 程式碼變更預覽
```typescript
// 若本地資料不齊全，則從雲端補充
const localCount = localData.length;
if (localCount < 1500) {
  const { data: cloudData } = await supabase.from(table).select("*");
  // 合併...
}
```
