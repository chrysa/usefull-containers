# Roadmap — satisfactory-factory-manager

> Tracker des prochains développements. Source de vérité macro : la page Notion
> [🏭 satisfactory-factory-manager](https://www.notion.so/35359293e35e81248b86ea438ce52995).
> Source de vérité ticket-level : issues + PRs GitHub.
>
> Last updated: 2026-05-26.

## Statut actuel (2026-05-26)

- **V1 feature-complete** (SFM-1 → SFM-21). 55+ PRs mergés sur `main`.
- **PR #61 mergée** (`58980ae`) — setup wizard + fix Docker healthcheck.
- E2E suite avant fixes : **13 passed / 6 failed / 4 skipped** — cf. SFM-22.
- CI org-billing blocked → merges via `gh pr merge --admin`.
- Gate V1 (3 sessions actionnables) : **non démarré** — pas d'instance déployée.

---

## P0 — Stabilisation (bloquant pour la suite)

| ID    | Tâche                                                                                 | Effort | État    | Lien                    |
|-------|---------------------------------------------------------------------------------------|--------|---------|-------------------------|
| S-01  | Setup wizard + healthcheck fix                                                        | 5min   | ✅ done | [PR #61](https://github.com/chrysa/satisfactory-factory-manager/pull/61) |
| S-02  | Réparer les 6 E2E pré-existants (4 nav, plans CRUD, blueprints import)                | 2h     | open    | [#62](https://github.com/chrysa/satisfactory-factory-manager/issues/62) |
| S-03  | Désactiver `yaml-sorter` sur `docker-compose*.yml` côté `shared-standards`            | 30min  | open    | [#63](https://github.com/chrysa/satisfactory-factory-manager/issues/63) |
| S-04  | Valider `make docker-e2e` bout-à-bout (23/23 green)                                   | 15min  | todo    | dépend S-02             |
| S-05  | Triage des 4 tests "did not run" (cascade vs régressions)                             | 1h     | todo    | dépend S-02             |

**Gate de sortie P0** : `make docker-e2e` vert sur main, 23/23 tests passent.

---

## P1 — Préparation Gate V1 (déploiement Kimsufi)

> **Pivot stratégique recommandé** : prioriser le déploiement sur le polish wizard.
> Sans instance déployée, le gate de validation V1 (3 sessions actionnables) ne démarre jamais.

| ID    | Tâche                                                                                 | Effort | État | Lien                    |
|-------|---------------------------------------------------------------------------------------|--------|------|-------------------------|
| D-01  | Helm chart `apps/dev/satisfactory-factory-manager/` (server repo)                     | 2h     | open | [#64](https://github.com/chrysa/satisfactory-factory-manager/issues/64) |
| D-02  | SealedSecrets pour SFM (AI Aggregator key, Sentry DSN)                                | 1h     | open | [#65](https://github.com/chrysa/satisfactory-factory-manager/issues/65) |
| D-03  | Déploiement Kimsufi + Traefik route `sfm.chrysa.fr` (Tailscale-only V1)               | 1h     | open | [#66](https://github.com/chrysa/satisfactory-factory-manager/issues/66) |
| D-04  | Log book sessions actionnables (`docs/gate-v1-sessions.md`)                           | 30min  | open | [#67](https://github.com/chrysa/satisfactory-factory-manager/issues/67) |
| D-05  | Check-in T+1 mois après V1 — décider Go/Defer/Reject pour L9-L10                      | —      | todo | dépend D-04             |

**Gate de sortie P1** : 3 sessions documentées avec info actionnable. Sinon à
T+1 mois → **geler le projet** (et ne PAS ouvrir L9-L10).

---

## P2 — Polissage wizard (après gate démarré)

| ID    | Tâche                                                                                 | Effort | État | Note                                     |
|-------|---------------------------------------------------------------------------------------|--------|------|------------------------------------------|
| W-01  | Toggle locale (FR/EN) sur l'étape welcome du wizard                                   | 1h     | todo | persiste dans localStorage               |
| W-02  | Étape "import gamedata ZIP" optionnelle dans le wizard                                | 3h     | todo | sans gamedata, calculator inutilisable   |
| W-03  | Bouton "relancer le wizard" dans un menu Settings/Help                                | 1h     | todo | reset localStorage `sfm.setup.completed` |
| W-04  | Bouton "retry now" dans BackendConnectionBanner                                       | 30min  | todo | et dans l'étape backend du wizard        |
| W-05  | 5e étape wizard : pré-remplir calculator avec target item                             | 2h     | todo | redirection vers `/calculator?item=…`    |
| W-06  | Persister la dernière section visitée (sticky nav)                                    | 1h     | todo | quality-of-life                          |

---

## P3 — Lots conditionnels L9-L10 (gelés)

> Absorbés de S.A.T. (Satisfactory) lors de la fusion 2026-05-15. **Ne s'ouvrent
> que si V1 passe son gate.**

| ID    | Tâche                                                                                 | Effort | État    |
|-------|---------------------------------------------------------------------------------------|--------|---------|
| L9    | Parser `.sav` (format binaire propriétaire) — snapshots offline                       | M      | 🧊 gelé |
| L10   | Assistant NL ("comment optimiser ma prod de rotor ?") via AI Aggregator               | S      | 🧊 gelé |

---

## P4 — Dette / tech-debt

| ID    | Tâche                                                                                 | Effort | État |
|-------|---------------------------------------------------------------------------------------|--------|------|
| T-01  | ADR-001 : choix backend ingestion (FRM mod / DS API / hybride)                        | 1h     | todo |
| T-02  | ADR-002 : schéma TimescaleDB (hypertables, retention, compaction)                     | 1h     | todo |
| T-03  | ADR-003 : stratégie d'alerting Discord (granularité, anti-spam)                       | 1h     | todo |
| T-04  | SonarCloud cleanup — passer les warnings de code smell                                | 2h     | todo |
| T-05  | mypy strict sur `backend/app/services/`                                               | 2h     | todo |
| T-06  | ReactFlow : afficher quantité/min sur les arêtes (SFM-13 polish)                      | 2h     | todo |

---

## Vue Gantt — chemin critique

```
S-01 ✅ → S-02 → S-04 ─┬→ D-01 → D-03 → D-04 → D-05 (T+1 mois) → L9 / L10
                       │
S-03 ─────────────────┘    Branche parallèle (polish): W-01..W-06
                                                         │
                                                         └→ (faire à la marge)
```

---

## Recommandation immédiate

1. **Attaquer SFM-22 (#62)** — réparer les 6 E2E. Débloque la confiance dans `make docker-e2e`.
2. **Démarrer SFM-24 (#64)** — Helm chart. Ouvre la voie au déploiement.
3. Le polish wizard (P2) attend — un seul utilisateur (toi) suffit pour valider le gate.

---

## Cycle de mise à jour

- Mettre à jour ce fichier à chaque PR mergée touchant un ID ci-dessus.
- Synchroniser avec Notion à chaque fin de sprint hebdo.
- Issues GitHub = source de vérité ticket-level (titres `SFM-XX`).
