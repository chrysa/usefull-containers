import { useCallback, useState } from "react";
import {
  readProjects,
  getActiveProject,
  writeActiveProjectId,
  createProject as storeCreate,
  updateProject as storeUpdate,
  deleteProject as storeDelete,
} from "@/domain/projects/store";
import type { Project } from "@/domain/projects/types";

export interface ProjectsState {
  projects: Project[];
  activeProject: Project | null;
  createProject: (name: string, backendUrl: string) => Project;
  switchProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Pick<Project, "name" | "backendUrl">>) => void;
  deleteProject: (id: string) => void;
}

export function useProjects(): ProjectsState {
  const [projects, setProjects] = useState<Project[]>(() => readProjects());
  const [activeProject, setActiveProject] = useState<Project | null>(() => getActiveProject());

  const refresh = useCallback(() => {
    setProjects(readProjects());
    setActiveProject(getActiveProject());
  }, []);

  const createProject = useCallback(
    (name: string, backendUrl: string): Project => {
      const p = storeCreate(name, backendUrl);
      refresh();
      return p;
    },
    [refresh]
  );

  const switchProject = useCallback(
    (id: string) => {
      writeActiveProjectId(id);
      refresh();
    },
    [refresh]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Pick<Project, "name" | "backendUrl">>) => {
      storeUpdate(id, updates);
      refresh();
    },
    [refresh]
  );

  const deleteProject = useCallback(
    (id: string) => {
      storeDelete(id);
      refresh();
    },
    [refresh]
  );

  return { projects, activeProject, createProject, switchProject, updateProject, deleteProject };
}
