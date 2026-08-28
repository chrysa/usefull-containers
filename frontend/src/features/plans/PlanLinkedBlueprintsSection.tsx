import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const INPUT_CLASS =
  "rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface BlueprintOption {
  readonly name: string;
}

interface Props {
  readonly linkedBlueprints: string[];
  readonly availableBlueprints: BlueprintOption[];
  readonly linking: boolean;
  readonly onStartLink: () => void;
  readonly onCancelLink: () => void;
  readonly newBpName: string;
  readonly onNewBpNameChange: (value: string) => void;
  readonly onSubmitLink: (e: React.FormEvent) => void;
  readonly onUnlink: (bpName: string) => void;
  readonly isSaving: boolean;
}

/** Blueprints linked to a plan, with an inline form to link an available blueprint. */
export default function PlanLinkedBlueprintsSection({
  linkedBlueprints,
  availableBlueprints,
  linking,
  onStartLink,
  onCancelLink,
  newBpName,
  onNewBpNameChange,
  onSubmitLink,
  onUnlink,
  isSaving,
}: Props) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{t("plan_detail.linked_blueprints")}</h2>
        {!linking && availableBlueprints.length > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={onStartLink}>
            + {t("plan_detail.link_blueprint")}
          </Button>
        )}
      </div>

      {linking && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={onSubmitLink}>
          <select
            className={INPUT_CLASS}
            value={newBpName}
            onChange={(e) => onNewBpNameChange(e.target.value)}
            required
            aria-label={t("plan_detail.select_blueprint")}
          >
            <option value="">{t("plan_detail.select_blueprint")}</option>
            {availableBlueprints.map((bp) => (
              <option key={bp.name} value={bp.name}>
                {bp.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={isSaving || !newBpName}>
            {t("plan_detail.link")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancelLink}>
            {t("plan_detail.cancel")}
          </Button>
        </form>
      )}

      {linkedBlueprints.length === 0 && !linking && (
        <p className="text-sm text-muted-foreground">{t("plan_detail.no_blueprints")}</p>
      )}

      {linkedBlueprints.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {linkedBlueprints.map((bpName) => (
            <li
              key={bpName}
              className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-background px-3 py-2"
            >
              <Link
                to={`/blueprints/${encodeURIComponent(bpName)}`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {bpName}
              </Link>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onUnlink(bpName)}
                disabled={isSaving}
                aria-label={t("plan_detail.unlink_blueprint", { name: bpName })}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
