import { useTranslation } from "react-i18next";
import { BlueprintCard, UploadButton } from "../features/blueprints";
import Skeleton from "../components/ui/Skeleton";
import {
  useBlueprintsQuery,
  useDeleteBlueprintMutation,
  useDownloadAllBlueprints,
  useUploadBlueprintMutation,
} from "../domain/blueprints/queries";
import styles from "./Blueprints.module.scss";

export default function BlueprintsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useBlueprintsQuery();
  const uploadMutation = useUploadBlueprintMutation();
  const deleteMutation = useDeleteBlueprintMutation();
  const downloadAllMutation = useDownloadAllBlueprints();

  function handleUpload(formData: FormData) {
    uploadMutation.mutate(formData);
  }

  function handleDelete(name: string) {
    // eslint-disable-next-line no-alert
    if (!globalThis.confirm(t("blueprints.confirm_delete", { name }))) return;
    deleteMutation.mutate(name);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t("blueprints.title")}</h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.downloadAllButton}
            onClick={() => downloadAllMutation.mutate()}
            disabled={downloadAllMutation.isPending}
          >
            {downloadAllMutation.isPending
              ? t("blueprints.downloading")
              : t("blueprints.download_all")}
          </button>
          <UploadButton
            onUpload={handleUpload}
            isUploading={uploadMutation.isPending}
          />
        </div>
      </header>

      {uploadMutation.isError && (
        <p className={styles.error}>{t("error")}: {uploadMutation.error.message}</p>
      )}
      {deleteMutation.isError && (
        <p className={styles.error}>{t("error")}: {deleteMutation.error.message}</p>
      )}
      {downloadAllMutation.isError && (
        <p className={styles.error}>{t("error")}: {downloadAllMutation.error.message}</p>
      )}

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_item, i) => (
            // skeleton placeholders — index key acceptable here (no reorder)
            // eslint-disable-next-line react/no-array-index-key
            <Skeleton key={`skeleton-${i}`} height="120px" radius="8px" />
          ))}
        </div>
      )}

      {isError && <p className={styles.error}>{t("error")}</p>}

      {data?.blueprints.length === 0 && (
        <p className={styles.empty}>{t("blueprints.empty")}</p>
      )}

      {data != null && data.blueprints.length > 0 && (
        <>
          <p className={styles.count}>
            {t("blueprints.count", { count: data.total })}
          </p>
          <div className={styles.grid}>
            {data.blueprints.map((bp) => (
              <BlueprintCard
                key={bp.name}
                blueprint={bp}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
