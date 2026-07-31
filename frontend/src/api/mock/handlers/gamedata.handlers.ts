import { http, HttpResponse, delay } from "msw";
import type { GameDataStats, GameDataImportResult, ItemSummary, RecipeSummary } from "@/domain/gamedata/types";

const mockItems: ItemSummary[] = [
  { id: "Desc_IronIngot_C", name: "Iron Ingot", description: "A basic ingot smelted from iron ore.", stack_size: 100, is_fluid: false },
  { id: "Desc_CopperIngot_C", name: "Copper Ingot", description: "A basic ingot smelted from copper ore.", stack_size: 100, is_fluid: false },
  { id: "Desc_IronOre_C", name: "Iron Ore", description: "Raw iron ore extracted from the ground.", stack_size: 100, is_fluid: false },
  { id: "Desc_CopperOre_C", name: "Copper Ore", description: "Raw copper ore extracted from the ground.", stack_size: 100, is_fluid: false },
  { id: "Desc_IronPlate_C", name: "Iron Plate", description: "A flat iron plate.", stack_size: 200, is_fluid: false },
  { id: "Desc_Wire_C", name: "Wire", description: "Thin copper wire.", stack_size: 500, is_fluid: false },
  { id: "Desc_Water_C", name: "Water", description: "Extracted water.", stack_size: 0, is_fluid: true },
];

const mockRecipes: RecipeSummary[] = [
  {
    id: "Recipe_IngotIron_C",
    name: "Smelt Iron",
    ingredients: [{ item_id: "Desc_IronOre_C", amount: 1 }],
    products: [{ item_id: "Desc_IronIngot_C", amount: 1 }],
    produced_in: ["Desc_Smelter_C"],
    time: 2,
  },
  {
    id: "Recipe_IngotCopper_C",
    name: "Smelt Copper",
    ingredients: [{ item_id: "Desc_CopperOre_C", amount: 1 }],
    products: [{ item_id: "Desc_CopperIngot_C", amount: 1 }],
    produced_in: ["Desc_Smelter_C"],
    time: 2,
  },
  {
    id: "Recipe_IronPlate_C",
    name: "Iron Plate",
    ingredients: [{ item_id: "Desc_IronIngot_C", amount: 3 }],
    products: [{ item_id: "Desc_IronPlate_C", amount: 2 }],
    produced_in: ["Desc_ConstructorMk1_C"],
    time: 6,
  },
  {
    id: "Recipe_Wire_C",
    name: "Wire",
    ingredients: [{ item_id: "Desc_CopperIngot_C", amount: 1 }],
    products: [{ item_id: "Desc_Wire_C", amount: 2 }],
    produced_in: ["Desc_ConstructorMk1_C"],
    time: 4,
  },
];

let mockStats: GameDataStats = {
  item_count: mockItems.length,
  recipe_count: mockRecipes.length,
  source_file: "data-mock.zip",
  imported_at: "2026-05-17T10:00:00+00:00",
};

export const gamedataHandlers = [
  http.get("/api/v1/gamedata/stats", async () => {
    await delay(200);
    return HttpResponse.json(mockStats);
  }),

  http.post("/api/v1/gamedata/import", async () => {
    await delay(800);
    const result: GameDataImportResult = {
      item_count: mockItems.length,
      recipe_count: mockRecipes.length,
      source_file: "data.zip",
    };
    mockStats = { ...mockStats, item_count: mockItems.length, recipe_count: mockRecipes.length, source_file: "data.zip" };
    return HttpResponse.json(result, { status: 201 });
  }),

  http.get("/api/v1/gamedata/items", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const filtered = q
      ? mockItems.filter((i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
      : mockItems;
    return HttpResponse.json(filtered);
  }),

  http.get("/api/v1/gamedata/recipes", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const filtered = q
      ? mockRecipes.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
      : mockRecipes;
    return HttpResponse.json(filtered);
  }),
];
