import { useState } from "react";
import { useAppState } from "@/hooks/useAppContext";
import { FileUpload } from "@/components/FileUpload";
import { ChartSelection } from "@/components/ChartSelection";
import { ChartSetup } from "@/components/ChartSetup";

type WorkspaceStep = "chartSelection" | "columnMapping" | "visualization";
type ColumnMapping = Record<string, string | null>;

// TODO : PLACEHOLDER for the main visualization component
const ChartView = ({
  chartType,
  mapping,
}: {
  chartType: string;
  mapping: ColumnMapping;
}) => (
  <div className="text-center p-8 border rounded-lg">
    <h2 className="text-2xl font-semibold">Initial Chart Generated</h2>
    <p className="text-muted-foreground">
      Ready to begin investigation with the Data Lens toolkit.
    </p>
    <div className="mt-6 p-4 bg-secondary rounded-md text-left text-sm font-mono">
      <p>
        <strong>Chart Type:</strong> {chartType}
      </p>
      <p>
        <strong>Column Mapping:</strong>
      </p>
      <pre className="mt-2">{JSON.stringify(mapping, null, 2)}</pre>
    </div>
  </div>
);

export const WorkspacePage = () => {
  const { sessionId } = useAppState();
  const [step, setStep] = useState<WorkspaceStep>("chartSelection");
  const [chartType, setChartType] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(
    null,
  );

  const handleChartSelect = (type: string) => {
    setChartType(type);
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
        return (
          <ChartSetup
            chartType={chartType!}
            onBack={handleBackToSelection}
            onGenerate={handleColumnMapping}
          />
        );
      case "visualization":
        return <ChartView chartType={chartType!} mapping={columnMapping!} />;
      default:
        return <ChartSelection onSelectChart={handleChartSelect} />;
    }
  };

  // Show FileUpload if no session, otherwise show the current step of the workflow
  return sessionId ? renderContent() : <FileUpload />;
};
