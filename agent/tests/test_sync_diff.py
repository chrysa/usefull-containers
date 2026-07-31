from __future__ import annotations

from pathlib import Path

import httpx
import pytest
from pytest_mock import MockerFixture, MockType

from sfm_agent.config import AgentConfig
from sfm_agent.state import AgentState, BlueprintEntry
from sfm_agent.syncer import BlueprintSyncer


@pytest.fixture
def bp_dir(tmp_path: Path) -> Path:
    d = tmp_path / "blueprints"
    d.mkdir()
    return d


@pytest.fixture
def state(tmp_path: Path) -> AgentState:
    return AgentState(tmp_path / "state.json")


def _make_syncer(bp_dir: Path, state: AgentState, api_key: str = "") -> BlueprintSyncer:
    cfg = AgentConfig(hub_url="http://hub.local:8000", blueprints_dir=bp_dir, api_key=api_key)
    return BlueprintSyncer(cfg, state)


# ── API key header injection ───────────────────────────────────────────────────


def test_api_key_sets_request_header(bp_dir: Path, state: AgentState) -> None:
    syncer = _make_syncer(bp_dir, state, api_key="secret-123")
    assert syncer._client.headers.get("X-SFM-Agent-Key") == "secret-123"


def test_no_api_key_omits_header(bp_dir: Path, state: AgentState) -> None:
    syncer = _make_syncer(bp_dir, state)
    assert "X-SFM-Agent-Key" not in syncer._client.headers


# ── sync_diff ──────────────────────────────────────────────────────────────────


def test_sync_diff_uploads_names_returned_by_hub(bp_dir: Path, state: AgentState, mocker: MockerFixture) -> None:
    (bp_dir / "alpha.sbp").write_bytes(b"data")
    syncer = _make_syncer(bp_dir, state)

    sync_resp = mocker.MagicMock()
    sync_resp.raise_for_status.return_value = None
    sync_resp.json.return_value = {"to_upload": ["alpha"], "to_delete": []}
    upload_resp = mocker.MagicMock()
    upload_resp.status_code = 207

    def fake_post(url: str, **_kwargs: object) -> MockType:
        return sync_resp if url == "/blueprints/sync" else upload_resp

    mocker.patch.object(syncer._client, "post", side_effect=fake_post)
    result = syncer.sync_diff()

    assert result.uploaded == ["alpha"]
    assert result.errors == []


def test_sync_diff_falls_back_to_legacy_on_404(bp_dir: Path, state: AgentState, mocker: MockerFixture) -> None:
    syncer = _make_syncer(bp_dir, state)
    err = httpx.HTTPStatusError(
        "not found", request=mocker.MagicMock(), response=mocker.MagicMock(status_code=404)
    )
    sync_resp = mocker.MagicMock()
    sync_resp.raise_for_status.side_effect = err

    mocker.patch.object(syncer._client, "post", return_value=sync_resp)
    legacy = mocker.patch.object(syncer, "sync", return_value=mocker.MagicMock())
    syncer.sync_diff()

    legacy.assert_called_once()


def test_sync_diff_reports_error_on_connection_failure(bp_dir: Path, state: AgentState, mocker: MockerFixture) -> None:
    syncer = _make_syncer(bp_dir, state)
    mocker.patch.object(syncer._client, "post", side_effect=httpx.ConnectError("refused"))
    result = syncer.sync_diff()
    assert result.errors
    assert not result.ok


def test_sync_diff_drops_state_entries_for_deleted(bp_dir: Path, state: AgentState, mocker: MockerFixture) -> None:
    state.set(BlueprintEntry(name="gone", local_mtime=1.0))
    syncer = _make_syncer(bp_dir, state)

    sync_resp = mocker.MagicMock()
    sync_resp.raise_for_status.return_value = None
    sync_resp.json.return_value = {"to_upload": [], "to_delete": ["gone"]}

    mocker.patch.object(syncer._client, "post", return_value=sync_resp)
    syncer.sync_diff()

    assert state.get("gone") is None


def test_sync_diff_sends_local_inventory(bp_dir: Path, state: AgentState, mocker: MockerFixture) -> None:
    (bp_dir / "one.sbp").write_bytes(b"12345")
    syncer = _make_syncer(bp_dir, state)

    sync_resp = mocker.MagicMock()
    sync_resp.raise_for_status.return_value = None
    sync_resp.json.return_value = {"to_upload": [], "to_delete": []}

    captured: dict = {}

    def fake_post(url: str, **kwargs: object) -> MockType:
        captured["url"] = url
        captured["json"] = kwargs.get("json")
        return sync_resp

    mocker.patch.object(syncer._client, "post", side_effect=fake_post)
    syncer.sync_diff()

    assert captured["url"] == "/blueprints/sync"
    entries = captured["json"]["blueprints"]
    assert len(entries) == 1
    assert entries[0]["name"] == "one"
    assert entries[0]["size_bytes"] == 5
    assert "modified_at" in entries[0]
