import type { Blueprint } from "./types";

// Map raw API response to domain model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBlueprint(raw: any): Blueprint {
  return {
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    icon_id: Number(raw.icon_id ?? 0),
    color: raw.color ?? null,
    has_sbp: Boolean(raw.has_sbp),
    has_cfg: Boolean(raw.has_cfg),
    size_bytes: Number(raw.size_bytes ?? 0),
    modified_at: raw.modified_at ?? null,
    cfg_raw: raw.cfg_raw ?? null,
  };
}
