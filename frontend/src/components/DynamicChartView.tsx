/* eslint-disable  @typescript-eslint/no-explicit-any */

import { BarChartView } from "@/components/charts/BarChartView";
import { LineChartView } from "@/components/charts/LineChartView";
import { PieChartView } from "@/components/charts/PieChartView";
import { ScatterChartView } from "@/components/charts/ScatterChartView";
import type { ChartViewProps } from "@/types/charts";

interface DynamicChartViewProps extends ChartViewProps {
  chartType: string;
}

const chartComponentMap: Record<string, React.FC<any>> = {
  bar: BarChartView,
  line: LineChartView,
  pie: PieChartView,
  scatter: ScatterChartView,
};

export function DynamicChartView({
  chartType,
  ...props
}: DynamicChartViewProps) {
  if (!props.data || props.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available for the selected columns.
      </div>
    );
  }

  const ChartComponent = chartComponentMap[chartType];

  if (!ChartComponent) {
    return <div>Select a chart type to begin.</div>;
  }

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <ChartComponent {...props} />
    </div>
  );
}
