from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import User
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.steam import SatisfactoryGameData, SteamGameDataResponse, SteamProfile
from app.models.user import TokenResponse, UserLogin, UserRead, UserRegister
from app.services import auth_service, steam_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

_STEAM_CALLBACK_PATH = "/api/v1/auth/steam/callback"


def _callback_url(request: Request) -> str:
    base = str(request.base_url).rstrip("/")
    return base + _STEAM_CALLBACK_PATH


# ─── Local auth ──────────────────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register with a local username/password",
)
async def register(
    body: UserRegister,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    try:
        user = await auth_service.create_local_user(session, body.username, body.password)
    except auth_service.DuplicateUsernameError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        ) from exc
    token = auth_service.create_access_token(user)
    return TokenResponse(access_token=token, user=auth_service.user_to_read(user))


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with local credentials",
)
async def login(
    body: UserLogin,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    user = await auth_service.authenticate_local(session, body.username, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token = auth_service.create_access_token(user)
    return TokenResponse(access_token=token, user=auth_service.user_to_read(user))


@router.get(
    "/me",
    response_model=UserRead,
    summary="Return the currently authenticated user",
)
async def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return auth_service.user_to_read(current_user)


# ─── Steam OpenID ────────────────────────────────────────────────────────────


@router.get(
    "/steam",
    summary="Redirect to Steam OpenID login",
    response_class=RedirectResponse,
    status_code=302,
)
async def steam_login(request: Request) -> RedirectResponse:
    url = steam_service.build_steam_openid_url(_callback_url(request))
    return RedirectResponse(url=url, status_code=302)


@router.get(
    "/steam/callback",
    summary="Steam OpenID callback — verifies identity and issues JWT",
    response_class=RedirectResponse,
    status_code=302,
)
async def steam_callback(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    params = dict(request.query_params)
    steam_id = await steam_service.verify_steam_openid(params)

    if steam_id is None:
        logger.warning("steam.callback.invalid", extra={"params": list(params.keys())})
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=steam_failed", status_code=302
        )

    # Fetch Steam profile (best-effort — no API key = use SteamID as fallback username)
    profile = await steam_service.get_player_summary(steam_id)
    persona_name = (
        profile.get("personaname", f"steam_{steam_id}") if profile else f"steam_{steam_id}"
    )
    avatar_url = profile.get("avatarfull", "") if profile else ""

    user = await auth_service.upsert_steam_user(session, steam_id, persona_name, avatar_url)
    token = auth_service.create_access_token(user)

    redirect_url = f"{settings.frontend_url}/auth/callback?token={token}"
    return RedirectResponse(url=redirect_url, status_code=302)


@router.get(
    "/steam/game-data",
    response_model=SteamGameDataResponse,
    summary="Fetch Satisfactory stats from Steam Web API for the current user",
)
async def steam_game_data(
    current_user: User = Depends(get_current_user),
) -> SteamGameDataResponse:
    if current_user.steam_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Steam account linked to this user",
        )

    if not settings.steam_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Steam API key not configured on this instance",
        )

    profile_data = await steam_service.get_player_summary(current_user.steam_id)
    if profile_data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not fetch Steam profile",
        )

    profile = SteamProfile(
        steam_id=current_user.steam_id,
        persona_name=profile_data.get("personaname", ""),
        avatar_full=profile_data.get("avatarfull", ""),
        profile_url=profile_data.get("profileurl", ""),
    )

    raw_stats = await steam_service.get_satisfactory_stats(current_user.steam_id)
    satisfactory = SatisfactoryGameData(
        owned=raw_stats["owned"],
        playtime_forever_minutes=raw_stats["playtime_forever_minutes"],
        playtime_2weeks_minutes=raw_stats["playtime_2weeks_minutes"],
        achievements_total=raw_stats["achievements_total"],
        achievements_unlocked=raw_stats["achievements_unlocked"],
        achievement_percentage=raw_stats["achievement_percentage"],
    )

    return SteamGameDataResponse(profile=profile, satisfactory=satisfactory)


# ─── Epic Games (stub) ───────────────────────────────────────────────────────


@router.get(
    "/epic",
    summary="Epic Games OAuth — not yet configured",
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
async def epic_login() -> dict[str, str]:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Epic Games auth requires EPIC_CLIENT_ID and EPIC_CLIENT_SECRET env vars. "
            "See D-0006 in DECISIONS.md."
        ),
    )
