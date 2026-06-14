from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.constants import (
    AUTH_DB_FILENAME,
    BLUEPRINTS_DIR_DEFAULT,
    DATA_DIR_DEFAULT,
    GAMEDATA_DIR_DEFAULT,
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    blueprints_dir: str = BLUEPRINTS_DIR_DEFAULT
    gamedata_dir: str = GAMEDATA_DIR_DEFAULT
    data_dir: str = DATA_DIR_DEFAULT
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    debug: bool = False

    # When True, init_db() uses Base.metadata.create_all() instead of running
    # Alembic migrations. Set in tests/conftest.py — never in production.
    test_mode: bool = False

    # Demo mode: the read endpoints serve a coherent set of fixtures and the
    # auth-gated routers fall back to a demo user, so the whole app is
    # explorable without a real database, imported game data, or any
    # credentials. /health reports the flag so the frontend can show a banner.
    # Off by default; never enable in production.
    demo_mode: bool = False

    # Auth
    jwt_secret_key: str = "change-me-in-production-at-least-32-chars!!"
    steam_api_key: str = ""
    frontend_url: str = "http://localhost:5173"

    # Local sync agent (SFM-7a): a shared secret the headless sfm-agent presents
    # in the X-SFM-Agent-Key header to authenticate against POST /blueprints/sync
    # without a browser JWT. Empty string disables agent-key auth entirely; the
    # key then maps to the owner (lowest-id) user. Set via AGENT_API_KEY in prod.
    agent_api_key: str = ""

    # Rate limiting for the auth endpoints (A-08): max requests per window per
    # client IP+route. In-memory, single-instance (see dependencies/rate_limit).
    auth_rate_limit_max: int = 5
    auth_rate_limit_window_seconds: int = 60

    @property
    def auth_db_path(self) -> str:
        return f"{self.data_dir}/{AUTH_DB_FILENAME}"


settings = Settings()
