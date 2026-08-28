import { describe, expect, it } from "vitest";
import { buildingKey, buildingPower, summarizePower } from "./power";

describe("buildingKey", () => {
  it("strips the Desc_ prefix and _C suffix", () => {
    expect(buildingKey("Desc_Smelter_C")).toBe("smelter");
  });

  it("strips a Mk<n> tier suffix", () => {
    expect(buildingKey("Desc_ConstructorMk1_C")).toBe("constructor");
  });

  it("is case-insensitive on the Mk tier and lowercases the result", () => {
    expect(buildingKey("Desc_AssemblerMK2_C")).toBe("assembler");
  });

  it("returns an already-bare key unchanged (lowercased)", () => {
    expect(buildingKey("Foundry")).toBe("foundry");
  });
});

describe("buildingPower", () => {
  it("returns the known base MW for a manufacturing building", () => {
    expect(buildingPower("Desc_Smelter_C")).toBe(4);
    expect(buildingPower("Desc_Manufacturer_C")).toBe(55);
  });

  it("resolves Mk-tiered ids to the same base MW", () => {
    expect(buildingPower("Desc_ConstructorMk1_C")).toBe(4);
  });

  it("returns null for a recipe-variable-draw building", () => {
    expect(buildingPower("Desc_ParticleAccelerator_C")).toBeNull();
  });

  it("returns null for an unrecognized machine id", () => {
    expect(buildingPower("Desc_MinerMk1_C")).toBeNull();
  });

  it("returns null for an empty machine id", () => {
    expect(buildingPower("")).toBeNull();
  });
});

describe("summarizePower", () => {
  it("sums known draws across machine groups", () => {
    const summary = summarizePower([
      { machine_id: "Desc_Smelter_C", total_machines: 3 },
      { machine_id: "Desc_ConstructorMk1_C", total_machines: 2 },
    ]);
    expect(summary.totalMW).toBe(3 * 4 + 2 * 4);
    expect(summary.hasUnknown).toBe(false);
    expect(summary.entries).toEqual([
      { machine_id: "Desc_Smelter_C", machines: 3, megawatts: 12 },
      { machine_id: "Desc_ConstructorMk1_C", machines: 2, megawatts: 8 },
    ]);
  });

  it("excludes unknown-draw groups from the total but flags hasUnknown", () => {
    const summary = summarizePower([
      { machine_id: "Desc_Smelter_C", total_machines: 1 },
      { machine_id: "Desc_ParticleAccelerator_C", total_machines: 1 },
    ]);
    expect(summary.totalMW).toBe(4);
    expect(summary.hasUnknown).toBe(true);
    expect(summary.entries.find((e) => e.machine_id === "Desc_ParticleAccelerator_C")?.megawatts)
      .toBeNull();
  });

  it("returns a zero total and no entries for an empty input", () => {
    const summary = summarizePower([]);
    expect(summary.totalMW).toBe(0);
    expect(summary.hasUnknown).toBe(false);
    expect(summary.entries).toEqual([]);
  });
});
