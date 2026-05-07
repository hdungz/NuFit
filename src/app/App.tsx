import { RouterProvider } from "react-router";
import { useState } from "react";
import { router } from "./routes";
import { AuthScreen } from "./components/screens/AuthScreen";
import { getAuthSession, logout } from "./services/authService";
import { AuthContext } from "./auth/AuthContext";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthSession()));

  const authContextValue = {
    isAuthenticated,
    onAuthSuccess: () => setIsAuthenticated(true),
    onLogout: () => {
      logout();
      setIsAuthenticated(false);
    },
  };

  if (!isAuthenticated) {
    return (
      <AuthContext.Provider value={authContextValue}>
        <AuthScreen onAuthSuccess={authContextValue.onAuthSuccess} />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <RouterProvider router={router} />
    </AuthContext.Provider>
  );
}