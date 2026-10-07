import type {
  FetchRequest,
  SearchRequest,
  WebEvidence,
  WebIntelligenceCapabilities,
  WebIntelligenceProvider,
} from './types';

export class FixtureWebIntelligenceAdapter implements WebIntelligenceProvider {
  async capabilities(): Promise<WebIntelligenceCapabilities> {
    return {
      provider: 'tinyfish',
      configured: true,
      verified: true,
      operations: ['search', 'fetch'],
      detail: 'Fixture adapter active for deterministic testing and local development.',
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }

  async search(input: SearchRequest): Promise<WebEvidence[]> {
    const query = input.query.trim();
    return [
      {
        provider: 'tinyfish',
        method: 'search',
        sourceUrl: 'https://competitor.example/pricing',
        title: `${query || 'Competitor'} - Pricing & Plans`,
        excerpt: 'Starter tier at $49/mo; Growth tier at $199/mo with automated intelligence. Enterprise includes custom SLAs.',
        rank: 1,
        retrievedAt: new Date().toISOString(),
        latencyMs: 38,
      },
      {
        provider: 'tinyfish',
        method: 'search',
        sourceUrl: 'https://competitor.example/changelog',
        title: `${query || 'Competitor'} - Latest Product Changelog`,
        excerpt: 'Recently shipped multi-agent pipeline orchestration, automated GSC keyword cannibalization alerts, and unified creative synthesis.',
        rank: 2,
        retrievedAt: new Date().toISOString(),
        latencyMs: 42,
      },
    ];
  }

  async fetch(input: FetchRequest): Promise<WebEvidence[]> {
    return input.urls.map(url => ({
      provider: 'tinyfish',
      method: 'fetch',
      sourceUrl: url,
      finalUrl: url,
      title: `Snapshot of ${url}`,
      content: '# Competitor Intelligence Snapshot\n\n## Value Proposition\nScale your B2B demand generation with autonomous growth agents.\n\n## Pricing Tiers\n- **Starter**: $49/mo (1 seat, 5k actions)\n- **Growth**: $199/mo (Unlimited seats, full autonomous execution)\n- **Enterprise**: Custom deployment',
      retrievedAt: new Date().toISOString(),
      latencyMs: 55,
    }));
  }
}
