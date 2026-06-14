"""A-08: rate limiting on the auth endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.dependencies.rate_limit import reset_rate_limit

_WRONG = {"username": "ghost", "password": "wrong-password-123"}


def test_login_is_rate_limited_after_max(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    reset_rate_limit()
    monkeypatch.setattr(settings, "auth_rate_limit_max", 2)
    monkeypatch.setattr(settings, "test_mode", False)  # enable the limiter

    # The first two attempts reach the endpoint (401 invalid creds).
    assert client.post("/api/v1/auth/login", json=_WRONG).status_code == 401
    assert client.post("/api/v1/auth/login", json=_WRONG).status_code == 401
    # The third exceeds the window → 429 with Retry-After.
    resp = client.post("/api/v1/auth/login", json=_WRONG)
    assert resp.status_code == 429
    assert resp.headers.get("Retry-After")


def test_register_is_rate_limited_after_max(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    reset_rate_limit()
    monkeypatch.setattr(settings, "auth_rate_limit_max", 1)
    monkeypatch.setattr(settings, "test_mode", False)

    first = client.post(
        "/api/v1/auth/register", json={"username": "rluser1", "password": "pw-12345678"}
    )
    assert first.status_code == 201
    # Same IP + route, second registration is throttled regardless of username.
    second = client.post(
        "/api/v1/auth/register", json={"username": "rluser2", "password": "pw-12345678"}
    )
    assert second.status_code == 429


def test_rate_limit_is_disabled_under_test_mode(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    reset_rate_limit()
    monkeypatch.setattr(settings, "auth_rate_limit_max", 1)
    # test_mode stays True (conftest default) → the limiter is a no-op.
    for _ in range(5):
        assert client.post("/api/v1/auth/login", json=_WRONG).status_code == 401
