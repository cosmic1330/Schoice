import { Rectangle } from "recharts";

type FormattedGraphicalItem = {
  props: {
    points: {
      x: number;
      y: number;
      value: number;
    }[];
  };
};

// using Customized gives you access to all relevant chart props
const BaseCandlestickRectangle = (props: any) => {
  const { formattedGraphicalItems } = props;

  if (!formattedGraphicalItems || formattedGraphicalItems.length < 4) {
    return null;
  }

  // get first and second series in chart
  const highSeries = formattedGraphicalItems[0] as FormattedGraphicalItem;
  const closeSeries = formattedGraphicalItems[1] as FormattedGraphicalItem;
  const lowSeries = formattedGraphicalItems[2] as FormattedGraphicalItem;
  const openSeries = formattedGraphicalItems[3] as FormattedGraphicalItem;

  if (!highSeries?.props?.points) {
    return null;
  }

  // render custom content using points from the graph
  return highSeries.props.points.map((highSeriesPoint, index) => {
    const lowSeriesPoint = lowSeries?.props?.points?.[index];
    const closeSeriesPoint = closeSeries?.props?.points?.[index];
    const openSeriesPoint = openSeries?.props?.points?.[index];

    if (!lowSeriesPoint || !closeSeriesPoint || !openSeriesPoint) {
      return null;
    }

    // Use payload for robust data comparison (fixes "All Red" issue)
    const payload = (closeSeriesPoint as any).payload;
    const isRising = payload && typeof payload.c === 'number' && typeof payload.o === 'number'
        ? payload.c > payload.o
        : closeSeriesPoint.value > openSeriesPoint.value;
    
    // Default to Taiwan standard (Red=Up, Green=Down) if not provided
    const upColor = props.upColor || "#ff4d4f";
    const downColor = props.downColor || "#52c41a";
    const width = props.candleWidth || 3;
    const xOffset = width / 2;

    return (
      <g key={`candlestick-${index}`}>
        {/* Thin line for high-low */}
        <Rectangle
          width={1}
          height={Math.abs(lowSeriesPoint.y - highSeriesPoint.y) || 1} // 確保高度為正值
          x={lowSeriesPoint.x - 0.5} // 調整位置讓線條居中
          y={Math.min(lowSeriesPoint.y, highSeriesPoint.y)}
          fill={isRising ? upColor : downColor}
        />
        {/* Thick rectangle for open-close */}
        <Rectangle
          width={width}
          height={Math.abs(openSeriesPoint.y - closeSeriesPoint.y) || 1}
          x={lowSeriesPoint.x - xOffset}
          y={Math.min(openSeriesPoint.y, closeSeriesPoint.y)}
          fill={isRising ? upColor : downColor}
        />
      </g>
    );
  });
};
export default BaseCandlestickRectangle;
