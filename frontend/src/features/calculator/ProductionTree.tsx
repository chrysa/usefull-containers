import { useTranslation } from "react-i18next";
import type { CalculationNode } from "@/domain/gamedata/calculator";
import { formatQty, prettifyMachine } from "./formatters";
import TransportBadge from "./TransportBadge";

interface NodeProps {
  readonly node: CalculationNode;
  readonly depth: number;
  readonly beltTier: string;
  readonly pipeTier: string;
}

function TreeNode({ node, depth, beltTier, pipeTier }: NodeProps) {
  const { t } = useTranslation();
  const isRaw = node.children.length === 0 && node.recipe_id === null;
  return (
    <li>
      <div className="flex flex-wrap items-center gap-2 border-b border-border py-1.5 text-sm">
        <span className={isRaw ? "font-medium text-warning" : "text-foreground"}>{node.item_name}</span>
        <span className="font-mono text-muted-foreground">{formatQty(node.quantity)}</span>
        {node.recipe_name && (
          <span className="text-xs text-muted-foreground">via {node.recipe_name}</span>
        )}
        {node.machines && node.machines.count > 0 && (
          <span
            className="inline-flex items-center rounded-[var(--radius)] border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
            title={`${prettifyMachine(node.machines.machine_id)} · ${node.machines.exact.toFixed(2)} ${t("calculator.machines_label")} @ ${node.machines.clock_percent.toFixed(0)}%`}
          >
            ×{node.machines.count} {prettifyMachine(node.machines.machine_id)}
          </span>
        )}
        <TransportBadge transport={node.transport} beltTier={beltTier} pipeTier={pipeTier} />
        {isRaw && (
          <span className="rounded-[var(--radius)] bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            raw
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <ul className="ml-4 border-l border-border pl-4">
          {node.children.map((child) => (
            <TreeNode
              key={`${child.item_id}-${depth}`}
              node={child}
              depth={depth + 1}
              beltTier={beltTier}
              pipeTier={pipeTier}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface Props {
  readonly tree: CalculationNode;
  readonly beltTier: string;
  readonly pipeTier: string;
}

/** Renders the recursive production tree view for a calculated target item. */
export default function ProductionTree({ tree, beltTier, pipeTier }: Props) {
  const { t } = useTranslation();
  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{t("calculator.production_tree")}</h2>
      <ul>
        <TreeNode node={tree} depth={0} beltTier={beltTier} pipeTier={pipeTier} />
      </ul>
    </section>
  );
}
