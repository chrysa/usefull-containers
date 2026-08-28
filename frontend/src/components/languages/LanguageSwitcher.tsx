import { useLanguage } from "@/hooks/useLanguage";

export default function LanguageSwitcher() {
  const { current, languages, change } = useLanguage();

  return (
    <div className="flex gap-1">
      {Object.entries(languages)
        .filter(([id]) => id !== current)
        .map(([id, lang]) => (
          <button
            key={id}
            onClick={() => change(id)}
            className="rounded-[var(--radius)] border border-border bg-transparent px-2 py-0.5 text-xs text-foreground transition-colors hover:bg-muted"
          >
            {lang.label}
          </button>
        ))}
    </div>
  );
}
