import { createContext, useContext } from "react";
import type { Dispatch } from "react";
import type { AppState, AppAction } from "../context/AppContext";

export const AppStateContext = createContext<AppState | undefined>(undefined);
export const AppDispatchContext = createContext<
  Dispatch<AppAction> | undefined
>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
};

export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error("useAppDispatch must be used within an AppProvider");
  }
  return context;
};
