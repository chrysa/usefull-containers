import { useTranslation } from "react-i18next";

interface Props {
  readonly projectName: string;
  readonly onProjectNameChange: (value: string) => void;
  readonly backendUrl: string;
  readonly onBackendUrlChange: (value: string) => void;
  readonly defaultBackendUrl: string;
}

/** First step: choose a project name and, optionally, a backend URL. */
export default function ProjectStep({
  projectName,
  onProjectNameChange,
  backendUrl,
  onBackendUrlChange,
  defaultBackendUrl,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="m-0 text-base font-semibold text-foreground">
        {t("setup.project.title")}
      </h3>
      <p className="text-sm text-muted-foreground">{t("setup.project.lead")}</p>
      <div className="flex flex-col gap-1">
        <label htmlFor="setup-project-name" className="text-sm font-medium text-foreground">
          {t("setup.project.name_label")}
        </label>
        <input
          id="setup-project-name"
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder={t("setup.project.name_placeholder")}
          data-testid="setup-project-name-input"
          autoFocus
          className="rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          {t("setup.project.advanced")}
        </summary>
        <div className="mt-2 flex flex-col gap-1">
          <label htmlFor="setup-backend-url" className="text-sm font-medium text-foreground">
            {t("setup.project.url_label")}
          </label>
          <input
            id="setup-backend-url"
            type="url"
            value={backendUrl}
            onChange={(e) => onBackendUrlChange(e.target.value)}
            placeholder={defaultBackendUrl}
            data-testid="setup-backend-url-input"
            className="rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">{t("setup.project.url_hint")}</p>
        </div>
      </details>
    </>
  );
}
