"""A-07: audit log of user mutations (self-scoped)."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, username: str) -> dict[str, str]:
    resp = client.post(
        "/api/v1/auth/register", json={"username": username, "password": "pw-12345678"}
    )
    assert resp.status_code == 201
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_plan_mutations_are_audited(client: TestClient) -> None:
    headers = _register(client, "audituser1")

    created = client.post("/api/v1/plans", json={"name": "Audited"}, headers=headers)
    assert created.status_code == 201
    plan_id = created.json()["id"]
    client.patch(f"/api/v1/plans/{plan_id}", json={"name": "Audited 2"}, headers=headers)
    client.delete(f"/api/v1/plans/{plan_id}", headers=headers)

    resp = client.get("/api/v1/audit", headers=headers)
    assert resp.status_code == 200
    entries = resp.json()
    actions = {(e["action"], e["resource_type"]) for e in entries}
    assert ("create", "plan") in actions
    assert ("update", "plan") in actions
    assert ("delete", "plan") in actions
    assert any(e["resource_id"] == plan_id for e in entries)
    # Most-recent-first ordering: the delete is the latest event.
    assert entries[0]["action"] == "delete"


def test_audit_is_user_scoped(client: TestClient) -> None:
    headers_a = _register(client, "audituser_a")
    headers_b = _register(client, "audituser_b")

    client.post("/api/v1/plans", json={"name": "A's plan"}, headers=headers_a)

    # B sees nothing; A sees their own entry.
    assert client.get("/api/v1/audit", headers=headers_b).json() == []
    assert len(client.get("/api/v1/audit", headers=headers_a).json()) >= 1


def test_audit_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/audit").status_code == 401
