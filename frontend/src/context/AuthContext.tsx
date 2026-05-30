import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth/auth";
import { clearAuth, readAuthState, writeToken, writeUser } from "../domain/auth/store";
import type { User } from "../domain/auth/types";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  loginWithSteam: (backendUrl: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const stored = readAuthState();
  const [user, setUser] = useState<User | null>(stored.user);

  // If we have a token but no user (e.g. page reload), fetch /me
  useEffect(() => {
    if (stored.token && !stored.user) {
      authApi
        .getMe()
        .then((u) => {
          writeUser(u);
          setUser(u);
        })
        .catch(() => {
          clearAuth();
          setUser(null);
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, register, loginWithSteam, logout }),
    [user, login, register, loginWithSteam, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


