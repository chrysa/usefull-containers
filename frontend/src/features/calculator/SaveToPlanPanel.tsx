import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/api/http/client";
import { usePlansQuery, useCreatePlanMutation } from "@/domain/plans/queries";
import type { Plan, PlanCreate } from "@/domain/plans/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  readonly itemId: string;
  readonly itemName: string;
  readonly quantity: number;
}

const inputClass =
  "w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function SaveToPlanPanel({ itemId, itemName, quantity }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"new" | "existing">("new");
  const [planName, setPlanName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const plansQuery = usePlansQuery();
  const plans = plansQuery.data ?? [];

  const createMutation = useCreatePlanMutation();

  const addToExistingMutation = useMutation<Plan, Error, { planId: string; plan: Plan }>({
    mutationFn: ({ planId, plan }) => {
      const existing = plan.target_items.find((ti) => ti.item_id === itemId);
      const newItems = existing
        ? plan.target_items.map((ti) =>
            ti.item_id === itemId ? { ...ti, quantity: ti.quantity + quantity } : ti,
          )
        : [...plan.target_items, { item_id: itemId, quantity }];
      return http.patch<Plan>(`/v1/plans/${planId}`, { target_items: newItems });
    },
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      navigate(`/plans/${plan.id}`);
    },
  });

  const isBusy = createMutation.isPending || addToExistingMutation.isPending;
  const hasError = createMutation.isError || addToExistingMutation.isError;

  function handleNew(e: React.FormEvent) {
    e.preventDefault();
    if (!planName.trim()) return;
    const payload: PlanCreate = {
      name: planName.trim(),
      target_items: [{ item_id: itemId, quantity }],
    };
    createMutation.mutate(payload, {
      onSuccess: (plan) => navigate(`/plans/${plan.id}`),
    });
  }

  function handleAddToExisting(e: React.FormEvent) {
    e.preventDefault();
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;
    addToExistingMutation.mutate({ planId: selectedPlanId, plan });
  }

  const displayQty = quantity % 1 === 0 ? String(quantity) : quantity.toFixed(2);

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">{t("calculator.save_to_plan")}</h2>

      <p className="flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
        <span className="truncate text-foreground">{itemName}</span>
        <span className="font-mono text-primary">{displayQty}/min</span>
      </p>

      <div className="flex gap-1 rounded-[var(--radius)] border border-border p-1">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-[var(--radius)] px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
            mode === "new" && "bg-primary text-primary-foreground hover:text-primary-foreground",
          )}
          onClick={() => {
            setMode("new");
          }}
        >
          {t("calculator.save_new_plan")}
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-[var(--radius)] px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
            mode === "existing" &&
              "bg-primary text-primary-foreground hover:text-primary-foreground",
          )}
          onClick={() => {
            setMode("existing");
          }}
          disabled={plans.length === 0}
        >
          {t("calculator.save_existing_plan")}
        </button>
      </div>

      {mode === "new" && (
        <form className="flex flex-col gap-2" onSubmit={handleNew}>
          <input
            className={inputClass}
            type="text"
            placeholder={t("calculator.plan_name_placeholder")}
            aria-label={t("calculator.plan_name_placeholder")}
            value={planName}
            onChange={(e) => {
              setPlanName(e.target.value);
            }}
            required
            autoComplete="off"
          />
          <Button type="submit" disabled={isBusy || !planName.trim()}>
            {isBusy ? t("calculator.saving") : t("calculator.create_and_save")}
          </Button>
        </form>
      )}

      {mode === "existing" && (
        <form className="flex flex-col gap-2" onSubmit={handleAddToExisting}>
          <select
            className={inputClass}
            value={selectedPlanId}
            onChange={(e) => {
              setSelectedPlanId(e.target.value);
            }}
            required
            aria-label={t("calculator.select_plan")}
          >
            <option value="" disabled>
              {plansQuery.isLoading ? t("calculator.loading") : t("calculator.select_plan")}
            </option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={isBusy || !selectedPlanId}>
            {isBusy ? t("calculator.saving") : t("calculator.add_to_plan")}
          </Button>
        </form>
      )}

      {hasError && (
        <p className="text-sm text-destructive" role="alert">
          {t("calculator.save_error")}
        </p>
      )}
    </section>
  );
}
