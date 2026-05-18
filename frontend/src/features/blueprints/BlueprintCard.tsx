import React from "react";
import { Link } from "react-router-dom";
import type { Blueprint } from "../../domain/blueprints/types";
import { TagEditor } from "./TagEditor";
import styles from "./BlueprintCard.module.scss";

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
  const downloadUrl = `/api/v1/blueprints/${blueprint.name}/download`;
  const modifiedDate = blueprint.modified_at
    ? new Date(blueprint.modified_at).toLocaleDateString()
    : "—";

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <Link to={`/blueprints/${encodeURIComponent(blueprint.name)}`} className={styles.name}>
          {blueprint.name}
        </Link>
        {blueprint.color && (
          <span
            className={styles.colorDot}
            // CSS custom properties allow dynamic theming without inline styles
            style={
              {
                "--swatch-r": Math.round(blueprint.color.r * 255),
                "--swatch-g": Math.round(blueprint.color.g * 255),
                "--swatch-b": Math.round(blueprint.color.b * 255),
                "--swatch-a": blueprint.color.a,
              } as React.CSSProperties
            }
          />
        )}
      </header>

      {blueprint.description && (
        <p className={styles.description}>{blueprint.description}</p>
      )}

      <TagEditor blueprintName={blueprint.name} tags={blueprint.tags} />

      <footer className={styles.footer}>
        <span className={styles.meta}>{formatBytes(blueprint.size_bytes)}</span>
        <span className={styles.meta}>{modifiedDate}</span>
        <div className={styles.actions}>
          <a
            href={downloadUrl}
            download={`${blueprint.name}.sbp`}
            className={styles.btnDownload}
            aria-label={`Download ${blueprint.name}`}
          >
            ↓ Export
          </a>
          <button
            type="button"
            className={styles.btnDelete}
            onClick={() => onDelete(blueprint.name)}
            aria-label={`Delete ${blueprint.name}`}
          >
            Delete
          </button>
        </div>
      </footer>
    </article>
  );
}
