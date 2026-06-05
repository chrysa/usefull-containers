from __future__ import annotations

import threading
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from watchdog.events import FileCreatedEvent, FileModifiedEvent

from sfm_agent.config import AgentConfig
from sfm_agent.watcher import (
    WATCHED_EXTS,
    BlueprintEventHandler,
    BlueprintWatcher,
    _DebounceTimer,
)


@pytest.fixture
def config(tmp_path: Path) -> AgentConfig:
    d = tmp_path / "blueprints"
    d.mkdir()
    return AgentConfig(blueprints_dir=d, debounce_seconds=0.05)


# ── _DebounceTimer ────────────────────────────────────────────────────────────


def test_debounce_fires_callback() -> None:
    called = threading.Event()
    timer = _DebounceTimer(0.05, called.set)
    timer.schedule()
    assert called.wait(timeout=1.0)


def test_debounce_reschedule_resets_delay() -> None:
    count: dict[str, int] = {"n": 0}

    def cb() -> None:
        count["n"] += 1

    timer = _DebounceTimer(0.05, cb)
    timer.schedule()
    timer.schedule()
    timer.schedule()
    time.sleep(0.3)
    assert count["n"] == 1


def test_debounce_cancel_prevents_callback() -> None:
    called = threading.Event()
    timer = _DebounceTimer(0.3, called.set)
    timer.schedule()
    timer.cancel()
    assert not called.wait(timeout=0.5)


def test_debounce_cancel_when_no_timer_is_noop() -> None:
    timer = _DebounceTimer(0.1, lambda: None)
    timer.cancel()  # should not raise


# ── WATCHED_EXTS ──────────────────────────────────────────────────────────────


def test_watched_exts_contains_sbp_and_sbpcfg() -> None:
    assert ".sbp" in WATCHED_EXTS
    assert ".sbpcfg" in WATCHED_EXTS


# ── BlueprintEventHandler ─────────────────────────────────────────────────────


def test_handler_ignores_directory_events(config: AgentConfig) -> None:
    syncer = MagicMock()
    handler = BlueprintEventHandler(syncer, config)
    evt = FileCreatedEvent("/some/dir")
    evt.is_directory = True
    handler.on_created(evt)
    time.sleep(0.2)
    syncer.upload_blueprint.assert_not_called()


def test_handler_ignores_non_watched_extension(config: AgentConfig) -> None:
    syncer = MagicMock()
    handler = BlueprintEventHandler(syncer, config)
    evt = FileCreatedEvent(str(config.blueprints_dir / "readme.txt"))
    evt.is_directory = False
    handler.on_created(evt)
    time.sleep(0.2)
    syncer.upload_blueprint.assert_not_called()


def test_handler_triggers_upload_on_sbp_created(config: AgentConfig) -> None:
    syncer = MagicMock()
    handler = BlueprintEventHandler(syncer, config)
    evt = FileCreatedEvent(str(config.blueprints_dir / "my-bp.sbp"))
    evt.is_directory = False
    handler.on_created(evt)
    time.sleep(0.3)
    syncer.upload_blueprint.assert_called_once_with("my-bp", config.blueprints_dir)


def test_handler_triggers_upload_on_sbpcfg_modified(config: AgentConfig) -> None:
    syncer = MagicMock()
    handler = BlueprintEventHandler(syncer, config)
    evt = FileModifiedEvent(str(config.blueprints_dir / "other.sbpcfg"))
    evt.is_directory = False
    handler.on_modified(evt)
    time.sleep(0.3)
    syncer.upload_blueprint.assert_called_once_with("other", config.blueprints_dir)


def test_handler_debounces_rapid_events(config: AgentConfig) -> None:
    syncer = MagicMock()
    handler = BlueprintEventHandler(syncer, config)
    path = str(config.blueprints_dir / "bp.sbp")
    for _ in range(5):
        evt = FileModifiedEvent(path)
        evt.is_directory = False
        handler.on_modified(evt)
    time.sleep(0.4)
    assert syncer.upload_blueprint.call_count == 1


# ── BlueprintWatcher ──────────────────────────────────────────────────────────


def test_watcher_start_stop(config: AgentConfig) -> None:
    syncer = MagicMock()
    with patch("sfm_agent.watcher.Observer") as mock_obs_cls:
        mock_obs = MagicMock()
        mock_obs_cls.return_value = mock_obs
        watcher = BlueprintWatcher(syncer, config)
        watcher.start()
        mock_obs.start.assert_called_once()
        watcher.stop()
        mock_obs.stop.assert_called_once()
        mock_obs.join.assert_called_once()
