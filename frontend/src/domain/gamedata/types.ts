// GameData domain types — mirrors backend app/models/gamedata.py

export interface RecipeIngredient {
  item_id: string;
  amount: number;
}

export interface ItemSummary {
  id: string;
  name: string;
  description: string;
  stack_size: number;
  /** Liquids/gases move through pipes, not conveyors. Defaults to false. */
  is_fluid?: boolean;
}

export interface RecipeSummary {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  products: RecipeIngredient[];
  produced_in: string[];
  /**
   * Craft duration in seconds at 100% clock. Used to derive a single machine's
   * per-minute output (amount * 60 / time) and thus machine counts. 0/absent
   * means unknown — machine counts are then not computable for that recipe.
   */
  time?: number;
}

export interface GameDataStats {
  item_count: number;
  recipe_count: number;
  source_file: string | null;
  imported_at: string | null;
}

export interface GameDataImportResult {
  item_count: number;
  recipe_count: number;
  source_file: string;
}
