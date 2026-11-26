import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCreativeStudioRouter } from './creativeStudioRoutes.js';

vi.mock('../providers/creative/creativeGateway.js', () => ({
  creativeGateway: {
    getProviderStatus: vi.fn(),
    generateImage: vi.fn(),
    generateVideo: vi.fn(),
  },
}));
vi.mock('../providers/creative/socialFallback.js', () => ({
  generateFallbackSocialCampaignServer: vi.fn(() => ({ channel: 'LinkedIn', hook: 'fallback', slides: [], hashtags: [] })),
}));
vi.mock('../../lib/brandCreativeStyles.js', () => ({
  buildBrandCreativeStylePresets: vi.fn((brandVault: any) => [
    { id: '3D_DATA_NEURAL', label: '3D Data', promptGuidance: 'guidance', brandVault },
  ]),
}));
vi.mock('../../lib/tokenCostEngine.js', () => ({
  estimateTokens: vi.fn((t: any) => (t ? String(t).length : 0)),
}));

import { creativeGateway } from '../providers/creative/creativeGateway.js';
import { generateFallbackSocialCampaignServer } from '../providers/creative/socialFallback.js';
import { buildBrandCreativeStylePresets } from '../../lib/brandCreativeStyles.js';

function makeDb(overrides: any = {}) {
  return {
    secondBrain: {
      brandVault: { voiceAndTone: 'empirical', corePositioning: 'p', brandSlogan: 's', keyMessages: ['m'] },
      customerVault: { idealCustomerProfile: 'B2B founders' },
    },
    ...overrides,
  } as any;
}

function makeDeps(db: any, overrides: any = {}) {
  return {
    getDB: vi.fn(async () => db),
    getGeminiClient: vi.fn(() => ({
      models: {
        generateContent: vi.fn(async () => ({
          text: JSON.stringify({ channel: 'LinkedIn', hook: 'gemini-hook', slides: [{ slideNumber: 1 }], hashtags: ['#x'] }),
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 },
        })),
      },
    })),
    resolveEffectiveGeminiKey: vi.fn(async () => 'resolved-key'),
    resolveEffectiveGeminiModel: vi.fn(async () => 'gemini-2.5-flash'),
    recordTokenUsage: vi.fn(async () => null),
    executeUniversalAICompletion: vi.fn(async () => ({ text: 'OPUSMAX TEXT', model: 'claude-opus-5-5', promptTokens: 1, candidateTokens: 2, totalTokens: 3, durationMs: 10 })),
    requireModule: vi.fn(),
    requireAuth: (_req: any, _res: any, next: any) => next(),
    ...overrides,
  };
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb: {}, wsId: 'ws-1', userId: 'user-1' },
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'POST', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// Each route carries [requireAuth, handler]; walk both, awaiting async layers.
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find((s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()]);
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  for (const h of layer.route.stack) {
    let nextCalled = false;
    const maybeP = h.handle(req, res, () => { nextCalled = true; });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

const ENV_KEYS = ['GEMINI_API_KEY', 'OPUSMAX_API_KEY', 'ANTHROPIC_AUTH_TOKEN'];

describe('Creative Studio Routes', () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ENV_KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
    vi.mocked(creativeGateway.getProviderStatus).mockClear();
    vi.mocked(creativeGateway.generateImage).mockClear();
    vi.mocked(creativeGateway.generateVideo).mockClear();
    vi.mocked(generateFallbackSocialCampaignServer).mockClear();
    vi.mocked(buildBrandCreativeStylePresets).mockClear();
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('route shape: 6 routes, each [requireAuth, handler] (auth at the route, not the mount)', () => {
    const router: any = createCreativeStudioRouter(makeDeps(makeDb()));
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(6);
    for (const l of layers) {
      expect(l.route.path.startsWith('/api/creative/')).toBe(true);
      expect(l.route.stack).toHaveLength(2);
    }
  });

  it('GET /api/creative/providers/status: passes the resolved (or env) Gemini key to the gateway', async () => {
    const deps = makeDeps(makeDb());
    const router = createCreativeStudioRouter(deps);
    vi.mocked(creativeGateway.getProviderStatus).mockResolvedValueOnce({ gemini: 'configured' } as any);
    const res = makeRes();
    await invoke(router, 'GET', '/api/creative/providers/status', makeReq({ method: 'GET', url: '/api/creative/providers/status' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ success: true, providers: { gemini: 'configured' } });
    expect(vi.mocked(creativeGateway.getProviderStatus)).toHaveBeenCalledWith({ geminiApiKey: 'resolved-key' });
  });

  it('GET /api/creative/brand-style-presets: builds presets from the workspace brand vault, hiding promptGuidance', async () => {
    const deps = makeDeps(makeDb());
    const router = createCreativeStudioRouter(deps);
    const res = makeRes();
    await invoke(router, 'GET', '/api/creative/brand-style-presets', makeReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(200);
    expect(buildBrandCreativeStylePresets).toHaveBeenCalledWith(expect.objectContaining({ voiceAndTone: 'empirical' }));
    expect(res.jsonData.presets[0]).toMatchObject({ id: '3D_DATA_NEURAL', label: '3D Data' });
    expect(res.jsonData.presets[0]).not.toHaveProperty('promptGuidance');
  });

  it('POST /api/creative/generate-image: 400 ladders, then the gateway success + a 502 that REDACTS any leaked key', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createCreativeStudioRouter(deps);

    let res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-image', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Prompt is required');

    res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-image', makeReq({ body: { prompt: 'p', promptEnhancer: 'bogus' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('promptEnhancer must be');

    vi.mocked(creativeGateway.generateImage).mockResolvedValueOnce({
      imageUrl: 'https://x/img.png', enhancedPrompt: 'enh', aspectRatio: '16:9', seed: 7, provider: 'gemini', modelName: 'flux', source: 'gemini', promptEnhancer: 'gemini',
    } as any);
    res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-image', makeReq({ body: { prompt: 'a neural data city' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({ success: true, imageUrl: 'https://x/img.png', provider: 'gemini' });
    expect(deps.recordTokenUsage).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ actionType: 'CREATIVE_IMAGE' }));
    // the preset's promptGuidance is what steers the style, not the raw preset id alone
    expect(vi.mocked(creativeGateway.generateImage).mock.calls[0][0]).toMatchObject({ styleGuidance: 'guidance', stylePreset: '3D_DATA_NEURAL' });

    // a provider failure is a 502 with any Gemini key scrubbed from the message
    vi.mocked(creativeGateway.generateImage).mockRejectedValueOnce(new Error('quota exceeded for AIzaSyD9fakeKey123'));
    res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-image', makeReq({ body: { prompt: 'again' } }), res);
    expect(res.statusCode).toBe(502);
    expect(res.jsonData.error).toContain('[redacted]');
    expect(res.jsonData.error).not.toContain('AIza');
  });

  it('POST /api/creative/generate-video: 400 without a prompt; 200 records CREATIVE_VIDEO usage + echoes the result fields', async () => {
    const deps = makeDeps(makeDb());
    const router = createCreativeStudioRouter(deps);

    let res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-video', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);

    vi.mocked(creativeGateway.generateVideo).mockResolvedValueOnce({
      videoUrl: 'https://x/v.mp4', thumbnailUrl: 'https://x/t.png', prompt: 'p', aspectRatio: '9:16', durationSeconds: 5, provider: 'runway', modelName: 'gen-3', source: 'runway',
    } as any);
    res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-video', makeReq({ body: { prompt: 'launch montage' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({ success: true, videoUrl: 'https://x/v.mp4', durationSeconds: 5, provider: 'runway' });
    // a still image must never be reported as a video: the response carries the video URL, not an imageUrl
    expect(res.jsonData.imageUrl).toBeUndefined();
    expect(deps.recordTokenUsage).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ actionType: 'CREATIVE_VIDEO' }));
  });

  it('POST /api/creative/generate-social: 400 without a topic; with a Gemini key the live path wins; without any provider the LOCAL TEMPLATE is the honest source', async () => {
    const deps = makeDeps(makeDb());
    const router = createCreativeStudioRouter(deps);

    let res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-social', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Topic is required');

    // live Gemini path: the resolved key drives it; JSON parse + source 'gemini'
    res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-social', makeReq({ body: { topic: 'Growth OS teardown' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.source).toBe('gemini');
    expect(res.jsonData.result).toMatchObject({ channel: 'LinkedIn', hook: 'gemini-hook' });

    // no key at all: resolveEffectiveGeminiKey -> undefined and no env key -> local template
    const depsNoKey = makeDeps(makeDb(), {
      resolveEffectiveGeminiKey: vi.fn(async () => undefined),
    });
    const routerNoKey = createCreativeStudioRouter(depsNoKey);
    res = makeRes();
    await invoke(routerNoKey, 'POST', '/api/creative/generate-social', makeReq({ body: { topic: 'fallback run' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.source).toBe('local-template');
    expect(generateFallbackSocialCampaignServer).toHaveBeenCalled();
  });

  it('POST /api/creative/generate-text: 400 without a topic; the engine ladder is opusmax → gemini → local-template, and the response names the engine that actually produced it', async () => {
    const deps = makeDeps(makeDb());
    const router = createCreativeStudioRouter(deps);

    let res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-text', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Topic is required');

    // preferred opusmax: the universal completion engine answers, engine "opusmax"
    res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-text', makeReq({ body: { topic: 'T', preferredProvider: 'opusmax' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({ success: true, content: 'OPUSMAX TEXT', engine: 'opusmax', model: 'claude-opus-5-5' });
    expect(deps.executeUniversalAICompletion).toHaveBeenCalledWith(expect.objectContaining({ provider: 'opusmax', prompt: expect.stringContaining('Topic: T') }));

    // a GEMINI_API_KEY (and no opusmax pref) takes the gemini branch
    process.env.GEMINI_API_KEY = 'env-gemini-key';
    res = makeRes();
    await invoke(router, 'POST', '/api/creative/generate-text', makeReq({ body: { topic: 'T2' } }), res);
    expect(res.jsonData).toMatchObject({ content: expect.stringContaining('gemini'), engine: 'gemini' });

    // no providers at all: the local template is the floor, and it is labelled as such
    const depsFloor = makeDeps(makeDb(), {
      resolveEffectiveGeminiKey: vi.fn(async () => undefined),
      getGeminiClient: vi.fn(() => { throw new Error('no client'); }),
    });
    const routerFloor = createCreativeStudioRouter(depsFloor);
    res = makeRes();
    await invoke(routerFloor, 'POST', '/api/creative/generate-text', makeReq({ body: { topic: 'T3' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({ success: true, title: 'T3', engine: 'local-template' });
    expect(res.jsonData.content).toContain('T3'); // the topic is woven into the template, not ignored
  });
});
