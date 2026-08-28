import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRecipesQuery } from "@/domain/gamedata/queries";
import { RecipeCard } from "./RecipeCard";
import { SearchInput } from "./SearchInput";
import Skeleton from "@/components/ui/Skeleton";

interface Props {
  readonly hasData: boolean;
}

export function RecipesList({ hasData }: Props) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const { data: recipes, isLoading, isError } = useRecipesQuery(q, hasData);

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        value={q}
        onChange={setQ}
        placeholder={t("gamedata.search_recipes")}
        disabled={!hasData}
      />

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <p className="py-8 text-center text-sm text-destructive" role="alert">
          {t("gamedata.error")}
        </p>
      )}

      {!isLoading && !isError && recipes != null && recipes.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {t("gamedata.count_recipes", { count: recipes.length })}
          </p>
          <div className="flex flex-col gap-2">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      )}

      {!isLoading && !isError && recipes != null && recipes.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("gamedata.no_results")}
        </p>
      )}

      {!hasData && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("gamedata.empty")}
        </p>
      )}
    </div>
  );
}
