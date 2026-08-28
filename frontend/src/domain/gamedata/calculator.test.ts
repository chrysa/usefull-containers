import { describe, expect, it } from "vitest";
import type { ItemSummary, RecipeSummary } from "./types";
import { calculateProduction, flattenRequirements, summarizeMachines } from "./calculator";

const items: ItemSummary[] = [
  { id: "Desc_IronOre_C", name: "Iron Ore", description: "", stack_size: 100 },
  { id: "Desc_IronIngot_C", name: "Iron Ingot", description: "", stack_size: 100 },
  { id: "Desc_IronPlate_C", name: "Iron Plate", description: "", stack_size: 200 },
  { id: "Desc_IronRod_C", name: "Iron Rod", description: "", stack_size: 200 },
  { id: "Desc_ReinforcedPlate_C", name: "Reinforced Plate", description: "", stack_size: 100 },
  { id: "Desc_Water_C", name: "Water", description: "", stack_size: 0, is_fluid: true },
];

const recipes: RecipeSummary[] = [
  {
    id: "Recipe_IronIngot_C",
    name: "Iron Ingot",
    ingredients: [{ item_id: "Desc_IronOre_C", amount: 1 }],
    products: [{ item_id: "Desc_IronIngot_C", amount: 1 }],
    produced_in: ["Desc_SmelterMk1_C"],
    time: 2, // 1 * 60/2 = 30/min
  },
  {
    id: "Recipe_IronPlate_C",
    name: "Iron Plate",
    ingredients: [{ item_id: "Desc_IronIngot_C", amount: 3 }],
    products: [{ item_id: "Desc_IronPlate_C", amount: 2 }],
    produced_in: ["Desc_ConstructorMk1_C"],
    time: 6, // 2 * 60/6 = 20/min
  },
  {
    id: "Recipe_IronRod_C",
    name: "Iron Rod",
    ingredients: [{ item_id: "Desc_IronIngot_C", amount: 1 }],
    products: [{ item_id: "Desc_IronRod_C", amount: 1 }],
    produced_in: ["Desc_ConstructorMk1_C"],
    time: 4, // 1 * 60/4 = 15/min
  },
  {
    id: "Recipe_ReinforcedPlate_C",
    name: "Reinforced Plate",
    ingredients: [
      { item_id: "Desc_IronPlate_C", amount: 6 },
      { item_id: "Desc_IronRod_C", amount: 12 },
    ],
    products: [{ item_id: "Desc_ReinforcedPlate_C", amount: 1 }],
    produced_in: ["Desc_AssemblerMk1_C"],
    time: 12, // 1 * 60/12 = 5/min
  },
];

describe("calculateProduction", () => {
  it("builds a leaf node for a raw item with no recipe", () => {
    const node = calculateProduction("Desc_IronOre_C", 30, recipes, items);
    expect(node.item_id).toBe("Desc_IronOre_C");
    expect(node.item_name).toBe("Iron Ore");
    expect(node.quantity).toBe(30);
    expect(node.recipe_id).toBeNull();
    expect(node.children).toEqual([]);
    expect(node.machines).toBeNull();
  });

  it("falls back to the item id as the name when the item is unknown", () => {
    const node = calculateProduction("Desc_Unknown_C", 10, recipes, items);
    expect(node.item_name).toBe("Desc_Unknown_C");
  });

  it("builds a single-recipe node with machine and transport sizing", () => {
    const node = calculateProduction("Desc_IronIngot_C", 30, recipes, items);
    expect(node.recipe_id).toBe("Recipe_IronIngot_C");
    expect(node.recipe_name).toBe("Iron Ingot");
    expect(node.machines?.count).toBe(1);
    expect(node.machines?.machine_id).toBe("Desc_SmelterMk1_C");
    expect(node.transport.rate).toBe(30);
    expect(node.transport.is_fluid).toBe(false);
    expect(node.children).toHaveLength(1);
    expect(node.children[0]?.item_id).toBe("Desc_IronOre_C");
    expect(node.children[0]?.quantity).toBe(30);
  });

  it("scales ingredient quantities by the products-to-ingredients ratio", () => {
    // Iron Plate recipe: 3 ingot -> 2 plate. Requesting 40 plates needs 60 ingots.
    const node = calculateProduction("Desc_IronPlate_C", 40, recipes, items);
    expect(node.children[0]?.item_id).toBe("Desc_IronIngot_C");
    expect(node.children[0]?.quantity).toBeCloseTo(60, 6);
  });

  it("recurses through a multi-level, multi-ingredient production tree", () => {
    const node = calculateProduction("Desc_ReinforcedPlate_C", 5, recipes, items);
    expect(node.children).toHaveLength(2);
    const plateChild = node.children.find((c) => c.item_id === "Desc_IronPlate_C");
    const rodChild = node.children.find((c) => c.item_id === "Desc_IronRod_C");
    expect(plateChild?.quantity).toBeCloseTo(30, 6);
    expect(rodChild?.quantity).toBeCloseTo(60, 6);
    // Iron Plate branch recurses into Iron Ingot then Iron Ore.
    const ingotUnderPlate = plateChild?.children.find((c) => c.item_id === "Desc_IronIngot_C");
    expect(ingotUnderPlate?.quantity).toBeCloseTo(45, 6);
    const oreUnderIngot = ingotUnderPlate?.children.find((c) => c.item_id === "Desc_IronOre_C");
    expect(oreUnderIngot?.quantity).toBeCloseTo(45, 6);
  });

  it("returns a leaf when no recipe produces the requested item", () => {
    const node = calculateProduction("Desc_Water_C", 100, recipes, items);
    expect(node.recipe_id).toBeNull();
    expect(node.children).toEqual([]);
    expect(node.transport.is_fluid).toBe(true);
  });

  it("stops recursion on a cyclic recipe chain instead of looping forever", () => {
    const cyclicRecipes: RecipeSummary[] = [
      {
        id: "Recipe_A_From_B",
        name: "A from B",
        ingredients: [{ item_id: "Desc_B_C", amount: 1 }],
        products: [{ item_id: "Desc_A_C", amount: 1 }],
        produced_in: ["Desc_ConstructorMk1_C"],
        time: 1,
      },
      {
        id: "Recipe_B_From_A",
        name: "B from A",
        ingredients: [{ item_id: "Desc_A_C", amount: 1 }],
        products: [{ item_id: "Desc_B_C", amount: 1 }],
        produced_in: ["Desc_ConstructorMk1_C"],
        time: 1,
      },
    ];
    const node = calculateProduction("Desc_A_C", 10, cyclicRecipes, items);
    // Cycle back to "Desc_A_C" is caught by the visited set and becomes a leaf.
    const bChild = node.children[0];
    expect(bChild?.item_id).toBe("Desc_B_C");
    const aGrandchild = bChild?.children[0];
    expect(aGrandchild?.item_id).toBe("Desc_A_C");
    expect(aGrandchild?.children).toEqual([]);
    expect(aGrandchild?.recipe_id).toBeNull();
  });

  it("returns a leaf when quantity is zero", () => {
    const node = calculateProduction("Desc_IronOre_C", 0, recipes, items);
    expect(node.quantity).toBe(0);
  });
});

describe("flattenRequirements", () => {
  it("returns a single raw requirement for a leaf node", () => {
    const node = calculateProduction("Desc_IronOre_C", 30, recipes, items);
    const flat = flattenRequirements(node);
    expect(flat).toEqual([
      { item_id: "Desc_IronOre_C", item_name: "Iron Ore", quantity: 30, is_raw: true, is_fluid: false },
    ]);
  });

  it("sums a raw item that appears in multiple branches", () => {
    const node = calculateProduction("Desc_ReinforcedPlate_C", 5, recipes, items);
    const flat = flattenRequirements(node);
    const ore = flat.find((r) => r.item_id === "Desc_IronOre_C");
    // ore comes only through the ingot branches: 45 (plate path) + 60 (rod path)
    expect(ore?.quantity).toBeCloseTo(105, 6);
    expect(ore?.is_raw).toBe(true);
  });

  it("only reports raw leaf items, never intermediate crafted items", () => {
    const node = calculateProduction("Desc_ReinforcedPlate_C", 5, recipes, items);
    const flat = flattenRequirements(node);
    expect(flat.some((r) => r.item_id === "Desc_IronPlate_C")).toBe(false);
    expect(flat.some((r) => r.item_id === "Desc_IronRod_C")).toBe(false);
    expect(flat.every((r) => r.item_id === "Desc_IronOre_C")).toBe(true);
  });

  it("sorts requirements by descending quantity", () => {
    const node = calculateProduction("Desc_ReinforcedPlate_C", 5, recipes, items);
    const flat = flattenRequirements(node);
    const quantities = flat.map((r) => r.quantity);
    expect(quantities).toEqual([...quantities].sort((a, b) => b - a));
  });
});

describe("summarizeMachines", () => {
  it("aggregates machine counts for a single-step tree", () => {
    const node = calculateProduction("Desc_IronIngot_C", 30, recipes, items);
    const summary = summarizeMachines(node);
    expect(summary).toEqual([
      { machine_id: "Desc_SmelterMk1_C", total_machines: 1, steps: 1 },
    ]);
  });

  it("aggregates machines across multiple recipe steps sharing a machine type", () => {
    const node = calculateProduction("Desc_ReinforcedPlate_C", 5, recipes, items);
    const summary = summarizeMachines(node);
    const constructor = summary.find((m) => m.machine_id === "Desc_ConstructorMk1_C");
    // Iron Rod: 60/15=4 machines (1 step). Iron Plate: 30/20=1.5 -> 2 machines (1 step).
    expect(constructor?.total_machines).toBe(6);
    expect(constructor?.steps).toBe(2);

    const smelter = summary.find((m) => m.machine_id === "Desc_SmelterMk1_C");
    // Iron Ingot demand: 45 (under plate) + 60 (under rod) = 105 -> 105/30 = 3.5 -> 4 machines,
    // across 2 distinct recipe steps (one per branch).
    expect(smelter?.total_machines).toBe(4);
    expect(smelter?.steps).toBe(2);

    const assembler = summary.find((m) => m.machine_id === "Desc_AssemblerMk1_C");
    expect(assembler?.total_machines).toBe(1);
    expect(assembler?.steps).toBe(1);
  });

  it("sorts entries by descending total machine count", () => {
    const node = calculateProduction("Desc_ReinforcedPlate_C", 5, recipes, items);
    const summary = summarizeMachines(node);
    const totals = summary.map((m) => m.total_machines);
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
  });

  it("skips raw leaf nodes and returns an empty summary for a raw item", () => {
    const node = calculateProduction("Desc_IronOre_C", 30, recipes, items);
    expect(summarizeMachines(node)).toEqual([]);
  });

  it("uses an 'unknown' machine key when produced_in is empty", () => {
    const recipeWithoutMachine: RecipeSummary = {
      id: "Recipe_Foo_C",
      name: "Foo",
      ingredients: [],
      products: [{ item_id: "Desc_Foo_C", amount: 1 }],
      produced_in: [],
      time: 2,
    };
    const node = calculateProduction("Desc_Foo_C", 30, [recipeWithoutMachine], items);
    const summary = summarizeMachines(node);
    expect(summary).toEqual([{ machine_id: "unknown", total_machines: 1, steps: 1 }]);
  });
});
