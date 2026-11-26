import { Router, type Request, type Response } from 'express';
import { encryptCredentials } from '../../lib/credentialCrypto.js';
import { executeConnectorReconciliation } from '../../lib/sourceOperations.js';
import {
  getConnectorAdapter,
  hasConnectorAdapter,
  getStoredCredentials,
  RECONCILIATION_KEYS,
} from '../connectorAdapters.js';
import type { WorkspaceData } from '../../types.js';

// ---------------------------------------------------------------------------
// Connectors — connect (or re-verify) a connector against its live platform,
// disconnect it, and run dynamic multi-platform reconciliation to catch
// credential rot (expired tokens, revoked keys).
//
// Extracted from server.ts (P2 increment 7 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). The ~30 platform validators + publish
// adapters + credential helper that these routes call were hoisted out of the
// monolith into the SHARED module ../connectorAdapters.ts so that this router
// and the still-inline pipelines/creative routes both consume one copy.
//
// The request-scoped getDB/saveDB (RLS-scoped Supabase client + workspace id)
// and the fail-closed tier gate requireModule are INJECTED from server.ts,
// which owns them. Mounted under /api/workspace AFTER the global
// app.use("/api/workspace", requireAuth), so auth semantics are unchanged;
// /run-reconciliation keeps its reporting tier gate (now a per-route
// requireModule inside the router, as it was inline).
// ---------------------------------------------------------------------------

export interface ConnectorsRouterDeps {
  getDB: (res: Response) => Promise<WorkspaceData>;
  saveDB: (res: Response, data: WorkspaceData) => Promise<void>;
  requireModule: (mod: string) => any;
}

export function createConnectorsRouter(deps: ConnectorsRouterDeps): Router {
  const router = Router();
  const { getDB, saveDB, requireModule } = deps;

  // Connect (or re-verify) a connector: validate the submitted credentials
  // against the live platform, then persist status + encrypted credentials
  // as one atomic write. Never echoes credentials back to the client.
  router.post('/connectors/:id/connect', async (req: Request, res: Response) => {
    const { id } = req.params;
    const credentials = (req.body?.credentials || {}) as Record<string, any>;
    const db = await getDB(res);
    const connector = db.secondBrain.connectors.find(c => c.id === id);
    if (!connector) {
      res.status(404).json({ error: "Connector not found" });
      return;
    }

    if (!hasConnectorAdapter(connector.platform)) {
      connector.status = 'Disconnected';
      connector.verificationState = 'unsupported';
      connector.verificationError = `Live account verification is not implemented for ${connector.platform}.`;
      await saveDB(res, db);
      res.status(422).json({
        success: false,
        verified: false,
        error: connector.verificationError,
        code: 'UNSUPPORTED_CONNECTOR',
      });
      return;
    }

    let verified = false;
    let verificationError = '';
    try {
      verified = await getConnectorAdapter(connector.platform)(credentials);
    } catch (err) {
      console.error(`Connector validation failed for ${connector.platform}:`, err);
      verified = false;
      verificationError = err instanceof Error ? err.message : 'Provider verification failed.';
    }

    if (!verified) {
      connector.status = 'Disconnected';
      connector.verificationState = 'failed';
      connector.verificationError = verificationError || 'The provider rejected these credentials or account details.';
      // Do not replace a previously verified secret with an invalid submission.
      await saveDB(res, db);
      const { credentials: _omit, ...safeConnector } = connector;
      res.status(422).json({
        success: false,
        connector: safeConnector,
        verified: false,
        error: connector.verificationError,
        code: 'CONNECTOR_VERIFICATION_FAILED',
      });
      return;
    }

    connector.status = 'Connected';
    connector.verificationState = 'verified';
    connector.verificationError = undefined;
    connector.verifiedAt = new Date().toISOString();
    connector.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    connector.credentials = Object.keys(credentials).length > 0
      ? { encrypted: encryptCredentials(credentials) }
      : undefined;

    await saveDB(res, db);
    const { credentials: _omit, ...safeConnector } = connector;
    res.json({ success: true, connector: safeConnector, verified });
  });

  // Disconnect a connector: clear its credentials, no live validation needed.
  router.post('/connectors/:id/disconnect', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await getDB(res);
    const connector = db.secondBrain.connectors.find(c => c.id === id);
    if (!connector) {
      res.status(404).json({ error: "Connector not found" });
      return;
    }

    connector.status = 'Disconnected';
    connector.verificationState = 'disconnected';
    connector.verificationError = undefined;
    connector.credentials = undefined;
    await saveDB(res, db);
    const { credentials: _omit, ...safeConnector } = connector;
    res.json({ success: true, connector: safeConnector });
  });

  // Dynamic Multi-Platform Reconciliation — re-runs the same adapters used at
  // connect time to catch credential rot (expired tokens, revoked keys).
  // Tier-gated on the reporting module (as it was inline).
  router.post('/run-reconciliation', requireModule('reporting'), async (req: Request, res: Response) => {
    const db = await getDB(res);
    const connectors = db.secondBrain.connectors || [];

    const reconciliation: Record<string, string | number> = {};
    const reconciliationDetails: Record<string, any> = {};
    let dbChanged = false;

    for (const [platform, key] of Object.entries(RECONCILIATION_KEYS)) {
      const conn = connectors.find(c => c.platform === platform);
      if (!conn || conn.status !== 'Connected') {
        reconciliation[key as string] = 'Disconnected';
        continue;
      }

      try {
        const outcome = await executeConnectorReconciliation(conn, getStoredCredentials(conn));
        reconciliation[key as string] = outcome.status;
        reconciliationDetails[platform] = {
          status: outcome.status,
          message: outcome.message,
          reconciledAt: outcome.reconciledAt,
        };

        if (outcome.updatedConnectorState) {
          Object.assign(conn, outcome.updatedConnectorState);
          dbChanged = true;
        }
      } catch (err) {
        reconciliation[key as string] = 'Mismatch';
        reconciliationDetails[platform] = {
          status: 'Mismatch',
          message: err instanceof Error ? err.message : 'Reconciliation probe failed.',
          reconciledAt: new Date().toISOString(),
        };
      }
    }

    if (dbChanged) {
      await saveDB(res, db);
    }

    reconciliation.discrepancyCount = Object.values(reconciliation).filter(s => s !== 'Synced' && s !== 'Disconnected').length;

    res.json({ success: true, reconciliation, details: reconciliationDetails });
  });

  return router;
}
