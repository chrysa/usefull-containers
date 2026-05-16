// Blueprint domain types — mirrors backend app/models/blueprint.py

export interface BlueprintColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Blueprint {
  name: string;
  description: string;
  icon_id: number;
  color: BlueprintColor | null;
  has_sbp: boolean;
  has_cfg: boolean;
  size_bytes: number;
  modified_at: string | null;
  cfg_raw: Record<string, unknown> | null;
}

export interface BlueprintList {
  blueprints: Blueprint[];
  total: number;
}

export interface BlueprintUploadResult {
  name: string;
  created: boolean;
}
