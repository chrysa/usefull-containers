export interface AssistantAction {
  label: string;
  url: string;
}

export interface AssistantReply {
  reply: string;
  actions: AssistantAction[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  actions?: AssistantAction[];
}
