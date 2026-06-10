from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

from fastapi.testclient import TestClient

from app.models.blueprint import BlueprintSyncEntry
from app.services.blueprint_service import compute_sync_diff

_AGENT_KEY = "super-secret-agent-key"


def _write_blueprint(directory: Path, name: str, data: bytes = b"SBP_FAKE_DATA") -> None:
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f"{name}.sbp").write_bytes(data)
    cfg = {"description": f"Desc {name}", "iconID": 1}
    (directory / f"{name}.sbpcfg").write_text(json.dumps(cfg), encoding="utf-8")


def _entry(directory: Path, name: str) -> BlueprintSyncEntry:
    """Build a sync entry mirroring the on-disk file (so it counts as unchanged)."""
    sbp = directory / f"{name}.sbp"
    stat = sbp.stat()
    return BlueprintSyncEntry(
        name=name,
        modified_at=datetime.fromtimestamp(stat.st_mtime),
        size_bytes=stat.st_size,
    )


# ── compute_sync_diff (pure logic) ────────────────────────────────────────────


class TestComputeSyncDiff:
    def test_empty_both_sides_is_noop(self, tmp_path: Path) -> None:
        diff = compute_sync_diff(str(tmp_path), [])
        assert diff.to_upload == []
        assert diff.to_delete == []

    def test_local_only_blueprint_is_uploaded(self, tmp_path: Path) -> None:
        # Server empty; agent reports one local blueprint.
        entry = BlueprintSyncEntry(
            name="alpha", modified_at=datetime(2026, 1, 1), size_bytes=10
        )
        diff = compute_sync_diff(str(tmp_path), [entry])
        assert diff.to_upload == ["alpha"]
        assert diff.to_delete == []

    def test_server_only_blueprint_is_deleted(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "beta")
        diff = compute_sync_diff(str(tmp_path), [])
        assert diff.to_upload == []
        assert diff.to_delete == ["beta"]

    def test_identical_blueprint_is_unchanged(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "gamma")
        diff = compute_sync_diff(str(tmp_path), [_entry(tmp_path, "gamma")])
        assert diff.to_upload == []
        assert diff.to_delete == []

    def test_size_difference_triggers_upload(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "delta", data=b"SHORT")
        entry = _entry(tmp_path, "delta")
        bigger = BlueprintSyncEntry(
            name="delta", modified_at=entry.modified_at, size_bytes=entry.size_bytes + 100
        )
        diff = compute_sync_diff(str(tmp_path), [bigger])
        assert diff.to_upload == ["delta"]
        assert diff.to_delete == []

    def test_locally_newer_triggers_upload(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "epsilon")
        base = _entry(tmp_path, "epsilon")
        newer = BlueprintSyncEntry(
            name="epsilon",
            modified_at=base.modified_at + timedelta(minutes=5),
            size_bytes=base.size_bytes,
        )
        diff = compute_sync_diff(str(tmp_path), [newer])
        assert diff.to_upload == ["epsilon"]

    def test_sub_second_mtime_jitter_is_ignored(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "zeta")
        base = _entry(tmp_path, "zeta")
        jittered = BlueprintSyncEntry(
            name="zeta",
            modified_at=base.modified_at + timedelta(milliseconds=300),
            size_bytes=base.size_bytes,
        )
        diff = compute_sync_diff(str(tmp_path), [jittered])
        assert diff.to_upload == []

    def test_mixed_upload_and_delete(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "keep")
        _write_blueprint(tmp_path, "remove")
        entries = [
            _entry(tmp_path, "keep"),
            BlueprintSyncEntry(name="new", modified_at=datetime(2026, 1, 1), size_bytes=5),
        ]
        diff = compute_sync_diff(str(tmp_path), entries)
        assert diff.to_upload == ["new"]
        assert diff.to_delete == ["remove"]


# ── POST /blueprints/sync (endpoint, auth + side effects) ──────────────────────


def _register(client: TestClient, username: str = "owner") -> str:
    resp = client.post(
        "/api/v1/auth/register", json={"username": username, "password": "pw-long-enough-123"}
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


class TestSyncEndpointAuth:
    def test_valid_agent_key_authorises(
        self, client: TestClient, tmp_path: Path
    ) -> None:
        from app.config import settings

        settings.agent_api_key = _AGENT_KEY
        try:
            _register(client)  # becomes owner (id=1)
            resp = client.post(
                "/api/v1/blueprints/sync",
                json={"blueprints": []},
                headers={"X-SFM-Agent-Key": _AGENT_KEY},
            )
            assert resp.status_code == 200, resp.text
            assert resp.json() == {"to_upload": [], "to_delete": []}
        finally:
            settings.agent_api_key = ""

    def test_wrong_agent_key_is_rejected(self, client: TestClient) -> None:
        from app.config import settings

        settings.agent_api_key = _AGENT_KEY
        try:
            _register(client)
            resp = client.post(
                "/api/v1/blueprints/sync",
                json={"blueprints": []},
                headers={"X-SFM-Agent-Key": "nope"},
            )
            assert resp.status_code == 401
        finally:
            settings.agent_api_key = ""

    def test_no_credentials_is_rejected(self, client: TestClient) -> None:
        resp = client.post("/api/v1/blueprints/sync", json={"blueprints": []})
        assert resp.status_code == 401

    def test_jwt_also_authorises(self, client: TestClient) -> None:
        token = _register(client)
        resp = client.post(
            "/api/v1/blueprints/sync",
            json={"blueprints": []},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200, resp.text


class TestSyncEndpointSideEffects:
    def test_server_only_blueprint_is_deleted_on_sync(
        self, client: TestClient, tmp_path: Path
    ) -> None:
        from app.config import settings

        settings.agent_api_key = _AGENT_KEY
        try:
            _register(client)  # owner id=1
            user_dir = tmp_path / "1"
            _write_blueprint(user_dir, "stale")
            assert (user_dir / "stale.sbp").exists()

            resp = client.post(
                "/api/v1/blueprints/sync",
                json={"blueprints": []},
                headers={"X-SFM-Agent-Key": _AGENT_KEY},
            )
            assert resp.status_code == 200, resp.text
            assert resp.json()["to_delete"] == ["stale"]
            assert not (user_dir / "stale.sbp").exists()
        finally:
            settings.agent_api_key = ""

    def test_local_only_blueprint_is_reported_for_upload(
        self, client: TestClient, tmp_path: Path
    ) -> None:
        from app.config import settings

        settings.agent_api_key = _AGENT_KEY
        try:
            _register(client)
            resp = client.post(
                "/api/v1/blueprints/sync",
                json={
                    "blueprints": [
                        {
                            "name": "fresh",
                            "modified_at": "2026-06-01T12:00:00",
                            "size_bytes": 42,
                        }
                    ]
                },
                headers={"X-SFM-Agent-Key": _AGENT_KEY},
            )
            assert resp.status_code == 200, resp.text
            assert resp.json()["to_upload"] == ["fresh"]
        finally:
            settings.agent_api_key = ""
