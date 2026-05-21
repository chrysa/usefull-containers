import { useMutation } from "@tanstack/react-query";
import { http } from "../http/client";
import type { AssistantReply } from "./types";

export function useAssistantChat() {
  return useMutation<AssistantReply, Error, string>({
    mutationFn: (message: string) =>
      http.post<AssistantReply>("/v1/assistant/chat", { message }),
  });
}
