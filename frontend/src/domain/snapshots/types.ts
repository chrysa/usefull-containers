import type { CompactSnapshot } from "@/domain/savefile/types";

export interface SnapshotRead {
  id: string;
  name: string;
  save_name: string;
  play_time: number;
  imported_at: string;
  data: CompactSnapshot;
}

export interface SnapshotCreate {
  name: string;
  data: CompactSnapshot;
}
