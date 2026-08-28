import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Button
        type="button"
        variant="outline"
        disabled={isImporting}
        onClick={() => inputRef.current?.click()}
        aria-label={t("gamedata.import")}
      >
        <Upload />
        {isImporting ? t("gamedata.importing") : t("gamedata.import")}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className="hidden"
        disabled={isImporting}
        onChange={handleChange}
      />
    </label>
  );
}
