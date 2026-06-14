# sfm-agent

Local sync daemon for **Satisfactory Factory Manager**. It watches your
Satisfactory blueprints folder and mirrors it to the hub: the local game folder
is authoritative, so a blueprint you add in-game is uploaded within ~2s, and one
you delete in-game is removed from the hub. Runs on **Windows** (desktop PC) and
**Steam Deck** / Linux.

Sync uses the hub's delta endpoint (`POST /api/v1/blueprints/sync`): the agent
sends its local inventory, the hub answers with the blueprints to upload and the
ones it deleted (gone locally). Against an older hub without that endpoint, the
agent falls back to the legacy bidirectional list-and-diff sync.

**Safety:** an *empty* local inventory never wipes the hub — if the agent points
at a wrong or empty folder, the hub keeps its blueprints instead of deleting
them all. Pruning a hub down to nothing requires the explicit
`allow_empty_prune` flag on the request.

## Install

```bash
pip install -e '.[dev]'   # from the agent/ directory
# or, once published:  pipx install sfm-agent
```

## Platform support

The agent auto-detects where Satisfactory stores blueprints, so you usually
don't need to pass `--dir`:

| Platform        | Default blueprints folder |
| --------------- | ------------------------- |
| **Windows**     | `%LOCALAPPDATA%\FactoryGame\Saved\SaveGames\blueprints` |
| **Steam Deck**  | `~/.local/share/Steam/steamapps/compatdata/526870/pfx/drive_c/users/steamuser/AppData/Local/FactoryGame/Saved/SaveGames/blueprints` (Proton prefix, app id `526870`) |
| **Linux (Steam/Proton)** | same Proton path as the Steam Deck |

Steam Deck is distinguished from generic Linux via `/etc/os-release`
(`ID=steamos`). On any platform you can override the location with `--dir` or
the `SFM_BLUEPRINTS_DIR` environment variable.

Check what the agent detected on your machine:

```bash
sfm-agent detect
# Platform: steamdeck
# Blueprints dir: /home/deck/.local/share/Steam/.../blueprints (found)
```

## Usage

```bash
# Long-running daemon: initial sync + file watcher + periodic poll
sfm-agent start --hub https://sfm.ducal.me --key <agent-key>   # dir auto-detected
sfm-agent start --hub https://sfm.ducal.me --dir /custom/path --poll 30

# One-shot delta sync (push local changes, mirror deletions), then exit
sfm-agent sync --hub https://sfm.ducal.me --key <agent-key>

# Connection state + last successful sync time
sfm-agent status --hub https://sfm.ducal.me
```

All options have `SFM_`-prefixed environment-variable equivalents
(`SFM_HUB_URL`, `SFM_BLUEPRINTS_DIR`, `SFM_POLL_INTERVAL`, `SFM_API_KEY`) and can
be set in a `.env` file.

### Authentication

The agent authenticates to the hub with a shared secret sent in the
`X-SFM-Agent-Key` header. Set it with `--key` or, preferably, `SFM_API_KEY` so
the secret never lands in your shell history:

```bash
export SFM_API_KEY="$(cat ~/.config/sfm-agent/key)"
sfm-agent start --hub https://sfm.ducal.me
```

The hub side enables this by setting `AGENT_API_KEY` to the same value; the key
authorises as the owner (first) account. When you store the secret in a `.env`
or config file, lock it down so only your user can read it:

```bash
chmod 600 ~/.config/sfm-agent/key   # or the .env file holding SFM_API_KEY
```

### Running as a background service

- **Steam Deck / Linux** — create a `systemd --user` unit that runs
  `sfm-agent start --hub <url>` and enable it with `systemctl --user enable --now sfm-agent`.
- **Windows** — run `sfm-agent start` at logon (Task Scheduler) or wrap it as a
  service. Packaged distributables (`.exe` / signed Deck binary) are tracked as
  a follow-up.

## Development

```bash
pytest                                   # tests + coverage (gate: 85%)
ruff check --config pyproject.toml .     # lint
```
