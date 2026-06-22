// Reduced, browser-produced representation of a parsed Satisfactory .sav.
// Mirrors backend app/models/snapshot.py CompactSnapshot.

export interface SnapshotBuilding {
  /** Building class, e.g. "Build_ConstructorMk1_C". */
  machine_id: string;
  /** Recipe class, e.g. "Recipe_IronPlate_C"; null when the machine is idle. */
  recipe_id: string | null;
  /** Clock percent (50, 100, 250, ...). */
  overclock: number;
  /** active | paused | idle | off */
  state: string;
  somersloops: number;
  floor_id: string | null;
}

export interface SnapshotPowerGrid {
  id: number;
  production_mw: number;
  consumption_mw: number;
  fuse_tripped: boolean;
}

export interface CompactSnapshot {
  save_name: string;
  play_time: number;
  buildings: SnapshotBuilding[];
  power_grids: SnapshotPowerGrid[];
}
