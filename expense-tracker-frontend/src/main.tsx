import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SettingsProvider } from "./context/SettingsContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <SettingsProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </SettingsProvider>
  </AuthProvider>,
);
