import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlanCard, PlanForm } from "../features/plans";
import Skeleton from "../components/ui/Skeleton";
import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  usePlansQuery,
  useUpdatePlanMutation,
} from "../domain/plans/queries";
import type { Plan, PlanCreate } from "../domain/plans/types";
import styles from "./Plans.module.scss";

export default function PlansPage() {
  const { t } = useTranslation();
  const { data: plans, isLoading, isError } = usePlansQuery();
  const createMutation = useCreatePlanMutation();
  const deleteMutation = useDeletePlanMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined);

  const updateMutation = useUpdatePlanMutation(editingPlan?.id ?? "");

  function openCreate() {
    setEditingPlan(undefined);
    setFormOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    if (!globalThis.confirm(t("plans.confirm_delete"))) return;
    deleteMutation.mutate(id);
  }

  function handleSubmit(data: PlanCreate) {
    if (editingPlan) {
      updateMutation.mutate(data, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t("plans.title")}</h1>
        <button type="button" className={styles.btnCreate} onClick={openCreate}>
          + {t("plans.create")}
        </button>
      </header>

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={140} />
          ))}
        </div>
      )}

      {isError && <p className={styles.error}>{t("plans.error")}</p>}

      {!isLoading && !isError && plans && plans.length === 0 && (
        <p className={styles.empty}>{t("plans.empty")}</p>
      )}

      {!isLoading && !isError && plans && plans.length > 0 && (
        <div className={styles.grid}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <PlanForm
          key={editingPlan?.id ?? "new"}
          initial={editingPlan}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isPending={isPending}
        />
      )}
    </div>
  );
}
