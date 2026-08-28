import { Factory as FactoryIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFactory } from "@/context/FactoryContext";

/**
 * Dropdown selector for the current factory (save file), scoped to the
 * whole app via `FactoryProvider`. Shows the snapshot count as a badge next
 * to each option and falls back to a muted empty state when no snapshot
 * has been imported yet.
 */
export default function FactorySelector() {
  const { t } = useTranslation();
  const { factories, currentSaveName, setCurrentSaveName } = useFactory();

  if (factories.length === 0) {
    return (
      <span className="text-sm text-muted-foreground" data-testid="factory-selector-empty">
        {t("factory.no_factory")}
      </span>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm" data-testid="factory-selector">
      <FactoryIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{t("factory.select_label")}</span>
      <select
        className="h-9 rounded-[var(--radius)] border border-border bg-card px-2 text-sm text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={currentSaveName ?? ""}
        onChange={(event) => setCurrentSaveName(event.target.value)}
        aria-label={t("factory.select_label")}
      >
        {factories.map((factory) => (
          <option key={factory.saveName} value={factory.saveName}>
            {factory.saveName} — {t("factory.snapshot_count", { count: factory.snapshotCount })}
          </option>
        ))}
      </select>
    </label>
  );
}
