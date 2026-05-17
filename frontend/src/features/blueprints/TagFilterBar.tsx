import { useTranslation } from "react-i18next";
import styles from "./TagFilterBar.module.scss";

interface Props {
  readonly allTags: string[];
  readonly activeTags: ReadonlySet<string>;
  readonly onToggle: (tag: string) => void;
  readonly onClear: () => void;
}

export function TagFilterBar({ allTags, activeTags, onToggle, onClear }: Props) {
  const { t } = useTranslation();

  if (allTags.length === 0) return null;

  return (
    <fieldset className={styles.bar} aria-label={t("blueprints.filter_by_tag")}>
      <legend className={styles.label}>{t("blueprints.filter_by_tag")}</legend>
      <ul className={styles.tagList}>
        {allTags.map((tag) => {
          const isActive = activeTags.has(tag);
          return (
            <li key={tag}>
              <button
                type="button"
                className={isActive ? styles.tagActive : styles.tag}
                aria-pressed={isActive}
                onClick={() => onToggle(tag)}
              >
                {tag}
              </button>
            </li>
          );
        })}
      </ul>
      {activeTags.size > 0 && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={onClear}
          aria-label={t("blueprints.clear_filters")}
        >
          {t("blueprints.clear_filters")}
        </button>
      )}
    </fieldset>
  );
}
