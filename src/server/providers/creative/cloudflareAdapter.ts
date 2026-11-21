import { inspectGeneratedImage } from './imageBytes.js';
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
    if (modelId !== '@cf/black-forest-labs/flux-1-schnell') throw new Error('Unsupported Cloudflare image model.');
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
        throw new Error(`Cloudflare AI returned HTTP ${response.status}.`);
      }

      let bytes: Buffer;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await response.json() as { success?: boolean; result?: { image?: string }; image?: string };
        const image = payload.result?.image || payload.image;
        if (payload.success === false || !image || !/^[A-Za-z0-9+/]+={0,2}$/.test(image)) throw new Error('Cloudflare returned no image.');
        bytes = Buffer.from(image, 'base64');
      } else if (contentType.startsWith('image/')) {
        bytes = Buffer.from(await response.arrayBuffer());
      } else {
        throw new Error('Cloudflare returned an unsupported response.');
      }
      const inspected = inspectGeneratedImage(bytes);
      const dataUrl = `data:${inspected.mimeType};base64,${bytes.toString('base64')}`;

      return {
        imageUrl: dataUrl,
        enhancedPrompt: req.prompt,
        aspectRatio: inspected.aspectRatio,
        seed: null,
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
