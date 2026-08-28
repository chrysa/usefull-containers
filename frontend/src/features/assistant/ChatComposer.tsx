import { useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface ChatComposerProps {
  input: string;
  onInputChange: (value: string) => void;
  planMode: boolean;
  onPlanModeToggle: () => void;
  busy: boolean;
  onSend: () => void;
}

export default function ChatComposer({
  input,
  onInputChange,
  planMode,
  onPlanModeToggle,
  busy,
  onSend,
}: ChatComposerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  }

  const placeholder = planMode ? t("assistant.plan_mode_hint") : t("assistant.placeholder");

  return (
    <div className="flex items-center gap-2 border-t border-border p-3">
      <Button
        type="button"
        variant={planMode ? "default" : "outline"}
        size="icon"
        data-testid="assistant-plan-mode"
        aria-pressed={planMode}
        title={t("assistant.plan_mode")}
        aria-label={t("assistant.plan_mode")}
        onClick={onPlanModeToggle}
      >
        🏭
      </Button>
      <input
        ref={inputRef}
        className="h-9 flex-1 rounded-[var(--radius)] border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="text"
        value={input}
        placeholder={placeholder}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={placeholder}
        disabled={busy}
      />
      <Button
        type="button"
        onClick={onSend}
        disabled={busy || !input.trim()}
        aria-label={t("assistant.send")}
      >
        {t("assistant.send")}
      </Button>
    </div>
  );
}
