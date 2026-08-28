import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "@/domain/projects/types";
import { cn } from "@/lib/utils";

interface ProjectSwitcherProps {
  readonly projects: Project[];
  readonly activeProject: Project | null;
  readonly onSwitch: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onNewProject: () => void;
}

export default function ProjectSwitcher({
  projects,
  activeProject,
  onSwitch,
  onDelete,
  onNewProject,
}: ProjectSwitcherProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (globalThis.confirm(t("project.confirm_delete", { name }))) {
      onDelete(id);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex max-w-[180px] cursor-pointer items-center gap-1 rounded-[var(--radius)] border border-border bg-card px-2 py-1 text-sm text-foreground transition-colors hover:bg-muted"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="project-switcher-trigger"
      >
        <span className="shrink-0 text-[0.85em] opacity-70">⚙</span>
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
          {activeProject?.name ?? t("project.unnamed")}
        </span>
        <span className="shrink-0 text-[0.6em] opacity-60">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-[500] min-w-[240px] overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-md animate-[pop-in_120ms_ease]"
          data-testid="project-switcher-dropdown"
        >
          {projects.length === 0 && (
            <span className="block px-3 py-2 text-sm text-muted-foreground">
              {t("project.no_projects")}
            </span>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-stretch border-b border-border",
                p.id === activeProject?.id && "bg-primary/10",
              )}
            >
              <button
                type="button"
                className="relative flex flex-1 cursor-pointer flex-col items-start gap-0.5 border-none bg-transparent px-3 py-2 text-left text-sm leading-tight text-foreground hover:bg-muted"
                onClick={() => {
                  onSwitch(p.id);
                  setOpen(false);
                }}
                aria-current={p.id === activeProject?.id ? "true" : undefined}
              >
                {p.id === activeProject?.id && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary">
                    ✓
                  </span>
                )}
                <span>{p.name}</span>
                <span className="text-[0.75em] text-muted-foreground">
                  {p.backendUrl}
                </span>
              </button>
              {projects.length > 1 && (
                <button
                  type="button"
                  className="shrink-0 cursor-pointer border-none bg-transparent px-2 text-sm text-muted-foreground hover:text-destructive"
                  title={t("project.delete")}
                  onClick={(e) => handleDelete(e, p.id, p.name)}
                  aria-label={t("project.delete_aria", { name: p.name })}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="block w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-sm text-primary hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onNewProject();
            }}
            data-testid="project-new-button"
          >
            + {t("project.create")}
          </button>
        </div>
      )}
    </div>
  );
}
