import { describe, expect, it } from "vitest";
import { mapBlueprint } from "./mapper";

describe("mapBlueprint", () => {
  it("maps a fully populated raw response", () => {
    const raw = {
      name: "MainBus",
      description: "Main bus segment",
      icon_id: 42,
      color: { r: 1, g: 0.5, b: 0.25, a: 1 },
      has_sbp: true,
      has_cfg: true,
      size_bytes: 12345,
      modified_at: "2024-03-15T12:00:00.000Z",
      cfg_raw: { key: "value" },
      tags: ["logistics", "tier-3"],
    };

    expect(mapBlueprint(raw)).toEqual({
      name: "MainBus",
      description: "Main bus segment",
      icon_id: 42,
      color: { r: 1, g: 0.5, b: 0.25, a: 1 },
      has_sbp: true,
      has_cfg: true,
      size_bytes: 12345,
      modified_at: "2024-03-15T12:00:00.000Z",
      cfg_raw: { key: "value" },
      tags: ["logistics", "tier-3"],
    });
  });

  it("fills in defaults for missing optional fields", () => {
    const mapped = mapBlueprint({});

    expect(mapped).toEqual({
      name: "",
      description: "",
      icon_id: 0,
      color: null,
      has_sbp: false,
      has_cfg: false,
      size_bytes: 0,
      modified_at: null,
      cfg_raw: null,
      tags: [],
    });
  });

  it("coerces non-array tags to an empty array", () => {
    const mapped = mapBlueprint({ tags: "not-an-array" });

    expect(mapped.tags).toEqual([]);
  });

  it("coerces truthy/falsy has_sbp and has_cfg to booleans", () => {
    const mapped = mapBlueprint({ has_sbp: 1, has_cfg: 0 });

    expect(mapped.has_sbp).toBe(true);
    expect(mapped.has_cfg).toBe(false);
  });

  it("coerces string numeric fields via Number()", () => {
    const mapped = mapBlueprint({ icon_id: "7", size_bytes: "999" });

    expect(mapped.icon_id).toBe(7);
    expect(mapped.size_bytes).toBe(999);
  });

  it("stringifies non-string name and description via String()", () => {
    const mapped = mapBlueprint({ name: 123, description: 0 });

    expect(mapped.name).toBe("123");
    expect(mapped.description).toBe("0");
  });

  it("falls back to an empty string when name/description are null", () => {
    const mapped = mapBlueprint({ name: null, description: null });

    expect(mapped.name).toBe("");
    expect(mapped.description).toBe("");
  });
});
