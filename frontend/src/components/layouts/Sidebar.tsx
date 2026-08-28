import {
  Blocks,
  Calculator,
  Database,
  GitCompare,
  Home,
  LayoutList,
  MessageCircle,
  Camera,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface NavItem {
  readonly to: string;
  readonly labelKey: string;
  readonly icon: typeof Home;
}

interface NavSection {
  readonly titleKey: string;
  readonly items: readonly NavItem[];
}

const SECTIONS: readonly NavSection[] = [
  {
    titleKey: "nav.sections.overview",
    items: [{ to: "/", labelKey: "nav.home", icon: Home }],
  },
  {
    titleKey: "nav.sections.plan",
    items: [
      { to: "/calculator", labelKey: "nav.calculator", icon: Calculator },
      { to: "/plans", labelKey: "nav.plans", icon: LayoutList },
      { to: "/blueprints", labelKey: "nav.blueprints", icon: Blocks },
    ],
  },
  {
    titleKey: "nav.sections.track",
    items: [
      { to: "/snapshots", labelKey: "nav.snapshots", icon: Camera },
      { to: "/diff", labelKey: "nav.diff", icon: GitCompare },
      { to: "/assistant", labelKey: "nav.assistant", icon: MessageCircle },
    ],
  },
  {
    titleKey: "nav.sections.reference",
    items: [{ to: "/gamedata", labelKey: "nav.gamedata", icon: Database }],
  },
];

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <nav
      className="flex h-full w-56 flex-none flex-col gap-6 overflow-y-auto border-r border-border bg-card p-4"
      aria-label={t("nav.sections.overview")}
    >
      {SECTIONS.map((section) => (
        <div key={section.titleKey} className="flex flex-col gap-1">
          <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t(section.titleKey)}
          </span>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted",
                  isActive && "bg-primary/10 font-medium text-primary",
                )
              }
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
