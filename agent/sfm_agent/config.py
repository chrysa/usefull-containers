from __future__ import annotations

from pathlib import Path
from typing import Final

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Default Steam Deck blueprint path (via Proton compatibility layer)
DEFAULT_STEAM_DECK_BP_DIR: Final = (
    "~/.local/share/Steam/steamapps/compatdata/526870/pfx"
    "/drive_c/users/steamuser/AppData/Local"
    "/FactoryGame/Saved/SaveGames/blueprints"
)


class AgentConfig(BaseSettings):
    """Runtime configuration — all fields can be set via SFM_* env vars or .env file."""

    hub_url: str = "http://localhost:8000"
    blueprints_dir: Path = Path(".")
    poll_interval: int = 60  # seconds between full sync polls
    api_prefix: str = "/api/v1"
    state_file: Path = Path(".sfm-agent-state.json")
    debounce_seconds: float = 2.0  # seconds to wait after last file event

    model_config = SettingsConfigDict(env_prefix="SFM_", env_file=".env")

    @field_validator("hub_url")
    @classmethod
    def strip_trailing_slash(cls, v: str) -> str:
        return v.rstrip("/")

    @property
    def api_base(self) -> str:
        return f"{self.hub_url}{self.api_prefix}"
