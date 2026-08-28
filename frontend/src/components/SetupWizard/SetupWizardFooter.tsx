import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { HealthStatus, Step } from "./types";

interface Props {
  readonly step: Step;
  readonly stepIndex: number;
  readonly healthStatus: HealthStatus;
  readonly isAuthenticated: boolean;
  readonly planName: string;
  readonly isCreatingPlan: boolean;
  readonly onBack: () => void;
  readonly onNext: () => void;
  readonly onProjectStep: () => void;
  readonly onSkipPlan: () => void;
  readonly onCreatePlan: () => void;
  readonly onFinish: () => void;
}

/** Wizard footer: back button plus the primary action for the current step. */
export default function SetupWizardFooter({
  step,
  stepIndex,
  healthStatus,
  isAuthenticated,
  planName,
  isCreatingPlan,
  onBack,
  onNext,
  onProjectStep,
  onSkipPlan,
  onCreatePlan,
  onFinish,
}: Props) {
  const { t } = useTranslation();

  return (
    <footer className="flex items-center justify-between gap-2 border-t border-border px-6 py-4">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={stepIndex === 0}
        data-testid="setup-back"
      >
        {t("setup.back")}
      </Button>

      {step === "project" && (
        <Button type="button" onClick={onProjectStep} data-testid="setup-next">
          {t("setup.next")}
        </Button>
      )}

      {step === "backend" && (
        <Button
          type="button"
          onClick={onNext}
          data-testid="setup-next"
          disabled={healthStatus === "pending"}
        >
          {t("setup.next")}
        </Button>
      )}

      {step === "gamedata" && (
        <Button type="button" onClick={onNext} data-testid="setup-next">
          {t("setup.next")}
        </Button>
      )}

      {step === "first-plan" && (
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onSkipPlan} data-testid="setup-skip-plan">
            {t("setup.first_plan.skip")}
          </Button>
          {isAuthenticated && (
            <Button
              type="button"
              onClick={onCreatePlan}
              disabled={!planName.trim() || isCreatingPlan}
              data-testid="setup-create-plan"
            >
              {isCreatingPlan ? t("setup.first_plan.creating") : t("setup.first_plan.create")}
            </Button>
          )}
        </div>
      )}

      {step === "done" && (
        <Button type="button" onClick={onFinish} data-testid="setup-finish">
          {t("setup.finish")}
        </Button>
      )}
    </footer>
  );
}
