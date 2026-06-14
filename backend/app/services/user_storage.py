from __future__ import annotations

from pathlib import Path

from app.config import settings
from app.constants import USERS_SUBDIR


def user_data_dir(user_id: int) -> str:
    """Return the per-user data directory ({data_dir}/users/{user_id}).

    Plans are stored as ``plans.json`` inside this directory. The path
    partitioning is what isolates one user's plans from another's (A-04b).
    """
    return str(Path(settings.data_dir) / USERS_SUBDIR / str(user_id))


def user_blueprints_dir(user_id: int) -> str:
    """Return the per-user blueprints directory ({blueprints_dir}/{user_id}).

    Each user's ``.sbp`` / ``.sbpcfg`` / ``.meta.json`` files live under this
    directory, isolating them from other users (A-04b).
    """
    return str(Path(settings.blueprints_dir) / str(user_id))
