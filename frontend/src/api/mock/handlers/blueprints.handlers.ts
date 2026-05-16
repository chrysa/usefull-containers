import { http, HttpResponse, delay } from "msw";

const mockBlueprints = [
  {
    name: "iron-smelter-array",
    description: "4x Iron Smelter compact array",
    icon_id: 1,
    color: { r: 0.8, g: 0.4, b: 0.1, a: 1 },
    has_sbp: true,
    has_cfg: true,
    size_bytes: 12480,
    modified_at: "2026-05-10T14:30:00",
    cfg_raw: null,
  },
  {
    name: "copper-refinery",
    description: "Copper sheet production line",
    icon_id: 2,
    color: { r: 0.2, g: 0.6, b: 0.9, a: 1 },
    has_sbp: true,
    has_cfg: true,
    size_bytes: 8192,
    modified_at: "2026-05-12T09:15:00",
    cfg_raw: null,
  },
  {
    name: "steel-beam-factory",
    description: "",
    icon_id: 0,
    color: null,
    has_sbp: true,
    has_cfg: false,
    size_bytes: 24576,
    modified_at: "2026-05-14T18:00:00",
    cfg_raw: null,
  },
];

export const blueprintsHandlers = [
  http.get("/api/v1/blueprints", async () => {
    await delay(400);
    return HttpResponse.json({ blueprints: mockBlueprints, total: mockBlueprints.length });
  }),

  http.get("/api/v1/blueprints/:name", async ({ params }) => {
    await delay(200);
    const bp = mockBlueprints.find((b) => b.name === params.name);
    if (!bp) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(bp);
  }),

  http.post("/api/v1/blueprints", async () => {
    await delay(600);
    return HttpResponse.json({ name: "uploaded-bp", created: true }, { status: 201 });
  }),

  http.delete("/api/v1/blueprints/:name", async () => {
    await delay(300);
    return new HttpResponse(null, { status: 204 });
  }),
];
