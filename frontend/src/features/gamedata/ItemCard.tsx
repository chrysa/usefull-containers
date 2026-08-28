import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ItemSummary } from "@/domain/gamedata/types";

interface Props {
  readonly item: ItemSummary;
}

export function ItemCard({ item }: Props) {
  const { t } = useTranslation();

  return (
    <article
      className="flex flex-col gap-1 rounded-[var(--radius)] border border-border bg-card p-3.5 transition-colors hover:border-primary"
      title={item.id}
    >
      <p className="truncate text-sm font-semibold text-foreground">
        {item.name}
      </p>
      <p className="truncate font-mono text-xs text-muted-foreground">
        {item.id}
      </p>
      {item.description && (
        <p className="mt-1 line-clamp-2 text-[0.8rem] text-muted-foreground">
          {item.description}
        </p>
      )}
      {item.stack_size > 0 && (
        <p className="pt-1.5 font-mono text-xs text-primary">
          {t("gamedata.stack_size", { count: item.stack_size })}
        </p>
      )}
      <Link
        to={`/calculator?item=${encodeURIComponent(item.id)}`}
        className="mt-auto self-start pt-2 text-xs font-bold text-primary hover:underline"
        data-testid="item-calculate-link"
      >
        {t("gamedata.calculate")}
      </Link>
    </article>
  );
}
