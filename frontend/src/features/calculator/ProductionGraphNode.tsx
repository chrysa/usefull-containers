import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { GraphNodeData } from "./graphLayout";

export type ProductionNodeType = Node<GraphNodeData, "productionNode">;

function formatQty(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

/**
 * Custom ReactFlow node rendering a single production step: item name,
 * flow rate, recipe used, and a "raw" badge for unprocessed inputs.
 */
export default function ProductionGraphNode({ data }: NodeProps<ProductionNodeType>) {
  return (
    <div
      className={cn(
        "flex w-[210px] flex-col gap-0.5 rounded-[var(--radius)] border border-border bg-card px-3.5 py-2.5 text-foreground shadow-md",
        data.isRaw && "border-primary/60 bg-primary/10",
      )}
    >
      <Handle type="target" position={Position.Top} className="!size-2 !border-border !bg-border" />
      <span className="truncate text-[0.82rem] font-medium text-foreground">{data.label}</span>
      <span className="font-mono text-base text-primary">{formatQty(data.quantity)}</span>
      {data.recipeName !== null && (
        <span className="truncate text-[0.73rem] text-muted-foreground">via {data.recipeName}</span>
      )}
      {data.isRaw && (
        <span className="mt-0.5 w-fit rounded-[var(--radius)] bg-primary px-1.5 py-0.5 text-[0.68rem] font-bold uppercase text-primary-foreground">
          raw
        </span>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !border-border !bg-border"
      />
    </div>
  );
}
