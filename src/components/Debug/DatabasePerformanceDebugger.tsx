import { Box, Button, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import DatabasePerformanceMonitor from "../../utils/DatabasePerformanceMonitor";

export default function DatabasePerformanceDebugger() {
  const [stats, setStats] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const monitor = DatabasePerformanceMonitor.getInstance();

  // 只在開發環境顯示
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (isVisible) {
        setStats(monitor.getStats());
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, monitor]);

  const handleToggle = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setStats(monitor.getStats());
    }
  };

  const handleLogStats = () => {
    monitor.logStats();
  };

  const handleReset = () => {
    monitor.reset();
    setStats([]);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 10000,
        maxWidth: "600px",
      }}
    >
      <Button
        variant="contained"
        size="small"
        onClick={handleToggle}
        sx={{ mb: 1 }}
      >
        DB Stats ({stats.reduce((sum, stat) => sum + stat.count, 0)})
      </Button>

      {isVisible && (
        <Paper
          sx={{
            p: 2,
            maxHeight: "400px",
            overflow: "auto",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button size="small" onClick={handleLogStats}>
              Log to Console
            </Button>
            <Button size="small" onClick={handleReset}>
              Reset
            </Button>
          </Box>

          <Typography variant="h6" sx={{ mb: 1 }}>
            Database Query Statistics
          </Typography>

          {stats.length === 0 ? (
            <Typography>No queries recorded</Typography>
          ) : (
            stats.slice(0, 10).map((stat, index) => (
              <Box key={index} sx={{ mb: 1, fontSize: "0.8rem" }}>
                <Typography
                  variant="body2"
                  sx={{ color: stat.count > 5 ? "#ff6b6b" : "inherit" }}
                >
                  <strong>Count: {stat.count}</strong> | Avg:{" "}
                  {stat.avgTime.toFixed(1)}ms | Total:{" "}
                  {stat.totalTime.toFixed(1)}ms
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.7rem",
                    opacity: 0.8,
                    wordBreak: "break-all",
                  }}
                >
                  {stat.query.substring(0, 80)}...
                </Typography>
              </Box>
            ))
          )}
        </Paper>
      )}
    </Box>
  );
}
