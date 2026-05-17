import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./BatchUploadButton.module.scss";

interface Props {
  readonly onUpload: (formData: FormData) => void;
  readonly isUploading: boolean;
}

function buildFormData(fileList: FileList): FormData {
  const formData = new FormData();
  Array.from(fileList).forEach((file) => {
    formData.append("files", file, file.name);
  });
  return formData;
}

export default function BatchUploadButton({ onUpload, isUploading }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { files } = e.target;
    if (!files || files.length === 0) return;
    onUpload(buildFormData(files));
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(buildFormData(e.dataTransfer.files));
    }
  }

  return (
    <label
      className={styles.dropZone}
      data-disabled={isUploading}
      data-drag-over={isDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className={styles.icon}>↑</span>
      <span className={styles.hint}>
        {isUploading
          ? t("blueprints.batch_uploading")
          : t("blueprints.batch_drop_hint")}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept=".sbp,.sbpcfg"
        multiple
        className={styles.input}
        disabled={isUploading}
        onChange={handleChange}
        aria-label={t("blueprints.batch_upload")}
      />
    </label>
  );
}
