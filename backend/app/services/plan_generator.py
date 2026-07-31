"""Natural-language → production targets extraction (L10b phase 2).

This is the *only* place the LLM is trusted, and only for the fuzzy boundary
"free text → which items, how many per minute". The model must pick item ids
exclusively from the imported game-data catalog; anything it invents is dropped.
When the gateway is unavailable (or returns garbage twice) a deterministic
offline regex pass scans the prompt for "<number> <item name> /min" phrases, so
the feature degrades instead of failing. If nothing is understood we return a
clarification question rather than guessing.
"""

from __future__ import annotations

import json
import logging
import math
import re
from dataclasses import dataclass

from app.domain import production
from app.domain.production import CalculationNode
from app.models.factory_plan import (
    GeneratedFactoryPlan,
    GeneratePlanResponse,
    ProductionStep,
    ResourceRate,
    TargetExtraction,
)
from app.models.gamedata import ItemSummary, RecipeSummary
from app.models.plan import TargetItem
from app.services import ai_client

logger = logging.getLogger(__name__)

_ASSUMPTIONS = [
    "Machine counts assume 100% clock; fractional needs are rounded up.",
    "Power (MW) is not modeled — only machines, ratios and raw inputs.",
    "All numbers are computed deterministically from the imported recipes.",
]

_NO_DATA_CLARIFICATION = (
    "No game data is imported yet. Import a Satisfactory data ZIP on the Game data "
    "page, then ask me again."
)
_NO_MATCH_CLARIFICATION = (
    "I couldn't tell which item to produce. Try naming a game item and a rate, "
    'e.g. "120 Iron Plate per minute".'
)

_MAX_CATALOG_IN_PROMPT = 200
_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)
_OBJECT_RE = re.compile(r"\{.*\}", re.DOTALL)


def _build_prompt(prompt: str, items: list[ItemSummary], *, strict: bool = False) -> str:
    catalog = "\n".join(f"- {i.id}: {i.name}" for i in items[:_MAX_CATALOG_IN_PROMPT])
    instruction = (
        "You map a Satisfactory player's request to production targets. "
        "Return ONLY a JSON object of the form "
        '{"targets": [{"item_id": "<id>", "quantity": <items per minute>}], '
        '"clarification": null}. '
        "Pick item_id values ONLY from the catalog below — never invent ids or names. "
        "quantity is items per minute (a positive number). "
        "If the request is too vague or names no catalog item, return an empty "
        '"targets" list and put a short question in "clarification".'
    )
    if strict:
        instruction += " Respond with the JSON object and nothing else — no prose, no code fences."
    return f"{instruction}\n\n## Catalog\n{catalog}\n\n## Request\n{prompt}\n\n## JSON\n"


def _grounded_targets(raw: object, catalog_ids: set[str]) -> list[TargetItem]:
    """Keep only well-formed entries whose item_id exists in the catalog."""
    if not isinstance(raw, list):
        return []
    out: list[TargetItem] = []
    seen: set[str] = set()
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        item_id = entry.get("item_id")
        quantity = entry.get("quantity")
        if not isinstance(item_id, str) or item_id not in catalog_ids or item_id in seen:
            continue
        try:
            qty = float(quantity)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            continue
        if qty > 0:
            out.append(TargetItem(item_id=item_id, quantity=qty))
            seen.add(item_id)
    return out


def _parse_llm(text: str, catalog_ids: set[str]) -> tuple[list[TargetItem], str | None] | None:
    """Parse a gateway reply into (targets, clarification), or None if unparseable."""
    body = text.strip()
    fenced = _FENCE_RE.search(body)
    if fenced:
        body = fenced.group(1).strip()
    try:
        data = json.loads(body)
    except ValueError:
        match = _OBJECT_RE.search(body)
        if not match:
            return None
        try:
            data = json.loads(match.group(0))
        except ValueError:
            return None
    if not isinstance(data, dict):
        return None
    targets = _grounded_targets(data.get("targets"), catalog_ids)
    raw_clar = data.get("clarification")
    clarification = raw_clar.strip() if isinstance(raw_clar, str) and raw_clar.strip() else None
    return targets, clarification


def _offline_extract(prompt: str, items: list[ItemSummary]) -> TargetExtraction:
    """Deterministic fallback: find "<number> <item name>" phrases in the prompt."""
    low = prompt.lower()
    targets: list[TargetItem] = []
    for item in items:
        name = re.escape(item.name.lower())
        # number, optional "x"/"units of", the item name, optional trailing plural "s".
        pattern = rf"(\d+(?:[.,]\d+)?)\s*(?:x\s*|units?\s+of\s+)?{name}s?\b"
        match = re.search(pattern, low)
        if not match:
            continue
        qty = float(match.group(1).replace(",", "."))
        if qty > 0:
            targets.append(TargetItem(item_id=item.id, quantity=qty))
    if targets:
        return TargetExtraction(targets=targets, used_llm=False)
    return TargetExtraction(clarification=_NO_MATCH_CLARIFICATION, used_llm=False)


async def extract_targets(prompt: str, items: list[ItemSummary]) -> TargetExtraction:
    """Map ``prompt`` to grounded production targets (LLM first, offline fallback)."""
    if not items:
        return TargetExtraction(clarification=_NO_DATA_CLARIFICATION)

    catalog_ids = {i.id for i in items}
    text = await ai_client.complete(_build_prompt(prompt, items))
    parsed = _parse_llm(text, catalog_ids) if text else None
    if parsed is None and text is not None:
        # A reply came back but wasn't valid JSON — give the model one stricter try.
        text = await ai_client.complete(_build_prompt(prompt, items, strict=True))
        parsed = _parse_llm(text, catalog_ids) if text else None

    if parsed is not None:
        targets, clarification = parsed
        if targets:
            return TargetExtraction(targets=targets, used_llm=True)
        if clarification:
            return TargetExtraction(clarification=clarification, used_llm=True)

    return _offline_extract(prompt, items)


# ── Assembly: production trees → a flat, deduplicated plan ─────────────────────


@dataclass
class _StepAcc:
    """Accumulates one recipe step across every tree that produces the item."""

    recipe_id: str
    recipe_name: str
    machine_id: str
    #: One machine's output at 100% clock, or None when the recipe time is unknown.
    per_machine_output: float | None
    #: Ingredient rate per unit of output, ``{ingredient_id: amount}``.
    inputs_per_unit: dict[str, float]
    total_qty: float = 0.0


def _aggregate(trees: list[CalculationNode]) -> tuple[dict[str, _StepAcc], dict[str, float]]:
    """Sum produced quantities (per item) and raw-leaf quantities across all trees."""
    produced: dict[str, _StepAcc] = {}
    raw: dict[str, float] = {}

    def walk(node: CalculationNode) -> None:
        if node.recipe_id is None:
            raw[node.item_id] = raw.get(node.item_id, 0.0) + node.quantity
            return
        acc = produced.get(node.item_id)
        if acc is None:
            exact = node.machines.exact if node.machines else 0
            per_machine = node.quantity / exact if node.machines and exact > 0 else None
            acc = _StepAcc(
                recipe_id=node.recipe_id,
                recipe_name=node.recipe_name or node.item_id,
                machine_id=node.machines.machine_id if node.machines else "",
                per_machine_output=per_machine,
                inputs_per_unit={
                    child.item_id: child.quantity / node.quantity for child in node.children
                }
                if node.quantity > 0
                else {},
            )
            produced[node.item_id] = acc
        acc.total_qty += node.quantity
        for child in node.children:
            walk(child)

    for tree in trees:
        walk(tree)
    return produced, raw


def _rate(item_id: str, qty: float, items: dict[str, ItemSummary], *, is_raw: bool) -> ResourceRate:
    item = items.get(item_id)
    return ResourceRate(
        item_id=item_id,
        item_name=item.name if item else item_id,
        per_minute=qty,
        is_raw=is_raw,
        is_fluid=item.is_fluid if item else False,
    )


def _build_step(
    item_id: str,
    acc: _StepAcc,
    items: dict[str, ItemSummary],
    produced_ids: set[str],
    warnings: list[str],
) -> ProductionStep:
    total = acc.total_qty
    if acc.per_machine_output and acc.per_machine_output > 0:
        exact = total / acc.per_machine_output
        count = math.ceil(exact - production.EPSILON)
        clock = (exact / count) * 100 if count > 0 else 0.0
    else:
        count, clock = 0, 0.0
        name = items[item_id].name if item_id in items else item_id
        warnings.append(f"Machine count unknown for {name} — recipe has no craft time.")
    inputs = [
        _rate(iid, per_unit * total, items, is_raw=iid not in produced_ids)
        for iid, per_unit in acc.inputs_per_unit.items()
    ]
    return ProductionStep(
        item_id=item_id,
        recipe_id=acc.recipe_id,
        recipe_name=acc.recipe_name,
        machine_id=acc.machine_id,
        machine_count=count,
        clock_percent=clock,
        inputs=inputs,
        outputs=[_rate(item_id, total, items, is_raw=False)],
    )


def _build_order(produced: dict[str, _StepAcc]) -> list[str]:
    """Post-order DFS so each item is listed after the items it consumes."""
    order: list[str] = []
    visited: set[str] = set()

    def visit(item_id: str) -> None:
        if item_id in visited or item_id not in produced:
            return
        visited.add(item_id)
        for ingredient in produced[item_id].inputs_per_unit:
            visit(ingredient)
        order.append(item_id)

    for item_id in produced:
        visit(item_id)
    return order


def _plan_name(targets: list[TargetItem], items: dict[str, ItemSummary]) -> str:
    parts = [
        f"{t.quantity:g} {items[t.item_id].name if t.item_id in items else t.item_id}/min"
        for t in targets
    ]
    return " + ".join(parts)


async def generate_plan(
    prompt: str, items: list[ItemSummary], recipes: list[RecipeSummary]
) -> GeneratePlanResponse:
    """Full NL pipeline: extract targets → deterministic calc → assembled plan."""
    extraction = await extract_targets(prompt, items)
    if not extraction.targets:
        clarification = extraction.clarification or _NO_MATCH_CLARIFICATION
        return GeneratePlanResponse(plan=None, clarification=clarification, reply=clarification)

    trees = [
        production.calculate_production(t.item_id, t.quantity, recipes, items)
        for t in extraction.targets
    ]
    items_by_id = {i.id: i for i in items}
    produced, raw = _aggregate(trees)

    warnings: list[str] = []
    order = _build_order(produced)
    produced_ids = set(produced)
    steps = [
        _build_step(item_id, produced[item_id], items_by_id, produced_ids, warnings)
        for item_id in order
    ]
    raw_inputs = sorted(
        (_rate(iid, qty, items_by_id, is_raw=True) for iid, qty in raw.items()),
        key=lambda r: r.per_minute,
        reverse=True,
    )

    plan = GeneratedFactoryPlan(
        name=_plan_name(extraction.targets, items_by_id),
        description=f"Generated from: {prompt}",
        target_items=extraction.targets,
        steps=steps,
        raw_inputs=raw_inputs,
        build_order=order,
        assumptions=list(_ASSUMPTIONS),
        warnings=warnings,
    )
    source = "" if extraction.used_llm else " (offline keyword match)"
    reply = (
        f"Plan for {plan.name}: {len(steps)} production step(s), "
        f"{len(raw_inputs)} raw input(s){source}."
    )
    return GeneratePlanResponse(plan=plan, clarification=None, reply=reply)
