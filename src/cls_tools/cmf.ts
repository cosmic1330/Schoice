interface Candle {
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface CmfState {
  mfvBuffer: number[];
  volBuffer: number[];
  cmf: number | null;
}

class Cmf {
  init(candle: Candle, period: number): CmfState {
    const { mfv, v } = this.calculateMfv(candle);
    return {
      mfvBuffer: [mfv],
      volBuffer: [v],
      cmf: null, // Not enough data yet
    };
  }

  next(candle: Candle, prevState: CmfState, period: number): CmfState {
    const { mfv, v } = this.calculateMfv(candle);

    const newMfvBuffer = [...prevState.mfvBuffer, mfv];
    const newVolBuffer = [...prevState.volBuffer, v];

    if (newMfvBuffer.length > period) {
      newMfvBuffer.shift();
      newVolBuffer.shift();
    }

    let cmf: number | null = null;
    if (newMfvBuffer.length === period) {
      const sumMfv = newMfvBuffer.reduce((a, b) => a + b, 0);
      const sumVol = newVolBuffer.reduce((a, b) => a + b, 0);
      cmf = sumVol === 0 ? 0 : sumMfv / sumVol;
    }

    return {
      mfvBuffer: newMfvBuffer,
      volBuffer: newVolBuffer,
      cmf,
    };
  }

  private calculateMfv(candle: Candle): { mfv: number; v: number } {
    const { h, l, c, v } = candle;
    // Multiplier = ((Close - Low) - (High - Close)) / (High - Low)
    //            = (2*Close - Low - High) / (High - Low)
    const range = h - l;
    let multiplier = 0;
    if (range > 0) {
      multiplier = (2 * c - l - h) / range;
    }
    const mfv = multiplier * v;
    return { mfv, v };
  }
}

const cmf = new Cmf();
export default cmf;
