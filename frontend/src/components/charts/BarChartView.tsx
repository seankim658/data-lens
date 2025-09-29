/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ColumnMapping } from "@/types/charts";
import { CustomTooltip } from "@/components/charts/CustomToolTip";

interface ChartViewProps {
  data: any[];
  mapping: ColumnMapping;
}

export function BarChartView({ data, mapping }: ChartViewProps) {
  const categoryKey = mapping.category;
  const valueKey = mapping.value;

  if (!categoryKey || !valueKey) return null;

  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="x" name={categoryKey} />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      <Tooltip />
      <Legend />
      <Bar dataKey="y" name={valueKey} fill="var(--color-chart-1)" />
    </BarChart>
  );
}
