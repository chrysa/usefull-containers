import { describe, expect, it } from "vitest";
import { reduce, type RawSave } from "./reduce";

function rawSave(): RawSave {
  return {
    header: { playDurationSeconds: 1200, saveVersion: 46 },
    levels: {
      Persistent: {
        objects: [
          {
            typePath: "/Game/FactoryGame/Buildable/Factory/.../Build_ConstructorMk1_C",
            instanceName: "Persistent:PersistentLevel.Build_ConstructorMk1_C_42",
            transform: { translation: { x: 1, y: 2, z: 3 } },
            properties: {
              mCurrentPotential: { value: 1.5 },
              mCurrentRecipe: {
                value: { pathName: "/Game/.../Recipe_IronPlate_C.Recipe_IronPlate_C" },
              },
              mIsProducing: { value: true },
            },
          },
          {
            typePath: "/Game/.../Build_Wall_8x4_C",
            instanceName: "Persistent:PersistentLevel.Build_Wall_8x4_C_1",
            properties: {},
          },
        ],
      },
    },
  };
}

describe("reduce", () => {
  it("extracts production buildings with recipe className and overclock", () => {
    const snap = reduce(rawSave(), "MyWorld_autosave_0");
    expect(snap.save_name).toBe("MyWorld_autosave_0");
    expect(snap.play_time).toBe(1200);
    expect(snap.buildings).toHaveLength(1);
    const b = snap.buildings[0];
    expect(b).toBeDefined();
    if (!b) return;
    expect(b.machine_id).toBe("Build_ConstructorMk1_C");
    expect(b.recipe_id).toBe("Recipe_IronPlate_C");
    expect(b.overclock).toBe(150);
    expect(b.state).toBe("active");
  });

  it("marks a building with no recipe as off with null recipe_id", () => {
    const raw = rawSave();
    const constructor = raw.levels.Persistent?.objects[0];
    expect(constructor).toBeDefined();
    if (!constructor) return;
    constructor.properties = { mCurrentPotential: { value: 1.0 } };

    const snap = reduce(raw, "w");
    const b = snap.buildings[0];
    expect(b).toBeDefined();
    if (!b) return;
    expect(b.recipe_id).toBeNull();
    expect(b.state).toBe("off");
    expect(b.overclock).toBe(100);
  });
});
