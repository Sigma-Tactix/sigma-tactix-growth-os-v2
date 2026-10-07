import { describe, expect, it } from 'vitest';
import { getLivingSystemGraph, type SystemDependency, type SystemElementNode } from '@/src/data/livingSystemData';
import { buildMapsBrainGraph } from './mapsBrainOrbit';

describe('MAPS Brain Orbit adapter', () => {
  it('creates stable, unique nodes and valid links from the governed system graph', () => {
    const { nodes, dependencies } = getLivingSystemGraph();
    const graph = buildMapsBrainGraph(nodes, dependencies);

    expect(graph.source).toBe('configured_system_graph');
    expect(graph.nodes.map(node => node.id)).toEqual(nodes.map(node => node.id));
    expect(new Set(graph.nodes.map(node => node.id)).size).toBe(graph.nodes.length);
    expect(graph.links.every(link => graph.nodes.some(node => node.id === link.source) && graph.nodes.some(node => node.id === link.target))).toBe(true);
    expect(graph.nodes.every(node => typeof node.areaColor === 'string' && node.areaColor.startsWith('#'))).toBe(true);
  });

  it('maps the Second Brain core to the permanent root node', () => {
    const { nodes, dependencies } = getLivingSystemGraph();
    const graph = buildMapsBrainGraph(nodes, dependencies);

    expect(graph.coreNodeId).toBe('second-brain-core');
    expect(graph.nodes.find(node => node.id === graph.coreNodeId)).toMatchObject({ kind: 'root', layer: 'core' });
  });

  it('drops dangling and duplicate links while preserving unknown metadata safely', () => {
    const nodes = [
      { id: 'core', type: 'CORE', name: '', shortName: '', category: '', description: '', status: 'OPTIMAL', color: '' },
      { id: 'unknown', type: 'AUDIT', name: '', shortName: '', category: '', description: '', status: 'ACTIVE', color: '' },
    ] as SystemElementNode[];
    const dependencies = [
      { sourceId: 'core', targetId: 'unknown', type: 'GOVERNS', label: '', strength: 1 },
      { sourceId: 'core', targetId: 'unknown', type: 'GOVERNS', label: '', strength: 1 },
      { sourceId: 'core', targetId: 'missing', type: 'GOVERNS', label: '', strength: 1 },
    ] as SystemDependency[];
    const graph = buildMapsBrainGraph(nodes, dependencies);

    expect(graph.links).toHaveLength(1);
    expect(graph.nodes.find(node => node.id === 'unknown')).toMatchObject({
      label: 'unknown',
      area: 'AI system',
      note: null,
      path: null,
      changedAt: null,
      areaColor: '#D8703B',
    });
  });

  it('resolves registered names and legacy endpoint aliases without inventing nodes', () => {
    const nodes = [
      { id: 'second-brain-core', type: 'CORE', name: 'Second Brain', shortName: 'Core' },
      { id: 'executive-vault', type: 'VAULT', name: 'Executive Vault', shortName: 'Executive' },
      { id: 'agent-orchestrator', type: 'AGENT', name: 'Sigma Orchestrator', shortName: 'Orchestrator' },
    ] as SystemElementNode[];
    const dependencies = [
      { sourceId: 'Executive Vault', targetId: 'sigma-orchestrator', type: 'GOVERNS', label: 'routes' },
    ] as SystemDependency[];

    const graph = buildMapsBrainGraph(nodes, dependencies);
    expect(graph.links).toEqual([
      expect.objectContaining({ source: 'executive-vault', target: 'agent-orchestrator' }),
    ]);
    expect(graph.nodes).toHaveLength(3);
  });

  it('accepts only parseable ISO-like timestamps as timeline evidence', () => {
    const nodes = [
      { id: 'core', type: 'CORE', name: 'Core', lastUpdated: 'Live Active' },
      { id: 'dated', type: 'FILE', name: 'Dated', lastUpdated: '2026-10-05T09:15:00Z' },
      { id: 'relative', type: 'FILE', name: 'Relative', lastUpdated: '12m ago' },
    ] as SystemElementNode[];
    const graph = buildMapsBrainGraph(nodes, []);

    expect(graph.nodes.find(node => node.id === 'dated')?.changedAt).toBe('2026-10-05T09:15:00.000Z');
    expect(graph.nodes.find(node => node.id === 'relative')?.changedAt).toBeNull();
  });
});
