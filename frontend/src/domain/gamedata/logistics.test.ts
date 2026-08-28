import { describe, expect, it } from "vitest";
import type { RecipeSummary } from "./types";
import {
  BELT_TIERS,
  PIPE_TIERS,
  countForTier,
  linesForRate,
  machineRequirement,
  singleMachineOutput,
  tiersFor,
  transportRequirement,
} from "./logistics";

const ironPlateRecipe: RecipeSummary = {
  id: "Recipe_IronPlate_C",
  name: "Iron Plate",
  ingredients: [{ item_id: "Desc_IronIngot_C", amount: 3 }],
  products: [{ item_id: "Desc_IronPlate_C", amount: 2 }],
  produced_in: ["Desc_ConstructorMk1_C"],
  time: 6, // 1 machine = 2 * 60/6 = 20/min
};

describe("tiersFor", () => {
  it("returns belt tiers for solids", () => {
    expect(tiersFor(false)).toBe(BELT_TIERS);
  });

  it("returns pipe tiers for fluids", () => {
    expect(tiersFor(true)).toBe(PIPE_TIERS);
  });
});

describe("singleMachineOutput", () => {
  it("computes per-minute output from amount and craft time", () => {
    expect(singleMachineOutput(ironPlateRecipe, "Desc_IronPlate_C")).toBeCloseTo(20, 6);
  });

  it("returns null when the recipe time is missing", () => {
    const { time: _time, ...recipeWithoutTime } = ironPlateRecipe;
    const recipe: RecipeSummary = recipeWithoutTime;
    expect(singleMachineOutput(recipe, "Desc_IronPlate_C")).toBeNull();
  });

  it("returns null when the recipe time is zero or negative", () => {
    expect(singleMachineOutput({ ...ironPlateRecipe, time: 0 }, "Desc_IronPlate_C")).toBeNull();
    expect(singleMachineOutput({ ...ironPlateRecipe, time: -5 }, "Desc_IronPlate_C")).toBeNull();
  });

  it("returns null when the item is not a product of the recipe", () => {
    expect(singleMachineOutput(ironPlateRecipe, "Desc_Screw_C")).toBeNull();
  });

  it("returns null when the product amount is zero or negative", () => {
    const recipe: RecipeSummary = {
      ...ironPlateRecipe,
      products: [{ item_id: "Desc_IronPlate_C", amount: 0 }],
    };
    expect(singleMachineOutput(recipe, "Desc_IronPlate_C")).toBeNull();
  });
});

describe("machineRequirement", () => {
  it("computes exact machine count for a rate that fits one machine exactly", () => {
    const req = machineRequirement(ironPlateRecipe, "Desc_IronPlate_C", 20);
    expect(req).not.toBeNull();
    expect(req?.machine_id).toBe("Desc_ConstructorMk1_C");
    expect(req?.exact).toBeCloseTo(1, 6);
    expect(req?.count).toBe(1);
    expect(req?.clock_percent).toBeCloseTo(100, 6);
  });

  it("rounds up to whole machines and reports the resulting clock percent", () => {
    const req = machineRequirement(ironPlateRecipe, "Desc_IronPlate_C", 25);
    expect(req?.exact).toBeCloseTo(1.25, 6);
    expect(req?.count).toBe(2);
    expect(req?.clock_percent).toBeCloseTo(62.5, 6);
  });

  it("falls back to an empty machine_id when produced_in is empty", () => {
    const recipe: RecipeSummary = { ...ironPlateRecipe, produced_in: [] };
    const req = machineRequirement(recipe, "Desc_IronPlate_C", 20);
    expect(req?.machine_id).toBe("");
  });

  it("returns null for a non-positive rate", () => {
    expect(machineRequirement(ironPlateRecipe, "Desc_IronPlate_C", 0)).toBeNull();
    expect(machineRequirement(ironPlateRecipe, "Desc_IronPlate_C", -1)).toBeNull();
  });

  it("returns null when the underlying single-machine output is not computable", () => {
    const { time: _time, ...recipeWithoutTime } = ironPlateRecipe;
    const recipe: RecipeSummary = recipeWithoutTime;
    expect(machineRequirement(recipe, "Desc_IronPlate_C", 20)).toBeNull();
  });
});

describe("linesForRate", () => {
  it("returns 0 for a non-positive rate", () => {
    expect(linesForRate(0, BELT_TIERS[0]!)).toBe(0);
    expect(linesForRate(-10, BELT_TIERS[0]!)).toBe(0);
  });

  it("returns 1 line when the rate exactly matches capacity", () => {
    expect(linesForRate(60, BELT_TIERS[0]!)).toBe(1);
  });

  it("rounds up when the rate exceeds one line's capacity", () => {
    expect(linesForRate(61, BELT_TIERS[0]!)).toBe(2);
    expect(linesForRate(120, BELT_TIERS[0]!)).toBe(2);
  });
});

describe("transportRequirement", () => {
  it("sizes a solid flow across belt tiers", () => {
    const req = transportRequirement(90, false);
    expect(req.is_fluid).toBe(false);
    expect(req.rate).toBe(90);
    expect(req.min_single_tier).toBe("Mk.2");
    expect(countForTier(req, "Mk.1")).toBe(2);
    expect(countForTier(req, "Mk.2")).toBe(1);
  });

  it("sizes a fluid flow across pipe tiers", () => {
    const req = transportRequirement(450, true);
    expect(req.is_fluid).toBe(true);
    expect(req.min_single_tier).toBe("Mk.2");
    expect(countForTier(req, "Mk.1")).toBe(2);
    expect(countForTier(req, "Mk.2")).toBe(1);
  });

  it("reports the smallest tier and zero counts for a zero rate", () => {
    const req = transportRequirement(0, false);
    expect(req.min_single_tier).toBe("Mk.1");
    expect(req.per_tier.every((t) => t.count === 0)).toBe(true);
  });

  it("returns null min_single_tier when even the top tier can't carry it alone", () => {
    const req = transportRequirement(2000, false);
    expect(req.min_single_tier).toBeNull();
    expect(countForTier(req, "Mk.6")).toBe(2);
  });
});

describe("countForTier", () => {
  it("returns 0 for an unknown tier id", () => {
    const req = transportRequirement(90, false);
    expect(countForTier(req, "Mk.99")).toBe(0);
  });
});
