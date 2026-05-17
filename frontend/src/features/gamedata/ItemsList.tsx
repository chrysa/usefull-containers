import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useItemsQuery } from "../../domain/gamedata/queries";
import { ItemCard } from "./ItemCard";
import Skeleton from "../../components/ui/Skeleton";
import styles from "./SearchList.module.scss";

interface Props {
  readonly hasData: boolean;
}

export function ItemsList({ hasData }: Props) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const { data: items, isLoading } = useItemsQuery(q, hasData);

  return (
    <div className={styles.container}>
      <label className={styles.search}>
        <span>🔍</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("gamedata.search_items")}
          disabled={!hasData}
        />
      </label>

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && items != null && items.length > 0 && (
        <>
          <p className={styles.count}>{t("gamedata.count_items", { count: items.length })}</p>
          <div className={styles.grid}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {!isLoading && items != null && items.length === 0 && (
        <p className={styles.empty}>{t("gamedata.no_results")}</p>
      )}

      {!hasData && (
        <p className={styles.empty}>{t("gamedata.empty")}</p>
      )}
    </div>
  );
}
