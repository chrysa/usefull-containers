import type { AuthState, User } from "./types";

const TOKEN_KEY = "sfm.auth.token";
const USER_KEY = "sfm.auth.user";

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable — silently no-op
  }
}

export function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function writeUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable — silently no-op
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // no-op
  }
}

export function readAuthState(): AuthState {
  return { token: readToken(), user: readUser() };
}

/**
 * Authorization header for requests that bypass the shared `http` client
 * (FormData uploads, blob downloads). Returns an empty object when no token is
 * stored so the caller can spread it unconditionally.
 */
export function authHeaders(): Record<string, string> {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
