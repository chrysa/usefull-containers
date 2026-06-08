"""Demo-mode fixtures.

When ``settings.demo_mode`` is enabled, the read endpoints serve this coherent,
self-consistent slice of Satisfactory data so the whole app is fully explorable
without a real database, an imported game-data set, or any credentials. The data
matches the response schemas exactly. Never enable demo mode in production.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app.models.blueprint import BlueprintColor, BlueprintRead
from app.models.gamedata import (
    GameDataStats,
    ItemSummary,
    RecipeIngredient,
    RecipeSummary,
)
from app.models.plan import PlanRead, TargetItem

# Stable timestamp so fixtures are deterministic across requests.
_DEMO_TS = datetime(2026, 6, 1, 12, 0, 0, tzinfo=UTC)
_DEMO_SOURCE_FILE = "demo-satisfactory-data.zip"


def demo_items() -> list[ItemSummary]:
    """A small, recognisable slice of the Satisfactory item catalogue."""
    return [
        ItemSummary(
            id="Desc_IronIngot_C",
            name="Iron Ingot",
            description="Used for crafting. The most basic of all metals.",
            stack_size=100,
        ),
        ItemSummary(
            id="Desc_IronPlate_C",
            name="Iron Plate",
            description="One of the most basic parts; required for many recipes.",
            stack_size=200,
        ),
        ItemSummary(
            id="Desc_IronRod_C",
            name="Iron Rod",
            description="A basic building block used in many recipes.",
            stack_size=200,
        ),
        ItemSummary(
            id="Desc_OreIron_C",
            name="Iron Ore",
            description="Mined from iron resource nodes. Smelted into Iron Ingots.",
            stack_size=100,
        ),
        ItemSummary(
            id="Desc_Water_C",
            name="Water",
            description="Extracted from water sources. Used in many recipes.",
            stack_size=50,
            is_fluid=True,
        ),
    ]


def demo_recipes() -> list[RecipeSummary]:
    """Recipes wired against the demo items above (ids line up exactly)."""
    return [
        RecipeSummary(
            id="Recipe_IronIngot_C",
            name="Iron Ingot",
            ingredients=[RecipeIngredient(item_id="Desc_OreIron_C", amount=1)],
            products=[RecipeIngredient(item_id="Desc_IronIngot_C", amount=1)],
            produced_in=["Desc_SmelterMk1_C"],
            time=2,
        ),
        RecipeSummary(
            id="Recipe_IronPlate_C",
            name="Iron Plate",
            ingredients=[RecipeIngredient(item_id="Desc_IronIngot_C", amount=3)],
            products=[RecipeIngredient(item_id="Desc_IronPlate_C", amount=2)],
            produced_in=["Desc_ConstructorMk1_C"],
            time=6,
        ),
        RecipeSummary(
            id="Recipe_IronRod_C",
            name="Iron Rod",
            ingredients=[RecipeIngredient(item_id="Desc_IronIngot_C", amount=1)],
            products=[RecipeIngredient(item_id="Desc_IronRod_C", amount=1)],
            produced_in=["Desc_ConstructorMk1_C"],
            time=4,
        ),
    ]


def demo_items_filtered(q: str) -> list[ItemSummary]:
    """Mirror the real ``list_items`` query filtering for demo data."""
    query = q.strip().lower()
    if not query:
        return demo_items()
    return [i for i in demo_items() if query in i.name.lower() or query in i.id.lower()]


def demo_recipes_filtered(q: str) -> list[RecipeSummary]:
    """Mirror the real ``list_recipes`` query filtering for demo data."""
    query = q.strip().lower()
    if not query:
        return demo_recipes()
    return [r for r in demo_recipes() if query in r.name.lower() or query in r.id.lower()]


def demo_gamedata_stats() -> GameDataStats:
    return GameDataStats(
        item_count=len(demo_items()),
        recipe_count=len(demo_recipes()),
        source_file=_DEMO_SOURCE_FILE,
        imported_at=_DEMO_TS.isoformat(),
    )


def demo_plans() -> list[PlanRead]:
    """Two ready-made factory plans that reference the demo items/blueprints."""
    return [
        PlanRead(
            id="demo-plan-iron-plates",
            name="Iron Plate Line — 120/min",
            description="Smelt iron ore into ingots, then constructors press plates.",
            target_items=[TargetItem(item_id="Desc_IronPlate_C", quantity=120)],
            linked_blueprints=["Iron Smelter Stack"],
            created_at=_DEMO_TS,
            updated_at=_DEMO_TS,
        ),
        PlanRead(
            id="demo-plan-iron-rods",
            name="Iron Rod Supply",
            description="A starter rod line feeding screw and frame production.",
            target_items=[TargetItem(item_id="Desc_IronRod_C", quantity=60)],
            linked_blueprints=[],
            created_at=_DEMO_TS,
            updated_at=_DEMO_TS,
        ),
    ]


def demo_plan(plan_id: str) -> PlanRead | None:
    return next((p for p in demo_plans() if p.id == plan_id), None)


def demo_blueprints() -> list[BlueprintRead]:
    """Blueprint metadata as it would appear after upload — no real files."""
    return [
        BlueprintRead(
            name="Iron Smelter Stack",
            description="8 smelters fed by a single Mk2 belt, balanced output.",
            icon_id=12,
            color=BlueprintColor(r=0.85, g=0.45, b=0.1, a=1.0),
            has_sbp=True,
            has_cfg=True,
            size_bytes=18_432,
            modified_at=_DEMO_TS,
            cfg_raw={"description": "8 smelters fed by a single Mk2 belt.", "iconID": 12},
            tags=["starter", "smelting"],
        ),
        BlueprintRead(
            name="Constructor Bus",
            description="Constructor row with a 4-lane manifold for plates and rods.",
            icon_id=27,
            color=BlueprintColor(r=0.2, g=0.55, b=0.85, a=1.0),
            has_sbp=True,
            has_cfg=False,
            size_bytes=24_576,
            modified_at=_DEMO_TS,
            cfg_raw=None,
            tags=["bus", "constructors"],
        ),
    ]


def demo_blueprint(name: str) -> BlueprintRead | None:
    return next((b for b in demo_blueprints() if b.name == name), None)
