import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Plan, PlanCreate } from "@/domain/plans/types";
import styles from "./PlanForm.module.scss";

interface Props {
  readonly initial?: Plan;
  readonly onSubmit: (data: PlanCreate) => void;
  readonly onCancel: () => void;
  readonly isPending: boolean;
}

export default function PlanForm({ initial, onSubmit, onCancel, isPending }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  // Close the modal on Escape regardless of where focus currently sits.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      target_items: initial?.target_items ?? [],
      linked_blueprints: initial?.linked_blueprints ?? [],
    });
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
    >
      <form className={styles.dialog} onSubmit={handleSubmit}>
        <h2 className={styles.title}>
          {initial ? t("plans.form.edit_title") : t("plans.form.create_title")}
        </h2>

        <div className={styles.field}>
          <label htmlFor="plan-name">{t("plans.form.name_label")}</label>
          <input
            id="plan-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="plan-desc">{t("plans.form.description_label")}</label>
          <textarea
            id="plan-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={onCancel}>
            {t("plans.form.cancel")}
          </button>
          <button
            type="submit"
            className={styles.btnSave}
            disabled={isPending || !name.trim()}
          >
            {isPending ? t("plans.form.saving") : t("plans.form.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
