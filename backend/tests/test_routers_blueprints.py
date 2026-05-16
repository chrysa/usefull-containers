from __future__ import annotations

import io
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


def _write_blueprint(directory: Path, name: str, *, with_cfg: bool = True) -> None:
    (directory / f"{name}.sbp").write_bytes(b"SBP_FAKE_DATA")
    if with_cfg:
        cfg = {"description": f"Desc {name}", "iconID": 1}
        (directory / f"{name}.sbpcfg").write_text(json.dumps(cfg), encoding="utf-8")


@pytest.fixture
def patched_client(tmp_path: Path) -> TestClient:
    from app import config as cfg_module
    cfg_module.settings.blueprints_dir = str(tmp_path)
    from app.main import create_app
    return TestClient(create_app())


@pytest.fixture
def populated_client(tmp_path: Path) -> tuple[TestClient, Path]:
    _write_blueprint(tmp_path, "alpha")
    _write_blueprint(tmp_path, "beta")
    from app import config as cfg_module
    cfg_module.settings.blueprints_dir = str(tmp_path)
    from app.main import create_app
    return TestClient(create_app()), tmp_path


class TestListBlueprintsEndpoint:
    def test_list_when_empty_should_return_200_with_empty_list(self, patched_client: TestClient) -> None:
        resp = patched_client.get("/api/v1/blueprints")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["blueprints"] == []

    def test_list_when_populated_should_return_all(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        resp = client.get("/api/v1/blueprints")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        names = [b["name"] for b in data["blueprints"]]
        assert "alpha" in names
        assert "beta" in names


class TestGetBlueprintEndpoint:
    def test_get_when_exists_should_return_200(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        resp = client.get("/api/v1/blueprints/alpha")
        assert resp.status_code == 200
        assert resp.json()["name"] == "alpha"

    def test_get_when_missing_should_return_404(self, patched_client: TestClient) -> None:
        resp = patched_client.get("/api/v1/blueprints/ghost")
        assert resp.status_code == 404


class TestDownloadBlueprintEndpoint:
    def test_download_when_exists_should_return_200_binary(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        resp = client.get("/api/v1/blueprints/alpha/download")
        assert resp.status_code == 200
        assert resp.content == b"SBP_FAKE_DATA"

    def test_download_when_missing_should_return_404(self, patched_client: TestClient) -> None:
        resp = patched_client.get("/api/v1/blueprints/ghost/download")
        assert resp.status_code == 404


class TestUploadBlueprintEndpoint:
    def test_upload_new_should_return_201_created_true(self, patched_client: TestClient) -> None:
        sbp_file = ("sbp_file", ("newbp.sbp", io.BytesIO(b"sbp_data"), "application/octet-stream"))
        resp = patched_client.post("/api/v1/blueprints", files=[sbp_file])
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "newbp"
        assert data["created"] is True

    def test_upload_with_cfg_should_save_both_files(
        self, patched_client: TestClient, tmp_path: Path
    ) -> None:
        from app import config as cfg_module
        blueprints_dir = Path(cfg_module.settings.blueprints_dir)

        cfg_content = json.dumps({"description": "test"}).encode()
        files = [
            ("sbp_file", ("bp2.sbp", io.BytesIO(b"sbp_data"), "application/octet-stream")),
            ("cfg_file", ("bp2.sbpcfg", io.BytesIO(cfg_content), "application/json")),
        ]
        resp = patched_client.post("/api/v1/blueprints", files=files)
        assert resp.status_code == 201
        assert (blueprints_dir / "bp2.sbpcfg").exists()

    def test_upload_existing_should_return_201_created_false(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        sbp_file = ("sbp_file", ("alpha.sbp", io.BytesIO(b"new_data"), "application/octet-stream"))
        resp = client.post("/api/v1/blueprints", files=[sbp_file])
        assert resp.status_code == 201
        assert resp.json()["created"] is False


class TestDeleteBlueprintEndpoint:
    def test_delete_when_exists_should_return_204(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, directory = populated_client
        resp = client.delete("/api/v1/blueprints/alpha")
        assert resp.status_code == 204
        assert not (directory / "alpha.sbp").exists()

    def test_delete_when_missing_should_return_404(self, patched_client: TestClient) -> None:
        resp = patched_client.delete("/api/v1/blueprints/ghost")
        assert resp.status_code == 404


class TestHealthEndpoint:
    def test_health_should_return_200_ok(self, patched_client: TestClient) -> None:
        resp = patched_client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
