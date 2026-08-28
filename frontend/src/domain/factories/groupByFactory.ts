import type { SnapshotRead } from "@/domain/snapshots/types";
import type { Factory } from "./types";

export function groupByFactory(snapshots: SnapshotRead[]): Factory[] {
  const byName = new Map<string, SnapshotRead[]>();
  for (const snap of snapshots) {
    const list = byName.get(snap.save_name) ?? [];
    list.push(snap);
    byName.set(snap.save_name, list);
  }
  const factories = Array.from(byName.entries()).map(([saveName, list]) => {
    const latest = list.reduce((acc, cur) =>
      cur.imported_at > acc.imported_at ? cur : acc,
    );
    return { saveName, snapshotCount: list.length, latest };
  });
  return factories.sort((a, b) =>
    b.latest.imported_at.localeCompare(a.latest.imported_at),
  );
}
