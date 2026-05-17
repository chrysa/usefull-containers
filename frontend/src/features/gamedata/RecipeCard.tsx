import { useTranslation } from "react-i18next";
import type { RecipeSummary } from "../../domain/gamedata/types";
import styles from "./RecipeCard.module.scss";

interface Props {
  recipe: RecipeSummary;
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export function RecipeCard({ recipe }: Props) {
  const { t } = useTranslation();

  return (
    <article className={styles.card} title={recipe.id}>
      <p className={styles.name}>{recipe.name}</p>
      <p className={styles.id}>{recipe.id}</p>

      {recipe.ingredients.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>{t("gamedata.ingredients")}</p>
          <div className={styles.ingredients}>
            {recipe.ingredients.map((ing) => (
              <span key={ing.item_id} className={styles.ingredient}>
                {ing.item_id} ×{formatAmount(ing.amount)}
              </span>
            ))}
          </div>
        </div>
      )}

      {recipe.products.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>{t("gamedata.products")}</p>
          <div className={styles.products}>
            {recipe.products.map((prod) => (
              <span key={prod.item_id} className={styles.product}>
                {prod.item_id} ×{formatAmount(prod.amount)}
              </span>
            ))}
          </div>
        </div>
      )}

      {recipe.produced_in.length > 0 && (
        <p className={styles.machine}>
          {t("gamedata.produced_in")}: {recipe.produced_in.join(", ")}
        </p>
      )}
    </article>
  );
}
