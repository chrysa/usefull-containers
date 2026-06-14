from __future__ import annotations

from fastapi import status
from fastapi.testclient import TestClient

# ─── Helpers ──────────────────────────────────────────────────────────────────


def _register(client: TestClient, username: str, password: str) -> dict:
    resp = client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": password},
    )
    return resp


def _login(client: TestClient, username: str, password: str) -> dict:
    return client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )


# ─── Register ─────────────────────────────────────────────────────────────────


def test_register_success(client: TestClient) -> None:
    resp = _register(client, "alice", "password123")
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "alice"


def test_register_duplicate_username(client: TestClient) -> None:
    _register(client, "bob", "password123")
    resp = _register(client, "bob", "differentpassword")
    assert resp.status_code == status.HTTP_409_CONFLICT


def test_register_short_password(client: TestClient) -> None:
    resp = _register(client, "carol", "short")
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_register_invalid_username_chars(client: TestClient) -> None:
    resp = _register(client, "user name!", "password123")
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ─── Login ────────────────────────────────────────────────────────────────────


def test_login_success(client: TestClient) -> None:
    _register(client, "dave", "mypassword")
    resp = _login(client, "dave", "mypassword")
    assert resp.status_code == status.HTTP_200_OK
    assert "access_token" in resp.json()


def test_login_wrong_password(client: TestClient) -> None:
    _register(client, "eve", "correctpass")
    resp = _login(client, "eve", "wrongpass")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_unknown_user(client: TestClient) -> None:
    resp = _login(client, "ghost", "password123")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ─── /me ──────────────────────────────────────────────────────────────────────


def test_me_with_valid_token(client: TestClient) -> None:
    _register(client, "frank", "password123")
    token = _login(client, "frank", "password123").json()["access_token"]

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["username"] == "frank"


def test_me_without_token(client: TestClient) -> None:
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_me_with_invalid_token(client: TestClient) -> None:
    resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.token"})
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ─── Steam redirect ───────────────────────────────────────────────────────────


def test_steam_login_redirects(client: TestClient) -> None:
    resp = client.get("/api/v1/auth/steam", follow_redirects=False)
    assert resp.status_code == status.HTTP_302_FOUND
    assert "steamcommunity.com" in resp.headers["location"]


# ─── Epic stub ────────────────────────────────────────────────────────────────


def test_epic_returns_501(client: TestClient) -> None:
    resp = client.get("/api/v1/auth/epic")
    assert resp.status_code == status.HTTP_501_NOT_IMPLEMENTED
