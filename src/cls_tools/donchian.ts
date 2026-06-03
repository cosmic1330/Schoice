export interface DonchianState {
  highs: number[];
  lows: number[];
}

export interface DonchianResult {
  upper: number | null;
  lower: number | null;
  middle: number | null;
}

const donchian = {
  /**
   * Initialize Donchian state
   */
  init(): DonchianState {
    return {
      highs: [],
      lows: [],
    };
  },

  /**
   * Calculate next Donchian value and state
   */
  next(
    deal: any,
    state: DonchianState,
    period: number = 20,
  ): DonchianResult & { state: DonchianState } {
    const newHighs = [...state.highs, deal.h];
    const newLows = [...state.lows, deal.l];

    if (newHighs.length > period) {
      newHighs.shift();
      newLows.shift();
    }

    let upper = null;
    let lower = null;
    let middle = null;

    if (newHighs.length === period) {
      upper = Math.max(...newHighs);
      lower = Math.min(...newLows);
      middle = (upper + lower) / 2;
    }

    return {
      upper,
      lower,
      middle,
      state: {
        highs: newHighs,
        lows: newLows,
      },
    };
  },
};

export default donchian;
