import { useTranslation } from "react-i18next";
import type { MachineSummaryEntry } from "@/domain/gamedata/calculator";
import type { PowerSummary } from "@/domain/gamedata/power";
import { formatQty, prettifyMachine } from "./formatters";

const CHIP_CLASS =
  "flex flex-col items-center gap-0.5 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-center";

interface MachineSummaryProps {
  readonly machineSummary: readonly MachineSummaryEntry[];
}

/** Renders the machine count chips for the calculated production chain. */
export function MachineSummarySection({ machineSummary }: MachineSummaryProps) {
  const { t } = useTranslation();
  if (machineSummary.length === 0) return null;

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{t("calculator.machine_summary")}</h2>
      <div className="flex flex-wrap gap-2">
        {machineSummary.map((m) => (
          <div key={m.machine_id} className={CHIP_CLASS}>
            <span className="font-mono text-sm font-semibold text-foreground">{m.total_machines}</span>
            <span className="text-xs text-muted-foreground">{prettifyMachine(m.machine_id)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface PowerSummaryProps {
  readonly powerSummary: PowerSummary;
}

/** Renders the estimated power draw chips for the calculated production chain. */
export function PowerSummarySection({ powerSummary }: PowerSummaryProps) {
  const { t } = useTranslation();
  if (powerSummary.entries.length === 0) return null;

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{t("calculator.power_title")}</h2>
      <p className="mb-2 text-xs text-muted-foreground">{t("calculator.power_clock_note")}</p>
      <div className="flex flex-wrap gap-2">
        <div className={`${CHIP_CLASS} border-primary/40`}>
          <span className="font-mono text-sm font-semibold text-primary">
            {formatQty(powerSummary.totalMW)} {t("calculator.power_unit_mw")}
          </span>
          <span className="text-xs text-muted-foreground">{t("calculator.power_total")}</span>
        </div>
        {powerSummary.entries.map((e) => (
          <div key={e.machine_id} className={CHIP_CLASS}>
            <span className="font-mono text-sm font-semibold text-foreground">
              {e.megawatts === null
                ? t("calculator.power_variable")
                : `${formatQty(e.megawatts)} ${t("calculator.power_unit_mw")}`}
            </span>
            <span className="text-xs text-muted-foreground">
              {e.machines}× {prettifyMachine(e.machine_id)}
            </span>
          </div>
        ))}
      </div>
      {powerSummary.hasUnknown && (
        <p className="mt-2 text-xs text-muted-foreground">{t("calculator.power_unknown_note")}</p>
      )}
    </section>
  );
}
