from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str


router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse, status_code=200)
async def health_check() -> HealthResponse:
    from app.constants import APP_VERSION

    return HealthResponse(status="ok", version=APP_VERSION)
