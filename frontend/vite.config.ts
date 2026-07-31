import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  // The production image serves the app via `vite preview` behind a reverse
  // proxy (Traefik in prod, the `frontend` service name in E2E). Vite 6 blocks
  // requests whose Host header is not in the allow list; the proxy is the real
  // security boundary here, so accept any host.
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
});
