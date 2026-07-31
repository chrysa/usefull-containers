import { describe, expect, it } from "vitest";
import type { ItemSummary, RecipeSummary } from "@/domain/gamedata/types";
import type { TargetItem } from "@/domain/plans/types";
import type { CompactSnapshot } from "./types";
import { diffPlanVsSnapshot } from "./diff";

const items: ItemSummary[] = [
  { id: "Desc_IronPlate_C", name: "Iron Plate", description: "", stack_size: 200 },
  { id: "Desc_IronIngot_C", name: "Iron Ingot", description: "", stack_size: 100 },
];

const recipes: RecipeSummary[] = [
  {
    id: "Recipe_IronPlate_C",
    name: "Iron Plate",
    ingredients: [{ item_id: "Desc_IronIngot_C", amount: 3 }],
    products: [{ item_id: "Desc_IronPlate_C", amount: 2 }],
    produced_in: ["Desc_ConstructorMk1_C"],
    time: 6, // 1 machine = 2 * 60/6 = 20/min
  },
];

const targets: TargetItem[] = [{ item_id: "Desc_IronPlate_C", quantity: 20 }];
// planned exactly 1 constructor for Recipe_IronPlate_C
// (Desc_IronIngot_C has no recipe here -> treated as raw -> no planned row)

function snapshot(buildings: CompactSnapshot["buildings"]): CompactSnapshot {
  return { save_name: "w", play_time: 0, buildings, power_grids: [] };
}

function bld(recipe_id: string | null, overclock: number): CompactSnapshot["buildings"][number] {
  return {
    machine_id: "Build_ConstructorMk1_C",
    recipe_id,
    overclock,
    state: recipe_id ? "active" : "off",
    somersloops: 0,
    floor_id: null,
  };
}

describe("diffPlanVsSnapshot", () => {
  it("reports OK when actual matches planned", () => {
    const rows = diffPlanVsSnapshot(targets, snapshot([bld("Recipe_IronPlate_C", 100)]), recipes, items);
    const row = rows.find((r) => r.recipe_id === "Recipe_IronPlate_C")!;
    expect(row.planned).toBeCloseTo(1, 3);
    expect(row.actual).toBeCloseTo(1, 3);
    expect(row.status).toBe("OK");
  });

  it("reports MISSING when planned but no actual", () => {
    const rows = diffPlanVsSnapshot(targets, snapshot([]), recipes, items);
    const row = rows.find((r) => r.recipe_id === "Recipe_IronPlate_C")!;
    expect(row.status).toBe("MISSING");
    expect(row.actual).toBe(0);
  });

  it("reports UNDER and OVER from the capacity delta", () => {
    const under = diffPlanVsSnapshot(targets, snapshot([bld("Recipe_IronPlate_C", 50)]), recipes, items);
    expect(under.find((r) => r.recipe_id === "Recipe_IronPlate_C")!.status).toBe("UNDER");

    const over = diffPlanVsSnapshot(
      targets,
      snapshot([bld("Recipe_IronPlate_C", 100), bld("Recipe_IronPlate_C", 100)]),
      recipes,
      items,
    );
    expect(over.find((r) => r.recipe_id === "Recipe_IronPlate_C")!.status).toBe("OVER");
  });

  it("reports UNPLANNED for a known recipe built but not in the plan's chain", () => {
    const recipesPlus: RecipeSummary[] = [
      ...recipes,
      {
        id: "Recipe_Concrete_C",
        name: "Concrete",
        ingredients: [{ item_id: "Desc_Stone_C", amount: 3 }],
        products: [{ item_id: "Desc_Cement_C", amount: 1 }],
        produced_in: ["Desc_ConstructorMk1_C"],
        time: 4,
      },
    ];
    // Concrete is not in the iron-plate chain, so it is built-but-not-planned.
    const row = diffPlanVsSnapshot(
      targets,
      snapshot([bld("Recipe_Concrete_C", 100)]),
      recipesPlus,
      items,
    ).find((r) => r.recipe_id === "Recipe_Concrete_C")!;
    expect(row.status).toBe("UNPLANNED");
  });

  it("reports UNMATCHED for a snapshot recipe absent from gamedata", () => {
    const row = diffPlanVsSnapshot(targets, snapshot([bld("Recipe_Unknown_C", 100)]), recipes, items).find(
      (r) => r.recipe_id === "Recipe_Unknown_C",
    )!;
    expect(row.status).toBe("UNMATCHED");
  });

  it("ignores idle buildings with no recipe", () => {
    const rows = diffPlanVsSnapshot(targets, snapshot([bld(null, 100)]), recipes, items);
    expect(rows.every((r) => r.recipe_id !== null)).toBe(true);
  });
});
