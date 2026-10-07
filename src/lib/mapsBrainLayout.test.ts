import { describe, expect, it } from 'vitest';
import { getLivingSystemGraph } from '@/src/data/livingSystemData';
import { buildMapsBrainGraph } from './mapsBrainOrbit';
import {
  buildMapsLayout,
  MAPS_FRAME,
  MAPS_LAYER_RADIUS,
  nodesForTimeline,
  timelineDays,
} from './mapsBrainLayout';

const source = getLivingSystemGraph();
const graph = buildMapsBrainGraph(source.nodes, source.dependencies);

describe('MAPS view layouts', () => {
  it('places ring nodes on the radius assigned to their layer', () => {
    const points = buildMapsLayout(graph, 'rings');
    for (const node of graph.nodes.filter(item => item.id !== graph.coreNodeId)) {
      const point = points.get(node.id)!;
      const radius = MAPS_LAYER_RADIUS[node.layer];
      const normalized = Math.sqrt(
        ((point.x - MAPS_FRAME.cx) / radius) ** 2
        + ((point.y - MAPS_FRAME.cy) / (radius * 0.76)) ** 2,
      );
      expect(normalized).toBeCloseTo(1, 5);
    }
  });

  it('places every non-core node on one circle circumference', () => {
    const points = buildMapsLayout(graph, 'circle');
    for (const node of graph.nodes.filter(item => item.id !== graph.coreNodeId)) {
      const point = points.get(node.id)!;
      const normalized = Math.sqrt(
        ((point.x - MAPS_FRAME.cx) / 292) ** 2
        + ((point.y - MAPS_FRAME.cy) / 256) ** 2,
      );
      expect(normalized).toBeCloseTo(1, 5);
    }
  });

  it('creates distinct compact centroids for area clusters', () => {
    const points = buildMapsLayout(graph, 'areas');
    const areaNodes = new Map<string, typeof graph.nodes>();
    graph.nodes.filter(node => node.id !== graph.coreNodeId).forEach(node => {
      areaNodes.set(node.area, [...(areaNodes.get(node.area) || []), node]);
    });
    const centroids = Array.from(areaNodes, ([area, nodes]) => ({
      area,
      x: nodes.reduce((sum, node) => sum + points.get(node.id)!.x, 0) / nodes.length,
      y: nodes.reduce((sum, node) => sum + points.get(node.id)!.y, 0) / nodes.length,
    }));

    expect(new Set(centroids.map(point => `${Math.round(point.x)}:${Math.round(point.y)}`)).size).toBe(centroids.length);
    for (const [area, nodes] of areaNodes) {
      const centroid = centroids.find(point => point.area === area)!;
      expect(Math.max(...nodes.map(node => Math.hypot(points.get(node.id)!.x - centroid.x, points.get(node.id)!.y - centroid.y)))).toBeLessThan(130);
    }
  });

  it('builds a finite deterministic force layout for the Links view', () => {
    const first = buildMapsLayout(graph, 'links');
    const second = buildMapsLayout(graph, 'links');

    expect(first.get(graph.coreNodeId)).toMatchObject({ x: MAPS_FRAME.cx, y: MAPS_FRAME.cy });
    for (const node of graph.nodes) {
      const point = first.get(node.id)!;
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      expect(second.get(node.id)?.x).toBeCloseTo(point.x, 8);
      expect(second.get(node.id)?.y).toBeCloseTo(point.y, 8);
    }
  });

  it('separates routine runs from files and keeps unknown dates explicit', () => {
    const points = buildMapsLayout(graph, 'timeline');
    const sections = nodesForTimeline(graph);

    expect(sections.runs.every(node => points.get(node.id)!.y < MAPS_FRAME.cy)).toBe(true);
    expect(sections.files.every(node => points.get(node.id)!.y > MAPS_FRAME.cy)).toBe(true);
    expect(timelineDays([...sections.runs, ...sections.files])).toEqual([]);
  });

  it('projects a bounded 2.5D sphere and changes it with rotation', () => {
    const first = buildMapsLayout(graph, 'orbit', 0);
    const rotated = buildMapsLayout(graph, 'orbit', 0.4);
    const nonCore = graph.nodes.find(node => node.id !== graph.coreNodeId)!;

    for (const node of graph.nodes) {
      const point = first.get(node.id)!;
      expect(point.z).toBeGreaterThanOrEqual(-1);
      expect(point.z).toBeLessThanOrEqual(1);
    }
    expect(rotated.get(nonCore.id)?.x).not.toBeCloseTo(first.get(nonCore.id)!.x, 3);
  });
});
