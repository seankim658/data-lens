import {
  ChartColumn,
  LineChart,
  PieChart,
  ScatterChart,
  type LucideProps,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type Axis = "x" | "y" | "category" | "value";

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

export interface ChartConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  axes: Axis[];
}

export const chartConfigs: ChartConfig[] = [
  {
    id: "bar",
    name: "Bar Chart",
    description: "Compare values across categories.",
    icon: ChartColumn,
    axes: ["category", "value"],
  },
  {
    id: "line",
    name: "Line Chart",
    description: "Show a trend over time.",
    icon: LineChart,
    axes: ["x", "y"],
  },
  {
    id: "pie",
    name: "Pie Chart",
    description: "Display parts of a whole.",
    icon: PieChart,
    axes: ["category", "value"],
  },
  {
    id: "scatter",
    name: "Scatter Plot",
    description: "Show the relationship between two variables.",
    icon: ScatterChart,
    axes: ["x", "y"],
  },
];

export const chartConfigMap = new Map<string, ChartConfig>(
  chartConfigs.map((config) => [config.id, config]),
);
