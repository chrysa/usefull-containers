import { useTranslation } from "react-i18next";
import type { RecipeSummary } from "@/domain/gamedata/types";

interface Props {
  recipe: RecipeSummary;
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export function RecipeCard({ recipe }: Props) {
  const { t } = useTranslation();

  return (
    <article
      className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-3.5 transition-colors hover:border-primary"
      title={recipe.id}
    >
      <p className="truncate text-sm font-semibold text-foreground">
        {recipe.name}
      </p>
      <p className="truncate font-mono text-xs text-muted-foreground">
        {recipe.id}
      </p>

      {recipe.ingredients.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("gamedata.ingredients")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.ingredients.map((ing) => (
              <span
                key={ing.item_id}
                className="rounded-[var(--radius)] border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
              >
                {ing.item_id} ×{formatAmount(ing.amount)}
              </span>
            ))}
          </div>
        </div>
      )}

      {recipe.products.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("gamedata.products")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.products.map((prod) => (
              <span
                key={prod.item_id}
                className="rounded-[var(--radius)] border border-primary bg-muted px-1.5 py-0.5 font-mono text-xs text-primary"
              >
                {prod.item_id} ×{formatAmount(prod.amount)}
              </span>
            ))}
          </div>
        </div>
      )}

      {recipe.produced_in.length > 0 && (
        <p className="mt-auto pt-1 text-xs text-muted-foreground">
          {t("gamedata.produced_in")}: {recipe.produced_in.join(", ")}
        </p>
      )}
    </article>
  );
}
