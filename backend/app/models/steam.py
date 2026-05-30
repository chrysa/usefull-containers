from __future__ import annotations

from pydantic import BaseModel


class SteamProfile(BaseModel):
    steam_id: str
    persona_name: str
    avatar_full: str
    profile_url: str


class SatisfactoryGameData(BaseModel):
    owned: bool
    playtime_forever_minutes: int
    playtime_2weeks_minutes: int | None
    achievements_total: int
    achievements_unlocked: int
    achievement_percentage: float


class SteamGameDataResponse(BaseModel):
    profile: SteamProfile
    satisfactory: SatisfactoryGameData | None
