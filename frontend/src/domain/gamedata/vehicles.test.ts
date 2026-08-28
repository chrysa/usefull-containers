import { describe, expect, it } from "vitest";
import { VEHICLE_SPECS, sizeVehicles, vehicleThroughputPerMin, vehiclesForRate } from "./vehicles";

describe("vehicleThroughputPerMin", () => {
  it("computes solid throughput from slots, stack size and round-trip time", () => {
    // truck: 48 slots * 100 stack / 2 min round trip = 2400/min
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.truck, 100, 2, false)).toBeCloseTo(2400, 6);
  });

  it("computes fluid throughput from fluid capacity and round-trip time", () => {
    // train, 1 car: 1600 m3 / 4 min round trip = 400 m3/min
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.train, 0, 4, true)).toBeCloseTo(400, 6);
  });

  it("multiplies fluid and solid throughput by car count for trains", () => {
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.train, 100, 1, true, 3)).toBeCloseTo(
      1600 * 3,
      6,
    );
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.train, 100, 1, false, 3)).toBeCloseTo(
      32 * 3 * 100,
      6,
    );
  });

  it("floors car count at 1 for trains, ignoring non-positive values", () => {
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.train, 0, 1, true, 0)).toBeCloseTo(1600, 6);
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.train, 0, 1, true, -5)).toBeCloseTo(1600, 6);
  });

  it("ignores car count for non-train vehicles", () => {
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.truck, 100, 1, false, 5)).toBeCloseTo(4800, 6);
  });

  it("returns null when the round trip is non-positive", () => {
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.truck, 100, 0, false)).toBeNull();
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.truck, 100, -1, false)).toBeNull();
  });

  it("returns null when a vehicle without fluid capacity is asked to carry fluid", () => {
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.truck, 0, 2, true)).toBeNull();
  });

  it("returns null for a solid payload with an unusable (non-positive) stack size", () => {
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.truck, 0, 2, false)).toBeNull();
    expect(vehicleThroughputPerMin(VEHICLE_SPECS.truck, -10, 2, false)).toBeNull();
  });
});

describe("vehiclesForRate", () => {
  it("returns 0 for a non-positive rate", () => {
    expect(vehiclesForRate(0, 100)).toBe(0);
    expect(vehiclesForRate(-5, 100)).toBe(0);
  });

  it("returns 0 for a non-positive per-vehicle throughput", () => {
    expect(vehiclesForRate(100, 0)).toBe(0);
    expect(vehiclesForRate(100, -1)).toBe(0);
  });

  it("returns exactly 1 vehicle when the rate exactly matches throughput", () => {
    expect(vehiclesForRate(100, 100)).toBe(1);
  });

  it("rounds up when the rate exceeds one vehicle's throughput", () => {
    expect(vehiclesForRate(101, 100)).toBe(2);
    expect(vehiclesForRate(250, 100)).toBe(3);
  });
});

describe("sizeVehicles", () => {
  it("sizes every vehicle kind for a solid flow with a valid stack size", () => {
    const sizing = sizeVehicles(1000, 100, 2, false);
    expect(sizing).toHaveLength(4);
    const truck = sizing.find((s) => s.kind === "truck");
    expect(truck?.perVehiclePerMin).toBeCloseTo(2400, 6);
    expect(truck?.vehiclesNeeded).toBe(1);
  });

  it("yields null counts for vehicles that cannot carry a fluid payload", () => {
    const sizing = sizeVehicles(500, 0, 2, true);
    const truck = sizing.find((s) => s.kind === "truck");
    const tractor = sizing.find((s) => s.kind === "tractor");
    const drone = sizing.find((s) => s.kind === "drone");
    expect(truck?.perVehiclePerMin).toBeNull();
    expect(truck?.vehiclesNeeded).toBeNull();
    expect(tractor?.perVehiclePerMin).toBeNull();
    expect(drone?.perVehiclePerMin).toBeNull();

    const train = sizing.find((s) => s.kind === "train");
    expect(train?.perVehiclePerMin).toBeCloseTo(800, 6);
  });

  it("propagates the train car count into vehicle sizing", () => {
    const singleCar = sizeVehicles(1000, 0, 1, true, 1);
    const tripleCar = sizeVehicles(1000, 0, 1, true, 3);
    const singleTrain = singleCar.find((s) => s.kind === "train");
    const tripleTrain = tripleCar.find((s) => s.kind === "train");
    expect(tripleTrain?.perVehiclePerMin).toBeCloseTo((singleTrain?.perVehiclePerMin ?? 0) * 3, 6);
  });

  it("returns zero vehicles needed for a zero rate", () => {
    const sizing = sizeVehicles(0, 100, 2, false);
    const truck = sizing.find((s) => s.kind === "truck");
    expect(truck?.vehiclesNeeded).toBe(0);
  });
});
