from __future__ import annotations

import logging
import threading
from pathlib import Path

from watchdog.events import (
    FileCreatedEvent,
    FileDeletedEvent,
    FileModifiedEvent,
    FileSystemEventHandler,
)
from watchdog.observers import Observer

from .config import AgentConfig
from .syncer import BlueprintSyncer

log = logging.getLogger(__name__)

WATCHED_EXTS: frozenset[str] = frozenset({".sbp", ".sbpcfg"})


class _DebounceTimer:
    """Delays a callback until `delay` seconds of silence after the last call."""

    def __init__(self, delay: float, callback: object) -> None:
        self._delay = delay
        self._callback = callback
        self._timer: threading.Timer | None = None
        self._lock = threading.Lock()

    def schedule(self) -> None:
        with self._lock:
            if self._timer is not None:
                self._timer.cancel()
            self._timer = threading.Timer(self._delay, self._callback)
            self._timer.start()

    def cancel(self) -> None:
        with self._lock:
            if self._timer is not None:
                self._timer.cancel()
                self._timer = None


class BlueprintEventHandler(FileSystemEventHandler):
    """Watchdog handler — debounces file events and triggers uploads."""

    def __init__(self, syncer: BlueprintSyncer, config: AgentConfig) -> None:
        super().__init__()
        self._syncer = syncer
        self._cfg = config
        self._pending: dict[str, _DebounceTimer] = {}
        self._lock = threading.Lock()

    #: Sentinel key for the debounced full-reconcile triggered by deletions.
    _RECONCILE_KEY = "\x00reconcile"

    def _trigger_upload(self, name: str) -> None:
        log.info("File changed — uploading: %s", name)
        self._syncer.upload_blueprint(name, self._cfg.blueprints_dir)
        with self._lock:
            self._pending.pop(name, None)

    def _trigger_reconcile(self) -> None:
        log.info("File removed — reconciling with hub")
        self._syncer.sync_diff()
        with self._lock:
            self._pending.pop(self._RECONCILE_KEY, None)

    def _schedule(self, path_str: str) -> None:
        p = Path(path_str)
        if p.suffix not in WATCHED_EXTS:
            return
        name = p.stem
        with self._lock:
            if name not in self._pending:
                self._pending[name] = _DebounceTimer(
                    self._cfg.debounce_seconds,
                    lambda n=name: self._trigger_upload(n),
                )
            self._pending[name].schedule()

    def on_created(self, event: FileCreatedEvent) -> None:  # type: ignore[override]
        if not event.is_directory:
            self._schedule(str(event.src_path))

    def on_modified(self, event: FileModifiedEvent) -> None:  # type: ignore[override]
        if not event.is_directory:
            self._schedule(str(event.src_path))

    def on_deleted(self, event: FileDeletedEvent) -> None:  # type: ignore[override]
        if event.is_directory:
            return
        if Path(str(event.src_path)).suffix not in WATCHED_EXTS:
            return
        # A removed file can't be uploaded per-name; reconcile the whole folder so
        # the hub deletes blueprints that are now gone locally (game-authoritative).
        with self._lock:
            if self._RECONCILE_KEY not in self._pending:
                self._pending[self._RECONCILE_KEY] = _DebounceTimer(
                    self._cfg.debounce_seconds, self._trigger_reconcile
                )
            self._pending[self._RECONCILE_KEY].schedule()


class BlueprintWatcher:
    """Wraps watchdog Observer for clean lifecycle management."""

    def __init__(self, syncer: BlueprintSyncer, config: AgentConfig) -> None:
        self._config = config
        self._handler = BlueprintEventHandler(syncer, config)
        self._observer = Observer()
        self._observer.schedule(self._handler, str(config.blueprints_dir), recursive=False)

    def start(self) -> None:
        self._observer.start()
        log.info("Watching %s for changes", self._config.blueprints_dir)

    def stop(self) -> None:
        self._observer.stop()
        self._observer.join()
