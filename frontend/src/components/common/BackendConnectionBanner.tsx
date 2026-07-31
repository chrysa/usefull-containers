import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import styles from "./BackendConnectionBanner.module.scss";

export default function BackendConnectionBanner() {
  const { t } = useTranslation("common");
  const isDown = useBackendStatus();
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  if (!isDown) return null;

  // Re-run the cached queries; a successful one flips useBackendStatus back to
  // reachable and unmounts this banner, so users don't have to reload the page.
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await queryClient.refetchQueries();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div role="alert" aria-live="assertive" className={styles.banner}>
      <span aria-hidden="true">⚠️</span>
      <span>{t("errors.backendDisconnected")}</span>
      <button
        type="button"
        className={styles.retry}
        onClick={handleRetry}
        disabled={retrying}
        data-testid="backend-retry"
      >
        {t("errors.retryNow")}
      </button>
    </div>
  );
}
