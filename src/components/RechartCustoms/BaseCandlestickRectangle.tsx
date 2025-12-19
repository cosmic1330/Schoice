import { Fragment } from "react/jsx-runtime";
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
    return null; // 確保有足夠的數據點
  }
  // get first and second series in chart
  const highSeries = formattedGraphicalItems[0] as FormattedGraphicalItem;
  const closeSeries = formattedGraphicalItems[1] as FormattedGraphicalItem;
  const lowSeries = formattedGraphicalItems[2] as FormattedGraphicalItem;
  const openSeries = formattedGraphicalItems[3] as FormattedGraphicalItem;

  // render custom content using points from the graph
  return highSeries?.props?.points.map((highSeriesPoint, index) => {
    const lowSeriesPoint = lowSeries?.props?.points[index];
    const closeSeriesPoint = closeSeries?.props?.points[index];
    const openSeriesPoint = openSeries?.props?.points[index];

    const isRising =
      closeSeriesPoint.value > openSeriesPoint.value ? true : false;

    return (
      <Fragment key={`candle-${index}`}>
        {/* Thin line for high-low */}
        <Rectangle
          key={`line-${index}`}
          width={1}
          height={Math.abs(lowSeriesPoint.y - highSeriesPoint.y) || 1} // 確保高度為正值
          x={lowSeriesPoint.x - 0.5} // 調整位置讓線條居中
          y={Math.min(lowSeriesPoint.y, highSeriesPoint.y)}
          fill={isRising ? "#ff4d4f" : "#52c41a"}
        />
        {/* Thick rectangle for open-close */}
        <Rectangle
          key={`rectangle-${index}`}
          width={3}
          height={Math.abs(openSeriesPoint.y - closeSeriesPoint.y) || 1}
          x={lowSeriesPoint.x - 1.5}
          y={Math.min(openSeriesPoint.y, closeSeriesPoint.y)}
          fill={isRising ? "#ff4d4f" : "#52c41a"}
        />
      </Fragment>
    );
  });
};
export default BaseCandlestickRectangle;
