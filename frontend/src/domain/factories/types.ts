import type { SnapshotRead } from "@/domain/snapshots/types";

export interface Factory {
  saveName: string;
  snapshotCount: number;
  latest: SnapshotRead;
}
