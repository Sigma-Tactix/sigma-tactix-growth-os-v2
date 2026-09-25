import { Router, type Response } from 'express';
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

  router.get('/', async (_req, res) => {
    const [workspace, decisionRuntime, externalProviders] = await Promise.all([
      deps.getWorkspace(res),
      deps.getDecisionRuntimeStatus(),
      deps.getExternalProviderCapabilities(),
    ]);
    res.json(deps.buildCapabilityRegistry(workspace, decisionRuntime, externalProviders));
  });

  return router;
}
