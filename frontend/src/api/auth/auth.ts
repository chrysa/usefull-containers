import { http } from "../http/client";
import type { SteamGameDataResponse, TokenResponse, User } from "../../domain/auth/types";

const BASE = "/v1/auth";

export async function login(username: string, password: string): Promise<TokenResponse> {
  return http.post<TokenResponse>(`${BASE}/login`, { username, password });
}

export async function register(username: string, password: string): Promise<TokenResponse> {
  return http.post<TokenResponse>(`${BASE}/register`, { username, password });
}

export async function getMe(): Promise<User> {
  return http.get<User>(`${BASE}/me`);
}

export async function getSteamGameData(): Promise<SteamGameDataResponse> {
  return http.get<SteamGameDataResponse>(`${BASE}/steam/game-data`);
}

export function getSteamLoginUrl(backendUrl: string): string {
  return `${backendUrl.replace(/\/$/, "")}/api/v1/auth/steam`;
}
