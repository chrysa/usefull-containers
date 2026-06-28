"""Deterministic production calculator — backend port of the frontend logic.

Faithful port of ``frontend/src/domain/gamedata/calculator.ts`` and
``logistics.ts`` (Satisfactory 1.0). Pure and side-effect free: every number is
derived from the recipe/item data passed in, so it can be reused server-side by
the L10b NL plan generator without duplicating game knowledge or risking
LLM-invented figures. Parity with the frontend is locked by ``test_production``.
"""

from __future__ import annotations

import math

from pydantic import BaseModel

from app.models.gamedata import ItemSummary, RecipeSummary

#: Deepest the recipe tree is expanded before a node is forced to a leaf. Guards
#: against pathological data; mirrors the frontend constant.
MAX_DEPTH = 30
#: Float slop so a value that is exactly on a tier/clock boundary does not round
#: up because of binary representation error (mirrors the frontend ``1e-9``).
EPSILON = 1e-9

# ── Transport tier tables (items/min for belts, m³/min for pipes) ─────────────


class TransportTier(BaseModel):
    id: str
    capacity: float


#: Conveyor belts Mk.1 → Mk.6 (items/min).
BELT_TIERS: list[TransportTier] = [
    TransportTier(id="Mk.1", capacity=60),
    TransportTier(id="Mk.2", capacity=120),
    TransportTier(id="Mk.3", capacity=270),
    TransportTier(id="Mk.4", capacity=480),
    TransportTier(id="Mk.5", capacity=780),
    TransportTier(id="Mk.6", capacity=1200),
]

#: Pipelines Mk.1 → Mk.2 (m³/min).
PIPE_TIERS: list[TransportTier] = [
    TransportTier(id="Mk.1", capacity=300),
    TransportTier(id="Mk.2", capacity=600),
]


def tiers_for(is_fluid: bool) -> list[TransportTier]:
    return PIPE_TIERS if is_fluid else BELT_TIERS


# ── Machine sizing ────────────────────────────────────────────────────────────


class MachineRequirement(BaseModel):
    #: Machine class id from the recipe (e.g. "Desc_ConstructorMk1_C"), or "".
    machine_id: str
    #: Fractional machine count needed to hit the target rate (clock-accurate).
    exact: float
    #: Whole machines needed (each capped at 100% clock).
    count: int
    #: Clock % each of ``count`` machines runs at to hit the rate exactly (0–100).
    clock_percent: float


def single_machine_output(recipe: RecipeSummary, item_id: str) -> float | None:
    """One machine's per-minute output of ``item_id`` at 100% clock, or None."""
    if not math.isfinite(recipe.time) or recipe.time <= 0:
        return None
    product = next((p for p in recipe.products if p.item_id == item_id), None)
    if product is None or product.amount <= 0:
        return None
    return product.amount * (60 / recipe.time)


def machine_requirement(
    recipe: RecipeSummary, item_id: str, rate: float
) -> MachineRequirement | None:
    """Machines to produce ``rate`` items/min of ``item_id``, or None if unknown."""
    per_machine = single_machine_output(recipe, item_id)
    if per_machine is None or rate <= 0:
        return None
    exact = rate / per_machine
    count = math.ceil(exact - EPSILON)
    clock_percent = (exact / count) * 100 if count > 0 else 0.0
    machine_id = recipe.produced_in[0] if recipe.produced_in else ""
    return MachineRequirement(
        machine_id=machine_id, exact=exact, count=count, clock_percent=clock_percent
    )


# ── Belt / pipe sizing ────────────────────────────────────────────────────────


class TierCount(BaseModel):
    tier: str
    capacity: float
    #: Number of belts/pipes of this tier to carry the full rate.
    count: int


class TransportRequirement(BaseModel):
    is_fluid: bool
    #: Flow rate in items/min (solids) or m³/min (fluids).
    rate: float
    #: Smallest tier that carries the whole rate on a single line, or None.
    min_single_tier: str | None
    #: Count needed at every tier, for the detail view.
    per_tier: list[TierCount]


def lines_for_rate(rate: float, tier: TransportTier) -> int:
    """Lines of ``tier`` needed to carry ``rate``. Always ≥ 1 for a positive rate."""
    if rate <= 0:
        return 0
    return math.ceil(rate / tier.capacity - EPSILON)


def transport_requirement(rate: float, is_fluid: bool) -> TransportRequirement:
    tiers = tiers_for(is_fluid)
    per_tier = [
        TierCount(tier=t.id, capacity=t.capacity, count=lines_for_rate(rate, t))
        for t in tiers
    ]
    single = next((t for t in tiers if rate <= t.capacity), None)
    return TransportRequirement(
        is_fluid=is_fluid,
        rate=rate,
        min_single_tier=single.id if single else None,
        per_tier=per_tier,
    )


def count_for_tier(req: TransportRequirement, tier_id: str) -> int:
    """Belt/pipe count for a chosen tier id (0 if not found)."""
    return next((t.count for t in req.per_tier if t.tier == tier_id), 0)


# ── Production tree ───────────────────────────────────────────────────────────


class CalculationNode(BaseModel):
    item_id: str
    item_name: str
    quantity: float
    recipe_id: str | None
    recipe_name: str | None
    children: list[CalculationNode]
    #: Machines to produce ``quantity`` via this recipe; None when raw/unknown.
    machines: MachineRequirement | None
    #: Conveyor/pipe sizing for delivering ``quantity``.
    transport: TransportRequirement


class FlatRequirement(BaseModel):
    item_id: str
    item_name: str
    quantity: float
    #: True when no recipe exists → raw resource or hand-gathered item.
    is_raw: bool
    #: Liquid/gas → routed through pipes rather than conveyors.
    is_fluid: bool


def _leaf_node(item_id: str, quantity: float, items: dict[str, ItemSummary]) -> CalculationNode:
    item = items.get(item_id)
    return CalculationNode(
        item_id=item_id,
        item_name=item.name if item else item_id,
        quantity=quantity,
        recipe_id=None,
        recipe_name=None,
        children=[],
        machines=None,
        transport=transport_requirement(quantity, item.is_fluid if item else False),
    )


def _build_node(
    item_id: str,
    quantity: float,
    recipes: list[RecipeSummary],
    items: dict[str, ItemSummary],
    visited: frozenset[str],
    depth: int,
) -> CalculationNode:
    if depth > MAX_DEPTH or item_id in visited:
        return _leaf_node(item_id, quantity, items)

    recipe = next((r for r in recipes if any(p.item_id == item_id for p in r.products)), None)
    product = (
        next((p for p in recipe.products if p.item_id == item_id), None) if recipe else None
    )
    if recipe is None or product is None or product.amount <= 0:
        return _leaf_node(item_id, quantity, items)

    item = items.get(item_id)
    multiplier = quantity / product.amount
    next_visited = visited | {item_id}
    children = [
        _build_node(ing.item_id, ing.amount * multiplier, recipes, items, next_visited, depth + 1)
        for ing in recipe.ingredients
    ]
    return CalculationNode(
        item_id=item_id,
        item_name=item.name if item else item_id,
        quantity=quantity,
        recipe_id=recipe.id,
        recipe_name=recipe.name,
        children=children,
        machines=machine_requirement(recipe, item_id, quantity),
        transport=transport_requirement(quantity, item.is_fluid if item else False),
    )


def calculate_production(
    target_item_id: str,
    quantity: float,
    recipes: list[RecipeSummary],
    items: list[ItemSummary],
) -> CalculationNode:
    """Full production tree for ``quantity`` of ``target_item_id`` (leaves = raw)."""
    by_id = {i.id: i for i in items}
    return _build_node(target_item_id, quantity, recipes, by_id, frozenset(), 0)


def flatten_requirements(node: CalculationNode) -> list[FlatRequirement]:
    """Leaf-level requirements, items summed, sorted by quantity descending."""
    acc: dict[str, FlatRequirement] = {}

    def walk(n: CalculationNode) -> None:
        if not n.children:
            existing = acc.get(n.item_id)
            if existing:
                existing.quantity += n.quantity
            else:
                acc[n.item_id] = FlatRequirement(
                    item_id=n.item_id,
                    item_name=n.item_name,
                    quantity=n.quantity,
                    is_raw=n.recipe_id is None,
                    is_fluid=n.transport.is_fluid,
                )
        else:
            for child in n.children:
                walk(child)

    walk(node)
    return sorted(acc.values(), key=lambda r: r.quantity, reverse=True)


class MachineSummaryEntry(BaseModel):
    machine_id: str
    #: Whole machines summed across every recipe step using this machine.
    total_machines: int
    #: How many distinct recipe steps run on this machine type.
    steps: int


def summarize_machines(root: CalculationNode) -> list[MachineSummaryEntry]:
    """Machine counts across the whole tree, grouped by machine type."""
    acc: dict[str, MachineSummaryEntry] = {}

    def walk(n: CalculationNode) -> None:
        if n.machines and n.machines.count > 0:
            key = n.machines.machine_id or "unknown"
            entry = acc.get(key)
            if entry:
                entry.total_machines += n.machines.count
                entry.steps += 1
            else:
                acc[key] = MachineSummaryEntry(
                    machine_id=key, total_machines=n.machines.count, steps=1
                )
        for child in n.children:
            walk(child)

    walk(root)
    return sorted(acc.values(), key=lambda m: m.total_machines, reverse=True)
