from __future__ import annotations

from pydantic import field_validator
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
    # Allowed CORS origins for the browser frontend. Env-driven via CORS_ORIGINS
    # (comma-separated, e.g. "http://localhost:5173,http://localhost:4000") so a
    # frontend running on any dev port is reachable without editing code; the
    # default covers the common Vite/CRA dev ports on localhost + 127.0.0.1.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    debug: bool = False

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        """Accept a comma-separated CORS_ORIGINS string in addition to a JSON list."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

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

    # Assistant LLM (L10): the NL assistant routes questions through the chrysa
    # ai-aggregator gateway (POST {url}/api/v1/completions, X-API-Key header).
    # When ai_aggregator_url is empty the LLM path is disabled and the assistant
    # falls back to the deterministic rule-based engine — so the feature degrades
    # gracefully offline and the rest of the app never depends on a live gateway.
    ai_aggregator_url: str = ""
    ai_aggregator_api_key: str = ""
    assistant_model: str = ""  # empty → let the gateway pick the best provider
    assistant_max_tokens: int = 600
    assistant_temperature: float = 0.3
    assistant_timeout_seconds: float = 20.0

    @property
    def assistant_llm_enabled(self) -> bool:
        return bool(self.ai_aggregator_url)

    @property
    def auth_db_path(self) -> str:
        return f"{self.data_dir}/{AUTH_DB_FILENAME}"


settings = Settings()
