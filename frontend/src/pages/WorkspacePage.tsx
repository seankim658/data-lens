import { useReducer } from "react";
import { useAppState } from "@/hooks/useAppContext";
import { FileUpload } from "@/components/FileUpload";
import { ChartSelection } from "@/components/ChartSelection";
import { ChartSetup } from "@/components/ChartSetup";
import { DynamicChartView } from "@/components/DynamicChartView";
import { useChartData } from "@/hooks/useChartData";
import type { ColumnMapping } from "@/types/charts";
import { chartConfigMap } from "@/config/chartConfig";
import { SamplingSelection } from "@/components/SamplingSelection";

type WorkspaceStep =
  | "chartSelection"
  | "columnMapping"
  | "sampling"
  | "visualization";

interface WorkspaceState {
  step: WorkspaceStep;
  chartType: string | null;
  columnMapping: ColumnMapping | null;
  samplingMethod: string | null;
}

type WorkspaceAction =
  | { type: "SELECT_CHART"; payload: string }
  | { type: "SET_MAPPING"; payload: ColumnMapping }
  | { type: "GO_TO_SAMPLING" }
  | { type: "SELECT_SAMPLING"; payload: string }
  | { type: "SKIP_SAMPLING" }
  | { type: "GO_BACK" };

const initialState: WorkspaceState = {
  step: "chartSelection",
  chartType: null,
  columnMapping: null,
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
        samplingMethod: null,
      };
    case "SET_MAPPING":
      return { ...state, columnMapping: action.payload };
    case "GO_TO_SAMPLING":
      return { ...state, step: "sampling" };
    case "SELECT_SAMPLING":
      return {
        ...state,
        step: "visualization",
        samplingMethod: action.payload,
      };
    case "SKIP_SAMPLING":
      return {
        ...state,
        step: "visualization",
        samplingMethod: null,
      };
    case "GO_BACK":
      if (state.step === "sampling" || state.step === "visualization") {
        return { ...state, step: "columnMapping", columnMapping: null };
      }
      return { ...initialState };
    default:
      return state;
  }
};

export const WorkspacePage = () => {
  const { sessionId, row_count } = useAppState();
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  const {
    data: chartData,
    isLoading: isChartDataLoading,
    error: chartDataError,
  } = useChartData(state.chartType, state.columnMapping, state.samplingMethod);

  const handleChartSelect = (type: string) => {
    dispatch({ type: "SELECT_CHART", payload: type });
  };

  const handleColumnMapping = (mapping: ColumnMapping) => {
    dispatch({ type: "SET_MAPPING", payload: mapping });
    const config = state.chartType ? chartConfigMap.get(state.chartType) : null;

    if (config && row_count && row_count > config.sampling_threshold) {
      dispatch({ type: "GO_TO_SAMPLING" });
    } else {
      dispatch({ type: "SKIP_SAMPLING" });
    }
  };

  const handleSelectSampling = (method: string) => {
    dispatch({ type: "SELECT_SAMPLING", payload: method });
  };

  const handleSkipSampling = () => {
    dispatch({ type: "SKIP_SAMPLING" });
  };

  const handleBack = () => {
    dispatch({ type: "GO_BACK" });
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
      case "sampling":
        if (!chartConfig) return null;
        return (
          <SamplingSelection
            supportedMethods={chartConfig.supported_sampling_methods}
            onSelectMethod={handleSelectSampling}
            onSkip={handleSkipSampling}
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
          />
        );
      default:
        return <ChartSelection onSelectChart={handleChartSelect} />;
    }
  };

  return sessionId ? renderContent() : <FileUpload />;
};
