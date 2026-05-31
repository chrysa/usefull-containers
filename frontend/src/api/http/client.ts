// Lightweight fetch wrapper — no external dependency
import { readActiveProjectId, readProjects } from "../../domain/projects/store";
import { readToken } from "../../domain/auth/store";

const FALLBACK_URL =
  (import.meta.env.VITE_API_URL ?? "http://localhost:9009") + "/api";
const TIMEOUT = 8000;

/**
 * Resolves the API base URL from the currently active project (localStorage).
 * Falls back to VITE_API_URL / localhost when no project is configured.
 */
function getBaseUrl(): string {
  try {
    const activeId = readActiveProjectId();
    if (activeId) {
      const active = readProjects().find((p) => p.id === activeId);
      if (active?.backendUrl) {
        return active.backendUrl.replace(/\/$/, "") + "/api";
      }
    }
  } catch {
    // localStorage unavailable — use fallback
  }
  return FALLBACK_URL;
}

/**
 * Error thrown for non-2xx HTTP responses. Carries the numeric status so
 * callers (especially the auth layer) can distinguish 401 from other failures.
 */
export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, statusText: string) {
    super(`HTTP ${status} — ${statusText}`);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * Global 401 sink. The auth context registers a handler at mount time so any
 * authenticated request that returns 401 (revoked / expired token) triggers
 * an immediate logout without each call site having to special-case it.
 */
type AuthFailureHandler = () => void;
let authFailureHandler: AuthFailureHandler | null = null;

export function registerAuthFailureHandler(handler: AuthFailureHandler | null): void {
  authFailureHandler = handler;
}

type RequestOptions = RequestInit & { timeout?: number };

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { timeout = TIMEOUT, ...init } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const token = readToken();
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  try {
    const res = await fetch(getBaseUrl() + path, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...init.headers,
      },
    });

    if (!res.ok) {
      // 401 on an authed request means the token is no longer valid — surface
      // it to the registered handler so the UI logs the user out promptly.
      if (res.status === 401 && token && authFailureHandler) {
        try {
          authFailureHandler();
        } catch {
          // never let a handler crash break the request flow
        }
      }
      throw new HttpError(res.status, res.statusText);
    }
    // 204/205 responses have no body — attempting res.json() would throw.
    if (res.status === 204 || res.status === 205) return undefined as T;
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(id);
  }
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),
  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),
  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body), ...options }),
  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};
