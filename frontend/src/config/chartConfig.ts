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
  sampling_threshold: number;
  supported_sampling_methods: { id: string; name: string; description: string }[];
  axes: AxisConfig[];
}

export const chartConfigs: ChartConfig[] = [
  {
    id: "bar",
    name: "Bar Chart",
    description: "Compare values across categories.",
    icon: ChartColumn,
    sampling_threshold: 50000,
    supported_sampling_methods: [
      {
        id: "top_n",
        name: "Top N Categories",
        description:
          "Show the most significant categories and group the rest into 'Other'.",
      },
    ],
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
    sampling_threshold: 10000,
    supported_sampling_methods: [
      {
        id: "systematic",
        name: "Systematic Sampling",
        description:
          "Select every Nth data point to reduce density while preserving the overall trend.",
      },
      {
        id: "random",
        name: "Random Sampling",
        description: "Select a random subset of data points.",
      },
    ],
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
    supported_sampling_methods: [
      {
        id: "top_n",
        name: "Top N Slices",
        description:
          "Show the largest slices and group the rest into an 'Other' slice for clarity.",
      },
    ],
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
    sampling_threshold: 20000,
    supported_sampling_methods: [
      {
        id: "systematic",
        name: "Systematic Sampling",
        description: "Select every Nth data point to reduce density.",
      },
      {
        id: "random",
        name: "Random Sampling",
        description:
          "Select a random subset of data points to see the general distribution.",
      },
    ],
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
