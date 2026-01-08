import { useMemo } from "react";

// Helper to construct path 'd' from points {x, yA, yB}
// We want to fill area between yA and yB.
// Move to x0, yA0. Line to x1, yA1 ... xN, yAN.
// Then Line to xN, yBN. Line to ... x0, yB0. Close.
function makePath(points: { x: number; yA: number; yB: number }[]) {
  if (points.length < 2) return "";

  // Top Edge (using yA)
  let d = `M ${points[0].x} ${points[0].yA}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].yA}`;
  }

  // Right Edge to Bottom (yB)
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].yB}`;

  // Bottom Edge (using yB) backwards
  for (let i = points.length - 2; i >= 0; i--) {
    d += ` L ${points[i].x} ${points[i].yB}`;
  }

  d += " Z";
  return d;
}

const IchimokuCloudArea = (props: any) => {
  const { xAxis, yAxis, data } = props;

  // Recharts "Customized" passes: { ...props, width, height, ... }
  // We need the calculated [x, y] coordinates for senkouA and senkouB.

  // We utilize useMemo to avoid recalculation if props haven't changed,
  // effectively replacing PureComponent behavior.
  const { bullPaths, bearPaths } = useMemo(() => {
    if (!data || !xAxis || !yAxis) return { bullPaths: [], bearPaths: [] };

    const yScale = yAxis.scale;

    // We build two paths: Lead 1 > Lead 2 (Bull), Lead 2 > Lead 1 (Bear)
    // Simplified approach for now:
    // Identify "Bull Segments" and "Bear Segments" and draw them as separate paths.

    const points = data.map((d: any) => {
      // X coordinate:
      let x;
      if (xAxis.scale && xAxis.scale.bandwidth) {
        // Band scale
        x = xAxis.scale(d.t) + xAxis.scale.bandwidth() / 2;
      } else {
        // Linear/Point scale
        x = xAxis.scale(d.t);
      }

      const yA = d.senkouA !== null ? yScale(d.senkouA) : null;
      const yB = d.senkouB !== null ? yScale(d.senkouB) : null;

      return { x, yA, yB };
    });

    // Bull Polygons
    let currentBullPoly: { x: number; yA: number; yB: number }[] = [];
    let bullPathsArr: string[] = [];

    // Bear Polygons
    let currentBearPoly: { x: number; yA: number; yB: number }[] = [];
    let bearPathsArr: string[] = [];

    points.forEach((p: any) => {
      if (p.x === undefined || p.yA === null || p.yB === null) {
        // End current polygons if gap
        if (currentBullPoly.length > 0) {
          bullPathsArr.push(makePath(currentBullPoly));
          currentBullPoly = [];
        }
        if (currentBearPoly.length > 0) {
          bearPathsArr.push(makePath(currentBearPoly));
          currentBearPoly = [];
        }
        return;
      }

      // Check state
      // Y coordinates: Y increases downwards in SVG.
      // So Higher Price = Lower Y value.
      // Price A > Price B => yA < yB.

      // Bull: Senkou A > Senkou B (Price A > Price B) => yA < yB
      const isBull = p.yA < p.yB;
      const isBear = p.yA > p.yB;

      if (isBull) {
        // Close Bear if open
        if (currentBearPoly.length > 0) {
          // Close bear poly
          bearPathsArr.push(makePath(currentBearPoly));
          currentBearPoly = [];
        }
        currentBullPoly.push(p);
      } else if (isBear) {
        // Close Bull if open
        if (currentBullPoly.length > 0) {
          bullPathsArr.push(makePath(currentBullPoly));
          currentBullPoly = [];
        }
        currentBearPoly.push(p);
      } else {
        // Intersection point (yA == yB)
        // Add to both
        currentBullPoly.push(p);
        currentBearPoly.push(p);
      }
    });

    // Flush remaining
    if (currentBullPoly.length > 0)
      bullPathsArr.push(makePath(currentBullPoly));
    if (currentBearPoly.length > 0)
      bearPathsArr.push(makePath(currentBearPoly));

    return { bullPaths: bullPathsArr, bearPaths: bearPathsArr };
  }, [data, xAxis, yAxis]);

  if (!data || !xAxis || !yAxis) return null;

  return (
    <g className="recharts-ichimoku-cloud">
      {bullPaths.map((d, i) => (
        <path
          key={`bull-${i}`}
          d={d}
          fill="#2196f3"
          fillOpacity={0.15}
          stroke="none"
        />
      ))}
      {bearPaths.map((d, i) => (
        <path
          key={`bear-${i}`}
          d={d}
          fill="#f44336"
          fillOpacity={0.15}
          stroke="none"
        />
      ))}
    </g>
  );
};

export default IchimokuCloudArea;
