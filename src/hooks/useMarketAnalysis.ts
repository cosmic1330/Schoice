import { dateFormat, Kd, Ma, Macd } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { useMemo } from "react";
import { TaType, UrlTaPerdOptions } from "../types";

const kd = new Kd();
const ma = new Ma();  
const macd = new Macd();
interface UseMarketAnalysisOptions {
  ta: TaType;
  perd: UrlTaPerdOptions;
}

export default function useMarketAnalysis({
  ta,
  perd,
}: UseMarketAnalysisOptions) {
  const deals = useMemo(() => {
    if (!ta || ta.length === 0) return [];
    const response = [];
    let kdData = kd.init(ta[0], 9);
    let macdData = macd.init(ta[0]);
    let ma5Data = ma.init(ta[0], 5);
    let ma10Data = ma.init(ta[0], 10);
    let ma20Data = ma.init(ta[0], 20);
    let ma60Data = ma.init(ta[0], 60);
    response.push({
      osc: macdData.osc,
      ma5: ma5Data.ma || null,
      ma10: ma10Data.ma || null,
      ma20: ma20Data.ma || null,
      ma60: ma60Data.ma || null,
      ...ta[0],
    });
    for (let i = 1; i < ta.length; i++) {
      const deal = ta[i];
      kdData = kd.next(deal, kdData, 9);
      macdData = macd.next(deal, macdData);
      ma5Data = ma.next(deal, ma5Data, 5);
      ma10Data = ma.next(deal, ma10Data, 10);
      ma20Data = ma.next(deal, ma20Data, 20);
      ma60Data = ma.next(deal, ma60Data, 60);
      response.push({
        osc: macdData.osc,
        ma5: ma5Data.ma || null,
        ma10: ma10Data.ma || null,
        ma20: ma20Data.ma || null,
        ma60: ma60Data.ma || null,
        ...deal,
      });
    }
    return response;
  }, [ta]);

  const trends = useMemo(() => {
    if (deals.length === 0) return [];
    switch (perd) {
      case UrlTaPerdOptions.Day:
        return deals.map((deal) => {
          if (
            deal.ma5 !== null &&
            deal.ma10 !== null &&
            deal.ma20 !== null &&
            deal.ma5 > deal.ma20 &&
            deal.ma10 > deal.ma20
          ) {
            return { ...deal, trend: "多頭" };
          } else if (
            deal.ma5 !== null &&
            deal.ma10 !== null &&
            deal.ma20 !== null &&
            deal.ma5 < deal.ma20 &&
            deal.ma10 < deal.ma20
          ) {
            return { ...deal, trend: "空頭" };
          } else {
            return { ...deal, trend: "震盪" };
          }
        });
      case UrlTaPerdOptions.Hour:
        return deals.map((deal) => {
          if (
            deal.ma5 !== null &&
            deal.ma10 !== null &&
            deal.ma20 !== null &&
            deal.ma60 !== null &&
            deal.ma5 > deal.ma60 &&
            deal.ma10 > deal.ma60 &&
            deal.ma20 > deal.ma60
          ) {
            return { ...deal, trend: "多頭" };
          } else if (
            deal.ma5 !== null &&
            deal.ma10 !== null &&
            deal.ma20 !== null &&
            deal.ma60 !== null &&
            deal.ma5 < deal.ma60 &&
            deal.ma10 < deal.ma60 &&
            deal.ma20 < deal.ma60
          ) {
            return { ...deal, trend: "空頭" };
          } else {
            return { ...deal, trend: "震盪" };
          }
        });
      default:
        return deals.map((deal) => ({ ...deal, trend: "N/A" }));
    }
  }, [deals, perd]);

  const power = useMemo(() => {
    if (deals.length === 0) return "?";
    const lastDeal = deals[deals.length - 1];
    const seclastDeal = deals[deals.length - 2];
    const thrlastDeal = deals[deals.length - 3];
    if (
      (lastDeal.osc < seclastDeal.osc || lastDeal.osc < thrlastDeal.osc) &&
      lastDeal.osc < 0
    ) {
      return "空方力道漸強";
    } else if (
      (lastDeal.osc > seclastDeal.osc || lastDeal.osc > thrlastDeal.osc) &&
      lastDeal.osc > 0
    ) {
      return "多方力道漸強";
    } else if (
      (lastDeal.osc > seclastDeal.osc || lastDeal.osc > thrlastDeal.osc) &&
      lastDeal.osc < 0
    ) {
      return "空方力道漸弱";
    } else if (
      (lastDeal.osc < seclastDeal.osc || lastDeal.osc < thrlastDeal.osc) &&
      lastDeal.osc > 0
    ) {
      return "多方力道漸弱";
    }
    return "無明顯力道";
  }, [deals]);

  const date = useMemo(() => {
    if (deals.length === 0) return "";
    return dateFormat(deals[deals.length - 1].t, Mode.NumberToString);
  }, [deals]);

  const trendChangePoints = useMemo(() => {
    const trendChanges = trends.reduce<typeof trends>(
      (acc: typeof trends, deal, index) => {
        if (index === 0) return acc;
        if (acc.length > 0 && acc[acc.length - 1].trend === deal.trend) {
          return acc;
        }
        const prevDeal = trends[index - 1];
        if (
          (prevDeal.trend === "震盪" && deal.trend === "多頭") ||
          (prevDeal.trend === "震盪" && deal.trend === "空頭")
        ) {
          acc.push(deal);
        }
        return acc;
      },
      []
    );
    return trendChanges;
  }, [trends]);

  return { trends, power, date, trendChangePoints };
}
