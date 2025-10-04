import { Users, Shuffle, Filter, type LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type SamplingMethods = "top_n" | "systematic" | "random";

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

export interface SamplingConfig {
  id: SamplingMethods;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const samplingConfigs: SamplingConfig[] = [
  {
    id: "top_n",
    name: "Top N Categories",
    description:
      "Groups smaller categories into an 'Other' slice/bar for clarity. Best for categorical data.",
    icon: Users,
  },
  {
    id: "systematic",
    name: "Systematic Sampling",
    description:
      "Selects every Nth data point to reduce density while preserving the overall trend.",
    icon: Filter,
  },
  {
    id: "random",
    name: "Random Sampling",
    description:
      "Selects a random subset of data points to see the general distribution without performance loss.",
    icon: Shuffle,
  },
];

export const samplingConfigMap = new Map<string, SamplingConfig>(
  samplingConfigs.map((config) => [config.id, config]),
);
