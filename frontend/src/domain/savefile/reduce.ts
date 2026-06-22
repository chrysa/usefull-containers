// Reduce a raw @etothepii parser output into a CompactSnapshot.
// Ported from S.A.T. scripts/parse-save-json.js (browser-pure; no fs/Node).

import type { CompactSnapshot, SnapshotBuilding, SnapshotPowerGrid } from "./types";

// Minimal structural typing of the raw parser output we rely on.
export interface RawObject {
  typePath?: string;
  instanceName?: string;
  transform?: { translation?: { x?: number; y?: number; z?: number } };
  properties?: Record<string, { value?: unknown; values?: unknown[] }>;
}
export interface RawLevel {
  objects: RawObject[];
}
export interface RawSave {
  header?: { playDurationSeconds?: number; saveVersion?: number };
  levels: Record<string, RawLevel>;
}

/** Production building classes we surface (recipe-bearing machines + extractors). */
const PRODUCTION_CLASSES = new Set<string>([
  "Build_SmelterMk1_C",
  "Build_FoundryMk1_C",
  "Build_ConstructorMk1_C",
  "Build_AssemblerMk1_C",
  "Build_ManufacturerMk1_C",
  "Build_OilRefinery_C",
  "Build_Blender_C",
  "Build_Packager_C",
  "Build_HadronCollider_C",
  "Build_QuantumEncoder_C",
  "Build_Converter_C",
  "Build_GeneratorNuclear_C",
  "Build_MinerMk1_C",
  "Build_MinerMk2_C",
  "Build_MinerMk3_C",
  "Build_WaterPump_C",
  "Build_OilPump_C",
  "Build_FrackingExtractor_C",
]);

/** Last segment of an Unreal class path.
 *
 * Real saves use dot-notation for the final segment: `.../Foo_C.Foo_C`
 * → last dot-segment is "Foo_C".
 *
 * typePath values use slash-separated paths: `/Game/.../Build_Foo_C`
 * → split on dot gives `/Build_Foo_C`; strip leading slash.
 */
function classKey(p: string | undefined): string {
  if (!p) return "";
  const parts = p.split(".");
  const last = parts[parts.length - 1];
  // Strip a leading slash left over from slash-only paths (typePath).
  const slashIdx = last.lastIndexOf("/");
  return slashIdx >= 0 ? last.slice(slashIdx + 1) : last;
}

function propVal(obj: RawObject, name: string): unknown {
  return obj.properties?.[name]?.value;
}

export function reduce(save: RawSave, saveName: string): CompactSnapshot {
  const allObjects: RawObject[] = Object.values(save.levels ?? {}).flatMap(
    (l) => l.objects ?? [],
  );

  // Floor detection via Priority Power Switches.
  // Data model: each FGPowerCircuit lists its components (buildings + switches).
  // A circuit containing exactly ONE PriorityPowerSwitch is treated as one floor,
  // and that switch's mBuildingTag becomes the floor label; buildings on that
  // circuit inherit it. Ambiguous (0 or >1 switch) circuits yield no floor_id.
  const allCircuits = allObjects.filter((o) => o.typePath?.includes("FGPowerCircuit"));
  const switchTagMap = new Map<string, string | null>();
  const instanceToCircuit = new Map<string, number>();
  const circuitSwitches = new Map<number, string[]>();

  for (const obj of allObjects) {
    if (!obj.typePath?.includes("PriorityPowerSwitch")) continue;
    const instBase = obj.instanceName?.split(".").pop();
    const tagRaw = obj.properties?.["mBuildingTag"]?.value;
    const tag = typeof tagRaw === "string" ? tagRaw : null;
    if (instBase) switchTagMap.set(instBase, tag);
  }

  for (const circuit of allCircuits) {
    const circuitID = propVal(circuit, "mCircuitID");
    if (typeof circuitID !== "number") continue;
    const componentsRaw = circuit.properties?.["mComponents"]?.values ?? [];
    const components = componentsRaw as Array<{
      pathName?: string;
      value?: { pathName?: string };
    }>;
    for (const comp of components) {
      const pn = comp?.pathName ?? comp?.value?.pathName ?? null;
      if (!pn) continue;
      const dotIdx = pn.lastIndexOf(".");
      if (dotIdx < 0) continue;
      const instBase = pn.slice(0, dotIdx).split(".").pop();
      if (!instBase) continue;
      const classK = instBase.replace(/_\d+$/, "");
      if (classK === "Build_PriorityPowerSwitch_C") {
        const list = circuitSwitches.get(circuitID) ?? [];
        list.push(instBase);
        circuitSwitches.set(circuitID, list);
      } else {
        instanceToCircuit.set(instBase, circuitID);
      }
    }
  }

  const circuitToSwitch = new Map<number, string>();
  for (const [cid, list] of circuitSwitches) {
    if (list.length === 1) circuitToSwitch.set(cid, list[0]);
  }

  // Production buildings.
  const buildings: SnapshotBuilding[] = allObjects
    .filter((o) => PRODUCTION_CLASSES.has(classKey(o.typePath)))
    .map((b) => {
      const key = classKey(b.typePath);

      const clockRaw =
        (propVal(b, "mCurrentPotential") as number | undefined) ??
        (propVal(b, "mPendingPotential") as number | undefined) ??
        1.0;
      const overclock = Math.round(Number(clockRaw) * 100);

      const recipeValRaw = b.properties?.["mCurrentRecipe"]?.value;
      const recipePath =
        recipeValRaw !== null &&
        recipeValRaw !== undefined &&
        typeof recipeValRaw === "object"
          ? (recipeValRaw as { pathName?: string }).pathName ?? null
          : null;
      const recipe_id = recipePath ? classKey(recipePath) : null;

      const isProducing = propVal(b, "mIsProducing");
      // `state` is informational only — the planned-vs-actual diff keys on
      // recipe_id and overclock, never on state. The paused/idle split is a
      // coarse approximation ported from S.A.T.: mCurrentRecipeChanged is an
      // event-ish flag, so "paused" vs "idle" is best-effort, not authoritative.
      const isStandby =
        propVal(b, "mIsCurrentlyProductionPaused") ??
        propVal(b, "mCurrentRecipeChanged") ??
        null;
      let state = "off";
      if (recipe_id) {
        if (isProducing === true || isProducing === undefined || isProducing === null) {
          state = "active";
        } else if (isProducing === false) {
          state = isStandby ? "paused" : "idle";
        }
      }

      const somersloopsRaw =
        (propVal(b, "mNumSomersloopsSlotted") as number | undefined) ??
        (propVal(b, "mNumSlotsUsedForced") as number | undefined) ??
        0;
      const somersloops = Number(somersloopsRaw);

      const instBase = b.instanceName?.split(".").pop() ?? null;
      const circuitID = instBase ? (instanceToCircuit.get(instBase) ?? null) : null;
      const switchInst =
        circuitID !== null ? (circuitToSwitch.get(circuitID) ?? null) : null;
      const floor_id = switchInst ? (switchTagMap.get(switchInst) ?? null) : null;

      return { machine_id: key, recipe_id, overclock, state, somersloops, floor_id };
    });

  // Power grids.
  const power_grids: SnapshotPowerGrid[] = [];
  for (const circuit of allCircuits) {
    const id = Number(propVal(circuit, "mCircuitID") ?? 0);
    if (id <= 0) continue;
    power_grids.push({
      id,
      production_mw: Number(propVal(circuit, "mPowerProduction") ?? 0),
      consumption_mw: Number(propVal(circuit, "mPowerConsumed") ?? 0),
      fuse_tripped: Boolean(propVal(circuit, "mIsFuseTripped") ?? false),
    });
  }

  return {
    save_name: saveName,
    play_time: Number(save.header?.playDurationSeconds ?? 0),
    buildings,
    power_grids,
  };
}
