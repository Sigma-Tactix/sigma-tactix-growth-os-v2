import type { SystemDependency, SystemElementNode, SystemElementType } from '@/src/data/livingSystemData';

export type MapsBrainView = 'rings' | 'circle' | 'areas' | 'links' | 'timeline' | 'orbit';
export type MapsBrainKind = 'root' | 'area' | 'memory' | 'skill' | 'routine' | 'run';
export type MapsBrainLayer = 'core' | 'memory' | 'skills' | 'routines' | 'apps' | 'runs';

export interface MapsBrainNode {
  id: string;
  kind: MapsBrainKind;
  layer: MapsBrainLayer;
  label: string;
  area: string;
  areaColor: string;
  sourceCategory: string | null;
  path: string | null;
  note: string | null;
  changedAt: string | null;
  status: string | null;
  degree: number;
}

export interface MapsBrainLink {
  id: string;
  source: string;
  target: string;
  label: string | null;
}

export interface MapsBrainGraph {
  source: 'configured_system_graph' | 'workspace_documents';
  nodes: MapsBrainNode[];
  links: MapsBrainLink[];
  coreNodeId: string;
}

const TYPE_MAPPING: Record<SystemElementType, Pick<MapsBrainNode, 'kind' | 'layer'>> = {
  CORE: { kind: 'root', layer: 'core' },
  VAULT: { kind: 'area', layer: 'memory' },
  FILE: { kind: 'memory', layer: 'memory' },
  AGENT: { kind: 'skill', layer: 'skills' },
  PIPELINE: { kind: 'routine', layer: 'apps' },
  AUDIT: { kind: 'run', layer: 'runs' },
};

const AREA_RULES = [
  { label: 'Executive', color: '#D5A13B', terms: ['executive'] },
  { label: 'Brand', color: '#D85A91', terms: ['brand', 'content'] },
  { label: 'Customer', color: '#8C77D8', terms: ['customer', 'hubspot', 'outreach', 'lead-gen'] },
  { label: 'Growth', color: '#5E82D9', terms: ['marketing', 'performance', 'meta-ads', 'google-ads', 'campaign'] },
  { label: 'Intelligence', color: '#47AD94', terms: ['authority', 'website', 'ga4', 'gsc', 'competitor', 'listening'] },
  { label: 'Operations', color: '#7782CF', terms: ['operations', 'technical', 'directus', 'ops'] },
  { label: 'Governance', color: '#91B94D', terms: ['credentials', 'guardrail', 'audit', 'diagnostic', 'roadmap', 'hitl', 'approval'] },
  { label: 'AI system', color: '#D8703B', terms: ['ai-workflow', 'pgvector', 'orchestrator', 'system-prompt', 'skills-catalog', 'heuristics'] },
] as const;

const LEGACY_ENDPOINT_ALIASES: Record<string, string> = {
  'sigma-orchestrator': 'agent-orchestrator',
  'content-agent': 'agent-content',
  'lead-gen-agent': 'agent-outreach',
  'perf-marketing-agent': 'agent-performance',
  'operations-agent': 'agent-ops',
};

function normalizedKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resolveArea(node: SystemElementNode) {
  const haystack = `${node.id} ${node.name} ${node.shortName} ${node.category}`.toLowerCase();
  return AREA_RULES.find(area => area.terms.some(term => haystack.includes(term))) || AREA_RULES[7];
}

function verifiedChangedAt(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

/**
 * Adapts the governed Living System registry to the read-only MAPS visual model.
 * Stale dependency aliases are resolved only when they map to a registered node.
 * Relative/demo timestamps are omitted so the timeline never presents them as proof.
 */
export function buildMapsBrainGraph(
  nodes: readonly SystemElementNode[],
  dependencies: readonly SystemDependency[],
): MapsBrainGraph {
  const uniqueNodes = new Map<string, SystemElementNode>();
  nodes.forEach(node => {
    if (node.id && !uniqueNodes.has(node.id)) uniqueNodes.set(node.id, node);
  });

  const endpointIndex = new Map<string, string>();
  uniqueNodes.forEach(node => {
    [node.id, node.name, node.shortName].filter(Boolean).forEach(value => endpointIndex.set(normalizedKey(value), node.id));
  });

  const resolveEndpoint = (value: string) => {
    if (uniqueNodes.has(value)) return value;
    const alias = LEGACY_ENDPOINT_ALIASES[value] || endpointIndex.get(normalizedKey(value));
    return alias && uniqueNodes.has(alias) ? alias : null;
  };

  const degreeById = new Map<string, number>();
  const links: MapsBrainLink[] = [];
  const seenLinks = new Set<string>();

  dependencies.forEach(dependency => {
    const source = resolveEndpoint(dependency.sourceId);
    const target = resolveEndpoint(dependency.targetId);
    if (!source || !target || source === target) return;
    const identity = `${source}:${target}:${dependency.type}`;
    if (seenLinks.has(identity)) return;
    seenLinks.add(identity);
    links.push({
      id: identity,
      source,
      target,
      label: dependency.label || null,
    });
    degreeById.set(source, (degreeById.get(source) || 0) + 1);
    degreeById.set(target, (degreeById.get(target) || 0) + 1);
  });

  const graphNodes = Array.from(uniqueNodes.values()).map(node => {
    const mapped = TYPE_MAPPING[node.type] || TYPE_MAPPING.AUDIT;
    const area = resolveArea(node);
    return {
      id: node.id,
      ...mapped,
      label: node.name || node.shortName || node.id,
      area: area.label,
      areaColor: area.color,
      sourceCategory: node.category || null,
      path: node.linkUrl || null,
      note: node.description || null,
      changedAt: verifiedChangedAt(node.lastUpdated),
      status: node.status || null,
      degree: degreeById.get(node.id) || 0,
    } satisfies MapsBrainNode;
  });

  const coreNode = graphNodes.find(node => node.kind === 'root') || graphNodes[0];
  return {
    source: 'configured_system_graph',
    nodes: graphNodes,
    links,
    coreNodeId: coreNode?.id || 'second-brain-core',
  };
}

export const MAPS_BRAIN_VIEWS: Array<{ id: MapsBrainView; label: string }> = [
  { id: 'rings', label: 'Rings' },
  { id: 'circle', label: 'Circle' },
  { id: 'areas', label: 'Areas' },
  { id: 'links', label: 'Links' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'orbit', label: '3D orbit' },
];
