import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/hooks/useAppContext";
import {
  updateSessionState,
  resetSession,
  getCompatibleLenses,
} from "@/api/apiService";
import { useAppDispatch } from "@/hooks/useAppContext";
import type { WorkspaceStep } from "@/context/AppContext";
import { FileUpload } from "@/components/FileUpload";
import { ChartAndColumnSelection } from "@/components/ChartAndColumnSelection";
import { DynamicChartView } from "@/components/DynamicChartView";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { chartConfigMap } from "@/config/chartConfig";
import { useChartData } from "@/hooks/useChartData";
import { AggregationSelection } from "@/components/AggregationSelection";
import { SamplingSelection } from "@/components/SamplingSelection";
import { LensPanel } from "@/components/LensPanel";
import type { ColumnMapping } from "@/types/charts";
import type { AggregationMethods } from "@/config/aggregationConfig";
import type { SamplingMethods } from "@/config/samplingConfig";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { LensConfig } from "@/types/api";
import { isNumeric } from "@/lib/utils";

export function WorkspacePage() {
  const {
    sessionId,
    step,
    chartType,
    columnMapping,
    aggregationMethod,
    samplingMethod,
    activeLensId,
    columns,
  } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [lensConfig, setLensConfig] = useState<LensConfig[] | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    const fetchLensConfig = async () => {
      if (chartType && columnMapping && columns) {
        try {
          const context = {
            chart: {
              type: chartType,
              active_columns: Object.values(columnMapping).filter(
                Boolean,
              ) as string[],
            },
            dataset: {
              columns,
              column_counts_by_dtype: columns.reduce(
                (acc, col) => {
                  const key = isNumeric(col.dtype) ? "numeric" : "categorical";
                  acc[key] = (acc[key] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>,
              ),
            },
          };

          const config = await getCompatibleLenses(context);
          setLensConfig(config);
        } catch (error) {
          console.error("Error fetching lens config:", error);
        }
      }
    };

    fetchLensConfig();
  }, [chartType, columnMapping, columns]);

  const {
    data: chartData,
    isLoading: isChartDataLoading,
    error: chartDataError,
    refetch: refreshChart,
  } = useChartData(chartType, columnMapping, aggregationMethod, samplingMethod);

  const handleChartAndColumnSelection = useCallback(
    async (selectedChartType: string, mapping: ColumnMapping) => {
      if (!sessionId) return;

      try {
        await updateSessionState({
          session_id: sessionId,
          current_step: "columnMapping",
          selected_chart_type: selectedChartType,
          column_mapping: mapping,
        });

        dispatch({
          type: "UPDATE_CHART_SELECTION",
          payload: selectedChartType,
        });

        dispatch({
          type: "UPDATE_COLUMN_MAPPING",
          payload: mapping,
        });

        const chartConfig = chartConfigMap.get(selectedChartType);
        if (chartConfig?.supported_aggregations) {
          dispatch({
            type: "UPDATE_STEP",
            payload: "aggregationSelection",
          });
        } else {
          const needsSampling = await checkIfSamplingNeeded(
            sessionId,
            selectedChartType,
          );
          if (needsSampling) {
            dispatch({
              type: "UPDATE_STEP",
              payload: "samplingSelection",
            });
          } else {
            dispatch({
              type: "UPDATE_STEP",
              payload: "visualization",
            });
          }
        }
      } catch (error) {
        console.error("Error updating session:", error);
      }
    },
    [sessionId, dispatch],
  );

  const handleAggregationSelect = useCallback(
    (method: AggregationMethods) => {
      dispatch({
        type: "UPDATE_AGGREGATION",
        payload: method,
      });
    },
    [dispatch],
  );

  const handleAggregationContinue = useCallback(async () => {
    if (!sessionId || !chartType || !aggregationMethod) return;

    try {
      await updateSessionState({
        session_id: sessionId,
        current_step: "aggregationSelection",
        aggregation_method: aggregationMethod,
      });

      const needsSampling = await checkIfSamplingNeeded(sessionId, chartType);
      if (needsSampling) {
        dispatch({
          type: "UPDATE_STEP",
          payload: "samplingSelection",
        });
      } else {
        dispatch({
          type: "UPDATE_STEP",
          payload: "visualization",
        });
      }
    } catch (error) {
      console.error("Error updating session:", error);
    }
  }, [sessionId, chartType, aggregationMethod, dispatch]);

  const handleSelectSampling = useCallback(
    (method: SamplingMethods) => {
      dispatch({
        type: "UPDATE_SAMPLING",
        payload: method,
      });
    },
    [dispatch],
  );

  const handleSamplingContinue = useCallback(async () => {
    if (!sessionId || !samplingMethod) return;

    try {
      await updateSessionState({
        session_id: sessionId,
        current_step: "samplingSelection",
        sampling_method: samplingMethod,
      });

      dispatch({
        type: "UPDATE_STEP",
        payload: "visualization",
      });
    } catch (error) {
      console.error("Error updating session:", error);
    }
  }, [sessionId, samplingMethod, dispatch]);

  const handleBack = useCallback(async () => {
    if (!sessionId) return;

    const stepOrder: WorkspaceStep[] = [
      "chartSelection",
      "aggregationSelection",
      "samplingSelection",
      "visualization",
    ];

    const currentIndex = stepOrder.indexOf(step);
    const previousStep =
      currentIndex > 0 ? stepOrder[currentIndex - 1] : "chartSelection";

    try {
      await updateSessionState({
        session_id: sessionId,
        current_step: previousStep,
      });
      dispatch({
        type: "UPDATE_STEP",
        payload: previousStep,
      });
    } catch (error) {
      console.error("Error navigating back:", error);
    }
  }, [sessionId, step, dispatch]);

  const handleReset = useCallback(async () => {
    if (
      sessionId &&
      window.confirm(
        "Are you sure you want to start over? This will clear your current analysis.",
      )
    ) {
      try {
        await resetSession(sessionId);
        dispatch({ type: "RESET_SESSION" });
        navigate("/");
      } catch (err) {
        console.error("Failed to reset session:", err);
      }
    }
  }, [sessionId, dispatch, navigate]);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleSelectLens = useCallback(
    (lens: LensConfig | null) => {
      dispatch({
        type: "UPDATE_ACTIVE_LENS",
        payload: lens?.id || null,
      });
    },
    [dispatch],
  );

  const isSidebarEnabled = !!sessionId;

  const renderContent = () => {
    const chartConfig = chartType ? chartConfigMap.get(chartType) : null;
    switch (step) {
      case "chartSelection":
        return (
          <ChartAndColumnSelection onGenerate={handleChartAndColumnSelection} />
        );

      case "aggregationSelection":
        if (!chartConfig?.supported_aggregations) {
          handleBack();
          return null;
        }
        return (
          <AggregationSelection
            supportedMethods={chartConfig.supported_aggregations}
            onSelection={handleAggregationSelect}
            onContinue={handleAggregationContinue}
            onBack={handleBack}
          />
        );

      case "samplingSelection":
        if (!chartConfig) return null;
        return (
          <SamplingSelection
            supportedMethods={chartConfig.supported_sampling_methods}
            onSelection={handleSelectSampling}
            onContinue={handleSamplingContinue}
            onBack={handleBack}
          />
        );

      case "visualization":
        return (
          <div className="space-y-4">
            {isChartDataLoading && <p>Loading chart...</p>}
            {chartDataError && <p className="text-red-500">{chartDataError}</p>}
            {chartData && chartType && columnMapping && (
              <DynamicChartView
                chartType={chartType}
                data={chartData}
                chartTitle="Chart"
                xAxisTitle={columnMapping.category ?? columnMapping.x ?? ""}
                yAxisTitle={columnMapping.value ?? columnMapping.y ?? ""}
              />
            )}
            {lensConfig && lensConfig.length > 0 && (
              <LensPanel
                compatibleLenses={lensConfig}
                activeLens={
                  activeLensId
                    ? lensConfig.find((l) => l.id === activeLensId) || null
                    : null
                }
                onSelectLens={handleSelectLens}
              />
            )}
          </div>
        );

      default:
        return <FileUpload />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <SiteHeader
        onToggleSidebar={handleToggleSidebar}
        isSidebarEnabled={isSidebarEnabled}
        isSidebarOpen={isSidebarOpen}
        onReset={handleReset}
      />
      <div className="flex-1 overflow-hidden">
        {isSidebarOpen ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full p-6 overflow-auto">{renderContent()}</div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              defaultSize={30}
              minSize={20}
              maxSize={50}
            >
              <ChatSidebar currentStep={step} chartType={chartType} />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full p-6 overflow-auto">{renderContent()}</div>
        )}
      </div>
    </div>
  );
}

// Helper function to check if sampling is needed
async function checkIfSamplingNeeded(
  sessionId: string,
  chartType: string,
): Promise<boolean> {
  const chartConfig = chartConfigMap.get(chartType);
  if (!chartConfig) return false;

  try {
    const response = await fetch(
      `/api/session/${sessionId}/check-sampling?chart_type=${chartType}`,
    );
    const data = await response.json();
    return data.needs_sampling;
  } catch (error) {
    console.error("Error checking sampling:", error);
    return false;
  }
}
