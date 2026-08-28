import type { CSSProperties } from "react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TagEditor } from "@/features/blueprints";
import {
  useBlueprintQuery,
  useDeleteBlueprintMutation,
  useUpdateBlueprintDescriptionMutation,
} from "@/domain/blueprints/queries";
import { downloadAuthedFile } from "@/domain/blueprints/download";
import Skeleton from "@/components/ui/Skeleton";
import { formatDateTime } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BlueprintDetail() {
  const { name = "" } = useParams<{ name: string }>();
  const { t, i18n } = useTranslation();
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
    if (!globalThis.confirm(t("blueprint_detail.confirm_delete", { name }))) return;
    deleteMutation.mutate(name, {
      onSuccess: () => navigate("/blueprints"),
    });
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex max-w-[860px] flex-col gap-4 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Skeleton width="80px" height="14px" />
          <span aria-hidden="true">/</span>
          <Skeleton width="140px" height="14px" />
        </div>

        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton width="20px" height="20px" radius="50%" />
            <Skeleton width="240px" height="32px" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width="96px" height="36px" radius="6px" />
            <Skeleton width="80px" height="36px" radius="6px" />
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 rounded-[var(--radius)] border border-border bg-card p-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton width="60px" height="11px" />
              <Skeleton width="100px" height="14px" />
            </div>
          ))}
        </div>

        <section className="rounded-[var(--radius)] border border-border bg-card p-3">
          <Skeleton width="90px" height="16px" />
          <div className="mt-3 flex flex-col gap-1.5">
            <Skeleton width="100%" height="14px" />
            <Skeleton width="80%" height="14px" />
            <Skeleton width="60%" height="14px" />
          </div>
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-card p-3">
          <Skeleton width="60px" height="16px" />
          <div className="mt-3 flex gap-2">
            <Skeleton width="56px" height="24px" radius="999px" />
            <Skeleton width="72px" height="24px" radius="999px" />
          </div>
        </section>
      </main>
    );
  }

  if (isError || !blueprint) {
    return (
      <main className="mx-auto flex max-w-[860px] flex-col gap-4 p-4">
        <p className="text-muted-foreground">{t("error")}</p>
        <Link to="/blueprints" className="text-primary hover:underline">
          {t("blueprint_detail.back")}
        </Link>
      </main>
    );
  }

  const colorStyle =
    blueprint.color != null
      ? ({
          "--swatch-r": Math.round(blueprint.color.r * 255),
          "--swatch-g": Math.round(blueprint.color.g * 255),
          "--swatch-b": Math.round(blueprint.color.b * 255),
          "--swatch-a": blueprint.color.a,
          backgroundColor:
            "rgba(var(--swatch-r), var(--swatch-g), var(--swatch-b), var(--swatch-a))",
        } as CSSProperties)
      : undefined;

  const downloadHref = `/api/v1/blueprints/${encodeURIComponent(name)}/download`;

  return (
    <main className="mx-auto flex max-w-[860px] flex-col gap-4 p-4">
      <nav
        className="flex items-center gap-2 text-xs text-muted-foreground"
        aria-label="breadcrumb"
      >
        <Link to="/blueprints" className="hover:text-primary">
          {t("nav.blueprints")}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{name}</span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {blueprint.color != null && (
            <span
              className="size-5 shrink-0 rounded-full border border-border"
              style={colorStyle}
              aria-hidden="true"
            />
          )}
          <h1 className="text-2xl font-semibold text-foreground">{blueprint.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadAuthedFile(downloadHref, `${blueprint.name}.sbp`)}
            aria-label={t("blueprints.download_aria", { name: blueprint.name })}
          >
            ↓ {t("blueprint_detail.download", { defaultValue: "Download" })}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {t("blueprint_detail.delete")}
          </Button>
        </div>
      </header>

      <section className="rounded-[var(--radius)] border border-border bg-card p-3">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase text-muted-foreground">
              {t("blueprint_detail.size")}
            </dt>
            <dd className="text-sm text-foreground">{formatBytes(blueprint.size_bytes)}</dd>
          </div>

          <div>
            <dt className="text-[11px] uppercase text-muted-foreground">
              {t("blueprint_detail.modified")}
            </dt>
            <dd className="text-sm text-foreground">
              {formatDateTime(blueprint.modified_at, i18n.language)}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] uppercase text-muted-foreground">
              {t("blueprint_detail.files")}
            </dt>
            <dd className="text-sm text-foreground">
              {blueprint.has_sbp ? ".sbp" : null}
              {blueprint.has_sbp && blueprint.has_cfg ? " · " : null}
              {blueprint.has_cfg ? ".sbpcfg" : null}
              {!blueprint.has_sbp && !blueprint.has_cfg ? "—" : null}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">
            {t("blueprint_detail.description")}
          </h2>
          {!editingDesc && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={handleEditDesc}
            >
              {t("blueprint_detail.edit")}
            </button>
          )}
        </div>

        {editingDesc ? (
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              className="w-full resize-none rounded-[var(--radius)] border border-border bg-background p-2 text-sm text-foreground"
              rows={4}
              value={descDraft}
              placeholder={t("blueprint_detail.description_placeholder")}
              onChange={(e) => setDescDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveDesc}
                disabled={descMutation.isPending}
              >
                {descMutation.isPending
                  ? t("blueprint_detail.saving")
                  : t("blueprint_detail.save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelDesc}
                disabled={descMutation.isPending}
              >
                {t("blueprint_detail.cancel")}
              </Button>
            </div>
          </div>
        ) : blueprint.description ? (
          <p className="mt-3 text-sm text-foreground">{blueprint.description}</p>
        ) : (
          <p className="mt-3 text-sm italic text-muted-foreground">
            {t("blueprint_detail.description_empty")}
          </p>
        )}
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">{t("blueprint_detail.tags")}</h2>
        </div>
        <div className="mt-3">
          <TagEditor blueprintName={name} tags={blueprint.tags} />
        </div>
      </section>
    </main>
  );
}
