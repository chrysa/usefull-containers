import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../context/useToast";
import {
  useGameDataStatsQuery,
  useItemsQuery,
  useRecipesQuery,
} from "../../domain/gamedata/queries";
import { parseSaveFile } from "../../domain/savefile/parseSave";
import {
  diffPlanVsSnapshot,
  type DiffRow,
  type DiffStatus,
} from "../../domain/savefile/diff";
import type { CompactSnapshot } from "../../domain/savefile/types";
import { useCreateSnapshotMutation } from "../../domain/snapshots/queries";
import type { TargetItem } from "../../domain/plans/types";
import styles from "./RealVsPlanned.module.scss";

const STATUS_CLASS: Record<DiffStatus, string> = {
  OK: styles.ok,
  UNDER: styles.under,
  OVER: styles.over,
  MISSING: styles.missing,
  UNPLANNED: styles.unplanned,
  UNMATCHED: styles.unmatched,
};

const STATUS_KEY: Record<DiffStatus, string> = {
  OK: "real_vs_planned.status_ok",
  UNDER: "real_vs_planned.status_under",
  OVER: "real_vs_planned.status_over",
  MISSING: "real_vs_planned.status_missing",
  UNPLANNED: "real_vs_planned.status_unplanned",
  UNMATCHED: "real_vs_planned.status_unmatched",
};

interface Props {
  targetItems: TargetItem[];
}

export default function RealVsPlanned({ targetItems }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const statsQuery = useGameDataStatsQuery();
  const hasGameData = (statsQuery.data?.item_count ?? 0) > 0;
  const itemsQuery = useItemsQuery("", hasGameData);
  const recipesQuery = useRecipesQuery("", hasGameData);
  const createSnapshot = useCreateSnapshotMutation();

  const [snapshot, setSnapshot] = useState<CompactSnapshot | null>(null);
  const [rows, setRows] = useState<DiffRow[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (
      itemsQuery.isLoading ||
      recipesQuery.isLoading ||
      !itemsQuery.data ||
      !recipesQuery.data
    ) {
      showToast(t("real_vs_planned.game_data_loading"), "error");
      return;
    }
    setError(false);
    setParsing(true);
    try {
      const snap = await parseSaveFile(file);
      setSnapshot(snap);
      const items = itemsQuery.data ?? [];
      const recipes = recipesQuery.data ?? [];
      setRows(diffPlanVsSnapshot(targetItems, snap, recipes, items));
      createSnapshot.mutate(
        { name: snap.save_name, data: snap },
        {
          onSuccess: () => showToast(t("real_vs_planned.saved")),
          onError: () => showToast(t("real_vs_planned.save_error"), "error"),
        },
      );
    } catch {
      setError(true);
      setSnapshot(null);
      setRows(null);
    } finally {
      setParsing(false);
    }
  }

  if (statsQuery.isLoading) {
    return <p>{t("loading")}</p>;
  }

  if (!hasGameData) {
    return <p className={styles.error}>{t("real_vs_planned.needs_gamedata")}</p>;
  }

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""}`}
        onClick={() => !parsing && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!parsing) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (parsing) return;
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        role="button"
        aria-label={t("real_vs_planned.drop_hint")}
        aria-busy={parsing}
        aria-disabled={parsing}
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !parsing)
            inputRef.current?.click();
        }}
      >
        {parsing ? t("real_vs_planned.parsing") : t("real_vs_planned.drop_hint")}
        <input
          ref={inputRef}
          type="file"
          accept=".sav"
          className={styles.hiddenInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {error && <p className={styles.error}>{t("real_vs_planned.parse_error")}</p>}

      {snapshot && (
        <p>{t("real_vs_planned.save_name", { name: snapshot.save_name })}</p>
      )}

      {!snapshot && !parsing && !error && (
        <p>{t("real_vs_planned.empty")}</p>
      )}

      {rows && (
        <table className={styles.table} aria-label={t("real_vs_planned.title")}>
          <thead>
            <tr>
              <th>{t("real_vs_planned.col_recipe")}</th>
              <th>{t("real_vs_planned.col_planned")}</th>
              <th>{t("real_vs_planned.col_actual")}</th>
              <th>{t("real_vs_planned.col_status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.recipe_id}>
                <td>{r.recipe_name ?? r.recipe_id}</td>
                <td>{r.planned.toFixed(2)}</td>
                <td>{r.actual.toFixed(2)}</td>
                <td>
                  <span className={`${styles.chip} ${STATUS_CLASS[r.status]}`}>
                    {t(STATUS_KEY[r.status])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
