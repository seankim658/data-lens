import { useAppState } from "@/hooks/useAppContext";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import { FileUpload } from "@/components/FileUpload";
import { ChartSelection } from "@/components/ChartSelection";
import { ChartSetup } from "@/components/ChartSetup";
import { DynamicChartView } from "@/components/DynamicChartView";
import { useChartData } from "@/hooks/useChartData";
import type { ColumnMapping } from "@/types/charts";

type WorkspaceStep = "chartSelection" | "columnMapping" | "visualization";

export const WorkspacePage = () => {
  const { sessionId } = useAppState();
  const [step, setStep] = useSessionStorageState<WorkspaceStep>(
    "workspaceStep",
    "chartSelection",
  );
  const [chartType, setChartType] = useSessionStorageState<string | null>(
    "workspaceChartType",
    null,
  );
  const [columnMapping, setColumnMapping] =
    useSessionStorageState<ColumnMapping | null>(
      "workspaceColumnMapping",
      null,
    );

  const { data: chartData, isLoading: isChartDataLoading } =
    useChartData(columnMapping);

  const handleChartSelect = (type: string) => {
    setChartType(type);
    setColumnMapping(null);
    setStep("columnMapping");
  };

  const handleColumnMapping = (mapping: ColumnMapping) => {
    setColumnMapping(mapping);
    setStep("visualization");
  };

  const handleBackToSelection = () => {
    setChartType(null);
    setColumnMapping(null);
    setStep("chartSelection");
  };

  const renderContent = () => {
    switch (step) {
      case "chartSelection":
        return <ChartSelection onSelectChart={handleChartSelect} />;
      case "columnMapping":
        if (!chartType) {
          return <div>Loading...</div>;
        }
        return (
          <ChartSetup
            chartType={chartType}
            onBack={handleBackToSelection}
            onGenerate={handleColumnMapping}
          />
        );
      case "visualization":
        // TODO : Handle these more gracefully later
        if (isChartDataLoading) return <div>Loading Chart...</div>;
        if (!chartType || !columnMapping || !chartData) {
          return <div>Preparing visualization...</div>;
        }

        console.log("PROPS:", { chartType, columnMapping, chartData });

        return (
          <DynamicChartView
            chartType={chartType}
            mapping={columnMapping}
            data={chartData}
          />
        );
      default:
        return <ChartSelection onSelectChart={handleChartSelect} />;
    }
  };

  return sessionId ? renderContent() : <FileUpload />;
};
