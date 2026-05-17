// Production calculator — pure logic, no side effects
import type { ItemSummary, RecipeSummary } from "./types";

export interface CalculationNode {
  readonly item_id: string;
  readonly item_name: string;
  readonly quantity: number;
  readonly recipe_id: string | null;
  readonly recipe_name: string | null;
  readonly children: readonly CalculationNode[];
}

export interface FlatRequirement {
  readonly item_id: string;
  readonly item_name: string;
  readonly quantity: number;
  /** true when no recipe exists → raw resource or hand-gathered item */
  readonly is_raw: boolean;
}

const MAX_DEPTH = 30;

function findItemName(itemId: string, items: readonly ItemSummary[]): string {
  return items.find((i) => i.id === itemId)?.name ?? itemId;
}

function buildNode(
  itemId: string,
  quantity: number,
  recipes: readonly RecipeSummary[],
  items: readonly ItemSummary[],
  visited: ReadonlySet<string>,
  depth: number,
): CalculationNode {
  const itemName = findItemName(itemId, items);

  if (depth > MAX_DEPTH || visited.has(itemId)) {
    return { item_id: itemId, item_name: itemName, quantity, recipe_id: null, recipe_name: null, children: [] };
  }

  const recipe = recipes.find((r) => r.products.some((p) => p.item_id === itemId));
  if (!recipe) {
    return { item_id: itemId, item_name: itemName, quantity, recipe_id: null, recipe_name: null, children: [] };
  }

  const product = recipe.products.find((p) => p.item_id === itemId);
  if (!product) {
    return { item_id: itemId, item_name: itemName, quantity, recipe_id: null, recipe_name: null, children: [] };
  }

  const multiplier = quantity / product.amount;
  const nextVisited = new Set(visited).add(itemId);

  const children = recipe.ingredients.map((ing) =>
    buildNode(ing.item_id, ing.amount * multiplier, recipes, items, nextVisited, depth + 1),
  );

  return { item_id: itemId, item_name: itemName, quantity, recipe_id: recipe.id, recipe_name: recipe.name, children };
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
        });
      }
    } else {
      for (const child of n.children) walk(child);
    }
  }

  walk(node);
  return [...acc.values()].sort((a, b) => b.quantity - a.quantity);
}
