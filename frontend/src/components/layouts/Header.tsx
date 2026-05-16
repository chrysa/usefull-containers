import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../languages/LanguageSwitcher";
import styles from "./Header.module.scss";

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>sfm-frontend</div>
      <div className={styles.actions}>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
