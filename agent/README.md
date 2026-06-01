# sfm-agent

Local sync daemon for **Satisfactory Factory Manager**. It watches your
Satisfactory blueprints folder and keeps it in sync (bidirectionally) with the
hub. Runs on **Windows** (desktop PC) and **Steam Deck** / Linux.

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
sfm-agent start --hub https://sfm.ducal.me            # dir auto-detected
sfm-agent start --hub https://sfm.ducal.me --dir /custom/path --poll 30

# One-shot bidirectional sync, then exit
sfm-agent sync --hub https://sfm.ducal.me

# Hub reachability + blueprint count
sfm-agent status --hub https://sfm.ducal.me
```

All options have `SFM_`-prefixed environment-variable equivalents
(`SFM_HUB_URL`, `SFM_BLUEPRINTS_DIR`, `SFM_POLL_INTERVAL`) and can be set in a
`.env` file.

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
