import { useTranslation } from "react-i18next";
import { useBackendStatus } from "../../hooks/useBackendStatus";
import styles from "./BackendConnectionBanner.module.scss";

export default function BackendConnectionBanner() {
  const { t } = useTranslation("common");
  const isDown = useBackendStatus();

  if (!isDown) return null;

  return (
    <div role="alert" aria-live="assertive" className={styles.banner}>
      <span aria-hidden="true">⚠️</span>
      <span>{t("errors.backendDisconnected")}</span>
    </div>
  );
}
