from __future__ import annotations

import threading
from pathlib import Path

import httpx
import pytest
from pytest_mock import MockerFixture, MockType
from click.testing import CliRunner

from sfm_agent.cli import cli
from sfm_agent.syncer import SyncResult


def _flat(output: str) -> str:
    """Lower-cased output with runs of whitespace collapsed.

    Rich soft-wraps to the console width, so a long tmp path can split a phrase
    ("not found" -> "not\nfound"). Assertions match on the flattened text.
    """
    return " ".join(output.split()).lower()


@pytest.fixture
def runner() -> CliRunner:
    return CliRunner()


@pytest.fixture
def bp_dir(tmp_path: Path) -> Path:
    d = tmp_path / "blueprints"
    d.mkdir()
    return d


# ── status ────────────────────────────────────────────────────────────────────


def test_status_hub_reachable(runner: CliRunner, mocker: MockerFixture) -> None:
    ok_resp = mocker.MagicMock(status_code=200)
    ok_resp.json.return_value = {"total": 3}
    mocker.patch("sfm_agent.cli.httpx.get", return_value=ok_resp)
    result = runner.invoke(cli, ["status", "--hub", "http://localhost:8000"])
    assert result.exit_code == 0
    assert "connected" in _flat(result.output)


def test_status_hub_unreachable(runner: CliRunner, mocker: MockerFixture) -> None:
    mocker.patch("sfm_agent.cli.httpx.get", side_effect=httpx.ConnectError("refused"))
    result = runner.invoke(cli, ["status", "--hub", "http://unreachable"])
    assert result.exit_code == 1
    assert "unreachable" in _flat(result.output)


def test_status_hub_non_200(runner: CliRunner, mocker: MockerFixture) -> None:
    mock_resp = mocker.MagicMock(status_code=503)
    mock_resp.json.return_value = {}
    mocker.patch("sfm_agent.cli.httpx.get", return_value=mock_resp)
    result = runner.invoke(cli, ["status", "--hub", "http://localhost:8000"])
    assert result.exit_code == 0
    assert "503" in result.output


def test_status_blueprints_request_fails_gracefully(runner: CliRunner, mocker: MockerFixture) -> None:
    responses = [
        mocker.MagicMock(status_code=200),
        httpx.ConnectError("fail"),
    ]
    call_count = {"n": 0}

    def fake_get(url: str, **kwargs: object) -> MockType:
        v = responses[call_count["n"]]
        call_count["n"] += 1
        if isinstance(v, Exception):
            raise v
        v.json.return_value = {}
        return v

    mocker.patch("sfm_agent.cli.httpx.get", side_effect=fake_get)
    result = runner.invoke(cli, ["status", "--hub", "http://localhost:8000"])
    assert result.exit_code == 0


# ── sync ──────────────────────────────────────────────────────────────────────


def test_sync_success(runner: CliRunner, bp_dir: Path, mocker: MockerFixture) -> None:
    ok = SyncResult(uploaded=["a"], downloaded=["b"], errors=[])
    mock_cls = mocker.patch("sfm_agent.cli.BlueprintSyncer")
    mock_cls.return_value.__enter__.return_value.sync_diff.return_value = ok
    result = runner.invoke(cli, ["sync", "--hub", "http://hub", "--dir", str(bp_dir)])
    assert result.exit_code == 0
    assert "1" in result.output


def test_sync_with_errors_exits_1(runner: CliRunner, bp_dir: Path, mocker: MockerFixture) -> None:
    fail = SyncResult(uploaded=[], downloaded=[], errors=["upload:x"])
    mock_cls = mocker.patch("sfm_agent.cli.BlueprintSyncer")
    mock_cls.return_value.__enter__.return_value.sync_diff.return_value = fail
    result = runner.invoke(cli, ["sync", "--hub", "http://hub", "--dir", str(bp_dir)])
    assert result.exit_code == 1
    assert "upload:x" in result.output


def test_sync_verbose_flag(runner: CliRunner, bp_dir: Path, mocker: MockerFixture) -> None:
    ok = SyncResult(uploaded=[], downloaded=[], errors=[])
    mock_cls = mocker.patch("sfm_agent.cli.BlueprintSyncer")
    mock_cls.return_value.__enter__.return_value.sync_diff.return_value = ok
    result = runner.invoke(cli, ["sync", "--dir", str(bp_dir), "-v"])
    assert result.exit_code == 0


# ── start ─────────────────────────────────────────────────────────────────────


def test_start_missing_dir_exits_1(runner: CliRunner, tmp_path: Path) -> None:
    result = runner.invoke(cli, ["start", "--hub", "http://hub", "--dir", str(tmp_path / "ghost")])
    assert result.exit_code == 1
    assert "not found" in _flat(result.output)


def test_start_runs_initial_sync_and_stops(runner: CliRunner, bp_dir: Path, mocker: MockerFixture) -> None:
    ok = SyncResult(uploaded=[], downloaded=[], errors=[])

    pre_set = threading.Event()
    pre_set.set()  # loop exits immediately — is_set() returns True before first iteration

    mocker.patch("sfm_agent.cli.threading.Event", return_value=pre_set)
    mock_syncer_cls = mocker.patch("sfm_agent.cli.BlueprintSyncer")
    mock_watcher_cls = mocker.patch("sfm_agent.cli.BlueprintWatcher")
    mock_syncer_cls.return_value.__enter__.return_value.sync_diff.return_value = ok
    mock_watcher = mocker.MagicMock()
    mock_watcher_cls.return_value = mock_watcher

    result = runner.invoke(cli, ["start", "--hub", "http://hub", "--dir", str(bp_dir)])

    assert result.exit_code == 0
    mock_watcher.start.assert_called_once()
    mock_watcher.stop.assert_called_once()


def test_sync_auto_detects_dir_when_not_given(runner: CliRunner, bp_dir: Path, mocker: MockerFixture) -> None:
    """Omitting --dir falls back to the per-platform default."""
    ok = SyncResult(uploaded=[], downloaded=[], errors=[])
    mocker.patch("sfm_agent.cli.detect_platform", return_value="windows")
    mocker.patch("sfm_agent.cli.default_blueprints_dir", return_value=bp_dir)
    mock_cls = mocker.patch("sfm_agent.cli.BlueprintSyncer")
    mock_cls.return_value.__enter__.return_value.sync_diff.return_value = ok
    result = runner.invoke(cli, ["sync", "--hub", "http://hub"])
    assert result.exit_code == 0
    assert "windows" in _flat(result.output)


def test_start_no_default_for_platform_exits_1(runner: CliRunner, mocker: MockerFixture) -> None:
    mocker.patch("sfm_agent.cli.detect_platform", return_value="unknown")
    mocker.patch("sfm_agent.cli.default_blueprints_dir", return_value=None)
    result = runner.invoke(cli, ["start", "--hub", "http://hub"])
    assert result.exit_code == 1
    assert "no default" in _flat(result.output)


# ── detect ──────────────────────────────────────────────────────────────────────


def test_detect_reports_platform_and_existing_dir(runner: CliRunner, bp_dir: Path, mocker: MockerFixture) -> None:
    mocker.patch("sfm_agent.cli.detect_platform", return_value="steamdeck")
    mocker.patch("sfm_agent.cli.default_blueprints_dir", return_value=bp_dir)
    result = runner.invoke(cli, ["detect"])
    assert result.exit_code == 0
    assert "steamdeck" in _flat(result.output)
    assert "found" in _flat(result.output)


def test_detect_reports_missing_dir(runner: CliRunner, tmp_path: Path, mocker: MockerFixture) -> None:
    ghost = tmp_path / "ghost"
    mocker.patch("sfm_agent.cli.detect_platform", return_value="windows")
    mocker.patch("sfm_agent.cli.default_blueprints_dir", return_value=ghost)
    result = runner.invoke(cli, ["detect"])
    assert result.exit_code == 0
    assert "not found" in _flat(result.output)


def test_detect_no_default_platform(runner: CliRunner, mocker: MockerFixture) -> None:
    mocker.patch("sfm_agent.cli.detect_platform", return_value="macos")
    mocker.patch("sfm_agent.cli.default_blueprints_dir", return_value=None)
    result = runner.invoke(cli, ["detect"])
    assert result.exit_code == 0
    assert "no default" in _flat(result.output)


def test_start_logs_sync_results_when_changes(runner: CliRunner, bp_dir: Path, mocker: MockerFixture) -> None:
    """start command prints poll sync line when changes were found."""
    pre_set = threading.Event()
    ok_upload = SyncResult(uploaded=["x"], downloaded=[], errors=[])
    pre_set.set()

    mocker.patch("sfm_agent.cli.threading.Event", return_value=pre_set)
    mock_syncer_cls = mocker.patch("sfm_agent.cli.BlueprintSyncer")
    mocker.patch("sfm_agent.cli.BlueprintWatcher")
    mock_syncer_cls.return_value.__enter__.return_value.sync_diff.return_value = ok_upload
    result = runner.invoke(cli, ["start", "--hub", "http://hub", "--dir", str(bp_dir)])

    assert result.exit_code == 0
