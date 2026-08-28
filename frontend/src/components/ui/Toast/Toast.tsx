import type { Toast, ToastType } from "@/context/ToastContext";
import { useToast } from "@/context/useToast";
import { cn } from "@/lib/utils";

const BORDER_COLOR_BY_TYPE: Record<ToastType, string> = {
  success: "border-l-success",
  error: "border-l-destructive",
  info: "border-l-primary",
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-2 rounded-[var(--radius)] border-l-4 bg-card px-4 py-2 shadow-md animate-[toast-slide-in_200ms_ease]",
        BORDER_COLOR_BY_TYPE[toast.type],
      )}
    >
      <span className="flex-1 text-sm text-foreground">{toast.message}</span>
      <button
        type="button"
        className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-lg leading-none text-muted-foreground hover:text-foreground"
        onClick={() => removeToast(toast.id)}
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex max-w-[360px] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
