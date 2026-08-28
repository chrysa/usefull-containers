import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Plan, PlanCreate } from "@/domain/plans/types";
import { Button } from "@/components/ui/button";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        className="flex w-full max-w-md flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-foreground">
          {initial ? t("plans.form.edit_title") : t("plans.form.create_title")}
        </h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="plan-name" className="text-sm font-medium text-foreground">
            {t("plans.form.name_label")}
          </label>
          <input
            id="plan-name"
            type="text"
            className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="plan-desc" className="text-sm font-medium text-foreground">
            {t("plans.form.description_label")}
          </label>
          <textarea
            id="plan-desc"
            rows={3}
            className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("plans.form.cancel")}
          </Button>
          <Button type="submit" disabled={isPending || !name.trim()}>
            {isPending ? t("plans.form.saving") : t("plans.form.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
