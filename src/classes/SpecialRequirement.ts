import { simpleRegressionModel } from "@ch20026103/anysis";
import { FormatDataRow } from "../hooks/useFormatSkillData";

export default class SpecialRequirement {
  data: FormatDataRow[];

  constructor(data: FormatDataRow[]) {
    this.data = data;
  }

  getRegressionLine(day: number, key: keyof FormatDataRow) {
    if (this.data.length === 0) return;
    const list = this.data.slice(-day);
    const ad_values = list.map((item) => item[key] || 0);
    const result = simpleRegressionModel(
      Array.from({ length: ad_values.length }, (_, i) => i), // x: index
      ad_values // y: ad 值
    );
    const arr = list.map((item, index) => ({
      ...item,
      regression: result.predictModel(index),
    }));
    return arr;
  }
}
