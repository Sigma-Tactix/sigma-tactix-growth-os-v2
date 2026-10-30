import { Router, type Request, type Response } from 'express';
import type { GoogleAdsMcpStatus } from '../googleAdsMcpService.js';

interface GoogleAdsMcpRouterDeps {
  expensiveLimiter: any;
  authorize: (res: Response) => Promise<boolean>;
  getStatus: () => Promise<GoogleAdsMcpStatus>;
  listCustomers: (res: Response) => Promise<{ customers: string[]; verified: boolean; checkedAt: string }>;
}

export function createGoogleAdsMcpRouter(deps: GoogleAdsMcpRouterDeps): Router {
  const router = Router();

  router.use(async (_req, res, next) => {
    if (!await deps.authorize(res)) {
      res.status(403).json({ error: 'Google Ads MCP requires the bound workspace owner or admin.' }); return;
    }
    next();
  });

  router.get('/status', async (_req: Request, res: Response) => {
    res.json({ success: true, status: await deps.getStatus() });
  });

  router.post('/customers', deps.expensiveLimiter, async (_req: Request, res: Response) => {
    try {
      res.json({ success: true, ...(await deps.listCustomers(res)) });
    } catch (error: any) {
      res.status(422).json({
        success: false,
        error: error?.message || 'Google Ads MCP customer discovery failed.',
      });
    }
  });

  return router;
}
