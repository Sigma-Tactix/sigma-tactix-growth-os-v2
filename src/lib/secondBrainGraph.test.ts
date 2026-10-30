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
});
