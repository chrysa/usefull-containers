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
}

export interface RecipeSummary {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  products: RecipeIngredient[];
  produced_in: string[];
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
