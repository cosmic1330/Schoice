import React, { lazy } from "react";
import type { TFunction } from "i18next";

// lazy load components
const MaKbar = lazy(() => import("../Ma/MaKbar"));
const Obv = lazy(() => import("../Obv/Obv"));
const IchimokuCloud = lazy(() => import("../IchimokuCloud/IchimokuCloud"));
const MR = lazy(() => import("../Mr/MR"));
const Kd = lazy(() => import("../Kd/Kd"));
const Mfi = lazy(() => import("../Mfi/Mfi"));
const ATR = lazy(() => import("../ATR/ATR"));
const Cci = lazy(() => import("../Cci/Cci"));
const Bollean = lazy(() => import("../Bollean/Bollean"));
const AvgMaKbar = lazy(() => import("../Ema/EmaKbar"));
const VolumeProfileChart = lazy(() => import("../VolumeProfile/VolumeProfileChart"));
const Chip = lazy(() => import("../Chip/Chip"));

// Import doc assets
import atrDoc from "../ATR/ATR.md?raw";
import bolleanDoc from "../Bollean/Bollean.md?raw";
import cciDoc from "../Cci/Cci.md?raw";
const Donchian = lazy(() => import("../Donchian/Donchian"));
import donchianDoc from "../Donchian/Donchian.md?raw";
import emaDoc from "../Ema/Ema.md?raw";
import ichimokuDoc from "../IchimokuCloud/ichimoku.md?raw";
import kdDoc from "../Kd/Kd.md?raw";
import maDoc from "../Ma/Ma.md?raw";
import mfiDoc from "../Mfi/Mfi.md?raw";
import mrDoc from "../Mr/MR.md?raw";
import obvDoc from "../Obv/Obv.md?raw";
import volumeProfileDoc from "../VolumeProfile/VolumeProfile.md?raw";
import chipDoc from "../Chip/Chip.md?raw";

export interface ChartDefinition {
  id: string;
  label: string; // 用於 Menu
  title: string; // 用於 DocModal
  docContent: string;
  timezoneAdvice: string;
  component: (props: any) => React.ReactNode;
}

export const getChartLabel = (chart: ChartDefinition | undefined, t: TFunction) =>
  chart ? t(`Pages.Detail.charts.${chart.id}.label`) : "";

export const getChartTitle = (chart: ChartDefinition | undefined, t: TFunction) =>
  chart ? t(`Pages.Detail.charts.${chart.id}.title`) : "";

export const getChartAdvice = (chart: ChartDefinition | undefined, t: TFunction) => {
  if (!chart) return "";
  return t(`Pages.Detail.chartAdvice.${chart.id}`);
};

export const CHART_CONFIG: ChartDefinition[] = [
  {
    id: "bollean",
    label: "布林",
    title: "布林通道與EMA",
    docContent: bolleanDoc,
    timezoneAdvice:
      "布林通道策略適合於震盪與突破市場，配合EMA 200能有效判斷大趨勢。",
    component: (props) => <Bollean {...props} />,
  },
  {
    id: "Donchian",
    label: "唐奇",
    title: "唐奇通道",
    docContent: donchianDoc,
    timezoneAdvice: "唐奇通道策略，適合於震盪與突破市場。",
    component: (props) => <Donchian {...props} />,
  },
  {
    id: "ma",
    label: "MA",
    title: "均線與缺口策略",
    docContent: maDoc,
    timezoneAdvice:
      "MA 策略在日線 (D1) 最能體現「趨勢的力量」。在週線 (W1)，MA 20 (月線) 具有極強的防禦屬性。若在 1 小時 (H1) 看到跳空缺口，應先檢查 D1 是否處於關鍵支撐位，避免在長線壓力區追多短線缺口。",
    component: (props) => <MaKbar {...props} />,
  },
  {
    id: "ema",
    label: "EMA",
    title: "EMA趨勢策略",
    docContent: emaDoc,
    timezoneAdvice:
      "EMA 策略在日線 (D1) 提供穩定的中長線指南。若要在 H1 進場，請務必先確認 D1 的價格是否在 EMA 60 或 SMA 200 支撐位附近。",
    component: (props) => <AvgMaKbar {...props} />,
  },
  {
    id: "atr",
    label: "ATR",
    title: "ATR Trend 策略說明",
    docContent: atrDoc,
    timezoneAdvice:
      "ATR Supertrend 策略在日線 (D1) 追蹤趨勢非常有效。若要在短線使用，請務必搭配較大時區的 EMA (如 D1 的 EMA 50) 作為方向過濾，避免在盤整時頻繁被洗出場。",
    component: (props) => <ATR {...props} />,
  },
  {
    id: "obv",
    label: "OBV",
    title: "OBV動能策略",
    docContent: obvDoc,
    timezoneAdvice:
      "OBV 指標在 60 分鐘 (H1) 最能體現「主力資金」的進出意圖。建議在 H1 作為進場參考時，同步觀察日線 (D1) 的 OBV 趨勢。若 D1 處於長期底背離吸籌期，則 H1 的真突破勝率大幅提升。",
    component: (props) => <Obv {...props} />,
  },
  {
    id: "volume_profile",
    label: "量價",
    title: "成交量輪廓",
    docContent: volumeProfileDoc,
    timezoneAdvice:
      "成交量輪廓 (Volume Profile) 適合用於判斷可見區間內的資金密集區。POC 提供了極強的防禦與主力持倉成本參考，VAH/VAL 區間能有效辨識目前的盤整或突破狀態。",
    component: (props) => <VolumeProfileChart {...props} />,
  },
  {
    id: "cci",
    label: "CCI",
    title: "CCI 順勢指標",
    docContent: cciDoc,
    timezoneAdvice:
      "CCI 策略在日線 (D1) 與 1 小時 (H1) 具有高實戰價值，能精準捕捉突破與超賣勾頭波段。在短線使用時，務必遵守「順大勢、做小勢」原則。",
    component: (props) => <Cci {...props} />,
  },
  {
    id: "mr",
    label: "MR",
    title: "MR雙指標共振",
    docContent: mrDoc,
    timezoneAdvice:
      "MR 策略在 15 分鐘 (M15) 與 30 分鐘 (M30) 非常神準，適合用於捕捉日內強勢攻擊波段。在日線 (D1)，MR 用於判斷動能衰竭。若 M15 出現金叉但日線 RSI 在 50 以下，應以「搶反彈」視之。",
    component: (props) => <MR {...props} />,
  },
  {
    id: "kd",
    label: "KD",
    title: "KD隨機指標策略",
    docContent: kdDoc,
    timezoneAdvice:
      "KD 指標對時間極敏感。在週線 (W1) 或日線 (D1) 具有極高波段參考價值；在 15 分鐘 (M15) 等短時區，容易發生鈍化，必須搭配趨勢指標 (如 MA20) 過濾。",
    component: (props) => <Kd {...props} />,
  },
  {
    id: "mfi",
    label: "MFI",
    title: "MFI資金流便覽",
    docContent: mfiDoc,
    timezoneAdvice:
      "MFI 在日線 (D1) 非常穩健，用於判別大資金進盤與離巢。在 1 小時 (H1) 或 15 分鐘 (M15) 反應迅速，常用於捕捉情緒極點。建議 H1 出現超賣時進場，但須確保 D1 趨勢仍向上。",
    component: (props) => <Mfi {...props} />,
  },
  {
    id: "chip",
    label: "籌碼",
    title: "籌碼面",
    docContent: chipDoc,
    timezoneAdvice:
      "籌碼資料為盤後更新，以免費的三大法人與融資融券資料判斷方向。",
    component: () => <Chip />,
  },
  {
    id: "ichimoku_cloud",
    label: "一目",
    title: "一目均衡表說明",
    docContent: ichimokuDoc,
    timezoneAdvice:
      "一目均衡表在日線 (D1) 與週線 (W1) 最有效。如果在 15 分鐘 or 1 小時圖使用，CMF 的噪音會淹沒所有訊號。",
    component: (props) => <IchimokuCloud perd={props.perd} />,
  },
];
