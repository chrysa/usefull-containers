import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BatchUploadResult } from "@/domain/blueprints/types";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onUpload: (files: FileList) => void;
  isUploading: boolean;
  result: BatchUploadResult | null;
}

const ACCEPTED_EXTENSIONS = [".sbp", ".sbpcfg"];

function filterBlueprints(fileList: FileList): FileList {
  const dt = new DataTransfer();
  Array.from(fileList).forEach((f) => {
    if (ACCEPTED_EXTENSIONS.some((ext) => f.name.endsWith(ext))) dt.items.add(f);
  });
  return dt.files;
}

export function DropZone({ onUpload, isUploading, result }: DropZoneProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList) => {
    const filtered = filterBlueprints(fileList);
    if (filtered.length > 0) onUpload(filtered);
  };

  return (
    <div
      className={cn(
        "cursor-pointer select-none rounded-[var(--radius)] border border-dashed border-border p-8 text-center transition-colors",
        "hover:border-primary hover:bg-muted",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        isDragging && "border-primary bg-muted",
        isUploading && "cursor-wait opacity-70",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !isUploading && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && !isUploading && inputRef.current?.click()}
      aria-label={t("blueprints.batch_upload")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".sbp,.sbpcfg"
        multiple
        hidden
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <span className="block text-sm text-muted-foreground">
        {isUploading ? t("blueprints.batch_uploading") : t("blueprints.batch_drop_hint")}
      </span>
      {result && (
        <p className="mt-3 text-sm text-success" role="status">
          {t("blueprints.batch_result", {
            created: result.created.length,
            updated: result.updated.length,
            failed: result.failed.length,
          })}
        </p>
      )}
    </div>
  );
}
