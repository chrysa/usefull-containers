import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ItemSummary } from "@/domain/gamedata/types";
import styles from "./ItemCard.module.scss";

interface Props {
  readonly item: ItemSummary;
}

export function ItemCard({ item }: Props) {
  const { t } = useTranslation();

  return (
    <article className={styles.card} title={item.id}>
      <p className={styles.name}>{item.name}</p>
      <p className={styles.id}>{item.id}</p>
      {item.description && (
        <p className={styles.description}>{item.description}</p>
      )}
      {item.stack_size > 0 && (
        <p className={styles.stack}>
          {t("gamedata.stack_size", { count: item.stack_size })}
        </p>
      )}
      <Link
        to={`/calculator?item=${encodeURIComponent(item.id)}`}
        className={styles.calcLink}
        data-testid="item-calculate-link"
      >
        {t("gamedata.calculate")}
      </Link>
    </article>
  );
}
