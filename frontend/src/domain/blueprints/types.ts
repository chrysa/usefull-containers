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
  tags: string[];
}

export interface BlueprintList {
  blueprints: Blueprint[];
  total: number;
}

export interface BlueprintUploadResult {
  name: string;
  created: boolean;
}

export interface BatchUploadResult {
  created: string[];
  updated: string[];
  failed: string[];
  total: number;
}

export interface BlueprintTagsUpdate {
  tags: string[];
}

export interface BlueprintDescriptionUpdate {
  description: string;
}
