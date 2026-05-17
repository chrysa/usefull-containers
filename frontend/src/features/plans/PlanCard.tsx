import { useTranslation } from "react-i18next";
import type { Plan } from "../../domain/plans/types";
import styles from "./PlanCard.module.scss";

interface Props {
  readonly plan: Plan;
  readonly onEdit: (plan: Plan) => void;
  readonly onDelete: (id: string) => void;
}

export default function PlanCard({ plan, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const updatedDate = new Date(plan.updated_at).toLocaleDateString();

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <span className={styles.name}>{plan.name}</span>
      </header>

      {plan.description && (
        <p className={styles.description}>{plan.description}</p>
      )}

      <div className={styles.badges}>
        {plan.target_items.length > 0 && (
          <span className={styles.badge}>
            {t("plans.items_count", { count: plan.target_items.length })}
          </span>
        )}
        {plan.linked_blueprints.length > 0 && (
          <span className={styles.badge}>
            {t("plans.blueprints_count", { count: plan.linked_blueprints.length })}
          </span>
        )}
      </div>

      <footer className={styles.footer}>
        <span className={styles.meta}>{updatedDate}</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnEdit}
            onClick={() => onEdit(plan)}
            aria-label={`Edit ${plan.name}`}
          >
            {t("plans.edit")}
          </button>
          <button
            type="button"
            className={styles.btnDelete}
            onClick={() => onDelete(plan.id)}
            aria-label={`Delete ${plan.name}`}
          >
            {t("plans.delete")}
          </button>
        </div>
      </footer>
    </article>
  );
}
