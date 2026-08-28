import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BlueprintCard, TagFilterBar, UploadButton } from "@/features/blueprints";
import Skeleton from "@/components/ui/Skeleton";
import { DropZone } from "@/components/DropZone/DropZone";
import { Button } from "@/components/ui/button";
import {
  useBatchUploadMutation,
  useBlueprintsQuery,
  useDeleteBlueprintMutation,
  useDownloadAllBlueprints,
  useImportZipMutation,
  useUploadBlueprintMutation,
} from "@/domain/blueprints/queries";

export default function BlueprintsPage() {
  const { t } = useTranslation();
  const [activeTags, setActiveTags] = useState<ReadonlySet<string>>(new Set());
  const { data, isLoading, isError } = useBlueprintsQuery();
  const uploadMutation = useUploadBlueprintMutation();
  const deleteMutation = useDeleteBlueprintMutation();
  const downloadAllMutation = useDownloadAllBlueprints();
  const batchUploadMutation = useBatchUploadMutation();
  const importZipMutation = useImportZipMutation();

  function handleUpload(formData: FormData) {
    uploadMutation.mutate(formData);
  }

  function handleDelete(name: string) {
    if (!globalThis.confirm(t("blueprints.confirm_delete", { name }))) return;
    deleteMutation.mutate(name);
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const bp of data?.blueprints ?? []) {
      for (const tag of bp.tags) tagSet.add(tag);
    }
    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredBlueprints = useMemo(() => {
    const bps = data?.blueprints ?? [];
    if (activeTags.size === 0) return bps;
    return bps.filter((bp) => bp.tags.some((tag) => activeTags.has(tag)));
  }, [data, activeTags]);

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">{t("blueprints.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadAllMutation.mutate()}
            disabled={downloadAllMutation.isPending}
          >
            {downloadAllMutation.isPending
              ? t("blueprints.downloading")
              : t("blueprints.download_all")}
          </Button>
          <UploadButton onUpload={handleUpload} isUploading={uploadMutation.isPending} />
          <label className="inline-flex cursor-pointer items-center">
            <input
              type="file"
              accept=".zip"
              hidden
              aria-label={t("blueprints.import_zip_hint")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importZipMutation.mutate(file);
                e.target.value = "";
              }}
            />
            <span className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              {importZipMutation.isPending
                ? t("blueprints.importing_zip")
                : t("blueprints.import_zip")}
            </span>
          </label>
        </div>
      </header>

      {uploadMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {t("error")}: {uploadMutation.error.message}
        </p>
      )}
      {deleteMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {t("error")}: {deleteMutation.error.message}
        </p>
      )}
      {downloadAllMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {t("error")}: {downloadAllMutation.error.message}
        </p>
      )}
      {batchUploadMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {t("error")}: {batchUploadMutation.error.message}
        </p>
      )}
      {importZipMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {t("error")}: {importZipMutation.error.message}
        </p>
      )}
      {importZipMutation.isSuccess && importZipMutation.data && (
        <p className="text-sm text-muted-foreground">
          {t("blueprints.import_result", {
            created: importZipMutation.data.created.length,
            updated: importZipMutation.data.updated.length,
            failed: importZipMutation.data.failed.length,
          })}
        </p>
      )}

      <DropZone
        onUpload={(files) => batchUploadMutation.mutate(files)}
        isUploading={batchUploadMutation.isPending}
        result={batchUploadMutation.data ?? null}
      />

      {isLoading && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {Array.from({ length: 6 }).map((_item, i) => (
            <Skeleton key={`blueprint-sk-${i}`} height="120px" radius="8px" />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-destructive">{t("error")}</p>}

      {data?.blueprints.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("blueprints.empty")}</p>
      )}

      {data != null && data.blueprints.length > 0 && (
        <>
          <TagFilterBar
            allTags={allTags}
            activeTags={activeTags}
            onToggle={toggleTag}
            onClear={() => setActiveTags(new Set())}
          />
          <p className="text-sm text-muted-foreground">
            {t("blueprints.count", {
              count: activeTags.size > 0 ? filteredBlueprints.length : data.total,
            })}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {filteredBlueprints.map((bp) => (
              <BlueprintCard key={bp.name} blueprint={bp} onDelete={handleDelete} />
            ))}
          </div>
          {filteredBlueprints.length === 0 && activeTags.size > 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("blueprints.no_tag_match")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
