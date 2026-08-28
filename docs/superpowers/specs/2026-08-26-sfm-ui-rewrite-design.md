# SFM — Réécriture totale de l'interface (design)

> Date : 2026-08-26 · Statut : approuvé (cadrage) · Auteur : anthony-greau
> Cycle : spec → plan → implémentation. Ce document est la spec ; le plan
> d'implémentation suivra via la compétence writing-plans.

## 1. Contexte & objectif

`satisfactory-factory-manager` (SFM) est un outil de planification/analyse pour
le jeu Satisfactory (parsing de saves `.sav`, plans de production, blueprints,
comparaison prévu/réel, reco explicable). Fiche Notion : 🧪 Incubateur,
kill-test « à tester ».

**Contrainte gate (Notion, 2026-08-22)** : « Aucun nouveau lot majeur ni release
avant le verdict. » Le projet doit prouver son utilité sur **3 sessions
Satisfactory réelles documentées** (import `.sav` → snapshot → diff prévu/réel →
recommandation explicable menant à une décision d'optimisation non triviale).

**Diagnostic** : le parcours critique pour le gate (snapshots / diff / assistant)
n'est pas de premier niveau dans l'UI actuelle (routes : Home, GameData,
Calculator, Plans, Blueprints — pas de Snapshots ni Session), alors que les
endpoints existent. L'UI est le blocage.

**Objectif** : réécrire entièrement l'interface pour rendre le parcours de
session utilisable et le mettre à parité avec la planification, **sans toucher au
backend** (pour rester dans le cadre gate : la refonte UI sert la validation, ce
n'est pas un lot backend).

## 2. Décisions de cadrage (validées)

| Décision | Choix |
|---|---|
| Portée | Réécriture totale UI, backend conservé |
| Gate | La refonte SERT le gate (débloque les 3 sessions) |
| Stack | React 19 + Vite + TypeScript + **Tailwind + shadcn/ui** (remplace SCSS modules) |
| Identité | **Nouvelle identité visuelle** (exploration via frontend-design) |
| IA | **Équilibrée** planification ⇄ suivi de session |
| Objet racine | « Usine » **front-only**, clé = `save_name` des snapshots (aucune entité backend) |

## 3. Contraintes backend (invariants)

Aucun changement backend. Modèle persistant existant : `User`, `AuditLog`,
`FactorySnapshot` (lié à `user` seulement ; champs `save_name`, `play_time`,
`imported_at`, `data` JSON). Plans/blueprints stockés hors DB (fichiers/sidecar
`.meta.json`). **Pas d'entité Factory/Project ; snapshots non liés aux plans.**

Conséquence : l'« usine » est une abstraction front, dérivée en groupant les
snapshots par `save_name`. Le diff plan↔réel se calcule côté client. Contrats API
(routers `plans`, `snapshots`, `gamedata`, `blueprints`, `assistant`, `audit`,
`auth`, `health`) inchangés.

## 4. Architecture d'information (IA)

Shell : sidebar gauche persistante + sélecteur d'usine (liste des `save_name`
distincts) en tête.

- **Vue d'ensemble usine** (accueil authentifié) — dernier snapshot du `save_name`
  courant : résumé bâtiments / réseau d'énergie, raccourcis « comparer au plan » et
  « demander une reco ».
- **Planifier** — Calculator (graphe ReactFlow, dagre), Plans, Blueprints.
- **Suivre** — Snapshots (upload `.sav`, historique par usine), Diff
  (snapshot↔snapshot + plan↔réel côté client), Assistant (reco explicable).
- **Référence** — GameData (items/recipes), utilitaire global.

Accès : routes publiques (`/gamedata`, `/calculator`) vs protégées (données user :
plans, blueprints, snapshots, usine). Auth Steam/OIDC + `ProtectedRoute` réutilisés.

## 5. Découpage & data flow

Réutilisation limitée à `src/api/*` (clients HTTP) et `src/domain/*` (types/hooks
TanStack Query) après audit de santé à l'implémentation. Toutes les pages et tous
les composants de présentation sont réécrits. TanStack Query reste la couche de
cache serveur ; état UI local via hooks/context.

Le sélecteur d'usine expose un contexte `currentSaveName` consommé par la Vue
d'ensemble et Suivre ; Planifier et Référence en sont indépendants.

## 6. Design system / identité (à produire)

Nouvelle direction visuelle propre à SFM, explorée via frontend-design au début de
l'implémentation. Tokens Tailwind (couleurs, radius, typo, ombres) + composants
shadcn/ui. Le fichier `frontend/DESIGN.md` sera réécrit pour refléter la nouvelle
identité (l'ancien persona Console est abandonné). Accessibilité WCAG AA
(contrastes), thème clair/sombre conservé via mécanisme OS-adaptatif.

## 7. Gestion d'erreurs

Bannière de connexion backend (équivalent `BackendConnectionBanner`), système de
toasts, états loading/empty/error par page (skeletons shadcn), garde-fous sur
l'upload `.sav` (taille, format, parsing) réutilisant les codes d'erreur backend.

## 8. Tests

- Unitaires composants : Vitest + Testing Library (par composant réécrit).
- Contrats API : MSW mocks alignés sur les schémas des routers.
- E2E : suite Playwright existante (SFM-21, 24 tests) à adapter au nouveau DOM ;
  ajouter un scénario couvrant le parcours gate import→diff→reco.

## 9. Livrables (PR-sized, app utilisable à chaque étape)

1. Shell + Tailwind/shadcn + nouvelle identité + sélecteur d'usine.
2. Référence : GameData.
3. Planifier : Calculator + Plans + Blueprints.
4. Suivre : Snapshots + Diff + Assistant (cœur gate).
5. Polish + adaptation E2E + réécriture `DESIGN.md`.

## 10. Hors périmètre (YAGNI)

- Toute migration ou entité backend (Factory/Project, lien snapshot↔plan).
- SFM-7 (agent local de sync) — reste deferred.
- Toute nouvelle feature métier non couverte par les endpoints actuels.
