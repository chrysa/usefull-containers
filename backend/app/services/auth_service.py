from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.constants import ACCESS_TOKEN_EXPIRE_HOURS, JWT_ALGORITHM
from app.db.models import User
from app.models.user import TokenData, UserRead

logger = logging.getLogger(__name__)

# ─── Password helpers ─────────────────────────────────────────────────────────────


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ─── JWT helpers ─────────────────────────────────────────────────────────────


def create_access_token(user: User) -> str:
    expire = datetime.now(UTC) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=JWT_ALGORITHM)  # type: ignore[no-any-return]


def decode_access_token(token: str) -> TokenData | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[JWT_ALGORITHM])
        sub: str | None = payload.get("sub")
        username: str | None = payload.get("username")
        if sub is None or username is None:
            return None
        return TokenData(sub=sub, username=username)
    except JWTError:
        return None


# ─── User CRUD ───────────────────────────────────────────────────────────────


class DuplicateUsernameError(Exception):
    pass


async def create_local_user(session: AsyncSession, username: str, password: str) -> User:
    """Create a new user with local credentials. Raises DuplicateUsernameError if taken."""
    existing = await session.scalar(select(User).where(User.username == username))
    if existing is not None:
        raise DuplicateUsernameError(username)

    user = User(
        username=username,
        hashed_password=hash_password(password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    logger.info("user.created", extra={"username": username, "method": "local"})
    return user


async def authenticate_local(session: AsyncSession, username: str, password: str) -> User | None:
    """Return the user if credentials are valid, None otherwise."""
    user = await session.scalar(select(User).where(User.username == username))
    if user is None or user.hashed_password is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None

    user.last_login_at = datetime.now(UTC)
    await session.commit()
    return user


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def get_first_user(session: AsyncSession) -> User | None:
    """Return the lowest-id active user — the deployment "owner".

    Used to map the single shared sfm-agent key (SFM-7a) to a real user in the
    current single-user deployment model. Multi-agent / per-key ownership would
    require a dedicated ApiKey table (deferred).
    """
    user: User | None = await session.scalar(
        select(User).where(User.is_active).order_by(User.id).limit(1)
    )
    return user


async def upsert_steam_user(
    session: AsyncSession,
    steam_id: str,
    persona_name: str,
    avatar_url: str,
) -> User:
    """Create or update a user linked to a Steam account."""
    user = await session.scalar(select(User).where(User.steam_id == steam_id))

    if user is None:
        # Derive a unique username from the Steam persona name
        base = persona_name[:60].replace(" ", "_")
        username = base
        counter = 1
        while await session.scalar(select(User).where(User.username == username)) is not None:
            username = f"{base}_{counter}"
            counter += 1

        user = User(
            username=username,
            steam_id=steam_id,
            steam_username=persona_name,
            steam_avatar_url=avatar_url,
        )
        session.add(user)
        logger.info("user.created", extra={"steam_id": steam_id, "method": "steam"})
    else:
        user.steam_username = persona_name
        user.steam_avatar_url = avatar_url
        user.last_login_at = datetime.now(UTC)

    await session.commit()
    await session.refresh(user)
    return user


def user_to_read(user: User) -> UserRead:
    return UserRead.model_validate(user)
