from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

import httpx

from .config import AgentConfig
from .state import AgentState, BlueprintEntry

log = logging.getLogger(__name__)


@dataclass
class SyncResult:
    uploaded: list[str] = field(default_factory=list)
    downloaded: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


class BlueprintSyncer:
    """HTTP client + bidirectional sync logic against the SFM hub."""

    def __init__(self, config: AgentConfig, state: AgentState) -> None:
        self._cfg = config
        self._state = state
        headers = {"X-SFM-Agent-Key": config.api_key} if config.api_key else {}
        self._client = httpx.Client(base_url=config.api_base, timeout=30, headers=headers)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> BlueprintSyncer:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    # ── Remote queries ────────────────────────────────────────────────────────

    def list_remote(self) -> list[dict]:
        """Return the hub's blueprint list. Raises on HTTP error."""
        resp = self._client.get("/blueprints")
        resp.raise_for_status()
        return resp.json().get("blueprints", [])

    # ── Upload ────────────────────────────────────────────────────────────────

    def upload_blueprint(self, name: str, bp_dir: Path) -> bool:
        """Upload .sbp (and .sbpcfg if present) for blueprint `name`."""
        sbp = bp_dir / f"{name}.sbp"
        cfg = bp_dir / f"{name}.sbpcfg"

        if not sbp.exists():
            log.warning("Upload skipped — .sbp not found: %s", sbp)
            return False

        files: list[tuple] = [("files", (sbp.name, sbp.read_bytes(), "application/octet-stream"))]
        if cfg.exists():
            files.append(("files", (cfg.name, cfg.read_bytes(), "application/octet-stream")))

        try:
            resp = self._client.post("/blueprints/upload-batch", files=files)
            if resp.status_code in (200, 201, 207):
                log.info("Uploaded %s", name)
                self._state.set(BlueprintEntry(name=name, local_mtime=sbp.stat().st_mtime))
                self._state.save()
                return True
            log.warning("Upload %s: HTTP %d", name, resp.status_code)
        except httpx.HTTPError as exc:
            log.error("Upload error %s: %s", name, exc)
        return False

    # ── Download ─────────────────────────────────────────────────────────────

    def download_blueprint(self, name: str, bp_dir: Path) -> bool:
        """Download .sbp and .sbpcfg for blueprint `name` into bp_dir."""
        bp_dir.mkdir(parents=True, exist_ok=True)
        success = True

        try:
            resp = self._client.get(f"/blueprints/{name}/download")
            if resp.status_code == 200:
                (bp_dir / f"{name}.sbp").write_bytes(resp.content)
                log.info("Downloaded %s.sbp", name)
            else:
                log.warning("Download %s.sbp: HTTP %d", name, resp.status_code)
                success = False
        except httpx.HTTPError as exc:
            log.error("Download error %s.sbp: %s", name, exc)
            success = False

        # .sbpcfg is optional — 404 is acceptable
        try:
            resp = self._client.get(f"/blueprints/{name}/download-cfg")
            if resp.status_code == 200:
                (bp_dir / f"{name}.sbpcfg").write_bytes(resp.content)
                log.info("Downloaded %s.sbpcfg", name)
            elif resp.status_code != 404:
                log.warning("Download %s.sbpcfg: HTTP %d", name, resp.status_code)
        except httpx.HTTPError as exc:
            log.error("Download error %s.sbpcfg: %s", name, exc)

        if success:
            entry = self._state.get(name) or BlueprintEntry(name=name)
            self._state.set(entry)
            self._state.save()
        return success

    # ── Full sync ─────────────────────────────────────────────────────────────

    def sync(self) -> SyncResult:
        """Bidirectional sync: upload local-only files, download remote-only files."""
        result = SyncResult()
        bp_dir = self._cfg.blueprints_dir

        try:
            remote_list = self.list_remote()
        except httpx.HTTPError as exc:
            log.error("Cannot reach hub: %s", exc)
            result.errors.append(f"list_remote: {exc}")
            return result

        remote_names = {bp["name"] for bp in remote_list}
        local_names = {p.stem for p in bp_dir.glob("*.sbp")}

        for name in sorted(local_names - remote_names):
            if self.upload_blueprint(name, bp_dir):
                result.uploaded.append(name)
            else:
                result.errors.append(f"upload:{name}")

        for name in sorted(remote_names - local_names):
            if self.download_blueprint(name, bp_dir):
                result.downloaded.append(name)
            else:
                result.errors.append(f"download:{name}")

        return result

    # ── Delta sync (SFM-7a) ─────────────────────────────────────────────────────

    def _local_inventory(self, bp_dir: Path) -> list[dict]:
        """Snapshot every local .sbp as {name, modified_at, size_bytes}."""
        inventory: list[dict] = []
        for sbp in sorted(bp_dir.glob("*.sbp")):
            stat = sbp.stat()
            mtime = datetime.fromtimestamp(stat.st_mtime, tz=UTC).isoformat()
            inventory.append(
                {
                    "name": sbp.stem,
                    "modified_at": mtime,
                    "size_bytes": stat.st_size,
                }
            )
        return inventory

    def sync_diff(self) -> SyncResult:
        """Push/mirror sync via the server-side delta endpoint (SFM-7a).

        The local game folder is authoritative: the hub returns which blueprints
        to upload and which it deleted (because they are gone locally). Falls back
        to the legacy bidirectional :meth:`sync` when the hub has no ``/sync``
        endpoint (HTTP 404).
        """
        result = SyncResult()
        bp_dir = self._cfg.blueprints_dir
        inventory = self._local_inventory(bp_dir)

        try:
            resp = self._client.post("/blueprints/sync", json={"blueprints": inventory})
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                log.info("Hub has no /blueprints/sync — using legacy sync")
                return self.sync()
            log.error("sync_diff failed: %s", exc)
            result.errors.append(f"sync:{exc}")
            return result
        except httpx.HTTPError as exc:
            log.error("Cannot reach hub: %s", exc)
            result.errors.append(f"sync:{exc}")
            return result

        data = resp.json()
        for name in data.get("to_upload", []):
            if self.upload_blueprint(name, bp_dir):
                result.uploaded.append(name)
            else:
                result.errors.append(f"upload:{name}")

        # to_delete are blueprints the hub removed because they are already gone
        # locally — no local action needed, but drop any stale state entry.
        for name in data.get("to_delete", []):
            self._state.remove(name)
        self._state.save()

        return result
