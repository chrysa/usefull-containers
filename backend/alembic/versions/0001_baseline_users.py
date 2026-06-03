"""baseline: users table

Revision ID: 0001
Revises:
Create Date: 2026-05-31 00:00:00.000000

This is the V1 baseline. It captures the `users` table created by
`create_all()` at lifespan in earlier revisions. Future schema changes
MUST be added as new revisions — never edit this file.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("hashed_password", sa.Text(), nullable=True),
        sa.Column("steam_id", sa.String(length=20), nullable=True),
        sa.Column("steam_username", sa.String(length=128), nullable=True),
        sa.Column("steam_avatar_url", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_steam_id", "users", ["steam_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_steam_id", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
