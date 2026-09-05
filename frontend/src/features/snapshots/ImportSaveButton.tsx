import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { parseSaveFile, UnsupportedSaveVersionError } from "@/domain/savefile/parseSave";
import { useCreateSnapshotMutation } from "@/domain/snapshots/queries";

/**
 * File-picker button that runs the 100%-client `.sav` import pipeline:
 * read the file, parse it with `parseSaveFile` (parseSave + reduce), then
 * persist the resulting `CompactSnapshot` via `useCreateSnapshotMutation`.
 */
export default function ImportSaveButton() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const createSnapshot = useCreateSnapshotMutation();
  const [parseError, setParseError] = useState(false);
  const [unsupportedVersion, setUnsupportedVersion] = useState<number | null>(null);

  async function handleFile(file: File) {
    setParseError(false);
    setUnsupportedVersion(null);
    try {
      const snapshot = await parseSaveFile(file);
      createSnapshot.mutate({ name: snapshot.save_name, data: snapshot });
    } catch (err) {
      if (err instanceof UnsupportedSaveVersionError) {
        setUnsupportedVersion(err.saveVersion);
      } else {
        setParseError(true);
      }
    }
  }

  const isPending = createSnapshot.isPending;

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".sav"
        hidden
        aria-label={t("snapshots.import_hint")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? t("snapshots.importing") : t("snapshots.import")}
      </Button>
      {unsupportedVersion !== null && (
        <p className="text-sm text-destructive" role="alert">
          {t("snapshots.parse_error_version", { version: unsupportedVersion })}
        </p>
      )}
      {parseError && (
        <p className="text-sm text-destructive" role="alert">
          {t("snapshots.parse_error")}
        </p>
      )}
      {createSnapshot.isError && (
        <p className="text-sm text-destructive" role="alert">
          {t("snapshots.save_error")}
        </p>
      )}
    </div>
  );
}
