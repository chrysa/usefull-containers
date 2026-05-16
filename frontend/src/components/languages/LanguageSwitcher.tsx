import { useLanguage } from "../../hooks/useLanguage";
import styles from "./LanguageSwitcher.module.scss";

export default function LanguageSwitcher() {
  const { current, languages, change } = useLanguage();

  return (
    <div className={styles.switcher}>
      {Object.entries(languages)
        .filter(([id]) => id !== current)
        .map(([id, lang]) => (
          <button key={id} onClick={() => change(id)} className={styles.btn}>
            {lang.label}
          </button>
        ))}
    </div>
  );
}
