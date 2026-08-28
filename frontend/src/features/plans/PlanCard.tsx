import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Plan } from "@/domain/plans/types";
import { formatDate } from "@/utils/formatDate";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  readonly plan: Plan;
  readonly onEdit: (plan: Plan) => void;
  readonly onDelete: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
}

export default function PlanCard({ plan, onEdit, onDelete, onDuplicate }: Props) {
  const { t, i18n } = useTranslation();
  const updatedDate = formatDate(plan.updated_at, i18n.language);

  return (
    <article className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-3.5 transition-colors hover:border-primary">
      <span className="truncate text-sm font-semibold text-foreground">{plan.name}</span>

      {plan.description && (
        <p className="line-clamp-2 text-[0.8rem] text-muted-foreground">{plan.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {plan.target_items.length > 0 && (
          <span className="rounded-[var(--radius)] border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {t("plans.items_count", { count: plan.target_items.length })}
          </span>
        )}
        {plan.linked_blueprints.length > 0 && (
          <span className="rounded-[var(--radius)] border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {t("plans.blueprints_count", { count: plan.linked_blueprints.length })}
          </span>
        )}
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
        <span className="text-xs text-muted-foreground">{updatedDate}</span>
        <div className="flex flex-wrap gap-1.5">
          <Link
            to={`/plans/${plan.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("plans.open")}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(plan)}
            aria-label={t("plans.edit_aria", { name: plan.name })}
          >
            {t("plans.edit")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(plan.id)}
            aria-label={t("plans.duplicate_aria", { name: plan.name })}
          >
            {t("plans.duplicate")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(plan.id)}
            aria-label={t("plans.delete_aria", { name: plan.name })}
          >
            {t("plans.delete")}
          </Button>
        </div>
      </footer>
    </article>
  );
}
