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
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  details: Record<string, any>;
  user_hypothesis?: string | null;
  before_image_base64: string;
  after_image_base64: string;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
}

export interface SessionData {
  summary: string;
  columns: ColumnInfo[];
}

export interface UploadResponse {
  session_id: string;
  data: SessionData;
}

export interface AnalyzeResponse {
  explanation: string;
}
