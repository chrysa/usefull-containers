from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import pytest
from app.models.gamedata import RecipeIngredient, RecipeSummary
from app.services.gamedata_service import (
    GameDataNotFoundError,
    GameDataParseError,
    get_stats,
    import_gamedata_zip,
    list_items,
    list_recipes,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _make_zip(data: dict) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w") as zf:
        zf.writestr("data.json", json.dumps(data))
    return buf.getvalue()


ITEMS_DICT = {
    "Desc_IronIngot_C": {"name": "Iron Ingot", "description": "Basic ingot", "stackSize": 100},
    "Desc_CopperIngot_C": {"name": "Copper Ingot", "description": "", "stackSize": 100},
}

RECIPES_DICT = {
    "Recipe_IngotIron_C": {
        "name": "Smelt Iron",
        "ingredients": [{"item": "Desc_IronOre_C", "amount": 1}],
        "products": [{"item": "Desc_IronIngot_C", "amount": 1}],
        "producedIn": ["Desc_Smelter_C"],
        "time": 2,
    }
}


# ---------------------------------------------------------------------------
# import_gamedata_zip
# ---------------------------------------------------------------------------


class TestImportGamedataZip:
    def test_valid_zip_with_items_and_recipes_should_save_json(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": ITEMS_DICT, "recipes": RECIPES_DICT})
        items, recipes = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        assert len(items) == 2
        assert len(recipes) == 1
        assert (tmp_path / "gamedata.json").exists()

    def test_items_are_correctly_normalised(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": ITEMS_DICT, "recipes": {}})
        items, _ = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        names = {i.name for i in items}
        assert "Iron Ingot" in names
        assert "Copper Ingot" in names

    def test_recipe_ingredients_are_parsed(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": {}, "recipes": RECIPES_DICT})
        _, recipes = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        assert recipes[0].ingredients[0] == RecipeIngredient(item_id="Desc_IronOre_C", amount=1.0)

    def test_recipe_time_is_parsed(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": {}, "recipes": RECIPES_DICT})
        _, recipes = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        assert recipes[0].time == 2.0

    def test_recipe_time_defaults_to_zero_when_absent(self, tmp_path: Path) -> None:
        recipes_no_time = {
            "Recipe_X_C": {
                "name": "X",
                "ingredients": [],
                "products": [{"item": "Desc_X_C", "amount": 1}],
            }
        }
        zip_bytes = _make_zip({"items": {}, "recipes": recipes_no_time})
        _, recipes = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        assert recipes[0].time == 0.0

    def test_recipe_time_accepts_manufactoring_duration_alias(self, tmp_path: Path) -> None:
        recipes = {
            "Recipe_Y_C": {
                "name": "Y",
                "ingredients": [],
                "products": [{"item": "Desc_Y_C", "amount": 1}],
                "manufactoringDuration": 6,
            }
        }
        zip_bytes = _make_zip({"items": {}, "recipes": recipes})
        _, parsed = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        assert parsed[0].time == 6.0

    def test_fluid_items_are_flagged(self, tmp_path: Path) -> None:
        items = {
            "Desc_Water_C": {"name": "Water", "form": "RF_LIQUID"},
            "Desc_IronIngot_C": {"name": "Iron Ingot", "stackSize": 100},
            "Desc_NitrogenGas_C": {"name": "Nitrogen Gas", "liquid": True},
        }
        zip_bytes = _make_zip({"items": items, "recipes": {}})
        parsed, _ = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        by_name = {i.name: i.is_fluid for i in parsed}
        assert by_name["Water"] is True
        assert by_name["Nitrogen Gas"] is True
        assert by_name["Iron Ingot"] is False

    def test_list_format_items_are_accepted(self, tmp_path: Path) -> None:
        items_list = [{"id": "iron-ingot", "name": "Iron Ingot", "stackSize": 100}]
        zip_bytes = _make_zip({"items": items_list, "recipes": []})
        items, _ = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        assert items[0].name == "Iron Ingot"

    def test_empty_items_and_recipes_should_save_empty_lists(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": {}, "recipes": {}})
        items, recipes = import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        assert items == []
        assert recipes == []

    def test_missing_json_in_zip_should_raise_parse_error(self, tmp_path: Path) -> None:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w") as zf:
            zf.writestr("readme.txt", "hello")
        with pytest.raises(GameDataParseError, match="No .json file"):
            import_gamedata_zip(str(tmp_path), buf.getvalue(), "empty.zip")

    def test_bad_zip_bytes_should_raise_parse_error(self, tmp_path: Path) -> None:
        with pytest.raises(GameDataParseError, match="not a valid ZIP"):
            import_gamedata_zip(str(tmp_path), b"not a zip", "bad.zip")

    def test_invalid_json_in_zip_should_raise_parse_error(self, tmp_path: Path) -> None:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w") as zf:
            zf.writestr("data.json", "not json {{{")
        with pytest.raises(GameDataParseError, match="JSON parse error"):
            import_gamedata_zip(str(tmp_path), buf.getvalue(), "bad.zip")

    def test_gamedata_dir_is_created_if_missing(self, tmp_path: Path) -> None:
        target = tmp_path / "deep" / "nested"
        zip_bytes = _make_zip({"items": {}, "recipes": {}})
        import_gamedata_zip(str(target), zip_bytes, "data.zip")
        assert (target / "gamedata.json").exists()

    def test_source_filename_is_persisted(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": {}, "recipes": {}})
        import_gamedata_zip(str(tmp_path), zip_bytes, "my-data.zip")
        saved = json.loads((tmp_path / "gamedata.json").read_text())
        assert saved["source_file"] == "my-data.zip"


# ---------------------------------------------------------------------------
# get_stats
# ---------------------------------------------------------------------------


class TestGetStats:
    def test_stats_when_no_data_imported_returns_zeros(self, tmp_path: Path) -> None:
        stats = get_stats(str(tmp_path))
        assert stats.item_count == 0
        assert stats.recipe_count == 0
        assert stats.source_file is None

    def test_stats_after_import_returns_correct_counts(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": ITEMS_DICT, "recipes": RECIPES_DICT})
        import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        stats = get_stats(str(tmp_path))
        assert stats.item_count == 2
        assert stats.recipe_count == 1
        assert stats.source_file == "data.zip"


# ---------------------------------------------------------------------------
# list_items / list_recipes
# ---------------------------------------------------------------------------


class TestListItems:
    def test_list_items_returns_all_when_no_query(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": ITEMS_DICT, "recipes": {}})
        import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        items = list_items(str(tmp_path))
        assert len(items) == 2

    def test_list_items_filters_by_name(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": ITEMS_DICT, "recipes": {}})
        import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        items = list_items(str(tmp_path), query="copper")
        assert len(items) == 1
        assert items[0].name == "Copper Ingot"

    def test_list_items_raises_when_no_data(self, tmp_path: Path) -> None:
        with pytest.raises(GameDataNotFoundError):
            list_items(str(tmp_path))


class TestListRecipes:
    def test_list_recipes_returns_all(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": {}, "recipes": RECIPES_DICT})
        import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        recipes = list_recipes(str(tmp_path))
        assert len(recipes) == 1
        assert recipes[0].name == "Smelt Iron"

    def test_list_recipes_filters_by_name(self, tmp_path: Path) -> None:
        zip_bytes = _make_zip({"items": {}, "recipes": RECIPES_DICT})
        import_gamedata_zip(str(tmp_path), zip_bytes, "data.zip")
        assert list_recipes(str(tmp_path), query="smelt") == [
            RecipeSummary(
                id="Recipe_IngotIron_C",
                name="Smelt Iron",
                ingredients=[RecipeIngredient(item_id="Desc_IronOre_C", amount=1.0)],
                products=[RecipeIngredient(item_id="Desc_IronIngot_C", amount=1.0)],
                produced_in=["Desc_Smelter_C"],
                time=2.0,
            )
        ]

    def test_list_recipes_raises_when_no_data(self, tmp_path: Path) -> None:
        with pytest.raises(GameDataNotFoundError):
            list_recipes(str(tmp_path))
