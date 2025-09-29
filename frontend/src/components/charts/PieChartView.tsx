/* eslint-disable  @typescript-eslint/no-explicit-any */

import { PieChart, Pie, Tooltip, Legend, Cell } from "recharts";
import type { ColumnMapping } from "@/types/charts";
import { CustomTooltip } from "./CustomToolTip";

interface ChartViewProps {
  data: any[];
  mapping: ColumnMapping;
}

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function PieChartView({ data, mapping }: ChartViewProps) {
  const categoryKey = mapping.category;
  const valueKey = mapping.value;

  if (!categoryKey || !valueKey) return null;

  return (
    <PieChart>
      <Pie
        data={data}
        dataKey="y"
        nameKey="x"
        cx="50%"
        cy="50%"
        outerRadius={150}
        fill="var(--color-chart-1)"
        label
      >
        {data.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend />
    </PieChart>
  );
}
