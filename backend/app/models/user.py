from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

# ─── Request schemas ─────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_\-]+$")
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


# ─── Response schemas ────────────────────────────────────────────────────────

class UserRead(BaseModel):
    id: int
    username: str
    steam_id: str | None
    steam_username: str | None
    steam_avatar_url: str | None
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None

    model_config = {"from_attributes": True}


# ─── Token schemas ───────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenData(BaseModel):
    sub: str  # user id as string
    username: str
