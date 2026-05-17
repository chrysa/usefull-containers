from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("BLUEPRINTS_DIR", str(tmp_path))
    # Re-import to pick up env override
    import importlib

    import app.config as cfg_module
    importlib.reload(cfg_module)
    from app.config import settings
    settings.blueprints_dir = str(tmp_path)

    from app.main import create_app
    application = create_app()
    return TestClient(application)


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
