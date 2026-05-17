import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBlueprintsQuery } from "../domain/blueprints/queries";
import { useHealthQuery } from "../api/health/queries";
import styles from "./Home.module.scss";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const { t } = useTranslation();
  const { data: bpData, isLoading: bpLoading } = useBlueprintsQuery();
  const { data: health, isLoading: healthLoading, isError: healthError } = useHealthQuery();

  const blueprintCount = bpData?.total ?? 0;
  const uniqueTags = bpData
    ? new Set(bpData.blueprints.flatMap((bp) => bp.tags)).size
    : 0;

  const hubLabel = healthLoading
    ? t("home.hub_checking")
    : healthError
      ? t("home.hub_offline")
      : t("home.hub_online");

  const hubStatus = healthLoading ? "checking" : healthError ? "offline" : "online";

  const recent = bpData
    ? [...bpData.blueprints]
        .sort((a, b) => {
          if (!a.modified_at) return 1;
          if (!b.modified_at) return -1;
          return b.modified_at.localeCompare(a.modified_at);
        })
        .slice(0, 5)
    : [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("home.title")}</h1>
        <p className={styles.subtitle}>{t("home.subtitle")}</p>
      </header>

      <section className={styles.stats} aria-label={t("home.title")}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {bpLoading ? "—" : blueprintCount}
          </span>
          <span className={styles.statLabel}>{t("home.stat_blueprints")}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {bpLoading ? "—" : uniqueTags}
          </span>
          <span className={styles.statLabel}>{t("home.stat_tags")}</span>
        </div>

        <div className={`${styles.statCard} ${styles[`status-${hubStatus}`]}`}>
          <span className={styles.statValue}>{hubLabel}</span>
          <span className={styles.statLabel}>{t("home.stat_hub")}</span>
          {health && (
            <span className={styles.statMeta}>v{health.version}</span>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("home.recent_title")}</h2>
        {recent.length === 0 ? (
          <p className={styles.empty}>{t("home.recent_empty")}</p>
        ) : (
          <ul className={styles.recentList}>
            {recent.map((bp) => (
              <li key={bp.name} className={styles.recentItem}>
                <span className={styles.recentName}>{bp.name}</span>
                <span className={styles.recentDate}>{formatDate(bp.modified_at)}</span>
                {bp.tags.length > 0 && (
                  <span className={styles.recentTags}>
                    {bp.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("home.quicklinks_title")}</h2>
        <nav className={styles.quicklinks}>
          <Link to="/blueprints" className={styles.quicklink}>
            📁 {t("home.go_blueprints")}
          </Link>
          <Link to="/gamedata" className={styles.quicklink}>
            🎮 {t("home.go_gamedata")}
          </Link>
          <Link to="/calculator" className={styles.quicklink}>
            🧮 {t("home.go_calculator")}
          </Link>
        </nav>
      </section>
    </div>
  );
}
