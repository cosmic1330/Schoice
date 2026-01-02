/**
 * ResultTable 性能分析與診斷工具
 * 用於監控組件渲染次數和原因
 */

import React, { useEffect, useRef } from "react";

// 渲染次數計數器
const renderCounts = new Map<string, number>();

// 渲染計數 Hook
export const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    renderCounts.set(componentName, renderCount.current);
  });

  return renderCount.current;
};

// 性能監控 Hook
export const usePerformanceMonitor = (
  componentName: string,
  dependencies: any[]
) => {
  const prevDepsRef = useRef<any[] | undefined>(undefined);

  useEffect(() => {
    if (prevDepsRef.current) {
      const changedDeps: string[] = [];
      dependencies.forEach((dep, index) => {
        if (prevDepsRef.current![index] !== dep) {
          changedDeps.push(
            `dep[${index}]: ${prevDepsRef.current![index]} -> ${dep}`
          );
        }
      });

      if (changedDeps.length > 0) {
        console.log(`📊 ${componentName} re-rendered due to:`, changedDeps);
      }
    }

    prevDepsRef.current = dependencies;
  });
};

// 獲取所有組件的渲染統計
export const getRenderStats = () => {
  return Object.fromEntries(renderCounts);
};

// 重置統計
export const resetRenderStats = () => {
  renderCounts.clear();
};

// 性能測試組件
export const PerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    // 每 5 秒顯示一次統計
    const interval = setInterval(() => {
      const stats = getRenderStats();
      if (Object.keys(stats).length > 0) {
        console.table(stats);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
};

// 使用範例：
// 在 ResultTableRow 中添加：
// const renderCount = useRenderCount('ResultTableRow');
// usePerformanceMonitor('ResultTableRow', [row.stock_id, t, c, type]);
