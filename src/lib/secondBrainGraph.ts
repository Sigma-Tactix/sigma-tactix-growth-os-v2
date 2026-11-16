import type { SecondBrainVault } from '../data/secondBrainVaults';
import type { MapsBrainGraph, MapsBrainNode } from './mapsBrainOrbit';
import type { BrainEntity, BrainRelationship } from './brainGraph';

const COLORS = ['#D5A13B', '#E87979', '#D85A91', '#8C77D8', '#5E82D9', '#57B8C9', '#79B892', '#82ABA6', '#C181D5', '#D8703B', '#94A3B8'];

/** Metadata only. Document content and private storage paths stay outside the map. */
export function buildSecondBrainGraph(
  vaults: readonly SecondBrainVault[],
  knowledgeGraph?: { entities?: BrainEntity[]; relationships?: BrainRelationship[] },
): MapsBrainGraph {
  const coreNodeId = 'second-brain-core';
  const nodes: MapsBrainNode[] = [{
    id: coreNodeId, kind: 'root', layer: 'core', label: 'VANTA · Second Brain',
    area: 'Core', areaColor: '#FF6B2C', sourceCategory: null, path: null,
    note: 'Workspace document index. Agent execution requires approval.', changedAt: null,
    status: 'Configured', degree: vaults.length,
  }];
  const links: MapsBrainGraph['links'] = [];
  vaults.forEach((vault, index) => {
    const areaColor = COLORS[index % COLORS.length];
    nodes.push({
      id: vault.id, kind: 'area', layer: 'memory', label: vault.name, area: vault.name,
      areaColor, sourceCategory: vault.layer, path: '/vaults',
      note: `${vault.records.length} stored documents · ${vault.layer}`, changedAt: null,
      status: 'Configured category', degree: vault.records.length + 1,
    });
    links.push({ id: `core:${vault.id}`, source: coreNodeId, target: vault.id, label: 'Organizes' });
    vault.records.forEach(record => {
      const id = `document:${record.id}`;
      const timestamp = Date.parse(record.lastUpdated);
      nodes.push({
        id, kind: 'memory', layer: 'memory', label: record.title, area: vault.name, areaColor,
        sourceCategory: record.category, path: '/vaults', note: record.tags.join(' · '),
        changedAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
        status: record.vectorIndexed ? 'Indexed' : 'Stored; not indexed', degree: 1,
      });
      links.push({ id: `${vault.id}:${id}`, source: vault.id, target: id, label: 'Contains' });
    });
  });

  // Knowledge Graph entity nodes & relationship edges
  if (knowledgeGraph?.entities) {
    knowledgeGraph.entities.forEach(entity => {
      const entityNodeId = `entity:${entity.id}`;
      const vaultNodeId = `${entity.vaultId.replace(/_/g, '-')}-vault`;
      nodes.push({
        id: entityNodeId,
        kind: 'memory',
        layer: 'memory',
        label: entity.name,
        area: entity.entityType,
        areaColor: '#8C77D8',
        sourceCategory: entity.vaultId,
        path: '/vaults',
        note: `${entity.entityType} · ${entity.summary || 'Knowledge Entity'}`,
        changedAt: entity.updatedAt,
        status: 'Knowledge Entity',
        degree: 1,
      });
      links.push({
        id: `${vaultNodeId}:${entityNodeId}`,
        source: vaultNodeId,
        target: entityNodeId,
        label: 'Knowledge Node',
      });
    });
  }

  if (knowledgeGraph?.relationships) {
    knowledgeGraph.relationships.forEach(rel => {
      links.push({
        id: `rel:${rel.id}`,
        source: `entity:${rel.sourceId}`,
        target: `entity:${rel.targetId}`,
        label: rel.relationType,
      });
    });
  }

  return { source: 'workspace_documents', nodes, links, coreNodeId };
}
