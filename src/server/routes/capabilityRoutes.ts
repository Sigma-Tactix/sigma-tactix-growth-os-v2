import { Router, type Response, type Request } from 'express';
import type { WorkspaceData } from '../../types';
import type { CapabilityRegistry } from '../../lib/capabilityRegistry';
import type { ExternalProviderCapability } from '../../lib/capabilityRegistry';
import type { DecisionRuntimeStatus } from '../../lib/decisionEngine';

interface CapabilityRouterDeps {
  getWorkspace: (res: Response) => Promise<WorkspaceData>;
  getDecisionRuntimeStatus: () => Promise<DecisionRuntimeStatus>;
  getExternalProviderCapabilities: () => Promise<ExternalProviderCapability[]>;
  buildCapabilityRegistry: (workspace: WorkspaceData, decisionRuntime?: DecisionRuntimeStatus, externalProviders?: ExternalProviderCapability[]) => CapabilityRegistry;
}

export function createCapabilityRouter(deps: CapabilityRouterDeps): Router {
  const router = Router();

  // GET /api/workspace/capabilities — full registry snapshot
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const [workspace, decisionRuntime, externalProviders] = await Promise.all([
        deps.getWorkspace(res),
        deps.getDecisionRuntimeStatus(),
        deps.getExternalProviderCapabilities(),
      ]);
      res.json(deps.buildCapabilityRegistry(workspace, decisionRuntime, externalProviders));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to build capability registry' });
    }
  });

  // GET /api/workspace/capabilities/operations — operation-level capabilities (S08-A1)
  router.get('/operations', async (req: Request, res: Response) => {
    try {
      const [workspace, decisionRuntime, externalProviders] = await Promise.all([
        deps.getWorkspace(res),
        deps.getDecisionRuntimeStatus(),
        deps.getExternalProviderCapabilities(),
      ]);
      const registry = deps.buildCapabilityRegistry(workspace, decisionRuntime, externalProviders);
      let ops = registry.operations;

      if (req.query.moduleKey) {
        ops = ops.filter(o => o.moduleKey === req.query.moduleKey);
      }
      if (req.query.verified === 'true') {
        ops = ops.filter(o => o.verified);
      } else if (req.query.verified === 'false') {
        ops = ops.filter(o => !o.verified);
      }
      if (req.query.freshness) {
        ops = ops.filter(o => o.freshness === req.query.freshness);
      }

      res.json({
        total: ops.length,
        operations: ops,
        summary: registry.operationsSummary,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to list operation capabilities' });
    }
  });

  // GET /api/workspace/capabilities/receipts — operation verification receipts (S08-A2)
  router.get('/receipts', async (_req: Request, res: Response) => {
    try {
      const [workspace, decisionRuntime, externalProviders] = await Promise.all([
        deps.getWorkspace(res),
        deps.getDecisionRuntimeStatus(),
        deps.getExternalProviderCapabilities(),
      ]);
      const registry = deps.buildCapabilityRegistry(workspace, decisionRuntime, externalProviders);
      const receipts = registry.operations
        .filter(o => Boolean(o.receipt))
        .map(o => o.receipt!);

      res.json({
        total: receipts.length,
        receipts,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to retrieve capability receipts' });
    }
  });

  return router;
}
