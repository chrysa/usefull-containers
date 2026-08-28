import { useTranslation } from "react-i18next";
import { countForTier, type TransportRequirement } from "@/domain/gamedata/logistics";
import { formatQty } from "./formatters";

interface Props {
  readonly transport: TransportRequirement;
  readonly beltTier: string;
  readonly pipeTier: string;
}

/** Renders the belt/pipe count badge for a production node's transport requirement. */
export default function TransportBadge({ transport, beltTier, pipeTier }: Props) {
  const { t } = useTranslation();
  if (transport.rate <= 0) return null;

  const selectedTier = transport.is_fluid ? pipeTier : beltTier;
  const count = countForTier(transport, selectedTier);
  const kind = transport.is_fluid ? t("calculator.unit_pipe") : t("calculator.unit_belt");
  const overTopTier = transport.min_single_tier === null;
  const detail =
    transport.min_single_tier && transport.min_single_tier !== selectedTier
      ? ` (${t("calculator.min_tier", { tier: transport.min_single_tier })})`
      : "";

  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius)] border px-1.5 py-0.5 font-mono text-xs ${
        transport.is_fluid ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
      } ${overTopTier ? "border-warning/60 text-warning" : ""}`}
      title={`${formatQty(transport.rate)}/min · ${kind} ${selectedTier}${detail}`}
    >
      {count}× {kind} {selectedTier}
      {detail}
    </span>
  );
}
