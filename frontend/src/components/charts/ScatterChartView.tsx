/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ColumnMapping } from "@/types/charts";
import { CustomTooltip } from "./CustomToolTip";

interface ChartViewProps {
  data: any[];
  mapping: ColumnMapping;
}

export function ScatterChartView({ data, mapping }: ChartViewProps) {
  const xKey = mapping.x;
  const yKey = mapping.y;

  if (!xKey || !yKey) return null;

  return (
    <ScatterChart>
      <CartesianGrid />
      <XAxis type="number" dataKey={xKey} name={xKey} />
      <YAxis type="number" dataKey={yKey} name={yKey} />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Scatter name="Data Points" data={data} fill="var(--color-chart-4)" />
    </ScatterChart>
  );
}
