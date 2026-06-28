import { describe, it, expect } from "vitest";
import { generatedPlanToPlanCreate } from "./fromGeneratedPlan";
import type { GeneratedFactoryPlan } from "../../api/assistant/types";

const PLAN: GeneratedFactoryPlan = {
  name: "120 Iron Plate/min",
  description: "Generated from: 120 iron plate per minute",
  target_items: [{ item_id: "Desc_IronPlate_C", quantity: 120 }],
  steps: [],
  raw_inputs: [],
  build_order: [],
  assumptions: [],
  warnings: [],
};

describe("generatedPlanToPlanCreate", () => {
  it("maps name, description and targets to a PlanCreate payload", () => {
    expect(generatedPlanToPlanCreate(PLAN)).toEqual({
      name: "120 Iron Plate/min",
      description: "Generated from: 120 iron plate per minute",
      target_items: [{ item_id: "Desc_IronPlate_C", quantity: 120 }],
    });
  });

  it("does not carry over computed steps or raw inputs", () => {
    const result = generatedPlanToPlanCreate(PLAN);
    expect("steps" in result).toBe(false);
    expect("raw_inputs" in result).toBe(false);
  });
});
