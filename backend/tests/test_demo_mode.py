"""Demo-mode behaviour: /health reports the flag and the read endpoints serve
coherent fixtures without any real credentials, database, or imported data."""

from __future__ import annotations

import importlib
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

API = "/api/v1"


@pytest.fixture
def demo_client(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Generator[TestClient, None, None]:
    """A client with demo mode ON. Mirrors the conftest ``client`` setup (test DB
    in a tmp dir) so the lifespan can boot, then flips ``demo_mode`` — which
    monkeypatch reverts after the test."""
    from app.config import settings

    monkeypatch.setattr(settings, "blueprints_dir", str(tmp_path))
    monkeypatch.setattr(settings, "data_dir", str(tmp_path))
    monkeypatch.setattr(settings, "jwt_secret_key", "test-secret-key-that-is-long-enough-32ch!")
    monkeypatch.setattr(settings, "test_mode", True)
    monkeypatch.setattr(settings, "demo_mode", True)

    import app.db.session as session_module

    importlib.reload(session_module)

    from app.main import create_app

    app = create_app()
    with TestClient(app) as tc:
        yield tc


class TestHealthReportsDemoMode:
    def test_health_reports_demo_mode_true_when_on(self, demo_client: TestClient) -> None:
        res = demo_client.get(f"{API}/health")
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "ok"
        assert body["demo_mode"] is True

    def test_health_reports_demo_mode_false_by_default(self, client: TestClient) -> None:
        res = client.get(f"{API}/health")
        assert res.status_code == 200
        assert res.json()["demo_mode"] is False


class TestGameDataFixtures:
    def test_items_served_without_imported_data(self, demo_client: TestClient) -> None:
        res = demo_client.get(f"{API}/gamedata/items")
        assert res.status_code == 200
        items = res.json()
        assert len(items) > 0
        assert any(i["id"] == "Desc_IronIngot_C" for i in items)

    def test_items_query_filters_fixtures(self, demo_client: TestClient) -> None:
        res = demo_client.get(f"{API}/gamedata/items", params={"q": "plate"})
        assert res.status_code == 200
        items = res.json()
        assert items and all("plate" in i["name"].lower() for i in items)

    def test_recipes_served_without_imported_data(self, demo_client: TestClient) -> None:
        res = demo_client.get(f"{API}/gamedata/recipes")
        assert res.status_code == 200
        recipes = res.json()
        assert len(recipes) > 0
        # Fixtures are self-consistent: recipe products reference fixture items.
        item_ids = {i["id"] for i in demo_client.get(f"{API}/gamedata/items").json()}
        for recipe in recipes:
            for product in recipe["products"]:
                assert product["item_id"] in item_ids

    def test_stats_reflect_fixture_counts(self, demo_client: TestClient) -> None:
        res = demo_client.get(f"{API}/gamedata/stats")
        assert res.status_code == 200
        stats = res.json()
        assert stats["item_count"] > 0
        assert stats["recipe_count"] > 0
        assert stats["source_file"]


class TestAuthGatedFixtures:
    def test_plans_reachable_without_credentials(self, demo_client: TestClient) -> None:
        # No Authorization header — would be 401 outside demo mode.
        res = demo_client.get(f"{API}/plans")
        assert res.status_code == 200
        plans = res.json()
        assert len(plans) > 0
        assert all({"id", "name", "target_items"} <= p.keys() for p in plans)

    def test_single_plan_served(self, demo_client: TestClient) -> None:
        plan_id = demo_client.get(f"{API}/plans").json()[0]["id"]
        res = demo_client.get(f"{API}/plans/{plan_id}")
        assert res.status_code == 200
        assert res.json()["id"] == plan_id

    def test_unknown_plan_returns_404(self, demo_client: TestClient) -> None:
        assert demo_client.get(f"{API}/plans/does-not-exist").status_code == 404

    def test_blueprints_reachable_without_credentials(self, demo_client: TestClient) -> None:
        res = demo_client.get(f"{API}/blueprints")
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == len(body["blueprints"]) > 0

    def test_single_blueprint_served(self, demo_client: TestClient) -> None:
        name = demo_client.get(f"{API}/blueprints").json()["blueprints"][0]["name"]
        res = demo_client.get(f"{API}/blueprints/{name}")
        assert res.status_code == 200
        assert res.json()["name"] == name
