import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SocialSchedulerAdapter } from './socialSchedulerAdapter.js';

describe('SocialSchedulerAdapter', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Offline Mock Mode (Unconfigured)', () => {
    it('reports mock_offline mode when API key is missing', async () => {
      const adapter = new SocialSchedulerAdapter({
        apiUrl: 'http://localhost:3000',
        apiKey: '',
      });

      expect(adapter.isConfigured()).toBe(false);

      const status = await adapter.getStatus();
      expect(status.configured).toBe(false);
      expect(status.mode).toBe('mock_offline');
      expect(status.connectedChannelsCount).toBeGreaterThan(0);
      expect(status.supportedPlatforms).toContain('linkedin');
      expect(status.supportedPlatforms).toContain('youtube');
    });

    it('returns default mock channels for development testing', async () => {
      const adapter = new SocialSchedulerAdapter({ apiKey: '' });
      const channels = await adapter.getChannels();

      expect(channels.length).toBeGreaterThanOrEqual(4);
      expect(channels.some((c) => c.platform === 'linkedin')).toBe(true);
      expect(channels.some((c) => c.platform === 'twitter')).toBe(true);
      expect(channels.some((c) => c.platform === 'instagram')).toBe(true);
      expect(channels.some((c) => c.platform === 'youtube')).toBe(true);
    });

    it('creates a draft post in offline mode', async () => {
      const adapter = new SocialSchedulerAdapter({ apiKey: '' });
      const result = await adapter.createDraft({
        content: 'Autonomous AI Growth Playbook launch #growth',
        channels: ['chan-li-01'],
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('drafted');
      expect(result.id).toMatch(/^sched_mock_/);
      expect(result.channelResults[0].platform).toBe('linkedin');
    });

    it('schedules a post with valid timestamp in offline mode', async () => {
      const adapter = new SocialSchedulerAdapter({ apiKey: '' });
      const isoTime = '2026-10-15T14:30:00Z';
      const result = await adapter.schedulePost({
        content: 'Announcing Q4 Growth OS updates',
        channels: ['chan-tw-01', 'chan-li-01'],
        scheduledFor: isoTime,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('scheduled');
      expect(result.scheduledFor).toBe(isoTime);
      expect(result.channelResults.length).toBe(2);
    });

    it('immediately publishes a post in offline mode', async () => {
      const adapter = new SocialSchedulerAdapter({ apiKey: '' });
      const result = await adapter.publishNow({
        content: 'Flash market alert for paid acquisition operators',
        channels: ['chan-tw-01'],
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('published');
    });

    it('rejects post when scheduledFor is missing', async () => {
      const adapter = new SocialSchedulerAdapter({ apiKey: '' });
      await expect(
        adapter.schedulePost({
          content: 'Missing timestamp post',
          channels: ['chan-li-01'],
        }),
      ).rejects.toThrow(/scheduledFor timestamp is required/);
    });

    it('rejects post when content is empty or blank', async () => {
      const adapter = new SocialSchedulerAdapter({ apiKey: '' });
      await expect(
        adapter.createDraft({
          content: '   ',
          channels: ['chan-li-01'],
        }),
      ).rejects.toThrow(/Post content cannot be empty/);
    });
  });

  describe('Live Mode (Configured)', () => {
    it('probes live integrations and reports live mode on 200 OK', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'int_1' }, { id: 'int_2' }],
      } as unknown as Response);

      const adapter = new SocialSchedulerAdapter({
        apiUrl: 'http://scheduler.internal:4000',
        apiKey: 'secret_token_123',
      });

      expect(adapter.isConfigured()).toBe(true);

      const status = await adapter.getStatus();
      expect(status.mode).toBe('live');
      expect(status.active).toBe(true);
      expect(status.connectedChannelsCount).toBe(2);
    });

    it('maps live integrations to normalized SocialChannels', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'chan_live_li',
            name: 'LinkedIn Official',
            providerIdentifier: 'linkedin',
            profile: { handle: '@official_li', avatarUrl: 'https://cdn/li.png' },
            disabled: false,
          },
        ],
      } as unknown as Response);

      const adapter = new SocialSchedulerAdapter({
        apiUrl: 'http://scheduler.internal:4000',
        apiKey: 'secret_token_123',
      });

      const channels = await adapter.getChannels();
      expect(channels.length).toBe(1);
      expect(channels[0].id).toBe('chan_live_li');
      expect(channels[0].platform).toBe('linkedin');
      expect(channels[0].handle).toBe('@official_li');
      expect(channels[0].status).toBe('active');
    });

    it('dispatches scheduled post to live REST endpoint with bearer token', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'remote_post_999' }),
      } as unknown as Response);
      globalThis.fetch = mockFetch;

      const adapter = new SocialSchedulerAdapter({
        apiUrl: 'http://scheduler.internal:4000',
        apiKey: 'secret_token_123',
      });

      const result = await adapter.schedulePost({
        content: 'Live dispatched post',
        channels: ['chan_live_li'],
        scheduledFor: '2026-10-18T10:00:00Z',
        media: [{ url: 'https://cdn/slide1.png', type: 'image' }],
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('remote_post_999');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://scheduler.internal:4000/api/v1/posts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer secret_token_123',
          }),
        }),
      );
    });

    it('captures live API error safely without crashing', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized credential token',
      } as unknown as Response);

      const adapter = new SocialSchedulerAdapter({
        apiUrl: 'http://scheduler.internal:4000',
        apiKey: 'invalid_token',
      });

      const result = await adapter.publishNow({
        content: 'Failing post test',
        channels: ['chan_live_li'],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('401');
      expect(result.channelResults[0].status).toBe('failed');
    });
  });
});
