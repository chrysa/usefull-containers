from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, UploadFile

from app.config import settings
from app.constants import MAX_GAMEDATA_ZIP_SIZE_BYTES
from app.fixtures import (
    demo_gamedata_stats,
    demo_items_filtered,
    demo_recipes_filtered,
)
from app.models.gamedata import GameDataImportResult, GameDataStats, ItemSummary, RecipeSummary
from app.services.gamedata_service import (
    GameDataNotFoundError,
    GameDataParseError,
    get_stats,
    import_gamedata_zip,
    list_items,
    list_recipes,
)

router = APIRouter(prefix="/gamedata", tags=["gamedata"])


@router.post("/import", response_model=GameDataImportResult, status_code=201)
async def import_gamedata(file: UploadFile) -> GameDataImportResult:
    """
    Upload a Satisfactory Tools data ZIP archive.

    The archive must contain a JSON file with ``items`` and/or ``recipes`` keys.
    Accepts the community data format from SatisfactoryTools (dict or list).
    """
    data = await file.read()
    if len(data) > MAX_GAMEDATA_ZIP_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")

    filename = file.filename or "gamedata.zip"
    try:
        items, recipes = import_gamedata_zip(settings.gamedata_dir, data, filename)
    except GameDataParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return GameDataImportResult(
        item_count=len(items),
        recipe_count=len(recipes),
        source_file=filename,
    )


@router.get("/stats", response_model=GameDataStats)
def gamedata_stats() -> GameDataStats:
    """Return item/recipe counts for the currently imported data set."""
    if settings.demo_mode:
        return demo_gamedata_stats()
    return get_stats(settings.gamedata_dir)


@router.get("/items", response_model=list[ItemSummary])
def gamedata_items(
    q: str = Query(default="", description="Filter by name or id (case-insensitive)"),
) -> list[ItemSummary]:
    """List all imported items, optionally filtered by a search query."""
    if settings.demo_mode:
        return demo_items_filtered(q)
    try:
        return list_items(settings.gamedata_dir, q)
    except GameDataNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/recipes", response_model=list[RecipeSummary])
def gamedata_recipes(
    q: str = Query(default="", description="Filter by name or id (case-insensitive)"),
) -> list[RecipeSummary]:
    """List all imported recipes, optionally filtered by a search query."""
    if settings.demo_mode:
        return demo_recipes_filtered(q)
    try:
        return list_recipes(settings.gamedata_dir, q)
    except GameDataNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
