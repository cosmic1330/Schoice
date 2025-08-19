enum MaTypeMode {
  GoldenCross10 = "金叉Ma10",
  GoldenCross20 = "金叉Ma20",
  DeathCross10 = "死叉Ma10",
  DeathCross20 = "死叉Ma20",
}

// 主判斷函式
import type { SignalType } from "../types";
function detectMaCrossDivergence(
  data: {
    t: number;
    ma5: number | null;
    ma10: number | null;
    ma20: number | null;
  }[]
): SignalType[] {
  const signals: SignalType[] = [];
  for (let i = 20; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    const prevPrev = data[i - 2];
    // 確保當前數據有足夠的均線數據
    if (
      current.ma5 === null ||
      current.ma10 === null ||
      current.ma20 === null ||
      previous.ma5 === null ||
      previous.ma10 === null ||
      previous.ma20 === null ||
      prevPrev.ma5 === null ||
      prevPrev.ma10 === null ||
      prevPrev.ma20 === null
    ) {
      continue;
    }
    // 檢查金叉 Ma10
    if (
      previous.ma5 < previous.ma10 &&
      current.ma5 > current.ma10 &&
      prevPrev.ma5 <= prevPrev.ma10
    ) {
      signals.push({
        t: current.t,
        type: MaTypeMode.GoldenCross10,
        description: `金叉Ma10，${current.t}日均線突破${previous.t}日均線，可能預示著短期上漲趨勢。`,
      });
    }
    // 檢查死叉 Ma10
    if (
      previous.ma5 > previous.ma10 &&
      current.ma5 < current.ma10 &&
      prevPrev.ma5 >= prevPrev.ma10
    ) {
      signals.push({
        t: current.t,
        type: MaTypeMode.DeathCross10,
        description: `死叉Ma10，${current.t}日均線跌破${previous.t}日均線，可能預示著短期下跌趨勢。`,
      });
    }
    // 檢查金叉 Ma20
    if (
      previous.ma5 < previous.ma20 &&
      current.ma5 > current.ma20 &&
      prevPrev.ma5 <= prevPrev.ma20
    ) {
      signals.push({
        t: current.t,
        type: MaTypeMode.GoldenCross20,
        description: `金叉Ma20，${current.t}日均線突破${previous.t}日均線，可能預示著中期上漲趨勢。`,
      });
    }
    // 檢查死叉 Ma20
    if (
      previous.ma5 > previous.ma20 &&
      current.ma5 < current.ma20 &&
      prevPrev.ma5 >= prevPrev.ma20
    ) {
      signals.push({
        t: current.t,
        type: MaTypeMode.DeathCross20,
        description: `死叉Ma20，${current.t}日均線跌破${previous.t}日均線，可能預示著中期下跌趨勢。`,
      });
    }
  }
  return signals;
}

export default detectMaCrossDivergence;
