import { useCallback, useRef } from "react";

interface QueryCacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

// 全域快取，避免不同組件實例重複查詢
const globalQueryCache = new Map<string, QueryCacheEntry>();

// 快取過期時間（毫秒）
const CACHE_EXPIRE_TIME = 30 * 1000; // 30 秒

export default function useQueryCache() {
  const pendingQueries = useRef(new Map<string, Promise<any>>());

  const getCachedQuery = useCallback(
    async (cacheKey: string, queryFn: () => Promise<any>): Promise<any> => {
      const now = Date.now();
      const cached = globalQueryCache.get(cacheKey);

      // 檢查快取是否存在且未過期
      if (cached && now - cached.timestamp < CACHE_EXPIRE_TIME) {
        return cached.data;
      }

      // 檢查是否有相同的查詢正在進行中
      const pendingQuery = pendingQueries.current.get(cacheKey);
      if (pendingQuery) {
        return pendingQuery;
      }

      // 執行查詢並快取結果
      const queryPromise = queryFn()
        .then((data) => {
          // 更新快取
          globalQueryCache.set(cacheKey, {
            data,
            timestamp: now,
          });

          // 清除進行中的查詢記錄
          pendingQueries.current.delete(cacheKey);

          return data;
        })
        .catch((error) => {
          // 查詢失敗時也要清除進行中的查詢記錄
          pendingQueries.current.delete(cacheKey);
          throw error;
        });

      // 記錄進行中的查詢
      pendingQueries.current.set(cacheKey, queryPromise);

      return queryPromise;
    },
    []
  );

  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      // 清除匹配模式的快取
      for (const key of globalQueryCache.keys()) {
        if (key.includes(pattern)) {
          globalQueryCache.delete(key);
        }
      }
    } else {
      // 清除所有快取
      globalQueryCache.clear();
    }
  }, []);

  return { getCachedQuery, clearCache };
}
