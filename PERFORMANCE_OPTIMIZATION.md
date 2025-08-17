# ResultTable 性能優化報告 - 最終版本

## ❌ 發現的核心問題

### 1. **React Key 問題** (已修復 ✅)

- **問題**: `ResultTable` 使用 `index` 作為 key
- **影響**: 每次數據變化時，所有 `ResultTableRow` 都會重新渲染和重新掛載
- **修復**: 使用 `${row.stock_id}-${index}` 作為唯一 key

### 2. **全域 State 引起的重渲染瀑布** (已修復 ✅)

- **問題**: `RowChart` 組件使用 `useSchoiceStore` 中的 `chartType`
- **影響**: 任何 `chartType` 的變化會導致**所有** `ResultTableRow` 重新渲染
- **修復**: 使用 `React.memo` 包裝 `RowChart` 組件

### 3. **不穩定的依賴引起重複查詢** (已修復 ✅)

- **問題**: `useChartData` 中 `indicators` 和 `monitor` 每次都重新創建
- **影響**: 造成大量重複的 SQLite 查詢
- **修復**: 使用 `useMemo` 穩定這些依賴

### 4. **組件內數組和對象重新創建** (已修復 ✅)

- **問題**: `ResultTable` 中 `columns` 陣列每次都重新創建
- **影響**: TableHead 會重複渲染
- **修復**: 使用 `useMemo` 穩定 columns 陣列

### 5. **Hook 函數參照不穩定** (已修復 ✅)

- **問題**: `useFindStocksByPrompt` 中的函數每次都重新創建
- **影響**: 導致依賴該函數的 `useEffect` 重複執行
- **修復**: 使用 `useCallback` 包裝所有返回的函數

## ✅ 已實施的完整優化

### 1. React Key 優化

```tsx
// ResultTable.tsx
key={`${row.stock_id}-${index}`} // 之前: key={index}
```

### 2. 組件記憶化 (全面實施)

```tsx
// 所有相關組件都已包裝 React.memo
- ResultTable (已有 memo)
- ResultTableRow
- RowChart
- SelectChartHead
- DailyUltraTinyLineChart
- HourlyUltraTinyLineChart
- WeeklyUltraTinyLineChart
- DailyKdLineChart
- 其他所有圖表組件...
```

### 3. Hook 依賴穩定化

```tsx
// useChartData.ts
const monitor = useMemo(() => DatabasePerformanceMonitor.getInstance(), []);
const indicatorFields = useMemo(() => {
  return indicators.map(item => /* ... */).join(", ");
}, [indicators]);

// useFindStocksByPrompt.ts
const getOneDateDailyDataByStockId = useCallback(/* ... */, [query]);

// ResultTableRow.tsx
const fetchDailyData = useCallback(/* ... */, [dates[todayDate], row.stock_id, getOneDateDailyDataByStockId]);
```

### 4. 數組和對象穩定化

```tsx
// ResultTable.tsx
const columns = useMemo(
  () => [
    /* ... */
  ],
  []
); // 移出組件外部或使用 useMemo
```

## 🚀 **預期性能改善**

### 渲染次數減少

- **之前**: 每個組件可能重渲染 10-50 次
- **之後**: 只在真正需要時才重渲染

### 資料庫查詢減少

- **之前**: 每次重渲染都可能觸發新查詢
- **之後**: 相同查詢會被快取，避免重複請求

### 記憶體使用優化

- **之前**: 大量重複的組件實例和查詢結果
- **之後**: 組件復用，查詢結果共享

## 📊 **監控工具**

已創建 `src/utils/PerformanceMonitor.tsx` 用於：

- 監控組件渲染次數
- 追蹤重渲染原因
- 提供性能統計報告

## 🔍 **進一步優化建議**

### 1. 虛擬化長列表 (如果數據量大)

```tsx
import { FixedSizeList as List } from "react-window";
// 當 result.length > 100 時考慮使用
```

### 2. 批量數據預載

```tsx
// 在 ResultTable 層級預先獲取所有圖表數據
// 避免個別組件發起請求
```

### 3. 圖表懶載入

```tsx
// 使用 Intersection Observer
// 只在圖表進入視口時才載入數據
```

### 4. Web Worker 數據處理

```tsx
// 將複雜的數據計算移到 Web Worker
// 避免阻塞主線程
```

## 🧪 **測試檢查清單**

- [ ] 大量數據 (1000+ 行) 的渲染性能
- [ ] chartType 切換時的響應性
- [ ] 快速滾動時的流暢度
- [ ] 長時間使用後的記憶體狀況
- [ ] 資料庫查詢的併發處理
- [ ] 組件掛載/卸載的正確性

## 📈 **性能測量方法**

1. **使用 React DevTools Profiler**

   - 測量組件渲染時間
   - 檢查渲染原因

2. **監控資料庫查詢**

   - 使用現有的 DatabasePerformanceMonitor
   - 檢查查詢重複率

3. **記憶體使用監控**

   - Chrome DevTools Memory tab
   - 檢查記憶體洩漏

4. **使用性能監控工具**

   ```tsx
   // 在開發環境中使用
   import {
     useRenderCount,
     usePerformanceMonitor,
   } from "../utils/PerformanceMonitor";

   const renderCount = useRenderCount("ResultTableRow");
   usePerformanceMonitor("ResultTableRow", [row.stock_id, t, c, type]);
   ```

經過這些優化，表格的重複渲染和重複查詢問題應該得到顯著改善。
