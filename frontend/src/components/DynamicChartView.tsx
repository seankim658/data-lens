/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useMemo } from "react";
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
  const transformedData = useMemo(() => {
    if (!data || !mapping) return [];

    const xKey = mapping.x ?? mapping.category;
    const yKey = mapping.y ?? mapping.value;

    if (!xKey || !yKey) return [];

    return data.map((row) => ({
      x: row[xKey],
      y: row[yKey],
    }));
  }, [data, mapping]);

  if (transformedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {/* TODO : handle this better later */}
        No data available for the selected columns.
      </div>
    );
  }

  const ChartComponent = chartComponentMap[chartType];

  if (!ChartComponent) {
    return <div>Select a chart type to begin.</div>;
  }

  return (
    <div style={{ width: "100%", height: 500 }}>
      <ResponsiveContainer>
        <ChartComponent data={transformedData} mapping={mapping} />
      </ResponsiveContainer>
    </div>
  );
}
