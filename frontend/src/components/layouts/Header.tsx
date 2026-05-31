import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../languages/LanguageSwitcher";
import ProjectSwitcher from "./ProjectSwitcher";
import type { Project } from "../../domain/projects/types";
import styles from "./Header.module.scss";

interface HeaderProps {
  readonly projects: Project[];
  readonly activeProject: Project | null;
  readonly onSwitch: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onNewProject: () => void;
}

export default function Header({
  projects,
  activeProject,
  onSwitch,
  onDelete,
  onNewProject,
}: HeaderProps) {
  const { theme, setTheme, resetToSystem, isOverridden } = useTheme();
  const { user, isAuthenticated, isHydrating, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo}>Satisfactory Factory Manager</div>
      <div className={styles.actions}>
        <ProjectSwitcher
          projects={projects}
          activeProject={activeProject}
          onSwitch={onSwitch}
          onDelete={onDelete}
          onNewProject={onNewProject}
        />
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={
            isOverridden
              ? "Toggle theme (click to switch, long-press to reset)"
              : "Follows OS theme"
          }
        >
          {theme === "dark" ? "☀️" : "🌙"}
          {isOverridden && <span className={styles.overrideDot} />}
        </button>
        {isOverridden && (
          <button onClick={resetToSystem} title="Reset to OS theme">
            🖥️
          </button>
        )}
        <LanguageSwitcher />
        {isHydrating ? (
          // Keep the auth slot reserved (no flash of "Sign in" while /auth/me
          // is in flight on first load). aria-busy lets AT users know.
          <span className={styles.userMenu} aria-busy="true" aria-live="polite" />
        ) : isAuthenticated && user ? (
          <span className={styles.userMenu}>
            <span className={styles.username}>{user.steam_username ?? user.username}</span>
            <button onClick={handleLogout} title="Sign out">
              Sign out
            </button>
          </span>
        ) : (
          <Link to="/login" className={styles.loginLink}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
