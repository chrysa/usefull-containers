import { useMutation } from "@tanstack/react-query";
import { http } from "@/api/http/client";
import type { AssistantReply, GeneratePlanResponse } from "./types";

export function useAssistantChat() {
  return useMutation<AssistantReply, Error, string>({
    mutationFn: (message: string) =>
      http.post<AssistantReply>("/v1/assistant/chat", { message }),
  });
}

export function useGeneratePlan() {
  return useMutation<GeneratePlanResponse, Error, string>({
    mutationFn: (prompt: string) =>
      http.post<GeneratePlanResponse>("/v1/assistant/generate-plan", { prompt }),
  });
}
