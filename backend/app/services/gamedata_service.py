from __future__ import annotations

import io
import json
import zipfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.constants import GAMEDATA_JSON_FILENAME
from app.models.gamedata import GameDataStats, ItemSummary, RecipeIngredient, RecipeSummary


class GameDataError(Exception):
    """Base error for game-data operations."""


class GameDataNotFoundError(GameDataError):
    """Raised when no game data has been imported yet."""


class GameDataParseError(GameDataError):
    """Raised when the uploaded archive cannot be parsed."""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _find_json_in_zip(zf: zipfile.ZipFile) -> bytes:
    """Return the raw bytes of the first .json file found in the archive."""
    candidates = [n for n in zf.namelist() if n.endswith(".json") and not n.startswith("__MACOSX")]
    if not candidates:
        raise GameDataParseError("No .json file found in the archive")
    # Prefer data.json at root level
    preferred = next(
        (n for n in candidates if n.lower() in {"data.json", "en.json"}), candidates[0]
    )
    return zf.read(preferred)


def _normalize_items(raw: dict[str, Any] | list[Any]) -> list[ItemSummary]:
    """Convert items from Satisfactory Tools dict or plain list format."""
    entries: list[dict[str, Any]] = (
        [{"id": k, **v} for k, v in raw.items()] if isinstance(raw, dict) else list(raw)
    )
    result = []
    for entry in entries:
        item_id = entry.get("id") or entry.get("className", "")
        name = entry.get("name") or entry.get("displayName") or item_id
        result.append(
            ItemSummary(
                id=str(item_id),
                name=str(name),
                description=str(entry.get("description") or ""),
                stack_size=int(entry.get("stackSize") or entry.get("stack_size") or 0),
                is_fluid=_is_fluid(entry),
            )
        )
    return result


def _is_fluid(entry: dict[str, Any]) -> bool:
    """Detect liquids/gases across the Satisfactory Tools data variants."""
    if entry.get("liquid") is True or entry.get("is_fluid") is True:
        return True
    form = str(entry.get("form") or entry.get("stackType") or "").upper()
    return form in {"RF_LIQUID", "RF_GAS", "LIQUID", "GAS"}


def _parse_ingredient(raw: dict[str, Any]) -> RecipeIngredient:
    item_id = raw.get("item") or raw.get("item_id") or raw.get("className") or ""
    amount = float(raw.get("amount") or raw.get("quantity") or 0)
    return RecipeIngredient(item_id=str(item_id), amount=amount)


def _normalize_recipes(raw: dict[str, Any] | list[Any]) -> list[RecipeSummary]:
    """Convert recipes from Satisfactory Tools dict or plain list format."""
    entries: list[dict[str, Any]] = (
        [{"id": k, **v} for k, v in raw.items()] if isinstance(raw, dict) else list(raw)
    )
    result = []
    for entry in entries:
        recipe_id = entry.get("id") or entry.get("className", "")
        name = entry.get("name") or entry.get("displayName") or recipe_id
        ingredients = [_parse_ingredient(i) for i in (entry.get("ingredients") or [])]
        products = [_parse_ingredient(p) for p in (entry.get("products") or [])]
        produced_in_raw = entry.get("producedIn") or entry.get("produced_in") or []
        produced_in = [str(b) for b in produced_in_raw]
        # Satisfactory Tools uses "time"; some exports use manufacto(u)ringDuration.
        time = float(
            entry.get("time")
            or entry.get("manufactoringDuration")
            or entry.get("manufacturingDuration")
            or 0
        )
        result.append(
            RecipeSummary(
                id=str(recipe_id),
                name=str(name),
                ingredients=ingredients,
                products=products,
                produced_in=produced_in,
                time=time,
            )
        )
    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def import_gamedata_zip(
    gamedata_dir: str,
    zip_bytes: bytes,
    source_filename: str,
) -> tuple[list[ItemSummary], list[RecipeSummary]]:
    """
    Extract and normalise game data from a ZIP archive, then persist to disk.

    Returns (items, recipes) on success.
    Raises :class:`GameDataParseError` for malformed archives.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            raw_json = _find_json_in_zip(zf)
    except zipfile.BadZipFile as exc:
        raise GameDataParseError("File is not a valid ZIP archive") from exc

    try:
        data: dict[str, Any] = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise GameDataParseError(f"JSON parse error: {exc}") from exc

    items = _normalize_items(data.get("items") or [])
    recipes = _normalize_recipes(data.get("recipes") or [])

    directory = Path(gamedata_dir)
    directory.mkdir(parents=True, exist_ok=True)

    payload = {
        "imported_at": datetime.now(UTC).isoformat(),
        "source_file": source_filename,
        "items": [i.model_dump() for i in items],
        "recipes": [r.model_dump() for r in recipes],
    }
    (directory / GAMEDATA_JSON_FILENAME).write_text(
        json.dumps(payload, ensure_ascii=False), encoding="utf-8"
    )

    return items, recipes


def _load_raw(gamedata_dir: str) -> dict[str, Any]:
    path = Path(gamedata_dir) / GAMEDATA_JSON_FILENAME
    if not path.exists():
        raise GameDataNotFoundError("No game data imported yet")
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return data


def get_stats(gamedata_dir: str) -> GameDataStats:
    """Return item/recipe counts for the imported data set."""
    try:
        raw = _load_raw(gamedata_dir)
    except GameDataNotFoundError:
        return GameDataStats(item_count=0, recipe_count=0, source_file=None, imported_at=None)
    return GameDataStats(
        item_count=len(raw.get("items") or []),
        recipe_count=len(raw.get("recipes") or []),
        source_file=raw.get("source_file"),
        imported_at=raw.get("imported_at"),
    )


def list_items(gamedata_dir: str, query: str = "") -> list[ItemSummary]:
    """Return all items, optionally filtered by name/id prefix (case-insensitive)."""
    raw = _load_raw(gamedata_dir)
    items = [ItemSummary(**i) for i in (raw.get("items") or [])]
    if query:
        q = query.lower()
        items = [i for i in items if q in i.name.lower() or q in i.id.lower()]
    return items


def list_recipes(gamedata_dir: str, query: str = "") -> list[RecipeSummary]:
    """Return all recipes, optionally filtered by name (case-insensitive)."""
    raw = _load_raw(gamedata_dir)
    recipes = [RecipeSummary(**r) for r in (raw.get("recipes") or [])]
    if query:
        q = query.lower()
        recipes = [r for r in recipes if q in r.name.lower() or q in r.id.lower()]
    return recipes
