import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudflareCreativeAdapter } from './cloudflareAdapter.js';
import { HuggingFaceCreativeAdapter } from './huggingFaceAdapter.js';
import { GeminiImageAdapter } from './geminiImageAdapter.js';
import { inspectGeneratedImage } from './imageBytes.js';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZBsAAAAASUVORK5CYII=';
const adapter = () => new CloudflareCreativeAdapter('test-token', 'test-account');
afterEach(() => vi.unstubAllGlobals());

describe('Cloudflare image response contract', () => {
  it('decodes JSON base64 and reports the actual dimensions without inventing a seed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: true, result: { image: png } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await adapter().generateImage({ prompt: 'A product photograph', aspectRatio: '16:9' });
    expect(result.imageUrl).toBe(`data:image/png;base64,${png}`);
    expect(result.aspectRatio).toBe('1:1');
    expect(result.seed).toBeNull();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ prompt: 'A product photograph', steps: 4 });
  });

  it('accepts a raw image response using the detected media type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(Buffer.from(png, 'base64'), { headers: { 'Content-Type': 'image/png' } })));
    expect((await adapter().generateImage({ prompt: 'Product' })).imageUrl).toBe(`data:image/png;base64,${png}`);
  });

  it.each([{ success: false }, { result: {} }, { result: { image: 'aW1hZ2U=' } }])('rejects unsuccessful or non-image JSON: %j', async payload => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload)));
    await expect(adapter().generateImage({ prompt: 'Product' })).rejects.toThrow();
  });

  it('rejects an unrecognized model before sending a credential', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(adapter().generateImage({ prompt: 'Product', modelId: '../../another-endpoint' })).rejects.toThrow('Unsupported');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not expose an upstream error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private-provider-detail', { status: 401 })));
    await expect(adapter().generateImage({ prompt: 'Product' })).rejects.toThrow(/^Cloudflare AI returned HTTP 401\.$/);
  });

  it('rejects truncated images and unsupported byte payloads', () => {
    const bytes = Buffer.from(png, 'base64');
    expect(() => inspectGeneratedImage(bytes.subarray(0, -12))).toThrow();
    expect(() => inspectGeneratedImage(Buffer.from('not an image'))).toThrow();
  });
});

describe('Other image adapter output evidence', () => {
  it('Hugging Face uses actual image dimensions and leaves unavailable seed empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(Buffer.from(png, 'base64'), { headers: { 'Content-Type': 'image/png' } })));
    const result = await new HuggingFaceCreativeAdapter('test-token').generateImage({ prompt: 'Product', aspectRatio: '16:9' });
    expect(result.aspectRatio).toBe('1:1'); expect(result.seed).toBeNull();
  });
  it('Hugging Face rejects JSON and non-image responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ image: 'not image bytes' })));
    await expect(new HuggingFaceCreativeAdapter('test-token').generateImage({ prompt: 'Product' })).rejects.toThrow('no image');
  });
  it('Gemini rejects text masquerading as an image', async () => {
    const adapter = new GeminiImageAdapter('valid-test-key', () => ({ interactions: { create: async () => ({ output_image: { data: 'aW1hZ2U=', mime_type: 'image/jpeg' } }) } as any }));
    await expect(adapter.generateImage({ prompt: 'Product' })).rejects.toThrow('supported complete image');
  });
});
