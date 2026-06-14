import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth/auth";
import { HttpError, registerAuthFailureHandler } from "../api/http/client";
import { clearAuth, readAuthState, writeToken, writeUser } from "../domain/auth/store";
import type { User } from "../domain/auth/types";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /**
   * True while the initial `/auth/me` revalidation is in flight. Lets the UI
   * defer rendering of guard-gated regions (Sign in vs user menu, protected
   * routes) so a valid session does not flash a "logged out" state on reload.
   */
  isHydrating: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  loginWithSteam: (backendUrl: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const stored = readAuthState();
  const [user, setUser] = useState<User | null>(stored.user);
  // Hydrate only if we actually have a token to validate; otherwise the
  // initial render is already final.
  const [isHydrating, setIsHydrating] = useState<boolean>(stored.token !== null);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  // Auto-refresh: on mount, if a token is in localStorage, ALWAYS call
  // /auth/me to (a) confirm the token is still valid server-side and
  // (b) refresh the cached user payload (steam profile, last_login_at, …).
  // A 401 here means the token was revoked/expired → clear it.
  useEffect(() => {
    // No token → nothing to revalidate. `isHydrating` already initialises to
    // false in this case, so we must not call setState synchronously here
    // (it would trigger a cascading render and is a no-op anyway).
    if (!stored.token) return;
    let cancelled = false;
    authApi
      .getMe()
      .then((u) => {
        if (cancelled) return;
        writeUser(u);
        setUser(u);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 401 → token is dead; any other error (network, timeout, 5xx) →
        // keep the cached session so a transient backend hiccup doesn't
        // log the user out.
        if (err instanceof HttpError && err.status === 401) {
          clearAuth();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire the http client's 401 sink so any later authed request returning
  // 401 (e.g. token expires while the tab is open) triggers a logout.
  useEffect(() => {
    registerAuthFailureHandler(() => {
      clearAuth();
      setUser(null);
    });
    return () => registerAuthFailureHandler(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    writeToken(res.access_token);
    writeUser(res.user);
    setUser(res.user);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await authApi.register(username, password);
    writeToken(res.access_token);
    writeUser(res.user);
    setUser(res.user);
  }, []);

  const loginWithSteam = useCallback((backendUrl: string) => {
    globalThis.location.href = authApi.getSteamLoginUrl(backendUrl);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isHydrating,
      login,
      register,
      loginWithSteam,
      logout,
    }),
    [user, isHydrating, login, register, loginWithSteam, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
