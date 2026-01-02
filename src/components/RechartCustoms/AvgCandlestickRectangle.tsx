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
const AvgCandlestickRectangle = (props: any) => {
  const { formattedGraphicalItems } = props;
  // get first and second series in chart
  const highSeries = formattedGraphicalItems[0] as FormattedGraphicalItem;
  const closeSeries = formattedGraphicalItems[1] as FormattedGraphicalItem;
  const lowSeries = formattedGraphicalItems[2] as FormattedGraphicalItem;
  const openSeries = formattedGraphicalItems[3] as FormattedGraphicalItem;

  /*
    開盤價=（H前一根開盤價+H前一根收盤價）÷ 2
    收盤價=（K開盤價+K收盤價+K最高價+K最低價）÷ 4
    最高價=（K最高價，H開盤價，H收盤價）中的最高價
    最低價=（K最低價，H開盤價，H收盤價）中的最低價
  */
  const Rectangles = [];
  let o = openSeries?.props?.points[0]?.y;
  let c = closeSeries?.props?.points[0]?.y;
  let h = highSeries?.props?.points[0]?.y;
  let l = lowSeries?.props?.points[0]?.y;
  let prel = 0;

  for (let i = 1; i < lowSeries?.props?.points.length; i++) {
    const lowSeriesPoint = lowSeries?.props?.points[i];
    const highSeriesPoint = highSeries?.props?.points[i];
    const closeSeriesPoint = closeSeries?.props?.points[i];
    const openSeriesPoint = openSeries?.props?.points[i];
    o = (o + c) / 2;
    c =
      (openSeriesPoint.y +
        closeSeriesPoint.y +
        highSeriesPoint.y +
        lowSeriesPoint.y) /
      4;
    h = Math.max(highSeriesPoint.y, c, o);
    prel = l;
    l = Math.min(lowSeriesPoint.y, c, o);
    Rectangles.push(
      <Rectangle
        key={`avg-rectangle-${i}`}
        width={3}
        height={Math.abs(l - h) || 1}
        x={lowSeriesPoint.x - 1.5}
        y={Math.min(l, h)}
        fill={l < prel ? "#ff4d4f" : "#52c41a"}
      />
    );
  }
  // render custom content using points from the graph
  return Rectangles;
};
export default AvgCandlestickRectangle;
