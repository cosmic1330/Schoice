import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Step,
  StepButton,
  Stepper,
  Typography,
} from "@mui/material";
import { useContext, useMemo, useState, useRef, useEffect } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import ema from "../../../cls_tools/ema";
import AvgCandlestickRectangle from "../../../components/RechartCustoms/AvgCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";

interface AvgMaChartData
  extends Partial<{
    t: number | string;
    o: number | null;
    h: number | null;
    l: number | null;
    c: number | null;
    v: number | null;
  }> {
  ema5: number | null;
  ema10: number | null;
  ma60: number | null;
  volMa20?: number | null;
}

type CheckStatus = "pass" | "fail" | "manual";

interface StepCheck {
  label: string;
  status: CheckStatus;
}

interface AvgMaStep {
  label: string;
  description: string;
  checks: StepCheck[];
}

interface SignalPoint extends AvgMaChartData {
  type: "golden" | "death";
  subType: "trend" | "rebound"; // trend = with MA60, rebound = against MA60
}

export default function AvgMaKbar() {
  const deals = useContext(DealsContext);
  const [activeStep, setActiveStep] = useState(0);

  // Zoom & Pan Control
  const [visibleCount, setVisibleCount] = useState(160);
  const [rightOffset, setRightOffset] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const startOffset = useRef(0);


  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = Math.sign(e.deltaY);
      const step = 4;

      setVisibleCount((prev) => {
        const next = prev + delta * step;
        const minBars = 30;
        const maxBars = deals.length > 0 ? deals.length : 1000;
        
        if (next < minBars) return minBars;
        if (next > maxBars) return maxBars;
        return next;
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastX.current = e.clientX;
      startOffset.current = rightOffset;
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      
      const deltaX = e.clientX - lastX.current;
      const sensitivity = visibleCount / (container.clientWidth || 500); 
      const barDelta = Math.round(deltaX * sensitivity * 1.5); 
      
      if (barDelta === 0) return;

      setRightOffset((prev) => {
        let next = prev + barDelta;
        if (next < 0) next = 0;
        const maxOffset = Math.max(0, deals.length - visibleCount); 
        if (next > maxOffset) next = maxOffset;
        return next;
      });
      
      lastX.current = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [deals.length, visibleCount, rightOffset]);

  const chartData = useMemo((): AvgMaChartData[] => {
    if (!deals || deals.length === 0) return [];

    let ema5_data = ema.init(deals[0], 5);
    let ema10_data = ema.init(deals[0], 10);

    const response: AvgMaChartData[] = [];

    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i];

      // EMA calc
      if (i > 0) {
        ema5_data = ema.next(deal, ema5_data, 5);
        ema10_data = ema.next(deal, ema10_data, 10);
      }

      // MA60 calc
      let ma60: number | null = null;
      if (i >= 59) {
        let sumC = 0;
        for (let j = 0; j < 60; j++) {
          sumC += deals[i - j].c || 0;
        }
        ma60 = sumC / 60;
      }

      // Vol MA20
      let volMa20: number | null = null;
      if (i >= 19) {
        let sumV = 0;
        for (let j = 0; j < 20; j++) {
          sumV += deals[i - j].v || 0;
        }
        volMa20 = sumV / 20;
      }

      response.push({
        ...deal,
        ema5: ema5_data.ema || null,
        ema10: ema10_data.ema || null,
        ma60,
        volMa20,
      });
    }
    return response.slice(
      -(visibleCount + rightOffset), 
      rightOffset === 0 ? undefined : -rightOffset
    );
  }, [deals, visibleCount, rightOffset]);

  const hMax = useMemo(() => {
    return chartData.length === 0
      ? 0
      : Math.max(...chartData.map((d) => d.h ?? -Infinity));
  }, [chartData]);

  const signals = useMemo((): SignalPoint[] => {
    const points: SignalPoint[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1];
      const curr = chartData[i];
      if (
        prev.ema5 !== null &&
        prev.ema10 !== null &&
        curr.ema5 !== null &&
        curr.ema10 !== null
      ) {
        const price = curr.c || 0;
        const ma60 = curr.ma60 || 0;

        if (prev.ema5 < prev.ema10 && curr.ema5 > curr.ema10) {
          // Golden Cross
          const isTrendBuy = ma60 > 0 && price > ma60;

          points.push({
            ...curr,
            type: "golden",
            subType: isTrendBuy ? "trend" : "rebound",
          });
        } else if (prev.ema5 > prev.ema10 && curr.ema5 < curr.ema10) {
          // Death Cross
          const isTrendSell = ma60 > 0 && price < ma60;

          points.push({
            ...curr,
            type: "death",
            subType: isTrendSell ? "trend" : "rebound",
          });
        }
      }
    }
    return points;
  }, [chartData]);

  const { steps, score, recommendation } = useMemo(() => {
    if (chartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    const current = chartData[chartData.length - 1];

    const isNum = (n: any): n is number => typeof n === "number";

    const price = current.c;
    const ema5 = current.ema5;
    const ema10 = current.ema10;
    const ma60 = current.ma60;
    const vol = current.v;
    const volMa = current.volMa20;

    if (!isNum(price) || !isNum(ema5) || !isNum(ema10)) {
      return { steps: [], score: 0, recommendation: "Data Error" };
    }

    // Signals
    const recentCross =
      signals.length > 0
        ? signals
            .slice()
            .reverse()
            .find(
              (s) =>
                (s.type === "golden" || s.type === "death") &&
                (s.t === current.t ||
                  s.t === chartData[chartData.length - 2]?.t)
            )
        : null;
    const trendUp = ema5 > ema10;
    const aboveLifeLine = isNum(ma60) && price > ma60;
    const volOk = isNum(vol) && isNum(volMa) && vol > volMa; // Volume support

    // Scoring
    let totalScore = 0;

    // 1. Trend (30)
    if (trendUp) totalScore += 15;
    if (aboveLifeLine) totalScore += 15;

    // 2. Signal Quality (40)
    if (recentCross) {
      if (recentCross.type === "golden") {
        if (recentCross.subType === "trend") totalScore += 40; // Strong buy
        else totalScore += 20; // Rebound buy
      } else {
        if (recentCross.subType === "trend") totalScore -= 40; // Strong sell
        else totalScore -= 20; // Correction
      }
    } else {
      if (trendUp && aboveLifeLine) totalScore += 20; // Holding trend
    }

    // 3. Volume (10)
    if (volOk) totalScore += 10;

    // 4. Momentum (K strength) (20)
    if (price > ema5) totalScore += 20;

    if (totalScore < 0) totalScore = 0;
    if (totalScore > 100) totalScore = 100;

    let rec = "Neutral";
    if (totalScore >= 80) rec = "Strong Buy";
    else if (totalScore >= 60) rec = "Buy";
    else if (totalScore <= 30) rec = "Sell";
    else rec = "Hold";

    const avgSteps: AvgMaStep[] = [
      {
        label: "I. 趨勢判斷",
        description: "多空生命線 (MA60)",
        checks: [
          {
            label: `價格 > MA60 (多頭格局): ${aboveLifeLine ? "Yes" : "No"}`,
            status: aboveLifeLine ? "pass" : "fail",
          },
          {
            label: `EMA5 > EMA10 (短線趨勢): ${trendUp ? "Yes" : "No"}`,
            status: trendUp ? "pass" : "fail",
          },
        ],
      },
      {
        label: "II. 進場訊號",
        description: "交叉與型態",
        checks: [
          {
            label: `均線訊號: ${
              recentCross
                ? recentCross.type === "golden"
                  ? "黃金交叉"
                  : "死亡交叉"
                : "無"
            }`,
            status:
              recentCross?.type === "golden"
                ? "pass"
                : recentCross?.type === "death"
                ? "fail"
                : "manual",
          },
          {
            label: `訊號性質: ${
              recentCross
                ? recentCross.subType === "trend"
                  ? "順勢 (強)"
                  : "逆勢 (弱)"
                : "N/A"
            }`,
            status: recentCross?.subType === "trend" ? "pass" : "manual",
          },
        ],
      },
      {
        label: "III. 動能確認",
        description: "量價與均線",
        checks: [
          {
            label: `價格站穩 EMA5: ${price > ema5 ? "Yes" : "No"}`,
            status: price > ema5 ? "pass" : "fail",
          },
          {
            label: `成交量 > 均量: ${volOk ? "Yes" : "No"}`,
            status: volOk ? "pass" : "manual",
          },
        ],
      },
      {
        label: "IV. 綜合評估",
        description: `得分: ${totalScore} - ${rec}`,
        checks: [
          {
            label: `目前建議: ${rec}`,
            status: totalScore >= 60 ? "pass" : "manual",
          },
        ],
      },
    ];

    return { steps: avgSteps, score: totalScore, recommendation: rec };
  }, [chartData, signals]);

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "pass":
        return <CheckCircleIcon fontSize="small" color="success" />;
      case "fail":
        return <CancelIcon fontSize="small" color="error" />;
      case "manual":
      default:
        return <HelpOutlineIcon fontSize="small" color="disabled" />;
    }
  };

  if (chartData.length === 0) {
    return (
      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{ height: "100vh", display: "flex", flexDirection: "column", pt: 1, px: 2, pb: 1 }}
    >
      <Stack spacing={2} direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" component="div" color="white">
          EMA
        </Typography>

        <Chip
          label={`${score}分 - ${recommendation}`}
          color={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
          variant="outlined"
          size="small"
        />

        <Divider orientation="vertical" flexItem />
        <Box sx={{ flexGrow: 1 }}>
          <Stepper nonLinear activeStep={activeStep}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepButton color="inherit" onClick={handleStep(index)}>
                  {step.label}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Stack>

      <Card variant="outlined" sx={{ mb: 1, bgcolor: "background.default" }}>
        <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
          >
            <Box sx={{ minWidth: 200, flexShrink: 0 }}>
              <Typography variant="subtitle1" color="primary" fontWeight="bold">
                {steps[activeStep]?.description}
              </Typography>
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", md: "block" } }}
            />
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {steps[activeStep]?.checks.map((check, idx) => (
                <Chip
                  key={idx}
                  icon={getStatusIcon(check.status)}
                  label={check.label}
                  variant="outlined"
                  color={
                    check.status === "pass"
                      ? "success"
                      : check.status === "fail"
                      ? "error"
                      : "default"
                  }
                  size="small"
                />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box 
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} syncId="avgSync">
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" />
            <YAxis domain={["dataMin", hMax]} dataKey="l" />
            <ZAxis type="number" range={[10]} />
            <Tooltip
              offset={50}
              contentStyle={{
                backgroundColor: "#222",
                border: "none",
                borderRadius: 4,
              }}
              itemStyle={{ fontSize: 12 }}
              labelStyle={{ color: "#aaa", marginBottom: 5 }}
            />

            <Line
              dataKey="h"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="c"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="l"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="o"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Customized component={AvgCandlestickRectangle} />

            <Line
              dataKey="ema5"
              stroke="#589bf3"
              dot={false}
              activeDot={false}
              strokeWidth={2}
              name="EMA 5"
            />
            <Line
              dataKey="ema10"
              stroke="#ff7300"
              dot={false}
              activeDot={false}
              strokeWidth={2}
              name="EMA 10"
            />
            <Line
              dataKey="ma60"
              stroke="#9c27b0"
              dot={false}
              activeDot={false}
              strokeWidth={3}
              name="MA 60 (生命線)"
              opacity={0.6}
            />

            {signals.map((signal) => {
              const isGolden = signal.type === "golden";
              const isTrend = signal.subType === "trend";

              // Calculate y position
              const yPos = isGolden
                ? signal.ema5! - signal.ema5! * 0.01
                : signal.ema5! + signal.ema5! * 0.01;

              // Colors
              const color = isGolden ? "#f44336" : "#4caf50"; // Red (Up), Green (Down)

              return (
                <ReferenceDot
                  key={signal.t}
                  x={signal.t}
                  y={yPos}
                  r={4}
                  stroke="none"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (!cx || !cy) return <g />;

                    return (
                      <g>
                        {isGolden ? (
                          // Golden Cross (Up - Red)
                          <>
                            <path
                              d={`M${cx - 6},${cy + 10} L${cx + 6},${
                                cy + 10
                              } L${cx},${cy} Z`}
                              fill={isTrend ? color : "none"}
                              stroke={color}
                              strokeWidth={2}
                            />
                            <text
                              x={cx}
                              y={cy + 22}
                              textAnchor="middle"
                              fill={color}
                              fontSize={11}
                              fontWeight="bold"
                            >
                              {isTrend ? "順勢買進" : "反彈試單"}
                            </text>
                          </>
                        ) : (
                          // Death Cross (Down - Green)
                          <>
                            <path
                              d={`M${cx - 6},${cy - 10} L${cx + 6},${
                                cy - 10
                              } L${cx},${cy} Z`}
                              fill={isTrend ? color : "none"}
                              stroke={color}
                              strokeWidth={2}
                            />
                            <text
                              x={cx}
                              y={cy - 15}
                              textAnchor="middle"
                              fill={color}
                              fontSize={11}
                              fontWeight="bold"
                            >
                              {isTrend ? "順勢放空" : "回檔調節"}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
