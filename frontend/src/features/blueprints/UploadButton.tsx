import { useRef } from "react";
import styles from "./UploadButton.module.scss";

interface Props {
  readonly onUpload: (formData: FormData) => void;
  readonly isUploading: boolean;
}

export default function UploadButton({ onUpload, isUploading }: Props) {
  const sbpRef = useRef<HTMLInputElement>(null);
  const cfgRef = useRef<HTMLInputElement>(null);

  function handleChange() {
    const sbp = sbpRef.current?.files?.[0];
    if (!sbp) return;

    const formData = new FormData();
    formData.append("sbp_file", sbp);

    const cfg = cfgRef.current?.files?.[0];
    if (cfg) formData.append("cfg_file", cfg);

    onUpload(formData);

    // Reset inputs
    if (sbpRef.current) sbpRef.current.value = "";
    if (cfgRef.current) cfgRef.current.value = "";
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} data-disabled={isUploading}>
        <span>{isUploading ? "Uploading…" : "↑ Import .sbp"}</span>
        <input
          ref={sbpRef}
          type="file"
          accept=".sbp"
          className={styles.input}
          disabled={isUploading}
          onChange={handleChange}
          aria-label="Select a Satisfactory blueprint file (.sbp)"
        />
      </label>
      <label className={styles.labelSecondary} data-disabled={isUploading}>
        <span>+ .sbpcfg</span>
        <input
          ref={cfgRef}
          type="file"
          accept=".sbpcfg"
          className={styles.input}
          disabled={isUploading}
          aria-label="Select the blueprint config file (.sbpcfg, optional)"
        />
      </label>
    </div>
  );
}
