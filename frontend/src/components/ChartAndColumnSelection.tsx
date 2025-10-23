import { useState, useEffect, useRef } from "react";
import { useAppState } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  chartConfigs,
  chartConfigMap,
  type AxisId,
} from "@/config/chartConfig";
import type { ColumnMapping } from "@/types/charts";
import type { ColumnInfo } from "@/types/api";
import { cn, isNumeric } from "@/lib/utils";

interface ChartAndColumnSelectionProps {
  onGenerate: (chartType: string, mapping: ColumnMapping) => void;
}

const getChartRequirements = (
  chartId: string,
): {
  needsNumeric: boolean;
  needsCategorical: boolean;
  numericCount: number;
  categoricalCount: number;
} => {
  const config = chartConfigMap.get(chartId);
  if (!config) {
    return {
      needsNumeric: false,
      needsCategorical: false,
      numericCount: 0,
      categoricalCount: 0,
    };
  }

  let numericCount = 0;
  let categoricalCount = 0;

  config.axes.forEach((axis) => {
    if (axis.id === "category") {
      categoricalCount++;
    } else {
      numericCount++;
    }
  });

  return {
    needsNumeric: numericCount > 0,
    needsCategorical: categoricalCount > 0,
    numericCount,
    categoricalCount,
  };
};

const isChartCompatible = (
  chartId: string,
  numericColumns: ColumnInfo[],
  categoricalColumns: ColumnInfo[],
): boolean => {
  const requirements = getChartRequirements(chartId);
  return (
    numericColumns.length >= requirements.numericCount &&
    categoricalColumns.length >= requirements.categoricalCount
  );
};

const getCompatibleCharts = (column: ColumnInfo): string[] => {
  const isNum = isNumeric(column.dtype);
  return chartConfigs
    .filter((chart) => {
      const requirements = getChartRequirements(chart.id);
      if (isNum) {
        return requirements.needsNumeric;
      } else {
        return requirements.needsCategorical;
      }
    })
    .map((chart) => chart.id);
};

export function ChartAndColumnSelection({
  onGenerate,
}: ChartAndColumnSelectionProps) {
  const { columns } = useAppState();

  const [hasAnimated, setHasAnimated] = useState(false);

  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({} as ColumnMapping);

  useEffect(() => {
    setHasAnimated(true);
  }, []);

  const numericColumns =
    columns
      ?.filter((col) => isNumeric(col.dtype))
      .sort((a, b) => a.name.localeCompare(b.name)) || [];
  const categoricalColumns =
    columns
      ?.filter((col) => !isNumeric(col.dtype))
      .sort((a, b) => a.name.localeCompare(b.name)) || [];

  // Get active chart (selected or hovered)
  const activeChart = selectedChart || hoveredChart;

  // Determine which columns should be highlighted
  const getColumnHighlightState = (
    column: ColumnInfo,
  ): "highlighted" | "dimmed" | "normal" => {
    if (hoveredColumn) return "normal";
    if (selectedChart) return "normal";
    if (!activeChart) return "normal";

    const requirements = getChartRequirements(activeChart);
    const isNum = isNumeric(column.dtype);

    const isCompatible =
      (isNum && requirements.needsNumeric) ||
      (!isNum && requirements.needsCategorical);

    if (isCompatible) {
      return "highlighted";
    }
    return "dimmed";
  };

  // Determine which charts should be highlighted
  const getChartHighlightState = (
    chartId: string,
  ): "highlighted" | "dimmed" | "normal" => {
    // If chart is selected, always show it as selected
    if (selectedChart === chartId) return "highlighted";

    const isDisabled = !isChartCompatible(
      chartId,
      numericColumns,
      categoricalColumns,
    );

    if (isDisabled) return "dimmed";

    if (selectedChart) return "normal";
    if (hoveredColumn) {
      const column = [...numericColumns, ...categoricalColumns].find(
        (col) => col.name === hoveredColumn,
      );
      if (column) {
        const compatibleCharts = getCompatibleCharts(column);
        return compatibleCharts.includes(chartId) ? "highlighted" : "dimmed";
      }
    }

    // Check if chart is compatible with available columns
    if (!isChartCompatible(chartId, numericColumns, categoricalColumns)) {
      return "dimmed";
    }

    return "normal";
  };

  const handleChartClick = (chartId: string): void => {
    if (selectedChart === chartId) {
      setSelectedChart(null);
      setMapping({} as ColumnMapping);
      return;
    }
    if (!isChartCompatible(chartId, numericColumns, categoricalColumns)) {
      return;
    }
    setSelectedChart(chartId);
    const config = chartConfigMap.get(chartId);
    if (config) {
      const initialMapping = Object.fromEntries(
        config.axes.map((axis) => [axis.id, null]),
      ) as ColumnMapping;
      setMapping(initialMapping);
    }
  };

  const handleColumnClick = (column: ColumnInfo): void => {
    if (!selectedChart) return;

    const config = chartConfigMap.get(selectedChart);
    if (!config) return;

    const assignedColumns = new Set(Object.values(mapping).filter(Boolean));

    // Find the first unassigned axis that's compatible with this column type
    const isNum = isNumeric(column.dtype);
    const compatibleAxis = config.axes.find((axis) => {
      const axisNeedsNumeric = axis.id !== "category";
      const isCompatible = isNum === axisNeedsNumeric;
      const isUnassigned = !mapping[axis.id];
      return isCompatible && isUnassigned;
    });

    if (compatibleAxis && !assignedColumns.has(column.name)) {
      setMapping((prev) => ({
        ...prev,
        [compatibleAxis.id]: column.name,
      }));
    }
  };

  const handleRemoveColumn = (axisId: AxisId): void => {
    setMapping((prev) => ({
      ...prev,
      [axisId]: null,
    }));
  };

  const isFormComplete = (): boolean => {
    if (!selectedChart) return false;
    const config = chartConfigMap.get(selectedChart);
    if (!config) return false;
    return config.axes.every((axis) => mapping[axis.id]);
  };

  const handleGenerate = (): void => {
    if (selectedChart && isFormComplete()) {
      onGenerate(selectedChart, mapping);
    }
  };

  return (
    <div
      className={`w-full max-w-6xl mx-auto space-y-8 ${!hasAnimated ? "opacity-0 animate-fade-in-up" : ""}`}
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Choose Chart & Data</h2>
        <p className="text-muted-foreground">
          Select a chart type and assign your data columns. You can start with
          either!
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Chart Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Chart Types</h3>
          <div className="grid grid-cols-2 gap-3">
            {chartConfigs.map((chart) => {
              const Icon = chart.icon;
              const highlightState = getChartHighlightState(chart.id);
              const isSelected = selectedChart === chart.id;
              const isDisabled = !isChartCompatible(
                chart.id,
                numericColumns,
                categoricalColumns,
              );

              return (
                <Card
                  key={chart.id}
                  className={cn(
                    "p-4 transition-all duration-200",
                    !isDisabled && "cursor-pointer",
                    isDisabled && "cursor-not-allowed pointer-events-none",
                    !isDisabled &&
                      !isSelected &&
                      "hover:shadow-lg hover:scale-[1.02]",
                    isSelected &&
                      "ring-2 ring-primary border-primary bg-primary/5",
                    highlightState === "highlighted" &&
                      !isSelected &&
                      "border-primary/70 bg-primary/10 shadow-md",
                    highlightState === "dimmed" && "opacity-30",
                  )}
                  onClick={() => handleChartClick(chart.id)}
                  onMouseEnter={() => setHoveredChart(chart.id)}
                  onMouseLeave={() => setHoveredChart(null)}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Icon className="w-8 h-8" />
                    <div>
                      <h4 className="font-medium text-sm">{chart.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {chart.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Axis Mapping Section - Only show when chart is selected */}
          {selectedChart && (
            <div className="mt-6 space-y-3 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm">Assign Columns to Axes</h4>
              {chartConfigMap.get(selectedChart)?.axes.map((axis) => (
                <div
                  key={axis.id}
                  className="p-3 border rounded bg-background space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{axis.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {axis.description}
                      </p>
                    </div>
                  </div>
                  {mapping[axis.id] ? (
                    <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
                      <span className="text-sm font-medium">
                        {mapping[axis.id]}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveColumn(axis.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2 border-2 border-dashed rounded text-center text-xs text-muted-foreground">
                      Click a column to assign →
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Columns */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Data Columns</h3>

          {categoricalColumns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Categorical Fields
              </h4>
              <div className="flex flex-wrap gap-2">
                {categoricalColumns.map((column) => {
                  const highlightState = getColumnHighlightState(column);
                  const isAssigned = Object.values(mapping).includes(
                    column.name,
                  );
                  const isClickable = !isAssigned && selectedChart;

                  return (
                    <button
                      key={column.name}
                      className={cn(
                        "px-3 py-2 rounded-md border text-sm font-medium transition-all duration-200",
                        !isAssigned &&
                          !selectedChart &&
                          "cursor-pointer hover:shadow-md hover:scale-105",
                        isClickable &&
                          "cursor-pointer hover:shadow-md hover:scale-105 hover:bg-primary/10",
                        isAssigned &&
                          "bg-primary/10 border-primary cursor-default",
                        !isAssigned &&
                          !selectedChart &&
                          !isClickable &&
                          "cursor-default",
                        highlightState === "highlighted" &&
                          !isAssigned &&
                          "border-primary/70 bg-primary/10 shadow-md",
                        highlightState === "dimmed" && "opacity-30",
                      )}
                      onClick={() => handleColumnClick(column)}
                      onMouseEnter={() => setHoveredColumn(column.name)}
                      onMouseLeave={() => setHoveredColumn(null)}
                    >
                      {column.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {numericColumns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Numeric Fields
              </h4>
              <div className="flex flex-wrap gap-2">
                {numericColumns.map((column) => {
                  const highlightState = getColumnHighlightState(column);
                  const isAssigned = Object.values(mapping).includes(
                    column.name,
                  );
                  const isClickable = !isAssigned && selectedChart;

                  return (
                    <button
                      key={column.name}
                      className={cn(
                        "px-3 py-2 rounded-md border text-sm font-medium transition-all duration-200",
                        !isAssigned &&
                          !selectedChart &&
                          "cursor-pointer hover:shadow-md hover:scale-105",
                        isClickable &&
                          "cursor-pointer hover:shadow-md hover:scale-105 hover:bg-primary/10",
                        isAssigned &&
                          "bg-primary/10 border-primary cursor-default",
                        highlightState === "highlighted" &&
                          !isAssigned &&
                          "border-primary/70 bg-primary/10 shadow-md",
                        highlightState === "dimmed" && "opacity-30",
                        !isAssigned &&
                          selectedChart &&
                          highlightState !== "dimmed" &&
                          "hover:bg-primary/5",
                      )}
                      onClick={() => handleColumnClick(column)}
                      onMouseEnter={() => setHoveredColumn(column.name)}
                      onMouseLeave={() => setHoveredColumn(null)}
                    >
                      {column.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!selectedChart && (
            <div className="p-4 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Hover over chart types to see which
              columns they can use, or hover over columns to see compatible
              charts!
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleGenerate} disabled={!isFormComplete()} size="lg">
          Generate Chart
        </Button>
      </div>
    </div>
  );
}
