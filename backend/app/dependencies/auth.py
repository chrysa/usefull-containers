from __future__ import annotations

import secrets

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import User
from app.db.session import get_session
from app.services import auth_service

_bearer = HTTPBearer(auto_error=False)

#: Header the headless sfm-agent uses to present its shared secret (SFM-7a).
AGENT_KEY_HEADER = "X-SFM-Agent-Key"

#: Synthetic user returned by the auth dependencies while demo mode is on, so
#: the auth-gated routers are reachable without any real credentials. It is
#: never persisted; the read endpoints serve fixtures instead of real storage.
DEMO_USER = User(id=0, username="demo", is_active=True)


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    """Return the authenticated user or None if no valid token is provided."""
    if settings.demo_mode:
        return DEMO_USER
    if credentials is None:
        return None
    token_data = auth_service.decode_access_token(credentials.credentials)
    if token_data is None:
        return None
    user = await auth_service.get_user_by_id(session, int(token_data.sub))
    if user is None or not user.is_active:
        return None
    return user


async def get_current_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    """Return the authenticated user. Raises HTTP 401 if not authenticated."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_sync_user(
    request: Request,
    user: User | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Authenticate the blueprint-sync endpoint via a browser JWT *or* the
    shared agent key.

    A normal JWT (or demo mode) wins first. Otherwise, when ``agent_api_key`` is
    configured and the ``X-SFM-Agent-Key`` header matches it (constant-time), the
    request is authorised as the owner (lowest-id) user. Raises HTTP 401 when
    neither path succeeds.
    """
    if user is not None:
        return user

    api_key = request.headers.get(AGENT_KEY_HEADER)
    if (
        settings.agent_api_key
        and api_key is not None
        and secrets.compare_digest(api_key, settings.agent_api_key)
    ):
        owner = await auth_service.get_first_user(session)
        if owner is not None:
            return owner

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
