import { useTranslation } from "react-i18next";
import { useHealthQuery } from "@/api/health/queries";

/**
 * Persistent amber strip shown at the top of every page while the app runs on
 * fixture data. It is visible when either:
 *  - the backend reports `demo_mode` via GET /api/v1/health (the primary,
 *    credential-free exploration mode), or
 *  - the frontend build sets `VITE_DEMO_MODE=true` (a static override useful
 *    for deploying the UI with no backend reachable).
 *
 * Off by default: both signals must be falsy for the banner to stay hidden.
 */
export default function DemoBanner() {
  const { t } = useTranslation();
  const { data } = useHealthQuery();

  const envDemo = import.meta.env.VITE_DEMO_MODE === "true";
  const backendDemo = data?.demo_mode === true;

  if (!envDemo && !backendDemo) return null;

  return (
    <div
      role="status"
      data-testid="demo-banner"
      className="sticky top-0 z-[100] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-sm font-medium text-warning-foreground"
    >
      <span aria-hidden="true">🧪</span>
      <span className="font-bold uppercase tracking-wide">{t("demo.label")}</span>
      <span>{t("demo.message")}</span>
    </div>
  );
}
