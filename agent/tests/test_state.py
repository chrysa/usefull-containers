from __future__ import annotations

import json
from pathlib import Path

from sfm_agent.state import AgentState, BlueprintEntry


def test_load_empty_when_file_absent(tmp_path: Path) -> None:
    state = AgentState(tmp_path / "state.json")
    assert state.known_names() == frozenset()


def test_set_and_get(tmp_path: Path) -> None:
    state = AgentState(tmp_path / "state.json")
    entry = BlueprintEntry(name="foo", local_mtime=1234.5)
    state.set(entry)
    assert state.get("foo") == entry


def test_get_returns_none_for_unknown(tmp_path: Path) -> None:
    state = AgentState(tmp_path / "state.json")
    assert state.get("nope") is None


def test_save_and_reload(tmp_path: Path) -> None:
    p = tmp_path / "state.json"
    state = AgentState(p)
    state.set(BlueprintEntry(name="bar", local_mtime=999.0))
    state.save()

    state2 = AgentState(p)
    entry = state2.get("bar")
    assert entry is not None
    assert entry.name == "bar"
    assert entry.local_mtime == 999.0


def test_remove_deletes_entry(tmp_path: Path) -> None:
    state = AgentState(tmp_path / "state.json")
    state.set(BlueprintEntry(name="baz"))
    state.remove("baz")
    assert state.get("baz") is None


def test_remove_nonexistent_is_noop(tmp_path: Path) -> None:
    state = AgentState(tmp_path / "state.json")
    state.remove("ghost")  # should not raise


def test_known_names_returns_all(tmp_path: Path) -> None:
    state = AgentState(tmp_path / "state.json")
    state.set(BlueprintEntry(name="a"))
    state.set(BlueprintEntry(name="b"))
    assert state.known_names() == frozenset({"a", "b"})


def test_corrupted_state_file_starts_fresh(tmp_path: Path) -> None:
    p = tmp_path / "state.json"
    p.write_text("not valid json", encoding="utf-8")
    state = AgentState(p)
    assert state.known_names() == frozenset()


def test_save_creates_valid_json(tmp_path: Path) -> None:
    p = tmp_path / "state.json"
    state = AgentState(p)
    state.set(BlueprintEntry(name="x", local_mtime=1.0, remote_modified_at="2024-01-01"))
    state.save()

    raw = json.loads(p.read_text(encoding="utf-8"))
    assert raw["version"] == 1
    assert len(raw["entries"]) == 1
    assert raw["entries"][0]["name"] == "x"
