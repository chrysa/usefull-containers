from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SnapshotBuilding(BaseModel):
    """One production building extracted from a .sav."""

    machine_id: str  # building class, e.g. "Build_ConstructorMk1_C"
    recipe_id: str | None = None  # recipe class, e.g. "Recipe_IronPlate_C"
    overclock: int = 100  # clock percent (50, 100, 250, ...)
    state: str = "active"  # active|paused|idle|off
    somersloops: int = 0
    floor_id: str | None = None


class SnapshotPowerGrid(BaseModel):
    """One power circuit's balance, for an optional power header."""

    id: int
    production_mw: float = 0.0
    consumption_mw: float = 0.0
    fuse_tripped: bool = False


class CompactSnapshot(BaseModel):
    """Reduced, browser-produced representation of a parsed save."""

    save_name: str
    play_time: float = 0.0
    buildings: list[SnapshotBuilding] = []
    power_grids: list[SnapshotPowerGrid] = []


class SnapshotCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    data: CompactSnapshot


class SnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    save_name: str
    play_time: float
    imported_at: datetime
    data: CompactSnapshot
