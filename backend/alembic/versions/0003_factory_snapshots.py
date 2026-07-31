"""factory snapshots table (L9)

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-22 00:00:00.000000

Persists reduced parses of player .sav files for planned-vs-actual diffs.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "factory_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("save_name", sa.String(length=255), nullable=False),
        sa.Column("play_time", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "imported_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_factory_snapshots_user_id", "factory_snapshots", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_factory_snapshots_user_id", table_name="factory_snapshots")
    op.drop_table("factory_snapshots")
