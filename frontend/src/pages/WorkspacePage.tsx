import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/hooks/useAppContext";
import {
  updateSessionState,
  resetSession,
  getCompatibleLenses,
} from "@/api/apiService";
import { useAppDispatch } from "@/hooks/useAppContext";
import { FileUpload } from "@/components/FileUpload";
import { ChartSelection } from "@/components/ChartSelection";
import { ChartSetup } from "@/components/ChartSetup";
import { DynamicChartView } from "@/components/DynamicChartView";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { useChartData } from "@/hooks/useChartData";
import type { ColumnMapping } from "@/types/charts";
import type { LensConfig, EvaluationContext } from "@/types/api";
import { chartConfigMap } from "@/config/chartConfig";
import { SamplingSelection } from "@/components/SamplingSelection";
import { AggregationSelection } from "@/components/AggregationSelection";
import type { AggregationMethods } from "@/config/aggregationConfig";
import type { SamplingMethods } from "@/config/samplingConfig";
import { LensPanel } from "@/components/LensPanel";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { calculateColumnCounts } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

export const WorkspacePage = () => {
  const {
    sessionId,
    isLoading,
    row_count,
    columns,
    step,
    chartType,
    columnMapping,
    aggregationMethod,
    samplingMethod,
    activeLensId,
  } = useAppState();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [compatibleLenses, setCompatibleLenses] = useState<LensConfig[]>([]);

  // Lens props
  const [yDomain, setYDomain] = useState<[number, number] | null>(null);

  const chartConfig = useMemo(
    () => (chartType ? chartConfigMap.get(chartType) : null),
    [chartType],
  );

  const {
    data: chartData,
    isLoading: isChartDataLoading,
    error: chartDataError,
  } = useChartData(chartType, columnMapping, aggregationMethod, samplingMethod);

  useEffect(() => {
    if (sessionId) {
      updateSessionState({
        session_id: sessionId,
        current_step: step,
        selected_chart_type: chartType,
        column_mapping: columnMapping,
        active_lens_id: activeLensId,
      }).catch((err) => {
        console.error("Failed to sync session state:", err);
      });
    }
  }, [sessionId, step, chartType, columnMapping, activeLensId]);

  useEffect(() => {
    if (step === "visualization" && sessionId && chartType && columns) {
      const fetchLenses = async () => {
        try {
          const context: EvaluationContext = {
            chart: {
              type: chartType!,
              active_columns: Object.values(columnMapping || {}).filter(
                (c): c is string => !!c,
              ),
            },
            dataset: {
              columns: columns,
              column_counts_by_dtype: calculateColumnCounts(columns),
            },
          };
          const lenses = await getCompatibleLenses(context);
          setCompatibleLenses(lenses);
        } catch (err) {
          console.error("Failed to fetch compatible lenses:", err);
        }
      };
      fetchLenses();
    } else {
      setCompatibleLenses([]);
      dispatch({ type: "SET_ACTIVE_LENS", payload: null });
    }
  }, [step, sessionId, chartType, columnMapping, columns, dispatch]);

  const activeLens = useMemo(() => {
    return compatibleLenses.find((lens) => lens.id === activeLensId) || null;
  }, [compatibleLenses, activeLensId]);

  const handleChartSelect = useCallback(
    (type: string) => {
      dispatch({ type: "SELECT_CHART", payload: type });
    },
    [dispatch],
  );

  const handleColumnMapping = useCallback(
    (mapping: ColumnMapping) => {
      dispatch({ type: "SET_MAPPING", payload: mapping });
      if (chartConfig?.supported_aggregations) {
        dispatch({ type: "GO_TO_AGGREGATION" });
      } else if (
        chartConfig &&
        row_count &&
        row_count > chartConfig.sampling_threshold
      ) {
        dispatch({ type: "GO_TO_SAMPLING" });
      } else {
        dispatch({ type: "GO_TO_VISUALIZATION" });
      }
    },
    [dispatch, chartConfig, row_count],
  );

  const handleAggregationSelect = useCallback(
    (method: AggregationMethods) => {
      dispatch({ type: "SELECT_AGGREGATION", payload: method });
    },
    [dispatch],
  );

  const handleAggregationContinue = useCallback(() => {
    if (
      chartConfig &&
      row_count &&
      row_count > chartConfig.sampling_threshold
    ) {
      dispatch({ type: "GO_TO_SAMPLING" });
    } else {
      dispatch({ type: "GO_TO_VISUALIZATION" });
    }
  }, [dispatch, chartConfig, row_count]);

  const handleSelectSampling = useCallback(
    (method: SamplingMethods) => {
      dispatch({ type: "SELECT_SAMPLING", payload: method });
    },
    [dispatch],
  );

  const handleSamplingContinue = useCallback(() => {
    dispatch({ type: "GO_TO_VISUALIZATION" });
  }, [dispatch]);

  const handleSelectLens = useCallback(
    (lens: LensConfig | null) => {
      dispatch({ type: "SET_ACTIVE_LENS", payload: lens ? lens.id : null });
    },
    [dispatch],
  );

  const handleBack = useCallback(() => {
    dispatch({
      type: "GO_BACK",
      payload: {
        supported_aggregations: !!chartConfig?.supported_aggregations,
      },
    });
  }, [dispatch, chartConfig]);

  const handleReset = useCallback(async () => {
    // TODO : make better confirm later
    if (
      sessionId &&
      window.confirm("Are you sure you want to reset your session?")
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

  const renderContent = () => {
    const chartConfig = chartType ? chartConfigMap.get(chartType) : null;
    switch (step) {
      case "chartSelection":
        return <ChartSelection onSelectChart={handleChartSelect} />;

      case "columnMapping":
        if (!chartType) {
          handleBack();
          return null;
        }
        return (
          <ChartSetup
            chartType={chartType}
            onBack={handleBack}
            onGenerate={handleColumnMapping}
          />
        );

      case "aggregationSelection":
        if (!chartConfig?.supported_aggregations) {
          // This shouldn't happen
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
        // TODO : Handle these more gracefully later
        if (isChartDataLoading) return <div>Loading Chart...</div>;
        if (chartDataError) return <div>Error: {chartDataError}</div>;
        if (!chartType || !columnMapping || !chartData) {
          return <div>Preparing visualization...</div>;
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-full">
            <div className="lg:col-span-2 h-full">
              <DynamicChartView
                chartType={chartType}
                data={chartData}
                chartTitle={chartConfig?.name ?? ""}
                xAxisTitle={columnMapping.category ?? columnMapping.x ?? ""}
                yAxisTitle={columnMapping.value ?? columnMapping.y ?? ""}
                yDomain={yDomain}
              />
            </div>

            <div className="lg:col-span-1">
              <LensPanel
                compatibleLenses={compatibleLenses}
                activeLens={activeLens}
                onSelectLens={handleSelectLens}
              />
            </div>
          </div>
        );
      default:
        return <ChartSelection onSelectChart={handleChartSelect} />;
    }
  };

  // TODO : handle better later
  if (!sessionId) {
    return <FileUpload />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <LoaderCircle className="w-8 h-8 animate-spin" />
          <p className="text-lg">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <SiteHeader
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarEnabled={!!sessionId}
        isSidebarOpen={isSidebarOpen}
        onReset={handleReset}
      />
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={isSidebarOpen ? 70 : 100} minSize={30}>
          <div className="container mx-auto py-10 px-4 md:px-8 h-full overflow-y-auto">
            {renderContent()}
          </div>
        </ResizablePanel>

        {isSidebarOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
              <ChatSidebar currentStep={step} chartType={chartType} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};
