import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DiffRow, DiffStatus } from "@/domain/savefile/diff";

const STATUS_CLASS: Record<DiffStatus, string> = {
  OK: "text-muted-foreground",
  UNDER: "text-destructive",
  OVER: "text-warning",
  MISSING: "text-destructive",
  UNPLANNED: "text-warning",
  UNMATCHED: "text-muted-foreground",
};

const STATUS_KEY: Record<DiffStatus, string> = {
  OK: "diff.status_ok",
  UNDER: "diff.status_under",
  OVER: "diff.status_over",
  MISSING: "diff.status_missing",
  UNPLANNED: "diff.status_unplanned",
  UNMATCHED: "diff.status_unmatched",
};

interface Props {
  rows: readonly DiffRow[];
}

export default function DiffTable({ rows }: Props) {
  const { t } = useTranslation();

  return (
    <table className="w-full border-collapse text-sm" aria-label={t("diff.table_title")}>
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-2 pr-4 font-medium">{t("diff.col_recipe")}</th>
          <th className="py-2 pr-4 font-medium">{t("diff.col_planned")}</th>
          <th className="py-2 pr-4 font-medium">{t("diff.col_actual")}</th>
          <th className="py-2 pr-4 font-medium">{t("diff.col_status")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.recipe_id} className="border-b border-border/50">
            <td className="py-2 pr-4 text-foreground">{row.recipe_name ?? row.recipe_id}</td>
            <td className="py-2 pr-4 font-mono text-foreground">{row.planned.toFixed(2)}</td>
            <td className="py-2 pr-4 font-mono text-foreground">{row.actual.toFixed(2)}</td>
            <td className={cn("py-2 pr-4 font-medium", STATUS_CLASS[row.status])}>
              {t(STATUS_KEY[row.status])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
