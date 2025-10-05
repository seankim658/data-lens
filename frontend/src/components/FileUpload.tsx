import { useState, useEffect } from "react";
import { useAppState, useAppDispatch } from "@/hooks/useAppContext";
import type { PreloadedDataset } from "@/types/api";
import {
  uploadDataset,
  getPreloadedDatasets,
  loadPreloadedDataset,
} from "@/api/apiService";
import { chartConfigs } from "@/config/chartConfig";
import { X, AlertTriangle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onClose?: () => void;
}

export function FileUpload({ onClose }: FileUploadProps) {
  const { isLoading, error } = useAppState();
  const dispatch = useAppDispatch();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [preloaded, setPreloaded] = useState<PreloadedDataset[]>([]);
  const [selectedPreloadedId, setSelectedPreloadedId] = useState<string | null>(
    null,
  );
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    getPreloadedDatasets()
      .then(setPreloaded)
      .catch((err) =>
        console.error("Failed to fetch preloaded datasets:", err),
      );
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setSelectedPreloadedId(null);
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreloadedSelect = (datasetId: string) => {
    setFormError(null);
    setFile(null);
    setDescription("");
    setSelectedPreloadedId(
      datasetId === selectedPreloadedId ? null : datasetId,
    );
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setTimeout(() => {
      setFormError(null);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedPreloadedId) {
      setIsPreloading(true);
      dispatch({ type: "UPLOAD_START" });
      try {
        const response = await loadPreloadedDataset(
          selectedPreloadedId,
          chartConfigs,
        );
        dispatch({
          type: "UPLOAD_SUCCESS",
          payload: { sessionId: response.session_id, data: response.data },
        });
      } catch (err) {
        dispatch({ type: "UPLOAD_FAILURE", payload: (err as Error).message });
      } finally {
        setIsPreloading(false);
      }
      return;
    }

    if (!file || !description) {
      setFormError("Please provide both a description and a file.");
      return;
    }

    dispatch({ type: "UPLOAD_START" });
    try {
      const response = await uploadDataset(description, file, chartConfigs);
      dispatch({
        type: "UPLOAD_SUCCESS",
        payload: { sessionId: response.session_id, data: response.data },
      });
    } catch (err) {
      dispatch({ type: "UPLOAD_FAILURE", payload: (err as Error).message });
    }
  };

  const isAnalyzeDisabled =
    isLoading ||
    isPreloading ||
    (!selectedPreloadedId && (!file || !description.trim()));

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Start Your Investigation</CardTitle>
            <CardDescription>
              Upload a CSV file with a brief description, or select one of our
              sample datasets to begin.
            </CardDescription>
            {onClose && (
              <CardAction>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="w-5 h-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </CardAction>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle className="text-left">Action Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {formError && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle className="text-left">
                  Missing Information
                </AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">1. Dataset Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Monthly sales data for a small retail business"
                value={description}
                onChange={(e) => {
                  setFormError(null);
                  setSelectedPreloadedId(null);
                  setDescription(e.target.value);
                }}
                disabled={isLoading || isPreloading}
              />
            </div>
            <div className="space-y-2">
              <Label>2. Upload CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isLoading || isPreloading}
                className="hidden"
              />
              <Label
                htmlFor="file-upload"
                className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              >
                <span className="truncate pr-2 text-muted-foreground">
                  {file ? file.name : "No file chosen"}
                </span>
                <div className="flex-shrink-0 rounded-sm bg-secondary px-3 py-1 text-secondary-foreground">
                  Choose File
                </div>
              </Label>
            </div>

            {/* ++ Preloaded Datasets Section ++ */}
            {preloaded.length > 0 && (
              <>
                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-sm text-muted-foreground">
                    OR
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Start with a sample dataset</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {preloaded.map((dataset) => (
                      <Card
                        key={dataset.id}
                        onClick={() => handlePreloadedSelect(dataset.id)}
                        className={cn(
                          "cursor-pointer hover:border-primary transition-all text-left",
                          {
                            "border-primary ring-2 ring-primary/50":
                              selectedPreloadedId === dataset.id,
                          },
                        )}
                      >
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">
                            {dataset.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {dataset.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <div className="p-6 pt-0">
            <Button
              type="submit"
              className="w-full"
              disabled={isAnalyzeDisabled}
            >
              {isLoading || isPreloading ? (
                <>
                  <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
