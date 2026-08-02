import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useHealthQuery } from "@/api/health/queries";
import { useCreatePlanMutation } from "@/domain/plans/queries";
import { useGameDataStatsQuery, useImportGameDataMutation } from "@/domain/gamedata/queries";
import { useAuth } from "@/context/useAuth";
import { ImportZipButton } from "@/features/gamedata";
import LanguageSwitcher from "@/components/languages/LanguageSwitcher";
import styles from "./SetupWizard.module.scss";

interface SetupWizardProps {
  /** null = first-run, no project created yet */
  readonly projectId: string | null;
  /** Called when the "project" step is completed — must create the project and return its id */
  readonly onProjectCreate: (name: string, backendUrl: string) => string;
  readonly onClose: (projectId: string) => void;
  readonly onComplete: (projectId: string) => void;
}

/** Steps for a first-time user (no project yet) */
const STEPS_NEW = ["project", "backend", "gamedata", "first-plan", "done"] as const;
/** Steps when a project already exists but setup was not completed */
const STEPS_EXISTING = ["backend", "gamedata", "first-plan", "done"] as const;

type Step = (typeof STEPS_NEW)[number];

// Default to the app's build-time API URL so the wizard pre-fills the backend
// the app is wired to (public API in prod, in-network backend in E2E).
const DEFAULT_BACKEND_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9009";

export default function SetupWizard({
  projectId,
  onProjectCreate,
  onClose,
  onComplete,
}: SetupWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const health = useHealthQuery();
  const createPlan = useCreatePlanMutation();
  const gameStats = useGameDataStatsQuery();
  const importGameData = useImportGameDataMutation();
  const { isAuthenticated } = useAuth();

  const itemCount = gameStats.data?.item_count ?? 0;
  const recipeCount = gameStats.data?.recipe_count ?? 0;

  const steps: readonly [Step, ...Step[]] = projectId ? STEPS_EXISTING : STEPS_NEW;
  const [step, setStep] = useState<Step>(steps[0]);

  // Tracks the project id once the "project" step is confirmed
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);

  const [projectName, setProjectName] = useState("");
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [planName, setPlanName] = useState<string>("");
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);

  const stepIndex = steps.indexOf(step);

  const goNext = () => {
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const resolvedProjectId = (): string => {
    // Guaranteed to exist after "project" step (or from props for existing projects)
    return activeProjectId!;
  };

  const handleProjectStep = () => {
    const id = onProjectCreate(projectName, backendUrl);
    setActiveProjectId(id);
    goNext();
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
    onComplete(resolvedProjectId());
    if (createdPlanId) {
      navigate(`/plans/${createdPlanId}`);
    } else {
      // No plan created (e.g. skipped or signed-out): land on the public
      // dashboard rather than the now auth-guarded /plans.
      navigate("/");
    }
  };

  const handleSkip = () => {
    // For new-project flow: create a project with current inputs (even if blank → defaults apply)
    const id = activeProjectId ?? onProjectCreate(projectName, backendUrl);
    onClose(id);
  };

  let healthStatus: "pending" | "online" | "offline";
  if (health.isLoading) {
    healthStatus = "pending";
  } else if (health.isSuccess) {
    healthStatus = "online";
  } else {
    healthStatus = "offline";
  }

  return (
    <dialog
      open
      className={styles.backdrop}
      aria-labelledby="setup-wizard-title"
      data-testid="setup-wizard"
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 id="setup-wizard-title" className={styles.title}>
            {t("setup.title")}
          </h2>
          <div className={styles.headerActions} data-testid="setup-language">
            <LanguageSwitcher />
            <button
              type="button"
              className={styles.skip}
              onClick={handleSkip}
              aria-label={t("setup.skip_aria")}
            >
              {t("setup.skip")}
            </button>
          </div>
        </header>

        <div className={styles.steps} aria-hidden="true">
          {steps.map((s, i) => (
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
          {step === "project" && (
            <>
              <h3 className={styles.stepTitle}>{t("setup.project.title")}</h3>
              <p className={styles.stepLead}>{t("setup.project.lead")}</p>
              <div className={styles.field}>
                <label htmlFor="setup-project-name">
                  {t("setup.project.name_label")}
                </label>
                <input
                  id="setup-project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t("setup.project.name_placeholder")}
                  data-testid="setup-project-name-input"
                  autoFocus
                />
              </div>
              <details className={styles.advanced}>
                <summary>{t("setup.project.advanced")}</summary>
                <div className={styles.field}>
                  <label htmlFor="setup-backend-url">
                    {t("setup.project.url_label")}
                  </label>
                  <input
                    id="setup-backend-url"
                    type="url"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder={DEFAULT_BACKEND_URL}
                    data-testid="setup-backend-url-input"
                  />
                  <p className={styles.hint}>{t("setup.project.url_hint")}</p>
                </div>
              </details>
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

          {step === "gamedata" && (
            <>
              <h3 className={styles.stepTitle}>{t("setup.gamedata.title")}</h3>
              <p className={styles.stepLead}>{t("setup.gamedata.lead")}</p>
              <div className={styles.statusRow} data-testid="setup-gamedata-status">
                <span className={styles.statusText}>
                  {itemCount > 0
                    ? t("setup.gamedata.loaded", {
                        items: itemCount,
                        recipes: recipeCount,
                      })
                    : t("setup.gamedata.empty")}
                </span>
                <ImportZipButton
                  onImport={(file) =>
                    importGameData.mutate(file, {
                      onSuccess: () => void gameStats.refetch(),
                    })
                  }
                  isImporting={importGameData.isPending}
                />
              </div>
              {importGameData.isError && (
                <p className={styles.stepLead} role="alert">
                  {importGameData.error.message}
                </p>
              )}
            </>
          )}

          {step === "first-plan" && (
            <>
              <h3 className={styles.stepTitle}>
                {t("setup.first_plan.title")}
              </h3>
              <p className={styles.stepLead}>{t("setup.first_plan.lead")}</p>
              {isAuthenticated ? (
                <>
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
              ) : (
                <p
                  className={styles.stepLead}
                  data-testid="setup-plan-auth-required"
                >
                  {t("setup.first_plan.auth_required")}{" "}
                  <Link to="/login">{t("setup.first_plan.sign_in")}</Link>
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

          {step === "project" && (
            <button
              type="button"
              className={`${styles.btn} ${styles.primary}`}
              onClick={handleProjectStep}
              data-testid="setup-next"
            >
              {t("setup.next")}
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

          {step === "gamedata" && (
            <button
              type="button"
              className={`${styles.btn} ${styles.primary}`}
              onClick={goNext}
              data-testid="setup-next"
            >
              {t("setup.next")}
            </button>
          )}

          {step === "first-plan" && (
            <div className={styles.btnGroup}>
              <button
                type="button"
                className={styles.btn}
                onClick={goNext}
                data-testid="setup-skip-plan"
              >
                {t("setup.first_plan.skip")}
              </button>
              {isAuthenticated && (
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
              )}
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
    </dialog>
  );
}
