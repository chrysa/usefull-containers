import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSetTagsMutation } from "@/domain/blueprints/queries";

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
    mutation.mutate(tags.filter((existingTag) => existingTag !== tag));
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
    <div className="flex min-h-7 flex-wrap items-center gap-1.5">
      <ul className="contents" aria-label={t("blueprints.tags_label")}>
        {tags.map((tag) => (
          <li
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-primary"
          >
            <span>{tag}</span>
            <button
              type="button"
              className="flex items-center p-0 leading-none text-primary opacity-60 hover:opacity-100"
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
          className="w-32 min-w-0 rounded-full border border-primary bg-background px-2.5 py-0.5 text-xs text-foreground outline-none"
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
          className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          onClick={() => setEditing(true)}
          aria-label={t("blueprints.tag_add")}
        >
          + {t("blueprints.tag_add")}
        </button>
      )}
    </div>
  );
}
