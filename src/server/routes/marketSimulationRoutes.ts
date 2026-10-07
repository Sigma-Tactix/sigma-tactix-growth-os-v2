import { Router, type Request, type Response } from 'express';
import type { MarketSimulationProvider, ScenarioEvidencePack, SimulationRef } from '../providers/marketSimulation/types.js';

export interface MarketSimulationRouterDeps {
  provider: MarketSimulationProvider;
  expensiveLimiter?: any;
}

export function createMarketSimulationRouter(deps: MarketSimulationRouterDeps): Router {
  const router = Router();
  const limiter = deps.expensiveLimiter || ((_req: Request, _res: Response, next: any) => next());

  // GET /api/workspace/market-simulations/capabilities
  router.get('/capabilities', async (_req: Request, res: Response) => {
    try {
      const capabilities = await deps.provider.capabilities();
      res.json({ success: true, capabilities });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to query capabilities' });
    }
  });

  // POST /api/workspace/market-simulations/verify
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

  // POST /api/workspace/market-simulations/simulations
  router.post('/simulations', limiter, async (req: Request, res: Response) => {
    const { title, question, evidenceSnapshotIds, assumptions, excludedDataClasses } = req.body as ScenarioEvidencePack;
    if (!title || !question) {
      res.status(400).json({ success: false, error: 'Scenario title and question are required' });
      return;
    }
    try {
      const ref = await deps.provider.create({
        title: title.trim(),
        question: question.trim(),
        evidenceSnapshotIds: Array.isArray(evidenceSnapshotIds) ? evidenceSnapshotIds : [],
        assumptions: Array.isArray(assumptions) ? assumptions : [],
        excludedDataClasses: Array.isArray(excludedDataClasses) ? excludedDataClasses : [],
      });

      let report = null;
      if (typeof deps.provider.generateReport === 'function') {
        report = await deps.provider.generateReport(ref);
      }

      res.json({ success: true, ref, report });
    } catch (err: any) {
      res.status(422).json({ success: false, error: err?.message || 'Simulation creation failed' });
    }
  });

  return router;
}
