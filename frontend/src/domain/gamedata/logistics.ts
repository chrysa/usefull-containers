// Logistics & machine sizing — pure logic, no side effects.
//
// Conveyor and pipe throughputs are hard game constants (Satisfactory 1.0), so
// belt/pipe sizing is exact. Machine counts are exact too, derived from the
// recipe craft time. Vehicle (train/drone/truck) sizing is intentionally NOT
// here — it depends on route round-trip time and is handled separately as an
// explicitly approximate estimate.

import type { RecipeSummary } from "./types";

// ── Transport tier tables (items or m³ per minute) ───────────────────────────

export interface TransportTier {
  /** Stable key, e.g. "Mk.3". */
  readonly id: string;
  /** Throughput at 100% in items/min (belts) or m³/min (pipes). */
  readonly capacity: number;
}

/** Conveyor belts Mk.1 → Mk.6 (items/min). */
export const BELT_TIERS: readonly TransportTier[] = [
  { id: "Mk.1", capacity: 60 },
  { id: "Mk.2", capacity: 120 },
  { id: "Mk.3", capacity: 270 },
  { id: "Mk.4", capacity: 480 },
  { id: "Mk.5", capacity: 780 },
  { id: "Mk.6", capacity: 1200 },
] as const;

/** Pipelines Mk.1 → Mk.2 (m³/min). */
export const PIPE_TIERS: readonly TransportTier[] = [
  { id: "Mk.1", capacity: 300 },
  { id: "Mk.2", capacity: 600 },
] as const;

export function tiersFor(isFluid: boolean): readonly TransportTier[] {
  return isFluid ? PIPE_TIERS : BELT_TIERS;
}

// ── Machine sizing ────────────────────────────────────────────────────────────

export interface MachineRequirement {
  /** Machine class id from the recipe (e.g. "Desc_ConstructorMk1_C"), or "". */
  readonly machine_id: string;
  /** Fractional machine count needed to hit the target rate (clock-accurate). */
  readonly exact: number;
  /** Whole machines needed (each capped at 100% clock). */
  readonly count: number;
  /**
   * Clock % the `count` machines would each run at to produce exactly the
   * target rate (0–100). Useful to show "3 machines @ 83%".
   */
  readonly clock_percent: number;
}

/**
 * One machine's per-minute output for the product `itemId` at 100% clock,
 * or null when the recipe time is unknown/invalid (can't be computed).
 */
export function singleMachineOutput(recipe: RecipeSummary, itemId: string): number | null {
  const time = recipe.time ?? 0;
  if (!Number.isFinite(time) || time <= 0) return null;
  const product = recipe.products.find((p) => p.item_id === itemId);
  if (!product || product.amount <= 0) return null;
  return product.amount * (60 / time);
}

/**
 * Machines required to produce `rate` (items/min) of `itemId` via `recipe`.
 * Returns null when not computable (missing time / product).
 */
export function machineRequirement(
  recipe: RecipeSummary,
  itemId: string,
  rate: number,
): MachineRequirement | null {
  const perMachine = singleMachineOutput(recipe, itemId);
  if (perMachine === null || rate <= 0) return null;
  const exact = rate / perMachine;
  const count = Math.ceil(exact - 1e-9);
  const clock_percent = count > 0 ? (exact / count) * 100 : 0;
  return {
    machine_id: recipe.produced_in[0] ?? "",
    exact,
    count,
    clock_percent,
  };
}

// ── Belt / pipe sizing ──────────────────────────────────────────────────────

export interface TierCount {
  readonly tier: string;
  readonly capacity: number;
  /** Number of belts/pipes of this tier to carry the full rate. */
  readonly count: number;
}

export interface TransportRequirement {
  readonly is_fluid: boolean;
  /** Flow rate in items/min (solids) or m³/min (fluids). */
  readonly rate: number;
  /**
   * Smallest tier that carries the whole rate on a SINGLE line, or null when
   * even the top tier is insufficient (then multiple top-tier lines needed).
   */
  readonly min_single_tier: string | null;
  /** Count needed at every tier, for the "detail" view. */
  readonly per_tier: readonly TierCount[];
}

/** Lines of `tier` needed to carry `rate`. Always ≥ 1 for a positive rate. */
export function linesForRate(rate: number, tier: TransportTier): number {
  if (rate <= 0) return 0;
  return Math.ceil(rate / tier.capacity - 1e-9);
}

/**
 * Full transport requirement for a flow of `rate` of a (fluid or solid) item.
 */
export function transportRequirement(rate: number, isFluid: boolean): TransportRequirement {
  const tiers = tiersFor(isFluid);
  const per_tier = tiers.map((tier) => ({
    tier: tier.id,
    capacity: tier.capacity,
    count: linesForRate(rate, tier),
  }));
  const single = tiers.find((tier) => rate <= tier.capacity);
  return {
    is_fluid: isFluid,
    rate,
    min_single_tier: single?.id ?? null,
    per_tier,
  };
}

/** Pick the count for a chosen tier id from a requirement (0 if not found). */
export function countForTier(req: TransportRequirement, tierId: string): number {
  return req.per_tier.find((t) => t.tier === tierId)?.count ?? 0;
}
