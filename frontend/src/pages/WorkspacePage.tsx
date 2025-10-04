import { useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/hooks/useAppContext";
import { updateSessionState, resetSession } from "@/api/apiService";
import { useAppDispatch } from "@/hooks/useAppContext";
import { FileUpload } from "@/components/FileUpload";
import { ChartSelection } from "@/components/ChartSelection";
import { ChartSetup } from "@/components/ChartSetup";
import { DynamicChartView } from "@/components/DynamicChartView";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { useChartData } from "@/hooks/useChartData";
import type { ColumnMapping } from "@/types/charts";
import { chartConfigMap } from "@/config/chartConfig";
import { SamplingSelection } from "@/components/SamplingSelection";
import { AggregationSelection } from "@/components/AggregationSelection";
import type { AggregationMethods } from "@/config/aggregationConfig";
import type { SamplingMethods } from "@/config/samplingConfig";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";

type WorkspaceStep =
  | "chartSelection"
  | "columnMapping"
  | "aggregationSelection"
  | "samplingSelection"
  | "visualization";

interface WorkspaceState {
  step: WorkspaceStep;
  chartType: string | null;
  columnMapping: ColumnMapping | null;
  aggregationMethod: AggregationMethods | null;
  samplingMethod: string | null;
}

type WorkspaceAction =
  | { type: "SELECT_CHART"; payload: string }
  | { type: "SET_MAPPING"; payload: ColumnMapping }
  | { type: "GO_TO_AGGREGATION" }
  | { type: "SELECT_AGGREGATION"; payload: AggregationMethods }
  | { type: "GO_TO_SAMPLING" }
  | { type: "SELECT_SAMPLING"; payload: SamplingMethods }
  | { type: "GO_TO_VISUALIZATION" }
  | { type: "GO_BACK" };

const initialState: WorkspaceState = {
  step: "chartSelection",
  chartType: null,
  columnMapping: null,
  aggregationMethod: null,
  samplingMethod: null,
};

const workspaceReducer = (
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState => {
  switch (action.type) {
    case "SELECT_CHART":
      return {
        ...state,
        step: "columnMapping",
        chartType: action.payload,
        columnMapping: null,
        aggregationMethod: null,
        samplingMethod: null,
      };
    case "SET_MAPPING":
      return { ...state, columnMapping: action.payload };
    case "GO_TO_AGGREGATION":
      return { ...state, step: "aggregationSelection" };
    case "SELECT_AGGREGATION":
      return { ...state, aggregationMethod: action.payload };
    case "GO_TO_SAMPLING":
      return { ...state, step: "samplingSelection" };
    case "SELECT_SAMPLING":
      return {
        ...state,
        samplingMethod: action.payload,
      };
    case "GO_TO_VISUALIZATION":
      return { ...state, step: "visualization" };
    case "GO_BACK":
      if (state.step === "visualization" || state.step === "samplingSelection") {
        const config = state.chartType
          ? chartConfigMap.get(state.chartType)
          : null;
        if (config?.supported_aggregations) {
          return { ...state, step: "aggregationSelection" };
        }
        return { ...state, step: "columnMapping", columnMapping: null };
      }
      if (state.step === "aggregationSelection") {
        return { ...state, step: "columnMapping", columnMapping: null };
      }
      return { ...initialState };
    default:
      return state;
  }
};

export const WorkspacePage = () => {
  const { sessionId, row_count } = useAppState();
  const appDispatch = useAppDispatch();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    data: chartData,
    isLoading: isChartDataLoading,
    error: chartDataError,
  } = useChartData(
    state.chartType,
    state.columnMapping,
    state.aggregationMethod,
    state.samplingMethod,
  );

  useEffect(() => {
    if (sessionId) {
      updateSessionState({
        session_id: sessionId,
        current_step: state.step,
        selected_chart_type: state.chartType,
        column_mapping: state.columnMapping,
      }).catch((err) => {
        console.error("Failed to sync session state:", err);
      });
    }
  }, [sessionId, state.step, state.chartType, state.columnMapping]);

  const handleChartSelect = (type: string) => {
    dispatch({ type: "SELECT_CHART", payload: type });
  };

  const handleColumnMapping = (mapping: ColumnMapping) => {
    dispatch({ type: "SET_MAPPING", payload: mapping });
    const config = state.chartType ? chartConfigMap.get(state.chartType) : null;

    // Check if aggregation is required
    if (config?.supported_aggregations) {
      dispatch({ type: "GO_TO_AGGREGATION" });
    }
    // Check if sampling is required
    else if (config && row_count && row_count > config.sampling_threshold) {
      dispatch({ type: "GO_TO_SAMPLING" });
    }
    // Go straigh to chart
    else {
      dispatch({ type: "GO_TO_VISUALIZATION" });
    }
  };

  const handleAggregationSelect = (method: AggregationMethods) => {
    dispatch({ type: "SELECT_AGGREGATION", payload: method });
  };

  const handleAggregationContinue = () => {
    const config = state.chartType ? chartConfigMap.get(state.chartType) : null;
    if (config && row_count && row_count > config.sampling_threshold) {
      dispatch({ type: "GO_TO_SAMPLING" });
    } else {
      dispatch({ type: "GO_TO_VISUALIZATION" });
    }
  };

  const handleSelectSampling = (method: SamplingMethods) => {
    dispatch({ type: "SELECT_SAMPLING", payload: method });
  };

  const handleSamplingContinue = () => {
    dispatch({ type: "GO_TO_VISUALIZATION" });
  };

  const handleBack = () => {
    dispatch({ type: "GO_BACK" });
  };

  const handleReset = async () => {
    // TODO : make better confirm later
    if (
      sessionId &&
      window.confirm("Are you sure you want to reset your session?")
    ) {
      try {
        await resetSession(sessionId);
        appDispatch({ type: "RESET_SESSION" });
        navigate("/");
      } catch (err) {
        console.error("Failed to reset session:", err);
      }
    }
  };

  const renderContent = () => {
    const chartConfig = state.chartType
      ? chartConfigMap.get(state.chartType)
      : null;
    switch (state.step) {
      case "chartSelection":
        return <ChartSelection onSelectChart={handleChartSelect} />;

      case "columnMapping":
        if (!state.chartType) {
          handleBack();
          return null;
        }
        return (
          <ChartSetup
            chartType={state.chartType}
            onBack={handleBack}
            onGenerate={handleColumnMapping}
          />
        );

      case "aggregationSelection":
        if (!chartConfig?.supported_aggregations) {
          // This shouldn't happen
          handleBack()
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
        if (!state.chartType || !state.columnMapping || !chartData) {
          return <div>Preparing visualization...</div>;
        }

        return (
          <DynamicChartView
            chartType={state.chartType}
            mapping={state.columnMapping}
            data={chartData}
            chartTitle={chartConfig?.name ?? ""}
            xAxisTitle={
              state.columnMapping.category ?? state.columnMapping.x ?? ""
            }
            yAxisTitle={
              state.columnMapping.value ?? state.columnMapping.y ?? ""
            }
          />
        );
      default:
        return <ChartSelection onSelectChart={handleChartSelect} />;
    }
  };

  if (!sessionId) {
    return <FileUpload />;
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
              <ChatSidebar currentStep={state.step} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};
