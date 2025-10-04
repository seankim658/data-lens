/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useAppState } from "./useAppContext";
import { useEffect, useState, useMemo } from "react";
import { getChartData } from "@/api/apiService";
import type { ColumnMapping } from "@/types/charts";
import type { AggregationMethods } from "@/config/aggregationConfig";

/**
 * Provides chart data to UI components.
 */
export const useChartData = (
  chartType: string | null,
  mapping: ColumnMapping | null,
  aggregationMethod: AggregationMethods | null,
  samplingMethod: string | null,
) => {
  const { sessionId } = useAppState();
  const [data, setData] = useState<Record<string, any>[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memoizedMapping = useMemo(
    () => (mapping ? JSON.stringify(mapping) : null),
    [mapping],
  );

  useEffect(() => {
    if (!sessionId || !memoizedMapping || !chartType) {
      return;
    }

    const parsedMapping = JSON.parse(memoizedMapping) as ColumnMapping;

    const xKey = parsedMapping.x ?? parsedMapping.category;
    const yKey = parsedMapping.y ?? parsedMapping.value;

    if (!xKey || !yKey) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedData = await getChartData(
          sessionId,
          chartType,
          parsedMapping,
          aggregationMethod,
          samplingMethod,
        );

        setData(fetchedData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    sessionId,
    chartType,
    memoizedMapping,
    aggregationMethod,
    samplingMethod,
  ]);

  return { data, isLoading, error };
};
