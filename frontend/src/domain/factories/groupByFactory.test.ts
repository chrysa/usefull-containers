import { describe, it, expect } from "vitest";
import type { SnapshotRead } from "@/domain/snapshots/types";
import { groupByFactory } from "./groupByFactory";

describe("groupByFactory", () => {
  it("groups snapshots by save_name and keeps the latest as representative", () => {
    const snaps = [
      { id: "a", name: "s1", save_name: "Alpha", play_time: 1, imported_at: "2026-01-01T00:00:00Z" },
      { id: "b", name: "s2", save_name: "Alpha", play_time: 2, imported_at: "2026-02-01T00:00:00Z" },
      { id: "c", name: "s3", save_name: "Beta", play_time: 3, imported_at: "2026-01-15T00:00:00Z" },
    ];
    const result = groupByFactory(snaps as unknown as SnapshotRead[]);
    expect(result.map((f) => f.saveName)).toEqual(["Alpha", "Beta"]);
    expect(result[0]!.snapshotCount).toBe(2);
    expect(result[0]!.latest.id).toBe("b");
  });

  it("returns an empty array for no snapshots", () => {
    expect(groupByFactory([])).toEqual([]);
  });
});
