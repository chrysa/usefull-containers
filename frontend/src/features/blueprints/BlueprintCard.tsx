import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Blueprint } from "@/domain/blueprints/types";
import { downloadAuthedFile } from "@/domain/blueprints/download";
import { formatDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import { TagEditor } from "./TagEditor";

interface Props {
  readonly blueprint: Blueprint;
  readonly onDelete: (name: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BlueprintCard({ blueprint, onDelete }: Props) {
  const { t, i18n } = useTranslation();
  const downloadUrl = `/api/v1/blueprints/${encodeURIComponent(blueprint.name)}/download`;
  const modifiedDate = formatDate(blueprint.modified_at, i18n.language);

  return (
    <article className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-3.5 transition-colors hover:border-primary">
      <header className="flex items-center gap-2">
        <Link
          to={`/blueprints/${encodeURIComponent(blueprint.name)}`}
          className="flex-1 truncate font-medium text-foreground hover:text-primary"
        >
          {blueprint.name}
        </Link>
        {blueprint.color && (
          <span
            className="size-4 shrink-0 rounded-full border border-border"
            // CSS custom properties allow dynamic theming without inline styles
            style={
              {
                "--swatch-r": Math.round(blueprint.color.r * 255),
                "--swatch-g": Math.round(blueprint.color.g * 255),
                "--swatch-b": Math.round(blueprint.color.b * 255),
                "--swatch-a": blueprint.color.a,
                backgroundColor:
                  "rgba(var(--swatch-r), var(--swatch-g), var(--swatch-b), var(--swatch-a))",
              } as CSSProperties
            }
          />
        )}
      </header>

      {blueprint.description && (
        <p className="line-clamp-2 text-[0.8rem] text-muted-foreground">
          {blueprint.description}
        </p>
      )}

      <TagEditor blueprintName={blueprint.name} tags={blueprint.tags} />

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatBytes(blueprint.size_bytes)}</span>
          <span>{modifiedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadAuthedFile(downloadUrl, `${blueprint.name}.sbp`)}
            aria-label={t("blueprints.download_aria", { name: blueprint.name })}
          >
            ↓ {t("blueprints.download")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(blueprint.name)}
            aria-label={t("blueprints.delete_aria", { name: blueprint.name })}
          >
            {t("blueprints.delete")}
          </Button>
        </div>
      </footer>
    </article>
  );
}
