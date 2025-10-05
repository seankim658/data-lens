import {
  ChartColumn,
  LineChart,
  PieChart,
  ScatterChart,
  type LucideProps,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { SamplingMethods } from "@/config/samplingConfig";
import type { AggregationMethods } from "./aggregationConfig";

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
  sampling_threshold: number;
  supported_sampling_methods: SamplingMethods[];
  supported_aggregations?: AggregationMethods[];
  axes: AxisConfig[];
}

export const chartConfigs: ChartConfig[] = [
  {
    id: "bar",
    name: "Bar Chart",
    description: "Compare values across categories.",
    icon: ChartColumn,
    sampling_threshold: 1000,
    supported_sampling_methods: ["top_n"],
    supported_aggregations: ["mean", "sum", "count"],
    axes: [
      {
        id: "category",
        title: "Category (X-Axis)",
        description: "The labels for each bar.",
      },
      {
        id: "value",
        title: "Value (Y-Axis)",
        description: "Numeric value that determines the height of each bar.",
      },
    ],
  },
  {
    id: "line",
    name: "Line Chart",
    description: "Show a trend over time.",
    icon: LineChart,
    sampling_threshold: 500,
    supported_sampling_methods: ["systematic", "random"],
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
    sampling_threshold: 50,
    supported_sampling_methods: ["top_n"],
    supported_aggregations: ["mean", "sum", "count"],
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
    sampling_threshold: 1000,
    supported_sampling_methods: ["systematic", "random"],
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
