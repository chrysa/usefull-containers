import { useTranslation } from "react-i18next";
import { ImportZipButton } from "../features/gamedata";
import {
  useGameDataStatsQuery,
  useImportGameDataMutation,
} from "../domain/gamedata/queries";
import type { GameDataImportResult } from "../domain/gamedata/types";
import styles from "./GameData.module.scss";

export default function GameDataPage() {
  const { t } = useTranslation();
  const { data: stats, refetch } = useGameDataStatsQuery();
  const importMutation = useImportGameDataMutation();

  function handleImport(file: File) {
    importMutation.mutate(file, { onSuccess: () => void refetch() });
  }

  const result = importMutation.data as GameDataImportResult | undefined;

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
        <p className={styles.result} role="status">
          {t("gamedata.import_result", {
            items: result.item_count,
            recipes: result.recipe_count,
            file: result.source_file,
          })}
        </p>
      )}

      {stats != null && stats.item_count === 0 && result == null && (
        <p className={styles.empty}>{t("gamedata.empty")}</p>
      )}

      {stats != null && (stats.item_count > 0 || result != null) && (
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
        </>
      )}
    </div>
  );
}
