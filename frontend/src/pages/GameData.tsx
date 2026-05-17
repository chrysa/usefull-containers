import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { ImportZipButton, ItemCard, RecipeCard } from "../features/gamedata";
import Skeleton from "../components/ui/Skeleton";
import {
  useGameDataStatsQuery,
  useImportGameDataMutation,
  useItemsQuery,
  useRecipesQuery,
} from "../domain/gamedata/queries";
import styles from "./GameData.module.scss";

type Tab = "items" | "recipes";

export default function GameDataPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("items");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [, startTransition] = useTransition();

  const { data: stats, refetch } = useGameDataStatsQuery();
  const importMutation = useImportGameDataMutation();
  const hasData = (stats?.item_count ?? 0) > 0 || (stats?.recipe_count ?? 0) > 0;

  const itemsQuery = useItemsQuery(tab === "items" ? debouncedSearch : "", hasData && tab === "items");
  const recipesQuery = useRecipesQuery(tab === "recipes" ? debouncedSearch : "", hasData && tab === "recipes");

  function handleImport(file: File) {
    importMutation.mutate(file, { onSuccess: () => void refetch() });
  }

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => setDebouncedSearch(value));
  }

  const result = importMutation.data;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t("gamedata.title")}</h1>
        <ImportZipButton
          onImport={handleImport}
          isImporting={importMutation.isPending}
        />
      </header>

      {importMutation.isError && (
        <p className={styles.error} role="alert">
          {importMutation.error.message}
        </p>
      )}

      {result != null && (
        <output className={styles.result}>
          {t("gamedata.import_result", {
            items: result.item_count,
            recipes: result.recipe_count,
            file: result.source_file,
          })}
        </output>
      )}

      {stats != null && !hasData && result == null && (
        <p className={styles.empty}>{t("gamedata.empty")}</p>
      )}

      {stats != null && (hasData || result != null) && (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.item_count}</span>
              <span className={styles.statLabel}>{t("gamedata.items")}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.recipe_count}</span>
              <span className={styles.statLabel}>{t("gamedata.recipes")}</span>
            </div>
          </div>
          {stats.source_file != null && (
            <p className={styles.meta}>
              {t("gamedata.source", { file: stats.source_file, date: stats.imported_at ?? "—" })}
            </p>
          )}

          <div className={styles.tabs} role="tablist" aria-label={t("gamedata.explore")}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "items"}
              className={tab === "items" ? styles.tabActive : styles.tab}
              onClick={() => { setTab("items"); setSearch(""); setDebouncedSearch(""); }}
            >
              {t("gamedata.items")} ({stats.item_count})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "recipes"}
              className={tab === "recipes" ? styles.tabActive : styles.tab}
              onClick={() => { setTab("recipes"); setSearch(""); setDebouncedSearch(""); }}
            >
              {t("gamedata.recipes")} ({stats.recipe_count})
            </button>
          </div>

          <input
            type="search"
            className={styles.searchInput}
            placeholder={t("gamedata.search_placeholder")}
            value={search}
            aria-label={t("gamedata.search_placeholder")}
            onChange={(e) => handleSearch(e.target.value)}
          />

          {tab === "items" && (
            <section className={styles.grid} aria-label={t("gamedata.items")}>
              {itemsQuery.isLoading && Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={`item-sk-${i}`} height="100px" radius="8px" />
              ))}
              {itemsQuery.data?.length === 0 && (
                <p className={styles.noResults}>{t("gamedata.no_results")}</p>
              )}
              {itemsQuery.data?.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </section>
          )}

          {tab === "recipes" && (
            <section className={styles.grid} aria-label={t("gamedata.recipes")}>
              {recipesQuery.isLoading && Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={`recipe-sk-${i}`} height="130px" radius="8px" />
              ))}
              {recipesQuery.data?.length === 0 && (
                <p className={styles.noResults}>{t("gamedata.no_results")}</p>
              )}
              {recipesQuery.data?.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
