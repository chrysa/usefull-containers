import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DemoBanner from "./DemoBanner";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AssistantWidget from "../Assistant/AssistantWidget";
import ToastContainer from "../ui/Toast/Toast";
import SetupWizard from "../SetupWizard/SetupWizard";
import { useSetupWizard } from "../SetupWizard/useSetupWizard";
import { useProjects } from "../../hooks/useProjects";
import styles from "./Layout.module.scss";

export default function Layout() {
  const queryClient = useQueryClient();
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
    <div className={styles.layout}>
      <DemoBanner />
      <Header
        projects={projects}
        activeProject={activeProject}
        onSwitch={handleSwitch}
        onDelete={deleteProject}
        onNewProject={handleNewProject}
        onRestartSetup={wizard.open}
      />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <AssistantWidget />
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
