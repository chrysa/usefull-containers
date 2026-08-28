import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, Monitor, WifiOff } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/languages/LanguageSwitcher";
import ProjectSwitcher from "./ProjectSwitcher";
import FactorySelector from "./FactorySelector";
import type { Project } from "@/domain/projects/types";

interface HeaderProps {
  readonly projects: Project[];
  readonly activeProject: Project | null;
  readonly onSwitch: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onNewProject: () => void;
  readonly onRestartSetup: () => void;
}

export default function Header({
  projects,
  activeProject,
  onSwitch,
  onDelete,
  onNewProject,
  onRestartSetup,
}: HeaderProps) {
  const { theme, setTheme, resetToSystem, isOverridden } = useTheme();
  const { user, isAuthenticated, isHydrating, logout } = useAuth();
  const isBackendDown = useBackendStatus();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="flex h-14 flex-none items-center justify-between gap-4 border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <span className="font-display text-sm font-semibold text-foreground">
          Satisfactory Factory Manager
        </span>
        <FactorySelector />
      </div>
      <div className="flex items-center gap-2">
        {isBackendDown && (
          <span
            className="flex items-center gap-1 text-xs text-warning"
            role="status"
            data-testid="backend-status-down"
            title="Backend unreachable"
          >
            <WifiOff className="size-4" aria-hidden="true" />
          </span>
        )}
        <ProjectSwitcher
          projects={projects}
          activeProject={activeProject}
          onSwitch={onSwitch}
          onDelete={onDelete}
          onNewProject={onNewProject}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={
            isOverridden
              ? "Toggle theme (click to switch, long-press to reset)"
              : "Follows OS theme"
          }
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        {isOverridden && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetToSystem}
            title="Reset to OS theme"
            aria-label="Reset to OS theme"
          >
            <Monitor className="size-4" />
          </Button>
        )}
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRestartSetup}
          title="Restart setup wizard"
          aria-label="Restart setup wizard"
          data-testid="restart-setup"
        >
          🧭
        </Button>
        {isHydrating ? (
          <span
            className="h-8 w-20 animate-pulse rounded-[var(--radius)] bg-muted"
            aria-busy="true"
            aria-live="polite"
          />
        ) : isAuthenticated && user ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-foreground">{user.steam_username ?? user.username}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} title="Sign out">
              Sign out
            </Button>
          </span>
        ) : (
          <Link
            to="/login"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
