from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class BlueprintColor(BaseModel):
    r: float = Field(0.0, ge=0.0, le=1.0)
    g: float = Field(0.0, ge=0.0, le=1.0)
    b: float = Field(0.0, ge=0.0, le=1.0)
    a: float = Field(1.0, ge=0.0, le=1.0)


class BlueprintRead(BaseModel):
    name: str
    description: str = ""
    icon_id: int = 0
    color: BlueprintColor | None = None
    has_sbp: bool
    has_cfg: bool
    size_bytes: int = 0
    modified_at: datetime | None = None
    cfg_raw: dict[str, Any] | None = None  # raw .sbpcfg content
    tags: list[str] = Field(default_factory=list)


class BlueprintTagsUpdate(BaseModel):
    tags: list[str] = Field(default_factory=list)


class BlueprintDescriptionUpdate(BaseModel):
    description: str


class BlueprintList(BaseModel):
    blueprints: list[BlueprintRead]
    total: int


class BlueprintUploadResult(BaseModel):
    name: str
    created: bool  # True = new, False = overwritten


class BatchUploadResult(BaseModel):
    created: list[str]
    updated: list[str]
    failed: list[str]
    total: int


class SyncResult(BaseModel):
    scanned: int
    added: int
    removed: int
    unchanged: int


class BlueprintSyncEntry(BaseModel):
    """One local blueprint as reported by the sfm-agent (SFM-7a)."""

    name: str
    modified_at: datetime
    size_bytes: int = Field(0, ge=0)


class BlueprintSyncRequest(BaseModel):
    """The agent's full local blueprint inventory for a sync reconciliation."""

    blueprints: list[BlueprintSyncEntry] = Field(default_factory=list)


class BlueprintSyncResponse(BaseModel):
    """Reconciliation result: names the agent must push, and names the server
    deleted because they are gone locally (game-authoritative)."""

    to_upload: list[str] = Field(default_factory=list)
    to_delete: list[str] = Field(default_factory=list)
