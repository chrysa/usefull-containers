import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "./context/ToastProvider";

const root = document.getElementById("root")!;
const queryClient = new QueryClient();

// Mock Service Worker is opt-in (VITE_ENABLE_MSW=true) so `npm run dev` talks to
// the real backend by default. Enabling it unconditionally in DEV silently
// shadowed a configured backend for the mocked endpoints (blueprints, gamedata,
// plans), causing confusing divergence from un-mocked ones (auth, assistant).
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true") {
  const { worker } = await import("./api/mock/server");
  worker.start({ onUnhandledRequest: "bypass" });
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
