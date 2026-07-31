// Planned-vs-actual diff, aligned on recipe className. Pure logic.

import { calculateProduction, type CalculationNode } from "@/domain/gamedata/calculator";
import type { ItemSummary, RecipeSummary } from "@/domain/gamedata/types";
import type { TargetItem } from "@/domain/plans/types";
import type { CompactSnapshot } from "./types";

export type DiffStatus = "OK" | "UNDER" | "OVER" | "MISSING" | "UNPLANNED" | "UNMATCHED";

export interface DiffRow {
  recipe_id: string;
  recipe_name: string | null;
  /** Clock-accurate machine-equivalents the plan needs (sum of exact). */
  planned: number;
  /** Built machine-equivalents (sum of overclock/100). */
  actual: number;
  /** actual - planned. */
  delta: number;
  status: DiffStatus;
}

/** Tolerance (in machine-equivalents) before a delta counts as UNDER/OVER. */
const EPS = 0.05;

interface PlannedEntry {
  exact: number;
  name: string | null;
}

/** Sum machines.exact per recipe_id across every target's production tree. */
function plannedByRecipe(
  targets: readonly TargetItem[],
  recipes: readonly RecipeSummary[],
  items: readonly ItemSummary[],
): Map<string, PlannedEntry> {
  const acc = new Map<string, PlannedEntry>();

  function walk(node: CalculationNode): void {
    if (node.recipe_id && node.machines && node.machines.exact > 0) {
      const cur = acc.get(node.recipe_id) ?? { exact: 0, name: node.recipe_name };
      cur.exact += node.machines.exact;
      if (cur.name === null) cur.name = node.recipe_name;
      acc.set(node.recipe_id, cur);
    }
    for (const child of node.children) walk(child);
  }

  for (const t of targets) {
    if (t.quantity <= 0) continue;
    walk(calculateProduction(t.item_id, t.quantity, recipes, items));
  }
  return acc;
}

/** Sum overclock/100 per recipe_id over built (recipe-bearing) machines. */
function actualByRecipe(snapshot: CompactSnapshot): Map<string, number> {
  const acc = new Map<string, number>();
  for (const b of snapshot.buildings) {
    if (!b.recipe_id) continue;
    acc.set(b.recipe_id, (acc.get(b.recipe_id) ?? 0) + b.overclock / 100);
  }
  return acc;
}

const STATUS_ORDER: Record<DiffStatus, number> = {
  MISSING: 0,
  UNDER: 1,
  OVER: 2,
  UNPLANNED: 3,
  UNMATCHED: 4,
  OK: 5,
};

export function diffPlanVsSnapshot(
  targets: readonly TargetItem[],
  snapshot: CompactSnapshot,
  recipes: readonly RecipeSummary[],
  items: readonly ItemSummary[],
): DiffRow[] {
  const planned = plannedByRecipe(targets, recipes, items);
  const actual = actualByRecipe(snapshot);
  const knownRecipeIds = new Set(recipes.map((r) => r.id));
  const recipeNameById = new Map(recipes.map((r) => [r.id, r.name]));

  const recipeIds = new Set<string>([...planned.keys(), ...actual.keys()]);
  const rows: DiffRow[] = [];

  for (const recipe_id of recipeIds) {
    const p = planned.get(recipe_id)?.exact ?? 0;
    const a = actual.get(recipe_id) ?? 0;
    const delta = a - p;
    const recipe_name =
      planned.get(recipe_id)?.name ?? recipeNameById.get(recipe_id) ?? null;

    let status: DiffStatus;
    if (p > 0 && a === 0) {
      status = "MISSING";
    } else if (p === 0 && a > 0) {
      status = knownRecipeIds.has(recipe_id) ? "UNPLANNED" : "UNMATCHED";
    } else if (delta < -EPS) {
      status = "UNDER";
    } else if (delta > EPS) {
      status = "OVER";
    } else {
      status = "OK";
    }

    rows.push({ recipe_id, recipe_name, planned: p, actual: a, delta, status });
  }

  rows.sort(
    (x, y) =>
      STATUS_ORDER[x.status] - STATUS_ORDER[y.status] ||
      x.recipe_id.localeCompare(y.recipe_id),
  );
  return rows;
}
