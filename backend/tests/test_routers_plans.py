from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def plan_client(tmp_path: Path) -> TestClient:
    from app import config as cfg_module

    cfg_module.settings.data_dir = str(tmp_path)
    from app.main import create_app

    return TestClient(create_app())


class TestListPlansEndpoint:
    def test_list_when_empty_should_return_200_with_empty_list(
        self, plan_client: TestClient
    ) -> None:
        resp = plan_client.get("/api/v1/plans")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_after_create_should_return_one_plan(self, plan_client: TestClient) -> None:
        plan_client.post("/api/v1/plans", json={"name": "Iron Plan"})
        resp = plan_client.get("/api/v1/plans")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Iron Plan"


class TestCreatePlanEndpoint:
    def test_create_minimal_should_return_201(self, plan_client: TestClient) -> None:
        resp = plan_client.post("/api/v1/plans", json={"name": "Steel Factory"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Steel Factory"
        assert data["description"] == ""
        assert data["target_items"] == []
        assert data["linked_blueprints"] == []
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_full_should_return_201_with_all_fields(self, plan_client: TestClient) -> None:
        payload = {
            "name": "Copper Plan",
            "description": "Copper sheet production",
            "target_items": [{"item_id": "Desc_CopperSheet_C", "quantity": 30.0}],
            "linked_blueprints": ["copper-refinery"],
        }
        resp = plan_client.post("/api/v1/plans", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["description"] == "Copper sheet production"
        assert data["target_items"][0]["item_id"] == "Desc_CopperSheet_C"
        assert data["linked_blueprints"] == ["copper-refinery"]

    def test_create_with_empty_name_should_return_422(self, plan_client: TestClient) -> None:
        resp = plan_client.post("/api/v1/plans", json={"name": ""})
        assert resp.status_code == 422

    def test_create_with_invalid_quantity_should_return_422(self, plan_client: TestClient) -> None:
        resp = plan_client.post(
            "/api/v1/plans",
            json={"name": "Bad", "target_items": [{"item_id": "x", "quantity": -1}]},
        )
        assert resp.status_code == 422


class TestGetPlanEndpoint:
    def test_get_when_exists_should_return_200(self, plan_client: TestClient) -> None:
        create = plan_client.post("/api/v1/plans", json={"name": "Find Me"})
        plan_id = create.json()["id"]
        resp = plan_client.get(f"/api/v1/plans/{plan_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Find Me"

    def test_get_when_missing_should_return_404(self, plan_client: TestClient) -> None:
        resp = plan_client.get("/api/v1/plans/nonexistent-id")
        assert resp.status_code == 404


class TestUpdatePlanEndpoint:
    def test_patch_name_should_return_200_updated(self, plan_client: TestClient) -> None:
        create = plan_client.post("/api/v1/plans", json={"name": "Old Name"})
        plan_id = create.json()["id"]
        resp = plan_client.patch(f"/api/v1/plans/{plan_id}", json={"name": "New Name"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    def test_patch_target_items_should_replace_list(self, plan_client: TestClient) -> None:
        create = plan_client.post("/api/v1/plans", json={"name": "Plan"})
        plan_id = create.json()["id"]
        resp = plan_client.patch(
            f"/api/v1/plans/{plan_id}",
            json={"target_items": [{"item_id": "Desc_IronPlate_C", "quantity": 60.0}]},
        )
        assert resp.status_code == 200
        assert resp.json()["target_items"][0]["item_id"] == "Desc_IronPlate_C"

    def test_patch_when_missing_should_return_404(self, plan_client: TestClient) -> None:
        resp = plan_client.patch("/api/v1/plans/ghost", json={"name": "X"})
        assert resp.status_code == 404


class TestDeletePlanEndpoint:
    def test_delete_when_exists_should_return_204(self, plan_client: TestClient) -> None:
        create = plan_client.post("/api/v1/plans", json={"name": "To Delete"})
        plan_id = create.json()["id"]
        resp = plan_client.delete(f"/api/v1/plans/{plan_id}")
        assert resp.status_code == 204

    def test_delete_removes_plan_from_list(self, plan_client: TestClient) -> None:
        create = plan_client.post("/api/v1/plans", json={"name": "Ephemeral"})
        plan_id = create.json()["id"]
        plan_client.delete(f"/api/v1/plans/{plan_id}")
        resp = plan_client.get("/api/v1/plans")
        ids = [p["id"] for p in resp.json()]
        assert plan_id not in ids

    def test_delete_when_missing_should_return_404(self, plan_client: TestClient) -> None:
        resp = plan_client.delete("/api/v1/plans/ghost")
        assert resp.status_code == 404
