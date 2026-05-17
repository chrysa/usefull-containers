import { useRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ImportZipButton.module.scss";

interface Props {
  readonly onImport: (file: File) => void;
  readonly isImporting: boolean;
}

export default function ImportZipButton({ onImport, isImporting }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onImport(file);
    e.target.value = "";
  }

  return (
    <label>
      <button
        type="button"
        className={styles.button}
        disabled={isImporting}
        onClick={() => inputRef.current?.click()}
        aria-label={t("gamedata.import")}
      >
        ↑ {isImporting ? t("gamedata.importing") : t("gamedata.import")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className={styles.input}
        disabled={isImporting}
        onChange={handleChange}
      />
    </label>
  );
}
