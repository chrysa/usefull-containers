import type { Toast } from "@/context/ToastContext";
import { useToast } from "@/context/useToast";
import styles from "./Toast.module.scss";

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="alert">
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.close}
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
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
