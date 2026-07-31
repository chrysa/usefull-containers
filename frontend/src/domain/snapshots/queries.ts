import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/api/http/client";
import type { SnapshotCreate, SnapshotRead } from "./types";

const QUERY_KEY = "snapshots";
const API_BASE = "/v1/snapshots";

export function useSnapshotsQuery() {
  return useQuery<SnapshotRead[]>({
    queryKey: [QUERY_KEY],
    queryFn: () => http.get<SnapshotRead[]>(API_BASE),
  });
}

export function useSnapshotQuery(id: string) {
  return useQuery<SnapshotRead>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => http.get<SnapshotRead>(`${API_BASE}/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSnapshotMutation() {
  const queryClient = useQueryClient();
  return useMutation<SnapshotRead, Error, SnapshotCreate>({
    mutationFn: (payload: SnapshotCreate) =>
      http.post<SnapshotRead>(API_BASE, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteSnapshotMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => http.delete<void>(`${API_BASE}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
