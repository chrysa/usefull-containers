import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../api/http/client";
import type { Blueprint, BlueprintList, BlueprintUploadResult } from "./types";

const QUERY_KEY = "blueprints";
const API_BASE = "/v1/blueprints";

export function useBlueprintsQuery() {
  return useQuery<BlueprintList>({
    queryKey: [QUERY_KEY],
    queryFn: () => http.get<BlueprintList>(API_BASE),
  });
}

export function useBlueprintQuery(name: string) {
  return useQuery<Blueprint>({
    queryKey: [QUERY_KEY, name],
    queryFn: () => http.get<Blueprint>(`${API_BASE}/${name}`),
    enabled: Boolean(name),
  });
}

export function useUploadBlueprintMutation() {
  const queryClient = useQueryClient();
  return useMutation<BlueprintUploadResult, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/v1/blueprints", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
      return res.json() as Promise<BlueprintUploadResult>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteBlueprintMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (name: string) =>
      http.delete<void>(`${API_BASE}/${name}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
