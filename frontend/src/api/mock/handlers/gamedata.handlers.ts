import { http, HttpResponse, delay } from "msw";
import type { GameDataStats, GameDataImportResult } from "../../../domain/gamedata/types";

const mockStats: GameDataStats = {
  item_count: 0,
  recipe_count: 0,
  source_file: null,
  imported_at: null,
};

export const gamedataHandlers = [
  http.get("/api/v1/gamedata/stats", async () => {
    await delay(200);
    return HttpResponse.json(mockStats);
  }),

  http.post("/api/v1/gamedata/import", async () => {
    await delay(800);
    const result: GameDataImportResult = {
      item_count: 142,
      recipe_count: 234,
      source_file: "data.zip",
    };
    return HttpResponse.json(result, { status: 201 });
  }),

  http.get("/api/v1/gamedata/items", async () => {
    await delay(300);
    return HttpResponse.json([
      { id: "Desc_IronIngot_C", name: "Iron Ingot", description: "Basic ingot", stack_size: 100 },
      { id: "Desc_CopperIngot_C", name: "Copper Ingot", description: "", stack_size: 100 },
    ]);
  }),

  http.get("/api/v1/gamedata/recipes", async () => {
    await delay(300);
    return HttpResponse.json([
      {
        id: "Recipe_IngotIron_C",
        name: "Smelt Iron",
        ingredients: [{ item_id: "Desc_IronOre_C", amount: 1 }],
        products: [{ item_id: "Desc_IronIngot_C", amount: 1 }],
        produced_in: ["Desc_Smelter_C"],
      },
    ]);
  }),
];
