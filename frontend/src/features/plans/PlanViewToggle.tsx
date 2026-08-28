import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface Props {
  readonly view: "plan" | "real";
  readonly onViewChange: (view: "plan" | "real") => void;
}

/** Tab bar switching between the planned target items and the real-vs-planned comparison. */
export default function PlanViewToggle({ view, onViewChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex w-fit rounded-[var(--radius)] border border-border bg-muted p-1" role="tablist">
      <Button
        type="button"
        role="tab"
        id="tab-plan"
        aria-selected={view === "plan"}
        aria-controls="tabpanel-plan"
        variant={view === "plan" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("plan")}
      >
        {t("plan_detail.target_items")}
      </Button>
      <Button
        type="button"
        role="tab"
        id="tab-real"
        aria-selected={view === "real"}
        aria-controls="tabpanel-real"
        variant={view === "real" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("real")}
      >
        {t("real_vs_planned.tab")}
      </Button>
    </div>
  );
}
