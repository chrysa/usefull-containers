import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    <fieldset
      className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-card p-3"
      aria-label={t("blueprints.filter_by_tag")}
    >
      <legend className="px-1 text-xs font-medium text-muted-foreground">
        {t("blueprints.filter_by_tag")}
      </legend>
      <ul className="flex flex-wrap items-center gap-2">
        {allTags.map((tag) => {
          const isActive = activeTags.has(tag);
          return (
            <li key={tag}>
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",
                )}
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={onClear}
          aria-label={t("blueprints.clear_filters")}
        >
          {t("blueprints.clear_filters")}
        </Button>
      )}
    </fieldset>
  );
}
