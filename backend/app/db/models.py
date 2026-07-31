from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Steam link
    steam_id: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    steam_username: Mapped[str | None] = mapped_column(String(128), nullable=True)
    steam_avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    """Append-only record of user mutations on plans & blueprints (A-07).

    Self-scoped: each user reads only their own entries (no admin/backoffice
    role exists yet — a cross-user view would need RBAC first).
    """

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), index=True, nullable=False
    )
    action: Mapped[str] = mapped_column(String(16), nullable=False)  # create|update|delete
    resource_type: Mapped[str] = mapped_column(String(32), nullable=False)  # plan|blueprint
    resource_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class FactorySnapshot(Base):
    """A reduced parse of a player's Satisfactory .sav (L9).

    Self-scoped like AuditLog: each user reads only their own snapshots. The
    heavy reduction happens client-side; the backend only persists the result.
    `save_name` and `play_time` are denormalized out of `data` for cheap listing.
    """

    __tablename__ = "factory_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    save_name: Mapped[str] = mapped_column(String(255), nullable=False)
    play_time: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    imported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
