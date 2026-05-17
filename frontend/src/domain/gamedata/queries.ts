import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../api/http/client";
import type {
  GameDataImportResult,
  GameDataStats,
  ItemSummary,
  RecipeSummary,
} from "./types";

const QUERY_KEY = "gamedata";
const API_BASE = "/v1/gamedata";

export function useGameDataStatsQuery() {
  return useQuery<GameDataStats>({
    queryKey: [QUERY_KEY, "stats"],
    queryFn: () => http.get<GameDataStats>(`${API_BASE}/stats`),
  });
}

export function useItemsQuery(query = "", hasData = true) {
  return useQuery<ItemSummary[]>({
    queryKey: [QUERY_KEY, "items", query],
    queryFn: () =>
      http.get<ItemSummary[]>(`${API_BASE}/items${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    enabled: hasData,
  });
}

export function useRecipesQuery(query = "", hasData = true) {
  return useQuery<RecipeSummary[]>({
    queryKey: [QUERY_KEY, "recipes", query],
    queryFn: () =>
      http.get<RecipeSummary[]>(`${API_BASE}/recipes${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    enabled: hasData,
  });
}

export function useImportGameDataMutation() {
  const queryClient = useQueryClient();
  return useMutation<GameDataImportResult, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const res = await fetch("/api/v1/gamedata/import", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Import failed: HTTP ${res.status}`);
      }
      return res.json() as Promise<GameDataImportResult>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
