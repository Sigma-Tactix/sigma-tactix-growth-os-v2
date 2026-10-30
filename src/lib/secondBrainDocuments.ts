import { EMPTY_SECOND_BRAIN_VAULTS, type SecondBrainVault, type VaultRecord } from '../data/secondBrainVaults.js';

export interface PersistedVaultDocument {
  id: string;
  vaultId: string;
  sourceModule: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  contentText: string | null;
  vectorIndexed: boolean;
  createdAt: string;
  storagePath?: string | null;
  uploadedFileId?: string | null;
}

const VAULT_ALIASES: Record<string, string> = {
  executive: 'executive',
  credentials: 'credentials',
  brand: 'brand',
  customer: 'customer',
  marketing: 'marketing',
  performance: 'marketing',
  website: 'website',
  authority: 'authority',
  operations: 'operations',
  ai_workflow: 'ai_workflow',
  audit: 'audit',
  competitor: 'audit',
  technical: 'technical',
  general: 'general',
};

function normalizedVaultKey(value: string): string {
  return value.trim().toLowerCase().replace(/-vault$/, '').replace(/-/g, '_');
}

/** Converts UI/legacy labels into the database vocabulary used for agent grants. */
export function canonicalDocumentVaultId(value: string): string {
  return VAULT_ALIASES[normalizedVaultKey(value)] || 'general';
}

/** Keeps legacy rows visible while new records use the canonical database IDs. */
export function uiVaultIdForDocument(value: string): string {
  const canonical = canonicalDocumentVaultId(value);
  if (canonical === 'general') return 'technical-vault';
  return `${canonical.replace(/_/g, '-')}-vault`;
}

function documentToVaultRecord(document: PersistedVaultDocument): VaultRecord {
  const vaultId = uiVaultIdForDocument(document.vaultId);
  const content = document.contentText || '[No extractable text is available for this stored file.]';
  return {
    id: document.id,
    vaultId,
    title: document.fileName,
    category: document.sourceModule.replace(/[_-]/g, ' ') || 'Stored document',
    summary: document.contentText
      ? document.contentText.replace(/\s+/g, ' ').slice(0, 220)
      : 'Stored file; extraction and semantic indexing are not available for this document.',
    content,
    classification: 'UNCLASSIFIED',
    // Classification must be assigned by the governance layer; do not infer it
    // from a file name just to make the UI look complete.
    allowedRoles: ['ADMIN'],
    vectorIndexed: document.vectorIndexed,
    embeddingDimensions: document.vectorIndexed ? 768 : undefined,
    lastUpdated: document.createdAt,
    author: document.sourceModule || 'Unknown source',
    tags: [document.mimeType || 'unknown MIME type', document.sourceModule || 'stored document'],
    meta: {
      storagePath: document.storagePath || null,
      uploadedFileId: document.uploadedFileId || null,
      sizeBytes: document.sizeBytes,
    },
  };
}

/** Builds a fresh, empty vault catalog and fills it only with server-owned rows. */
export function hydrateSecondBrainVaults(documents: PersistedVaultDocument[]): SecondBrainVault[] {
  const recordsByVault = new Map<string, VaultRecord[]>();
  for (const document of documents) {
    const record = documentToVaultRecord(document);
    const records = recordsByVault.get(record.vaultId) || [];
    records.push(record);
    recordsByVault.set(record.vaultId, records);
  }

  return EMPTY_SECOND_BRAIN_VAULTS.map((vault) => {
    const records = recordsByVault.get(vault.id) || [];
    return { ...vault, records, recordCount: records.length };
  });
}
