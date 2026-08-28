import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { HealthStatus } from "./types";

interface Props {
  readonly healthStatus: HealthStatus;
  readonly version: string | undefined;
}

const DOT_COLOR_BY_STATUS: Record<HealthStatus, string> = {
  pending: "bg-warning animate-pulse",
  online: "bg-success",
  offline: "bg-destructive",
};

/** Second step: shows the backend health check result. */
export default function BackendStep({ healthStatus, version }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="m-0 text-base font-semibold text-foreground">
        {t("setup.backend.title")}
      </h3>
      <p className="text-sm text-muted-foreground">{t("setup.backend.lead")}</p>
      <div
        className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-3 py-2"
        data-testid="setup-backend-status"
        data-status={healthStatus}
      >
        <span
          className={cn("size-2.5 shrink-0 rounded-full", DOT_COLOR_BY_STATUS[healthStatus])}
        />
        <span className="flex-1 text-sm text-foreground">
          {healthStatus === "pending" && t("setup.backend.checking")}
          {healthStatus === "online" &&
            t("setup.backend.online", { version: version ?? "" })}
          {healthStatus === "offline" && t("setup.backend.offline")}
        </span>
      </div>
    </>
  );
}
