# src/cls_tools

This directory exports instances of technical analysis indicator classes from the `@ch20026103/anysis` library.

Each file in this directory imports a specific indicator class, creates an instance of it, and exports the instance as the default export. This allows other parts of the application to easily import and use these technical analysis tools without needing to instantiate them repeatedly.

## Exported Instances

- **boll.ts**: Exports an instance of the `Boll` (Bollinger Bands) class.
- **ema.ts**: Exports an instance of the `Ema` (Exponential Moving Average) class.
- **kd.ts**: Exports an instance of the `Kd` (Stochastic Oscillator) class.
- **ma.ts**: Exports an instance of the `Ma` (Moving Average) class.
- **macd.ts**: Exports an instance of the `Macd` (Moving Average Convergence Divergence) class.
- **obv.ts**: Exports an instance of the `Obv` (On-Balance Volume) class.
- **obvEma.ts**: Exports an instance of the `ObvEma` (On-Balance Volume with Exponential Moving Average) class.
- **rsi.ts**: Exports an instance of the `Rsi` (Relative Strength Index) class.
