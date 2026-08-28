import { useTranslation } from "react-i18next";
import { BELT_TIERS, PIPE_TIERS } from "@/domain/gamedata/logistics";
import type { ItemSummary } from "@/domain/gamedata/types";
import { Button } from "@/components/ui/button";

export type ViewMode = "tree" | "graph";

const SELECT_CLASS =
  "w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";
const LABEL_CLASS = "text-xs font-medium text-muted-foreground";

interface Props {
  readonly sortedItems: readonly ItemSummary[];
  readonly targetItemId: string;
  readonly onTargetItemIdChange: (value: string) => void;
  readonly quantityRaw: string;
  readonly onQuantityRawChange: (value: string) => void;
  readonly isLoading: boolean;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly hasTree: boolean;
  readonly beltTier: string;
  readonly onBeltTierChange: (value: string) => void;
  readonly pipeTier: string;
  readonly onPipeTierChange: (value: string) => void;
  readonly viewMode: ViewMode;
  readonly onViewModeChange: (mode: ViewMode) => void;
}

/** Sidebar form: target item + quantity inputs, logistics tier pickers, and the tree/graph toggle. */
export default function CalculatorForm({
  sortedItems,
  targetItemId,
  onTargetItemIdChange,
  quantityRaw,
  onQuantityRawChange,
  isLoading,
  onSubmit,
  hasTree,
  beltTier,
  onBeltTierChange,
  pipeTier,
  onPipeTierChange,
  viewMode,
  onViewModeChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80 lg:flex-none">
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS} htmlFor="calc-item">
            {t("calculator.target_item")}
          </label>
          <select
            id="calc-item"
            className={SELECT_CLASS}
            value={targetItemId}
            onChange={(e) => {
              onTargetItemIdChange(e.target.value);
            }}
            required
            disabled={isLoading}
          >
            <option value="" disabled>
              {isLoading ? t("calculator.loading") : t("calculator.select_placeholder")}
            </option>
            {sortedItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS} htmlFor="calc-qty">
            {t("calculator.quantity")}
          </label>
          <input
            id="calc-qty"
            type="number"
            className={SELECT_CLASS}
            value={quantityRaw}
            min="0.01"
            step="any"
            onChange={(e) => {
              onQuantityRawChange(e.target.value);
            }}
            required
          />
        </div>

        <Button type="submit" disabled={isLoading || !targetItemId}>
          {t("calculator.calculate")}
        </Button>
      </form>

      {hasTree && (
        <>
          <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-3">
            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS} htmlFor="belt-tier">
                {t("calculator.belt_tier")}
              </label>
              <select
                id="belt-tier"
                className={SELECT_CLASS}
                value={beltTier}
                onChange={(e) => {
                  onBeltTierChange(e.target.value);
                }}
              >
                {BELT_TIERS.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.id} — {tier.capacity}/min
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS} htmlFor="pipe-tier">
                {t("calculator.pipe_tier")}
              </label>
              <select
                id="pipe-tier"
                className={SELECT_CLASS}
                value={pipeTier}
                onChange={(e) => {
                  onPipeTierChange(e.target.value);
                }}
              >
                {PIPE_TIERS.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.id} — {tier.capacity}/min
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="inline-flex w-fit rounded-[var(--radius)] border border-border bg-muted p-1">
            <Button
              type="button"
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                onViewModeChange("tree");
              }}
            >
              {t("calculator.view_tree")}
            </Button>
            <Button
              type="button"
              variant={viewMode === "graph" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                onViewModeChange("graph");
              }}
            >
              {t("calculator.view_graph")}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
