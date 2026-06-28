import type { GeneratedFactoryPlan } from "../../api/assistant/types";
import type { PlanCreate } from "./types";

/**
 * Map a generated plan to the payload accepted by `POST /v1/plans`.
 *
 * Only the targets are persisted: steps, machine counts and raw inputs are
 * recomputed deterministically from the targets whenever the plan is opened,
 * so they are intentionally dropped here (single source of truth).
 */
export function generatedPlanToPlanCreate(plan: GeneratedFactoryPlan): PlanCreate {
  return {
    name: plan.name,
    description: plan.description,
    target_items: plan.target_items.map((t) => ({
      item_id: t.item_id,
      quantity: t.quantity,
    })),
  };
}
