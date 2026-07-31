from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Maximum number of buildings and power grids accepted from a single save file.
# Satisfactory worlds top out well below these limits in practice; values above
# them indicate malformed or adversarial payloads.
_MAX_BUILDINGS = 5_000
_MAX_POWER_GRIDS = 500


class SnapshotBuilding(BaseModel):
    """One production building extracted from a .sav."""

    machine_id: Annotated[str, Field(max_length=256)]  # e.g. "Build_ConstructorMk1_C"
    recipe_id: Annotated[str, Field(max_length=256)] | None = None  # e.g. "Recipe_IronPlate_C"
    overclock: int = Field(default=100, ge=0, le=250)  # clock percent (0–250)
    state: Annotated[str, Field(max_length=256)] = "active"  # active|paused|idle|off
    somersloops: int = Field(default=0, ge=0, le=4)
    floor_id: Annotated[str, Field(max_length=256)] | None = None


class SnapshotPowerGrid(BaseModel):
    """One power circuit's balance, for an optional power header."""

    id: int
    production_mw: float = 0.0
    consumption_mw: float = 0.0
    fuse_tripped: bool = False


class CompactSnapshot(BaseModel):
    """Reduced, browser-produced representation of a parsed save."""

    save_name: Annotated[str, Field(max_length=256)]
    play_time: float = 0.0
    buildings: list[SnapshotBuilding] = Field(default_factory=list)
    power_grids: list[SnapshotPowerGrid] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_list_lengths(self) -> CompactSnapshot:
        if len(self.buildings) > _MAX_BUILDINGS:
            raise ValueError(f"buildings list exceeds maximum allowed length ({_MAX_BUILDINGS})")
        if len(self.power_grids) > _MAX_POWER_GRIDS:
            raise ValueError(
                f"power_grids list exceeds maximum allowed length ({_MAX_POWER_GRIDS})"
            )
        return self


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
