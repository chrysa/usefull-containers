import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../languages/LanguageSwitcher";
import styles from "./Header.module.scss";

export default function Header() {
  const { theme, setTheme, resetToSystem, isOverridden } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>sfm-frontend</div>
      <div className={styles.actions}>
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
      </div>
    </header>
  );
}
