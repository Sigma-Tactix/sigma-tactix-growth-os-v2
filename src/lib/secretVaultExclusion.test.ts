import { describe, it, expect, vi } from 'vitest';

const { embedContent } = vi.hoisted(() => ({
  embedContent: vi.fn().mockResolvedValue({
    embeddings: [{ values: Array(768).fill(0.1) }],
  }),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { embedContent };
    constructor(_options: unknown) {}
  },
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
    INTEGER: 'INTEGER',
  },
}));
import {
  isSecretVaultId,
  isSecretVaultName,
  filterSafeVaultIds,
  assertNonSecretVault,
  sanitizeDocumentMatches,
  sanitizeStoredDocuments,
  sanitizeLocalContexts,
  sanitizeMemories,
  SECRET_VAULT_IDS,
} from './secretVaultPolicy.js';
import { rankStoredDocuments, mergeVantaDocumentMatches } from './vantaRetrieval.js';
import { searchDocuments } from './rag.js';
import { executeAgentToolCall } from './agentTools.js';
import { executeVantaTool } from './vantaToolGateway.js';

describe('Zero-trust Secret Vault Exclusion across all 5 paths (S10-A2 / C-06)', () => {
  it('correctly classifies Secret Vault IDs and human names', () => {
    for (const id of SECRET_VAULT_IDS) {
      expect(isSecretVaultId(id)).toBe(true);
    }
    expect(isSecretVaultId('credentials')).toBe(true);
    expect(isSecretVaultId('credentials-vault')).toBe(true);
    expect(isSecretVaultId('executive')).toBe(true);
    expect(isSecretVaultId('executive-vault')).toBe(true);
    expect(isSecretVaultId('secrets')).toBe(true);

    // Non-secret vaults must be false
    expect(isSecretVaultId('brand')).toBe(false);
    expect(isSecretVaultId('marketing')).toBe(false);
    expect(isSecretVaultId('customer')).toBe(false);
    expect(isSecretVaultId('website')).toBe(false);

    // Human names
    expect(isSecretVaultName('Executive Vault')).toBe(true);
    expect(isSecretVaultName('Credentials Vault')).toBe(true);
    expect(isSecretVaultName('Brand Vault')).toBe(false);

    expect(filterSafeVaultIds(['brand', 'credentials', 'marketing', 'executive', 'operations'])).toEqual([
      'brand',
      'marketing',
      'operations',
    ]);

    expect(() => assertNonSecretVault('executive-vault')).toThrow(/Access Denied/i);
    expect(() => assertNonSecretVault('brand')).not.toThrow();
  });

  // Path 1: Semantic search path
  it('Path 1: semantic search excludes Secret Vaults even if requested explicitly or returned by RPC', async () => {
    const mockSb = {
      rpc: vi.fn().mockImplementation((rpcName: string, args: any) => {
        // If an attacker requests credentials, match_documents_scoped should not receive it
        if (args.p_vault_ids && args.p_vault_ids.some((id: string) => isSecretVaultId(id))) {
          throw new Error('RPC received forbidden secret vault ID');
        }
        return Promise.resolve({
          data: [
            {
              id: 'doc-brand-1',
              file_name: 'brand_guidelines.md',
              vault_id: 'brand',
              source_module: 'brand',
              content_text: 'Brand voice is clear and direct.',
              similarity: 0.92,
            },
            // Simulated malicious or misconfigured RPC leak of secret row
            {
              id: 'doc-secret-1',
              file_name: 'c_level_compensation.md',
              vault_id: 'executive',
              source_module: 'executive',
              content_text: 'Confidential executive payroll and targets.',
              similarity: 0.99,
            },
          ],
          error: null,
        });
      }),
    };

    // Explicit request for secret vault must be rejected before RPC
    const secretSearch = await searchDocuments(mockSb as any, 'ws-123', 'compensation', {
      apiKey: 'test-key',
      vaultId: 'executive',
      excludeSecretVaults: true,
    });
    expect(secretSearch).toEqual([]);

    // Broad search across workspace must filter out leaked secret rows
    const broadSearch = await searchDocuments(mockSb as any, 'ws-123', 'guidelines', {
      apiKey: 'test-key',
      excludeSecretVaults: true,
    });
    expect(broadSearch.length).toBe(1);
    expect(broadSearch[0].id).toBe('doc-brand-1');
    expect(broadSearch.some(m => m.vaultId === 'executive')).toBe(false);
  });

  // Path 2: Keyword search path
  it('Path 2: keyword search and rankStoredDocuments drops Secret Vault documents', () => {
    const sampleRows = [
      {
        id: '1',
        file_name: 'q3_growth_strategy.pdf',
        vault_id: 'marketing',
        source_module: 'marketing',
        content_text: 'Target 20% growth in qualified pipeline',
      },
      {
        id: '2',
        file_name: 'aws_root_credentials.txt',
        vault_id: 'credentials-vault',
        source_module: 'settings',
        content_text: 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
      },
      {
        id: '3',
        file_name: 'board_shareholder_minutes.docx',
        vault_id: 'executive',
        source_module: 'executive',
        content_text: 'Confidential board minutes regarding valuation',
      },
    ];

    const sanitized = sanitizeStoredDocuments(sampleRows);
    expect(sanitized.length).toBe(1);
    expect(sanitized[0].id).toBe('1');

    const keywordRanked = rankStoredDocuments(sampleRows, 'growth valuation credentials');
    expect(keywordRanked.length).toBe(1);
    expect(keywordRanked[0].id).toBe('1');
    expect(keywordRanked[0].vaultId).toBe('marketing');

    // mergeVantaDocumentMatches also drops any secret match
    const merged = mergeVantaDocumentMatches(
      [
        {
          id: 's-1',
          fileName: 'api_tokens.json',
          vaultId: 'credentials',
          sourceModule: 'secrets',
          contentText: 'token',
          similarity: 0.8,
        },
      ],
      keywordRanked,
    );
    expect(merged.length).toBe(1);
    expect(merged[0].id).toBe('1');
  });

  // Path 3: Attachment context path
  it('Path 3: local attachments sanitize and reject Secret Vault files', () => {
    const localContexts = [
      { id: 'c-1', name: 'ad_copy_variations.csv', vaultId: 'marketing', text: 'Ad copy text', isSecret: false },
      { id: 'c-2', name: '.env.production', vaultId: 'general', text: 'DATABASE_URL=postgres://...', isSecret: false },
      { id: 'c-3', name: 'executive_board_targets.md', vaultId: 'executive', text: 'Secret revenue goals', isSecret: true },
      { id: 'c-4', name: 'stripe_api_keys.json', vaultId: 'credentials', text: 'sk_live_123', isSecret: false },
    ];

    const safeContexts = sanitizeLocalContexts(localContexts);
    expect(safeContexts.length).toBe(1);
    expect(safeContexts[0].id).toBe('c-1');
    expect(safeContexts[0].name).toBe('ad_copy_variations.csv');
  });

  // Path 4: Approved memory path
  it('Path 4: memory sanitization drops memories tied to Secret Vaults or marked secret', () => {
    const memories = [
      { id: 'm-1', vault_id: 'brand', content: 'Brand tagline is Growth Driven Engineering' },
      { id: 'm-2', vault_id: 'credentials', content: 'Master Stripe API key was rotated on Nov 15' },
      { id: 'm-3', vault_id: 'executive', content: 'Acquisition target valuation benchmark: $25M' },
      { id: 'm-4', vault_id: 'marketing', content: '[SECRET_VAULT] Masked internal credential note' },
    ];

    const safeMemories = sanitizeMemories(memories);
    expect(safeMemories.length).toBe(1);
    expect(safeMemories[0].id).toBe('m-1');
  });

  // Path 5: Agent and VANTA tools path
  it('Path 5: agent and VANTA tools deny access to Secret Vaults and sensitive files', async () => {
    const mockSb = {
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    // 1. Agent tool search_second_brain with secret vaultId
    const agentResult = await executeAgentToolCall({
      name: 'search_second_brain',
      args: { query: 'passwords', vaultId: 'credentials' },
      sb: mockSb as any,
      workspaceId: 'ws-100',
    });
    expect(agentResult.error).toMatch(/Access denied: Secret Vaults/i);
    expect(agentResult.matchCount).toBe(0);

    // 2. Agent tool read_workspace_file targeting .env
    const fileResult = await executeAgentToolCall({
      name: 'read_workspace_file',
      args: { filePath: '.env' },
      workspaceRoot: 'C:/fake/workspace',
    });
    expect(fileResult.error).toMatch(/Secret Vault files.*excluded/i);

    // 3. VANTA gateway tool vanta_search_documents with secret vaultId
    const vantaToolResult = await executeVantaTool(
      'vanta_search_documents',
      { query: 'board minutes', vaultId: 'executive-vault' },
      {
        workspaceId: 'ws-100',
        userId: 'usr-1',
        userRole: 'owner',
        sb: mockSb as any,
      },
    );
    expect(vantaToolResult.success).toBe(false);
    expect(vantaToolResult.code).toBe('POLICY_DENIED');
    expect(vantaToolResult.receipt.status).toBe('blocked');
    expect(vantaToolResult.error).toMatch(/Secret Vaults.*strictly excluded/i);
  });
});
