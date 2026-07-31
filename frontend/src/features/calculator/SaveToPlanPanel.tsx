import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/api/http/client";
import { usePlansQuery, useCreatePlanMutation } from "@/domain/plans/queries";
import type { Plan, PlanCreate } from "@/domain/plans/types";
import styles from "./SaveToPlanPanel.module.scss";

interface Props {
  readonly itemId: string;
  readonly itemName: string;
  readonly quantity: number;
}

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
    <section className={styles.panel}>
      <h2 className={styles.title}>{t("calculator.save_to_plan")}</h2>

      <p className={styles.preview}>
        <span className={styles.previewItem}>{itemName}</span>
        <span className={styles.previewQty}>{displayQty}/min</span>
      </p>

      <div className={styles.modeToggle}>
        <button
          type="button"
          className={`${styles.modeBtn} ${mode === "new" ? styles.active : ""}`}
          onClick={() => { setMode("new"); }}
        >
          {t("calculator.save_new_plan")}
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${mode === "existing" ? styles.active : ""}`}
          onClick={() => { setMode("existing"); }}
          disabled={plans.length === 0}
        >
          {t("calculator.save_existing_plan")}
        </button>
      </div>

      {mode === "new" && (
        <form className={styles.form} onSubmit={handleNew}>
          <input
            className={styles.input}
            type="text"
            placeholder={t("calculator.plan_name_placeholder")}
            value={planName}
            onChange={(e) => { setPlanName(e.target.value); }}
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className={styles.btnSave}
            disabled={isBusy || !planName.trim()}
          >
            {isBusy ? t("calculator.saving") : t("calculator.create_and_save")}
          </button>
        </form>
      )}

      {mode === "existing" && (
        <form className={styles.form} onSubmit={handleAddToExisting}>
          <select
            className={styles.select}
            value={selectedPlanId}
            onChange={(e) => { setSelectedPlanId(e.target.value); }}
            required
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
          <button
            type="submit"
            className={styles.btnSave}
            disabled={isBusy || !selectedPlanId}
          >
            {isBusy ? t("calculator.saving") : t("calculator.add_to_plan")}
          </button>
        </form>
      )}

      {hasError && (
        <p className={styles.error} role="alert">
          {t("calculator.save_error")}
        </p>
      )}
    </section>
  );
}
