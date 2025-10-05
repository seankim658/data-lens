/* eslint-disable  @typescript-eslint/no-explicit-any */

import type { Dispatch } from "react";
import type { AppAction } from "@/context/AppContext";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type {
  InteractionPayload,
  UploadResponse,
  AnalyzeResponse,
  SessionData,
  SessionStateUpdatePayload,
  LensConfig,
  EvaluationContext,
  PreloadedDataset,
} from "@/types/api";
import type { ChartConfig } from "@/config/chartConfig";
import type { ColumnMapping } from "@/types/charts";
import type { AggregationMethods } from "@/config/aggregationConfig";
import type { SamplingConfig } from "@/config/samplingConfig";
import type { AggregationConfig } from "@/config/aggregationConfig";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Uploads a dataset to the backend.
 * @param description - The user's description of the dataset.
 * @param file - The CSV or TSV file to upload.
 * @returns A promise that resolves to the upload response.
 */
export const uploadDataset = async (
  description: string,
  file: File,
  supportedCharts: ChartConfig[],
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("file", file);
  formData.append("supported_charts_json", JSON.stringify(supportedCharts));

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to upload dataset");
  }

  return response.json();
};

export const getPreloadedDatasets = async (): Promise<PreloadedDataset[]> => {
  const response = await fetch(`${API_BASE_URL}/api/preloaded-datasets`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch preloaded datasets");
  }

  return response.json();
};

/**
 * Creates a new session using a preloaded dataset.
 * @param datasetId - The ID of the preloaded dataset to load.
 * @param supportedCharts - The list of chart configurations from the frontend.
 * @returns A promise that resolves to the upload response.
 */
export const loadPreloadedDataset = async (
  datasetId: string,
  supportedCharts: ChartConfig[],
): Promise<UploadResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/preloaded-datasets/load`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset_id: datasetId,
      supported_charts_json: JSON.stringify(supportedCharts),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to load preloaded dataset");
  }

  return response.json();
};

/**
 * Sends an interaction payload to the backend for analysis.
 * @param payload - The interaction data.
 * @returns A promise that resolves to the AI's explanation.
 */
export const analyzeInteraction = async (
  payload: InteractionPayload,
): Promise<AnalyzeResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to analyze interaction");
  }

  return response.json();
};

/**
 * Sends a chat message to the backend.
 * @param sessionId - The unique session ID.
 * @param message - The user's message string.
 * @param stepContext - The current workflow step of the user.
 * @param dispatch - The app's dispatch function for streaming updates.
 * @returns A promise that resolves to the AI's response.
 */
export const sendChatMessage = (
  sessionId: string,
  message: string,
  stepContext: string,
  dispatch: Dispatch<AppAction>,
  samplingConfigs: SamplingConfig[],
  aggregationConfigs: AggregationConfig[],
): void => {
  fetchEventSource(`${API_BASE_URL}/api/chat/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      stepContext: stepContext,
      sampling_configs: samplingConfigs,
      aggregation_configs: aggregationConfigs,
    }),

    async onopen(response) {
      if (response.ok) {
        return;
      } else if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 429
      ) {
        const errData = await response.json();
        throw new Error(errData.detail || "An error occurred");
      } else {
        throw new Error("An error occurred");
      }
    },

    onmessage(event) {
      if (event.data === "[DONE]") {
        return;
      }
      dispatch({ type: "APPEND_CHAT_CHUNK", payload: event.data });
    },

    onclose() {
      dispatch({ type: "CHAT_SUCCESS" });
    },

    onerror(err) {
      console.error("EventSource failed:", err);
      dispatch({ type: "CHAT_FAILURE", payload: (err as Error).message });
      throw err;
    },
  });
};

/**
 * Retrieves session data from the backend using a session ID.
 * @param sessionId - The ID of the session to fetch.
 * @returns A promise that resolves to the session data.
 */
export const getSessionData = async (
  sessionId: string,
): Promise<SessionData> => {
  const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Session not found on the server.");
    }
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch session data");
  }

  return response.json();
};

/**
 * Fetches processed chart data from the backend.
 */
export const getChartData = async (
  sessionId: string,
  chartType: string,
  mapping: ColumnMapping,
  aggregationMethod: AggregationMethods | null,
  samplingMethod: string | null,
): Promise<Record<string, any>[]> => {
  const response = await fetch(`${API_BASE_URL}/api/chart-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      chart_type: chartType,
      mapping,
      aggregation_method: aggregationMethod,
      samplingMethod: samplingMethod,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch chart data");
  }

  return response.json();
};

/**
 * Resets the session.
 * @param sessionId - The ID of the session to reset.
 */
export const resetSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/session/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to reset session");
  }
};

/**
 * Updates the session state.
 * @param payload - The state update payload.
 */
export const updateSessionState = async (
  payload: SessionStateUpdatePayload,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/session/state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to update session state");
  }
};

/**
 * Fetches compatible lenses based on the current context.
 * @param context - The chart and dataset context.
 * @returns A promise that resolves to a list of compatible lens configurations.
 */
export const getCompatibleLenses = async (
  context: EvaluationContext,
): Promise<LensConfig[]> => {
  const response = await fetch(`${API_BASE_URL}/api/lenses/compatible`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(context),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch compatible lenses");
  }

  return response.json();
};
