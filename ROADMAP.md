# Roadmap — satisfactory-factory-manager

> Tracker des prochains développements. Source de vérité macro : la page Notion
> [🏭 satisfactory-factory-manager](https://www.notion.so/35359293e35e81248b86ea438ce52995).
> Source de vérité ticket-level : issues + PRs GitHub.
>
> Last updated: 2026-06-03 (realign on merged auth/alembic work; A-04 split).

## Statut actuel (2026-06-03)

- **V1 feature-complete** (SFM-1 → SFM-21). 90+ PRs mergés sur `main` (`cca81c7`).
- **PR #80 mergée** — nginx→vite preview + multi-project support (localStorage).
- E2E suite : **23/23 passed** (après PR #68 — SFM-22 clôturée).
- CI org-billing blocked → merges via `gh pr merge --admin`.
- Gate V1 (3 sessions actionnables) : **en attente déploiement** — ArgoCD appset prêt, images GHCR à pusher (besoin PAT `write:packages`).
- **Blocker images GHCR** : token actuel manque `write:packages` → créer un PAT et pusher manuellement ou débloquer la billing CI.
- **Auth livrée** : A-01 (#81 local + Steam OpenID + Epic placeholder), A-02 (#85
  Alembic baseline, fin de `create_all()` au lifespan), A-03 (#88 `/auth/me` +
  auto-refresh / 401 logout) sont **mergés sur `main`**. La branche
  `feat/auth-local-steam` est obsolète (squash-mergée).
- **Reste avant exposition publique** : A-04 (rendre l'auth obligatoire sur
  `plans` + `blueprints`) — en cours — et A-04b (scoping réel par `user_id`,
  follow-up). Sans ça, `sfm.ducal.me` reste Tailscale-only.
- **15 PRs Dependabot ouvertes** (#97→#111) : npm/pip/docker. Plusieurs bumps
  **majeurs** (python 3.12→3.14, node 22→26, eslint 9→10, lucide 0→1,
  i18next 25→26, @types/node 24→25) → à trier, pas de merge aveugle.

---

## P0 — Stabilisation (bloquant pour la suite)

| ID    | Tâche                                                                                 | Effort | État    | Lien                    |
|-------|---------------------------------------------------------------------------------------|--------|---------|-------------------------|
| S-01  | Setup wizard + healthcheck fix                                                        | 5min   | ✅ done | [PR #61](https://github.com/chrysa/satisfactory-factory-manager/pull/61) |
| S-02  | Réparer les 6 E2E pré-existants (4 nav, plans CRUD, blueprints import)                | 2h     | ✅ done | [PR #68](https://github.com/chrysa/satisfactory-factory-manager/pull/68) |
| S-03  | Désactiver `yaml-sorter` sur `docker-compose*.yml` côté `shared-standards`            | 30min  | ✅ done | [PR #71](https://github.com/chrysa/satisfactory-factory-manager/pull/71) |
| S-04  | Valider `make docker-e2e` bout-à-bout (23/23 green)                                   | 15min  | ✅ done | inclus dans PR #68      |
| S-05  | Triage des 4 tests "did not run" (cascade vs régressions)                             | 1h     | ✅ done | inclus dans PR #68      |

**Gate de sortie P0** : `make docker-e2e` vert sur main, 23/23 tests passent.

---

## P1 — Préparation Gate V1 (déploiement Kimsufi)

> **Pivot stratégique recommandé** : prioriser le déploiement sur le polish wizard.
> Sans instance déployée, le gate de validation V1 (3 sessions actionnables) ne démarre jamais.

| ID    | Tâche                                                                                 | Effort | État | Lien                    |
|-------|---------------------------------------------------------------------------------------|--------|------|-------------------------|
| D-01  | Helm chart `apps/dev/satisfactory-factory-manager/` (server repo)                     | 2h     | ✅ done | [server PR #135](https://github.com/chrysa/server/pull/135) |
| D-02  | SealedSecrets README pour SFM (V1 : aucun secret requis)                              | 1h     | ✅ done | [server PR #144](https://github.com/chrysa/server/pull/144) |
| D-03  | ArgoCD appset `apps/dev/*` + route `sfm.ducal.me` via Traefik                         | 1h     | ✅ done | [server PR #144](https://github.com/chrysa/server/pull/144) |
| D-03b | Push images GHCR (`write:packages` PAT requis — CI billing bloquée)                  | 15min  | 🔴 bloqué | token chrysa manque scope `write:packages` |
| D-04  | Log book sessions actionnables (`docs/gate-v1-sessions.md`)                           | 30min  | open | [#67](https://github.com/chrysa/satisfactory-factory-manager/issues/67) |
| D-05  | Check-in T+1 mois après V1 — décider Go/Defer/Reject pour L9-L10                      | —      | todo | dépend D-04             |

**Gate de sortie P1** : 3 sessions documentées avec info actionnable. Sinon à
T+1 mois → **geler le projet** (et ne PAS ouvrir L9-L10).

---

## P1-bis — Auth (prérequis exposition publique)

> **Bloquant pour exposition au-delà du Tailscale.** Branche `feat/auth-local-steam`
> a déjà livré local auth + Steam OpenID + Epic placeholder. Reste à durcir, migrer
> et brancher sur les endpoints.

| ID    | Tâche                                                                                 | Effort | État    | Lien                    |
|-------|---------------------------------------------------------------------------------------|--------|---------|-------------------------|
| A-01  | PR-iser + merger `feat/auth-local-steam` (local + Steam OpenID + Epic placeholder)    | 30min  | ✅ done | [PR #81](https://github.com/chrysa/satisfactory-factory-manager/pull/81) |
| A-02  | Alembic baseline migration (table `users`) — remplacer `create_all()` au lifespan     | 2h     | ✅ done | [PR #85](https://github.com/chrysa/satisfactory-factory-manager/pull/85) |
| A-03  | `/api/v1/auth/me` endpoint + auto-refresh côté frontend                               | 1h     | ✅ done | [PR #88](https://github.com/chrysa/satisfactory-factory-manager/pull/88) |
| A-04  | Auth **obligatoire** sur `plans` + `blueprints` (`Depends(get_current_user)`) + réparer fixtures tests / 4 fetch frontend / setup E2E login | 3h | 🚧 wip | dépend A-03             |
| A-04b | Scoping réel par `user_id` : `user_id` dans models plan/blueprint + storage par user + filtrage service | 4h | todo | dépend A-04             |
| A-05  | E2E Playwright : register → login → access plans page (utilise A-04)                  | 2h     | todo    | dépend A-04             |
| A-06  | Implem réelle Epic Games OAuth (actuellement placeholder)                             | 4h     | todo    | post-V1 si pas d'usage  |
| A-07  | Audit log côté backoffice — toutes mutations user-scoped                              | 3h     | todo    | dépend A-04             |
| A-08  | Rate limiting sur `/auth/login` + `/auth/register` (anti-brute-force)                 | 1h     | todo    | slowapi ou nginx limit  |

**Gate de sortie P1-bis** : sfm.ducal.me peut être exposé en clair (pas seulement Tailscale)
avec auth obligatoire + plans/blueprints scopés par utilisateur.

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
| T-07  | ADR-004 : stratégie migrations DB (Alembic vs create_all) — copie du choix discordium | 30min  | todo |
| T-08  | Bench : remplacer bcrypt par argon2 si CPU devient un goulot                          | —      | watch |

---

## Vue Gantt — chemin critique

```
P0 ✅ ──┬→ D-01 ✅ → D-03 ✅ → D-03b 🔴 ┐
        │                              ├→ D-04 → D-05 (T+1 mois) → L9 / L10
        └→ A-01 ✅ → A-02 ✅ → A-03 ✅ → A-04 🚧 → A-04b ─┘
                                  │
                                  └→ A-05 (E2E)  ┐
                                                 ├→ Exposition publique sfm.ducal.me
                              D-03b débloqué ───┘

Branches parallèles : W-01..W-06 (polish), T-01..T-08 (dette).
```

**Chemin critique mis à jour** : D-03b (push images GHCR) **et** A-04 (endpoints
protégés) doivent tous deux être verts avant l'ouverture publique. Tant que ça
n'est pas le cas, le déploiement reste Tailscale-only.

---

## Recommandation immédiate (séquence proposée)

**Règle 1+2** : 1 chantier principal, max 2 chantiers secondaires en parallèle.

### Principal — A-04 Auth obligatoire sur plans + blueprints (3h)
A-01/A-02/A-03 sont mergés. Le dernier verrou code avant exposition publique est
A-04 : ajouter `Depends(get_current_user)` aux routers `plans` + `blueprints`,
puis réparer la casse identifiée (recon 2026-06-03) :
- backend : fixture `authenticated_client` dans `conftest.py` (≈90 tests à recâbler) ;
- frontend : 4 mutations en `fetch()` brut sans header Auth
  (`domain/blueprints/queries.ts` upload / download-all / batch / import-zip) ;
- E2E : ajouter un login (register → token → `localStorage`) avant navigation.
Le **scoping réel par user** est sorti en A-04b (refactor services + storage).

### Secondaire #1 — A-04b scoping par user_id (4h, après A-04)
Sans `user_id`, tout utilisateur authentifié voit/modifie les plans de tous.
Acceptable en V1 Tailscale, **bloquant pour l'exposition publique multi-user**.

### Secondaire #2 — D-03b débloquer GHCR (15min utilisateur)
Action humaine : créer un PAT GitHub avec scope `write:packages` :

```bash
echo $NEW_PAT | docker login ghcr.io -u chrysa --password-stdin
docker push ghcr.io/chrysa/satisfactory-factory-manager-backend:latest
docker push ghcr.io/chrysa/satisfactory-factory-manager-frontend:latest
```

Puis ajouter `KUBECONFIG_B64` dans `chrysa/server` → Settings → Secrets pour que
ArgoCD sync passe.

### Suite (sprint+1)
A-03 (`/auth/me`) → A-04 (protect endpoints) → A-05 (E2E auth) → D-04 (log book
sessions) → ouverture publique sfm.ducal.me.

### Différer explicitement
- P2 wizard polish (W-01..W-06) — attendre que le déploiement Kimsufi soit
  effectif avant de polir l'UX.
- A-06 Epic OAuth, A-07 audit log, A-08 rate limit — bonus post-déploiement.
- L9-L10 — gelés jusqu'au passage du gate V1.

---

## Cycle de mise à jour

- Mettre à jour ce fichier à chaque PR mergée touchant un ID ci-dessus.
- Synchroniser avec Notion à chaque fin de sprint hebdo.
- Issues GitHub = source de vérité ticket-level (titres `SFM-XX`).
