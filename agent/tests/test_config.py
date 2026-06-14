from __future__ import annotations

from pathlib import Path

import pytest

from sfm_agent import config
from sfm_agent.config import default_blueprints_dir, detect_platform

# ── detect_platform ─────────────────────────────────────────────────────────────


def test_detect_windows(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config.sys, "platform", "win32")
    assert detect_platform() == "windows"


def test_detect_macos(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config.sys, "platform", "darwin")
    assert detect_platform() == "macos"


def test_detect_steamdeck_from_os_release(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config.sys, "platform", "linux")
    monkeypatch.setattr(Path, "read_text", lambda self, **kw: 'ID=steamos\nNAME="SteamOS"\n')
    assert detect_platform() == "steamdeck"


def test_detect_plain_linux(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config.sys, "platform", "linux")
    monkeypatch.setattr(Path, "read_text", lambda self, **kw: 'ID=ubuntu\nNAME="Ubuntu"\n')
    assert detect_platform() == "linux"


def test_detect_linux_when_os_release_unreadable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config.sys, "platform", "linux")

    def _boom(self: Path, **kw: object) -> str:
        raise OSError("nope")

    monkeypatch.setattr(Path, "read_text", _boom)
    assert detect_platform() == "linux"


def test_detect_unknown(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config.sys, "platform", "aix")
    assert detect_platform() == "unknown"


# ── default_blueprints_dir ──────────────────────────────────────────────────────


def test_default_windows_uses_localappdata(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("LOCALAPPDATA", str(tmp_path))
    result = default_blueprints_dir("windows")
    assert result == tmp_path / "FactoryGame/Saved/SaveGames/blueprints"


def test_default_windows_falls_back_without_localappdata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("LOCALAPPDATA", raising=False)
    result = default_blueprints_dir("windows")
    assert result is not None
    assert result.parts[-4:] == ("FactoryGame", "Saved", "SaveGames", "blueprints")
    assert "AppData" in str(result)


def test_default_steamdeck_uses_proton_prefix() -> None:
    result = default_blueprints_dir("steamdeck")
    assert result is not None
    assert "compatdata/526870" in result.as_posix()
    assert result.as_posix().endswith("FactoryGame/Saved/SaveGames/blueprints")


def test_default_linux_matches_steamdeck() -> None:
    assert default_blueprints_dir("linux") == default_blueprints_dir("steamdeck")


@pytest.mark.parametrize("platform", ["macos", "unknown"])
def test_default_none_for_unsupported_platforms(platform: str) -> None:
    assert default_blueprints_dir(platform) is None  # type: ignore[arg-type]
