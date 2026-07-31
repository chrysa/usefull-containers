// Graph layout utility — converts a CalculationNode tree to ReactFlow nodes/edges
// with automatic top-down DAG layout via dagre.
import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
import type { CalculationNode } from "@/domain/gamedata/calculator";

export const NODE_WIDTH = 210;
export const NODE_HEIGHT = 76;

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  quantity: number;
  recipeName: string | null;
  isRaw: boolean;
}

let _counter = 0;

function formatRate(n: number): string {
  const v = n % 1 === 0 ? String(n) : n.toFixed(2);
  return `${v}/min`;
}

// Build a parent → target edge carrying the item flow rate (items/min) as a
// mid-edge label (T-06 / SFM-13).
function pushEdge(edges: Edge[], parentId: string, targetId: string, rate: number): void {
  edges.push({
    id: `e-${parentId}-${targetId}`,
    source: parentId,
    target: targetId,
    animated: true,
    label: formatRate(rate),
    labelStyle: { fill: "var(--color-text-muted, #aaa)", fontSize: 11 },
    labelBgStyle: { fill: "var(--color-bg, #1a1a1a)", fillOpacity: 0.85 },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 3,
    style: { stroke: "var(--color-border, #555)" },
  });
}

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
      pushEdge(edges, parentId, existing, node.quantity);
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
    pushEdge(edges, parentId, id, node.quantity);
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
      return {
        ...n,
        position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      };
    }),
    edges,
  };
}

/**
 * BFS from nodeId following edge.source → edge.target direction.
 * Returns the set of IDs for the node and all its descendants.
 */
export function getDescendantIds(nodeId: string, edges: Edge[]): Set<string> {
  const result = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const e of edges) {
      if (e.source === id && !result.has(e.target)) {
        queue.push(e.target);
      }
    }
  }
  return result;
}
