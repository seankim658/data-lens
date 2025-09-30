/* eslint-disable  @typescript-eslint/no-explicit-any */

import { ResponsiveContainer } from "recharts";
import type { ColumnMapping } from "@/types/charts";
import { BarChartView } from "@/components/charts/BarChartView";
import { LineChartView } from "@/components/charts/LineChartView";
import { PieChartView } from "@/components/charts/PieChartView";
import { ScatterChartView } from "@/components/charts/ScatterChartView";

interface DynamicChartViewProps {
  chartType: string;
  mapping: ColumnMapping;
  data: Record<string, any>[];
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
}: DynamicChartViewProps) {
  if (!data || data.length === 0) {
    return (
      // TODO : Handle this better later
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available for the selected columns.
      </div>
    );
  }

  const ChartComponent = chartComponentMap[chartType];

  if (!ChartComponent) {
    // TODO : Handle better later
    return <div>Select a chart type to begin.</div>;
  }

  return (
    <div style={{ width: "100%", height: 500 }}>
      <ResponsiveContainer>
        <ChartComponent data={data} mapping={mapping} />
      </ResponsiveContainer>
    </div>
  );
}
