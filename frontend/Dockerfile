# ── Stage 1 : deps ────────────────────────────────────────────────────────────
FROM node:26-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
# typescript-eslint has no stable release accepting TypeScript 7 yet (its peer
# range caps at <6.1.0), so a strict `npm ci` fails ERESOLVE. The conflict is
# lint-tooling only — the build and runtime deps resolve cleanly.
RUN npm ci --legacy-peer-deps

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
    # 127.0.0.1, not `localhost`: the container resolves localhost to ::1 first
    # and vite preview only listens on IPv4, so the probe would always refuse.
    CMD wget -qO- http://127.0.0.1:4173/ || exit 1

CMD ["./node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "4173"]

# ── Stage 4 : dev ─────────────────────────────────────────────────────────────
# Full toolchain (dev dependencies from `deps` + source) for lint/test and the
# live-reload dev server. Used by docker-compose.test.yml; the working tree is
# bind-mounted over /app at runtime. Mirrors `builder` but is long-lived.
FROM deps AS dev

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
