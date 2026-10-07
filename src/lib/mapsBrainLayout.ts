import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3';
import type { MapsBrainGraph, MapsBrainLayer, MapsBrainNode, MapsBrainView } from './mapsBrainOrbit';

export const MAPS_FRAME = { width: 1000, height: 640, cx: 500, cy: 365 } as const;
export const MAPS_LAYER_ORDER: MapsBrainLayer[] = ['memory', 'skills', 'routines', 'apps', 'runs'];

export interface MapsLayoutPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
}

interface ForceNode extends SimulationNodeDatum {
  id: string;
  degree: number;
  area: string;
}

interface ForceEdge extends SimulationLinkDatum<ForceNode> {
  source: string | ForceNode;
  target: string | ForceNode;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const MAPS_LAYER_RADIUS: Record<MapsBrainLayer, number> = {
  core: 0,
  memory: 116,
  skills: 176,
  routines: 232,
  apps: 282,
  runs: 326,
};

function stableUnit(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return (hash % 10_000) / 10_000;
}

function orderedNodes(graph: MapsBrainGraph) {
  return [...graph.nodes].sort((a, b) => {
    if (a.id === graph.coreNodeId) return -1;
    if (b.id === graph.coreNodeId) return 1;
    const layerDelta = MAPS_LAYER_ORDER.indexOf(a.layer) - MAPS_LAYER_ORDER.indexOf(b.layer);
    if (layerDelta !== 0) return layerDelta;
    const areaDelta = a.area.localeCompare(b.area);
    return areaDelta || a.label.localeCompare(b.label);
  });
}

function areaAnchors(graph: MapsBrainGraph) {
  const areas = Array.from(new Set(graph.nodes.filter(node => node.id !== graph.coreNodeId).map(node => node.area))).sort();
  return new Map(areas.map((area, index) => {
    const angle = (index / Math.max(1, areas.length)) * Math.PI * 2 - Math.PI / 2;
    return [area, {
      x: MAPS_FRAME.cx + Math.cos(angle) * 245,
      y: MAPS_FRAME.cy + Math.sin(angle) * 180,
      angle,
    }];
  }));
}

function ringsLayout(graph: MapsBrainGraph) {
  const points = new Map<string, MapsLayoutPoint>([[graph.coreNodeId, { x: MAPS_FRAME.cx, y: MAPS_FRAME.cy, z: 1, scale: 1 }]]);
  MAPS_LAYER_ORDER.forEach(layer => {
    const nodes = orderedNodes(graph).filter(node => node.id !== graph.coreNodeId && node.layer === layer);
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
      const radius = MAPS_LAYER_RADIUS[layer];
      points.set(node.id, {
        x: MAPS_FRAME.cx + Math.cos(angle) * radius,
        y: MAPS_FRAME.cy + Math.sin(angle) * radius * 0.76,
        z: 0,
        scale: 1,
      });
    });
  });
  return points;
}

function circleLayout(graph: MapsBrainGraph) {
  const points = new Map<string, MapsLayoutPoint>([[graph.coreNodeId, { x: MAPS_FRAME.cx, y: MAPS_FRAME.cy, z: 1, scale: 1 }]]);
  const nodes = orderedNodes(graph).filter(node => node.id !== graph.coreNodeId);
  nodes.forEach((node, index) => {
    const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
    points.set(node.id, {
      x: MAPS_FRAME.cx + Math.cos(angle) * 292,
      y: MAPS_FRAME.cy + Math.sin(angle) * 256,
      z: 0,
      scale: 1,
    });
  });
  return points;
}

function areasLayout(graph: MapsBrainGraph) {
  const points = new Map<string, MapsLayoutPoint>([[graph.coreNodeId, { x: MAPS_FRAME.cx, y: MAPS_FRAME.cy, z: 1, scale: 1 }]]);
  const anchors = areaAnchors(graph);
  anchors.forEach((anchor, area) => {
    const nodes = orderedNodes(graph).filter(node => node.id !== graph.coreNodeId && node.area === area);
    nodes.forEach((node, index) => {
      const angle = index * GOLDEN_ANGLE + stableUnit(node.id) * 0.45;
      const radius = index === 0 ? 0 : 16 + Math.sqrt(index) * 18;
      points.set(node.id, {
        x: anchor.x + Math.cos(angle) * radius,
        y: anchor.y + Math.sin(angle) * radius,
        z: 0,
        scale: 1,
      });
    });
  });
  return points;
}

function linksLayout(graph: MapsBrainGraph) {
  const anchors = areaAnchors(graph);
  const nodes: ForceNode[] = orderedNodes(graph).map(node => {
    if (node.id === graph.coreNodeId) {
      return { id: node.id, degree: node.degree, area: node.area, x: MAPS_FRAME.cx, y: MAPS_FRAME.cy, fx: MAPS_FRAME.cx, fy: MAPS_FRAME.cy };
    }
    const anchor = anchors.get(node.area) || { x: MAPS_FRAME.cx, y: MAPS_FRAME.cy };
    const angle = stableUnit(`${node.id}:angle`) * Math.PI * 2;
    const radius = 20 + stableUnit(`${node.id}:radius`) * 62;
    return {
      id: node.id,
      degree: node.degree,
      area: node.area,
      x: anchor.x + Math.cos(angle) * radius,
      y: anchor.y + Math.sin(angle) * radius,
    };
  });
  const links: ForceEdge[] = graph.links.map(link => ({ source: link.source, target: link.target }));

  const simulation = forceSimulation<ForceNode>(nodes)
    .force('link', forceLink<ForceNode, ForceEdge>(links).id(node => node.id).distance(link => {
      const source = typeof link.source === 'string' ? link.source : link.source.id;
      const target = typeof link.target === 'string' ? link.target : link.target.id;
      return source === graph.coreNodeId || target === graph.coreNodeId ? 72 : 54;
    }).strength(0.55))
    .force('charge', forceManyBody<ForceNode>().strength(node => -74 - node.degree * 7))
    .force('collide', forceCollide<ForceNode>().radius(node => 9 + Math.min(10, node.degree * 0.9)).iterations(2))
    .force('center', forceCenter(MAPS_FRAME.cx, MAPS_FRAME.cy))
    .force('x', forceX<ForceNode>(node => anchors.get(node.area)?.x || MAPS_FRAME.cx).strength(0.045))
    .force('y', forceY<ForceNode>(node => anchors.get(node.area)?.y || MAPS_FRAME.cy).strength(0.045))
    .stop();

  for (let tick = 0; tick < 260; tick += 1) simulation.tick();
  simulation.stop();

  return new Map(nodes.map(node => [node.id, {
    x: node.id === graph.coreNodeId
      ? MAPS_FRAME.cx
      : Math.max(92, Math.min(908, MAPS_FRAME.cx + ((node.x ?? MAPS_FRAME.cx) - MAPS_FRAME.cx) * 1.55)),
    y: node.id === graph.coreNodeId
      ? MAPS_FRAME.cy
      : Math.max(155, Math.min(590, MAPS_FRAME.cy + ((node.y ?? MAPS_FRAME.cy) - MAPS_FRAME.cy) * 1.35)),
    z: 0,
    scale: 1,
  }]));
}

function timelineLayout(graph: MapsBrainGraph) {
  const points = new Map<string, MapsLayoutPoint>([[graph.coreNodeId, { x: MAPS_FRAME.cx, y: MAPS_FRAME.cy, z: 1, scale: 1 }]]);
  const nodes = orderedNodes(graph).filter(node => node.id !== graph.coreNodeId);
  const runNodes = nodes.filter(node => node.kind === 'routine' || node.kind === 'run');
  const fileNodes = nodes.filter(node => node.kind !== 'routine' && node.kind !== 'run');

  const positionSection = (sectionNodes: MapsBrainNode[], datedY: number, unknownY: number) => {
    const days = timelineDays(sectionNodes);
    const dayIndex = new Map(days.map((day, index) => [day, index]));
    const datedCounts = new Map<string, number>();
    let unknownIndex = 0;

    sectionNodes.forEach(node => {
      if (node.changedAt) {
        const day = node.changedAt.slice(0, 10);
        const stack = datedCounts.get(day) || 0;
        datedCounts.set(day, stack + 1);
        points.set(node.id, {
          x: 250 + ((dayIndex.get(day) || 0) / Math.max(1, days.length - 1)) * 650,
          y: datedY + stack * 20,
          z: 0,
          scale: 1,
        });
        return;
      }
      points.set(node.id, {
        x: 250 + (unknownIndex % 15) * 42,
        y: unknownY + Math.floor(unknownIndex / 15) * 21,
        z: 0,
        scale: 1,
      });
      unknownIndex += 1;
    });
  };

  positionSection(runNodes, 210, 282);
  positionSection(fileNodes, 430, 505);
  return points;
}

function orbitLayout(graph: MapsBrainGraph, rotation: number) {
  const points = new Map<string, MapsLayoutPoint>([[graph.coreNodeId, { x: MAPS_FRAME.cx, y: MAPS_FRAME.cy, z: 1, scale: 1 }]]);
  const nodes = orderedNodes(graph).filter(node => node.id !== graph.coreNodeId);
  nodes.forEach((node, index) => {
    const latitude = 1 - ((index + 0.5) / Math.max(1, nodes.length)) * 2;
    const sphereRadius = Math.sqrt(Math.max(0, 1 - latitude * latitude));
    const longitude = index * GOLDEN_ANGLE + rotation;
    const rawX = Math.cos(longitude) * sphereRadius;
    const depth = Math.sin(longitude) * sphereRadius;
    const perspective = 0.78 + ((depth + 1) / 2) * 0.32;
    points.set(node.id, {
      x: MAPS_FRAME.cx + rawX * 246 * perspective,
      y: MAPS_FRAME.cy + latitude * 226 - depth * 18,
      z: depth,
      scale: perspective,
    });
  });
  return points;
}

export function buildMapsLayout(graph: MapsBrainGraph, view: MapsBrainView, rotation = 0) {
  if (view === 'circle') return circleLayout(graph);
  if (view === 'areas') return areasLayout(graph);
  if (view === 'links') return linksLayout(graph);
  if (view === 'timeline') return timelineLayout(graph);
  if (view === 'orbit') return orbitLayout(graph, rotation);
  return ringsLayout(graph);
}

export function nodesForTimeline(graph: MapsBrainGraph) {
  const nodes = graph.nodes.filter(node => node.id !== graph.coreNodeId);
  return {
    runs: nodes.filter(node => node.kind === 'routine' || node.kind === 'run'),
    files: nodes.filter(node => node.kind !== 'routine' && node.kind !== 'run'),
  };
}

export function timelineDays(nodes: readonly MapsBrainNode[]) {
  return Array.from(new Set(nodes.flatMap(node => node.changedAt ? [node.changedAt.slice(0, 10)] : []))).sort();
}

export function areaSummary(graph: MapsBrainGraph) {
  return Array.from(new Set(graph.nodes.filter(node => node.id !== graph.coreNodeId).map(node => node.area))).sort().map(area => {
    const nodes = graph.nodes.filter(node => node.id !== graph.coreNodeId && node.area === area);
    return { area, color: nodes[0]?.areaColor || '#A1A1AA', count: nodes.length };
  });
}
