import { useTranslation } from "react-i18next";

interface Props {
  readonly createdPlanId: string | null;
  readonly planName: string;
  readonly backendOnline: boolean;
}

/** Final step: recap of what was set up. */
export default function DoneStep({ createdPlanId, planName, backendOnline }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="m-0 text-base font-semibold text-foreground">{t("setup.done.title")}</h3>
      <p className="text-sm text-muted-foreground">
        {createdPlanId
          ? t("setup.done.lead_with_plan", { name: planName })
          : t("setup.done.lead_no_plan")}
      </p>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        <li className="text-sm text-muted-foreground">
          <strong className="text-foreground">{t("setup.done.backend_label")}:</strong>{" "}
          {backendOnline ? t("setup.done.backend_ok") : t("setup.done.backend_skipped")}
        </li>
        {createdPlanId && (
          <li className="text-sm text-muted-foreground">
            <strong className="text-foreground">{t("setup.done.plan_label")}:</strong> {planName}
          </li>
        )}
      </ul>
    </>
  );
}
