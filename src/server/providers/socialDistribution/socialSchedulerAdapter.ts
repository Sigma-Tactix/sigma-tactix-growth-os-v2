import { inspectGeneratedImage } from '../creative/imageBytes.js';
import type { SocialDistributionProvider, SocialDistributionProviderStatus, SocialChannel, SocialPostPayload, SocialPublishResult } from './types.js';

export interface SocialSchedulerConfig { apiUrl?: string; apiKey?: string; timeoutMs?: number }
type Integration = { id: string; identifier?: string; providerIdentifier?: string; name?: string; disabled?: boolean; profile?: { name?: string; handle?: string; avatarUrl?: string } };
const supported = ['linkedin', 'instagram'] as const;
const identifiers = new Set(['linkedin', 'linkedin-page', 'instagram', 'instagram-standalone']);

/** Postiz public API. The server-managed connection is bound to one Client Enclave by the router. */
export class SocialSchedulerAdapter implements SocialDistributionProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(config?: SocialSchedulerConfig) {
    this.apiUrl = (config?.apiUrl ?? process.env.SOCIAL_SCHEDULER_API_URL ?? process.env.POSTIZ_API_URL ?? 'https://api.postiz.com/public/v1').replace(/\/+$/, '');
    this.apiKey = (config?.apiKey ?? process.env.SOCIAL_SCHEDULER_API_KEY ?? process.env.POSTIZ_API_KEY ?? '').trim();
    this.timeoutMs = config?.timeoutMs ?? 15_000;
  }
  isConfigured(): boolean { return Boolean(this.apiKey && this.apiUrl); }

  private async request(path: string, body?: unknown): Promise<unknown> {
    const multipart = body instanceof FormData;
    const response = await fetch(`${this.apiUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: this.apiKey, ...(!multipart ? { 'Content-Type': 'application/json' } : {}) },
      ...(body === undefined ? {} : { body: multipart ? body : JSON.stringify(body) }),
      signal: AbortSignal.timeout(this.timeoutMs), redirect: 'error',
    });
    if (!response.ok) throw new Error(`Social scheduler responded with HTTP ${response.status}.`);
    return response.json();
  }
  private async integrations(): Promise<Integration[]> {
    const data = await this.request('/integrations');
    if (!Array.isArray(data) || data.some(item => !item || typeof item.id !== 'string')) throw new Error('Invalid integrations response.');
    return data.filter(item => identifiers.has(item.identifier || item.providerIdentifier || ''));
  }
  async getStatus(): Promise<SocialDistributionProviderStatus> {
    const status: SocialDistributionProviderStatus = { configured: this.isConfigured(), active: false, connectedChannelsCount: 0, supportedPlatforms: [...supported], mode: 'unavailable' };
    if (!this.isConfigured()) return status;
    try {
      const data = await this.integrations();
      return { ...status, active: true, mode: 'live', connectedChannelsCount: data.filter(item => !item.disabled).length };
    } catch { return status; }
  }
  async getChannels(): Promise<SocialChannel[]> {
    if (!this.isConfigured()) return [];
    try {
      return (await this.integrations()).map(item => ({
        id: item.id, name: item.name || item.profile?.name || item.id,
        platform: (item.identifier || item.providerIdentifier || '').startsWith('linkedin') ? 'linkedin' : 'instagram',
        handle: item.profile?.handle, avatarUrl: item.profile?.avatarUrl,
        connected: !item.disabled, status: item.disabled ? 'expired' : 'active',
      }));
    } catch { return []; }
  }
  createDraft(payload: SocialPostPayload): Promise<SocialPublishResult> { return this.dispatch(payload, 'draft'); }
  async schedulePost(payload: SocialPostPayload): Promise<SocialPublishResult> {
    if (!payload.scheduledFor || !Number.isFinite(Date.parse(payload.scheduledFor)) || Date.parse(payload.scheduledFor) <= Date.now()) throw new Error('scheduledFor must be a future ISO timestamp.');
    return this.dispatch(payload, 'schedule');
  }
  publishNow(payload: SocialPostPayload): Promise<SocialPublishResult> { return this.dispatch(payload, 'now'); }

  private async upload(media: NonNullable<SocialPostPayload['media']>[number]): Promise<{ id: string; path: string; alt?: string }> {
    let result: unknown;
    if (media.url.startsWith('data:')) {
      const match = /^data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(media.url);
      if (media.type !== 'image' || !match || media.url.length > 4_000_000) throw new Error('Use a PNG/JPEG image under 3 MB, or a public HTTPS media URL.');
      const bytes = Buffer.from(match[1], 'base64');
      const image = inspectGeneratedImage(bytes);
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(bytes)], { type: image.mimeType }), image.mimeType === 'image/png' ? 'image.png' : 'image.jpg');
      result = await this.request('/upload', form);
    } else {
      result = await this.request('/upload-from-url', { url: media.url });
    }
    const uploaded = result as { id?: string; path?: string; status?: string };
    if (typeof uploaded?.id !== 'string' || !uploaded.id || typeof uploaded.path !== 'string' || new URL(uploaded.path).protocol !== 'https:' || uploaded.status === 'processing') throw new Error('The publishing provider returned no ready media receipt.');
    return { id: uploaded.id, path: uploaded.path, ...(media.altText ? { alt: media.altText } : {}) };
  }

  private async dispatch(payload: SocialPostPayload, type: 'draft' | 'schedule' | 'now'): Promise<SocialPublishResult> {
    if (typeof payload.content !== 'string' || !payload.content.trim()) throw new Error('Post content cannot be empty.');
    if (!Array.isArray(payload.channels) || !payload.channels.length) throw new Error('Select a connected social channel.');
    if (!this.isConfigured()) throw new Error('Connect a social publishing provider before sending a post.');
    const targetChannels = [...new Set(payload.channels)];
    let integrations: Integration[] = [];
    let receipts: Array<{ postId: string; integration: string }> = [];
    try {
      integrations = await this.integrations();
      const selected = targetChannels.map(id => integrations.find(item => item.id === id && !item.disabled));
      if (selected.some(item => !item)) throw new Error('A selected channel is unavailable. Reconnect it before posting.');
      if (selected.some(item => (item!.identifier || item!.providerIdentifier || '').startsWith('instagram')) && !payload.media?.length) throw new Error('Instagram posts require an image or video.');
      const media = [];
      for (const item of payload.media || []) media.push(await this.upload(item));
      const result = await this.request('/posts', {
        type, date: type === 'schedule' ? payload.scheduledFor : new Date().toISOString(), shortLink: false, tags: [],
        posts: selected.map(item => {
          const identifier = item!.identifier || item!.providerIdentifier!;
          return { integration: { id: item!.id }, value: [{ content: payload.content.trim(), image: media }],
            settings: { __type: identifier, ...(identifier.startsWith('instagram') ? { post_type: 'post' } : {}) } };
        }),
      });
      if (Array.isArray(result)) receipts = result.filter(item => typeof item?.postId === 'string' && item.postId && typeof item.integration === 'string');
      if (!targetChannels.every(id => receipts.some(item => item.integration === id))) throw new Error('The publishing provider returned no complete receipt. Check the provider before retrying.');
      return {
        success: true, id: receipts[0].postId, status: type === 'now' ? 'queued' : type === 'schedule' ? 'scheduled' : 'drafted',
        scheduledFor: type === 'schedule' ? payload.scheduledFor : undefined, targetChannels,
        channelResults: targetChannels.map(id => ({ channelId: id, platform: (integrations.find(item => item.id === id)?.identifier || integrations.find(item => item.id === id)?.providerIdentifier || '').startsWith('linkedin') ? 'linkedin' : 'instagram', status: type === 'now' ? 'pending' : 'success', postId: receipts.find(item => item.integration === id)!.postId })),
        timestamp: new Date().toISOString(),
      };
    } catch (cause) {
      const error = cause instanceof Error && /^(Social scheduler responded|A selected channel|Instagram posts|The publishing provider|Use a PNG|The provider returned)/.test(cause.message) ? cause.message : 'Publishing failed. Check the provider before retrying.';
      return { success: false, id: receipts[0]?.postId || '', status: 'failed', targetChannels,
        channelResults: targetChannels.map(id => ({ channelId: id, platform: (integrations.find(item => item.id === id)?.identifier || integrations.find(item => item.id === id)?.providerIdentifier || '').startsWith('linkedin') ? 'linkedin' : 'instagram', status: receipts.some(item => item.integration === id) ? 'pending' : 'failed', postId: receipts.find(item => item.integration === id)?.postId, error })),
        error, timestamp: new Date().toISOString() };
    }
  }
}
