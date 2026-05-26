import { useCallback, useState } from "react";

const STORAGE_KEY = "sfm.setup.completed";

export interface SetupWizardState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  complete: () => void;
}

function readCompleted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeCompleted(value: boolean): void {
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable — silently no-op
  }
}

/**
 * Manages the first-run setup wizard visibility.
 * - Opens automatically on first visit (when localStorage flag is missing).
 * - Stays closed on subsequent visits once `complete()` is called.
 * - `open()` allows manual re-launch from settings or help menu.
 */
export function useSetupWizard(): SetupWizardState {
  // Lazy initializer so we read localStorage exactly once on mount,
  // avoiding the setState-in-effect anti-pattern.
  const [isOpen, setIsOpen] = useState<boolean>(() => !readCompleted());

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const complete = useCallback(() => {
    writeCompleted(true);
    setIsOpen(false);
  }, []);

  return { isOpen, open, close, complete };
}

export const SETUP_STORAGE_KEY = STORAGE_KEY;
