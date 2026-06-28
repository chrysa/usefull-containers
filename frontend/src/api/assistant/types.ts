export interface AssistantAction {
  label: string;
  url: string;
}

export interface AssistantReply {
  reply: string;
  actions: AssistantAction[];
}

export interface ResourceRate {
  item_id: string;
  item_name: string;
  per_minute: number;
  is_raw: boolean;
  is_fluid: boolean;
}

export interface ProductionStep {
  item_id: string;
  recipe_id: string;
  recipe_name: string;
  machine_id: string;
  machine_count: number;
  clock_percent: number;
  inputs: ResourceRate[];
  outputs: ResourceRate[];
}

export interface GeneratedFactoryPlan {
  name: string;
  description: string;
  target_items: { item_id: string; quantity: number }[];
  steps: ProductionStep[];
  raw_inputs: ResourceRate[];
  build_order: string[];
  assumptions: string[];
  warnings: string[];
}

export interface GeneratePlanResponse {
  plan: GeneratedFactoryPlan | null;
  clarification: string | null;
  reply: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  actions?: AssistantAction[];
  plan?: GeneratedFactoryPlan;
}
