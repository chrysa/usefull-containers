"""A-04b: per-user scoping of plans & blueprints + legacy-store migration.

These tests verify that two authenticated users get fully isolated stores and
that the one-shot migration relocates the pre-A-04b global store into the
owner's per-user directory.
"""

from __future__ import annotations

import io
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.constants import PLANS_FILENAME, USERS_SUBDIR


def _client_for(user_id: int) -> TestClient:
    """Build an app whose auth dependency is overridden to a fixed user id."""
    from app.db.models import User
    from app.dependencies.auth import get_current_user
    from app.main import create_app

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: User(
        id=user_id, username=f"user-{user_id}", is_active=True
    )
    return TestClient(app)


@pytest.fixture
def two_user_clients(tmp_path: Path) -> tuple[TestClient, TestClient]:
    """Two clients (user 1 and user 2) sharing the same storage roots."""
    from app import config as cfg_module

    cfg_module.settings.data_dir = str(tmp_path)
    cfg_module.settings.blueprints_dir = str(tmp_path / "blueprints")
    return _client_for(1), _client_for(2)


class TestPlanIsolation:
    def test_other_user_cannot_list_plans(
        self, two_user_clients: tuple[TestClient, TestClient]
    ) -> None:
        alice, bob = two_user_clients
        alice.post("/api/v1/plans", json={"name": "Alice Iron"})

        assert bob.get("/api/v1/plans").json() == []
        alice_plans = alice.get("/api/v1/plans").json()
        assert [p["name"] for p in alice_plans] == ["Alice Iron"]

    def test_other_user_cannot_get_update_or_delete_plan(
        self, two_user_clients: tuple[TestClient, TestClient]
    ) -> None:
        alice, bob = two_user_clients
        plan_id = alice.post("/api/v1/plans", json={"name": "Secret"}).json()["id"]

        assert bob.get(f"/api/v1/plans/{plan_id}").status_code == 404
        assert bob.patch(f"/api/v1/plans/{plan_id}", json={"name": "Hijack"}).status_code == 404
        assert bob.delete(f"/api/v1/plans/{plan_id}").status_code == 404
        # Alice's plan is untouched.
        assert alice.get(f"/api/v1/plans/{plan_id}").json()["name"] == "Secret"

    def test_plans_are_written_under_per_user_directory(
        self, two_user_clients: tuple[TestClient, TestClient], tmp_path: Path
    ) -> None:
        alice, _ = two_user_clients
        alice.post("/api/v1/plans", json={"name": "Iron"})
        assert (tmp_path / USERS_SUBDIR / "1" / PLANS_FILENAME).is_file()


class TestBlueprintIsolation:
    def test_other_user_cannot_see_or_download_blueprint(
        self, two_user_clients: tuple[TestClient, TestClient]
    ) -> None:
        alice, bob = two_user_clients
        sbp = ("sbp_file", ("turbo.sbp", io.BytesIO(b"DATA"), "application/octet-stream"))
        assert alice.post("/api/v1/blueprints", files=[sbp]).status_code == 201

        assert bob.get("/api/v1/blueprints").json()["total"] == 0
        assert bob.get("/api/v1/blueprints/turbo").status_code == 404
        assert bob.get("/api/v1/blueprints/turbo/download").status_code == 404
        # Alice still sees her own blueprint.
        assert alice.get("/api/v1/blueprints").json()["total"] == 1

    def test_blueprints_written_under_per_user_directory(
        self, two_user_clients: tuple[TestClient, TestClient], tmp_path: Path
    ) -> None:
        alice, _ = two_user_clients
        sbp = ("sbp_file", ("rotor.sbp", io.BytesIO(b"DATA"), "application/octet-stream"))
        alice.post("/api/v1/blueprints", files=[sbp])
        assert (tmp_path / "blueprints" / "1" / "rotor.sbp").is_file()


class TestLegacyStoreMigration:
    def _set_roots(self, tmp_path: Path) -> None:
        from app import config as cfg_module

        cfg_module.settings.data_dir = str(tmp_path)
        cfg_module.settings.blueprints_dir = str(tmp_path / "blueprints")

    def test_migrate_plans_moves_legacy_file(self, tmp_path: Path) -> None:
        self._set_roots(tmp_path)
        from app.services import storage_migration as sm

        legacy = tmp_path / PLANS_FILENAME
        legacy.write_text(json.dumps([{"id": "x", "name": "Legacy"}]), encoding="utf-8")

        assert sm._migrate_plans(1) is True
        target = tmp_path / USERS_SUBDIR / "1" / PLANS_FILENAME
        assert target.is_file()
        assert not legacy.exists()
        assert json.loads(target.read_text())[0]["name"] == "Legacy"

    def test_migrate_plans_never_overwrites_existing(self, tmp_path: Path) -> None:
        self._set_roots(tmp_path)
        from app.services import storage_migration as sm

        (tmp_path / PLANS_FILENAME).write_text("[]", encoding="utf-8")
        target_dir = tmp_path / USERS_SUBDIR / "1"
        target_dir.mkdir(parents=True)
        (target_dir / PLANS_FILENAME).write_text('[{"id":"keep"}]', encoding="utf-8")

        assert sm._migrate_plans(1) is False
        assert json.loads((target_dir / PLANS_FILENAME).read_text())[0]["id"] == "keep"

    def test_migrate_blueprints_moves_root_level_files_only(self, tmp_path: Path) -> None:
        self._set_roots(tmp_path)
        from app.services import storage_migration as sm

        root = tmp_path / "blueprints"
        root.mkdir()
        (root / "alpha.sbp").write_bytes(b"A")
        (root / "alpha.sbpcfg").write_text("{}", encoding="utf-8")
        (root / "alpha.meta.json").write_text('{"tags":[]}', encoding="utf-8")
        # An existing per-user subdir must be left untouched by the scan.
        (root / "2").mkdir()
        (root / "2" / "other.sbp").write_bytes(b"B")

        moved = sm._migrate_blueprints(1)
        assert moved == 3
        assert (root / "1" / "alpha.sbp").is_file()
        assert (root / "1" / "alpha.meta.json").is_file()
        assert not (root / "alpha.sbp").exists()
        assert (root / "2" / "other.sbp").is_file()

    async def test_orchestrator_is_noop_without_owner(self, tmp_path: Path) -> None:
        self._set_roots(tmp_path)
        from app.services import storage_migration as sm

        (tmp_path / PLANS_FILENAME).write_text("[]", encoding="utf-8")

        class _NoUserSession:
            async def scalar(self, *_a: object, **_kw: object) -> int | None:
                return None

        await sm.migrate_legacy_global_store(_NoUserSession())  # type: ignore[arg-type]
        # No owner → legacy file untouched.
        assert (tmp_path / PLANS_FILENAME).exists()
        assert not (tmp_path / USERS_SUBDIR).exists()

    async def test_orchestrator_migrates_for_owner(self, tmp_path: Path) -> None:
        self._set_roots(tmp_path)
        from app.services import storage_migration as sm

        (tmp_path / PLANS_FILENAME).write_text("[]", encoding="utf-8")

        class _OwnerSession:
            async def scalar(self, *_a: object, **_kw: object) -> int:
                return 7

        await sm.migrate_legacy_global_store(_OwnerSession())  # type: ignore[arg-type]
        assert (tmp_path / USERS_SUBDIR / "7" / PLANS_FILENAME).is_file()
        assert not (tmp_path / PLANS_FILENAME).exists()
