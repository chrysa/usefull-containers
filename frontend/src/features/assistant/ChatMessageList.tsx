import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/api/assistant/types";
import GeneratedPlanPreview from "@/components/Assistant/GeneratedPlanPreview";

interface ChatMessageListProps {
  messages: ChatMessage[];
  busy: boolean;
  suggestions: string[];
  onSuggestionClick: (text: string) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
}

export default function ChatMessageList({
  messages,
  busy,
  suggestions,
  onSuggestionClick,
  bottomRef,
}: ChatMessageListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-4" aria-live="polite">
      {messages.length === 0 && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>{t("assistant.welcome")}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground hover:bg-muted/80"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "max-w-[80%] rounded-[var(--radius)] px-4 py-2 text-sm",
              message.role === "user"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-muted text-foreground",
            )}
          >
            <p>{message.text}</p>
            {message.actions && message.actions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.actions.map((action) => (
                  <button
                    key={action.url}
                    type="button"
                    className="rounded-[var(--radius)] border border-border bg-card px-2 py-1 text-xs text-foreground hover:bg-muted"
                    onClick={() => navigate(action.url)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            {message.plan && <GeneratedPlanPreview plan={message.plan} />}
          </div>
        ))}

        {busy && (
          <div
            className="self-start rounded-[var(--radius)] bg-muted px-4 py-3 text-sm text-muted-foreground"
            data-testid="assistant-busy"
          >
            <span className="inline-flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            </span>
          </div>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
