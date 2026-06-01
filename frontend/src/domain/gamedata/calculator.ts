// Production calculator — pure logic, no side effects
import type { ItemSummary, RecipeSummary } from "./types";
import {
  machineRequirement,
  transportRequirement,
  type MachineRequirement,
  type TransportRequirement,
} from "./logistics";

export interface CalculationNode {
  readonly item_id: string;
  readonly item_name: string;
  readonly quantity: number;
  readonly recipe_id: string | null;
  readonly recipe_name: string | null;
  readonly children: readonly CalculationNode[];
  /**
   * Machines needed to produce `quantity` of this item via its recipe.
   * null when the item is raw or the recipe time is unknown.
   */
  readonly machines: MachineRequirement | null;
  /** Conveyor/pipe sizing for delivering `quantity` of this item. */
  readonly transport: TransportRequirement;
}

export interface FlatRequirement {
  readonly item_id: string;
  readonly item_name: string;
  readonly quantity: number;
  /** true when no recipe exists → raw resource or hand-gathered item */
  readonly is_raw: boolean;
  /** Liquid/gas → routed through pipes rather than conveyors. */
  readonly is_fluid: boolean;
}

const MAX_DEPTH = 30;

function findItem(itemId: string, items: readonly ItemSummary[]): ItemSummary | undefined {
  return items.find((i) => i.id === itemId);
}

function leafNode(
  itemId: string,
  quantity: number,
  items: readonly ItemSummary[],
): CalculationNode {
  const item = findItem(itemId, items);
  return {
    item_id: itemId,
    item_name: item?.name ?? itemId,
    quantity,
    recipe_id: null,
    recipe_name: null,
    children: [],
    machines: null,
    transport: transportRequirement(quantity, item?.is_fluid ?? false),
  };
}

function buildNode(
  itemId: string,
  quantity: number,
  recipes: readonly RecipeSummary[],
  items: readonly ItemSummary[],
  visited: ReadonlySet<string>,
  depth: number,
): CalculationNode {
  if (depth > MAX_DEPTH || visited.has(itemId)) {
    return leafNode(itemId, quantity, items);
  }

  const recipe = recipes.find((r) => r.products.some((p) => p.item_id === itemId));
  const product = recipe?.products.find((p) => p.item_id === itemId);
  if (!recipe || !product) {
    return leafNode(itemId, quantity, items);
  }

  const item = findItem(itemId, items);
  const multiplier = quantity / product.amount;
  const nextVisited = new Set(visited).add(itemId);

  const children = recipe.ingredients.map((ing) =>
    buildNode(ing.item_id, ing.amount * multiplier, recipes, items, nextVisited, depth + 1),
  );

  return {
    item_id: itemId,
    item_name: item?.name ?? itemId,
    quantity,
    recipe_id: recipe.id,
    recipe_name: recipe.name,
    children,
    machines: machineRequirement(recipe, itemId, quantity),
    transport: transportRequirement(quantity, item?.is_fluid ?? false),
  };
}

/**
 * Calculate the full production tree for a given item and desired quantity.
 * Returns a recursive tree where leaves are raw resources.
 */
export function calculateProduction(
  targetItemId: string,
  quantity: number,
  recipes: readonly RecipeSummary[],
  items: readonly ItemSummary[],
): CalculationNode {
  return buildNode(targetItemId, quantity, recipes, items, new Set(), 0);
}

/**
 * Flatten a production tree into a list of leaf-level requirements.
 * Items that appear multiple times are summed together.
 */
export function flattenRequirements(node: CalculationNode): FlatRequirement[] {
  const acc = new Map<string, FlatRequirement>();

  function walk(n: CalculationNode): void {
    if (n.children.length === 0) {
      const existing = acc.get(n.item_id);
      if (existing) {
        acc.set(n.item_id, { ...existing, quantity: existing.quantity + n.quantity });
      } else {
        acc.set(n.item_id, {
          item_id: n.item_id,
          item_name: n.item_name,
          quantity: n.quantity,
          is_raw: n.recipe_id === null,
          is_fluid: n.transport.is_fluid,
        });
      }
    } else {
      for (const child of n.children) walk(child);
    }
  }

  walk(node);
  return [...acc.values()].sort((a, b) => b.quantity - a.quantity);
}

export interface MachineSummaryEntry {
  /** Machine class id (e.g. "Desc_ConstructorMk1_C"). */
  readonly machine_id: string;
  /** Whole machines summed across every recipe step using this machine. */
  readonly total_machines: number;
  /** How many distinct recipe steps run on this machine type. */
  readonly steps: number;
}

/**
 * Aggregate machine counts across the whole production tree, grouped by machine
 * type. Steps with unknown machine counts (missing recipe time) are skipped.
 */
export function summarizeMachines(root: CalculationNode): MachineSummaryEntry[] {
  const acc = new Map<string, { total: number; steps: number }>();

  function walk(n: CalculationNode): void {
    if (n.machines && n.machines.count > 0) {
      const key = n.machines.machine_id || "unknown";
      const cur = acc.get(key) ?? { total: 0, steps: 0 };
      acc.set(key, { total: cur.total + n.machines.count, steps: cur.steps + 1 });
    }
    for (const child of n.children) walk(child);
  }

  walk(root);
  return [...acc.entries()]
    .map(([machine_id, v]) => ({ machine_id, total_machines: v.total, steps: v.steps }))
    .sort((a, b) => b.total_machines - a.total_machines);
}
