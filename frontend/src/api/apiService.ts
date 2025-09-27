import type {
  InteractionPayload,
  UploadResponse,
  AnalyzeResponse,
  ChatResponse,
} from "../types/api";

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
export const sendChatMessage = async (
  sessionId: string,
  message: string,
): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/chat/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to send message.");
  }

  return response.json();
};
