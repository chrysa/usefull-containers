import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useBackendStatus } from "@/hooks/useBackendStatus";

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
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-[13px] font-medium text-destructive-foreground animate-[slide-down_0.25s_ease-out]"
    >
      <span aria-hidden="true">⚠️</span>
      <span>{t("errors.backendDisconnected")}</span>
      <button
        type="button"
        className="ml-2 cursor-pointer rounded-[var(--radius)] border border-destructive-foreground bg-transparent px-2.5 py-0.5 font-bold text-destructive-foreground [&:hover:not(:disabled)]:bg-destructive-foreground [&:hover:not(:disabled)]:text-destructive disabled:cursor-progress disabled:opacity-60"
        onClick={handleRetry}
        disabled={retrying}
        data-testid="backend-retry"
      >
        {t("errors.retryNow")}
      </button>
    </div>
  );
}
