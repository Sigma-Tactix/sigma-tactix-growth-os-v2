import { describe, expect, it } from 'vitest';
import { buildSecondBrainGraph } from './secondBrainGraph';
import { hydrateSecondBrainVaults } from './secondBrainDocuments';

describe('persisted Second Brain graph', () => {
  it('keeps empty categories and never invents documents', () => {
    const graph = buildSecondBrainGraph(hydrateSecondBrainVaults([]));
    expect(graph.nodes.filter(node => node.kind === 'memory')).toHaveLength(0);
    expect(graph.nodes.filter(node => node.kind === 'area')).toHaveLength(11);
  });
  it('links stored documents to their canonical vault without exposing content or storage paths', () => {
    const graph = buildSecondBrainGraph(hydrateSecondBrainVaults([{
      id: 'one', vaultId: 'marketing', sourceModule: 'upload', fileName: 'Campaign.pdf',
      mimeType: 'application/pdf', sizeBytes: 12, contentText: 'private text',
      storagePath: 'private/path', vectorIndexed: false, createdAt: '2026-10-28T00:00:00Z',
    }]));
    expect(graph.source).toBe('workspace_documents');
    expect(graph.nodes.find(node => node.id === 'document:one')).toMatchObject({
      kind: 'memory', area: 'Marketing Vault', path: '/vaults', changedAt: '2026-10-28T00:00:00.000Z',
    });
    expect(graph.links).toContainEqual(expect.objectContaining({ source: 'marketing-vault', target: 'document:one' }));
    expect(JSON.stringify(graph)).not.toContain('private');
  });

  it('incorporates knowledge graph entities and directional relationship links', () => {
    const graph = buildSecondBrainGraph(hydrateSecondBrainVaults([]), {
      entities: [
        {
          id: 'ent-1',
          workspaceId: 'ws-1',
          vaultId: 'brand',
          name: 'Core Positioning Slogan',
          entityType: 'Concept',
          summary: 'The Sovereign Growth Engine',
          attributes: {},
          createdAt: '2026-11-16T00:00:00Z',
          updatedAt: '2026-11-16T00:00:00Z',
        },
        {
          id: 'ent-2',
          workspaceId: 'ws-1',
          vaultId: 'marketing',
          name: 'High-Converting LinkedIn Hook',
          entityType: 'Hook',
          summary: 'Tired of slow agency onboarding?',
          attributes: {},
          createdAt: '2026-11-16T00:00:00Z',
          updatedAt: '2026-11-16T00:00:00Z',
        },
      ],
      relationships: [
        {
          id: 'rel-1',
          workspaceId: 'ws-1',
          sourceId: 'ent-2',
          targetId: 'ent-1',
          relationType: 'DERIVED_FROM',
          weight: 1.0,
          createdAt: '2026-11-16T00:00:00Z',
        },
      ],
    });

    expect(graph.nodes.find((n) => n.id === 'entity:ent-1')).toMatchObject({
      label: 'Core Positioning Slogan',
      area: 'Concept',
      status: 'Knowledge Entity',
    });
    expect(graph.nodes.find((n) => n.id === 'entity:ent-2')).toMatchObject({
      label: 'High-Converting LinkedIn Hook',
      area: 'Hook',
      status: 'Knowledge Entity',
    });
    expect(graph.links).toContainEqual(
      expect.objectContaining({
        source: 'entity:ent-2',
        target: 'entity:ent-1',
        label: 'DERIVED_FROM',
      }),
    );
  });
});
