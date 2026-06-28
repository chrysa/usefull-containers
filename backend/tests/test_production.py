"""Parity tests for the backend production calculator (L10b phase 1).

These pin the backend port of ``frontend/src/domain/gamedata/calculator.ts`` and
``logistics.ts`` to the exact numbers the frontend produces, using the shared demo
fixtures so the two implementations can never silently diverge.
"""

from __future__ import annotations

import pytest

from app.domain.production import (
    calculate_production,
    count_for_tier,
    flatten_requirements,
    machine_requirement,
    summarize_machines,
    transport_requirement,
)
from app.fixtures import demo_items, demo_recipes
from app.models.gamedata import ItemSummary, RecipeIngredient, RecipeSummary

# Demo fixture ids (see app/fixtures.py).
IRON_PLATE = "Desc_IronPlate_C"
IRON_ROD = "Desc_IronRod_C"
IRON_INGOT = "Desc_IronIngot_C"
IRON_ORE = "Desc_OreIron_C"
CONSTRUCTOR = "Desc_ConstructorMk1_C"
SMELTER = "Desc_SmelterMk1_C"


@pytest.fixture
def recipes():
    return demo_recipes()


@pytest.fixture
def items():
    return demo_items()


class TestCalculateProduction:
    def test_iron_plate_tree_resolves_to_raw_ore(self, recipes, items):
        # 120 plates/min → 180 ingots/min → 180 ore/min (raw leaf).
        root = calculate_production(IRON_PLATE, 120, recipes, items)

        assert root.item_id == IRON_PLATE
        assert root.recipe_id == "Recipe_IronPlate_C"
        assert root.quantity == pytest.approx(120)
        # 2 plates / 6s = 20/machine/min → 6 constructors at 100% clock.
        assert root.machines is not None
        assert root.machines.machine_id == CONSTRUCTOR
        assert root.machines.count == 6
        assert root.machines.clock_percent == pytest.approx(100)

        (ingot,) = root.children
        assert ingot.item_id == IRON_INGOT
        assert ingot.quantity == pytest.approx(180)  # 3 ingots * (120/2)
        assert ingot.machines is not None
        assert ingot.machines.count == 6  # 180 / (1*60/2 = 30)

        (ore,) = ingot.children
        assert ore.item_id == IRON_ORE
        assert ore.quantity == pytest.approx(180)
        assert ore.recipe_id is None  # raw → leaf
        assert ore.machines is None

    def test_raw_item_is_a_leaf(self, recipes, items):
        root = calculate_production(IRON_ORE, 60, recipes, items)
        assert root.recipe_id is None
        assert root.recipe_name is None
        assert root.machines is None
        assert root.children == []


class TestFlattenRequirements:
    def test_flatten_collects_raw_inputs_sorted(self, recipes, items):
        root = calculate_production(IRON_PLATE, 120, recipes, items)
        flat = flatten_requirements(root)

        assert [(r.item_id, r.quantity) for r in flat] == [(IRON_ORE, pytest.approx(180))]
        assert flat[0].is_raw is True
        assert flat[0].is_fluid is False


class TestSummarizeMachines:
    def test_machine_counts_grouped_by_machine_type(self, recipes, items):
        root = calculate_production(IRON_PLATE, 120, recipes, items)
        summary = {m.machine_id: m for m in summarize_machines(root)}

        assert summary[CONSTRUCTOR].total_machines == 6
        assert summary[CONSTRUCTOR].steps == 1
        assert summary[SMELTER].total_machines == 6
        assert summary[SMELTER].steps == 1


class TestMachineRequirement:
    def test_fractional_count_rounds_up_with_clock(self, recipes):
        plate_recipe = next(r for r in recipes if r.id == "Recipe_IronPlate_C")
        # 30 plates/min ÷ 20/machine = 1.5 → 2 machines @ 75% clock.
        req = machine_requirement(plate_recipe, IRON_PLATE, 30)
        assert req is not None
        assert req.exact == pytest.approx(1.5)
        assert req.count == 2
        assert req.clock_percent == pytest.approx(75)

    def test_unknown_time_is_not_computable(self, recipes):
        plate_recipe = next(r for r in recipes if r.id == "Recipe_IronPlate_C")
        zero_time = plate_recipe.model_copy(update={"time": 0})
        assert machine_requirement(zero_time, IRON_PLATE, 30) is None


class TestTransportRequirement:
    def test_solid_belt_sizing(self):
        req = transport_requirement(120, is_fluid=False)
        assert req.is_fluid is False
        assert req.min_single_tier == "Mk.2"  # 120 ≤ 120
        per_tier = {t.tier: t.count for t in req.per_tier}
        assert per_tier["Mk.1"] == 2  # ceil(120 / 60)
        assert per_tier["Mk.2"] == 1

    def test_fluid_uses_pipe_tiers(self):
        req = transport_requirement(450, is_fluid=True)
        assert req.is_fluid is True
        assert req.min_single_tier == "Mk.2"  # 300 < 450 ≤ 600

    def test_count_for_tier_lookup(self):
        req = transport_requirement(120, is_fluid=False)
        assert count_for_tier(req, "Mk.1") == 2
        assert count_for_tier(req, "does-not-exist") == 0


# A tiny synthetic gameset to exercise branches the linear demo tree can't reach:
# a shared raw input (dedup), a machine-less recipe, and a recipe cycle.
_WIDGET = "item-widget"
_PART_A = "item-part-a"
_PART_B = "item-part-b"
_RAW = "item-raw"

_EDGE_ITEMS = [
    ItemSummary(id=_WIDGET, name="Widget"),
    ItemSummary(id=_PART_A, name="Part A"),
    ItemSummary(id=_PART_B, name="Part B"),
    ItemSummary(id=_RAW, name="Raw"),
]
_EDGE_RECIPES = [
    RecipeSummary(
        id="r-widget",
        name="Widget",
        ingredients=[
            RecipeIngredient(item_id=_PART_A, amount=1),
            RecipeIngredient(item_id=_PART_B, amount=1),
        ],
        products=[RecipeIngredient(item_id=_WIDGET, amount=1)],
        produced_in=["machine-assembler"],
        time=60,
    ),
    # Both parts consume the same raw → the flattened raw must be summed.
    RecipeSummary(
        id="r-part-a",
        name="Part A",
        ingredients=[RecipeIngredient(item_id=_RAW, amount=2)],
        products=[RecipeIngredient(item_id=_PART_A, amount=1)],
        produced_in=["machine-constructor"],
        time=60,
    ),
    # No produced_in → machine_id "" → grouped under "unknown" in the summary.
    RecipeSummary(
        id="r-part-b",
        name="Part B",
        ingredients=[RecipeIngredient(item_id=_RAW, amount=3)],
        products=[RecipeIngredient(item_id=_PART_B, amount=1)],
        produced_in=[],
        time=60,
    ),
]


class TestEdgeCases:
    def test_shared_raw_input_is_summed_in_flatten(self):
        root = calculate_production(_WIDGET, 1, _EDGE_RECIPES, _EDGE_ITEMS)
        flat = {r.item_id: r for r in flatten_requirements(root)}
        # Part A needs 2 raw, Part B needs 3 raw → 5 raw total, single entry.
        assert flat[_RAW].quantity == pytest.approx(5)
        assert flat[_RAW].is_raw is True

    def test_recipe_without_machine_groups_as_unknown(self):
        root = calculate_production(_WIDGET, 1, _EDGE_RECIPES, _EDGE_ITEMS)
        summary = {m.machine_id: m for m in summarize_machines(root)}
        assert "unknown" in summary  # Part B recipe has no produced_in

    def test_recipe_cycle_terminates_as_leaf(self):
        items = [ItemSummary(id="a", name="A"), ItemSummary(id="b", name="B")]
        recipes = [
            RecipeSummary(
                id="ra", name="A", ingredients=[RecipeIngredient(item_id="b", amount=1)],
                products=[RecipeIngredient(item_id="a", amount=1)], produced_in=["m"], time=60,
            ),
            RecipeSummary(
                id="rb", name="B", ingredients=[RecipeIngredient(item_id="a", amount=1)],
                products=[RecipeIngredient(item_id="b", amount=1)], produced_in=["m"], time=60,
            ),
        ]
        # Must not recurse forever: the second time "a" is seen it becomes a leaf.
        root = calculate_production("a", 1, recipes, items)
        (b_node,) = root.children
        (a_leaf,) = b_node.children
        assert a_leaf.item_id == "a"
        assert a_leaf.children == []  # cycle cut here
