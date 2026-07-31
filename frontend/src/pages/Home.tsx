import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBlueprintsQuery } from "@/domain/blueprints/queries";
import { useHealthQuery } from "@/api/health/queries";
import { usePlansQuery } from "@/domain/plans/queries";
import Skeleton from "@/components/ui/Skeleton";
import { formatDate } from "@/utils/formatDate";
import styles from "./Home.module.scss";

const RECENT_DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const { data: bpData, isLoading: bpLoading } = useBlueprintsQuery();
  const { data: health, isLoading: healthLoading, isError: healthError } = useHealthQuery();
  const { data: plansData, isLoading: plansLoading } = usePlansQuery();

  const blueprintCount = bpData?.total ?? 0;
  const uniqueTags = bpData
    ? new Set(bpData.blueprints.flatMap((bp) => bp.tags)).size
    : 0;
  const planCount = plansData?.length ?? 0;

  const recentPlans = plansData
    ? [...plansData]
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 5)
    : [];

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
            {bpLoading ? <Skeleton width="40px" height="28px" radius="4px" /> : blueprintCount}
          </span>
          <span className={styles.statLabel}>{t("home.stat_blueprints")}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {bpLoading ? <Skeleton width="32px" height="28px" radius="4px" /> : uniqueTags}
          </span>
          <span className={styles.statLabel}>{t("home.stat_tags")}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {plansLoading ? <Skeleton width="40px" height="28px" radius="4px" /> : planCount}
          </span>
          <span className={styles.statLabel}>{t("home.stat_plans")}</span>
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
        {bpLoading ? (
          <ul className={styles.recentList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className={styles.recentItem}>
                <Skeleton width="180px" height="14px" />
                <Skeleton width="72px" height="12px" />
              </li>
            ))}
          </ul>
        ) : recent.length === 0 ? (
          <p className={styles.empty}>{t("home.recent_empty")}</p>
        ) : (
          <ul className={styles.recentList}>
            {recent.map((bp) => (
              <li key={bp.name} className={styles.recentItem}>
                <span className={styles.recentName}>{bp.name}</span>
                <span className={styles.recentDate}>
                  {formatDate(bp.modified_at, i18n.language, RECENT_DATE_OPTS)}
                </span>
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
        <h2 className={styles.sectionTitle}>{t("home.recent_plans_title")}</h2>
        {plansLoading ? (
          <ul className={styles.recentList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className={styles.recentItem}>
                <Skeleton width="180px" height="14px" />
                <Skeleton width="72px" height="12px" />
              </li>
            ))}
          </ul>
        ) : recentPlans.length === 0 ? (
          <p className={styles.empty}>{t("home.no_plans")}</p>
        ) : (
          <ul className={styles.recentList}>
            {recentPlans.map((plan) => (
              <li key={plan.id} className={styles.recentItem}>
                <Link to={`/plans/${plan.id}`} className={styles.recentLink}>{plan.name}</Link>
                <span className={styles.recentDate}>
                  {formatDate(plan.updated_at, i18n.language, RECENT_DATE_OPTS)}
                </span>
                {plan.target_items.length > 0 && (
                  <span className={styles.recentMeta}>
                    {t("plans.items_count", { count: plan.target_items.length })}
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
          <Link to="/plans" className={styles.quicklink}>
            📋 {t("home.go_plans")}
          </Link>
        </nav>
      </section>
    </div>
  );
}
