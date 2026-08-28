import { useTranslation } from "react-i18next";
import { ImportZipButton } from "@/features/gamedata";

interface Props {
  readonly itemCount: number;
  readonly recipeCount: number;
  readonly isImporting: boolean;
  readonly importError: string | undefined;
  readonly onImport: (file: File) => void;
}

/** Third step: import (or confirm) the game data used to build the catalog. */
export default function GameDataStep({
  itemCount,
  recipeCount,
  isImporting,
  importError,
  onImport,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="m-0 text-base font-semibold text-foreground">
        {t("setup.gamedata.title")}
      </h3>
      <p className="text-sm text-muted-foreground">{t("setup.gamedata.lead")}</p>
      <div
        className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-card px-3 py-2"
        data-testid="setup-gamedata-status"
      >
        <span className="flex-1 text-sm text-foreground">
          {itemCount > 0
            ? t("setup.gamedata.loaded", { items: itemCount, recipes: recipeCount })
            : t("setup.gamedata.empty")}
        </span>
        <ImportZipButton onImport={onImport} isImporting={isImporting} />
      </div>
      {importError && (
        <p className="text-sm text-destructive" role="alert">
          {importError}
        </p>
      )}
    </>
  );
}
