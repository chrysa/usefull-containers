import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type NodeTypes,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CalculationNode } from "../../domain/gamedata/calculator";
import { buildGraph, type GraphNodeData } from "./graphLayout";
import styles from "./ProductionGraph.module.scss";

// ── Custom node ───────────────────────────────────────────────────────────────

function formatQty(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function ProductionNode({ data }: NodeProps<{ data: GraphNodeData }>) {
  return (
    <div className={`${styles.node} ${data.isRaw ? styles.nodeRaw : ""}`}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <span className={styles.nodeName}>{data.label}</span>
      <span className={styles.nodeQty}>{formatQty(data.quantity)}</span>
      {data.recipeName && (
        <span className={styles.nodeRecipe}>via {data.recipeName}</span>
      )}
      {data.isRaw && <span className={styles.nodeRawBadge}>raw</span>}
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  productionNode: ProductionNode as React.ComponentType<NodeProps>,
};

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
  readonly tree: CalculationNode;
}

export default function ProductionGraph({ tree }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(tree), [tree]);

  return (
    <div className={styles.container}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background gap={20} size={1} color="var(--color-border, #333)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) =>
            (n.data as GraphNodeData).isRaw
              ? "var(--color-accent-raw, #a16207)"
              : "var(--color-surface, #1e1e2e)"
          }
          maskColor="rgba(0,0,0,0.4)"
        />
      </ReactFlow>
    </div>
  );
}
