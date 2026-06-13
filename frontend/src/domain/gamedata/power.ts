// Power estimation — pure logic, no side effects.
//
// Each production building draws a fixed base power at 100% clock — a hard
// Satisfactory 1.0 constant. A factory's draw is the sum over its machines of
// base power × count. A few buildings (particle accelerator, quantum encoder,
// converter) have recipe-variable draw and can't be derived without per-recipe
// power data, so they are reported as unknown and excluded from the total.

export interface PowerEntry {
  /** Machine class id, e.g. "Desc_ConstructorMk1_C". */
  readonly machine_id: string;
  /** Whole machines of this type. */
  readonly machines: number;
  /** Total MW for this group at 100% clock, or null when the draw is unknown. */
  readonly megawatts: number | null;
}

export interface PowerSummary {
  /** Sum of MW across machine groups with a known draw. */
  readonly totalMW: number;
  /** Per-machine-type breakdown. */
  readonly entries: readonly PowerEntry[];
  /** true when at least one machine type has recipe-variable/unknown draw. */
  readonly hasUnknown: boolean;
}

// Canonical building key (Mk-tier stripped, lowercased) → base MW at 100% clock.
// Only manufacturing buildings appear here: extractors produce raw resources
// (no recipe → never aggregated into a machine summary). null = recipe-variable
// draw that we can't compute from the recipe alone.
const POWER_TABLE: Record<string, number | null> = {
  smelter: 4,
  foundry: 16,
  constructor: 4,
  assembler: 15,
  manufacturer: 55,
  refinery: 30,
  oilrefinery: 30,
  packager: 10,
  blender: 75,
  // Recipe-variable draw — reported as unknown:
  particleaccelerator: null,
  hadroncollider: null,
  quantumencoder: null,
  converter: null,
};

/**
 * Normalize a machine class id to a power-table key: strip the `Desc_` prefix,
 * the `_C` suffix and any `Mk<n>` tier (the data source is inconsistent about
 * including it, e.g. "Desc_Smelter_C" vs "Desc_ConstructorMk1_C").
 */
export function buildingKey(machineId: string): string {
  return machineId
    .replace(/^Desc_/, "")
    .replace(/_C$/, "")
    .replace(/Mk\d+$/i, "")
    .toLowerCase();
}

/** Base MW for one building of `machineId` at 100% clock, or null if unknown. */
export function buildingPower(machineId: string): number | null {
  if (!machineId) return null;
  const key = buildingKey(machineId);
  return key in POWER_TABLE ? POWER_TABLE[key] : null;
}

/**
 * Total power draw for an aggregated machine summary. Groups whose building has
 * unknown draw contribute null megawatts and are left out of `totalMW`.
 */
export function summarizePower(
  machines: readonly { readonly machine_id: string; readonly total_machines: number }[],
): PowerSummary {
  const entries: PowerEntry[] = machines.map((m) => {
    const per = buildingPower(m.machine_id);
    return {
      machine_id: m.machine_id,
      machines: m.total_machines,
      megawatts: per === null ? null : per * m.total_machines,
    };
  });
  const totalMW = entries.reduce((sum, e) => sum + (e.megawatts ?? 0), 0);
  const hasUnknown = entries.some((e) => e.megawatts === null);
  return { totalMW, entries, hasUnknown };
}
