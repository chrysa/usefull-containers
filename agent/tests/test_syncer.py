from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import httpx
import pytest

from sfm_agent.config import AgentConfig
from sfm_agent.state import AgentState
from sfm_agent.syncer import BlueprintSyncer, SyncResult

# ── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture
def bp_dir(tmp_path: Path) -> Path:
    d = tmp_path / "blueprints"
    d.mkdir()
    return d


@pytest.fixture
def config(bp_dir: Path) -> AgentConfig:
    return AgentConfig(hub_url="http://hub.local:8000", blueprints_dir=bp_dir)


@pytest.fixture
def state(tmp_path: Path) -> AgentState:
    return AgentState(tmp_path / "state.json")


@pytest.fixture
def syncer(config: AgentConfig, state: AgentState) -> BlueprintSyncer:
    return BlueprintSyncer(config, state)


# ── list_remote ───────────────────────────────────────────────────────────────


def test_list_remote_returns_blueprints(syncer: BlueprintSyncer) -> None:
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"blueprints": [{"name": "foo"}], "total": 1}
    mock_resp.raise_for_status.return_value = None
    with patch.object(syncer._client, "get", return_value=mock_resp):
        result = syncer.list_remote()
    assert len(result) == 1
    assert result[0]["name"] == "foo"


def test_list_remote_raises_on_http_error(syncer: BlueprintSyncer) -> None:
    with patch.object(syncer._client, "get", side_effect=httpx.ConnectError("refused")):
        with pytest.raises(httpx.ConnectError):
            syncer.list_remote()


# ── upload_blueprint ──────────────────────────────────────────────────────────


def test_upload_blueprint_success(syncer: BlueprintSyncer, bp_dir: Path) -> None:
    (bp_dir / "test.sbp").write_bytes(b"sbp_data")
    (bp_dir / "test.sbpcfg").write_bytes(b"cfg_data")

    mock_resp = MagicMock()
    mock_resp.status_code = 207
    with patch.object(syncer._client, "post", return_value=mock_resp):
        result = syncer.upload_blueprint("test", bp_dir)

    assert result is True


def test_upload_blueprint_missing_sbp_returns_false(syncer: BlueprintSyncer, bp_dir: Path) -> None:
    result = syncer.upload_blueprint("no-such-file", bp_dir)
    assert result is False


def test_upload_blueprint_http_500_returns_false(syncer: BlueprintSyncer, bp_dir: Path) -> None:
    (bp_dir / "test.sbp").write_bytes(b"data")
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    with patch.object(syncer._client, "post", return_value=mock_resp):
        result = syncer.upload_blueprint("test", bp_dir)
    assert result is False


def test_upload_blueprint_connection_error_returns_false(
    syncer: BlueprintSyncer, bp_dir: Path
) -> None:
    (bp_dir / "test.sbp").write_bytes(b"data")
    with patch.object(syncer._client, "post", side_effect=httpx.ConnectError("refused")):
        result = syncer.upload_blueprint("test", bp_dir)
    assert result is False


# ── download_blueprint ────────────────────────────────────────────────────────


def _mock_download_responses(syncer: BlueprintSyncer, sbp_status: int, cfg_status: int) -> None:
    def fake_get(url: str, **kwargs: object) -> MagicMock:
        resp = MagicMock()
        if url.endswith("/download"):
            resp.status_code = sbp_status
            resp.content = b"sbp_bytes"
        else:
            resp.status_code = cfg_status
            resp.content = b"cfg_bytes"
        return resp

    syncer._client.get = fake_get  # type: ignore[method-assign]


def test_download_blueprint_success(syncer: BlueprintSyncer, bp_dir: Path) -> None:
    _mock_download_responses(syncer, sbp_status=200, cfg_status=200)
    result = syncer.download_blueprint("foo", bp_dir)
    assert result is True
    assert (bp_dir / "foo.sbp").read_bytes() == b"sbp_bytes"
    assert (bp_dir / "foo.sbpcfg").read_bytes() == b"cfg_bytes"


def test_download_blueprint_no_cfg_still_succeeds(syncer: BlueprintSyncer, bp_dir: Path) -> None:
    _mock_download_responses(syncer, sbp_status=200, cfg_status=404)
    result = syncer.download_blueprint("foo", bp_dir)
    assert result is True
    assert (bp_dir / "foo.sbp").exists()
    assert not (bp_dir / "foo.sbpcfg").exists()


def test_download_blueprint_sbp_404_returns_false(syncer: BlueprintSyncer, bp_dir: Path) -> None:
    _mock_download_responses(syncer, sbp_status=404, cfg_status=404)
    result = syncer.download_blueprint("missing", bp_dir)
    assert result is False


# ── sync ──────────────────────────────────────────────────────────────────────


def test_sync_uploads_local_only(syncer: BlueprintSyncer, bp_dir: Path) -> None:
    (bp_dir / "local-only.sbp").write_bytes(b"data")

    list_resp = MagicMock()
    list_resp.json.return_value = {"blueprints": [], "total": 0}
    list_resp.raise_for_status.return_value = None

    upload_resp = MagicMock()
    upload_resp.status_code = 207

    with (
        patch.object(syncer._client, "get", return_value=list_resp),
        patch.object(syncer._client, "post", return_value=upload_resp),
    ):
        result = syncer.sync()

    assert "local-only" in result.uploaded
    assert not result.errors


def test_sync_downloads_remote_only(syncer: BlueprintSyncer, bp_dir: Path) -> None:
    list_resp = MagicMock()
    list_resp.json.return_value = {"blueprints": [{"name": "remote-only"}], "total": 1}
    list_resp.raise_for_status.return_value = None

    def fake_get(url: str, **kwargs: object) -> MagicMock:
        resp = MagicMock()
        if "/blueprints" == url or url == "/blueprints":
            return list_resp
        resp.status_code = 200 if url.endswith("/download") else 404
        resp.content = b"data"
        return resp

    with patch.object(syncer._client, "get", side_effect=fake_get):
        result = syncer.sync()

    assert "remote-only" in result.downloaded
    assert not result.errors


def test_sync_returns_error_on_connection_failure(syncer: BlueprintSyncer) -> None:
    with patch.object(syncer._client, "get", side_effect=httpx.ConnectError("refused")):
        result = syncer.sync()
    assert not result.ok
    assert result.errors


def test_sync_result_ok_when_no_errors() -> None:
    r = SyncResult(uploaded=["a"], downloaded=[], errors=[])
    assert r.ok is True


def test_sync_result_not_ok_when_errors() -> None:
    r = SyncResult(uploaded=[], downloaded=[], errors=["upload:x"])
    assert r.ok is False
