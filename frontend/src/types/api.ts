export interface LensControl {
  type: string;
  target: string;
  lable: string;
}

export interface LensConfig {
  id: string;
  name: string;
  description: string;
  controls: LensControl[];
  lens_specific_prompt: string;
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

export interface UploadResponse {
  session_id: string;
  summary: string;
}

export interface AnalyzeResponse {
  explanation: string;
}
