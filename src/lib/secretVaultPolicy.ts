// Zero-trust Secret Vault policy enforcement (S10-A2 / Finding C-06).
// Ensures Executive and Credentials vaults are strictly excluded across:
// 1. Semantic RAG search
// 2. Keyword document search
// 3. Attachment / local context ingestion
// 4. Approved memory injection
// 5. Agent and VANTA tool execution

export const SECRET_VAULT_IDS = [
  'credentials',
  'credentials-vault',
  'executive',
  'executive-vault',
  'secrets',
  'secret',
] as const;

export type SecretVaultId = (typeof SECRET_VAULT_IDS)[number];

export const SECRET_VAULT_NAMES = [
  'Executive Vault',
  'Credentials Vault',
] as const;

export const SAFE_DOCUMENT_VAULT_IDS = [
  'brand',
  'customer',
  'marketing',
  'performance',
  'website',
  'authority',
  'operations',
  'audit',
  'competitor',
  'ai_workflow',
  'general',
] as const;

const SECRET_FILE_PATTERNS = [
  /\.env(\..+)?$/i,
  /credentials/i,
  /executive[-_]brief/i,
  /api[-_]?keys?/i,
  /private[-_]?key/i,
  /token[-_]?secret/i,
];

/**
 * Checks if a vault identifier represents a Secret Vault (Executive, Credentials, Secrets).
 */
export function isSecretVaultId(vaultId: string | null | undefined): boolean {
  if (!vaultId) return false;
  const normalized = vaultId.trim().toLowerCase();
  return SECRET_VAULT_IDS.some(
    secret => normalized === secret ||
      normalized.includes('credential') ||
      normalized.includes('executive') ||
      normalized.includes('secret'),
  );
}

/**
 * Checks if a human-facing vault name represents a Secret Vault.
 */
export function isSecretVaultName(vaultName: string | null | undefined): boolean {
  if (!vaultName) return false;
  const normalized = vaultName.trim().toLowerCase();
  return normalized.includes('executive') || normalized.includes('credential') || normalized.includes('secret');
}

/**
 * Filters out all Secret Vault identifiers from a list of vault IDs.
 */
export function filterSafeVaultIds(vaultIds: string[]): string[] {
  return vaultIds.filter(id => !isSecretVaultId(id));
}

/**
 * Throws an explicit error if a target vault ID is a Secret Vault.
 */
export function assertNonSecretVault(
  vaultId: string | null | undefined,
  contextMessage = 'Secret Vaults (Executive, Credentials) are strictly excluded from agent and retrieval scope.',
): void {
  if (isSecretVaultId(vaultId)) {
    throw new Error(`Access Denied: ${contextMessage}`);
  }
}

/**
 * Sanitizes document matches by discarding any match originating from a Secret Vault.
 */
export function sanitizeDocumentMatches<T extends { vaultId: string }>(matches: T[]): T[] {
  return matches.filter(match => !isSecretVaultId(match.vaultId));
}

/**
 * Sanitizes stored database document rows by discarding any row belonging to a Secret Vault.
 */
export function sanitizeStoredDocuments<T extends { vault_id: string }>(rows: T[]): T[] {
  return rows.filter(row => !isSecretVaultId(row.vault_id));
}

/**
 * Sanitizes local context attachments, rejecting any secret-tagged or credential file attachments.
 */
export function sanitizeLocalContexts<T extends { vaultId?: string; isSecret?: boolean; name?: string; text?: string }>(
  contexts: T[],
): T[] {
  return contexts.filter(context => {
    if (context.isSecret) return false;
    if (isSecretVaultId(context.vaultId)) return false;
    if (context.name && SECRET_FILE_PATTERNS.some(p => p.test(context.name!))) return false;
    return true;
  });
}

/**
 * Sanitizes memory records by discarding any memory associated with a Secret Vault or marked secret.
 */
export function sanitizeMemories<T extends { vault_id?: string; content?: string }>(memories: T[]): T[] {
  return memories.filter(memory => {
    if (isSecretVaultId(memory.vault_id)) return false;
    if (memory.content && /\[SECRET[-_]VAULT\]/i.test(memory.content)) return false;
    return true;
  });
}
