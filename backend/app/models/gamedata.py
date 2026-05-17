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


class RecipeSummary(BaseModel):
    id: str
    name: str
    ingredients: list[RecipeIngredient]
    products: list[RecipeIngredient]
    produced_in: list[str] = []


class GameDataStats(BaseModel):
    item_count: int
    recipe_count: int
    source_file: str | None
    imported_at: str | None


class GameDataImportResult(BaseModel):
    item_count: int
    recipe_count: int
    source_file: str
