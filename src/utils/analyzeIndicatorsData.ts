import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { TaType } from "../types";
import formatDateTime from "./formatDateTime";

export enum IndicatorsDateTimeType {
  Date = "date",
  DateTime = "dateTime",
}

export default function analyzeIndicatorsData(
  data: string,
  timeType: IndicatorsDateTimeType
): TaType {
  const json = JSON.parse(data as string);
  const opens = json[0].chart.indicators.quote[0].open;
  const closes = json[0].chart.indicators.quote[0].close;
  const highs = json[0].chart.indicators.quote[0].high;
  const lows = json[0].chart.indicators.quote[0].low;
  const volumes = json[0].chart.indicators.quote[0].volume;
  const ts = json[0].chart.timestamp.map((item: number) => {
    if (timeType === IndicatorsDateTimeType.Date) {
      return dateFormat(item * 1000, Mode.TimeStampToNumber); // 只保留日期部分
    } else {
      return formatDateTime(item * 1000); // 保留完整的日期時間
    }
  });

  const response = [];
  for (let i = 0; i < opens.length; i++) {
    if (opens[i] !== null) {
      response.push({
        t: ts[i],
        o: opens[i],
        c: closes[i],
        h: highs[i],
        l: lows[i],
        v: volumes[i],
      });
    }
  }
  return response;
}
