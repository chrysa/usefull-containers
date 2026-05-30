from __future__ import annotations

import logging
import urllib.parse
from typing import Any

import httpx

from app.config import settings
from app.constants import SATISFACTORY_STEAM_APP_ID, STEAM_OPENID_URL

logger = logging.getLogger(__name__)

_STEAM_API_BASE = "https://api.steampowered.com"


# ─── OpenID 2.0 helpers ──────────────────────────────────────────────────────

def build_steam_openid_url(callback_url: str) -> str:
    """Build the URL to redirect the user to Steam's OpenID login page."""
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": callback_url,
        "openid.realm": callback_url.rsplit("/", 2)[0] + "/",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    return STEAM_OPENID_URL + "?" + urllib.parse.urlencode(params)


async def verify_steam_openid(params: dict[str, str]) -> str | None:
    """
    Verify the Steam OpenID response via check_authentication.
    Returns the SteamID64 string on success, None on failure.
    """
    if params.get("openid.mode") != "id_res":
        return None

    check_params = dict(params)
    check_params["openid.mode"] = "check_authentication"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(STEAM_OPENID_URL, data=check_params)
        resp.raise_for_status()

    body = resp.text
    if "is_valid:true" not in body:
        logger.warning("steam.openid.invalid", extra={"response": body[:200]})
        return None

    # Extract SteamID64 from claimed_id: https://steamcommunity.com/openid/id/<steamid64>
    claimed_id = params.get("openid.claimed_id", "")
    if "/openid/id/" not in claimed_id:
        return None

    steam_id = claimed_id.rsplit("/", 1)[-1]
    if not steam_id.isdigit():
        return None

    return steam_id


# ─── Steam Web API ───────────────────────────────────────────────────────────

async def get_player_summary(steam_id: str) -> dict[str, Any] | None:
    """Fetch basic Steam profile for one user (GetPlayerSummaries)."""
    api_key = settings.steam_api_key
    if not api_key:
        return None

    url = f"{_STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params={"key": api_key, "steamids": steam_id})
        resp.raise_for_status()

    data: dict[str, Any] = resp.json()
    players = data.get("response", {}).get("players", [])
    return players[0] if players else None


async def get_satisfactory_stats(steam_id: str) -> dict[str, Any]:
    """
    Fetch Satisfactory-specific data from Steam Web API:
    - Owned game + playtime (GetOwnedGames)
    - Achievements (GetPlayerAchievements)
    """
    api_key = settings.steam_api_key
    if not api_key:
        return {"owned": False, "playtime_forever_minutes": 0, "playtime_2weeks_minutes": None,
                "achievements_total": 0, "achievements_unlocked": 0, "achievement_percentage": 0.0}

    result: dict[str, Any] = {
        "owned": False,
        "playtime_forever_minutes": 0,
        "playtime_2weeks_minutes": None,
        "achievements_total": 0,
        "achievements_unlocked": 0,
        "achievement_percentage": 0.0,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        # Owned games — include_appinfo so we can match by appid
        games_resp = await client.get(
            f"{_STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/",
            params={
                "key": api_key,
                "steamid": steam_id,
                "include_appinfo": 1,
                "appids_filter": [SATISFACTORY_STEAM_APP_ID],
                "format": "json",
            },
        )
        if games_resp.is_success:
            games_data: dict[str, Any] = games_resp.json()
            games = games_data.get("response", {}).get("games", [])
            for game in games:
                if game.get("appid") == SATISFACTORY_STEAM_APP_ID:
                    result["owned"] = True
                    result["playtime_forever_minutes"] = game.get("playtime_forever", 0)
                    result["playtime_2weeks_minutes"] = game.get("playtime_2weeks")
                    break

        # Achievements
        ach_resp = await client.get(
            f"{_STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v0001/",
            params={
                "key": api_key,
                "steamid": steam_id,
                "appid": SATISFACTORY_STEAM_APP_ID,
                "l": "english",
            },
        )
        if ach_resp.is_success:
            ach_data: dict[str, Any] = ach_resp.json()
            achievements: list[dict[str, Any]] = (
                ach_data.get("playerstats", {}).get("achievements", [])
            )
            total = len(achievements)
            unlocked = sum(1 for a in achievements if a.get("achieved") == 1)
            result["achievements_total"] = total
            result["achievements_unlocked"] = unlocked
            result["achievement_percentage"] = round(unlocked / total * 100, 1) if total else 0.0

    return result
