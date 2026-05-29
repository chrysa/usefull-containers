import { useCallback, useState } from "react";
import { isSetupCompleted, markSetupCompleted } from "../../domain/projects/store";

export interface SetupWizardState {
  isOpen: boolean;
  open: () => void;
  complete: (projectId: string) => void;
}

/**
 * Manages the setup wizard visibility per project.
 * - Opens automatically when there is no active project (first run).
 * - Opens automatically when a project's setup has not been completed yet.
 * - `complete(id)` persists the completed flag for that project and closes the wizard.
 * - `open()` allows manual re-launch from the header or help menu.
 */
export function useSetupWizard(projectId: string | null): SetupWizardState {
  // No project at all → must run wizard. Project exists but not completed → wizard opens.
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (!projectId) return true;
    return !isSetupCompleted(projectId);
  });

  const open = useCallback(() => setIsOpen(true), []);

  const complete = useCallback((id: string) => {
    markSetupCompleted(id);
    setIsOpen(false);
  }, []);

  return { isOpen, open, complete };
}

/** @deprecated use domain/projects/store directly */
export const SETUP_STORAGE_KEY = "sfm.setup.completed";
