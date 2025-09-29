/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useEffect, useReducer } from "react";
import { AppStateContext, AppDispatchContext } from "../hooks/useAppContext";
import type {
  ColumnInfo,
  ChatMessage,
  AnalysisRecord,
  SessionData,
} from "@/types/api";
import { getSessionData } from "@/api/apiService";

export interface AppState {
  sessionId: string | null;
  datasetSummary: string | null;
  columns: ColumnInfo[] | null;
  chartData: Record<string, any>[] | null;
  isLoading: boolean;
  error: string | null;
  aiResponse: string | null;
  isChatLoading: boolean;
  chatHistory: ChatMessage[];
  analysisLog: AnalysisRecord[];
}

const SESSION_STORAGE_KEY = "dataLensSessionID";

const initialState: AppState = {
  sessionId: sessionStorage.getItem(SESSION_STORAGE_KEY),
  datasetSummary: null,
  columns: null,
  chartData: null,
  isLoading: !!sessionStorage.getItem(SESSION_STORAGE_KEY),
  error: null,
  aiResponse: null,
  isChatLoading: false,
  chatHistory: [],
  analysisLog: [],
};

export type AppAction =
  | { type: "UPLOAD_START" }
  | {
      type: "UPLOAD_SUCCESS";
      payload: { sessionId: string; data: SessionData };
    }
  | { type: "UPLOAD_FAILURE"; payload: string }
  | { type: "SESSION_FETCH_START" }
  | { type: "SESSION_FETCH_SUCCESS"; payload: SessionData }
  | { type: "SESSION_FETCH_FAILURE"; payload: string }
  | { type: "RESET_SESSION" }
  | { type: "ANALYZE_START" }
  | {
      type: "ANALYZE_SUCCESS";
      payload: { explanation: string; record: AnalysisRecord };
    }
  | { type: "ANALYZE_FAILURE"; payload: string }
  | { type: "CHAT_START" }
  | { type: "APPEND_CHAT_CHUNK"; payload: string }
  | { type: "CHAT_SUCCESS" }
  | { type: "CHAT_FAILURE"; payload: string }
  | { type: "ADD_USER_MESSAGE"; payload: ChatMessage }
  | { type: "RESET_ERROR" };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "UPLOAD_START":
      return { ...state, isLoading: true, error: null };
    case "UPLOAD_SUCCESS":
      sessionStorage.setItem(SESSION_STORAGE_KEY, action.payload.sessionId);
      return {
        ...state,
        isLoading: false,
        sessionId: action.payload.sessionId,
        datasetSummary: action.payload.data.summary,
        columns: action.payload.data.columns,
        chartData: action.payload.data.chart_data,
        chatHistory: action.payload.data.chat_history,
        analysisLog: action.payload.data.analysis_log,
      };
    case "SESSION_FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "SESSION_FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        datasetSummary: action.payload.summary,
        columns: action.payload.columns,
        chartData: action.payload.chart_data,
        chatHistory: action.payload.chat_history,
        analysisLog: action.payload.analysis_log,
      };
    case "SESSION_FETCH_FAILURE":
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return {
        ...initialState,
        sessionId: null,
        chartData: null,
        isLoading: false,
        error: action.payload,
      };
    case "RESET_SESSION":
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return { ...initialState, sessionId: null, isLoading: false };
    case "UPLOAD_FAILURE":
      return { ...state, isLoading: false, error: action.payload };
    case "ANALYZE_START":
      return { ...state, isLoading: true, error: null, aiResponse: null };
    case "ANALYZE_SUCCESS":
      return {
        ...state,
        isLoading: false,
        aiResponse: action.payload.explanation,
        analysisLog: [...state.analysisLog, action.payload.record],
      };
    case "ANALYZE_FAILURE":
      return { ...state, isLoading: false, error: action.payload };
    case "CHAT_START":
      return {
        ...state,
        isChatLoading: true,
        error: null,
        chatHistory: [...state.chatHistory, { role: "assistant", content: "" }],
      };
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload],
      };
    case "APPEND_CHAT_CHUNK": {
      const lastMessage = state.chatHistory[state.chatHistory.length - 1];
      if (lastMessage?.role === "assistant") {
        const updatedHistory = [...state.chatHistory];
        updatedHistory[updatedHistory.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + action.payload,
        };
        return { ...state, chatHistory: updatedHistory };
      }
      // TODO : should handle better (but this shouldn't happen)
      return state;
    }
    case "CHAT_SUCCESS":
      return {
        ...state,
        isChatLoading: false,
      };
    case "CHAT_FAILURE":
      return {
        ...state,
        isChatLoading: false,
        error: action.payload,
        chatHistory: state.chatHistory.filter(
          (m) => m.content !== "" || m.role !== "assistant",
        ),
      };
    case "RESET_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const rehydrateSession = async () => {
      const savedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSessionId) {
        dispatch({ type: "SESSION_FETCH_START" });
        try {
          const data = await getSessionData(savedSessionId);
          dispatch({ type: "SESSION_FETCH_SUCCESS", payload: data });
        } catch (err) {
          console.error("Failed to rehydrate session:", err);
          dispatch({
            type: "SESSION_FETCH_FAILURE",
            payload: (err as Error).message,
          });
        }
      }
    };
    rehydrateSession();
  }, [dispatch]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};
