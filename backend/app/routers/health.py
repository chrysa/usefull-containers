from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings


class HealthResponse(BaseModel):
    status: str
    version: str
    #: True when the backend runs on fixture data (no real DB/credentials).
    #: The frontend polls this to show the persistent "DEMO" banner.
    demo_mode: bool


router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse, status_code=200)
async def health_check() -> HealthResponse:
    from app.constants import APP_VERSION

    return HealthResponse(status="ok", version=APP_VERSION, demo_mode=settings.demo_mode)
