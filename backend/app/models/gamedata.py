from __future__ import annotations

from pydantic import BaseModel


class RecipeIngredient(BaseModel):
    item_id: str
    amount: float


class ItemSummary(BaseModel):
    id: str
    name: str
    description: str = ""
    stack_size: int = 0
    #: True for liquids/gases (RF_LIQUID / RF_GAS). Drives pipe vs conveyor sizing.
    is_fluid: bool = False


class RecipeSummary(BaseModel):
    id: str
    name: str
    ingredients: list[RecipeIngredient]
    products: list[RecipeIngredient]
    produced_in: list[str] = []
    #: Craft duration in seconds at 100% clock. Needed to derive a single
    #: machine's per-minute output (amount * 60 / time) and thus machine counts.
    #: 0 means "unknown" (legacy data) — consumers must treat it as not computable.
    time: float = 0


class GameDataStats(BaseModel):
    item_count: int
    recipe_count: int
    source_file: str | None
    imported_at: str | None


class GameDataImportResult(BaseModel):
    item_count: int
    recipe_count: int
    source_file: str
