# src/pages/Detail

This directory contains the components for the "Detail" page, which provides a detailed view of a single stock with various technical analysis charts.

## Main Component

- **index.tsx**: This is the main component for the Detail page. It implements a full-screen vertical carousel that allows users to scroll through different charts. It uses the `framer-motion` library for animations and `react-lazy` to lazy-load the chart components. It also fetches the stock data using `useSWR` and provides it to the chart components through the `DealsContext`.

## Chart Components

This directory contains a number of chart components, each of which displays a specific technical analysis indicator or a combination of indicators. They all use the `recharts` library for rendering the charts.

- **AvgMaKbar.tsx**: Displays a chart with an average moving average candlestick and EMA lines.
- **Kd.tsx**: Shows the KD (Stochastic Oscillator) indicator and detects divergences.
- **Ma.tsx**: Displays a moving average ribbon chart.
- **MaKbar.tsx**: A candlestick chart with moving averages.
- **MJ.tsx**: A chart that combines the J-line of the KD indicator with the MACD oscillator.
- **MR.tsx**: A chart that combines the RSI with the MACD oscillator.
- **Obv.tsx**: Displays the On-Balance Volume (OBV) indicator and detects divergences.
