import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFactory } from "@/context/FactoryContext";
import { useGameDataStatsQuery, useItemsQuery, useRecipesQuery } from "@/domain/gamedata/queries";
import { usePlansQuery } from "@/domain/plans/queries";
import { useSnapshotsQuery } from "@/domain/snapshots/queries";
import { diffPlanVsSnapshot } from "@/domain/savefile/diff";
import DiffTable from "@/features/diff/DiffTable";

export default function DiffPage() {
  const { t } = useTranslation();
  const { currentSaveName } = useFactory();
  const [planId, setPlanId] = useState("");
  const [snapshotId, setSnapshotId] = useState("");

  const statsQuery = useGameDataStatsQuery();
  const hasGameData = (statsQuery.data?.item_count ?? 0) > 0;
  const itemsQuery = useItemsQuery("", hasGameData);
  const recipesQuery = useRecipesQuery("", hasGameData);
  const plansQuery = usePlansQuery();
  const snapshotsQuery = useSnapshotsQuery();

  const snapshots = useMemo(() => {
    const all = snapshotsQuery.data ?? [];
    return currentSaveName
      ? all.filter((snapshot) => snapshot.save_name === currentSaveName)
      : all;
  }, [snapshotsQuery.data, currentSaveName]);

  const plan = plansQuery.data?.find((candidate) => candidate.id === planId) ?? null;
  const snapshot = snapshots.find((candidate) => candidate.id === snapshotId) ?? null;

  const isLoading =
    statsQuery.isLoading || itemsQuery.isLoading || recipesQuery.isLoading ||
    plansQuery.isLoading || snapshotsQuery.isLoading;
  const isError =
    statsQuery.isError || itemsQuery.isError || recipesQuery.isError ||
    plansQuery.isError || snapshotsQuery.isError;

  const rows = useMemo(() => {
    if (!plan || !snapshot || !itemsQuery.data || !recipesQuery.data) return null;
    return diffPlanVsSnapshot(plan.target_items, snapshot.data, recipesQuery.data, itemsQuery.data);
  }, [plan, snapshot, itemsQuery.data, recipesQuery.data]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">{t("diff.title")}</h1>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
      {isError && <p className="text-sm text-destructive">{t("error")}</p>}

      {!isLoading && !isError && !hasGameData && (
        <p className="text-sm text-destructive">{t("diff.needs_gamedata")}</p>
      )}

      {!isLoading && !isError && hasGameData && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            {t("diff.select_plan")}
            <select
              className="h-9 rounded-[var(--radius)] border border-border bg-card px-3 text-sm text-foreground"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              aria-label={t("diff.select_plan")}
            >
              <option value="">{t("diff.choose")}</option>
              {(plansQuery.data ?? []).map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            {t("diff.select_snapshot")}
            <select
              className="h-9 rounded-[var(--radius)] border border-border bg-card px-3 text-sm text-foreground"
              value={snapshotId}
              onChange={(e) => setSnapshotId(e.target.value)}
              aria-label={t("diff.select_snapshot")}
            >
              <option value="">{t("diff.choose")}</option>
              {snapshots.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!isLoading && !isError && hasGameData && (!planId || !snapshotId) && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("diff.empty")}</p>
      )}

      {rows && <DiffTable rows={rows} />}
    </div>
  );
}
