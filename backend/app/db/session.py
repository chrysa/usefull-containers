from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

_engine = create_async_engine(
    f"sqlite+aiosqlite:///{settings.auth_db_path}",
    echo=settings.debug,
    connect_args={"check_same_thread": False},
)

_session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    _engine, expire_on_commit=False
)


def get_engine() -> object:
    return _engine


async def init_db() -> None:
    """Create all tables. Call once at application startup."""
    from app.db import models as _  # noqa: F401 — ensure models are registered
    from app.db.base import Base

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _session_factory() as session:
        yield session
