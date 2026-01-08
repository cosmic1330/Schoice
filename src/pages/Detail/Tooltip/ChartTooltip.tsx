import { Typography } from "@mui/material";

// Helper to format YYYYMMDD number to Date string
const formatDateTick = (tick: number | string) => {
  const str = tick.toString();
  if (str.length === 8) {
    return `${str.slice(0, 4)}/${str.slice(4, 6)}/${str.slice(6)}`;
  }
  return str;
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  showSignals?: boolean;
  hideKeys?: string[];
  dateFormatter?: (tick: number | string) => string;
  sortKeys?: string[];
}

const ChartTooltip = ({
  active,
  payload,
  label,
  showSignals = true,
  hideKeys = [],
  dateFormatter = formatDateTick,
}: ChartTooltipProps) => {
  if (active && payload && payload.length && label !== undefined) {
    const data = payload[0].payload;
    const dateStr = dateFormatter(label);

    // Sort payload: Signal entries first, then Indicators
    const sortedPayload = [...payload].sort((a, b) => {
      const signalKeys = [
        "trueBreakout",
        "fakeBreakout",
        "accumulation",
        "exitWeakness",
      ];
      const isSignalA = signalKeys.includes(a.dataKey);
      const isSignalB = signalKeys.includes(b.dataKey);
      if (isSignalA && !isSignalB) return -1;
      if (!isSignalA && isSignalB) return 1;
      return 0;
    });

    return (
      <div
        style={{
          backgroundColor: "rgba(20, 20, 30, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(4px)",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          padding: "12px",
          textAlign: "left",
          color: "#fff", // Default text color
        }}
      >
        <p
          style={{
            color: "#eee",
            marginBottom: 8,
            margin: 0,
            fontWeight: "bold",
            fontSize: "0.9rem",
          }}
        >
          {dateStr}
        </p>

        {showSignals && data.signalReason && (
          <div
            style={{
              marginTop: 8,
              marginBottom: 8,
              padding: "4px 8px",
              backgroundColor: "rgba(33, 150, 243, 0.2)",
              borderRadius: 4,
              borderLeft: "4px solid #2196f3",
            }}
          >
            <Typography
              variant="body2"
              fontWeight="bold"
              color="#64b5f6"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {data.signalReason}
            </Typography>
          </div>
        )}

        {sortedPayload.map((entry: any, index: number) => {
          // Filter out internal/invisible items or secondary signal indicators
          if (hideKeys.includes(entry.dataKey)) return null;
          if (entry.value === null || entry.value === undefined) return null;

          // Ensure color is visible (not black) and valid
          const itemColor =
            entry.color &&
            entry.color !== "#000" &&
            entry.color !== "#000000" &&
            entry.color !== "none"
              ? entry.color
              : "#fff";

          return (
            <p
              key={index}
              style={{
                color: itemColor,
                margin: "2px 0",
                fontSize: "0.8rem",
                display: "flex",
                justifyContent: "space-between",
                minWidth: "120px",
              }}
            >
              <span>{entry.name}:</span>
              <span style={{ marginLeft: "12px", fontWeight: "bold" }}>
                {typeof entry.value === "number"
                  ? entry.value.toFixed(2)
                  : entry.value}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default ChartTooltip;
