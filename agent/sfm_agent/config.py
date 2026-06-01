from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Final, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Platform = Literal["windows", "steamdeck", "linux", "macos", "unknown"]

# Satisfactory blueprints live under <LocalAppData>/FactoryGame/Saved/SaveGames/blueprints.
# The suffix below is appended to each platform's "Local AppData" root.
_BP_SUFFIX: Final = "FactoryGame/Saved/SaveGames/blueprints"

# Steam Deck (and native-Linux Steam) run the game through Proton, so the
# Windows-style AppData tree lives inside the Proton prefix (app id 526870).
DEFAULT_STEAM_DECK_BP_DIR: Final = (
    "~/.local/share/Steam/steamapps/compatdata/526870/pfx"
    "/drive_c/users/steamuser/AppData/Local"
    f"/{_BP_SUFFIX}"
)


def detect_platform() -> Platform:
    """Best-effort host classification, distinguishing a Steam Deck from generic Linux."""
    if sys.platform == "win32":
        return "windows"
    if sys.platform == "darwin":
        return "macos"
    if sys.platform.startswith("linux"):
        try:
            release = Path("/etc/os-release").read_text(encoding="utf-8").lower()
        except OSError:
            release = ""
        if "steamos" in release or "steamdeck" in release:
            return "steamdeck"
        return "linux"
    return "unknown"


def default_blueprints_dir(platform: Platform | None = None) -> Path | None:
    """
    Default Satisfactory blueprints folder for the (detected) platform, or None
    when there is no sensible default and the user must pass ``--dir`` explicitly.
    """
    platform = platform or detect_platform()
    if platform == "windows":
        local_appdata = os.environ.get("LOCALAPPDATA")
        base = Path(local_appdata) if local_appdata else Path("~/AppData/Local").expanduser()
        return base / _BP_SUFFIX
    if platform in ("steamdeck", "linux"):
        return Path(DEFAULT_STEAM_DECK_BP_DIR).expanduser()
    return None


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
