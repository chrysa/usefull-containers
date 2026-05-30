from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.constants import API_PREFIX, APP_TITLE, APP_VERSION
from app.routers import assistant, auth, blueprints, gamedata, health, plans


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    from app.db.session import init_db  # noqa: PLC0415

    await init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=APP_TITLE,
        version=APP_VERSION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix=API_PREFIX)
    app.include_router(blueprints.router, prefix=API_PREFIX)
    app.include_router(gamedata.router, prefix=API_PREFIX)
    app.include_router(plans.router, prefix=API_PREFIX)
    app.include_router(assistant.router, prefix=API_PREFIX)
    app.include_router(auth.router, prefix=API_PREFIX)

    return app


app = create_app()
