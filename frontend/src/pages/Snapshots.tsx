import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "@/components/ui/Skeleton";
import { useFactory } from "@/context/FactoryContext";
import { useDeleteSnapshotMutation, useSnapshotsQuery } from "@/domain/snapshots/queries";
import ImportSaveButton from "@/features/snapshots/ImportSaveButton";
import SnapshotCard from "@/features/snapshots/SnapshotCard";

export default function SnapshotsPage() {
  const { t } = useTranslation();
  const { currentSaveName } = useFactory();
  const { data, isLoading, isError } = useSnapshotsQuery();
  const deleteMutation = useDeleteSnapshotMutation();

  const snapshots = useMemo(() => {
    const all = data ?? [];
    const filtered = currentSaveName
      ? all.filter((snapshot) => snapshot.save_name === currentSaveName)
      : all;
    return [...filtered].sort((a, b) => b.imported_at.localeCompare(a.imported_at));
  }, [data, currentSaveName]);

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">{t("snapshots.title")}</h1>
        <ImportSaveButton />
      </header>

      {deleteMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {t("error")}: {deleteMutation.error.message}
        </p>
      )}

      {isLoading && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {Array.from({ length: 4 }).map((_item, i) => (
            <Skeleton key={`snapshot-sk-${i}`} height="100px" radius="8px" />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-destructive">{t("error")}</p>}

      {!isLoading && !isError && snapshots.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("snapshots.empty")}</p>
      )}

      {!isLoading && !isError && snapshots.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {snapshots.map((snapshot) => (
            <SnapshotCard key={snapshot.id} snapshot={snapshot} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
