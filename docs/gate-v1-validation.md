# Gate validation — V1

> **Purpose.** V1 is feature-complete (SFM-1→21, 55 PRs). Before investing further effort
> (L9 `.sav` parser, L10 NL assistant, k8s deployment, or any SFM-22+ feature), the gate
> defined in the [Notion canonical record](https://www.notion.so/35359293e35e81248b86ea438ce52995)
> must pass. This document tracks that validation.

## Context

- **Project priority:** P3 / Opportuniste
- **Notion rule:** _"3 sessions Satisfactory consécutives où l'outil apporte une info actionnable.
  Check-in T+1 mois après V1. Si pas d'usage réel → geler."_
- **V1 ship date:** 2026-05-23 (SFM-20 merged) — extended through 2026-05-24 with SFM-21 E2E.
- **Check-in deadline:** **2026-06-24**.

## Gate criteria — adapted to the actual product

The Notion record originally described a live-monitoring product (TimescaleDB + FRM mod +
Discord alerts). The product actually shipped is an **offline factory optimizer**
(calculator + ReactFlow graph + plans + AI assistant). The gate is reinterpreted accordingly.

A session counts as **actionable** if the tool changes at least one build decision:

- Machine ratio chosen via the calculator (vs. eyeballed/spreadsheet).
- Bottleneck spotted on the ReactFlow graph before pouring concrete.
- Alternate recipe selected after seeing the comparison.
- Plan reused / duplicated / exported and consulted in-game.
- A question to the AI assistant produced an answer that influenced an action.

A session does **not** count if the tool was opened but no decision changed, or if it was
used only to "play with the UI".

## Session journal

Fill one row per Satisfactory play session between 2026-05-24 and 2026-06-24.

> **How to log (≈30 s, right after the session — do not wait):** a session is **actionable**
> only if the tool changed at least one build decision (see the 5 criteria above). Put `yes` in
> "Decision changed?" only then; otherwise `no`. **Need 3 `yes` before 2026-06-24** to pass the gate.

| # | Date       | Duration | Action attempted in-game | Tool used (calculator / graph / plans / assistant) | Decision changed? | Friction / bug |
|---|------------|----------|--------------------------|----------------------------------------------------|-------------------|----------------|
| 1 |            |          |                          |                                                    |                   |                |
| 2 |            |          |                          |                                                    |                   |                |
| 3 |            |          |                          |                                                    |                   |                |
| 4 |            |          |                          |                                                    |                   |                |
| 5 |            |          |                          |                                                    |                   |                |

## Verdict logic — 2026-06-24

| Actionable sessions | Verdict | Next move |
|---------------------|---------|-----------|
| **≥ 3**             | ✅ Pass | Tag `v1.0.0`. Then pick one: (a) close clean, freeze L9/L10; (b) open L9 `.sav` parser; (c) k8s deployment if hosting becomes a need. |
| **< 3**             | ❌ Fail | Freeze the project. No L9/L10. Update Notion: Pilier → 🗑️ Archives, Maturité → 100 (frozen). Repo stays read-only. |

## Out of scope during the gate window

- No new feature PRs (SFM-22+).
- No deployment work (k8s, Helm, SealedSecrets).
- No L9/L10 prototyping.
- **Allowed:** bug fixes if a session reveals one, doc tweaks, dependency bumps.

## Friction log

Anything that hurt during gate sessions but did not block — for post-gate triage if V1 passes:

- _(none yet)_
