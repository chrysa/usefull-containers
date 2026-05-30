export interface User {
  id: number;
  username: string;
  steam_id: string | null;
  steam_username: string | null;
  steam_avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface SatisfactoryStats {
  owned: boolean;
  playtime_forever_minutes: number;
  playtime_2weeks_minutes: number | null;
  achievements_total: number;
  achievements_unlocked: number;
  achievement_percentage: number;
}

export interface SteamProfile {
  steam_id: string;
  persona_name: string;
  avatar_full: string;
  profile_url: string;
}

export interface SteamGameDataResponse {
  profile: SteamProfile;
  satisfactory: SatisfactoryStats | null;
}
