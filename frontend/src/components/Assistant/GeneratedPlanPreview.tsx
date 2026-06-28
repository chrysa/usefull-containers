import { useTranslation } from "react-i18next";
import { useHealthQuery } from "../../api/health/queries";
import { useCreatePlanMutation } from "../../domain/plans/queries";
import { generatedPlanToPlanCreate } from "../../domain/plans/fromGeneratedPlan";
import type { GeneratedFactoryPlan } from "../../api/assistant/types";
import styles from "./GeneratedPlanPreview.module.scss";

function rate(perMinute: number, name: string): string {
  return `${perMinute.toFixed(1)} ${name}/min`;
}

export default function GeneratedPlanPreview({
  plan,
}: {
  plan: GeneratedFactoryPlan;
}) {
  const { t } = useTranslation();
  const { data: health } = useHealthQuery();
  const isDemo = health?.demo_mode === true;
  const createPlan = useCreatePlanMutation();

  const saveLabel = createPlan.isSuccess
    ? t("assistant.plan.saved")
    : createPlan.isPending
      ? t("assistant.plan.saving")
      : t("assistant.plan.save");

  return (
    <div className={styles.preview} data-testid="generated-plan-preview">
      <h3 className={styles.name}>{plan.name}</h3>

      <h4 className={styles.sectionTitle}>{t("assistant.plan.steps")}</h4>
      <ul className={styles.steps}>
        {plan.steps.map((s) => (
          <li key={s.item_id} className={styles.step}>
            <span className={styles.stepHead}>
              {s.machine_count > 0
                ? t("assistant.plan.machine_line", {
                    count: s.machine_count,
                    machine: s.machine_id,
                    recipe: s.recipe_name,
                    clock: Math.round(s.clock_percent),
                  })
                : t("assistant.plan.machine_unknown", { recipe: s.recipe_name })}
            </span>
            {s.inputs.length > 0 && (
              <span className={styles.stepInputs}>
                {t("assistant.plan.consumes")}:{" "}
                {s.inputs.map((i) => rate(i.per_minute, i.item_name)).join(", ")}
              </span>
            )}
          </li>
        ))}
      </ul>

      <h4 className={styles.sectionTitle}>{t("assistant.plan.raw_inputs")}</h4>
      <ul className={styles.raw}>
        {plan.raw_inputs.map((r) => (
          <li key={r.item_id}>{rate(r.per_minute, r.item_name)}</li>
        ))}
      </ul>

      {plan.warnings.length > 0 && (
        <ul className={styles.warnings} role="alert">
          {plan.warnings.map((w) => (
            <li key={w}>⚠️ {w}</li>
          ))}
        </ul>
      )}

      <details className={styles.assumptions}>
        <summary>{t("assistant.plan.assumptions")}</summary>
        <ul>
          {plan.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>

      <button
        type="button"
        className={styles.saveBtn}
        data-testid="save-generated-plan"
        disabled={isDemo || createPlan.isPending || createPlan.isSuccess}
        title={isDemo ? t("demo.readonly_hint") : undefined}
        onClick={() => createPlan.mutate(generatedPlanToPlanCreate(plan))}
      >
        {saveLabel}
      </button>
    </div>
  );
}
