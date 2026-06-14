"""A-04: plans and blueprints routers require authentication.

Unlike the router-behaviour tests (test_routers_plans / test_routers_blueprints),
which bypass the auth dependency, these use the full ``client`` fixture (real DB +
JWT) to verify the gate itself: anonymous requests are rejected and a valid bearer
token grants access.
"""

from __future__ import annotations

from fastapi import status
from fastapi.testclient import TestClient

PROTECTED_GETS = ["/api/v1/plans", "/api/v1/blueprints"]


def _register_token(client: TestClient, username: str = "gateuser") -> str:
    resp = client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": "password123"},
    )
    assert resp.status_code == status.HTTP_201_CREATED
    return resp.json()["access_token"]


def test_plans_list_without_token_returns_401(client: TestClient) -> None:
    resp = client.get("/api/v1/plans")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_blueprints_list_without_token_returns_401(client: TestClient) -> None:
    resp = client.get("/api/v1/blueprints")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_plan_without_token_returns_401(client: TestClient) -> None:
    resp = client.post("/api/v1/plans", json={"name": "Anon Plan"})
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_invalid_token_returns_401(client: TestClient) -> None:
    resp = client.get(
        "/api/v1/plans", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_plans_list_with_valid_token_returns_200(client: TestClient) -> None:
    token = _register_token(client, "plansuser")
    resp = client.get("/api/v1/plans", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == []


def test_blueprints_list_with_valid_token_returns_200(client: TestClient) -> None:
    token = _register_token(client, "bpuser")
    resp = client.get(
        "/api/v1/blueprints", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["blueprints"] == []
