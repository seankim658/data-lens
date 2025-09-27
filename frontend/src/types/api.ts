/* eslint-disable  @typescript-eslint/no-explicit-any */

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
  chat_history: ChatMessage[];
  analysis_log: AnalysisRecord[];
}

export interface UploadResponse {
  session_id: string;
  data: SessionData;
}

export interface AnalyzeResponse {
  explanation: string;
  correctness: "correct" | "partially_correct" | "incorrect";
}

export interface ChatResponse {
  explanation: string;
}
