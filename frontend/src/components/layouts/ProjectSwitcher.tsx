import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "@/domain/projects/types";
import styles from "./ProjectSwitcher.module.scss";

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
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="project-switcher-trigger"
      >
        <span className={styles.icon}>⚙</span>
        <span className={styles.name}>
          {activeProject?.name ?? t("project.unnamed")}
        </span>
        <span className={styles.chevron}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className={styles.dropdown}
          data-testid="project-switcher-dropdown"
        >
          {projects.length === 0 && (
            <span className={styles.empty}>{t("project.no_projects")}</span>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className={[
                styles.item,
                p.id === activeProject?.id ? styles.active : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className={styles.itemLabel}
                onClick={() => {
                  onSwitch(p.id);
                  setOpen(false);
                }}
                aria-current={p.id === activeProject?.id ? "true" : undefined}
              >
                {p.id === activeProject?.id && (
                  <span className={styles.checkmark}>✓</span>
                )}
                <span>{p.name}</span>
                <span className={styles.url}>{p.backendUrl}</span>
              </button>
              {projects.length > 1 && (
                <button
                  type="button"
                  className={styles.deleteBtn}
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
            className={styles.newBtn}
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
