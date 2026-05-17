import { http, HttpResponse } from "msw";
import type { Plan } from "../../../domain/plans/types";

let mockPlans: Plan[] = [
  {
    id: "plan-001",
    name: "Iron Production",
    description: "Basic iron plate and rod setup",
    target_items: [
      { item_id: "Desc_IronPlate_C", quantity: 60 },
      { item_id: "Desc_IronRod_C", quantity: 60 },
    ],
    linked_blueprints: ["iron-smelter-array"],
    created_at: "2026-05-10T10:00:00",
    updated_at: "2026-05-15T12:30:00",
  },
  {
    id: "plan-002",
    name: "Copper Chain",
    description: "",
    target_items: [{ item_id: "Desc_CopperSheet_C", quantity: 30 }],
    linked_blueprints: [],
    created_at: "2026-05-14T09:00:00",
    updated_at: "2026-05-14T09:00:00",
  },
];

export const plansHandlers = [
  http.get("/api/v1/plans", () => HttpResponse.json(mockPlans)),

  http.post("/api/v1/plans", async ({ request }) => {
    const body = (await request.json()) as Partial<Plan>;
    const now = new Date().toISOString();
    const plan: Plan = {
      id: `plan-${Date.now()}`,
      name: body.name ?? "Unnamed Plan",
      description: body.description ?? "",
      target_items: body.target_items ?? [],
      linked_blueprints: body.linked_blueprints ?? [],
      created_at: now,
      updated_at: now,
    };
    mockPlans.push(plan);
    return HttpResponse.json(plan, { status: 201 });
  }),

  http.get("/api/v1/plans/:id", ({ params }) => {
    const plan = mockPlans.find((p) => p.id === params["id"]);
    if (!plan) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(plan);
  }),

  http.patch("/api/v1/plans/:id", async ({ params, request }) => {
    const idx = mockPlans.findIndex((p) => p.id === params["id"]);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const body = (await request.json()) as Partial<Plan>;
    mockPlans[idx] = {
      ...mockPlans[idx]!,
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(mockPlans[idx]);
  }),

  http.delete("/api/v1/plans/:id", ({ params }) => {
    const before = mockPlans.length;
    mockPlans = mockPlans.filter((p) => p.id !== params["id"]);
    if (mockPlans.length === before) return new HttpResponse(null, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),
];
