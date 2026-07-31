import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSetTagsMutation } from "@/domain/blueprints/queries";
import styles from "./TagEditor.module.scss";

interface Props {
  readonly blueprintName: string;
  readonly tags: string[];
}

export function TagEditor({ blueprintName, tags }: Props) {
  const { t } = useTranslation();
  const mutation = useSetTagsMutation(blueprintName);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commitTag() {
    const trimmed = input.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInput("");
      return;
    }
    mutation.mutate([...tags, trimmed]);
    setInput("");
  }

  function removeTag(tag: string) {
    mutation.mutate(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag();
    } else if (e.key === "Escape") {
      setInput("");
      setEditing(false);
    }
  }

  return (
    <div className={styles.root}>
      <ul className={styles.tagList} aria-label={t("blueprints.tags_label")}>
        {tags.map((tag) => (
          <li key={tag} className={styles.tag}>
            <span>{tag}</span>
            <button
              type="button"
              className={styles.removeBtn}
              aria-label={t("blueprints.tag_remove", { tag })}
              onClick={() => removeTag(tag)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {editing ? (
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          placeholder={t("blueprints.tag_placeholder")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            commitTag();
            setEditing(false);
          }}
          // autoFocus intentional: tag input gains focus when entering edit mode
          autoFocus
          aria-label={t("blueprints.tag_placeholder")}
        />
      ) : (
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setEditing(true)}
          aria-label={t("blueprints.tag_add")}
        >
          + {t("blueprints.tag_add")}
        </button>
      )}
    </div>
  );
}
