import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRecipesQuery } from "@/domain/gamedata/queries";
import { RecipeCard } from "./RecipeCard";
import Skeleton from "@/components/ui/Skeleton";
import styles from "./SearchList.module.scss";

interface Props {
  readonly hasData: boolean;
}

export function RecipesList({ hasData }: Props) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const { data: recipes, isLoading } = useRecipesQuery(q, hasData);

  return (
    <div className={styles.container}>
      <label className={styles.search}>
        <span>🔍</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("gamedata.search_recipes")}
          disabled={!hasData}
        />
      </label>

      {isLoading && (
        <div className={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && recipes != null && recipes.length > 0 && (
        <>
          <p className={styles.count}>{t("gamedata.count_recipes", { count: recipes.length })}</p>
          <div className={styles.list}>
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      )}

      {!isLoading && recipes != null && recipes.length === 0 && (
        <p className={styles.empty}>{t("gamedata.no_results")}</p>
      )}

      {!hasData && (
        <p className={styles.empty}>{t("gamedata.empty")}</p>
      )}
    </div>
  );
}
