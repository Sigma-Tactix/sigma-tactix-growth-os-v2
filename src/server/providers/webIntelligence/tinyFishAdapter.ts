import type {
  FetchRequest,
  SearchRequest,
  WebEvidence,
  WebIntelligenceCapabilities,
  WebIntelligenceProvider,
} from './types';

interface TinyFishOptions {
  apiKey?: string;
  timeoutMs?: number;
  searchBaseUrl?: string;
  fetchBaseUrl?: string;
  verified?: boolean;
}

function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Public HTTP(S) URL required');
  }
  const host = url.hostname.toLowerCase();
  const privateHost = host === 'localhost' || host.endsWith('.local') || host === '::1'
    || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^169\.254\./.test(host);
  if (!['http:', 'https:'].includes(url.protocol) || privateHost || url.username || url.password) {
    throw new Error('Public HTTP(S) URL required');
  }
  return url;
}

export class TinyFishWebIntelligenceAdapter implements WebIntelligenceProvider {
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly searchBaseUrl: string;
  private readonly fetchBaseUrl: string;
  private verifiedState: boolean;

  constructor(options: TinyFishOptions = {}) {
    this.apiKey = (options.apiKey ?? process.env.TINYFISH_API_KEY ?? '').trim();
    const configuredTimeout = Number(process.env.TINYFISH_TIMEOUT_MS);
    this.timeoutMs = options.timeoutMs ?? (Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 15_000);
    this.searchBaseUrl = options.searchBaseUrl ?? 'https://api.search.tinyfish.ai';
    this.fetchBaseUrl = options.fetchBaseUrl ?? 'https://api.fetch.tinyfish.ai';
    this.verifiedState = options.verified ?? false;
  }

  async verify(): Promise<boolean> {
    if (!this.apiKey) {
      this.verifiedState = false;
      return false;
    }
    try {
      const url = new URL(this.searchBaseUrl);
      url.searchParams.set('query', 'ping');
      const response = await fetch(url, {
        headers: this.headers(),
        signal: AbortSignal.timeout(Math.min(5000, this.timeoutMs)),
      });
      this.verifiedState = response.ok;
      return this.verifiedState;
    } catch {
      this.verifiedState = false;
      return false;
    }
  }

  async capabilities(): Promise<WebIntelligenceCapabilities> {
    return {
      provider: 'tinyfish',
      configured: Boolean(this.apiKey),
      verified: this.verifiedState,
      operations: ['search', 'fetch'],
      detail: this.verifiedState
        ? 'TinyFish web intelligence is verified and reachable for search and fetch operations.'
        : this.apiKey
        ? 'API key is configured; no provider request has been verified in this process.'
        : 'Set TINYFISH_API_KEY to enable server-side Search and Fetch.',
    };
  }

  private headers() {
    if (!this.apiKey) throw new Error('TINYFISH_API_KEY is not configured');
    return { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' };
  }

  async search(input: SearchRequest): Promise<WebEvidence[]> {
    const query = input.query.trim();
    if (!query) throw new Error('Search query is required');
    const url = new URL(this.searchBaseUrl);
    url.searchParams.set('query', query);
    if (input.location) url.searchParams.set('location', input.location);
    if (input.language) url.searchParams.set('language', input.language);
    const startedAt = Date.now();
    const response = await fetch(url, { headers: this.headers(), signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) throw new Error(`TinyFish Search returned ${response.status}`);
    this.verifiedState = true;
    const payload = await response.json() as any;
    const latencyMs = Date.now() - startedAt;
    const limit = Math.max(1, Math.min(20, input.maxResults ?? 10));
    return (payload.results ?? []).slice(0, limit).flatMap((item: any, index: number) => {
      if (typeof item?.url !== 'string') return [];
      assertPublicUrl(item.url);
      return [{
        provider: 'tinyfish', method: 'search', sourceUrl: item.url, title: String(item.title || item.url),
        excerpt: typeof item.snippet === 'string' ? item.snippet : undefined,
        rank: index + 1, retrievedAt: new Date().toISOString(), latencyMs,
      } satisfies WebEvidence];
    });
  }

  async fetch(input: FetchRequest): Promise<WebEvidence[]> {
    if (!input.urls.length || input.urls.length > 20) throw new Error('Provide between 1 and 20 public URLs');
    const urls = input.urls.map(raw => assertPublicUrl(raw).toString());
    const startedAt = Date.now();
    const response = await fetch(this.fetchBaseUrl, {
      method: 'POST', headers: this.headers(),
      body: JSON.stringify({ urls, format: input.format || 'markdown' }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`TinyFish Fetch returned ${response.status}`);
    this.verifiedState = true;
    const payload = await response.json() as any;
    const latencyMs = Date.now() - startedAt;
    const documents = Array.isArray(payload) ? payload : payload.results || payload.data || [];
    return documents.flatMap((item: any) => {
      const sourceUrl = item?.url || item?.source_url;
      if (typeof sourceUrl !== 'string') return [];
      return [{
        provider: 'tinyfish', method: 'fetch', sourceUrl, finalUrl: item.final_url || item.finalUrl,
        title: String(item.title || sourceUrl), content: item.text || item.markdown || item.content,
        retrievedAt: new Date().toISOString(), latencyMs,
      } satisfies WebEvidence];
    });
  }
}
