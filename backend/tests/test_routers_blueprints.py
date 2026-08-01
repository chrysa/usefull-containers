from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# The fake user injected by _build_authed_app(); blueprints are scoped under
# {blueprints_dir}/{_TEST_USER_ID}/ since A-04b (per-user partitioning).
_TEST_USER_ID = 1


def _user_dir(blueprints_root: Path) -> Path:
    """Return (and create) the per-user blueprint dir for the fake test user."""
    d = blueprints_root / str(_TEST_USER_ID)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _write_blueprint(directory: Path, name: str, *, with_cfg: bool = True) -> None:
    (directory / f"{name}.sbp").write_bytes(b"SBP_FAKE_DATA")
    if with_cfg:
        cfg = {"description": f"Desc {name}", "iconID": 1}
        (directory / f"{name}.sbpcfg").write_text(json.dumps(cfg), encoding="utf-8")


def _build_authed_app() -> TestClient:
    """Create the app with the auth dependency (A-04) bypassed by a fake user.

    These router tests exercise the file-based blueprint behaviour, not auth.
    """
    from app.db.models import User
    from app.db.session import get_session
    from app.dependencies.auth import get_current_user
    from app.main import create_app

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: User(
        id=_TEST_USER_ID, username="test-user", is_active=True
    )
    # Mutations also write an audit entry (A-07); these file-based tests don't
    # set up a DB, so swap the session for a no-op.
    app.dependency_overrides[get_session] = lambda: _NoopSession()
    return TestClient(app)


class _NoopSession:
    """Stand-in async session: audit writes are no-ops in file-based tests."""

    def add(self, *_args: object, **_kwargs: object) -> None: ...

    async def commit(self) -> None: ...


@pytest.fixture
def patched_client(tmp_path: Path) -> TestClient:
    from app import config as cfg_module

    cfg_module.settings.blueprints_dir = str(tmp_path)
    return _build_authed_app()


@pytest.fixture
def populated_client(tmp_path: Path) -> tuple[TestClient, Path]:
    from app import config as cfg_module

    cfg_module.settings.blueprints_dir = str(tmp_path)
    # Blueprints are partitioned per user (A-04b): write into the user's dir and
    # hand it back so tests assert against the directory the router actually uses.
    user_dir = _user_dir(tmp_path)
    _write_blueprint(user_dir, "alpha")
    _write_blueprint(user_dir, "beta")
    return _build_authed_app(), user_dir


class TestListBlueprintsEndpoint:
    def test_list_when_empty_should_return_200_with_empty_list(
        self, patched_client: TestClient
    ) -> None:
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

        blueprints_dir = _user_dir(Path(cfg_module.settings.blueprints_dir))

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


class TestDownloadAllEndpoint:
    def test_download_all_when_empty_dir_should_return_200_with_valid_zip(
        self, patched_client: TestClient
    ) -> None:
        resp = patched_client.get("/api/v1/blueprints/download-all")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/zip"
        assert 'filename="blueprints.zip"' in resp.headers["content-disposition"]
        zf = zipfile.ZipFile(io.BytesIO(resp.content))
        assert zf.namelist() == []

    def test_download_all_when_blueprints_present_should_include_all_files(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        resp = client.get("/api/v1/blueprints/download-all")
        assert resp.status_code == 200
        zf = zipfile.ZipFile(io.BytesIO(resp.content))
        names = zf.namelist()
        assert "alpha.sbp" in names
        assert "alpha.sbpcfg" in names
        assert "beta.sbp" in names

    def test_download_all_should_preserve_file_content(
        self, patched_client: TestClient, tmp_path: Path
    ) -> None:
        from app import config as cfg_module

        cfg_module.settings.blueprints_dir = str(tmp_path)
        (_user_dir(tmp_path) / "solo.sbp").write_bytes(b"REAL_SBP_BYTES")
        resp = patched_client.get("/api/v1/blueprints/download-all")
        assert resp.status_code == 200
        zf = zipfile.ZipFile(io.BytesIO(resp.content))
        assert zf.read("solo.sbp") == b"REAL_SBP_BYTES"


class TestUploadBatchEndpoint:
    def test_batch_upload_new_blueprints_should_return_207(
        self, patched_client: TestClient
    ) -> None:
        files = [
            ("files", ("alpha.sbp", io.BytesIO(b"SBP_A"), "application/octet-stream")),
            ("files", ("beta.sbp", io.BytesIO(b"SBP_B"), "application/octet-stream")),
        ]
        resp = patched_client.post("/api/v1/blueprints/upload-batch", files=files)
        assert resp.status_code == 207
        data = resp.json()
        assert "alpha" in data["created"]
        assert "beta" in data["created"]
        assert data["total"] == 2

    def test_batch_upload_with_cfg_should_save_both_files(
        self, patched_client: TestClient, tmp_path: Path
    ) -> None:
        from app import config as cfg_module

        cfg_module.settings.blueprints_dir = str(tmp_path)
        files = [
            ("files", ("iron.sbp", io.BytesIO(b"SBP_IRON"), "application/octet-stream")),
            ("files", ("iron.sbpcfg", io.BytesIO(b'{"description":"Iron"}'), "application/json")),
        ]
        resp = patched_client.post("/api/v1/blueprints/upload-batch", files=files)
        assert resp.status_code == 207
        assert "iron" in resp.json()["created"]
        assert (_user_dir(tmp_path) / "iron.sbpcfg").exists()

    def test_batch_upload_existing_should_report_updated(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        files = [("files", ("alpha.sbp", io.BytesIO(b"NEW_DATA"), "application/octet-stream"))]
        resp = client.post("/api/v1/blueprints/upload-batch", files=files)
        assert resp.status_code == 207
        assert "alpha" in resp.json()["updated"]

    def test_batch_upload_empty_files_should_return_207_zero_total(
        self, patched_client: TestClient
    ) -> None:
        resp = patched_client.post("/api/v1/blueprints/upload-batch", files=[])
        assert resp.status_code == 207
        assert resp.json()["total"] == 0

    def test_batch_upload_directory_error_should_return_500(
        self, patched_client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from app.routers import blueprints as bp_router
        from app.services.blueprint_service import BlueprintDirectoryError

        def _raise(*_a: object, **_kw: object) -> None:
            raise BlueprintDirectoryError("no dir")

        monkeypatch.setattr(bp_router, "save_blueprint_batch", _raise)
        files = [("files", ("x.sbp", io.BytesIO(b"DATA"), "application/octet-stream"))]
        resp = patched_client.post("/api/v1/blueprints/upload-batch", files=files)
        assert resp.status_code == 500

    def test_batch_upload_oversized_file_should_be_skipped(
        self, patched_client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        # Shrink the limit instead of building a real 50 MB payload, so a
        # 9-byte file counts as oversized and the test stays fast.
        monkeypatch.setattr("app.routers.blueprints.MAX_BLUEPRINT_SIZE_BYTES", 5)

        files = [("files", ("big.sbp", io.BytesIO(b"123456789"), "application/octet-stream"))]
        resp = patched_client.post("/api/v1/blueprints/upload-batch", files=files)

        # file is silently skipped → total=0
        assert resp.status_code == 207
        assert resp.json()["total"] == 0


class TestImportZipEndpoint:
    def test_import_valid_zip_should_return_207_with_created(
        self, patched_client: TestClient
    ) -> None:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w") as zf:
            zf.writestr("iron.sbp", b"SBP_IRON")
            zf.writestr("iron.sbpcfg", b'{"description":"Iron"}')
        buf.seek(0)
        resp = patched_client.post(
            "/api/v1/blueprints/import-zip",
            files=[("zip_file", ("blueprints.zip", buf, "application/zip"))],
        )
        assert resp.status_code == 207
        data = resp.json()
        assert "iron" in data["created"]
        assert data["total"] == 1

    def test_import_zip_updates_existing_blueprints(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w") as zf:
            zf.writestr("alpha.sbp", b"UPDATED_SBP")
        buf.seek(0)
        resp = client.post(
            "/api/v1/blueprints/import-zip",
            files=[("zip_file", ("blueprints.zip", buf, "application/zip"))],
        )
        assert resp.status_code == 207
        assert "alpha" in resp.json()["updated"]

    def test_import_invalid_zip_should_return_400(self, patched_client: TestClient) -> None:
        resp = patched_client.post(
            "/api/v1/blueprints/import-zip",
            files=[("zip_file", ("bad.zip", io.BytesIO(b"not a zip"), "application/zip"))],
        )
        assert resp.status_code == 400

    def test_import_zip_with_non_blueprint_files_ignored(self, patched_client: TestClient) -> None:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w") as zf:
            zf.writestr("readme.txt", b"ignore me")
        buf.seek(0)
        resp = patched_client.post(
            "/api/v1/blueprints/import-zip",
            files=[("zip_file", ("blueprints.zip", buf, "application/zip"))],
        )
        assert resp.status_code == 207
        assert resp.json()["total"] == 0


class TestHealthEndpoint:
    def test_health_should_return_200_ok(self, patched_client: TestClient) -> None:
        resp = patched_client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestBlueprintTagsEndpoint:
    def test_set_tags_creates_meta_json(self, populated_client: tuple[TestClient, Path]) -> None:
        client, directory = populated_client
        resp = client.patch("/api/v1/blueprints/alpha/tags", json={"tags": ["factory", "iron"]})
        assert resp.status_code == 200
        data = resp.json()
        assert set(data["tags"]) == {"factory", "iron"}
        meta_path = directory / "alpha.meta.json"
        assert meta_path.exists()
        assert json.loads(meta_path.read_text())["tags"] == ["factory", "iron"]

    def test_set_tags_replaces_existing_tags(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        client.patch("/api/v1/blueprints/alpha/tags", json={"tags": ["old"]})
        resp = client.patch("/api/v1/blueprints/alpha/tags", json={"tags": ["new1", "new2"]})
        assert resp.status_code == 200
        assert set(resp.json()["tags"]) == {"new1", "new2"}

    def test_set_tags_clears_tags_when_empty_list(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        client.patch("/api/v1/blueprints/alpha/tags", json={"tags": ["x"]})
        resp = client.patch("/api/v1/blueprints/alpha/tags", json={"tags": []})
        assert resp.status_code == 200
        assert resp.json()["tags"] == []

    def test_set_tags_on_missing_blueprint_returns_404(self, patched_client: TestClient) -> None:
        resp = patched_client.patch("/api/v1/blueprints/ghost/tags", json={"tags": ["x"]})
        assert resp.status_code == 404

    def test_list_blueprints_includes_tags(self, populated_client: tuple[TestClient, Path]) -> None:
        client, directory = populated_client
        (directory / "alpha.meta.json").write_text(
            json.dumps({"tags": ["steel", "copper"]}), encoding="utf-8"
        )
        resp = client.get("/api/v1/blueprints")
        assert resp.status_code == 200
        blueprints = {b["name"]: b for b in resp.json()["blueprints"]}
        assert set(blueprints["alpha"]["tags"]) == {"steel", "copper"}
        assert blueprints["beta"]["tags"] == []

    def test_tags_cleared_on_blueprint_delete(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, directory = populated_client
        (directory / "alpha.meta.json").write_text(
            json.dumps({"tags": ["to-delete"]}), encoding="utf-8"
        )
        resp = client.delete("/api/v1/blueprints/alpha")
        assert resp.status_code == 204
        assert not (directory / "alpha.meta.json").exists()


class TestDownloadBlueprintCfgEndpoint:
    def test_download_cfg_returns_200(self, populated_client: tuple[TestClient, Path]) -> None:
        client, _ = populated_client
        resp = client.get("/api/v1/blueprints/alpha/download-cfg")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/octet-stream"
        assert resp.content  # non-empty binary content

    def test_download_cfg_returns_404_when_missing(self, patched_client: TestClient) -> None:
        resp = patched_client.get("/api/v1/blueprints/ghost/download-cfg")
        assert resp.status_code == 404

    def test_download_cfg_no_cfg_file_returns_404(
        self, patched_client: TestClient, tmp_path: Path
    ) -> None:
        # Blueprint exists as .sbp only (no .sbpcfg)
        from app import config as cfg_module

        cfg_module.settings.blueprints_dir = str(tmp_path)
        (_user_dir(tmp_path) / "solo.sbp").write_bytes(b"SBP_FAKE_DATA")

        client = _build_authed_app()
        resp = client.get("/api/v1/blueprints/solo/download-cfg")
        assert resp.status_code == 404


class TestPatchBlueprintDescriptionEndpoint:
    def test_update_description_returns_200(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, _ = populated_client
        resp = client.patch(
            "/api/v1/blueprints/alpha",
            json={"description": "Updated desc"},
        )
        assert resp.status_code == 200
        assert resp.json()["description"] == "Updated desc"

    def test_update_description_404_when_missing(self, patched_client: TestClient) -> None:
        resp = patched_client.patch(
            "/api/v1/blueprints/ghost",
            json={"description": "x"},
        )
        assert resp.status_code == 404

    def test_update_description_persists_to_cfg(
        self, populated_client: tuple[TestClient, Path]
    ) -> None:
        client, directory = populated_client
        client.patch("/api/v1/blueprints/alpha", json={"description": "Persisted"})
        cfg_data = json.loads((directory / "alpha.sbpcfg").read_text())
        assert cfg_data["description"] == "Persisted"
