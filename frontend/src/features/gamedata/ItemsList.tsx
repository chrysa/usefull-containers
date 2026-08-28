import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useItemsQuery } from "@/domain/gamedata/queries";
import { ItemCard } from "./ItemCard";
import { SearchInput } from "./SearchInput";
import Skeleton from "@/components/ui/Skeleton";

interface Props {
  readonly hasData: boolean;
}

export function ItemsList({ hasData }: Props) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const { data: items, isLoading, isError } = useItemsQuery(q, hasData);

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        value={q}
        onChange={setQ}
        placeholder={t("gamedata.search_items")}
        disabled={!hasData}
      />

      {isLoading && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <p className="py-8 text-center text-sm text-destructive" role="alert">
          {t("gamedata.error")}
        </p>
      )}

      {!isLoading && !isError && items != null && items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {t("gamedata.count_items", { count: items.length })}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {!isLoading && !isError && items != null && items.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("gamedata.no_results")}
        </p>
      )}

      {!hasData && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("gamedata.empty")}
        </p>
      )}
    </div>
  );
}
