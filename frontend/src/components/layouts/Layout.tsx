import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DemoBanner from "./DemoBanner";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ToastContainer from "@/components/ui/Toast/Toast";
import SetupWizard from "@/components/SetupWizard/SetupWizard";
import { useSetupWizard } from "@/components/SetupWizard/useSetupWizard";
import { useProjects } from "@/hooks/useProjects";

type Section = "overview" | "plan" | "track" | "reference";

const PLAN_PREFIXES = ["/calculator", "/plans", "/blueprints"];
const TRACK_PREFIXES = ["/snapshots", "/diff", "/assistant"];
const REFERENCE_PREFIXES = ["/gamedata"];

function sectionForPath(pathname: string): Section {
  if (PLAN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return "plan";
  if (TRACK_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return "track";
  if (REFERENCE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return "reference";
  return "overview";
}

export default function Layout() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const {
    projects,
    activeProject,
    createProject,
    switchProject,
    deleteProject,
  } = useProjects();
  const wizard = useSetupWizard(activeProject?.id ?? null);

  // Tracks whether the wizard is opened explicitly to create a NEW project
  const [creatingNewProject, setCreatingNewProject] = useState(false);

  const showWizard = creatingNewProject || wizard.isOpen;
  const wizardProjectId = creatingNewProject
    ? null
    : (activeProject?.id ?? null);

  const handleNewProject = () => {
    setCreatingNewProject(true);
  };

  const handleProjectCreate = (name: string, backendUrl: string): string => {
    const p = createProject(name, backendUrl);
    return p.id;
  };

  const handleWizardDone = (projectId: string) => {
    wizard.complete(projectId);
    setCreatingNewProject(false);
  };

  const handleSwitch = (id: string) => {
    switchProject(id);
    // Invalidate all cached queries so data is fresh for the new project's backend
    void queryClient.invalidateQueries();
  };

  return (
    <div
      className="flex h-screen flex-col bg-background text-foreground"
      data-section={sectionForPath(location.pathname)}
    >
      <DemoBanner />
      <Header
        projects={projects}
        activeProject={activeProject}
        onSwitch={handleSwitch}
        onDelete={deleteProject}
        onNewProject={handleNewProject}
        onRestartSetup={wizard.open}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      {showWizard && (
        <SetupWizard
          projectId={wizardProjectId}
          onProjectCreate={handleProjectCreate}
          onClose={handleWizardDone}
          onComplete={handleWizardDone}
        />
      )}
    </div>
  );
}
