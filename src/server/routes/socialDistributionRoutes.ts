import { Router, type Request, type Response } from 'express';
import type {
  SocialDistributionProvider,
  SocialPostPayload,
} from '../providers/socialDistribution/types.js';

export interface SocialDistributionRouterDeps {
  provider: SocialDistributionProvider;
  expensiveLimiter?: any;
}

export function createSocialDistributionRouter(deps: SocialDistributionRouterDeps): Router {
  const router = Router();
  const limiter = deps.expensiveLimiter || ((_req: Request, _res: Response, next: any) => next());

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

  // POST /api/social/draft
  router.post('/draft', limiter, async (req: Request, res: Response) => {
    const payload = req.body as SocialPostPayload;
    if (!payload?.content || !payload.content.trim()) {
      res.status(400).json({ success: false, error: 'Post content is required' });
      return;
    }

    try {
      const result = await deps.provider.createDraft({
        ...payload,
        content: payload.content.trim(),
        channels: Array.isArray(payload.channels) ? payload.channels : [],
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(422).json({ success: false, error: err?.message || 'Failed to create social post draft' });
    }
  });

  // POST /api/social/schedule
  router.post('/schedule', limiter, async (req: Request, res: Response) => {
    const payload = req.body as SocialPostPayload;
    if (!payload?.content || !payload.content.trim()) {
      res.status(400).json({ success: false, error: 'Post content is required' });
      return;
    }
    if (!payload.scheduledFor) {
      res.status(400).json({ success: false, error: 'scheduledFor ISO timestamp is required to schedule a post' });
      return;
    }

    try {
      const result = await deps.provider.schedulePost({
        ...payload,
        content: payload.content.trim(),
        channels: Array.isArray(payload.channels) ? payload.channels : [],
        scheduledFor: payload.scheduledFor,
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(422).json({ success: false, error: err?.message || 'Failed to schedule social post' });
    }
  });

  // POST /api/social/publish
  router.post('/publish', limiter, async (req: Request, res: Response) => {
    const payload = req.body as SocialPostPayload;
    if (!payload?.content || !payload.content.trim()) {
      res.status(400).json({ success: false, error: 'Post content is required' });
      return;
    }

    try {
      const result = await deps.provider.publishNow({
        ...payload,
        content: payload.content.trim(),
        channels: Array.isArray(payload.channels) ? payload.channels : [],
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(422).json({ success: false, error: err?.message || 'Failed to publish social post' });
    }
  });

  return router;
}
