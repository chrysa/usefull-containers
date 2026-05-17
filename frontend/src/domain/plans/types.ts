export interface TargetItem {
  item_id: string;
  quantity: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  target_items: TargetItem[];
  linked_blueprints: string[];
  created_at: string;
  updated_at: string;
}

export interface PlanCreate {
  name: string;
  description?: string;
  target_items?: TargetItem[];
  linked_blueprints?: string[];
}

export interface PlanUpdate {
  name?: string;
  description?: string;
  target_items?: TargetItem[];
  linked_blueprints?: string[];
}
