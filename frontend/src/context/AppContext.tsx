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
  | "columnMapping"
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
  isLoading: !!sessionStorage.getItem(SESSION_STORAGE_KEY),
  error: null,
  isChatLoading: false,
  chatHistory: [],
  analysisLog: [],

  // Workspace state
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
  | { type: "UPLOAD_FAILURE"; payload: string }
  | { type: "SESSION_FETCH_START" }
  | { type: "SESSION_FETCH_SUCCESS"; payload: SessionData }
  | { type: "SESSION_FETCH_FAILURE"; payload: string }
  | { type: "RESET_SESSION" }
  | { type: "CHAT_START" }
  | { type: "APPEND_CHAT_CHUNK"; payload: string }
  | { type: "CHAT_SUCCESS" }
  | { type: "CHAT_FAILURE"; payload: string }
  | { type: "ADD_USER_MESSAGE"; payload: ChatMessage }
  | { type: "RESET_ERROR" }
  // Workspace actions
  | { type: "SELECT_CHART"; payload: string }
  | { type: "SET_MAPPING"; payload: ColumnMapping }
  | { type: "GO_TO_AGGREGATION" }
  | { type: "SELECT_AGGREGATION"; payload: AggregationMethods }
  | { type: "GO_TO_SAMPLING" }
  | { type: "SELECT_SAMPLING"; payload: SamplingMethods }
  | { type: "GO_TO_VISUALIZATION" }
  | { type: "GO_BACK"; payload: { supported_aggregations: boolean } }
  | { type: "SET_ACTIVE_LENS"; payload: string | null };

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
      };
    case "SESSION_FETCH_FAILURE":
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return {
        ...initialState,
        sessionId: null,
        isLoading: false,
        error: action.payload,
      };
    case "RESET_SESSION":
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return {
        ...initialState,
        sessionId: null,
        isLoading: false,
      };
    case "UPLOAD_FAILURE":
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
    case "SELECT_CHART":
      return {
        ...state,
        step: "columnMapping",
        chartType: action.payload,
        columnMapping: null, // Reset subsequent state
        aggregationMethod: null,
        samplingMethod: null,
        activeLensId: null,
      };
    case "SET_MAPPING":
      return { ...state, columnMapping: action.payload };
    case "GO_TO_AGGREGATION":
      return { ...state, step: "aggregationSelection" };
    case "SELECT_AGGREGATION":
      return { ...state, aggregationMethod: action.payload };
    case "GO_TO_SAMPLING":
      return { ...state, step: "samplingSelection" };
    case "SELECT_SAMPLING":
      return { ...state, samplingMethod: action.payload };
    case "GO_TO_VISUALIZATION":
      return { ...state, step: "visualization" };
    case "SET_ACTIVE_LENS":
      return { ...state, activeLensId: action.payload };
    case "GO_BACK":
      if (
        state.step === "visualization" ||
        state.step === "samplingSelection"
      ) {
        return action.payload.supported_aggregations
          ? { ...state, step: "aggregationSelection" }
          : { ...state, step: "columnMapping", columnMapping: null };
      }
      if (state.step === "aggregationSelection") {
        return { ...state, step: "columnMapping", columnMapping: null };
      }
      return {
        ...state,
        step: "chartSelection",
        chartType: null,
        columnMapping: null,
        aggregationMethod: null,
        samplingMethod: null,
        activeLensId: null,
      };
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
      const savedSessionId = state.sessionId;

      if (savedSessionId && !state.datasetSummary) {
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
  }, [state.sessionId, state.datasetSummary]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};
