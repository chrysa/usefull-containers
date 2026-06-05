// Vehicle sizing — pure logic, no side effects.
//
// Unlike conveyors/pipes (whose throughput is a hard game constant), a
// vehicle's throughput depends on its payload AND the route round-trip time,
// which is map-specific. So these numbers are ESTIMATES driven by user input
// (round-trip time, train car count); the UI must label them as such.

export type VehicleKind = "train" | "truck" | "tractor" | "drone";

export interface VehicleSpec {
  readonly kind: VehicleKind;
  /** Solid inventory slots (per freight car for trains). Each slot holds 1 stack. */
  readonly slots: number;
  /** Fluid payload per trip in m³ (per freight car for trains). 0 = cannot carry fluids. */
  readonly fluidCapacity: number;
}

// Satisfactory 1.0 reference payloads. Trains are expressed per freight car
// and multiplied by the car count; the others are single-vehicle.
export const VEHICLE_SPECS: Record<VehicleKind, VehicleSpec> = {
  train: { kind: "train", slots: 32, fluidCapacity: 1600 },
  truck: { kind: "truck", slots: 48, fluidCapacity: 0 },
  tractor: { kind: "tractor", slots: 25, fluidCapacity: 0 },
  drone: { kind: "drone", slots: 9, fluidCapacity: 0 },
};

export const VEHICLE_KINDS = Object.keys(VEHICLE_SPECS) as VehicleKind[];

export interface VehicleSizing {
  readonly kind: VehicleKind;
  /** Items/min (or m³/min) one vehicle delivers; null when it can't carry this payload. */
  readonly perVehiclePerMin: number | null;
  /** Whole vehicles needed for the target rate; null when not computable. */
  readonly vehiclesNeeded: number | null;
}

/**
 * Per-minute throughput of one vehicle for the given payload, or null when the
 * vehicle cannot carry it (e.g. a truck for a fluid) or inputs are unusable
 * (non-positive round-trip, unknown stack size for a solid).
 */
export function vehicleThroughputPerMin(
  spec: VehicleSpec,
  stackSize: number,
  roundTripMinutes: number,
  isFluid: boolean,
  cars = 1,
): number | null {
  if (roundTripMinutes <= 0) return null;
  const tripsPerMin = 1 / roundTripMinutes;
  const carMult = spec.kind === "train" ? Math.max(1, cars) : 1;

  if (isFluid) {
    const perTrip = spec.fluidCapacity * carMult;
    return perTrip > 0 ? perTrip * tripsPerMin : null;
  }
  if (stackSize <= 0) return null;
  return spec.slots * carMult * stackSize * tripsPerMin;
}

/** Whole vehicles of throughput `perVehiclePerMin` needed to move `rate`. */
export function vehiclesForRate(rate: number, perVehiclePerMin: number): number {
  if (perVehiclePerMin <= 0 || rate <= 0) return 0;
  return Math.ceil(rate / perVehiclePerMin - 1e-9);
}

/**
 * Size every vehicle kind for a flow of `rate` (items/min for solids, m³/min
 * for fluids). Kinds that can't carry the payload yield null counts.
 */
export function sizeVehicles(
  rate: number,
  stackSize: number,
  roundTripMinutes: number,
  isFluid: boolean,
  cars = 1,
): VehicleSizing[] {
  return VEHICLE_KINDS.map((kind) => {
    const perVehiclePerMin = vehicleThroughputPerMin(
      VEHICLE_SPECS[kind],
      stackSize,
      roundTripMinutes,
      isFluid,
      cars,
    );
    const vehiclesNeeded =
      perVehiclePerMin !== null ? vehiclesForRate(rate, perVehiclePerMin) : null;
    return { kind, perVehiclePerMin, vehiclesNeeded };
  });
}
