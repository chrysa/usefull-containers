import { useTranslation } from "react-i18next";
import type { FlatRequirement } from "@/domain/gamedata/calculator";
import { transportRequirement } from "@/domain/gamedata/logistics";
import { formatQty } from "./formatters";
import TransportBadge from "./TransportBadge";

interface Props {
  readonly flatReqs: readonly FlatRequirement[];
  readonly beltTier: string;
  readonly pipeTier: string;
}

/** Renders the flattened raw/intermediate requirements table for the calculated tree. */
export default function RawRequirementsTable({ flatReqs, beltTier, pipeTier }: Props) {
  const { t } = useTranslation();
  if (flatReqs.length === 0) return null;

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{t("calculator.raw_requirements")}</h2>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-1 font-medium">{t("calculator.col_item")}</th>
            <th className="py-1 font-medium">{t("calculator.col_quantity")}</th>
            <th className="py-1 font-medium">{t("calculator.col_transport")}</th>
            <th className="py-1 font-medium">{t("calculator.col_type")}</th>
          </tr>
        </thead>
        <tbody>
          {flatReqs.map((req) => {
            const transport = transportRequirement(req.quantity, req.is_fluid);
            return (
              <tr
                key={req.item_id}
                className={`border-b border-border ${req.is_raw ? "bg-warning/10" : ""}`}
              >
                <td className="py-1 text-foreground">{req.item_name}</td>
                <td className="py-1 font-mono text-muted-foreground">{formatQty(req.quantity)}</td>
                <td className="py-1">
                  <TransportBadge transport={transport} beltTier={beltTier} pipeTier={pipeTier} />
                </td>
                <td className="py-1 text-muted-foreground">
                  {req.is_raw ? t("calculator.type_raw") : t("calculator.type_intermediate")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
