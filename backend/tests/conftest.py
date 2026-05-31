from __future__ import annotations

import importlib
import json
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    from app.config import settings  # noqa: PLC0415

    monkeypatch.setattr(settings, "blueprints_dir", str(tmp_path))
    monkeypatch.setattr(settings, "data_dir", str(tmp_path))
    monkeypatch.setattr(settings, "jwt_secret_key", "test-secret-key-that-is-long-enough-32ch!")
    # Use create_all() in tests instead of Alembic migrations (faster, no fs lookup).
    monkeypatch.setattr(settings, "test_mode", True)

    import app.db.session as session_module  # noqa: PLC0415

    importlib.reload(session_module)

    from app.main import create_app  # noqa: PLC0415

    application = create_app()
    with TestClient(application) as tc:
        yield tc


@pytest.fixture
def blueprints_dir(tmp_path: Path) -> Path:
    return tmp_path


def _write_blueprint(directory: Path, name: str, *, with_cfg: bool = True) -> None:
    (directory / f"{name}.sbp").write_bytes(b"SBP_FAKE_BINARY_DATA")
    if with_cfg:
        cfg = {
            "description": f"Test blueprint {name}",
            "iconID": 1,
            "color": {"R": 0.5, "G": 0.2, "B": 0.8, "A": 1.0},
        }
        (directory / f"{name}.sbpcfg").write_text(json.dumps(cfg), encoding="utf-8")
