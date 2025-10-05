import { Sigma, Plus, Hash, type LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type AggregationMethods = "mean" | "sum" | "count";

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

export interface AggregationConfig {
  id: AggregationMethods;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const aggregationConfigs: AggregationConfig[] = [
  {
    id: "mean",
    name: "Show Average",
    description: "Calculate the average value for each category.",
    icon: Sigma,
  },
  {
    id: "sum",
    name: "Show Total",
    description: "Calculate the total sum for each category.",
    icon: Plus,
  },
  {
    id: "count",
    name: "Show Count",
    description: "Count the number of occurrences in each category.",
    icon: Hash,
  },
];

export const aggregationConfigMap = new Map<string, AggregationConfig>(
  aggregationConfigs.map((config) => [config.id, config]),
);
