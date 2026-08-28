import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CalculationNode } from "@/domain/gamedata/calculator";
import { buildGraph, getDescendantIds, type GraphNodeData } from "./graphLayout";
import ProductionGraphNode from "./ProductionGraphNode";

const NODE_TYPES: NodeTypes = {
  productionNode: ProductionGraphNode,
};

const DIMMED_CLASS = "opacity-10 transition-opacity duration-150";
const VISIBLE_CLASS = "opacity-100 transition-opacity duration-150";

interface Props {
  readonly tree: CalculationNode;
}

export default function ProductionGraph({ tree }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(tree), [tree]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const highlightedIds = useMemo(
    () => (hoveredId !== null ? getDescendantIds(hoveredId, edges) : null),
    [hoveredId, edges],
  );

  const displayEdges = useMemo(
    () =>
      highlightedIds === null
        ? edges
        : edges.map((edge) => ({
            ...edge,
            className:
              highlightedIds.has(edge.source) || highlightedIds.has(edge.target)
                ? VISIBLE_CLASS
                : DIMMED_CLASS,
          })),
    [edges, highlightedIds],
  );

  const displayNodes = useMemo(
    () =>
      highlightedIds === null
        ? nodes
        : nodes.map((node) => ({
            ...node,
            className: highlightedIds.has(node.id) ? VISIBLE_CLASS : DIMMED_CLASS,
          })),
    [nodes, highlightedIds],
  );

  return (
    <div className="h-[580px] overflow-hidden rounded-[var(--radius)] border border-border bg-background [&_.react-flow__background]:bg-background [&_.react-flow__controls]:border [&_.react-flow__controls]:border-border [&_.react-flow__controls]:bg-card [&_.react-flow__controls-button]:border-border [&_.react-flow__controls-button]:bg-transparent [&_.react-flow__controls-button]:fill-foreground [&_.react-flow__controls-button]:text-foreground [&_.react-flow__controls-button:hover]:bg-muted [&_.react-flow__minimap]:border [&_.react-flow__minimap]:border-border [&_.react-flow__minimap]:bg-card">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeMouseEnter={(_event, node) => {
          setHoveredId(node.id);
        }}
        onNodeMouseLeave={() => {
          setHoveredId(null);
        }}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) =>
            (node.data as GraphNodeData).isRaw ? "var(--primary)" : "var(--card)"
          }
          maskColor="color-mix(in srgb, var(--background) 60%, transparent)"
        />
      </ReactFlow>
    </div>
  );
}
