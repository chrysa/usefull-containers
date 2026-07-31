"""Tests for the NL → structured targets extraction (L10b phase 2).

The LLM only maps fuzzy natural language to a grounded list of ``{item_id,
quantity}`` targets; it never invents item ids or numbers. These tests pin that
contract: catalog grounding, JSON parsing (incl. code fences), a single retry on
malformed output, the offline regex fallback, and the clarification path. The
``ai_client.complete`` gateway is always stubbed — no network, no real LLM.
"""

from __future__ import annotations

import pytest

from app.fixtures import demo_items, demo_recipes
from app.models.factory_plan import TargetExtraction
from app.models.gamedata import ItemSummary, RecipeSummary
from app.services import plan_generator

IRON_PLATE = "Desc_IronPlate_C"
IRON_ROD = "Desc_IronRod_C"
IRON_INGOT = "Desc_IronIngot_C"
IRON_ORE = "Desc_OreIron_C"
CONSTRUCTOR = "Desc_ConstructorMk1_C"
SMELTER = "Desc_SmelterMk1_C"


class _CompleteStub:
    """Async stand-in for ai_client.complete yielding queued replies in order."""

    def __init__(self, returns: tuple[str | None, ...]) -> None:
        self._returns = list(returns)
        self.calls = 0

    async def __call__(self, _prompt: str) -> str | None:
        self.calls += 1
        return self._returns.pop(0) if self._returns else None


def _stub_complete(monkeypatch: pytest.MonkeyPatch, *returns: str | None) -> _CompleteStub:
    stub = _CompleteStub(returns)
    monkeypatch.setattr("app.services.plan_generator.ai_client.complete", stub)
    return stub


@pytest.fixture
def items() -> list[ItemSummary]:
    return demo_items()


@pytest.fixture
def recipes() -> list[RecipeSummary]:
    return demo_recipes()


class TestLlmExtraction:
    async def test_valid_json_is_parsed_and_grounded(
        self, items: list[ItemSummary], monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _stub_complete(
            monkeypatch,
            '{"targets": [{"item_id": "Desc_IronPlate_C", "quantity": 120}],'
            ' "clarification": null}',
        )
        result = await plan_generator.extract_targets("I need 120 iron plates a minute", items)

        assert isinstance(result, TargetExtraction)
        assert result.used_llm is True
        assert result.clarification is None
        assert [(t.item_id, t.quantity) for t in result.targets] == [(IRON_PLATE, 120)]

    async def test_code_fenced_json_is_parsed(
        self, items: list[ItemSummary], monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _stub_complete(
            monkeypatch,
            '```json\n{"targets": [{"item_id": "Desc_IronRod_C", "quantity": 60}]}\n```',
        )
        result = await plan_generator.extract_targets("60 rods/min", items)
        assert [(t.item_id, t.quantity) for t in result.targets] == [(IRON_ROD, 60)]

    async def test_unknown_item_ids_are_dropped(
        self, items: list[ItemSummary], monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _stub_complete(
            monkeypatch,
            '{"targets": [{"item_id": "Desc_Nonexistent_C", "quantity": 5},'
            ' {"item_id": "Desc_IronPlate_C", "quantity": 30}]}',
        )
        result = await plan_generator.extract_targets("...", items)
        assert [t.item_id for t in result.targets] == [IRON_PLATE]

    async def test_clarification_is_returned(
        self, items: list[ItemSummary], monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _stub_complete(
            monkeypatch,
            '{"targets": [], "clarification": "Which item do you want to produce?"}',
        )
        result = await plan_generator.extract_targets("make me something cool", items)
        assert result.targets == []
        assert result.clarification == "Which item do you want to produce?"

    async def test_malformed_output_triggers_one_retry(
        self, items: list[ItemSummary], monkeypatch: pytest.MonkeyPatch
    ) -> None:
        stub = _stub_complete(
            monkeypatch,
            "sure! here you go (no json at all)",  # first call: unparseable
            '{"targets": [{"item_id": "Desc_IronPlate_C", "quantity": 90}]}',  # retry: good
        )
        result = await plan_generator.extract_targets("90 plates per minute", items)
        assert stub.calls == 2
        assert [(t.item_id, t.quantity) for t in result.targets] == [(IRON_PLATE, 90)]


class TestOfflineFallback:
    async def test_regex_fallback_when_llm_disabled(
        self, items: list[ItemSummary], monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _stub_complete(monkeypatch)  # complete() returns None → offline path
        result = await plan_generator.extract_targets(
            "I want 120 iron plate per minute and 60 iron rods/min", items
        )
        assert result.used_llm is False
        got = {t.item_id: t.quantity for t in result.targets}
        assert got == {IRON_PLATE: 120, IRON_ROD: 60}

    async def test_offline_no_match_asks_for_clarification(
        self, items: list[ItemSummary], monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _stub_complete(monkeypatch)
        result = await plan_generator.extract_targets("hello there", items)
        assert result.targets == []
        assert result.clarification is not None


class TestGuards:
    async def test_empty_catalog_asks_to_import_data(self, monkeypatch: pytest.MonkeyPatch) -> None:
        _stub_complete(monkeypatch)
        result = await plan_generator.extract_targets("120 iron plates/min", [])
        assert result.targets == []
        assert result.clarification is not None


class TestGeneratePlan:
    async def test_single_target_assembles_steps_and_raw(
        self,
        items: list[ItemSummary],
        recipes: list[RecipeSummary],
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        _stub_complete(monkeypatch)  # offline path
        resp = await plan_generator.generate_plan("120 iron plate per minute", items, recipes)

        assert resp.clarification is None
        assert resp.plan is not None
        plan = resp.plan
        assert [(t.item_id, t.quantity) for t in plan.target_items] == [(IRON_PLATE, 120)]

        steps = {s.item_id: s for s in plan.steps}
        assert steps[IRON_PLATE].machine_id == CONSTRUCTOR
        assert steps[IRON_PLATE].machine_count == 6
        plate_inputs = {r.item_id: r.per_minute for r in steps[IRON_PLATE].inputs}
        assert plate_inputs[IRON_INGOT] == pytest.approx(180)

        assert steps[IRON_INGOT].machine_id == SMELTER
        assert steps[IRON_INGOT].machine_count == 6

        raw = {r.item_id: r for r in plan.raw_inputs}
        assert raw[IRON_ORE].per_minute == pytest.approx(180)
        assert raw[IRON_ORE].is_raw is True

        # Ingots must be produced before the plates that consume them.
        assert plan.build_order.index(IRON_INGOT) < plan.build_order.index(IRON_PLATE)
        assert plan.assumptions  # non-empty
        assert resp.reply

    async def test_shared_intermediate_is_merged_once(
        self,
        items: list[ItemSummary],
        recipes: list[RecipeSummary],
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        # Both targets consume iron ingots → a single, summed ingot step.
        _stub_complete(monkeypatch)
        resp = await plan_generator.generate_plan(
            "20 iron plate per minute and 30 iron rods/min", items, recipes
        )
        assert resp.plan is not None
        ingot_steps = [s for s in resp.plan.steps if s.item_id == IRON_INGOT]
        assert len(ingot_steps) == 1
        # 20 plates → 30 ingots ; 30 rods → 30 ingots ; total 60 → 2 smelters.
        (ingot,) = ingot_steps
        assert ingot.machine_count == 2
        raw = {r.item_id: r.per_minute for r in resp.plan.raw_inputs}
        assert raw[IRON_ORE] == pytest.approx(60)

    async def test_vague_prompt_returns_clarification_not_plan(
        self,
        items: list[ItemSummary],
        recipes: list[RecipeSummary],
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        _stub_complete(monkeypatch)
        resp = await plan_generator.generate_plan("build something", items, recipes)
        assert resp.plan is None
        assert resp.clarification is not None
        assert resp.reply
