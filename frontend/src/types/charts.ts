/* eslint-disable  @typescript-eslint/no-explicit-any */

import type { AxisId } from "@/config/chartConfig";

export type ColumnMapping = Record<AxisId, string | null>;

export interface ChartViewProps {
  data: any[];
  chartTitle: string;
  xAxisTitle: string;
  yAxisTitle: string;

  // Lenses
  yDomain?: [number, number] | null;
}
