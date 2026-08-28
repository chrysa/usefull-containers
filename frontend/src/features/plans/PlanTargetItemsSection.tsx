import { useTranslation } from "react-i18next";
import type { TargetItem } from "@/domain/plans/types";
import { Button } from "@/components/ui/button";

const INPUT_CLASS =
  "rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface ItemOption {
  readonly id: string;
  readonly name: string;
}

interface Props {
  readonly targetItems: TargetItem[];
  readonly itemOptions: ItemOption[];
  readonly itemName: (itemId: string) => string;
  readonly adding: boolean;
  readonly onStartAdd: () => void;
  readonly onCancelAdd: () => void;
  readonly newItemId: string;
  readonly onNewItemIdChange: (value: string) => void;
  readonly newItemQty: string;
  readonly onNewItemQtyChange: (value: string) => void;
  readonly onSubmitAdd: (e: React.FormEvent) => void;
  readonly onRemoveItem: (itemId: string) => void;
  readonly isSaving: boolean;
}

/** Target items list for a plan, with an inline form to add or update a target quantity. */
export default function PlanTargetItemsSection({
  targetItems,
  itemOptions,
  itemName,
  adding,
  onStartAdd,
  onCancelAdd,
  newItemId,
  onNewItemIdChange,
  newItemQty,
  onNewItemQtyChange,
  onSubmitAdd,
  onRemoveItem,
  isSaving,
}: Props) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{t("plan_detail.target_items")}</h2>
        {!adding && (
          <Button type="button" size="sm" variant="outline" onClick={onStartAdd}>
            + {t("plan_detail.add_item")}
          </Button>
        )}
      </div>

      {adding && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={onSubmitAdd}>
          <select
            className={INPUT_CLASS}
            value={newItemId}
            onChange={(e) => onNewItemIdChange(e.target.value)}
            required
            aria-label={t("plan_detail.select_item")}
          >
            <option value="">{t("plan_detail.select_item")}</option>
            {itemOptions.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>
          <input
            className={`${INPUT_CLASS} w-24`}
            type="number"
            min="0.01"
            step="0.01"
            value={newItemQty}
            onChange={(e) => onNewItemQtyChange(e.target.value)}
            required
            aria-label={t("plan_detail.quantity")}
          />
          <span className="text-sm text-muted-foreground">/min</span>
          <Button type="submit" size="sm" disabled={isSaving || !newItemId}>
            {t("plan_detail.add")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancelAdd}>
            {t("plan_detail.cancel")}
          </Button>
        </form>
      )}

      {targetItems.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">{t("plan_detail.no_items")}</p>
      )}

      {targetItems.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {targetItems.map((ti) => (
            <li
              key={ti.item_id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-background px-3 py-2"
            >
              <span className="text-sm text-foreground">{itemName(ti.item_id)}</span>
              <span className="font-mono text-sm text-foreground">
                {ti.quantity} <span className="text-muted-foreground">/min</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onRemoveItem(ti.item_id)}
                disabled={isSaving}
                aria-label={t("plan_detail.remove_item", { name: itemName(ti.item_id) })}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
