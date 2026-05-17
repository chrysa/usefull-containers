from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Final

log = logging.getLogger(__name__)

STATE_VERSION: Final = 1


@dataclass
class BlueprintEntry:
    name: str
    local_mtime: float | None = None
    remote_modified_at: str | None = None


class AgentState:
    """Persistent JSON state file tracking synced blueprints."""

    def __init__(self, path: Path) -> None:
        self._path = path
        self._entries: dict[str, BlueprintEntry] = {}
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            return
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            for raw in data.get("entries", []):
                entry = BlueprintEntry(**raw)
                self._entries[entry.name] = entry
        except (json.JSONDecodeError, TypeError, KeyError):
            log.warning("State file corrupted — starting fresh")
            self._entries = {}

    def save(self) -> None:
        self._path.write_text(
            json.dumps(
                {
                    "version": STATE_VERSION,
                    "entries": [asdict(e) for e in self._entries.values()],
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def get(self, name: str) -> BlueprintEntry | None:
        return self._entries.get(name)

    def set(self, entry: BlueprintEntry) -> None:
        self._entries[entry.name] = entry

    def remove(self, name: str) -> None:
        self._entries.pop(name, None)

    def known_names(self) -> frozenset[str]:
        return frozenset(self._entries.keys())
