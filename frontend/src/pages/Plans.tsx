import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../context/useToast";
import { PlanCard, PlanForm } from "../features/plans";
import Skeleton from "../components/ui/Skeleton";
import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  useDuplicatePlanMutation,
  useImportPlanMutation,
  usePlansQuery,
  useUpdatePlanMutation,
} from "../domain/plans/queries";
import type { Plan, PlanCreate } from "../domain/plans/types";
import styles from "./Plans.module.scss";

export default function PlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: plans, isLoading, isError } = usePlansQuery();
  const createMutation = useCreatePlanMutation();
  const deleteMutation = useDeletePlanMutation();
  const duplicateMutation = useDuplicatePlanMutation();
  const importMutation = useImportPlanMutation();

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
    deleteMutation.mutate(id, {
      onSuccess: () => showToast(t("toast.plan_deleted")),
      onError: () => showToast(t("toast.error"), "error"),
    });
  }

  function handleDuplicate(id: string) {
    duplicateMutation.mutate(id, {
      onSuccess: () => showToast(t("toast.plan_duplicated")),
      onError: () => showToast(t("toast.error"), "error"),
    });
  }

  function handleImportClick() {
    setImportError(null);
    importInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected after an error
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Plan;
        if (!parsed.name) throw new Error("missing name field");
        importMutation.mutate(parsed, {
          onSuccess: (created) => navigate(`/plans/${created.id}`),
          onError: () => setImportError(t("plans.import_error")),
        });
      } catch {
        setImportError(t("plans.import_error"));
      }
    };
    reader.readAsText(file);
  }

  function handleSubmit(data: PlanCreate) {
    if (editingPlan) {
      updateMutation.mutate(data, {
        onSuccess: () => {
          setFormOpen(false);
          showToast(t("toast.plan_updated"));
        },
        onError: () => showToast(t("toast.error"), "error"),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setFormOpen(false);
          showToast(t("toast.plan_created"));
        },
        onError: () => showToast(t("toast.error"), "error"),
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t("plans.title")}</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnImport}
            onClick={handleImportClick}
            disabled={importMutation.isPending}
            title={t("plans.import_json_hint")}
          >
            {importMutation.isPending
              ? t("plans.importing_json")
              : t("plans.import_json")}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            aria-label={t("plans.import_json_hint")}
            className={styles.hiddenInput}
            onChange={handleImportFile}
          />
          <button
            type="button"
            className={styles.btnCreate}
            onClick={openCreate}
          >
            + {t("plans.create")}
          </button>
        </div>
      </header>

      {importError && (
        <p className={styles.importError} role="alert">
          {importError}
        </p>
      )}

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
