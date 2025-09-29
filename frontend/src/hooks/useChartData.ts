import { useAppState } from "./useAppContext";
import type { AxisId } from "@/config/chartConfig";

type ColumnMapping = Record<AxisId, string | null>;

/**
 * Adapter that provides chart data to UI components.
 *
 * Right now for simplicity's sake, the backend sends the
 * full data ack to the client once. We will limit file
 * uploads to 30MB. Hook is designed to decouple components
 * from the data fetching strategy, so if an API driven
 * architecture is needed later, will just need to update
 * this hook.
 */
export const useChartData = (mapping: ColumnMapping | null) => {
  const { chartData: fullDataset } = useAppState();

  // TODO : Memoize later
  return {
    data: fullDataset,
    isLoading: false,
    error: null,
  };
};
