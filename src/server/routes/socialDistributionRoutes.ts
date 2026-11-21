import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { assertPublicHost } from '../agentReachService.js';
import type {
  SocialDistributionProvider,
  SocialPostPayload,
} from '../providers/socialDistribution/types.js';

export interface SocialDistributionRouterDeps {
  provider: SocialDistributionProvider;
  expensiveLimiter?: any;
  requireWorkspaceBinding?: boolean;
  workspaceId?: string;
}

export function createSocialDistributionRouter(deps: SocialDistributionRouterDeps): Router {
  const router = Router();
  const limiter = deps.expensiveLimiter || ((_req: Request, _res: Response, next: any) => next());

  router.use((_req, res, next) => {
    if (!deps.requireWorkspaceBinding) return next();
    const configured = (deps.provider as SocialDistributionProvider & { isConfigured?: () => boolean }).isConfigured?.() ?? true;
    if (!configured) return next();
    if (!deps.workspaceId) {
      res.status(503).json({ success: false, error: 'Assign this publishing connection to a Client Enclave before use.' });
      return;
    }
    if (res.locals.wsId !== deps.workspaceId) {
      res.status(403).json({ success: false, error: 'This publishing connection belongs to another Client Enclave.' });
      return;
    }
    next();
  });

  // GET /api/social/status
  router.get('/status', async (_req: Request, res: Response) => {
    try {
      const status = await deps.provider.getStatus();
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to query social provider status' });
    }
  });

  // GET /api/social/channels
  router.get('/channels', async (_req: Request, res: Response) => {
    try {
      const channels = await deps.provider.getChannels();
      res.json({ success: true, channels });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to list social channels' });
    }
  });

  const postSchema = z.object({
    content: z.string().trim().min(1, 'Post content is required').max(63_206),
    channels: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
    media: z.array(z.object({
      url: z.string().max(4_000_000).refine(value => /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) || z.url({ protocol: /^https$/ }).safeParse(value).success),
      type: z.enum(['image', 'video', 'document']),
      thumbnailUrl: z.url({ protocol: /^https$/ }).optional(),
      altText: z.string().max(2000).optional(),
    }).strict()).max(20).optional(),
    title: z.string().max(300).optional(),
    scheduledFor: z.iso.datetime({ offset: true }).optional(),
    campaignId: z.string().max(200).optional(),
    missionId: z.string().max(200).optional(),
    requiresApproval: z.boolean().optional(),
    tags: z.array(z.string().max(100)).max(30).optional(),
  }).strict();

  const handlePost = (mode: 'draft' | 'schedule' | 'publish') => async (req: Request, res: Response) => {
      if (mode === 'schedule' && !req.body?.scheduledFor) {
        res.status(400).json({ success: false, error: 'scheduledFor ISO timestamp is required to schedule a post' });
        return;
      }
      const parsed = postSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid social post. Check content, channels, media and scheduledFor.' });
        return;
      }
      if (mode === 'schedule' && Date.parse(parsed.data.scheduledFor!) <= Date.now()) {
        res.status(400).json({ success: false, error: 'scheduledFor must be in the future.' });
        return;
      }
      const payload: SocialPostPayload = parsed.data;
      try {
        for (const media of payload.media || []) {
          if (!media.url.startsWith('data:')) await assertPublicHost(media.url);
          if (media.thumbnailUrl) await assertPublicHost(media.thumbnailUrl);
        }
      } catch {
        res.status(400).json({ success: false, error: 'Media must use publicly reachable HTTPS URLs.' });
        return;
      }
      try {
        const result = mode === 'draft' ? await deps.provider.createDraft(payload)
          : mode === 'schedule' ? await deps.provider.schedulePost(payload)
          : await deps.provider.publishNow(payload);
        res.status(result.success ? 200 : 502).json({ success: result.success, result });
      } catch (err: unknown) {
        res.status(422).json({ success: false, error: err instanceof Error ? err.message : 'Social publishing failed.' });
      }
  };
  router.post('/draft', limiter, handlePost('draft'));
  router.post('/schedule', limiter, handlePost('schedule'));
  router.post('/publish', limiter, handlePost('publish'));

  return router;
}
