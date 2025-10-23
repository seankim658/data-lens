/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useAppState } from "@/hooks/useAppContext";
import { useEffect, useState, useMemo, useCallback } from "react";
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const memoizedMapping = useMemo(
    () => (mapping ? JSON.stringify(mapping) : null),
    [mapping],
  );

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

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
    refreshTrigger,
  ]);

  return { data, isLoading, error, refetch };
};
