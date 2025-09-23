import { useState } from "react";
import { useAppState, useAppDispatch } from "@/hooks/useAppContext";
import { uploadDataset } from "@/api/apiService";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const FileUpload = () => {
  const { isLoading, error } = useAppState();
  const dispatch = useAppDispatch();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !description) {
      // TODO : eventually replace this with component that fits UI
      alert("Please provide both a description and a file");
      return;
    }

    dispatch({ type: "UPLOAD_START" });
    try {
      const response = await uploadDataset(description, file);
      dispatch({
        type: "UPLOAD_SUCCESS",
        payload: { sessionId: response.session_id, summary: response.summary },
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
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Dataset Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Monthly sales data for a small retail business"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Uploading..." : "Upload and Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
