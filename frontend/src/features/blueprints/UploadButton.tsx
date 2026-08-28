import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  readonly onUpload: (formData: FormData) => void;
  readonly isUploading: boolean;
}

export default function UploadButton({ onUpload, isUploading }: Props) {
  const { t } = useTranslation();
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
    <div className="flex flex-wrap items-center gap-2">
      <label
        className={cn(
          buttonVariants({ variant: "default" }),
          "cursor-pointer",
          isUploading && "pointer-events-none opacity-50",
        )}
        data-disabled={isUploading}
      >
        <span>{isUploading ? t("blueprints.uploading") : t("blueprints.upload_sbp")}</span>
        <input
          ref={sbpRef}
          type="file"
          accept=".sbp"
          className="hidden"
          disabled={isUploading}
          onChange={handleChange}
          aria-label={t("blueprints.upload_sbp_hint")}
        />
      </label>
      <label
        className={cn(
          buttonVariants({ variant: "outline" }),
          "cursor-pointer",
          isUploading && "pointer-events-none opacity-50",
        )}
        data-disabled={isUploading}
      >
        <span>{t("blueprints.upload_cfg")}</span>
        <input
          ref={cfgRef}
          type="file"
          accept=".sbpcfg"
          className="hidden"
          disabled={isUploading}
          aria-label={t("blueprints.upload_cfg_hint")}
        />
      </label>
    </div>
  );
}
