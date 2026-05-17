import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../api/http/client";
import type { Plan, PlanCreate, PlanUpdate } from "./types";

const QUERY_KEY = "plans";
const API_BASE = "/v1/plans";

export function usePlansQuery() {
  return useQuery<Plan[]>({
    queryKey: [QUERY_KEY],
    queryFn: () => http.get<Plan[]>(API_BASE),
  });
}

export function usePlanQuery(id: string) {
  return useQuery<Plan>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => http.get<Plan>(`${API_BASE}/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation<Plan, Error, PlanCreate>({
    mutationFn: (payload: PlanCreate) => http.post<Plan>(API_BASE, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdatePlanMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Plan, Error, PlanUpdate>({
    mutationFn: (payload: PlanUpdate) => http.patch<Plan>(`${API_BASE}/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeletePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => http.delete<void>(`${API_BASE}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
