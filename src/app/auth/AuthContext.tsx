import { createContext, useContext } from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  onAuthSuccess: () => void;
  onLogout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthContext.Provider");
  }
  return context;
}
