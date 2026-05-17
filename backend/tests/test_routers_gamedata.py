from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def gamedata_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    settings.gamedata_dir = str(tmp_path)
    from app.main import create_app

    return TestClient(create_app())


def _make_zip(data: dict) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w") as zf:
        zf.writestr("data.json", json.dumps(data))
    return buf.getvalue()


SAMPLE_DATA = {
    "items": {
        "Desc_IronIngot_C": {"name": "Iron Ingot", "stackSize": 100},
        "Desc_CopperIngot_C": {"name": "Copper Ingot", "stackSize": 100},
    },
    "recipes": {
        "Recipe_IngotIron_C": {
            "name": "Smelt Iron",
            "ingredients": [{"item": "Desc_IronOre_C", "amount": 1}],
            "products": [{"item": "Desc_IronIngot_C", "amount": 1}],
            "producedIn": ["Desc_Smelter_C"],
        }
    },
}


@pytest.fixture
def populated_client(tmp_path: Path) -> TestClient:
    settings.gamedata_dir = str(tmp_path)
    zip_bytes = _make_zip(SAMPLE_DATA)
    (tmp_path / "gamedata.json").write_bytes(
        json.dumps(
            {
                "imported_at": "2026-05-17T00:00:00+00:00",
                "source_file": "data.zip",
                "items": [
                    {
                        "id": "Desc_IronIngot_C",
                        "name": "Iron Ingot",
                        "description": "",
                        "stack_size": 100,
                    },
                    {
                        "id": "Desc_CopperIngot_C",
                        "name": "Copper Ingot",
                        "description": "",
                        "stack_size": 100,
                    },
                ],
                "recipes": [
                    {
                        "id": "Recipe_IngotIron_C",
                        "name": "Smelt Iron",
                        "ingredients": [{"item_id": "Desc_IronOre_C", "amount": 1.0}],
                        "products": [{"item_id": "Desc_IronIngot_C", "amount": 1.0}],
                        "produced_in": ["Desc_Smelter_C"],
                    }
                ],
            }
        ).encode()
    )
    _ = zip_bytes  # used only to define the helper; data written directly above
    from app.main import create_app

    return TestClient(create_app())


# ---------------------------------------------------------------------------
# POST /gamedata/import
# ---------------------------------------------------------------------------


class TestImportGamedataEndpoint:
    def test_import_valid_zip_should_return_201(self, gamedata_client: TestClient) -> None:
        zip_bytes = _make_zip(SAMPLE_DATA)
        resp = gamedata_client.post(
            "/api/v1/gamedata/import",
            files=[("file", ("data.zip", io.BytesIO(zip_bytes), "application/zip"))],
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["item_count"] == 2
        assert data["recipe_count"] == 1
        assert data["source_file"] == "data.zip"

    def test_import_bad_zip_should_return_422(self, gamedata_client: TestClient) -> None:
        resp = gamedata_client.post(
            "/api/v1/gamedata/import",
            files=[("file", ("bad.zip", io.BytesIO(b"not a zip"), "application/zip"))],
        )
        assert resp.status_code == 422

    def test_import_zip_without_json_should_return_422(self, gamedata_client: TestClient) -> None:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w") as zf:
            zf.writestr("readme.txt", "hello")
        resp = gamedata_client.post(
            "/api/v1/gamedata/import",
            files=[("file", ("no-json.zip", io.BytesIO(buf.getvalue()), "application/zip"))],
        )
        assert resp.status_code == 422

    def test_import_oversized_file_should_return_413(
        self, gamedata_client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import app.routers.gamedata as gd_router

        monkeypatch.setattr(gd_router, "MAX_GAMEDATA_ZIP_SIZE_BYTES", 1)
        zip_bytes = _make_zip({"items": {}, "recipes": {}})
        resp = gamedata_client.post(
            "/api/v1/gamedata/import",
            files=[("file", ("data.zip", io.BytesIO(zip_bytes), "application/zip"))],
        )
        assert resp.status_code == 413


# ---------------------------------------------------------------------------
# GET /gamedata/stats
# ---------------------------------------------------------------------------


class TestGamedataStatsEndpoint:
    def test_stats_with_no_data_returns_zeros(self, gamedata_client: TestClient) -> None:
        resp = gamedata_client.get("/api/v1/gamedata/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["item_count"] == 0
        assert data["recipe_count"] == 0

    def test_stats_after_import_returns_counts(self, populated_client: TestClient) -> None:
        resp = populated_client.get("/api/v1/gamedata/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["item_count"] == 2
        assert data["recipe_count"] == 1
        assert data["source_file"] == "data.zip"


# ---------------------------------------------------------------------------
# GET /gamedata/items
# ---------------------------------------------------------------------------


class TestGamedataItemsEndpoint:
    def test_items_with_no_data_returns_404(self, gamedata_client: TestClient) -> None:
        resp = gamedata_client.get("/api/v1/gamedata/items")
        assert resp.status_code == 404

    def test_items_returns_all(self, populated_client: TestClient) -> None:
        resp = populated_client.get("/api/v1/gamedata/items")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_items_filtered_by_query(self, populated_client: TestClient) -> None:
        resp = populated_client.get("/api/v1/gamedata/items", params={"q": "copper"})
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) == 1
        assert items[0]["name"] == "Copper Ingot"


# ---------------------------------------------------------------------------
# GET /gamedata/recipes
# ---------------------------------------------------------------------------


class TestGamedataRecipesEndpoint:
    def test_recipes_with_no_data_returns_404(self, gamedata_client: TestClient) -> None:
        resp = gamedata_client.get("/api/v1/gamedata/recipes")
        assert resp.status_code == 404

    def test_recipes_returns_all(self, populated_client: TestClient) -> None:
        resp = populated_client.get("/api/v1/gamedata/recipes")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_recipes_filtered_by_query(self, populated_client: TestClient) -> None:
        resp = populated_client.get("/api/v1/gamedata/recipes", params={"q": "smelt"})
        assert resp.status_code == 200
        recipes = resp.json()
        assert len(recipes) == 1
        assert recipes[0]["name"] == "Smelt Iron"

    def test_recipes_query_no_match_returns_empty(self, populated_client: TestClient) -> None:
        resp = populated_client.get("/api/v1/gamedata/recipes", params={"q": "zzznomatch"})
        assert resp.status_code == 200
        assert resp.json() == []
