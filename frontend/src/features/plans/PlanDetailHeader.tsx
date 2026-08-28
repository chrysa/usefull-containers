import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const INPUT_CLASS =
  "rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  readonly planName: string;
  readonly editingName: boolean;
  readonly nameDraft: string;
  readonly onNameDraftChange: (value: string) => void;
  readonly onEditName: () => void;
  readonly onSaveName: () => void;
  readonly onCancelName: () => void;
  readonly isSaving: boolean;
  readonly onDuplicate: () => void;
  readonly isDuplicating: boolean;
  readonly onExportJson: () => void;
  readonly onDelete: () => void;
  readonly isDeleting: boolean;
}

/**
 * Breadcrumb, editable plan title, and the row of top-level actions
 * (edit name, duplicate, export JSON, delete).
 */
export default function PlanDetailHeader({
  planName,
  editingName,
  nameDraft,
  onNameDraftChange,
  onEditName,
  onSaveName,
  onCancelName,
  isSaving,
  onDuplicate,
  isDuplicating,
  onExportJson,
  onDelete,
  isDeleting,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="breadcrumb">
        <Link to="/plans" className="hover:text-foreground">
          {t("nav.plans")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{planName}</span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        {editingName ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={INPUT_CLASS}
              value={nameDraft}
              onChange={(e) => onNameDraftChange(e.target.value)}
              maxLength={200}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveName();
                if (e.key === "Escape") onCancelName();
              }}
            />
            <Button type="button" size="sm" onClick={onSaveName} disabled={isSaving || !nameDraft.trim()}>
              {t("plan_detail.save")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancelName}>
              {t("plan_detail.cancel")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{planName}</h1>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onEditName}
              aria-label={t("plan_detail.edit_name")}
            >
              {t("plan_detail.edit")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onDuplicate} disabled={isDuplicating}>
              {t("plan_detail.duplicate")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onExportJson}>
              {t("plan_detail.export_json")}
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={onDelete} disabled={isDeleting}>
              {t("plan_detail.delete")}
            </Button>
          </div>
        )}
      </header>
    </>
  );
}
