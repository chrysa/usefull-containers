import type { Project } from "./types";

const PROJECTS_KEY = "sfm.projects";
const ACTIVE_ID_KEY = "sfm.activeProjectId";

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Raw read/write ───────────────────────────────────────────────────────────

export function readProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

export function writeProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // localStorage unavailable — silently no-op
  }
}

export function readActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function writeActiveProjectId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  } catch {
    // localStorage unavailable — silently no-op
  }
}

// ─── Project CRUD ─────────────────────────────────────────────────────────────

export function getActiveProject(): Project | null {
  const id = readActiveProjectId();
  const projects = readProjects();
  if (id) {
    const found = projects.find((p) => p.id === id);
    if (found) return found;
  }
  // Auto-activate the first available project if active ID is stale/missing
  const first = projects[0];
  if (first) {
    writeActiveProjectId(first.id);
    return first;
  }
  return null;
}

export function createProject(name: string, backendUrl: string): Project {
  const project: Project = {
    id: nanoid(),
    name: name.trim() || "My Factory",
    backendUrl: (backendUrl.trim() || "http://localhost:9009").replace(
      /\/$/,
      "",
    ),
    createdAt: new Date().toISOString(),
  };
  const existing = readProjects();
  writeProjects([...existing, project]);
  writeActiveProjectId(project.id);
  return project;
}

export function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "backendUrl">>,
): void {
  const projects = readProjects().map((p) =>
    p.id === id ? { ...p, ...updates } : p,
  );
  writeProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = readProjects().filter((p) => p.id !== id);
  writeProjects(projects);
  if (readActiveProjectId() === id) {
    writeActiveProjectId(projects[0]?.id ?? null);
  }
}

// ─── Per-project setup completion ────────────────────────────────────────────

export function isSetupCompleted(projectId: string): boolean {
  try {
    return (
      localStorage.getItem(`sfm.project.${projectId}.setup.completed`) ===
      "true"
    );
  } catch {
    return false;
  }
}

export function markSetupCompleted(projectId: string): void {
  try {
    localStorage.setItem(`sfm.project.${projectId}.setup.completed`, "true");
  } catch {
    // localStorage unavailable — silently no-op
  }
}
