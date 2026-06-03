export interface CciState {
  tps: number[];
}

const cci = {
  /**
   * Initialize CCI state
   */
  init(): CciState {
    return {
      tps: [],
    };
  },

  /**
   * Calculate next CCI value and state
   * Typical Price (TP) = (High + Low + Close) / 3
   * CCI = (TP - SMA_TP) / (0.015 * Mean Deviation)
   */
  next(
    deal: any,
    state: CciState,
    period: number = 14,
  ): { cci: number | null; state: CciState } {
    const tp = (deal.h + deal.l + deal.c) / 3;
    const newTps = [...state.tps, tp];

    if (newTps.length > period) {
      newTps.shift();
    }

    let result = null;
    if (newTps.length === period) {
      const smaTp = newTps.reduce((a, b) => a + b, 0) / period;
      
      // Mean Deviation
      let meanDev = 0;
      for (const val of newTps) {
        meanDev += Math.abs(val - smaTp);
      }
      meanDev /= period;

      if (meanDev === 0) {
        result = 0;
      } else {
        result = (tp - smaTp) / (0.015 * meanDev);
      }
    }

    return {
      cci: result,
      state: {
        tps: newTps,
      },
    };
  },
};

export default cci;
