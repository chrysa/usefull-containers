"""L9: factory snapshot CRUD (self-scoped) + audit emission."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, username: str) -> dict[str, str]:
    resp = client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": "pw-12345678"},  # pragma: allowlist secret
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


# ── Input-validation / DoS-guard tests ──────────────────────────────────────


def test_snapshot_rejects_overclock_out_of_range(client: TestClient) -> None:
    """overclock must be in [0, 250]; values outside are rejected with 422."""
    headers = _register(client, "snapval1")
    payload = _snapshot_payload()
    payload["data"]["buildings"][0]["overclock"] = 300
    resp = client.post("/api/v1/snapshots", json=payload, headers=headers)
    assert resp.status_code == 422


def test_snapshot_rejects_negative_overclock(client: TestClient) -> None:
    headers = _register(client, "snapval2")
    payload = _snapshot_payload()
    payload["data"]["buildings"][0]["overclock"] = -1
    resp = client.post("/api/v1/snapshots", json=payload, headers=headers)
    assert resp.status_code == 422


def test_snapshot_rejects_somersloops_out_of_range(client: TestClient) -> None:
    """somersloops must be in [0, 4]."""
    headers = _register(client, "snapval3")
    payload = _snapshot_payload()
    payload["data"]["buildings"][0]["somersloops"] = 5
    resp = client.post("/api/v1/snapshots", json=payload, headers=headers)
    assert resp.status_code == 422


def test_snapshot_rejects_machine_id_too_long(client: TestClient) -> None:
    """machine_id must not exceed 256 characters."""
    headers = _register(client, "snapval4")
    payload = _snapshot_payload()
    payload["data"]["buildings"][0]["machine_id"] = "X" * 257
    resp = client.post("/api/v1/snapshots", json=payload, headers=headers)
    assert resp.status_code == 422


def test_snapshot_rejects_save_name_too_long(client: TestClient) -> None:
    """save_name must not exceed 256 characters."""
    headers = _register(client, "snapval5")
    payload = _snapshot_payload()
    payload["data"]["save_name"] = "S" * 257
    resp = client.post("/api/v1/snapshots", json=payload, headers=headers)
    assert resp.status_code == 422


def test_snapshot_rejects_too_many_buildings(client: TestClient) -> None:
    """buildings list must not exceed 5000 entries."""
    headers = _register(client, "snapval6")
    building = {
        "machine_id": "Build_ConstructorMk1_C",
        "recipe_id": "Recipe_IronPlate_C",
        "overclock": 100,
        "state": "active",
        "somersloops": 0,
        "floor_id": None,
    }
    payload = _snapshot_payload()
    payload["data"]["buildings"] = [building] * 5001
    resp = client.post("/api/v1/snapshots", json=payload, headers=headers)
    assert resp.status_code == 422


def test_snapshot_accepts_boundary_values(client: TestClient) -> None:
    """Boundary values (overclock=0/250, somersloops=4, 5000 buildings) are accepted."""
    headers = _register(client, "snapval7")
    building = {
        "machine_id": "Build_ConstructorMk1_C",
        "recipe_id": None,
        "overclock": 250,
        "state": "active",
        "somersloops": 4,
        "floor_id": None,
    }
    payload = {
        "name": "Boundary test",
        "data": {
            "save_name": "BoundaryWorld",
            "play_time": 0.0,
            "buildings": [building] * 5000,
            "power_grids": [],
        },
    }
    resp = client.post("/api/v1/snapshots", json=payload, headers=headers)
    assert resp.status_code == 201
