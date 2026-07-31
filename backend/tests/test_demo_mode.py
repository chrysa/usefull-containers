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


class TestGeneratePlanEndpoint:
    """POST /assistant/generate-plan — calc-only, reachable in demo, never persists.

    With no gateway configured in tests the LLM path is skipped, so these exercise
    the deterministic offline keyword extraction end-to-end through the API.
    """

    def test_prompt_returns_a_deterministic_plan(self, demo_client: TestClient) -> None:
        res = demo_client.post(
            f"{API}/assistant/generate-plan",
            json={"prompt": "120 iron plate per minute"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["clarification"] is None
        plan = body["plan"]
        assert plan is not None
        assert [(t["item_id"], t["quantity"]) for t in plan["target_items"]] == [
            ("Desc_IronPlate_C", 120)
        ]
        steps = {s["item_id"]: s for s in plan["steps"]}
        assert steps["Desc_IronPlate_C"]["machine_count"] == 6
        assert steps["Desc_IronIngot_C"]["machine_count"] == 6
        raw = {r["item_id"]: r["per_minute"] for r in plan["raw_inputs"]}
        assert raw["Desc_OreIron_C"] == 180
        assert plan["build_order"].index("Desc_IronIngot_C") < plan["build_order"].index(
            "Desc_IronPlate_C"
        )

    def test_vague_prompt_returns_clarification(self, demo_client: TestClient) -> None:
        res = demo_client.post(f"{API}/assistant/generate-plan", json={"prompt": "hi there"})
        assert res.status_code == 200
        body = res.json()
        assert body["plan"] is None
        assert body["clarification"]

    def test_generate_plan_does_not_persist_anything(self, demo_client: TestClient) -> None:
        before = len(demo_client.get(f"{API}/plans").json())
        demo_client.post(
            f"{API}/assistant/generate-plan",
            json={"prompt": "60 iron rod per minute"},
        )
        after = len(demo_client.get(f"{API}/plans").json())
        assert after == before


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

    def test_auth_me_reachable_without_credentials(self, demo_client: TestClient) -> None:
        # Regression: the synthetic demo user used to lack ``created_at``, so
        # serialising UserRead crashed /auth/me with 500 (surfaced as a CORS
        # error in the browser on every page).
        res = demo_client.get(f"{API}/auth/me")
        assert res.status_code == 200
        body = res.json()
        assert body["username"] == "demo"
        assert body["created_at"]


class TestDemoIsReadOnly:
    """Demo mode serves shared fixtures through one synthetic user, so writes are
    rejected (403) to avoid leaking one visitor's data to the next."""

    def test_create_plan_is_forbidden(self, demo_client: TestClient) -> None:
        res = demo_client.post(f"{API}/plans", json={"name": "x", "target_items": []})
        assert res.status_code == 403
        assert "read-only" in res.json()["detail"].lower()

    def test_delete_plan_is_forbidden(self, demo_client: TestClient) -> None:
        plan_id = demo_client.get(f"{API}/plans").json()[0]["id"]
        assert demo_client.delete(f"{API}/plans/{plan_id}").status_code == 403

    def test_delete_blueprint_is_forbidden(self, demo_client: TestClient) -> None:
        name = demo_client.get(f"{API}/blueprints").json()["blueprints"][0]["name"]
        assert demo_client.delete(f"{API}/blueprints/{name}").status_code == 403

    def test_reads_still_work(self, demo_client: TestClient) -> None:
        assert demo_client.get(f"{API}/plans").status_code == 200
        assert demo_client.get(f"{API}/blueprints").status_code == 200


class TestAssistantMatchesDemoData:
    """The assistant must report the same counts the rest of the app shows in
    demo mode — it used to read raw global storage and answer 0."""

    def test_blueprint_count_matches_fixtures(self, demo_client: TestClient) -> None:
        total = demo_client.get(f"{API}/blueprints").json()["total"]
        assert total > 0
        res = demo_client.post(f"{API}/assistant/chat", json={"message": "Combien de blueprints ?"})
        assert res.status_code == 200
        assert f"{total} blueprint" in res.json()["reply"]

    def test_plan_count_matches_fixtures(self, demo_client: TestClient) -> None:
        total = len(demo_client.get(f"{API}/plans").json())
        assert total > 0
        res = demo_client.post(f"{API}/assistant/chat", json={"message": "Voir mes plans"})
        assert res.status_code == 200
        assert f"{total} plan" in res.json()["reply"]
