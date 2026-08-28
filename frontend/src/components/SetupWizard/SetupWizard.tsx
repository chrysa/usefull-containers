import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHealthQuery } from "@/api/health/queries";
import { useCreatePlanMutation } from "@/domain/plans/queries";
import { useGameDataStatsQuery, useImportGameDataMutation } from "@/domain/gamedata/queries";
import { useAuth } from "@/context/useAuth";
import BackendStep from "./BackendStep";
import DoneStep from "./DoneStep";
import FirstPlanStep from "./FirstPlanStep";
import GameDataStep from "./GameDataStep";
import ProjectStep from "./ProjectStep";
import SetupWizardFooter from "./SetupWizardFooter";
import SetupWizardHeader from "./SetupWizardHeader";
import { STEPS_EXISTING, STEPS_NEW } from "./types";
import type { HealthStatus, Step } from "./types";

interface SetupWizardProps {
  /** null = first-run, no project created yet */
  readonly projectId: string | null;
  /** Called when the "project" step is completed — must create the project and return its id */
  readonly onProjectCreate: (name: string, backendUrl: string) => string;
  readonly onClose: (projectId: string) => void;
  readonly onComplete: (projectId: string) => void;
}

// Default to the app's build-time API URL so the wizard pre-fills the backend
// the app is wired to (public API in prod, in-network backend in E2E).
const DEFAULT_BACKEND_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9009";

function resolveHealthStatus(isLoading: boolean, isSuccess: boolean): HealthStatus {
  if (isLoading) return "pending";
  if (isSuccess) return "online";
  return "offline";
}

export default function SetupWizard({
  projectId,
  onProjectCreate,
  onClose,
  onComplete,
}: SetupWizardProps) {
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

  const healthStatus = resolveHealthStatus(health.isLoading, health.isSuccess);

  return (
    <dialog
      open
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55 p-0"
      aria-labelledby="setup-wizard-title"
      data-testid="setup-wizard"
    >
      <div className="flex w-full max-w-[560px] flex-col rounded-[var(--radius)] bg-card text-foreground shadow-lg">
        <SetupWizardHeader steps={steps} stepIndex={stepIndex} onSkip={handleSkip} />

        <div className="flex flex-col gap-3 px-6 py-4">
          {step === "project" && (
            <ProjectStep
              projectName={projectName}
              onProjectNameChange={setProjectName}
              backendUrl={backendUrl}
              onBackendUrlChange={setBackendUrl}
              defaultBackendUrl={DEFAULT_BACKEND_URL}
            />
          )}

          {step === "backend" && (
            <BackendStep healthStatus={healthStatus} version={health.data?.version} />
          )}

          {step === "gamedata" && (
            <GameDataStep
              itemCount={itemCount}
              recipeCount={recipeCount}
              isImporting={importGameData.isPending}
              importError={importGameData.error?.message}
              onImport={(file) =>
                importGameData.mutate(file, { onSuccess: () => void gameStats.refetch() })
              }
            />
          )}

          {step === "first-plan" && (
            <FirstPlanStep
              isAuthenticated={isAuthenticated}
              planName={planName}
              onPlanNameChange={setPlanName}
              hasCreatePlanError={createPlan.isError}
            />
          )}

          {step === "done" && (
            <DoneStep
              createdPlanId={createdPlanId}
              planName={planName}
              backendOnline={health.isSuccess}
            />
          )}
        </div>

        <SetupWizardFooter
          step={step}
          stepIndex={stepIndex}
          healthStatus={healthStatus}
          isAuthenticated={isAuthenticated}
          planName={planName}
          isCreatingPlan={createPlan.isPending}
          onBack={goBack}
          onNext={goNext}
          onProjectStep={handleProjectStep}
          onSkipPlan={goNext}
          onCreatePlan={() => void handleCreatePlan()}
          onFinish={handleFinish}
        />
      </div>
    </dialog>
  );
}
