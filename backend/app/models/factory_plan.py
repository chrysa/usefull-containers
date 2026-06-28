"""Models for the NL factory-plan generator (L10b).

The generator pipeline is: prompt → ``extract_targets`` (LLM, fuzzy NL → grounded
targets) → deterministic calculation → assembly into a plan. The LLM only ever
produces :class:`TargetExtraction`; every number downstream comes from the
deterministic calculator (``app.domain.production``), never the model.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.models.plan import TargetItem


class TargetExtraction(BaseModel):
    """Outcome of mapping a natural-language prompt to production targets.

    Exactly one of ``targets`` / ``clarification`` is meaningful: a non-empty
    ``targets`` means the prompt was understood; otherwise ``clarification``
    carries a question to put back to the player.
    """

    #: Grounded targets — every ``item_id`` is guaranteed to exist in the catalog.
    targets: list[TargetItem] = []
    #: Set when the prompt was too vague / no catalog item matched.
    clarification: str | None = None
    #: True when the LLM produced this result, False for the offline regex path.
    used_llm: bool = False


class ResourceRate(BaseModel):
    """A flow of one item, in items/min (or m³/min for fluids)."""

    item_id: str
    item_name: str
    per_minute: float
    is_raw: bool = False
    is_fluid: bool = False


class ProductionStep(BaseModel):
    """One recipe run at scale: how many machines, what goes in and out."""

    item_id: str
    recipe_id: str
    recipe_name: str
    machine_id: str
    #: Whole machines at 100% clock; 0 when the recipe time is unknown.
    machine_count: int
    #: Clock % each machine runs at to hit the rate exactly (0 when unknown).
    clock_percent: float
    inputs: list[ResourceRate] = []
    outputs: list[ResourceRate] = []


class GeneratedFactoryPlan(BaseModel):
    """A deterministic factory plan assembled from one or more targets."""

    name: str
    description: str = ""
    target_items: list[TargetItem] = []
    steps: list[ProductionStep] = []
    raw_inputs: list[ResourceRate] = []
    #: item_ids ordered so every step comes after the steps it consumes.
    build_order: list[str] = []
    assumptions: list[str] = []
    warnings: list[str] = []


class GeneratePlanRequest(BaseModel):
    prompt: str


class GeneratePlanResponse(BaseModel):
    #: The assembled plan, or null when the prompt needs clarification.
    plan: GeneratedFactoryPlan | None = None
    #: A question to put back to the player when the prompt was too vague.
    clarification: str | None = None
    #: Human-facing summary line shown in the assistant.
    reply: str
