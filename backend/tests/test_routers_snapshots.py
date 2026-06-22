"""L9: factory snapshot CRUD (self-scoped) + audit emission."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, username: str) -> dict[str, str]:
    resp = client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": "pw-12345678"},
    )
    assert resp.status_code == 201
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _snapshot_payload() -> dict:
    return {
        "name": "Iron base",
        "data": {
            "save_name": "MyWorld_autosave_0",
            "play_time": 3600.5,
            "buildings": [
                {
                    "machine_id": "Build_ConstructorMk1_C",
                    "recipe_id": "Recipe_IronPlate_C",
                    "overclock": 100,
                    "state": "active",
                    "somersloops": 0,
                    "floor_id": None,
                }
            ],
            "power_grids": [
                {
                    "id": 1,
                    "production_mw": 100.0,
                    "consumption_mw": 40.0,
                    "fuse_tripped": False,
                }
            ],
        },
    }


def test_create_and_get_snapshot(client: TestClient) -> None:
    headers = _register(client, "snapuser1")

    created = client.post("/api/v1/snapshots", json=_snapshot_payload(), headers=headers)
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Iron base"
    assert body["save_name"] == "MyWorld_autosave_0"
    assert body["play_time"] == 3600.5
    assert body["data"]["buildings"][0]["recipe_id"] == "Recipe_IronPlate_C"
    snap_id = body["id"]

    got = client.get(f"/api/v1/snapshots/{snap_id}", headers=headers)
    assert got.status_code == 200
    assert got.json()["id"] == snap_id


def test_list_snapshots(client: TestClient) -> None:
    headers = _register(client, "snapuser2")
    client.post("/api/v1/snapshots", json=_snapshot_payload(), headers=headers)
    resp = client.get("/api/v1/snapshots", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_delete_snapshot(client: TestClient) -> None:
    headers = _register(client, "snapuser3")
    snap_id = client.post(
        "/api/v1/snapshots", json=_snapshot_payload(), headers=headers
    ).json()["id"]
    assert client.delete(f"/api/v1/snapshots/{snap_id}", headers=headers).status_code == 204
    assert client.get(f"/api/v1/snapshots/{snap_id}", headers=headers).status_code == 404


def test_snapshots_are_user_scoped(client: TestClient) -> None:
    headers_a = _register(client, "snapuser_a")
    headers_b = _register(client, "snapuser_b")
    snap_id = client.post(
        "/api/v1/snapshots", json=_snapshot_payload(), headers=headers_a
    ).json()["id"]
    assert client.get(f"/api/v1/snapshots/{snap_id}", headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/snapshots/{snap_id}", headers=headers_b).status_code == 404
    assert client.get("/api/v1/snapshots", headers=headers_b).json() == []


def test_snapshots_require_auth(client: TestClient) -> None:
    assert client.get("/api/v1/snapshots").status_code == 401
    assert client.post("/api/v1/snapshots", json=_snapshot_payload()).status_code == 401


def test_snapshot_create_is_audited(client: TestClient) -> None:
    headers = _register(client, "snapuser_audit")
    snap_id = client.post(
        "/api/v1/snapshots", json=_snapshot_payload(), headers=headers
    ).json()["id"]
    client.delete(f"/api/v1/snapshots/{snap_id}", headers=headers)
    entries = client.get("/api/v1/audit", headers=headers).json()
    actions = {(e["action"], e["resource_type"]) for e in entries}
    assert ("create", "snapshot") in actions
    assert ("delete", "snapshot") in actions
