import { Router, type Request, type Response } from 'express';
import type { WebIntelligenceProvider, SearchRequest, FetchRequest } from '../providers/webIntelligence/types.js';

export interface WebIntelligenceRouterDeps {
  provider: WebIntelligenceProvider;
  expensiveLimiter?: any;
}

export function createWebIntelligenceRouter(deps: WebIntelligenceRouterDeps): Router {
  const router = Router();
  const limiter = deps.expensiveLimiter || ((_req: Request, _res: Response, next: any) => next());

  // GET /api/workspace/web-intelligence/capabilities
  router.get('/capabilities', async (_req: Request, res: Response) => {
    try {
      const capabilities = await deps.provider.capabilities();
      res.json({ success: true, capabilities });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to query capabilities' });
    }
  });

  // POST /api/workspace/web-intelligence/verify
  router.post('/verify', async (_req: Request, res: Response) => {
    try {
      if (typeof deps.provider.verify === 'function') {
        const verified = await deps.provider.verify();
        const capabilities = await deps.provider.capabilities();
        res.json({ success: true, verified, capabilities });
      } else {
        const capabilities = await deps.provider.capabilities();
        res.json({ success: true, verified: capabilities.verified, capabilities });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Verification failed' });
    }
  });

  // POST /api/workspace/web-intelligence/search
  router.post('/search', limiter, async (req: Request, res: Response) => {
    const { query, maxResults, location, language } = req.body as SearchRequest;
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }
    try {
      const results = await deps.provider.search({
        query: query.trim(),
        maxResults: typeof maxResults === 'number' ? maxResults : 10,
        location,
        language,
      });
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(422).json({ success: false, error: err?.message || 'Web intelligence search failed' });
    }
  });

  // POST /api/workspace/web-intelligence/fetch
  router.post('/fetch', limiter, async (req: Request, res: Response) => {
    const { urls, format } = req.body as FetchRequest;
    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ success: false, error: 'Provide at least one URL to fetch' });
      return;
    }
    try {
      const results = await deps.provider.fetch({
        urls,
        format: format || 'markdown',
      });
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(422).json({ success: false, error: err?.message || 'Web intelligence fetch failed' });
    }
  });

  return router;
}
