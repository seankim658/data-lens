import { useEffect, useReducer } from "react";
import { AppStateContext, AppDispatchContext } from "../hooks/useAppContext";
import type {
  ColumnInfo,
  ChatMessage,
  AnalysisRecord,
  SessionData,
} from "@/types/api";
import type { ColumnMapping } from "@/types/charts";
import type { AggregationMethods } from "@/config/aggregationConfig";
import type { SamplingMethods } from "@/config/samplingConfig";
import { getSessionData } from "@/api/apiService";

export type WorkspaceStep =
  | "chartSelection"
  | "aggregationSelection"
  | "samplingSelection"
  | "visualization";

export interface AppState {
  sessionId: string | null;
  datasetSummary: string | null;
  columns: ColumnInfo[] | null;
  row_count: number | null;
  isLoading: boolean;
  error: string | null;
  isChatLoading: boolean;
  chatHistory: ChatMessage[];
  analysisLog: AnalysisRecord[];

  // Workspace state
  step: WorkspaceStep;
  chartType: string | null;
  columnMapping: ColumnMapping | null;
  aggregationMethod: AggregationMethods | null;
  samplingMethod: SamplingMethods | null;
  activeLensId: string | null;
}

const SESSION_STORAGE_KEY = "dataLensSessionID";

const initialState: AppState = {
  sessionId: sessionStorage.getItem(SESSION_STORAGE_KEY),
  datasetSummary: null,
  columns: null,
  row_count: null,
  isLoading: false,
  error: null,
  isChatLoading: false,
  chatHistory: [],
  analysisLog: [],

  step: "chartSelection",
  chartType: null,
  columnMapping: null,
  aggregationMethod: null,
  samplingMethod: null,
  activeLensId: null,
};

export type AppAction =
  | { type: "UPLOAD_START" }
  | {
      type: "UPLOAD_SUCCESS";
      payload: { sessionId: string; data: SessionData };
    }
  | { type: "UPLOAD_ERROR"; payload: string }
  | { type: "SESSION_FETCH_START" }
  | { type: "SESSION_FETCH_SUCCESS"; payload: SessionData }
  | { type: "SESSION_FETCH_ERROR"; payload: string }
  | { type: "UPDATE_STEP"; payload: WorkspaceStep }
  | { type: "UPDATE_CHART_SELECTION"; payload: string }
  | { type: "UPDATE_COLUMN_MAPPING"; payload: ColumnMapping }
  | { type: "UPDATE_AGGREGATION"; payload: AggregationMethods }
  | { type: "UPDATE_SAMPLING"; payload: SamplingMethods }
  | { type: "UPDATE_ACTIVE_LENS"; payload: string | null }
  | { type: "CHAT_START" }
  | { type: "ADD_USER_MESSAGE"; payload: ChatMessage }
  | { type: "APPEND_CHAT_CHUNK"; payload: string }
  | { type: "CHAT_SUCCESS" }
  | { type: "CHAT_FAILURE"; payload: string }
  | { type: "CHAT_ERROR"; payload: string }
  | { type: "ADD_ANALYSIS_RECORD"; payload: AnalysisRecord }
  | { type: "RESET_SESSION" };

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
        row_count: action.payload.data.row_count,
        chatHistory: action.payload.data.chat_history,
        analysisLog: action.payload.data.analysis_log,
        step: "chartSelection",
        chartType: null,
        columnMapping: null,
        aggregationMethod: null,
        activeLensId: null,
      };
    case "SESSION_FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "SESSION_FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        datasetSummary: action.payload.summary,
        columns: action.payload.columns,
        row_count: action.payload.row_count,
        chatHistory: action.payload.chat_history,
        analysisLog: action.payload.analysis_log,
        step:
          (action.payload.current_step as WorkspaceStep) || "chartSelection",
        chartType: action.payload.selected_chart_type || null,
        columnMapping: action.payload.column_mapping || null,
        activeLensId: action.payload.active_lens_id || null,
        aggregationMethod:
          (action.payload.aggregation_method as AggregationMethods) || null,
        samplingMethod:
          (action.payload.sampling_method as SamplingMethods) || null,
      };
    case "UPLOAD_ERROR":
    case "SESSION_FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "UPDATE_STEP":
      return { ...state, step: action.payload };
    case "UPDATE_CHART_SELECTION":
      return { ...state, chartType: action.payload };
    case "UPDATE_COLUMN_MAPPING":
      return { ...state, columnMapping: action.payload };
    case "UPDATE_AGGREGATION":
      return { ...state, aggregationMethod: action.payload };
    case "UPDATE_SAMPLING":
      return { ...state, samplingMethod: action.payload };
    case "UPDATE_ACTIVE_LENS":
      return { ...state, activeLensId: action.payload };
    case "CHAT_START":
      return { ...state, isChatLoading: true };
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload],
      };
    case "APPEND_CHAT_CHUNK": {
      //const updatedHistory = [...state.chatHistory];
      //const lastMessage = updatedHistory[updatedHistory.length - 1];
      //
      //if (lastMessage && lastMessage.role === "assistant") {
      //  lastMessage.content += action.payload;
      //} else {
      //  updatedHistory.push({
      //    role: "assistant",
      //    content: action.payload,
      //  });
      //}
      const updatedHistory = [...state.chatHistory];
      const lastIndex = updatedHistory.length - 1;
      const lastMessage = updatedHistory[lastIndex];

      if (lastMessage && lastMessage.role === "assistant") {
        updatedHistory[lastIndex] = {
          ...lastMessage,
          content: lastMessage.content + action.payload,
        };
      } else {
        updatedHistory.push({
          role: "assistant",
          content: action.payload,
        });
      }

      return {
        ...state,
        chatHistory: updatedHistory,
      };
    }
    case "CHAT_SUCCESS":
      return { ...state, isChatLoading: false };
    case "CHAT_FAILURE":
    case "CHAT_ERROR":
      return {
        ...state,
        isChatLoading: false,
        error: action.payload,
      };
    case "ADD_ANALYSIS_RECORD":
      return {
        ...state,
        analysisLog: [...state.analysisLog, action.payload],
      };
    case "RESET_SESSION":
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return {
        ...initialState,
        sessionId: null,
        isLoading: false,
      };
    default:
      return state;
  }
};

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const savedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessionId && !state.datasetSummary && !state.isLoading) {
      dispatch({ type: "SESSION_FETCH_START" });
      getSessionData(savedSessionId)
        .then((data) => {
          dispatch({ type: "SESSION_FETCH_SUCCESS", payload: data });
        })
        .catch((error) => {
          console.error("Failed to fetch session:", error);
          dispatch({
            type: "SESSION_FETCH_ERROR",
            payload: error.message,
          });
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        });
    }
  }, [state.datasetSummary, state.isLoading]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
