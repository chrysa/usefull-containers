import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../api/http/client";
import type { BatchUploadResult, Blueprint, BlueprintList, BlueprintTagsUpdate, BlueprintUploadResult } from "./types";

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

export function useDownloadAllBlueprints() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch("/api/v1/blueprints/download-all");
      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "blueprints.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });
}

export function useBatchUploadMutation() {
  const queryClient = useQueryClient();
  return useMutation<BatchUploadResult, Error, FileList>({
    mutationFn: async (fileList: FileList) => {
      const formData = new FormData();
      Array.from(fileList).forEach((file) => {
        formData.append("files", file, file.name);
      });
      const res = await fetch("/api/v1/blueprints/upload-batch", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Batch upload failed: HTTP ${res.status}`);
      return res.json() as Promise<BatchUploadResult>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useImportZipMutation() {
  const queryClient = useQueryClient();
  return useMutation<BatchUploadResult, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("zip_file", file, file.name);
      const res = await fetch("/api/v1/blueprints/import-zip", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Import failed: HTTP ${res.status}`);
      return res.json() as Promise<BatchUploadResult>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useSetTagsMutation(name: string) {
  const queryClient = useQueryClient();
  return useMutation<Blueprint, Error, string[]>({
    mutationFn: (tags: string[]) =>
      http.patch<Blueprint>(`${API_BASE}/${encodeURIComponent(name)}/tags`, {
        tags,
      } satisfies BlueprintTagsUpdate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
