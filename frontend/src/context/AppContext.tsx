import { useReducer } from "react";
import { AppStateContext, AppDispatchContext } from "../hooks/useAppContext";
import type { ColumnInfo } from "@/types/api";

export interface AppState {
  sessionId: string | null;
  datasetSummary: string | null;
  columns: ColumnInfo[] | null;
  isLoading: boolean;
  error: string | null;
  aiResponse: string | null;
}

const initialState: AppState = {
  sessionId: null,
  datasetSummary: null,
  columns: null,
  isLoading: false,
  error: null,
  aiResponse: null,
};

export type AppAction =
  | { type: "UPLOAD_START" }
  | {
      type: "UPLOAD_SUCCESS";
      payload: {
        sessionId: string;
        data: { summary: string; columns: ColumnInfo[] };
      };
    }
  | { type: "UPLOAD_FAILURE"; payload: string }
  | { type: "ANALYZE_START" }
  | { type: "ANALYZE_SUCESS"; payload: string }
  | { type: "ANALYZE_FAILURE"; payload: string }
  | { type: "RESET_ERROR" };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "UPLOAD_START":
      return { ...state, isLoading: true, error: null };
    case "UPLOAD_SUCCESS":
      return {
        ...state,
        isLoading: false,
        sessionId: action.payload.sessionId,
        datasetSummary: action.payload.data.summary,
        columns: action.payload.data.columns,
      };
    case "UPLOAD_FAILURE":
      return { ...state, isLoading: false, error: action.payload };
    case "ANALYZE_START":
      return { ...state, isLoading: true, error: null, aiResponse: null };
    case "ANALYZE_SUCESS":
      return { ...state, isLoading: false, error: null };
    case "ANALYZE_FAILURE":
      return { ...state, isLoading: false, error: action.payload };
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

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};
