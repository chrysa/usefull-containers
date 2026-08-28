import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/languages/LanguageSwitcher";
import { cn } from "@/lib/utils";
import type { Step } from "./types";

interface Props {
  readonly steps: readonly Step[];
  readonly stepIndex: number;
  readonly onSkip: () => void;
}

/** Wizard header: title, language switcher, skip action, and step progress dots. */
export default function SetupWizardHeader({ steps, stepIndex, onSkip }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 id="setup-wizard-title" className="m-0 text-lg font-semibold text-foreground">
          {t("setup.title")}
        </h2>
        <div className="flex items-center gap-2" data-testid="setup-language">
          <LanguageSwitcher />
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-0 text-sm text-muted-foreground hover:text-foreground"
            onClick={onSkip}
            aria-label={t("setup.skip_aria")}
          >
            {t("setup.skip")}
          </button>
        </div>
      </header>

      <div className="flex gap-1 px-6 pt-4" aria-hidden="true">
        {steps.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1 flex-1 rounded-[var(--radius)] bg-border",
              i === stepIndex && "bg-primary",
              i < stepIndex && "bg-primary/60",
            )}
          />
        ))}
      </div>
    </>
  );
}
