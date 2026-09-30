export interface SimpleEdge {
  source: string;
  target: string;
}

function buildAdjacency(edges: SimpleEdge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  for (const { source, target } of edges) {
    if (!adjacency.has(source)) adjacency.set(source, new Set());
    if (!adjacency.has(target)) adjacency.set(target, new Set());
    adjacency.get(source)!.add(target);
    adjacency.get(target)!.add(source);
  }
  return adjacency;
}

export function degreeCentrality(
  nodeIds: string[],
  edges: SimpleEdge[],
): Map<string, number> {
  const degree = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  for (const { source, target } of edges) {
    degree.set(source, (degree.get(source) ?? 0) + 1);
    degree.set(target, (degree.get(target) ?? 0) + 1);
  }
  return degree;
}

export function connectedComponents(
  nodeIds: string[],
  edges: SimpleEdge[],
): string[][] {
  const adjacency = buildAdjacency(edges);
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const start of nodeIds) {
    if (visited.has(start)) continue;
    const stack = [start];
    const component: string[] = [];
    visited.add(start);
    while (stack.length) {
      const node = stack.pop()!;
      component.push(node);
      for (const neighbor of adjacency.get(node) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Detects simple directed cycles using DFS with a recursion stack.
 * Bounded to avoid pathological blowups on dense graphs.
 */
export function detectCycles(
  edges: SimpleEdge[],
  maxCycles = 25,
  maxDepth = 8,
): string[][] {
  const directedAdjacency = new Map<string, string[]>();
  for (const { source, target } of edges) {
    if (!directedAdjacency.has(source)) directedAdjacency.set(source, []);
    directedAdjacency.get(source)!.push(target);
  }

  const cycles: string[][] = [];
  const cycleKeys = new Set<string>();

  function normalizeCycleKey(path: string[]): string {
    const minIndex = path.indexOf(
      [...path].sort((a, b) => a.localeCompare(b))[0],
    );
    const rotated = [...path.slice(minIndex), ...path.slice(0, minIndex)];
    return rotated.join(">");
  }

  function dfs(start: string, node: string, path: string[], visited: Set<string>) {
    if (cycles.length >= maxCycles) return;
    if (path.length > maxDepth) return;
    for (const neighbor of directedAdjacency.get(node) ?? []) {
      if (neighbor === start && path.length >= 2) {
        const key = normalizeCycleKey(path);
        if (!cycleKeys.has(key)) {
          cycleKeys.add(key);
          cycles.push([...path]);
        }
      } else if (!visited.has(neighbor)) {
        visited.add(neighbor);
        path.push(neighbor);
        dfs(start, neighbor, path, visited);
        path.pop();
        visited.delete(neighbor);
      }
      if (cycles.length >= maxCycles) return;
    }
  }

  for (const start of directedAdjacency.keys()) {
    if (cycles.length >= maxCycles) break;
    dfs(start, start, [start], new Set([start]));
  }

  return cycles;
}

export function shortestPath(
  from: string,
  to: string,
  edges: SimpleEdge[],
): { found: boolean; path: string[]; length: number } {
  if (from === to) return { found: true, path: [from], length: 0 };
  const adjacency = buildAdjacency(edges);
  const queue: string[] = [from];
  const visited = new Set<string>([from]);
  const parent = new Map<string, string>();

  while (queue.length) {
    const node = queue.shift()!;
    for (const neighbor of adjacency.get(node) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      parent.set(neighbor, node);
      if (neighbor === to) {
        const path = [to];
        let cur = to;
        while (parent.has(cur)) {
          cur = parent.get(cur)!;
          path.unshift(cur);
        }
        return { found: true, path, length: path.length - 1 };
      }
      queue.push(neighbor);
    }
  }
  return { found: false, path: [], length: 0 };
}
