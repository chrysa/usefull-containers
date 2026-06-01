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
    """Run Alembic migrations to head. Call once at application startup.

    Replaces the previous `create_all()` approach (see ADR-004). Schema
    changes MUST go through new Alembic revisions — never edit existing
    migrations and never reintroduce `Base.metadata.create_all`.

    In test mode (`settings.test_mode`), falls back to `create_all()` to
    keep tests fast and dependency-free.
    """
    from app.db import models as _  # noqa: F401 — ensure models are registered

    if settings.test_mode:
        from app.db.base import Base

        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        return

    # Production / dev: run Alembic migrations.
    from pathlib import Path

    from alembic import command
    from alembic.config import Config

    backend_root = Path(__file__).resolve().parent.parent.parent
    cfg = Config(str(backend_root / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend_root / "alembic"))
    cfg.set_main_option(
        "sqlalchemy.url",
        f"sqlite+aiosqlite:///{settings.auth_db_path}",
    )

    # alembic.command.upgrade is sync — run in a worker thread so we don't
    # block the event loop.
    import asyncio

    await asyncio.to_thread(command.upgrade, cfg, "head")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _session_factory() as session:
        yield session
