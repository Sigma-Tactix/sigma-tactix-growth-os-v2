import { describe, it, expect } from 'vitest';
import { creativeGateway } from './creativeGateway.js';
import { HuggingFaceCreativeAdapter } from './huggingFaceAdapter.js';
import { CloudflareCreativeAdapter } from './cloudflareAdapter.js';
import { GeminiImageAdapter } from './geminiImageAdapter.js';

describe('Creative Gateway truthfulness', () => {
  it('reports implemented renderers and prompt enhancers without a zero-key fallback', async () => {
    const status = await creativeGateway.getProviderStatus();
    const providerNames = status.map(s => s.provider);
    expect(providerNames).toContain('gemini');
    expect(providerNames).toContain('huggingface');
    expect(providerNames).toContain('cloudflare');
    expect(providerNames).toContain('comfyui');
    expect(providerNames).toContain('ollama');
    expect(providerNames).toContain('lmstudio');
    expect(providerNames).toContain('hyperframes');
    expect(providerNames).not.toContain('pollinations');
    expect(status.every(s => !s.tier.includes('fallback'))).toBe(true);
  });

  it('fails closed when no verified image provider is configured', async () => {
    await expect(creativeGateway.generateImage({ prompt: 'B2B Revenue Analytics Core', enhancePrompt: false })).rejects.toThrow(
      'No verified image provider is available'
    );
  });

  it('fails closed when no generative-video provider is configured', async () => {
    await expect(creativeGateway.generateVideo({ prompt: 'Pattern interrupt' })).rejects.toThrow(
      'No verified generative-video provider is configured'
    );
  });

  it('HuggingFaceCreativeAdapter fails gracefully when token is not configured', async () => {
    const adapter = new HuggingFaceCreativeAdapter('');
    expect(adapter.isConfigured()).toBe(false);
    await expect(adapter.generateImage({ prompt: 'Test' })).rejects.toThrow(
      'Hugging Face API token (HF_TOKEN) is not configured'
    );
  });

  it('CloudflareCreativeAdapter fails gracefully when token/account is not configured', async () => {
    const adapter = new CloudflareCreativeAdapter('', '');
    expect(adapter.isConfigured()).toBe(false);
    await expect(adapter.generateImage({ prompt: 'Test' })).rejects.toThrow(
      'Cloudflare Workers AI (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) is not configured'
    );
  });

  it('GeminiImageAdapter converts verified inline image bytes into a data URL', async () => {
    const adapter = new GeminiImageAdapter('valid-test-key-12345', () => ({
      interactions: {
        create: async () => ({
          id: 'interaction-1', status: 'completed', steps: [],
          output_image: { type: 'image', mime_type: 'image/jpeg', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZBsAAAAASUVORK5CYII=' },
        }),
      } as any,
    }));
    const result = await adapter.generateImage({
      prompt: 'Premium B2B product visual', aspectRatio: '16:9',
      modelId: 'gemini-nano-banana-2.1', promptEnhancer: 'none',
    });
    expect(result.imageUrl).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZBsAAAAASUVORK5CYII=');
    expect(result.provider).toBe('gemini');
    expect(result.modelName).toBe('gemini-nano-banana-2.1');
  });
});
