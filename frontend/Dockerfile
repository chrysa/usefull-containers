# ── Stage 1 : deps ────────────────────────────────────────────────────────────
FROM node:26-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2 : builder ─────────────────────────────────────────────────────────
FROM deps AS builder

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ── Stage 3 : production ──────────────────────────────────────────────────────
FROM deps AS production

COPY --from=builder /app/dist ./dist
# `vite preview` reads vite.config.ts at startup for the preview server options
# (notably preview.allowedHosts). Without it, preview falls back to defaults and
# rejects requests proxied under a non-localhost Host (Traefik / the `frontend`
# service name in E2E).
COPY --from=builder /app/vite.config.ts ./

EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:4173/ || exit 1

CMD ["./node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
