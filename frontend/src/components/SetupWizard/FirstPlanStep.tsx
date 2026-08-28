import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  readonly isAuthenticated: boolean;
  readonly planName: string;
  readonly onPlanNameChange: (value: string) => void;
  readonly hasCreatePlanError: boolean;
}

/** Fourth step: optionally create a first plan (requires authentication). */
export default function FirstPlanStep({
  isAuthenticated,
  planName,
  onPlanNameChange,
  hasCreatePlanError,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="m-0 text-base font-semibold text-foreground">
        {t("setup.first_plan.title")}
      </h3>
      <p className="text-sm text-muted-foreground">{t("setup.first_plan.lead")}</p>
      {isAuthenticated ? (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="setup-plan-name" className="text-sm font-medium text-foreground">
              {t("setup.first_plan.name_label")}
            </label>
            <input
              id="setup-plan-name"
              type="text"
              value={planName}
              onChange={(e) => onPlanNameChange(e.target.value)}
              placeholder={t("setup.first_plan.name_placeholder")}
              data-testid="setup-plan-name-input"
              autoFocus
              className="rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {hasCreatePlanError && (
            <p className="text-sm text-destructive" role="alert">
              {t("setup.first_plan.error")}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="setup-plan-auth-required">
          {t("setup.first_plan.auth_required")}{" "}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            {t("setup.first_plan.sign_in")}
          </Link>
        </p>
      )}
    </>
  );
}
