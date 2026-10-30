import { describe, expect, it, vi } from 'vitest';
const { embedContent, clients } = vi.hoisted(() => ({ embedContent: vi.fn(), clients: vi.fn() }));
vi.mock('@google/genai', () => ({ GoogleGenAI: class {
  models = { embedContent };
  constructor(options: unknown) { clients(options); }
} }));
import { searchDocuments } from './rag';
describe('workspace-key document retrieval', () => {
  it('embeds with the resolved workspace key when no server key exists and preserves workspace scoping', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    embedContent.mockResolvedValue({ embeddings: [{ values: Array(768).fill(0.1) }] });
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    await searchDocuments({ rpc } as any, 'workspace-one', 'brand', { apiKey: 'test-workspace-key' });
    expect(clients).toHaveBeenCalledWith({ apiKey: 'test-workspace-key' });
    expect(rpc).toHaveBeenCalledWith('match_documents', expect.objectContaining({ p_workspace_id: 'workspace-one' }));
    vi.unstubAllEnvs();
  });
});
