import type { Dispatch } from "react";
import type { AppAction } from "@/context/AppContext";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type {
  InteractionPayload,
  UploadResponse,
  AnalyzeResponse,
  ChatResponse,
} from "@/types/api";

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
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("file", file);

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
 * @returns A promise that resolves to the AI's response.
 */
export const sendChatMessage = (
  sessionId: string,
  message: string,
  dispatch: Dispatch<AppAction>,
): void => {
  fetchEventSource(`${API_BASE_URL}/api/chat/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session_id: sessionId, message }),

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
