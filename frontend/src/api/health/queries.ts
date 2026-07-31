import { useQuery } from "@tanstack/react-query";
import { http } from "@/api/http/client";

export interface HealthResponse {
  status: string;
  version: string;
  /** True when the backend serves fixture data (demo mode). Drives the banner. */
  demo_mode?: boolean;
}

export function useHealthQuery() {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: () => http.get<HealthResponse>("/v1/health"),
    refetchInterval: 30_000,
    retry: 1,
  });
}
