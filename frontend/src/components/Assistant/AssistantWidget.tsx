import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAssistantChat } from "../../api/assistant/queries";
import type { ChatMessage } from "../../api/assistant/types";
import styles from "./AssistantWidget.module.scss";

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

export default function AssistantWidget() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate, isPending } = useAssistantChat();

  const suggestions = i18n.language.startsWith("fr") ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    const userMsg: ChatMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    mutate(trimmed, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.reply, actions: data.actions },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: t("assistant.error") },
        ]);
      },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating action button */}
      <button
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("assistant.toggle_label")}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        🤖
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-modal="false"
          aria-label={t("assistant.title")}
        >
          {/* Header */}
          <div className={styles.header}>
            <span className={styles.headerTitle}>
              <span className={styles.headerIcon}>🤖</span>
              {t("assistant.title")}
            </span>
            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label={t("assistant.close")}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages} aria-live="polite">
            {messages.length === 0 && (
              <div className={styles.welcome}>
                <p>{t("assistant.welcome")}</p>
                <div className={styles.chips}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      className={styles.chip}
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "user" ? styles.userBubble : styles.assistantBubble
                }
              >
                <p className={styles.bubbleText}>{msg.text}</p>
                {msg.actions && msg.actions.length > 0 && (
                  <div className={styles.actions}>
                    {msg.actions.map((action) => (
                      <button
                        key={action.url}
                        className={styles.actionBtn}
                        onClick={() => {
                          navigate(action.url);
                          setOpen(false);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isPending && (
              <div className={styles.assistantBubble}>
                <span className={styles.typing}>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              value={input}
              placeholder={t("assistant.placeholder")}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label={t("assistant.placeholder")}
              disabled={isPending}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={isPending || !input.trim()}
              aria-label={t("assistant.send")}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
