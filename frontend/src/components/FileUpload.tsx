import { useState } from "react";
import { useAppState, useAppDispatch } from "@/hooks/useAppContext";
import { uploadDataset } from "@/api/apiService";
import { chartConfigs } from "@/config/chartConfig";

import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface FileUploadProps {
  onClose?: () => void;
}

export function FileUpload({ onClose }: FileUploadProps) {
  const { isLoading, error } = useAppState();
  const dispatch = useAppDispatch();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Your Dataset</CardTitle>
          <CardDescription>
            Start by providing a brief description of your data and uploading a
            CSV file.
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
              <AlertTitle className="text-left">Upload Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {formError && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle className="text-left">Missing Information</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Dataset Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Monthly sales data for a small retail business"
                value={description}
                onChange={(e) => {
                  setFormError(null);
                  setDescription(e.target.value);
                }}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isLoading}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Uploading..." : "Upload and Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
