import {
  ChartColumn,
  LineChart,
  PieChart,
  ScatterChart,
  type LucideProps,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type AxisId = "x" | "y" | "category" | "value";

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

export interface AxisConfig {
  id: AxisId;
  title: string;
  description: string;
}

export interface ChartConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  axes: AxisConfig[];
}

export const chartConfigs: ChartConfig[] = [
  {
    id: "bar",
    name: "Bar Chart",
    description: "Compare values across categories.",
    icon: ChartColumn,
    axes: [
      {
        id: "category",
        title: "Category (X-Axis)",
        description: "The labels for each bar.",
      },
      {
        id: "value",
        title: "Value (Y-Axis)",
        description:
          "Numeric value that determines the height of each bar.",
      },
    ],
  },
  {
    id: "line",
    name: "Line Chart",
    description: "Show a trend over time.",
    icon: LineChart,
    axes: [
      {
        id: "x",
        title: "X-Axis",
        description:
          "Typically a time series or sequential data (e.g., dates, years).",
      },
      {
        id: "y",
        title: "Y-Axis",
        description: "The numeric value plotted at each point on the X-Axis.",
      },
    ],
  },
  {
    id: "pie",
    name: "Pie Chart",
    description: "Display parts of a whole.",
    icon: PieChart,
    axes: [
      {
        id: "category",
        title: "Category / Slices",
        description: "The column whose unique values will form the pie slices.",
      },
      {
        id: "value",
        title: "Value / Size",
        description:
          "The numeric column that determines the size of each slice.",
      },
    ],
  },
  {
    id: "scatter",
    name: "Scatter Plot",
    description: "Show the relationship between two variables.",
    icon: ScatterChart,
    axes: [
      {
        id: "x",
        title: "X-Axis Variable",
        description: "The first numeric variable for comparison.",
      },
      {
        id: "y",
        title: "Y-Axis Variable",
        description: "The second numeric variable for comparison.",
      },
    ],
  },
];

export const chartConfigMap = new Map<string, ChartConfig>(
  chartConfigs.map((config) => [config.id, config]),
);
