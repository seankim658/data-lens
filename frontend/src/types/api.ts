/* eslint-disable  @typescript-eslint/no-explicit-any */

import type { ColumnMapping } from "@/types/charts";

export interface LensControl {
  type: string;
  target: string;
  label: string;
}

export interface LensConfig {
  id: string;
  name: string;
  description: string;
  controls: LensControl[];
  lens_prompt: string;
}

export interface InteractionPayload {
  session_id: string;
  tool: string;
  details: Record<string, any>;
  user_hypothesis?: string | null;
  before_image_base64: string;
  after_image_base64: string;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  description: { [key: string]: any } | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnalysisRecord {
  lens_id: string;
  lens_name: string;
  user_hypothesis: string;
  ai_summary: string;
  correctness: "correct" | "partially_correct" | "incorrect";
}

export interface SessionData {
  summary: string;
  columns: ColumnInfo[];
  row_count: number;
  chat_history: ChatMessage[];
  analysis_log: AnalysisRecord[];
  current_step?: string;
  selected_chart_type?: string | null;
  column_mapping?: ColumnMapping | null;
  active_lens_id?: string | null;
}

export interface SessionStateUpdatePayload {
  session_id: string;
  current_step?: string;
  selected_chart_type?: string | null;
  column_mapping?: ColumnMapping | null;
  active_lens_id?: string | null;
}

export interface UploadResponse {
  session_id: string;
  data: SessionData;
}

export interface AnalyzeResponse {
  response: string;
  correctness: "correct" | "partially_correct" | "incorrect";
}

export interface ChatResponse {
  response: string;
}

export interface ChartContext {
  type: string;
  active_columns: string[];
}

export interface DatasetContext {
  columns: ColumnInfo[];
  column_counts_by_dtype: Record<string, number>;
}

export interface EvaluationContext {
  chart: ChartContext;
  dataset: DatasetContext;
}

export interface PreloadedDataset {
  id: string;
  name: string;
  description: string;
}
