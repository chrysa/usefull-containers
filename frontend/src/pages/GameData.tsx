import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { ImportZipButton, ItemsList, RecipesList } from "@/features/gamedata";
import { Button } from "@/components/ui/button";
import { useGameDataStatsQuery, useImportGameDataMutation } from "@/domain/gamedata/queries";

type Tab = "items" | "recipes";

export default function GameDataPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("items");

  const { data: stats, refetch } = useGameDataStatsQuery();
  const importMutation = useImportGameDataMutation();
  const hasData = (stats?.item_count ?? 0) > 0 || (stats?.recipe_count ?? 0) > 0;
  const result = importMutation.data;

  function handleImport(file: File) {
    importMutation.mutate(file, { onSuccess: () => void refetch() });
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab: Tab = tab === "items" ? "recipes" : "items";
    setTab(nextTab);
    const nextTabId = nextTab === "items" ? "gamedata-tab-items" : "gamedata-tab-recipes";
    document.getElementById(nextTabId)?.focus();
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">{t("gamedata.title")}</h1>
        <ImportZipButton onImport={handleImport} isImporting={importMutation.isPending} />
      </header>

      {importMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {importMutation.error.message}
        </p>
      )}

      {result != null && (
        <output className="rounded-[var(--radius)] border border-border bg-card px-4 py-2 text-sm text-foreground">
          {t("gamedata.import_result", {
            items: result.item_count,
            recipes: result.recipe_count,
            file: result.source_file,
          })}
        </output>
      )}

      {stats != null && !hasData && result == null && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("gamedata.empty")}</p>
      )}

      {stats != null && (hasData || result != null) && (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col rounded-[var(--radius)] border border-border bg-card px-4 py-2">
              <span className="text-lg font-semibold text-foreground">{stats.item_count}</span>
              <span className="text-xs text-muted-foreground">{t("gamedata.items")}</span>
            </div>
            <div className="flex flex-col rounded-[var(--radius)] border border-border bg-card px-4 py-2">
              <span className="text-lg font-semibold text-foreground">{stats.recipe_count}</span>
              <span className="text-xs text-muted-foreground">{t("gamedata.recipes")}</span>
            </div>
          </div>

          {stats.source_file != null && (
            <p className="text-xs text-muted-foreground">
              {t("gamedata.source", { file: stats.source_file, date: stats.imported_at ?? "—" })}
            </p>
          )}

          <div
            className="inline-flex w-fit rounded-[var(--radius)] border border-border bg-muted p-1"
            role="tablist"
            aria-label={t("gamedata.explore")}
            onKeyDown={handleTabKeyDown}
          >
            <Button
              id="gamedata-tab-items"
              type="button"
              role="tab"
              tabIndex={tab === "items" ? 0 : -1}
              aria-selected={tab === "items"}
              aria-controls="gamedata-panel-items"
              variant={tab === "items" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab("items")}
            >
              {t("gamedata.items")} ({stats.item_count})
            </Button>
            <Button
              id="gamedata-tab-recipes"
              type="button"
              role="tab"
              tabIndex={tab === "recipes" ? 0 : -1}
              aria-selected={tab === "recipes"}
              aria-controls="gamedata-panel-recipes"
              variant={tab === "recipes" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab("recipes")}
            >
              {t("gamedata.recipes")} ({stats.recipe_count})
            </Button>
          </div>

          {tab === "items" && (
            <div id="gamedata-panel-items" role="tabpanel" aria-labelledby="gamedata-tab-items">
              <ItemsList hasData={hasData} />
            </div>
          )}
          {tab === "recipes" && (
            <div
              id="gamedata-panel-recipes"
              role="tabpanel"
              aria-labelledby="gamedata-tab-recipes"
            >
              <RecipesList hasData={hasData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
