import { Router, type Request, type Response } from 'express';
import type { GoogleAdsMcpStatus } from '../googleAdsMcpService.js';

interface GoogleAdsMcpRouterDeps {
  expensiveLimiter: any;
  getStatus: () => Promise<GoogleAdsMcpStatus>;
  listCustomers: () => Promise<{ customers: string[]; verified: boolean; checkedAt: string }>;
}

export function createGoogleAdsMcpRouter(deps: GoogleAdsMcpRouterDeps): Router {
  const router = Router();

  router.get('/status', async (_req: Request, res: Response) => {
    res.json({ success: true, status: await deps.getStatus() });
  });

  router.post('/customers', deps.expensiveLimiter, async (_req: Request, res: Response) => {
    try {
      res.json({ success: true, ...(await deps.listCustomers()) });
    } catch (error: any) {
      res.status(422).json({
        success: false,
        error: error?.message || 'Google Ads MCP customer discovery failed.',
      });
    }
  });

  return router;
}
