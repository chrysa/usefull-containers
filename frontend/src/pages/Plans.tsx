import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlanCard, PlanForm } from "../features/plans";
import Skeleton from "../components/ui/Skeleton";
import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  useDuplicatePlanMutation,
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
  const duplicateMutation = useDuplicatePlanMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlans = (plans ?? []).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

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

  function handleDuplicate(id: string) {
    duplicateMutation.mutate(id);
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

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder={t("plans.search_placeholder")}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          aria-label={t("plans.search_placeholder")}
        />
      </div>

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="140px" />
          ))}
        </div>
      )}

      {isError && <p className={styles.error}>{t("plans.error")}</p>}

      {!isLoading && !isError && plans && plans.length === 0 && (
        <p className={styles.empty}>{t("plans.empty")}</p>
      )}

      {!isLoading &&
        !isError &&
        plans &&
        plans.length > 0 &&
        filteredPlans.length === 0 && (
          <p className={styles.empty}>{t("plans.no_results")}</p>
        )}

      {!isLoading && !isError && filteredPlans.length > 0 && (
        <div className={styles.grid}>
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={openEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
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
