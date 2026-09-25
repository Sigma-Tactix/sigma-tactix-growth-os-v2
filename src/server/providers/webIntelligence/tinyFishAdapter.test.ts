import { afterEach, describe, expect, it, vi } from 'vitest';
import { TinyFishWebIntelligenceAdapter } from './tinyFishAdapter';

afterEach(() => vi.unstubAllGlobals());

describe('TinyFish web-intelligence adapter', () => {
  it('reports an unconfigured capability without making a provider call', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(new TinyFishWebIntelligenceAdapter({ apiKey: '' }).capabilities()).resolves.toMatchObject({
      provider: 'tinyfish', configured: false, verified: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes search results into Sigma-owned evidence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      results: [{ title: 'Pricing', url: 'https://competitor.example/pricing', snippet: 'Plans start at 99.' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } })));
    const adapter = new TinyFishWebIntelligenceAdapter({ apiKey: 'test-key' });
    const results = await adapter.search({ query: 'competitor pricing', maxResults: 5 });
    expect(results).toEqual([expect.objectContaining({
      provider: 'tinyfish', method: 'search', rank: 1, title: 'Pricing',
      sourceUrl: 'https://competitor.example/pricing', excerpt: 'Plans start at 99.',
    })]);
  });

  it('rejects private-network targets before sending them to Fetch', async () => {
    const adapter = new TinyFishWebIntelligenceAdapter({ apiKey: 'test-key' });
    await expect(adapter.fetch({ urls: ['http://127.0.0.1/admin'] })).rejects.toThrow('Public HTTP(S) URL required');
  });
});
