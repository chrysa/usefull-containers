// Graph layout utility — converts a CalculationNode tree to ReactFlow nodes/edges
// with automatic top-down DAG layout via dagre.
import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
import type { CalculationNode } from "../../domain/gamedata/calculator";

export const NODE_WIDTH = 210;
export const NODE_HEIGHT = 76;

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  quantity: number;
  recipeName: string | null;
  isRaw: boolean;
}

let _counter = 0;

function walkTree(
  node: CalculationNode,
  parentId: string | null,
  nodes: Node<GraphNodeData>[],
  edges: Edge[],
  visited: Map<string, string>,
): string {
  const existing = visited.get(node.item_id);
  if (existing !== undefined) {
    if (parentId !== null) {
      edges.push({
        id: `e-${parentId}-${existing}`,
        source: parentId,
        target: existing,
        animated: true,
        style: { stroke: "var(--color-border, #555)" },
      });
    }
    return existing;
  }

  const id = `n-${_counter++}`;
  visited.set(node.item_id, id);

  const isRaw = node.children.length === 0 && node.recipe_id === null;
  nodes.push({
    id,
    type: "productionNode",
    position: { x: 0, y: 0 },
    data: {
      label: node.item_name,
      quantity: node.quantity,
      recipeName: node.recipe_name,
      isRaw,
    },
  });

  if (parentId !== null) {
    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      animated: true,
      style: { stroke: "var(--color-border, #555)" },
    });
  }

  for (const child of node.children) {
    walkTree(child, id, nodes, edges, visited);
  }

  return id;
}

export function buildGraph(tree: CalculationNode): {
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
} {
  _counter = 0;
  const nodes: Node<GraphNodeData>[] = [];
  const edges: Edge[] = [];
  walkTree(tree, null, nodes, edges, new Map());

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 64 });

  for (const n of nodes) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const e of edges) {
    g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  return {
    nodes: nodes.map((n) => {
      const { x, y } = g.node(n.id);
      return { ...n, position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 } };
    }),
    edges,
  };
}
