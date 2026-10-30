import { describe, expect, it, vi } from 'vitest';
import { rankStoredDocuments, withinBudget, mergeVantaDocumentMatches } from './vantaRetrieval';
describe('VANTA retrieval resilience', () => {
  it('limits slow optional context and handles rejected dependencies', async () => {
    vi.useFakeTimers();
    const result = withinBudget(new Promise<string>(() => {}), 4000, 'unavailable');
    await vi.advanceTimersByTimeAsync(4000);
    await expect(result).resolves.toBe('unavailable');
    await expect(withinBudget(Promise.reject(new Error('offline')), 4000, 'unavailable')).resolves.toBe('unavailable');
    vi.useRealTimers();
  });
  it('retrieves unindexed stored text and prioritizes matching filenames without inventing semantic similarity', () => {
    const rows = [
      { id: 'a', file_name: 'Other', vault_id: 'brand', source_module: 'upload', content_text: 'campaign' },
      { id: 'b', file_name: 'Campaign plan', vault_id: 'marketing', source_module: 'upload', content_text: null },
      { id: 'c', file_name: 'Unrelated', vault_id: 'brand', source_module: 'upload', content_text: 'nothing' },
    ];
    expect(rankStoredDocuments(rows, 'campaign').map(item => item.id)).toEqual(['b', 'a']);
    expect(rankStoredDocuments(rows, 'campaign')[0].similarity).toBe(0);
    expect(rankStoredDocuments(rows, 'unmatched')).toEqual([]);
  });
});

describe('combined retrieval', () => {
  it('prioritizes filename matches while retaining unique semantic context', () => {
    const match = (id: string) => ({ id, fileName: id, vaultId: 'marketing', sourceModule: 'upload', contentText: null, similarity: 0 });
    expect(mergeVantaDocumentMatches([match('other'), match('brief')], [match('brief')]).map(item => item.id)).toEqual(['brief', 'other']);
  });
});
