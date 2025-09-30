import { useAppState } from "./useAppContext";
import type { ColumnMapping } from "@/types/charts";
import { useMemo } from "react";

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

  const data = useMemo(() => {
    if (!fullDataset || !mapping) {
      return null;
    }

    const xKey = mapping.x ?? mapping.category;
    const yKey = mapping.y ?? mapping.value;

    if (!xKey || !yKey) {
      return null;
    }

    return fullDataset.map((row) => ({
      x: row[xKey],
      y: row[yKey],
    }));
  }, [fullDataset, mapping]);

  return {
    data,
    isLoading: !data && !!fullDataset,
    error: null,
  };
};
