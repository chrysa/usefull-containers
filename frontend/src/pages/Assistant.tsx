import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAssistantChat, useGeneratePlan } from "@/api/assistant/queries";
import type { ChatMessage } from "@/api/assistant/types";
import ChatMessageList from "@/features/assistant/ChatMessageList";
import ChatComposer from "@/features/assistant/ChatComposer";

const SUGGESTIONS_FR = [
  "Combien de blueprints ai-je ?",
  "Voir mes plans",
  "Comment utiliser le calculateur ?",
  "Quelles données de jeu sont importées ?",
];

const SUGGESTIONS_EN = [
  "How many blueprints do I have?",
  "Show my plans",
  "How do I use the calculator?",
  "What game data is imported?",
];

export default function Assistant() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending } = useAssistantChat();
  const generatePlan = useGeneratePlan();
  const busy = isPending || generatePlan.isPending;

  const suggestions = i18n.language.startsWith("fr") ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const userMsg: ChatMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (planMode) {
      generatePlan.mutate(trimmed, {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: data.reply,
              // exactOptionalPropertyTypes: omit `plan` rather than set it to undefined
              ...(data.plan ? { plan: data.plan } : {}),
            },
          ]);
        },
        onError: () => {
          setMessages((prev) => [...prev, { role: "assistant", text: t("assistant.error") }]);
        },
      });
      return;
    }

    mutate(trimmed, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.reply, actions: data.actions },
        ]);
      },
      onError: () => {
        setMessages((prev) => [...prev, { role: "assistant", text: t("assistant.error") }]);
      },
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-foreground">{t("assistant.title")}</h1>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        <ChatMessageList
          messages={messages}
          busy={busy}
          suggestions={suggestions}
          onSuggestionClick={sendMessage}
          bottomRef={bottomRef}
        />
        <ChatComposer
          input={input}
          onInputChange={setInput}
          planMode={planMode}
          onPlanModeToggle={() => setPlanMode((v) => !v)}
          busy={busy}
          onSend={() => sendMessage(input)}
        />
      </div>
    </div>
  );
}
