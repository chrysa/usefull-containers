import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TagEditor } from "../features/blueprints";
import {
  useBlueprintQuery,
  useDeleteBlueprintMutation,
  useUpdateBlueprintDescriptionMutation,
} from "../domain/blueprints/queries";
import styles from "./BlueprintDetail.module.scss";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function BlueprintDetail() {
  const { name = "" } = useParams<{ name: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: blueprint, isLoading, isError } = useBlueprintQuery(name);
  const deleteMutation = useDeleteBlueprintMutation();
  const descMutation = useUpdateBlueprintDescriptionMutation(name);

  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  function handleEditDesc() {
    setDescDraft(blueprint?.description ?? "");
    setEditingDesc(true);
  }

  function handleSaveDesc() {
    descMutation.mutate(descDraft, {
      onSuccess: () => setEditingDesc(false),
    });
  }

  function handleCancelDesc() {
    setEditingDesc(false);
  }

  function handleDelete() {
    deleteMutation.mutate(name, {
      onSuccess: () => navigate("/blueprints"),
    });
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p className={styles.loading}>{t("loading")}</p>
      </main>
    );
  }

  if (isError || !blueprint) {
    return (
      <main className={styles.page}>
        <p className={styles.error}>{t("error")}</p>
        <Link to="/blueprints" className={styles.back}>
          {t("blueprint_detail.back")}
        </Link>
      </main>
    );
  }

  const colorStyle =
    blueprint.color != null
      ? ({
          "--swatch-r": blueprint.color.r,
          "--swatch-g": blueprint.color.g,
          "--swatch-b": blueprint.color.b,
          "--swatch-a": blueprint.color.a,
        } as React.CSSProperties)
      : undefined;

  const downloadHref = `/api/v1/blueprints/${encodeURIComponent(name)}/download`;

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link to="/blueprints">{t("nav.blueprints")}</Link>
        <span className={styles.sep} aria-hidden="true">/</span>
        <span>{name}</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          {blueprint.color != null && (
            <span className={styles.colorDot} style={colorStyle} aria-hidden="true" />
          )}
          <h1 className={styles.name}>{blueprint.name}</h1>
        </div>

        <div className={styles.actions}>
          <a
            href={downloadHref}
            download
            className={styles.btnDownload}
          >
            ↓ {t("blueprint_detail.download", { defaultValue: "Download" })}
          </a>
          <button
            type="button"
            className={styles.btnDelete}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {t("blueprint_detail.delete")}
          </button>
        </div>
      </header>

      <section className={styles.meta}>
        <dl className={styles.metaGrid}>
          <dt>{t("blueprint_detail.size")}</dt>
          <dd>{formatBytes(blueprint.size_bytes)}</dd>

          <dt>{t("blueprint_detail.modified")}</dt>
          <dd>{formatDate(blueprint.modified_at)}</dd>

          <dt>{t("blueprint_detail.files")}</dt>
          <dd>
            {blueprint.has_sbp ? ".sbp" : null}
            {blueprint.has_sbp && blueprint.has_cfg ? " · " : null}
            {blueprint.has_cfg ? ".sbpcfg" : null}
            {!blueprint.has_sbp && !blueprint.has_cfg ? "—" : null}
          </dd>
        </dl>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("blueprint_detail.description")}</h2>
          {!editingDesc && (
            <button
              type="button"
              className={styles.btnEdit}
              onClick={handleEditDesc}
            >
              {t("blueprint_detail.edit")}
            </button>
          )}
        </div>

        {editingDesc ? (
          <div className={styles.descEdit}>
            <textarea
              className={styles.descTextarea}
              rows={4}
              value={descDraft}
              placeholder={t("blueprint_detail.description_placeholder")}
              onChange={(e) => setDescDraft(e.target.value)}
            />
            <div className={styles.descActions}>
              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSaveDesc}
                disabled={descMutation.isPending}
              >
                {descMutation.isPending
                  ? t("blueprint_detail.saving")
                  : t("blueprint_detail.save")}
              </button>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={handleCancelDesc}
                disabled={descMutation.isPending}
              >
                {t("blueprint_detail.cancel")}
              </button>
            </div>
          </div>
        ) : blueprint.description ? (
          <p className={styles.descValue}>{blueprint.description}</p>
        ) : (
          <p className={styles.descEmpty}>{t("blueprint_detail.description_empty")}</p>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("blueprint_detail.tags")}</h2>
        </div>
        <TagEditor blueprintName={name} tags={blueprint.tags} />
      </section>
    </main>
  );
}
