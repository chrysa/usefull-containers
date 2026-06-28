from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.services import ai_client, assistant_service

CHAT_URL = "/api/v1/assistant/chat"


def _write_gamedata(directory: Path) -> None:
    payload = {
        "source_file": "test.zip",
        "imported_at": "2026-06-24T00:00:00Z",
        "items": [
            {"id": "Desc_IronIngot_C", "name": "Iron Ingot"},
            {"id": "Desc_IronRod_C", "name": "Iron Rod"},
            {"id": "Desc_Rotor_C", "name": "Rotor"},
            {"id": "Desc_IronScrew_C", "name": "Screw"},
        ],
        "recipes": [
            {
                "id": "Recipe_Rotor_C",
                "name": "Rotor",
                "ingredients": [
                    {"item_id": "Desc_IronRod_C", "amount": 5},
                    {"item_id": "Desc_IronScrew_C", "amount": 25},
                ],
                "products": [{"item_id": "Desc_Rotor_C", "amount": 1}],
                "produced_in": ["Build_AssemblerMk1_C"],
                "time": 15,
            }
        ],
    }
    (directory / "gamedata.json").write_text(json.dumps(payload), encoding="utf-8")


# ---------------------------------------------------------------------------
# Rule-based fallback (LLM disabled by default — empty ai_aggregator_url)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("message", "needle"),
    [
        ("Bonjour", "assistant du Factory Manager"),
        ("montre mes blueprints", "blueprint"),
        ("mes plans de production", "plan"),
        ("comment fabriquer un rotor", "calculateur"),
        ("liste des items", "importez"),
        ("quelles recettes", "importez"),
        ("importer des données de jeu", "données de jeu"),
        ("aide", "aider"),
        ("xyzzy random gibberish", "compris"),
    ],
)
def test_rule_based_intents(client: TestClient, message: str, needle: str) -> None:
    resp = client.post(CHAT_URL, json={"message": message})
    assert resp.status_code == 200
    body = resp.json()
    assert needle.lower() in body["reply"].lower()
    assert isinstance(body["actions"], list)


# ---------------------------------------------------------------------------
# LLM path
# ---------------------------------------------------------------------------


def test_llm_reply_used_when_enabled(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "ai_aggregator_url", "http://gateway:8000")

    async def fake_complete(prompt: str) -> str:
        return "Build 4 Assemblers for a balanced rotor line."

    monkeypatch.setattr(ai_client, "complete", fake_complete)

    resp = client.post(CHAT_URL, json={"message": "how to optimise rotors?"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["reply"] == "Build 4 Assemblers for a balanced rotor line."
    assert len(body["actions"]) >= 1


def test_falls_back_to_rules_when_llm_returns_none(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "ai_aggregator_url", "http://gateway:8000")

    async def fake_complete(prompt: str) -> None:
        return None

    monkeypatch.setattr(ai_client, "complete", fake_complete)

    resp = client.post(CHAT_URL, json={"message": "Bonjour"})

    assert resp.status_code == 200
    assert "assistant du Factory Manager" in resp.json()["reply"]


# ---------------------------------------------------------------------------
# Grounded context building
# ---------------------------------------------------------------------------


def test_prompt_includes_relevant_recipe(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    _write_gamedata(tmp_path)
    monkeypatch.setattr(settings, "gamedata_dir", str(tmp_path))

    prompt = assistant_service._build_prompt("comment optimiser ma production de rotor ?")

    assert "1 items" not in prompt  # sanity: counts rendered
    assert "4 items, 1 recipes" in prompt
    assert "Rotor: [5x Iron Rod, 25x Screw] -> [1x Rotor] in 15s" in prompt


def test_context_without_gamedata(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "gamedata_dir", str(tmp_path / "missing"))
    prompt = assistant_service._build_prompt("rotor")
    assert "No game data imported yet." in prompt


def test_match_recipes_ignores_short_words(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    _write_gamedata(tmp_path)
    monkeypatch.setattr(settings, "gamedata_dir", str(tmp_path))
    # No word >= 4 chars that matches a recipe name → no recipe context.
    assert assistant_service._match_recipes("a an the") == []
