from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_session
from app.services import auth_service

_bearer = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    """Return the authenticated user or None if no valid token is provided."""
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
