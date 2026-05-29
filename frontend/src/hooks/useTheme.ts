import { useState, useEffect } from "react";

const STORAGE_KEY = "sfm:theme:override";

function getSystemTheme(): "light" | "dark" {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Theme hook with OS-adaptive behaviour.
 *
 * - Default: follows the OS color-scheme preference in real time.
 * - When the user explicitly toggles via `setTheme`, the choice is persisted
 *   in localStorage under `sfm:theme:override` and takes precedence.
 * - `resetToSystem()` clears the override and resumes OS tracking.
 */
export function useTheme() {
  // null = follow OS, "light"/"dark" = explicit user override
  const [override, setOverride] = useState<"light" | "dark" | null>(
    () => localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null,
  );

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme,
  );

  const theme = override ?? systemTheme;

  // Sync override to localStorage (or clear it).
  useEffect(() => {
    if (override !== null) {
      localStorage.setItem(STORAGE_KEY, override);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [override]);

  // Apply theme class to <html>.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Follow OS color-scheme changes when no explicit override is set.
  useEffect(() => {
    const mq = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function setTheme(next: "light" | "dark") {
    setOverride(next);
  }

  function resetToSystem() {
    setOverride(null);
  }

  return { theme, setTheme, resetToSystem, isOverridden: override !== null };
}
