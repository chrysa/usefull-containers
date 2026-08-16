# SFM — Teardown technique approfondi (satisfactory-factory-manager)

Sources auditées dans le code réel (WebFetch github + raw). Focus: structure `Docs.json`
de Coffee Stain + parsing, formulation LP, couplage React Flow + ELK.

---

## Rappel structure `Docs.json` (Coffee Stain)

`Docs.json` (dans le jeu: `Satisfactory/CommunityResources/Docs/en-US.json`) est un **tableau
d'objets groupés par `NativeClass`**. Chaque objet a `NativeClass` (ex.
`Class'/Script/FactoryGame.FGRecipe'`) et un tableau `Classes` de définitions. Champs clés:

- **Items**: `NativeClass` ∈ `FGItemDescriptor`, `FGResourceDescriptor`,
  `FGItemDescriptorBiomass`, `FGItemDescriptorNuclearFuel`, `FGEquipmentDescriptor`,
  `FGConsumableDescriptor`, `FGPowerShardDescriptor`, `FGAmmoType*`. Champs: `ClassName`,
  `mDisplayName`, `mForm` (RF_SOLID/RF_LIQUID/RF_GAS), `mEnergyValue`.
- **Recettes**: `NativeClass = FGRecipe`. Champs: `mIngredients`, `mProduct` (strings
  sérialisées `((ItemClass=...,Amount=N))`), `mManufactoringDuration` (secondes → rate =
  `60/duration`), `mProducedIn` (liste de classes de bâtiment), `mVariablePowerConsumptionConstant/Factor`.
- **Machines**: `FGBuildableManufacturer`, `FGBuildableManufacturerVariablePower`, +40 variantes
  `FGBuildable*`. Générateurs: `FGBuildableGeneratorFuel/Nuclear`. Ressources/mineurs séparés.
- **Gotcha liquides**: les `Amount` des fluides sont ×1000 (mL) → **diviser par 1000 pour m³**.
- **Gotcha strings**: ingredients/products ne sont PAS du JSON mais des strings UE à parser au
  regex: `\(ItemClass=([^,]+),Amount=(\d+)\)` puis extraire le nom de classe de `...C'/path/Desc_X.Desc_X_C'`.

---

## SatisfactoryLP (0xjc) — scipy.optimize.milp, croise recettes + nœuds ressources

- **Fichier**: `SatisfactoryLP.py` (mono-fichier). Data: `Docs.json`, `MapInfo.json` (nœuds
  ressources par pureté), `Frontier.csv`.
- **Mécanisme parse**: filtre par `NativeClass`, regex sur strings d'items:
```python
ITEM_AMOUNT_REGEX = re.compile(r"\(ItemClass=([^,]+),Amount=(\d+)\)")
def find_item_amounts(s):
    for m in ITEM_AMOUNT_REGEX.finditer(s):
        yield (extract_class_name(m[1]), int(m[2]))
def parse_recipe(entry):
    produced_in = parse_class_list(entry["mProducedIn"]) or []
    recipe_rate = 60.0 / float(entry["mManufactoringDuration"])
    inputs  = [(it, recipe_rate*a) for it,a in find_item_amounts(entry["mIngredients"])]
    outputs = [(it, recipe_rate*a) for it,a in find_item_amounts(entry["mProduct"])]
    vpc = float(entry["mVariablePowerConsumptionConstant"]) \
        + 0.5*float(entry["mVariablePowerConsumptionFactor"])  # power moyen
```
- **Mécanisme MILP**: chaque colonne = une activité (miner|item|clock, manufacturer|recipe|clock).
  Coeffs = flux d'items (négatif=conso, positif=prod) dans une matrice `lp_A[var, col]`. Lignes =
  variables de balance (items, power, machines). Bornes: égalité (b_l=b_u=rhs) ou ≥ (b_u=inf).
```python
def get_recipe_coeffs(recipe, clock, output_multiplier=1.0):
    coeffs = defaultdict(float)
    for item_class, r in recipe.inputs:  coeffs[f"item|{item_class}"] -= clock*r
    for item_class, r in recipe.outputs: coeffs[f"item|{item_class}"] += clock*r*output_multiplier
    return coeffs
# ... remplissage lp_A, puis:
lp_constraints = scipy.optimize.LinearConstraint(lp_A, lp_b_l, lp_b_u)
lp_result = scipy.optimize.milp(-lp_c, integrality=lp_integrality, constraints=lp_constraints)
```
- **Croisement recettes+ressources**: pas de table explicite — les nœuds miniers (par pureté depuis
  MapInfo) deviennent des colonnes d'extraction bornées; le solveur équilibre `item|...` sur toutes
  les activités. `integrality` force le nb entier de machines si `requires_integrality`.
- **Intégration SFM**: réutiliser tel quel le parse Docs.json (regex + NativeClass) côté backend
  Python; adopter le pattern "1 activité = 1 colonne, item = ligne de balance" pour l'algèbre linéaire;
  garder `milp` pour l'option "compter les machines en entier".
- **Gotchas**: `mProducedIn` peut être vide/`Build_*` non-manufacturier → filtrer; power variable
  (overclock) non-linéaire, approximé par moyenne; matrice dense np.zeros → OK petite échelle, sparse
  si scale-up.
- **Licence**: repo LICENSE présent — **vérifier** (probable MIT). ✅ portable si MIT.

**Takeaways**: (1) le parse canonique = filtre NativeClass + regex ItemClass/Amount + rate=60/durée;
(2) modèle "activité=colonne / item=ligne de balance" via `LinearConstraint`+`milp`; (3) `integrality`
pour machines entières, sinon LP continu.

---

## Zistack/Satisfactory-Optimizer — scipy linprog, problème en JSON

- **Fichiers**: `satisfactory-optimizer.py` (entrée), `problem.py` (formulation), `objective_function.py`,
  `recipe.py`/`machine.py`/`item.py`; data `recipes.json`/`machines.json`/`items.json`. Le **problème
  est un fichier JSON** (input_items, output_items, max_power_consumption, optimization_goals) converti
  en interne vers scipy — la formulation elle-même n'est pas en JSON.
- **Mécanisme**: variables = machine_count par recette (+ somersloops, clock). Contraintes: balance
  d'items (produit-consommé), caps de nœuds, power net ≤ max, somersloops ≤ dispo. Objectif: min nb
  machines OU min power net.
```python
recipe_to_col = {r: i for i, r in enumerate(all_recipes)}
A_eq, b_eq = [], []
for item in used_items:                       # 1 ligne de conservation par item
    row = [0]*len(all_recipes)
    for r in producing_recipes[item]: row[recipe_to_col[r]] += r.production_rate(item)
    for r in consuming_recipes[item]: row[recipe_to_col[r]] -= r.consumption_rate(item)
    A_eq.append(row); b_eq.append(input_rate[item] - output_rate[item])
bounds = [(0, None)]*len(all_recipes)          # machines ≥ 0
c = [r.power_consumption() for r in all_recipes]   # objectif
```
- **Intégration SFM**: le "problème en JSON" est un bon **contrat d'API** pour le backend SFM (POST un
  problème → réponse plan). Le pattern balance = `A_eq` avec rhs = `input - output` est directement
  transposable.
- **Gotchas**: linprog continu → nb machines fractionnaire (arrondi ≠ optimal); JSON de data doit être
  re-généré à chaque patch du jeu.
- **Licence**: **non confirmée** dans le README (pas de LICENSE visible) → **traiter comme
  "tous droits réservés" tant que non vérifié**; s'inspirer du design, ne pas copier verbatim.

**Takeaways**: (1) exposer le problème d'optim comme un JSON (input/output/power/goals) = bon contrat
backend; (2) balance d'items = `A_eq`, rhs = input−output; (3) licence à clarifier avant tout copier-coller.

---

## greeny/SatisfactoryTools — parser Docs.json → data.json (référence de parsing)

- **Fichier**: `bin/parseDocs.ts` (lancé via `yarn parseDocs`; TypeScript/ts-node). Sous-parseurs:
  `parseRecipes()`, `parseItemDescriptors()`, `parseBuildings()` sur `definitions.Classes`.
- **Mécanisme**: groupe les entrées par `NativeClass`, dispatch par type, sortie `data.json`:
```
{ recipes:{className:RecipeSchema}, items:{...}, schematics:{...},
  generators:{...}, resources:{...}, miners:{...}, buildings:{...} }
```
  Ingrédients/produits liquides `/1000` → m³; slugs dupliqués suffixés numériquement pour unicité.
- **Intégration SFM**: si le front SFM est TS, `parseDocs.ts` est le modèle le plus mûr (schémas
  Zod/TS par type). Adopter la sortie `data.json` map-par-className comme **format pivot** consommé
  aussi bien par le solveur Python que le front.
- **Gotchas**: 40+ variantes `FGBuildable*` à mapper; slugs non uniques par défaut; schémas à re-valider
  à chaque MAJ du jeu.
- **Licence**: repo historiquement **MIT** → **vérifier** le LICENSE courant. ✅ probable OK.

**Takeaways**: (1) `data.json` (map className→schema, séparé recipes/items/buildings/resources) = format
pivot recommandé; (2) parseurs spécialisés par NativeClass + conversion liquides /1000; (3) parser TS
mûr réutilisable côté front.

---

## factoriolab/factoriolab — data model générique découplé du solveur

- **Stack**: Angular + Redux + TypeScript; solveur **GLPK (glpk.js)**. Modèles data dans
  `src/app/models/` (interfaces `*Json` génériques multi-jeux: item/recipe/machine).
- **Mécanisme**: modèle **agnostique du jeu** — une recette générique porte `id`, `in` (map
  item→qty), `out` (map item→qty), `producers`/`machine`, `time`, `cost`, `category`. Le solveur
  ne connaît que ces interfaces, pas Satisfactory. Un adaptateur par jeu (dont Satisfactory) mappe
  les données brutes vers ce modèle commun.
```ts
interface RecipeJson {
  id: string;
  name: string;
  time: number;                 // durée (s)
  in: Record<string, number>;   // item id -> qty
  out: Record<string, number>;
  producers: string[];          // machine ids
  cost?: number;
  category?: string;
}
```
- **Intégration SFM**: adopter la **séparation data-model / solveur** — le solveur SFM ne devrait
  manipuler que `{in, out, time, producers}` normalisés, jamais les champs UE bruts. Permet de
  tester le solveur avec des fixtures synthétiques.
- **Gotchas**: modèle multi-jeux = plus abstrait que nécessaire pour SFM seul (over-engineering
  possible); `in/out` en Record impose ids stables.
- **Licence**: **GPL-3.0** ⚠️ **copyleft fort** — NE PAS copier de code dans SFM (repo non-GPL).
  S'inspirer du **design d'interface** uniquement (les idées/API ne sont pas couvertes), réécrire.

**Takeaways**: (1) découpler solveur du data via interfaces génériques `in/out/time/producers`;
(2) adaptateur-par-jeu vers un modèle pivot; (3) ⚠️ GPL-3.0 = inspiration design seulement, zéro copie.

---

## lunafoxfire/yet-another-factory-planner — état URL + poids solveur (glpk.js)

- **Fichiers**: `client/src/utilities/production-solver/` (solveur), `.../error/GraphError`,
  contexts pour l'état. Solveur = **GLPK via glpk.js** (in-browser, "all calculations in-browser").
- **Mécanisme solveur/poids**: chaque recette = variable continue (multiplicateur). Contraintes par
  item: inputs `conso ≤ dispo`, produits finaux `net ≥ cible`, intermédiaires `net = 0`. Objectif =
  min coût pondéré par **poids globaux configurables** (resources / power / buildings):
```js
model.objective.vars.push({ name: recipeKey,
  coef: buildingInfo.power*weights.power
      + ingredientCost*weights.resources
      + weights.buildings });
model.subjectTo.push({ name: `${itemKey} balance`,
  vars: [/* producteurs +coef, consommateurs -coef */],
  bnds: { type: glpk.GLP_UP, ub: maxAvailable, lb: NaN } });
const solution = await glpk.solve(model, { msglev: glpk.GLP_MSG_OFF, tmlim: 3.0 });
```
- **État URL**: l'état du plan (targets, recettes activées, poids) est sérialisé dans l'URL pour
  partage (calcul 100% client). Localisation: utilities/contexts de production (fichier de
  serialize/deserialize non ouvert ici — à confirmer dans `contexts/`). Pattern = encoder l'état
  compact en query param partageable.
- **Intégration SFM**: (1) exposer des **poids configurables** (resources/power/buildings) dans
  l'objectif = UX différenciante; (2) si SFM veut un mode offline/no-backend, glpk.js in-browser est
  une option; (3) reprendre l'idée d'**URL sharable** pour partager un plan sans compte.
- **Gotchas**: `tmlim` (timeout solveur) nécessaire sinon freeze UI; intermédiaires `net=0` peut
  rendre infaisable si recette manquante → gérer GraphError.
- **Licence**: **à vérifier** (probable MIT). ✅ probable OK.

**Takeaways**: (1) objectif = combinaison linéaire de poids configurables (resources/power/buildings);
(2) balance items = 3 régimes (input ≤ dispo, final ≥ cible, intermédiaire = 0); (3) état plan
sérialisé en URL pour partage sans backend.

---

## TheoKanning/SatisfactoryOptimizer — OR-Tools LP (ratios)

- **Fichier**: `satisfactory.py` (modèle), `data.py`/`recipe.py`/`common.py`, `data.json`.
- **Mécanisme**: OR-Tools GLOP. Variable = nb machines par recette (réel ≥ 0). Contrainte: chaque
  composant a une quantité nette ≥ 0. Objectif: max Σ(score_composant × produit) − petite pénalité
  par recette (élimine les étapes inutiles).
```python
from ortools.linear_solver import pywraplp
solver = pywraplp.Solver.CreateSolver('GLOP')
recipe_vars = {r.name: solver.NumVar(0, solver.infinity(), r.name) for r in recipes}
for component, available in inputs.items():
    solver.Add(sum(recipe_vars[r.name]*r.inputs.get(component,0) for r in recipes) <= available)
for component, target in outputs.items():
    solver.Add(sum(recipe_vars[r.name]*r.outputs.get(component,0) for r in recipes) >= target)
solver.Minimize(sum(recipe_vars[r.name]*r.cost for r in recipes))
status = solver.Solve()
# (snippet reconstruit d'après le README/structure — vérifier signatures exactes dans satisfactory.py)
```
- **Intégration SFM**: alternative à scipy — OR-Tools GLOP plus rapide/robuste sur gros modèles; API
  déclarative (`solver.Add(expr)`) plus lisible que remplir des matrices numpy. La **pénalité par
  recette** (anti-recettes-superflues) est un truc à reprendre.
- **Gotchas**: OR-Tools = dépendance binaire lourde (wheels); GLOP continu → machines fractionnaires
  (passer à CBC/`CreateSolver('CBC')` + IntVar pour entiers).
- **Licence**: **MIT** ✅ portable.

**Takeaways**: (1) OR-Tools GLOP + API `solver.Add` plus lisible que numpy; (2) pénalité par recette
pour minimiser le nb d'étapes; (3) MIT, mais dépendance lourde et continu par défaut.

---

## xyflow/xyflow (React Flow) — nœuds custom + handles typés

- **Mécanisme**: un nœud custom = composant React recevant `NodeProps<TData>`, avec `<Handle>`
  source/target; enregistré via `nodeTypes` passé à `<ReactFlow>`.
```tsx
import { Handle, Position, NodeProps } from 'reactflow';
interface RecipeNodeData { label: string; rate: number }
function RecipeNode({ data }: NodeProps<RecipeNodeData>) {
  return (<div className="recipe-node">
    <Handle type="target" position={Position.Left} />
    <strong>{data.label}</strong><span>{data.rate}/min</span>
    <Handle type="source" position={Position.Right} />
  </div>);
}
const nodeTypes = { recipe: RecipeNode };
// <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} />
```
- **Intégration SFM**: un `RecipeNode` par machine (handles = ports d'items in/out), edges typés =
  flux d'item avec débit; `className="nodrag"` sur les inputs éditables. Positions calculées par
  ELK/dagre (ci-dessous), pas à la main.
- **Gotchas**: `nodeTypes` doit être **mémoïsé** (useMemo) sinon re-render/warn; handles multiples
  nécessitent des `id` distincts pour router les edges au bon port.
- **Licence**: **MIT** ✅.

**Takeaways**: (1) `NodeProps<TData>` + `<Handle>` source/target = brique du graphe de prod;
(2) mémoïser `nodeTypes`, ids de handles distincts pour multi-ports; (3) MIT.

---

## kieler/elkjs — layout layered, couplage React Flow ↔ ELK

- **Mécanisme ELK**: graphe JSON `{id, layoutOptions, children:[{id,width,height}], edges:[{id,sources,targets}]}`;
  `new ELK()`; `elk.layout(graph)` renvoie une Promise avec `x`/`y` calculés sur chaque child.
- **Couplage React Flow (code réel, exemple xyflow officiel)**:
```js
const elk = new ELK();
const getLayoutedElements = (nodes, edges, options = {}) => {
  const graph = {
    id: 'root',
    layoutOptions: options,             // ex: {'elk.algorithm':'layered','elk.direction':'RIGHT'}
    children: nodes.map((n) => ({ ...n,
      targetPosition: 'left', sourcePosition: 'right',
      width: 150, height: 50 })),       // dimensions requises par ELK
    edges: edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  };
  return elk.layout(graph).then((g) => ({
    nodes: g.children.map((n) => ({ ...n, position: { x: n.x, y: n.y } })),  // ELK x/y -> RF position
    edges,
  }));
};
```
- **Intégration SFM**: pipeline = (recettes→nodes RF) → getLayoutedElements(`elk.algorithm=layered`,
  `elk.direction=RIGHT` pour lire matière première→produit) → setNodes avec positions. Recalculer au
  changement de plan.
- **Gotchas**: ELK est **async** (Promise) → gérer le flash avant layout (fitView après); dims des
  nodes doivent être connues avant layout (measure ou fixes); `edges` RF (`source`/`target`) ≠ ELK
  (`sources`/`targets` en tableaux) → mapper.
- **Licence**: **EPL-2.0** (copyleft faible, au niveau fichier) — utilisable **comme dépendance npm**
  sans contaminer SFM; ne pas modifier/redistribuer les sources ELK sans respecter EPL. ✅ en dépendance.

**Takeaways**: (1) mapper RF↔ELK: `source/target`→`sources/targets[]`, `x/y`→`position`; (2)
`layered`+`direction:RIGHT` pour un flux de prod lisible; (3) async + dims requises = gérer flash/fitView;
EPL-2.0 OK en dépendance.

---

## dagrejs/dagre — layout hiérarchique (alternative à ELK)

- **Mécanisme**: `new dagre.graphlib.Graph()`; `setGraph({rankdir:'LR'})`; `setNode(id,{width,height})`;
  `setEdge(a,b)`; `dagre.layout(g)`; lecture `g.node(id).x/.y` (synchrone).
```js
const g = new dagre.graphlib.Graph();
g.setGraph({ rankdir: 'LR' });
g.setDefaultEdgeLabel(() => ({}));
nodes.forEach((n) => g.setNode(n.id, { width: 150, height: 50 }));
edges.forEach((e) => g.setEdge(e.source, e.target));
dagre.layout(g);
const laid = nodes.map((n) => { const { x, y } = g.node(n.id);
  return { ...n, position: { x: x - 75, y: y - 25 } }; });  // dagre = centre, RF = coin haut-gauche
```
- **Intégration SFM**: alternative **synchrone** à ELK (pas de Promise, plus simple) pour graphes
  moyens; même remapping vers `position` RF.
- **Gotchas**: dagre positionne au **centre** du node → soustraire width/2, height/2 pour le coin
  attendu par React Flow; moins de contrôle fin qu'ELK sur ports/edges.
- **Licence**: **MIT** (utiliser `@dagrejs/dagre`, seul fork maintenu) ✅.

**Takeaways**: (1) dagre = layout hiérarchique **synchrone** plus simple qu'ELK; (2) corriger
centre→coin (−w/2,−h/2) pour React Flow; (3) `@dagrejs/dagre` MIT, fork maintenu.

---

## ⚠️ AnthorNet/SC-InteractiveMap — NE PAS copier

Licence **educational-only** (restrictive, non-OSS). Inspiration conceptuelle uniquement (UX carte
interactive, overlays de nœuds ressources). **Aucun snippet, aucune copie de code** dans SFM.

---

## Synthèse licences (flags)

| Source | Licence | Statut pour SFM |
| --- | --- | --- |
| 0xjc/SatisfactoryLP | LICENSE présent (probable MIT) | ✅ à vérifier |
| Zistack/Satisfactory-Optimizer | **non trouvée** | ⚠️ inspiration seule tant que non confirmée |
| greeny/SatisfactoryTools | probable MIT | ✅ à vérifier |
| factoriolab | **GPL-3.0** | ⚠️ copyleft fort — design only, zéro copie |
| yet-another-factory-planner | probable MIT | ✅ à vérifier |
| TheoKanning/SatisfactoryOptimizer | MIT | ✅ |
| xyflow/xyflow | MIT | ✅ |
| kieler/elkjs | EPL-2.0 | ✅ en dépendance npm |
| dagrejs/dagre | MIT | ✅ |
| AnthorNet/SC-InteractiveMap | educational-only | ⛔ ne pas copier |
