import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "@/components/ui/button";
import Skeleton from "@/components/ui/Skeleton";
import { useFactory } from "@/context/FactoryContext";
import { readToken } from "@/domain/auth/store";
import { useBlueprintsQuery } from "@/domain/blueprints/queries";
import { useHealthQuery } from "@/api/health/queries";
import { usePlansQuery } from "@/domain/plans/queries";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import { formatPlayTime } from "@/utils/formatPlayTime";

const RECENT_DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const isAuthenticated = Boolean(readToken());
  const { factories, currentSaveName } = useFactory();
  const { data: bpData, isLoading: bpLoading, isError: bpError } = useBlueprintsQuery({
    enabled: isAuthenticated,
  });
  const { data: health, isLoading: healthLoading, isError: healthError } = useHealthQuery();
  const { data: plansData, isLoading: plansLoading, isError: plansError } = usePlansQuery({
    enabled: isAuthenticated,
  });

  const activeFactory = factories.find((factory) => factory.saveName === currentSaveName) ?? null;
  const latest = activeFactory?.latest ?? null;
  const powerProduction = latest?.data.power_grids.reduce((sum, grid) => sum + grid.production_mw, 0) ?? 0;
  const powerConsumption = latest?.data.power_grids.reduce((sum, grid) => sum + grid.consumption_mw, 0) ?? 0;

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
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{t("home.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("home.subtitle")}</p>
      </header>

      <section
        className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-5"
        aria-label={t("home.overview_title")}
      >
        <h2 className="text-lg font-semibold text-foreground">{t("home.overview_title")}</h2>

        {!isAuthenticated ? (
          <p className="text-sm text-muted-foreground">{t("home.overview_no_auth")}</p>
        ) : !latest ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("home.overview_no_snapshot")}</p>
            <Link to="/snapshots" className={cn(buttonVariants({ variant: "default" }))}>
              {t("home.overview_no_snapshot_cta")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("home.overview_save_name")}</span>
              <span className="text-base font-medium text-foreground">{latest.save_name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("home.overview_play_time")}</span>
              <span className="text-base font-medium text-foreground">{formatPlayTime(latest.play_time)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("home.overview_imported")}</span>
              <span className="text-base font-medium text-foreground">
                {formatDate(latest.imported_at, i18n.language, RECENT_DATE_OPTS)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("home.overview_buildings")}</span>
              <span className="text-base font-medium text-foreground">{latest.data.buildings.length}</span>
            </div>
            {latest.data.power_grids.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t("home.overview_power")}</span>
                <span className="text-base font-medium text-foreground">
                  {powerProduction.toFixed(0)} / {powerConsumption.toFixed(0)} MW
                </span>
              </div>
            )}
          </div>
        )}

        <nav className="flex flex-wrap gap-2" aria-label={t("home.shortcuts_title")}>
          <Link to="/snapshots" className={cn(buttonVariants({ variant: "outline" }))}>
            {t("home.shortcut_import")}
          </Link>
          <Link to="/diff" className={cn(buttonVariants({ variant: "outline" }))}>
            {t("home.shortcut_diff")}
          </Link>
          <Link to="/assistant" className={cn(buttonVariants({ variant: "outline" }))}>
            {t("home.shortcut_assistant")}
          </Link>
        </nav>
      </section>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3" aria-label={t("home.title")}>
        <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-border bg-card p-3.5">
          <span className="text-2xl font-semibold text-foreground">
            {bpLoading ? <Skeleton width="40px" height="28px" radius="4px" /> : bpError ? t("home.stat_unavailable") : blueprintCount}
          </span>
          <span className="text-xs text-muted-foreground">{t("home.stat_blueprints")}</span>
        </div>

        <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-border bg-card p-3.5">
          <span className="text-2xl font-semibold text-foreground">
            {bpLoading ? <Skeleton width="32px" height="28px" radius="4px" /> : bpError ? t("home.stat_unavailable") : uniqueTags}
          </span>
          <span className="text-xs text-muted-foreground">{t("home.stat_tags")}</span>
        </div>

        <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-border bg-card p-3.5">
          <span className="text-2xl font-semibold text-foreground">
            {plansLoading ? <Skeleton width="40px" height="28px" radius="4px" /> : plansError ? t("home.stat_unavailable") : planCount}
          </span>
          <span className="text-xs text-muted-foreground">{t("home.stat_plans")}</span>
        </div>

        <div
          className={cn(
            "flex flex-col gap-1 rounded-[var(--radius)] border border-border bg-card p-3.5",
            hubStatus === "online" && "border-l-4 border-l-primary",
            hubStatus === "offline" && "border-l-4 border-l-destructive",
          )}
        >
          <span className="text-2xl font-semibold text-foreground">{hubLabel}</span>
          <span className="text-xs text-muted-foreground">{t("home.stat_hub")}</span>
          {health && <span className="text-xs text-muted-foreground">v{health.version}</span>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t("home.recent_title")}</h2>
        {bpLoading ? (
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton width="180px" height="14px" />
                <Skeleton width="72px" height="12px" />
              </li>
            ))}
          </ul>
        ) : bpError ? (
          <p className="text-sm text-destructive" role="alert">{t("home.recent_error")}</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("home.recent_empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((bp) => (
              <li key={bp.name} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-foreground">{bp.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(bp.modified_at, i18n.language, RECENT_DATE_OPTS)}
                </span>
                {bp.tags.length > 0 && (
                  <span className="flex flex-wrap gap-1">
                    {bp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t("home.recent_plans_title")}</h2>
        {plansLoading ? (
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton width="180px" height="14px" />
                <Skeleton width="72px" height="12px" />
              </li>
            ))}
          </ul>
        ) : plansError ? (
          <p className="text-sm text-destructive" role="alert">{t("home.no_plans_error")}</p>
        ) : recentPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("home.no_plans")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentPlans.map((plan) => (
              <li key={plan.id} className="flex flex-wrap items-center gap-3 text-sm">
                <Link to={`/plans/${plan.id}`} className="font-medium text-primary hover:underline">
                  {plan.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDate(plan.updated_at, i18n.language, RECENT_DATE_OPTS)}
                </span>
                {plan.target_items.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t("plans.items_count", { count: plan.target_items.length })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t("home.quicklinks_title")}</h2>
        <nav className="flex flex-wrap gap-2">
          <Link to="/blueprints" className={cn(buttonVariants({ variant: "secondary" }))}>
            📁 {t("home.go_blueprints")}
          </Link>
          <Link to="/gamedata" className={cn(buttonVariants({ variant: "secondary" }))}>
            🎮 {t("home.go_gamedata")}
          </Link>
          <Link to="/calculator" className={cn(buttonVariants({ variant: "secondary" }))}>
            🧮 {t("home.go_calculator")}
          </Link>
          <Link to="/plans" className={cn(buttonVariants({ variant: "secondary" }))}>
            📋 {t("home.go_plans")}
          </Link>
        </nav>
      </section>
    </div>
  );
}
