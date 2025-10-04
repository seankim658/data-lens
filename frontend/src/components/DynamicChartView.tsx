/* eslint-disable  @typescript-eslint/no-explicit-any */

import type { ColumnMapping } from "@/types/charts";
import { BarChartView } from "@/components/charts/BarChartView";
import { LineChartView } from "@/components/charts/LineChartView";
import { PieChartView } from "@/components/charts/PieChartView";
import { ScatterChartView } from "@/components/charts/ScatterChartView";

interface DynamicChartViewProps {
  chartType: string;
  mapping: ColumnMapping;
  data: Record<string, any>[];
  chartTitle: string;
  xAxisTitle: string;
  yAxisTitle: string;
}

const chartComponentMap: Record<string, React.FC<any>> = {
  bar: BarChartView,
  line: LineChartView,
  pie: PieChartView,
  scatter: ScatterChartView,
};

export function DynamicChartView({
  chartType,
  mapping,
  data,
  chartTitle,
  xAxisTitle,
  yAxisTitle,
}: DynamicChartViewProps) {
  if (!data || data.length === 0) {
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
      <ChartComponent
        data={data}
        mapping={mapping}
        chartTitle={chartTitle}
        xAxisTitle={xAxisTitle}
        yAxisTitle={yAxisTitle}
      />
    </div>
  );
}
