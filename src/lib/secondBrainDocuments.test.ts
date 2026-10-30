import { describe, expect, it } from 'vitest';
import {
  canonicalDocumentVaultId,
  hydrateSecondBrainVaults,
  uiVaultIdForDocument,
  type PersistedVaultDocument,
} from './secondBrainDocuments.js';

describe('Second Brain persisted document mapping', () => {
  it('normalizes UI vault identifiers to the canonical database vocabulary', () => {
    expect(canonicalDocumentVaultId('brand-vault')).toBe('brand');
    expect(canonicalDocumentVaultId('ai-workflow-vault')).toBe('ai_workflow');
    expect(canonicalDocumentVaultId('performance')).toBe('marketing');
    expect(canonicalDocumentVaultId('unknown')).toBe('general');
  });

  it('maps canonical and legacy document vault identifiers back to a visible vault', () => {
    expect(uiVaultIdForDocument('brand')).toBe('brand-vault');
    expect(uiVaultIdForDocument('brand-vault')).toBe('brand-vault');
    expect(uiVaultIdForDocument('ai_workflow')).toBe('ai-workflow-vault');
    expect(uiVaultIdForDocument('general')).toBe('technical-vault');
  });

  it('hydrates only persisted documents and preserves truthful vector state', () => {
    const documents: PersistedVaultDocument[] = [
      {
        id: 'doc-1',
        vaultId: 'brand',
        sourceModule: 'brain_upload',
        fileName: 'brand.md',
        mimeType: 'text/markdown',
        sizeBytes: 120,
        contentText: '# Brand',
        vectorIndexed: true,
        createdAt: '2026-10-08T10:00:00.000Z',
      },
      {
        id: 'doc-2',
        vaultId: 'operations-vault',
        sourceModule: 'brain_upload',
        fileName: 'runbook.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 500,
        contentText: null,
        vectorIndexed: false,
        createdAt: '2026-10-08T11:00:00.000Z',
      },
    ];

    const vaults = hydrateSecondBrainVaults(documents);
    const brand = vaults.find((vault) => vault.id === 'brand-vault');
    const operations = vaults.find((vault) => vault.id === 'operations-vault');

    expect(vaults).toHaveLength(11);
    expect(brand?.records).toHaveLength(1);
    expect(brand?.records[0]).toMatchObject({
      id: 'doc-1',
      vectorIndexed: true,
      embeddingDimensions: 768,
      title: 'brand.md',
    });
    expect(operations?.records[0]).toMatchObject({
      id: 'doc-2',
      vectorIndexed: false,
      embeddingDimensions: undefined,
    });
  });
});
