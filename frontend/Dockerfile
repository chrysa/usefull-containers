# ── Stage 1 : deps ────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2 : builder ─────────────────────────────────────────────────────────
FROM deps AS builder

COPY . .
RUN npm run build

# ── Stage 3 : production ──────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R app:app /usr/share/nginx/html && \
    chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    touch /var/run/nginx.pid && chown app:app /var/run/nginx.pid

USER app

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1
