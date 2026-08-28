import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProject,
  deleteProject,
  getActiveProject,
  isSetupCompleted,
  markSetupCompleted,
  readActiveProjectId,
  readProjects,
  updateProject,
  writeActiveProjectId,
  writeProjects,
} from "./store";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
});

describe("readProjects / writeProjects", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(readProjects()).toEqual([]);
  });

  it("round-trips a list of projects through JSON storage", () => {
    const projects = [
      { id: "a", name: "Alpha", backendUrl: "http://a", createdAt: "t" },
    ];
    writeProjects(projects);
    expect(readProjects()).toEqual(projects);
  });

  it("returns an empty array when stored JSON is corrupted", () => {
    localStorage.setItem("sfm.projects", "not-json{");
    expect(readProjects()).toEqual([]);
  });

  it("no-ops writeProjects when localStorage.setItem throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {},
    });
    expect(() => writeProjects([])).not.toThrow();
  });
});

describe("readActiveProjectId / writeActiveProjectId", () => {
  it("returns null when nothing is stored", () => {
    expect(readActiveProjectId()).toBeNull();
  });

  it("stores and reads back an active project id", () => {
    writeActiveProjectId("proj-1");
    expect(readActiveProjectId()).toBe("proj-1");
  });

  it("removes the stored id when given null", () => {
    writeActiveProjectId("proj-1");
    writeActiveProjectId(null);
    expect(readActiveProjectId()).toBeNull();
  });

  it("no-ops when localStorage access throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {
        throw new Error("unavailable");
      },
      removeItem: () => {
        throw new Error("unavailable");
      },
    });
    expect(readActiveProjectId()).toBeNull();
    expect(() => writeActiveProjectId("x")).not.toThrow();
  });
});

describe("createProject", () => {
  it("creates a project with trimmed name and normalized backend URL", () => {
    const project = createProject("  My Factory  ", "http://localhost:9009/");

    expect(project.name).toBe("My Factory");
    expect(project.backendUrl).toBe("http://localhost:9009");
    expect(project.id).toBeTruthy();
    expect(project.createdAt).toBeTruthy();
  });

  it("applies default name and backend URL when blank", () => {
    const project = createProject("   ", "   ");

    expect(project.name).toBe("My Factory");
    expect(project.backendUrl).toBe("http://localhost:9009");
  });

  it("appends the new project to existing storage and activates it", () => {
    const first = createProject("First", "http://a");
    const second = createProject("Second", "http://b");

    expect(readProjects().map((p) => p.id)).toEqual([first.id, second.id]);
    expect(readActiveProjectId()).toBe(second.id);
  });
});

describe("updateProject", () => {
  it("merges updates into the matching project only", () => {
    const first = createProject("First", "http://a");
    const second = createProject("Second", "http://b");

    updateProject(first.id, { name: "Renamed" });

    const projects = readProjects();
    expect(projects.find((p) => p.id === first.id)?.name).toBe("Renamed");
    expect(projects.find((p) => p.id === second.id)?.name).toBe("Second");
  });

  it("is a no-op when the id does not match any project", () => {
    const first = createProject("First", "http://a");
    updateProject("missing-id", { name: "Ghost" });

    expect(readProjects()).toEqual([first]);
  });
});

describe("deleteProject", () => {
  it("removes the project from storage", () => {
    const first = createProject("First", "http://a");
    deleteProject(first.id);

    expect(readProjects()).toEqual([]);
  });

  it("re-activates the first remaining project when the active one is deleted", () => {
    const first = createProject("First", "http://a");
    const second = createProject("Second", "http://b");
    writeActiveProjectId(second.id);

    deleteProject(second.id);

    expect(readActiveProjectId()).toBe(first.id);
  });

  it("clears the active id when the last project is deleted", () => {
    const first = createProject("First", "http://a");
    deleteProject(first.id);

    expect(readActiveProjectId()).toBeNull();
  });

  it("leaves the active id untouched when deleting a non-active project", () => {
    const first = createProject("First", "http://a");
    const second = createProject("Second", "http://b");
    writeActiveProjectId(first.id);

    deleteProject(second.id);

    expect(readActiveProjectId()).toBe(first.id);
  });
});

describe("getActiveProject", () => {
  it("returns null when there are no projects", () => {
    expect(getActiveProject()).toBeNull();
  });

  it("returns the project matching the stored active id", () => {
    const first = createProject("First", "http://a");
    createProject("Second", "http://b");
    writeActiveProjectId(first.id);

    expect(getActiveProject()).toEqual(first);
  });

  it("auto-activates the first project when the active id is stale", () => {
    const first = createProject("First", "http://a");
    writeActiveProjectId("stale-id");

    expect(getActiveProject()).toEqual(first);
    expect(readActiveProjectId()).toBe(first.id);
  });

  it("auto-activates the first project when no active id is stored", () => {
    const first = createProject("First", "http://a");
    writeActiveProjectId(null);

    expect(getActiveProject()).toEqual(first);
    expect(readActiveProjectId()).toBe(first.id);
  });
});

describe("isSetupCompleted / markSetupCompleted", () => {
  it("returns false when setup has not been marked complete", () => {
    expect(isSetupCompleted("proj-1")).toBe(false);
  });

  it("returns true after marking setup complete for that project id", () => {
    markSetupCompleted("proj-1");
    expect(isSetupCompleted("proj-1")).toBe(true);
  });

  it("scopes completion per project id", () => {
    markSetupCompleted("proj-1");
    expect(isSetupCompleted("proj-2")).toBe(false);
  });

  it("returns false when localStorage.getItem throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {},
      removeItem: () => {},
    });
    expect(isSetupCompleted("proj-1")).toBe(false);
  });

  it("no-ops markSetupCompleted when localStorage.setItem throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("unavailable");
      },
      removeItem: () => {},
    });
    expect(() => markSetupCompleted("proj-1")).not.toThrow();
  });
});
