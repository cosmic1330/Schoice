interface QueryStats {
  query: string;
  count: number;
  lastExecuted: number;
  totalTime: number;
  avgTime: number;
}

class DatabasePerformanceMonitor {
  private static instance: DatabasePerformanceMonitor;
  private queryStats = new Map<string, QueryStats>();
  private enabled = process.env.NODE_ENV === "development";

  static getInstance(): DatabasePerformanceMonitor {
    if (!DatabasePerformanceMonitor.instance) {
      DatabasePerformanceMonitor.instance = new DatabasePerformanceMonitor();
    }
    return DatabasePerformanceMonitor.instance;
  }

  startQuery(query: string): () => void {
    if (!this.enabled) return () => {};

    const startTime = performance.now();
    const queryKey = this.normalizeQuery(query);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const stats = this.queryStats.get(queryKey) || {
        query: queryKey,
        count: 0,
        lastExecuted: 0,
        totalTime: 0,
        avgTime: 0,
      };

      stats.count += 1;
      stats.lastExecuted = Date.now();
      stats.totalTime += duration;
      stats.avgTime = stats.totalTime / stats.count;

      this.queryStats.set(queryKey, stats);

      // 警告重複查詢
      if (stats.count > 5 && duration < 100) {
        console.warn(`🔥 Potential duplicate query detected:`, {
          query: queryKey,
          count: stats.count,
          avgTime: stats.avgTime.toFixed(2) + "ms",
        });
      }
    };
  }

  private normalizeQuery(query: string): string {
    // 移除具體的參數值，只保留查詢結構
    return query
      .replace(/stock_id = \d+/g, "stock_id = ?")
      .replace(/t <= '[^']+'/g, "t <= '?'")
      .replace(/ts <= '[^']+'/g, "ts <= '?'")
      .replace(/\s+/g, " ")
      .trim();
  }

  getStats(): QueryStats[] {
    return Array.from(this.queryStats.values()).sort(
      (a, b) => b.count - a.count
    );
  }

  logStats(): void {
    if (!this.enabled) return;

    const stats = this.getStats();
    if (stats.length === 0) return;

    console.group("📊 Database Query Statistics");
    console.table(
      stats.slice(0, 10).map((stat) => ({
        Query: stat.query.substring(0, 60) + "...",
        Count: stat.count,
        "Avg Time (ms)": stat.avgTime.toFixed(2),
        "Total Time (ms)": stat.totalTime.toFixed(2),
      }))
    );
    console.groupEnd();
  }

  reset(): void {
    this.queryStats.clear();
  }
}

export default DatabasePerformanceMonitor;
