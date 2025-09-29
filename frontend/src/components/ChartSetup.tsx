import { useState } from "react";
import { useAppState } from "@/hooks/useAppContext";
import type { ColumnInfo } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { type AxisId, chartConfigMap } from "@/config/chartConfig";
import { GripVertical, X, Info } from "lucide-react";
import { cn, isNumeric } from "@/lib/utils";

interface ColumnPillGroupProps {
  columns: ColumnInfo[];
  onDragStart: (name: string) => void;
  onDragEnd: () => void;
  draggedColumn: string | null;
  emptyText: string;
}

function ColumnPillGroup({
  columns,
  onDragStart,
  onDragEnd,
  draggedColumn,
  emptyText,
}: ColumnPillGroupProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-2 min-h-[5.5rem] rounded-md bg-muted/30">
      {columns.length > 0 ? (
        columns.map((col) => (
          <div
            key={col.name}
            draggable
            onDragStart={() => onDragStart(col.name)}
            onDragEnd={onDragEnd}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md cursor-grab bg-background transition-all hover:border-primary hover:bg-primary/10 hover:text-primary active:cursor-grabbing active:shadow-lg active:scale-105",
              { "opacity-0": draggedColumn === col.name },
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="truncate" title={col.name}>
                {col.name}
              </span>
            </div>

            {col.description && (
              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-48" side="top" align="center">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-center truncate">
                        {col.name}
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            Data type
                          </span>
                          <span className="font-mono font-medium">
                            {col.dtype}
                          </span>
                        </div>
                        {Object.entries(col.description).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="font-mono font-medium">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

type ColumnMapping = Record<AxisId, string | null>;

interface ChartSetupProps {
  chartType: string;
  onBack: () => void;
  onGenerate: (mapping: ColumnMapping) => void;
}

export function ChartSetup({ chartType, onBack, onGenerate }: ChartSetupProps) {
  const { columns } = useAppState();
  const requiredAxesConfig = chartConfigMap.get(chartType)?.axes || [];
  const initialMapping = Object.fromEntries(
    requiredAxesConfig.map((axis) => [axis.id, null]),
  ) as ColumnMapping;

  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<AxisId | null>(null);

  const assignedColumns = new Set(Object.values(mapping).filter(Boolean));
  const isFormComplete = requiredAxesConfig.every((axis) => mapping[axis.id]);

  const availableCategorical =
    columns
      ?.filter((col) => !assignedColumns.has(col.name) && !isNumeric(col.dtype))
      .sort((a, b) => a.name.localeCompare(b.name)) || [];
  const availableNumeric =
    columns
      ?.filter((col) => !assignedColumns.has(col.name) && isNumeric(col.dtype))
      .sort((a, b) => a.name.localeCompare(b.name)) || [];

  const axisKinds = new Set(
    requiredAxesConfig.map((axis) =>
      axis.id === "category" ? "category" : "numeric",
    ),
  );
  const areAxisTypesMixed = axisKinds.size > 1;

  const handleDragStart = (columnName: string) => {
    setDraggedColumn(columnName);
  };
  const handleDragEnd = () => {
    setDraggedColumn(null);
    setIsDraggingOver(null);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDragEnter = (targetAxisId: AxisId) => {
    if (!draggedColumn) return;

    const column = columns?.find((c) => c.name === draggedColumn);
    if (!column) return;

    const isCategoricalAxis = targetAxisId === "category";
    const isColumnNumeric = isNumeric(column.dtype);

    if (isCategoricalAxis !== isColumnNumeric) {
      setIsDraggingOver(targetAxisId);
    }
  };
  const handleDrop = (targetAxisId: AxisId) => {
    if (draggedColumn) {
      // Prevent dropping a numeric column on a category axis and vice versa
      const column = columns?.find((c) => c.name === draggedColumn);
      if (!column) return;
      const isCategoricalAxis = targetAxisId === "category";
      const isColumnNumeric = isNumeric(column.dtype);
      if (isCategoricalAxis === isColumnNumeric) {
        // Mismatch: trying to drop numeric on category, or vice versa
        setIsDraggingOver(null);
        return;
      }
      setMapping((prev) => ({ ...prev, [targetAxisId]: draggedColumn }));
    }
    setDraggedColumn(null);
    setIsDraggingOver(null);
  };
  const handleClearAxis = (axisId: AxisId) =>
    setMapping((prev) => ({ ...prev, [axisId]: null }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete) onGenerate(mapping);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div
          className="text-center mb-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <h2 className="text-2xl font-semibold">
            Map Data Columns for{" "}
            {chartType.charAt(0).toUpperCase() + chartType.substr(1)} Chart
          </h2>
          <p className="text-muted-foreground">
            Drag columns from the grid and drop them onto the desired chart
            component.
          </p>
        </div>

        <div className="space-y-6">
          {/* Drop Zones */}
          <div
            className="flex flex-col md:flex-row justify-center gap-6 p-4 pb-0 rounded-lg opacity-0 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            {requiredAxesConfig.map((axis) => (
              <div
                key={axis.id}
                onDrop={() => handleDrop(axis.id)}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(axis.id)}
                onDragLeave={() => setIsDraggingOver(null)}
                className={cn(
                  "w-full p-4 space-y-2 text-center border-2 border-dashed rounded-lg transition-colors",
                  isDraggingOver === axis.id
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/30",
                )}
              >
                <p className="font-semibold text-foreground pointer-events-none">
                  {axis.title}
                </p>
                <p className="text-xs text-muted-foreground px-2 pointer-events-none">
                  {axis.description}
                </p>
                <div className="flex items-center justify-center pt-2 h-12 pointer-events-none">
                  {mapping[axis.id] ? (
                    <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full bg-primary text-primary-foreground pointer-events-auto">
                      {mapping[axis.id]}
                      <button
                        type="button"
                        onClick={() => handleClearAxis(axis.id)}
                        className="p-0.5 rounded-full hover:bg-primary/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground/80 pointer-events-none">
                      Drop column here
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Available Columns */}
          <div
            className="text-left p-4 pt-0 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <h3 className="mb-4 text-lg font-semibold">Available Columns</h3>
            {areAxisTypesMixed ? (
              // Case 1: Mixed axis types (e.g., Bar Chart) -> Show two sections
              <div className="flex flex-col gap-8">
                <div className="space-y-3">
                  <h4 className="font-medium text-muted-foreground">
                    Categorical Fields
                  </h4>
                  <ColumnPillGroup
                    columns={availableCategorical}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    draggedColumn={draggedColumn}
                    emptyText="No available categorical columns."
                  />
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-muted-foreground">
                    Numeric Fields
                  </h4>
                  <ColumnPillGroup
                    columns={availableNumeric}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    draggedColumn={draggedColumn}
                    emptyText="No available numeric columns."
                  />
                </div>
              </div>
            ) : (
              // Case 2: Uniform axis types (e.g., Scatter Plot) -> Show one section
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">
                  {axisKinds.has("numeric")
                    ? "Numeric Fields"
                    : "Categorical Fields"}
                </h4>
                <ColumnPillGroup
                  columns={
                    axisKinds.has("numeric")
                      ? availableNumeric
                      : availableCategorical
                  }
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  draggedColumn={draggedColumn}
                  emptyText="No available columns."
                />
              </div>
            )}
          </div>
        </div>

        <div
          className="flex justify-between mt-12 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          <Button variant="outline" type="button" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={!isFormComplete}>
            Generate Chart
          </Button>
        </div>
      </form>
    </div>
  );
}
