/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  LineChart,
  Line,
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

export function LineChartView({ data, mapping }: ChartViewProps) {
  const xKey = mapping.x;
  const yKey = mapping.y;

  if (!xKey || !yKey) return null;

  return (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="x" name={xKey} />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Line
        type="monotone"
        dataKey="y"
        name={yKey}
        stroke="var(--color-chart-2)"
        activeDot={{ r: 8 }}
      />
    </LineChart>
  );
}
