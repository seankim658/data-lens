/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useRef, useEffect } from "react";
import { HybridChartContainer } from "./HybridChartContainer";
import { useBarChartRenderer } from "@/hooks/useBarChartRenderer";

interface ChartViewProps {
  data: any[];
  chartTitle: string;
  xAxisTitle: string;
  yAxisTitle: string;
}

export function BarChartView({
  data,
  chartTitle,
  xAxisTitle,
  yAxisTitle,
}: ChartViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { renderChart } = useBarChartRenderer({
    data,
    svgRef,
    canvasRef,
    yDomain: null, // TODO : pass lens manipulations here later
    chartTitle,
    xAxisTitle,
    yAxisTitle,
  });

  // Re-render only when the data itself changes
  // Resizing is handled automatically by the HybridChartContainer
  useEffect(() => {
    const dims = svgRef.current?.getBoundingClientRect();
    if (dims) {
      renderChart({ width: dims.width, height: dims.height });
    }
  }, [data, renderChart]);

  return (
    <HybridChartContainer
      svgRef={svgRef}
      canvasRef={canvasRef}
      renderChart={renderChart}
    />
  );
}
