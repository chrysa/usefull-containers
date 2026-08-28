import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { SnapshotRead } from "@/domain/snapshots/types";
import { formatDate } from "@/utils/formatDate";
import { formatPlayTime } from "@/utils/formatPlayTime";

interface Props {
  readonly snapshot: SnapshotRead;
  readonly onDelete: (id: string) => void;
}

export default function SnapshotCard({ snapshot, onDelete }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <article className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-3.5">
      <header className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-foreground">{snapshot.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (globalThis.confirm(t("snapshots.confirm_delete", { name: snapshot.name }))) {
              onDelete(snapshot.id);
            }
          }}
          aria-label={t("snapshots.delete_aria", { name: snapshot.name })}
        >
          {t("snapshots.delete")}
        </Button>
      </header>
      <p className="text-sm text-muted-foreground">
        {t("snapshots.save_name", { name: snapshot.save_name })}
      </p>
      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t("snapshots.play_time", { value: formatPlayTime(snapshot.play_time) })}</span>
        <span>{formatDate(snapshot.imported_at, i18n.language)}</span>
      </footer>
    </article>
  );
}
