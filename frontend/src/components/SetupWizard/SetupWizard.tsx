import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useHealthQuery } from "../../api/health/queries";
import { useCreatePlanMutation } from "../../domain/plans/queries";
import styles from "./SetupWizard.module.scss";

interface SetupWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

type Step = "welcome" | "backend" | "first-plan" | "done";

const STEPS: Step[] = ["welcome", "backend", "first-plan", "done"];

export default function SetupWizard({ onClose, onComplete }: SetupWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const health = useHealthQuery();
  const createPlan = useCreatePlanMutation();

  const [step, setStep] = useState<Step>("welcome");
  const [planName, setPlanName] = useState<string>("");
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleCreatePlan = async () => {
    if (!planName.trim()) return;
    try {
      const plan = await createPlan.mutateAsync({
        name: planName.trim(),
        description: "",
      });
      setCreatedPlanId(plan.id);
      goNext();
    } catch {
      // mutation error surfaces via mutation state; user can retry
    }
  };

  const handleFinish = () => {
    onComplete();
    if (createdPlanId) {
      navigate(`/plans/${createdPlanId}`);
    } else {
      navigate("/plans");
    }
  };

  const healthStatus: "pending" | "online" | "offline" = health.isLoading
    ? "pending"
    : health.isSuccess
      ? "online"
      : "offline";

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-wizard-title"
      data-testid="setup-wizard"
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 id="setup-wizard-title" className={styles.title}>
            {t("setup.title")}
          </h2>
          <button
            type="button"
            className={styles.skip}
            onClick={onClose}
            aria-label={t("setup.skip_aria")}
          >
            {t("setup.skip")}
          </button>
        </header>

        <div className={styles.steps} aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={[
                styles.stepDot,
                i === stepIndex ? styles.active : "",
                i < stepIndex ? styles.done : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>

        <div className={styles.body}>
          {step === "welcome" && (
            <>
              <h3 className={styles.stepTitle}>{t("setup.welcome.title")}</h3>
              <p className={styles.stepLead}>{t("setup.welcome.lead")}</p>
              <ul className={styles.recap}>
                <li>{t("setup.welcome.bullet_backend")}</li>
                <li>{t("setup.welcome.bullet_plan")}</li>
                <li>{t("setup.welcome.bullet_explore")}</li>
              </ul>
            </>
          )}

          {step === "backend" && (
            <>
              <h3 className={styles.stepTitle}>{t("setup.backend.title")}</h3>
              <p className={styles.stepLead}>{t("setup.backend.lead")}</p>
              <div
                className={[styles.statusRow, styles[healthStatus]]
                  .filter(Boolean)
                  .join(" ")}
                data-testid="setup-backend-status"
                data-status={healthStatus}
              >
                <span
                  className={[styles.statusDot, styles[healthStatus]].join(" ")}
                />
                <span className={styles.statusText}>
                  {healthStatus === "pending" && t("setup.backend.checking")}
                  {healthStatus === "online" &&
                    t("setup.backend.online", {
                      version: health.data?.version ?? "",
                    })}
                  {healthStatus === "offline" && t("setup.backend.offline")}
                </span>
              </div>
            </>
          )}

          {step === "first-plan" && (
            <>
              <h3 className={styles.stepTitle}>
                {t("setup.first_plan.title")}
              </h3>
              <p className={styles.stepLead}>{t("setup.first_plan.lead")}</p>
              <div className={styles.field}>
                <label htmlFor="setup-plan-name">
                  {t("setup.first_plan.name_label")}
                </label>
                <input
                  id="setup-plan-name"
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder={t("setup.first_plan.name_placeholder")}
                  data-testid="setup-plan-name-input"
                  autoFocus
                />
              </div>
              {createPlan.isError && (
                <p className={styles.stepLead} role="alert">
                  {t("setup.first_plan.error")}
                </p>
              )}
            </>
          )}

          {step === "done" && (
            <>
              <h3 className={styles.stepTitle}>{t("setup.done.title")}</h3>
              <p className={styles.stepLead}>
                {createdPlanId
                  ? t("setup.done.lead_with_plan", { name: planName })
                  : t("setup.done.lead_no_plan")}
              </p>
              <ul className={styles.recap}>
                <li>
                  <strong>{t("setup.done.backend_label")}:</strong>{" "}
                  {health.isSuccess
                    ? t("setup.done.backend_ok")
                    : t("setup.done.backend_skipped")}
                </li>
                {createdPlanId && (
                  <li>
                    <strong>{t("setup.done.plan_label")}:</strong> {planName}
                  </li>
                )}
              </ul>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.btn}
            onClick={goBack}
            disabled={stepIndex === 0}
            data-testid="setup-back"
          >
            {t("setup.back")}
          </button>

          {step === "welcome" && (
            <button
              type="button"
              className={`${styles.btn} ${styles.primary}`}
              onClick={goNext}
              data-testid="setup-next"
            >
              {t("setup.start")}
            </button>
          )}

          {step === "backend" && (
            <button
              type="button"
              className={`${styles.btn} ${styles.primary}`}
              onClick={goNext}
              data-testid="setup-next"
              disabled={healthStatus === "pending"}
            >
              {t("setup.next")}
            </button>
          )}

          {step === "first-plan" && (
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button
                type="button"
                className={styles.btn}
                onClick={goNext}
                data-testid="setup-skip-plan"
              >
                {t("setup.first_plan.skip")}
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.primary}`}
                onClick={handleCreatePlan}
                disabled={!planName.trim() || createPlan.isPending}
                data-testid="setup-create-plan"
              >
                {createPlan.isPending
                  ? t("setup.first_plan.creating")
                  : t("setup.first_plan.create")}
              </button>
            </div>
          )}

          {step === "done" && (
            <button
              type="button"
              className={`${styles.btn} ${styles.primary}`}
              onClick={handleFinish}
              data-testid="setup-finish"
            >
              {t("setup.finish")}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
