from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.constants import BLUEPRINTS_DIR_DEFAULT


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    blueprints_dir: str = BLUEPRINTS_DIR_DEFAULT
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    debug: bool = False


settings = Settings()
