import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const TEXTAREA_CLASS =
  "w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  readonly description: string;
  readonly editing: boolean;
  readonly draft: string;
  readonly onDraftChange: (value: string) => void;
  readonly onEdit: () => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly isSaving: boolean;
}

/** Inline-editable plan description, shown as text with an edit affordance when idle. */
export default function PlanDescriptionEditor({
  description,
  editing,
  draft,
  onDraftChange,
  onEdit,
  onSave,
  onCancel,
  isSaving,
}: Props) {
  const { t } = useTranslation();

  if (editing) {
    return (
      <section className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-3">
        <textarea
          className={TEXTAREA_CLASS}
          value={draft}
          rows={3}
          onChange={(e) => onDraftChange(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={onSave} disabled={isSaving}>
            {t("plan_detail.save")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            {t("plan_detail.cancel")}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex items-start justify-between gap-3 rounded-[var(--radius)] border border-border bg-card p-3">
      <p className="text-sm text-foreground">
        {description || <em className="text-muted-foreground">{t("plan_detail.no_description")}</em>}
      </p>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onEdit}
        aria-label={t("plan_detail.edit_desc")}
      >
        {t("plan_detail.edit")}
      </Button>
    </section>
  );
}
