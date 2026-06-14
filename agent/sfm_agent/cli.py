from __future__ import annotations

import logging
import signal
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

import click
import httpx
from rich.console import Console
from rich.table import Table

from .config import AgentConfig, default_blueprints_dir, detect_platform
from .state import AgentState
from .syncer import BlueprintSyncer
from .watcher import BlueprintWatcher

console = Console()
log = logging.getLogger(__name__)


def _setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def _resolve_bp_dir(bp_dir: str | None) -> Path:
    """
    Resolve the blueprints directory: explicit ``--dir`` wins; otherwise fall
    back to the per-platform default (Windows / Steam Deck / Linux). Exits with
    a helpful message when nothing usable can be found.
    """
    if bp_dir:
        path = Path(bp_dir).expanduser().resolve()
    else:
        platform = detect_platform()
        default = default_blueprints_dir(platform)
        if default is None:
            console.print(
                f"[red]No default blueprints directory for platform '{platform}'. "
                "Pass --dir explicitly.[/red]"
            )
            sys.exit(1)
        path = default.expanduser().resolve()
        console.print(f"[dim]Auto-detected {platform} blueprints dir: {path}[/dim]")
    if not path.exists():
        console.print(
            f"[red]Blueprint directory not found: {path}[/red]\n"
            "[yellow]Start Satisfactory at least once, or pass --dir.[/yellow]"
        )
        sys.exit(1)
    return path


@click.group()
def cli() -> None:
    """sfm-agent — Satisfactory Factory Manager local sync daemon.

    \b
    Environment variables (all prefixed SFM_):
      SFM_HUB_URL          Hub base URL  (default: http://localhost:8000)
      SFM_BLUEPRINTS_DIR   Local blueprint folder
      SFM_POLL_INTERVAL    Seconds between full polls (default: 60)
    """


@cli.command()
@click.option(
    "--hub",
    envvar="SFM_HUB_URL",
    default="http://localhost:8000",
    show_default=True,
    help="Hub base URL",
)
@click.option(
    "--dir",
    "bp_dir",
    envvar="SFM_BLUEPRINTS_DIR",
    default=None,
    type=click.Path(),
    help="Local blueprints directory (auto-detected per platform if omitted)",
)
@click.option(
    "--poll",
    envvar="SFM_POLL_INTERVAL",
    default=60,
    show_default=True,
    type=int,
    help="Poll interval (seconds)",
)
@click.option(
    "--key",
    envvar="SFM_API_KEY",
    default="",
    help="Agent API key sent as X-SFM-Agent-Key (or set SFM_API_KEY)",
)
@click.option("--verbose", "-v", is_flag=True, help="Enable debug logging")
def start(hub: str, bp_dir: str | None, poll: int, key: str, verbose: bool) -> None:
    """Start the sync daemon (file watcher + periodic poll)."""
    _setup_logging(verbose)
    bp_path = _resolve_bp_dir(bp_dir)

    cfg = AgentConfig(hub_url=hub, blueprints_dir=bp_path, poll_interval=poll, api_key=key)
    state = AgentState(cfg.state_file)

    console.print("[bold green]sfm-agent starting[/bold green]")
    console.print(f"  Hub : [cyan]{cfg.hub_url}[/cyan]")
    console.print(f"  Dir : [cyan]{bp_path}[/cyan]")
    console.print(f"  Poll: [cyan]{poll}s[/cyan]")

    stop_event = threading.Event()

    def _on_signal(signum: int, _frame: object) -> None:
        console.print("\n[yellow]Stopping...[/yellow]")
        stop_event.set()

    signal.signal(signal.SIGINT, _on_signal)
    signal.signal(signal.SIGTERM, _on_signal)

    with BlueprintSyncer(cfg, state) as syncer:
        console.print("[cyan]Initial sync...[/cyan]")
        result = syncer.sync_diff()
        console.print(
            f"  ↑ {len(result.uploaded)} uploaded  "
            f"↓ {len(result.downloaded)} downloaded  "
            f"✗ {len(result.errors)} errors"
        )

        watcher = BlueprintWatcher(syncer, cfg)
        watcher.start()
        last_poll = time.monotonic()

        try:
            while not stop_event.is_set():
                if time.monotonic() - last_poll >= poll:
                    result = syncer.sync_diff()
                    if result.uploaded or result.downloaded:
                        console.print(
                            f"[cyan]Poll:[/cyan] ↑{len(result.uploaded)} ↓{len(result.downloaded)}"
                        )
                    last_poll = time.monotonic()
                stop_event.wait(timeout=5)
        finally:
            watcher.stop()

    console.print("[green]Done.[/green]")


@cli.command()
@click.option("--hub", envvar="SFM_HUB_URL", default="http://localhost:8000", show_default=True)
@click.option("--dir", "bp_dir", envvar="SFM_BLUEPRINTS_DIR", default=None, type=click.Path())
@click.option(
    "--key",
    envvar="SFM_API_KEY",
    default="",
    help="Agent API key sent as X-SFM-Agent-Key (or set SFM_API_KEY)",
)
@click.option("--verbose", "-v", is_flag=True)
def sync(hub: str, bp_dir: str | None, key: str, verbose: bool) -> None:
    """Run a one-shot delta sync (push local changes, mirror deletions) and exit."""
    _setup_logging(verbose)
    bp_path = _resolve_bp_dir(bp_dir)
    cfg = AgentConfig(hub_url=hub, blueprints_dir=bp_path, api_key=key)
    state = AgentState(cfg.state_file)

    with BlueprintSyncer(cfg, state) as syncer:
        result = syncer.sync_diff()

    t = Table(title="Sync result")
    t.add_column("Category", style="bold")
    t.add_column("Count", justify="right")
    t.add_row("Uploaded", str(len(result.uploaded)))
    t.add_row("Downloaded", str(len(result.downloaded)))
    t.add_row("Errors", str(len(result.errors)), style="red" if result.errors else "")
    console.print(t)

    if result.errors:
        for err in result.errors:
            console.print(f"  [red]✗ {err}[/red]")
        sys.exit(1)


@cli.command()
@click.option("--hub", envvar="SFM_HUB_URL", default="http://localhost:8000", show_default=True)
def status(hub: str) -> None:
    """Report hub connection state and the last successful sync time."""
    try:
        resp = httpx.get(f"{hub}/api/v1/health", timeout=5)
        if resp.status_code == 200:
            console.print(f"[green]Connected[/green]: {hub}")
        else:
            console.print(f"[yellow]Hub HTTP {resp.status_code}[/yellow]: {hub}")
    except httpx.HTTPError as exc:
        console.print(f"[red]Disconnected[/red]: {hub} ({exc})")
        sys.exit(1)

    # Last sync time: the state file is rewritten after every successful sync, so
    # its mtime is a reliable "last sync" marker.
    state_file = AgentConfig().state_file
    if state_file.exists():
        ts = datetime.fromtimestamp(state_file.stat().st_mtime).isoformat(timespec="seconds")
        console.print(f"  Last sync: [cyan]{ts}[/cyan]")
    else:
        console.print("  Last sync: [dim]never[/dim]")


@cli.command()
def detect() -> None:
    """Show the detected platform and its default blueprints directory."""
    platform = detect_platform()
    console.print(f"Platform: [cyan]{platform}[/cyan]")
    path = default_blueprints_dir(platform)
    if path is None:
        console.print(
            "[yellow]No default blueprints directory for this platform — "
            "pass --dir explicitly.[/yellow]"
        )
        return
    found = path.expanduser().exists()
    state = "[green]found[/green]" if found else "[yellow]not found[/yellow]"
    console.print(f"Blueprints dir: [cyan]{path}[/cyan] ({state})")
