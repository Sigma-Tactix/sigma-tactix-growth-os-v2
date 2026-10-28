import type {
  SocialDistributionProvider,
  SocialDistributionProviderStatus,
  SocialChannel,
  SocialPostPayload,
  SocialPublishResult,
  SocialPlatform,
  ChannelPublishOutcome,
} from './types.js';

export interface SocialSchedulerConfig {
  apiUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

const DEFAULT_SUPPORTED_PLATFORMS: SocialPlatform[] = [
  'linkedin',
  'twitter',
  'instagram',
  'youtube',
  'threads',
  'bluesky',
  'tiktok',
  'facebook',
];

const MOCK_CHANNELS: SocialChannel[] = [
  {
    id: 'chan-li-01',
    name: 'Growth OS LinkedIn Corporate',
    platform: 'linkedin',
    handle: '@growth-os-hq',
    connected: true,
    status: 'active',
  },
  {
    id: 'chan-tw-01',
    name: 'Growth OS X Business',
    platform: 'twitter',
    handle: '@growth_os',
    connected: true,
    status: 'active',
  },
  {
    id: 'chan-ig-01',
    name: 'Growth OS Visual Studio',
    platform: 'instagram',
    handle: '@growthos.ai',
    connected: true,
    status: 'active',
  },
  {
    id: 'chan-yt-01',
    name: 'Growth OS Media Shorts',
    platform: 'youtube',
    handle: '@growth-os-media',
    connected: true,
    status: 'active',
  },
];

export class SocialSchedulerAdapter implements SocialDistributionProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(config?: SocialSchedulerConfig) {
    this.apiUrl = (
      config?.apiUrl ||
      process.env.SOCIAL_SCHEDULER_API_URL ||
      process.env.POSTIZ_API_URL ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
    this.apiKey =
      config?.apiKey ||
      process.env.SOCIAL_SCHEDULER_API_KEY ||
      process.env.POSTIZ_API_KEY ||
      '';
    this.timeoutMs = config?.timeoutMs ?? 5000;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiUrl);
  }

  async getStatus(): Promise<SocialDistributionProviderStatus> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        active: false,
        endpointUrl: this.apiUrl,
        connectedChannelsCount: MOCK_CHANNELS.length,
        supportedPlatforms: DEFAULT_SUPPORTED_PLATFORMS,
        mode: 'mock_offline',
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(`${this.apiUrl}/api/v1/integrations`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (res.ok) {
        const integrations = (await res.json()) as Array<{ id: string; providerIdentifier?: string }>;
        return {
          configured: true,
          active: true,
          endpointUrl: this.apiUrl,
          connectedChannelsCount: Array.isArray(integrations) ? integrations.length : 0,
          supportedPlatforms: DEFAULT_SUPPORTED_PLATFORMS,
          mode: 'live',
        };
      }

      return {
        configured: true,
        active: false,
        endpointUrl: this.apiUrl,
        connectedChannelsCount: 0,
        supportedPlatforms: DEFAULT_SUPPORTED_PLATFORMS,
        mode: 'mock_offline',
      };
    } catch {
      return {
        configured: true,
        active: false,
        endpointUrl: this.apiUrl,
        connectedChannelsCount: 0,
        supportedPlatforms: DEFAULT_SUPPORTED_PLATFORMS,
        mode: 'mock_offline',
      };
    }
  }

  async getChannels(): Promise<SocialChannel[]> {
    if (!this.isConfigured()) {
      return MOCK_CHANNELS;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(`${this.apiUrl}/api/v1/integrations`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (!res.ok) {
        return MOCK_CHANNELS;
      }

      const raw = (await res.json()) as Array<{
        id: string;
        name?: string;
        providerIdentifier?: string;
        profile?: { name?: string; handle?: string; avatarUrl?: string };
        disabled?: boolean;
      }>;

      if (!Array.isArray(raw)) {
        return MOCK_CHANNELS;
      }

      return raw.map((item) => ({
        id: item.id,
        name: item.name || item.profile?.name || item.id,
        platform: this.normalizePlatform(item.providerIdentifier || 'webhook'),
        handle: item.profile?.handle,
        avatarUrl: item.profile?.avatarUrl,
        connected: !item.disabled,
        status: item.disabled ? 'expired' : 'active',
      }));
    } catch {
      return MOCK_CHANNELS;
    }
  }

  async createDraft(payload: SocialPostPayload): Promise<SocialPublishResult> {
    return this.dispatchPost(payload, 'draft');
  }

  async schedulePost(payload: SocialPostPayload): Promise<SocialPublishResult> {
    if (!payload.scheduledFor) {
      throw new Error('scheduledFor timestamp is required when scheduling a social post.');
    }
    return this.dispatchPost(payload, 'scheduled');
  }

  async publishNow(payload: SocialPostPayload): Promise<SocialPublishResult> {
    return this.dispatchPost(payload, 'immediate');
  }

  private async dispatchPost(
    payload: SocialPostPayload,
    mode: 'draft' | 'scheduled' | 'immediate',
  ): Promise<SocialPublishResult> {
    if (!payload.content || !payload.content.trim()) {
      throw new Error('Post content cannot be empty.');
    }

    const targetChannels = payload.channels.length > 0 ? payload.channels : ['chan-li-01'];

    // In mock_offline mode, simulate high-fidelity response
    if (!this.isConfigured()) {
      const channelResults: ChannelPublishOutcome[] = targetChannels.map((cid) => ({
        channelId: cid,
        platform: this.inferPlatform(cid),
        status: 'success',
        postId: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        postUrl: `https://social.internal/posts/${cid}`,
      }));

      return {
        success: true,
        id: `sched_mock_${Date.now()}`,
        status: mode === 'immediate' ? 'published' : mode === 'scheduled' ? 'scheduled' : 'drafted',
        scheduledFor: payload.scheduledFor,
        targetChannels,
        channelResults,
        timestamp: new Date().toISOString(),
      };
    }

    // In live mode, call scheduler REST API
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const requestBody = {
        content: payload.content,
        integrations: targetChannels,
        media: payload.media?.map((m) => ({ url: m.url, type: m.type, alt: m.altText })),
        scheduledFor: payload.scheduledFor,
        isDraft: mode === 'draft',
        publishNow: mode === 'immediate',
      };

      const res = await fetch(`${this.apiUrl}/api/v1/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Social scheduler responded with HTTP ${res.status}: ${errorText}`);
      }

      const resData = (await res.json()) as { id?: string; status?: string };

      return {
        success: true,
        id: resData.id || `post_${Date.now()}`,
        status: mode === 'immediate' ? 'published' : mode === 'scheduled' ? 'scheduled' : 'drafted',
        scheduledFor: payload.scheduledFor,
        targetChannels,
        channelResults: targetChannels.map((cid) => ({
          channelId: cid,
          platform: this.inferPlatform(cid),
          status: 'success',
          postId: resData.id,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        id: `failed_${Date.now()}`,
        status: 'failed',
        scheduledFor: payload.scheduledFor,
        targetChannels,
        channelResults: targetChannels.map((cid) => ({
          channelId: cid,
          platform: this.inferPlatform(cid),
          status: 'failed',
          error: errorMessage,
        })),
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private normalizePlatform(identifier: string): SocialPlatform {
    const lower = identifier.toLowerCase();
    if (lower.includes('linkedin')) return 'linkedin';
    if (lower.includes('twitter') || lower.includes('x')) return 'twitter';
    if (lower.includes('instagram')) return 'instagram';
    if (lower.includes('youtube')) return 'youtube';
    if (lower.includes('threads')) return 'threads';
    if (lower.includes('bluesky')) return 'bluesky';
    if (lower.includes('tiktok')) return 'tiktok';
    if (lower.includes('facebook')) return 'facebook';
    if (lower.includes('pinterest')) return 'pinterest';
    return 'webhook';
  }

  private inferPlatform(channelId: string): SocialPlatform {
    const found = MOCK_CHANNELS.find((c) => c.id === channelId);
    if (found) return found.platform;
    return this.normalizePlatform(channelId);
  }
}
