import { useState } from "react";
import { useAppState } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Axis, chartConfigMap } from "@/config/chartConfig";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ColumnMapping = Record<Axis, string | null>;

interface ChartSetupProps {
  chartType: string;
  onBack: () => void;
  onGenerate: (mapping: ColumnMapping) => void;
}

export const ChartSetup: React.FC<ChartSetupProps> = ({
  chartType,
  onBack,
  onGenerate,
}) => {
  const { columns } = useAppState();
  const requiredAxes = chartConfigMap.get(chartType)?.axes || [];
  const initialMapping = Object.fromEntries(
    requiredAxes.map((axis) => [axis, null]),
  ) as ColumnMapping;

  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<Axis | null>(null);

  const assignedColumns = new Set(Object.values(mapping).filter(Boolean));
  const availableColumns =
    columns?.filter((col) => !assignedColumns.has(col.name)) || [];
  const isFormComplete = requiredAxes.every((axis) => mapping[axis]);

  const handleDragStart = (columnName: string) => {
    setDraggedColumn(columnName);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (targetAxis: Axis) => {
    if (draggedColumn) {
      setMapping((prev) => ({ ...prev, [targetAxis]: draggedColumn }));
      setDraggedColumn(null);
    }
    setIsDraggingOver(null);
  };

  const handleClearAxis = (axis: Axis) => {
    setMapping((prev) => ({ ...prev, [axis]: null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete) {
      onGenerate(mapping);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Map Your Data Columns</CardTitle>
          <CardDescription>
            Drag columns from the grid and drop them onto the desired axis.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {/* Drop Zones for Axes */}
            <div className="flex justify-center gap-4 p-4 rounded-lg bg-secondary/50">
              {requiredAxes.map((axis) => (
                <div
                  key={axis}
                  onDrop={() => handleDrop(axis)}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setIsDraggingOver(axis)}
                  onDragLeave={() => setIsDraggingOver(null)}
                  className={cn(
                    "w-full p-2 space-y-2 text-center border-2 border-dashed rounded-md transition-colors",
                    isDraggingOver === axis
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30",
                  )}
                >
                  <p className="text-sm font-medium capitalize text-muted-foreground">
                    {axis} Axis
                  </p>
                  <div className="flex items-center justify-center h-10">
                    {mapping[axis] ? (
                      <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full bg-primary text-primary-foreground">
                        {mapping[axis]}
                        <button
                          type="button"
                          onClick={() => handleClearAxis(axis)}
                          className="p-0.5 rounded-full hover:bg-primary/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground/80">
                        Drop column here
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid of Available Columns */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-center">
                Available Columns
              </h3>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg md:grid-cols-4">
                {availableColumns.map((col) => (
                  <div
                    key={col.name}
                    draggable
                    onDragStart={() => handleDragStart(col.name)}
                    onDragEnd={() => setDraggedColumn(null)}
                    className="flex items-center justify-center p-2 text-center transition-all bg-secondary rounded-md cursor-grab active:cursor-grabbing active:scale-105 active:bg-primary active:text-primary-foreground"
                  >
                    {col.name}
                  </div>
                ))}
                {availableColumns.length === 0 && (
                  <p className="col-span-full text-center text-muted-foreground">
                    All columns have been assigned.
                  </p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" disabled={!isFormComplete}>
              Generate Chart
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
