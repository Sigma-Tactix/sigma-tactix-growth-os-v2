import type {
  CreativeImageRequest,
  CreativeImageResponse,
} from './types.js';

export class CloudflareCreativeAdapter {
  private readonly apiToken: string;
  private readonly accountId: string;
  private readonly timeoutMs: number;

  constructor(apiToken?: string, accountId?: string, timeoutMs: number = 25_000) {
    this.apiToken = (apiToken || process.env.CLOUDFLARE_API_TOKEN || '').trim();
    this.accountId = (accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
    this.timeoutMs = timeoutMs;
  }

  isConfigured(): boolean {
    return Boolean(this.apiToken && this.accountId);
  }

  async generateImage(req: CreativeImageRequest): Promise<CreativeImageResponse> {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare Workers AI (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) is not configured');
    }

    const modelId = req.modelId || '@cf/black-forest-labs/flux-1-schnell';
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${modelId}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: req.prompt,
          steps: 4,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown Cloudflare Workers AI error');
        throw new Error(`Cloudflare AI error ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      return {
        imageUrl: dataUrl,
        enhancedPrompt: req.prompt,
        aspectRatio: req.aspectRatio || '16:9',
        seed: Math.floor(Math.random() * 999999),
        provider: 'cloudflare',
        modelName: modelId,
        source: 'provider_api',
        generatedAt: new Date().toISOString(),
        promptEnhancer: req.promptEnhancer || 'none',
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
