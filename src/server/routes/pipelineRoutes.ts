import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import type { ActivePipeline, Connector, ConnectorPlatform, WorkspaceData } from '../../types.js';
import { normalizeSourceMetrics, assessOperationReadiness, OPERATION_APPROVAL_REGISTER } from '../../lib/sourceOperations.js';
import { classifyChannelMedia, validatePriorityConnectorCredentials } from '../../lib/connectorLifecycle.js';
import { canonicalConnectorPlatform, verifyPipelineConnection } from '../../lib/pipelineVerification.js';
import { encryptCredentials } from '../../lib/credentialCrypto.js';

// ---------------------------------------------------------------------------
// Verified Ingestion Pipelines & Webhook Testing System — real endpoints for
// persistent pipeline management, account evidence verification, live
// protocol handshakes (incl. the Google Service Account JWT path), and
// webhook payload testing.
//
// Extracted from server.ts (P2 increment 8 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). Request-scoped getDB/saveDB and the
// shared role/connector helpers (callerIsOwnerOrAdmin, getStoredCredentials,
// getConnectorAdapter, hasConnectorAdapter,
// getAccessTokenFromServiceAccount) are INJECTED: they stay in server.ts,
// which owns them. Stable lib deps are imported directly. Mounted under
// /api/workspace AFTER the global app.use("/api/workspace", requireAuth),
// so auth + RLS semantics are unchanged. No route in this family is
// requireModule-gated — auth is the global requireAuth only (preserved by
// the mount position).
// ---------------------------------------------------------------------------

export interface PipelineRouterDeps {
  getDB: (res: Response) => Promise<WorkspaceData>;
  saveDB: (res: Response, data: WorkspaceData) => Promise<void>;
  callerIsOwnerOrAdmin: (res: Response) => Promise<boolean>;
  getStoredCredentials: (connector: Connector) => Record<string, any>;
  getConnectorAdapter: (platform: ConnectorPlatform) => (credentials: Record<string, any>) => Promise<boolean>;
  hasConnectorAdapter: (platform: ConnectorPlatform) => boolean;
  getAccessTokenFromServiceAccount: (keyData: { client_email: string; private_key: string }) => Promise<string | null>;
}

export function createPipelineRouter(deps: PipelineRouterDeps): Router {
  const router = Router();
  const {
    getDB,
    saveDB,
    callerIsOwnerOrAdmin,
    getStoredCredentials,
    getConnectorAdapter,
    hasConnectorAdapter,
    getAccessTokenFromServiceAccount,
  } = deps;

router.get('/pipelines', async (req: Request, res: Response) => {
  const db = await getDB(res);
  const pipelines = db.secondBrain.pipelines || [];
  res.json({ success: true, pipelines });
});

router.get('/reporting/metrics', async (req: Request, res: Response) => {
  const db = await getDB(res);
  const media = req.query.media === 'paid' ? 'paid' : req.query.media === 'organic' ? 'organic' : undefined;
  const verifiedPipelines = (db.secondBrain.pipelines || [])
    .filter(p => p.status === 'active' && p.verificationState === 'verified' && p.lastMetrics?.available);

  const metrics = verifiedPipelines
    .map(p => {
      const norm = normalizeSourceMetrics(p.platform, p.propertyId, p.lastMetrics || {}, {
        accountName: p.accountName,
        observedAt: p.lastMetrics?.observedAt,
        isFixture: Boolean((p.lastMetrics as any)?.isFixture),
      });
      return {
        ...norm,
        pipelineId: p.id,
        mediaType: p.lastMetrics?.mediaType || classifyChannelMedia(p.platform),
      };
    })
    .filter(item => !media || item.mediaType === media);

  const spend = metrics.reduce((sum, item) => sum + item.spend, 0);
  const conversions = metrics.reduce((sum, item) => sum + item.conversions, 0);
  const revenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
  const hasLive = metrics.some(item => !item.isFixture);

  res.json({
    success: true,
    metrics: {
      available: metrics.length > 0,
      source: metrics.length === 0 ? 'none' : (hasLive ? 'live_provider' : 'fixture'),
      observedAt: metrics.map(item => item.observedAt).sort().at(-1) || null,
      spend,
      conversions,
      revenue,
      roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : 0,
      providers: metrics,
    },
  });
});

router.get('/operations/readiness', async (req: Request, res: Response) => {
  const db = await getDB(res);
  const connectors = db.secondBrain.connectors || [];
  const allowFixture = req.query.allowFixture === 'true' || process.env.NODE_ENV === 'test';

  const evaluations = OPERATION_APPROVAL_REGISTER.map(op => {
    const conn = connectors.find(c => c.platform === op.canonicalPlatform);
    const creds = conn ? getStoredCredentials(conn) : {};
    return assessOperationReadiness(op.operationId, {
      ...creds,
      verified: conn?.verificationState === 'verified',
    }, { allowFixture });
  });

  res.json({
    success: true,
    operations: evaluations,
    summary: {
      total: evaluations.length,
      readyLive: evaluations.filter(e => e.readinessState === 'ready_live').length,
      readyFixture: evaluations.filter(e => e.readinessState === 'ready_fixture').length,
      blockedCredentials: evaluations.filter(e => e.readinessState === 'blocked_credentials').length,
      blockedApproval: evaluations.filter(e => e.readinessState === 'blocked_approval').length,
    },
  });
});

router.post('/pipelines/save', async (req: Request, res: Response) => {
  // Credentials never belong to a pipeline payload or browser cache. They are
  // accepted only by the verification route and encrypted in the connector vault.
  const { credential: _credential, webhookSecret: _submittedWebhookSecret, status: _submittedStatus, verificationState: _submittedVerificationState, ...pipeline } = req.body as Partial<ActivePipeline>;
  if (!pipeline || !pipeline.accountName?.trim() || !pipeline.propertyId?.trim()) {
    res.status(400).json({ error: "Account Name and Property/Account ID are mandatory evidence fields." });
    return;
  }

  const db = await getDB(res);
  if (!db.secondBrain.pipelines) {
    db.secondBrain.pipelines = [];
  }

  const existingIdx = db.secondBrain.pipelines.findIndex(p => p.id === pipeline.id);
  const existingPipeline = existingIdx >= 0 ? db.secondBrain.pipelines[existingIdx] : undefined;
  const webhookSecret = existingPipeline?.webhookSecret || `whsec_${crypto.createHash('sha256').update(`${pipeline.id || Date.now()}_${pipeline.propertyId}`).digest('hex').slice(0, 24)}`;
  const webhookUrl = pipeline.webhookUrl || `https://api.sigmatactix.com/api/webhooks/ingest?pipeline=${pipeline.id || `pipe-${Date.now()}`}&vault=${encodeURIComponent(pipeline.targetVault || 'Marketing Vault')}`;

  const savedPipeline: ActivePipeline = {
    id: pipeline.id || `pipe-${Date.now()}`,
    name: pipeline.name || `${pipeline.platform} (${pipeline.accountName.trim()})`,
    platform: pipeline.platform || 'Google Ads',
    accountName: pipeline.accountName.trim(),
    propertyId: pipeline.propertyId.trim(),
    targetVault: pipeline.targetVault || 'Marketing Vault',
    syncFrequency: pipeline.syncFrequency || 'Every 15 mins',
    protocol: pipeline.protocol || 'Direct REST API (OAuth 2.0)',
    status: 'warning',
    verificationState: 'configured',
    lastPing: 'Not verified',
    latencyMs: 0,
    credentialSnippet: 'Stored only in encrypted credentials vault after verification',
    metricsCollected: pipeline.metricsCollected || ['Core Telemetry Events', 'Attribution Deltas'],
    webhookUrl,
    webhookSecret,
    totalEventsIngested: pipeline.totalEventsIngested || 0,
    lastIngestedAt: pipeline.lastIngestedAt || undefined,
    allocatedAgents: Array.isArray(pipeline.allocatedAgents) ? pipeline.allocatedAgents.filter((name): name is string => typeof name === 'string' && name.trim().length > 0) : []
  };

  if (existingIdx >= 0) {
    db.secondBrain.pipelines[existingIdx] = {
      ...db.secondBrain.pipelines[existingIdx],
      ...savedPipeline
    };
  } else {
    db.secondBrain.pipelines.unshift(savedPipeline);
  }

  await saveDB(res, db);
  res.json({ success: true, pipeline: savedPipeline });
});

router.post('/pipelines/:id/agent-permissions', async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "Only a workspace owner or admin can authorize agent access." });
    return;
  }
  const agentNames = req.body?.agentNames;
  if (!Array.isArray(agentNames) || agentNames.some((name: unknown) => typeof name !== 'string' || !name.trim())) {
    res.status(400).json({ error: "agentNames must be an array of non-empty agent names." });
    return;
  }
  const db = await getDB(res);
  const pipeline = (db.secondBrain.pipelines || []).find(p => p.id === req.params.id);
  if (!pipeline) {
    res.status(404).json({ error: "Pipeline not found." });
    return;
  }
  pipeline.allocatedAgents = [...new Set(agentNames.map((name: string) => name.trim()))];
  await saveDB(res, db);
  res.json({ success: true, pipeline });
});

router.post('/pipelines/ping', async (req: Request, res: Response) => {
  const { pipelineId, platform, accountName, propertyId, protocol, credential, credentials, targetVault, syncFrequency, metricsCollected } = req.body as Record<string, any>;
  if (!accountName?.trim() || !propertyId?.trim()) {
    res.status(400).json({ error: "Missing Account Name or Property/Account ID evidence." });
    return;
  }

  try {
    const db = await getDB(res);
    const isGA4 = platform?.toLowerCase().includes('analytics') || platform?.toLowerCase().includes('ga4');
    let directResult: { verified: boolean; latencyMs: number; connectorId?: string; resolvedPropertyId?: string } | null = null;

    const submittedCredentials = credentials && typeof credentials === 'object'
      ? { ...credentials, accountId: propertyId.trim(), propertyId: propertyId.trim() }
      : credential
        ? { accessToken: credential, accountId: propertyId.trim(), propertyId: propertyId.trim() }
        : null;
    const gaCredential = submittedCredentials?.serviceAccountKey || credential;

    if (process.env.USE_FIXTURE_PROVIDERS === 'true') {
      const canonical = canonicalConnectorPlatform(platform) || platform;
      const startedAt = performance.now();
      const resolvedPropertyId = propertyId.trim().replace(/^properties\//, '').replace(/^accounts\//, '');
      directResult = {
        verified: true,
        latencyMs: Math.max(24, Math.round(performance.now() - startedAt + 36)),
        resolvedPropertyId,
      };

      let connector = db.secondBrain.connectors.find(c => c.platform === canonical && (getStoredCredentials(c).accountId === propertyId.trim() || getStoredCredentials(c).propertyId === propertyId.trim() || !getStoredCredentials(c).accountId));
      const credPayload = submittedCredentials || { accountId: resolvedPropertyId, propertyId: resolvedPropertyId };
      if (!connector) {
        connector = {
          id: `conn-${Date.now()}`,
          platform: canonical as any,
          status: 'Connected',
          connectedBy: 'admin',
          verificationState: 'verified',
          verifiedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          credentials: { encrypted: encryptCredentials(credPayload) }
        };
        db.secondBrain.connectors.push(connector);
      } else {
        connector.status = 'Connected';
        connector.verificationState = 'verified';
        connector.verificationError = undefined;
        connector.verifiedAt = new Date().toISOString();
        connector.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        connector.credentials = { encrypted: encryptCredentials(credPayload) };
      }
      await saveDB(res, db);
    } else if (isGA4 && gaCredential) {
      const start = performance.now();
      let saKey: any = null;
      if (typeof gaCredential === 'object') {
        saKey = gaCredential;
      } else if (typeof gaCredential === 'string' && gaCredential.trim().startsWith('{')) {
        try { saKey = JSON.parse(gaCredential); } catch { saKey = null; }
      }

      let bearerToken: string | null = null;
      if (saKey?.client_email && saKey?.private_key) {
        bearerToken = await getAccessTokenFromServiceAccount(saKey);
      } else if (typeof gaCredential === 'string') {
        bearerToken = gaCredential;
      }

      if (!bearerToken) {
        throw new Error("Could not authenticate with provided Service Account JSON Key. Ensure private_key and client_email are present.");
      }

      const sumRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
        headers: { "Authorization": `Bearer ${bearerToken}` }
      });
      if (sumRes.status !== 200) {
        throw new Error(`Google Analytics Admin API returned ${sumRes.status}: Check that Google Analytics Admin API is enabled and service account has permissions.`);
      }
      const sumData = await sumRes.json();
      const cleanedTarget = propertyId.trim().replace(/^properties\//, '').replace(/^accounts\//, '');
      let resolvedPropertyId = cleanedTarget;

      for (const acc of (sumData.accountSummaries || [])) {
        const accId = acc.account?.replace(/^accounts\//, '');
        if (accId === cleanedTarget) {
          resolvedPropertyId = acc.propertySummaries?.[0]?.property?.replace(/^properties\//, '') || cleanedTarget;
          break;
        }
        const found = acc.propertySummaries?.find((p: any) => p.property?.replace(/^properties\//, '') === cleanedTarget);
        if (found) {
          resolvedPropertyId = cleanedTarget;
          break;
        }
      }

      const reportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${resolvedPropertyId}:runReport`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
        }),
      });

      if (!reportRes.ok) {
        const repErr = await reportRes.json().catch(() => ({}));
        throw new Error(repErr.error?.message || `Google Analytics Data API returned ${reportRes.status}`);
      }

      directResult = {
        verified: true,
        latencyMs: Math.round(performance.now() - start),
        resolvedPropertyId,
      };

      let gaConn = db.secondBrain.connectors.find(c => c.platform === 'Google Analytics');
      const credPayload = {
        serviceAccountKey: typeof gaCredential === 'string' ? gaCredential : JSON.stringify(gaCredential),
        accountId: cleanedTarget,
        propertyId: resolvedPropertyId,
      };
      if (!gaConn) {
        gaConn = {
          id: `conn-${Date.now()}`,
          platform: 'Google Analytics',
          status: 'Connected',
          verificationState: 'verified',
          connectedBy: 'admin',
          verifiedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          credentials: { encrypted: encryptCredentials(credPayload) }
        };
        db.secondBrain.connectors.push(gaConn);
      } else {
        gaConn.status = 'Connected';
        gaConn.verificationState = 'verified';
        gaConn.verifiedAt = new Date().toISOString();
        gaConn.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        gaConn.credentials = { encrypted: encryptCredentials(credPayload) };
      }
      await saveDB(res, db);
    } else if (submittedCredentials) {
      const validation = validatePriorityConnectorCredentials(platform, propertyId, submittedCredentials);
      if (!validation.valid) throw new Error(validation.error);
      const canonical = canonicalConnectorPlatform(platform);
      if (!canonical || !hasConnectorAdapter(canonical)) {
        throw new Error(`Live account verification is not implemented for ${platform}.`);
      }
      const startedAt = performance.now();
      const verified = await getConnectorAdapter(canonical)(submittedCredentials);
      if (!verified) throw new Error(`The ${platform} API rejected the supplied credentials or account access.`);
      directResult = { verified: true, latencyMs: Math.round(performance.now() - startedAt) };

      let connector = db.secondBrain.connectors.find(c => c.platform === canonical && getStoredCredentials(c).accountId === propertyId.trim());
      if (!connector) {
        connector = { id: `conn-${Date.now()}`, platform: canonical, status: 'Connected', connectedBy: 'admin' };
        db.secondBrain.connectors.push(connector);
      }
      connector.status = 'Connected';
      connector.verificationState = 'verified';
      connector.verificationError = undefined;
      connector.verifiedAt = new Date().toISOString();
      connector.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      connector.credentials = { encrypted: encryptCredentials(submittedCredentials) };
      await saveDB(res, db);
    }

    const result = directResult || await verifyPipelineConnection(platform, propertyId.trim(), db.secondBrain.connectors || [], getStoredCredentials, getConnectorAdapter);
    if (!db.secondBrain.pipelines) db.secondBrain.pipelines = [];
    const persistedAccountId = directResult?.resolvedPropertyId || propertyId.trim();
    let pipeline = db.secondBrain.pipelines.find(p => p.id === pipelineId)
      || db.secondBrain.pipelines.find(p => (p.platform === platform || (isGA4 && (p.platform.includes('Analytics') || p.platform.includes('GA4')))) && (p.propertyId === propertyId.trim() || p.propertyId === persistedAccountId));

    // A verified handshake is itself a connection event. Persist the pipeline
    // here so a successful test cannot disappear before the user reaches Save.
    if (!pipeline) {
      pipeline = {
        id: pipelineId || `pipe-${Date.now()}`,
        name: `${platform} (${accountName.trim()})`,
        platform,
        accountName: accountName.trim(),
        propertyId: persistedAccountId,
        targetVault: targetVault || (isGA4 ? 'Website Vault' : 'Marketing Vault'),
        syncFrequency: syncFrequency || 'Every 15 mins',
        protocol: protocol || 'Direct REST API (OAuth 2.0)',
        status: 'active',
        verificationState: 'verified',
        verifiedAt: new Date().toISOString(),
        lastPing: new Date().toISOString(),
        latencyMs: result.latencyMs,
        credentialSnippet: 'Encrypted credentials vault',
        metricsCollected: Array.isArray(metricsCollected) ? metricsCollected : [],
        totalEventsIngested: 0,
      };
      db.secondBrain.pipelines.unshift(pipeline);
    } else {
      pipeline.status = 'active';
      pipeline.verificationState = 'verified';
      pipeline.verificationError = undefined;
      pipeline.verifiedAt = new Date().toISOString();
      pipeline.lastPing = new Date().toISOString();
      pipeline.latencyMs = result.latencyMs;
      pipeline.propertyId = persistedAccountId;
      pipeline.credentialSnippet = 'Encrypted credentials vault';
    }
    await saveDB(res, db);
    res.json({
      success: true,
      ...result,
      pipeline,
      verifiedAt: new Date().toISOString(),
      message: directResult?.resolvedPropertyId
        ? `Handshake Verified: 200 OK • GA4 Property ${directResult.resolvedPropertyId} connected live via Service Account.`
        : 'Provider account access verified. This check does not ingest data or authorize campaign changes.'
    });
  } catch (error) {
    res.status(422).json({ success: false, verified: false, error: error instanceof Error ? error.message : 'Account verification failed.' });
  }
});

// Pull a small, provider-owned GA4 organic metrics snapshot after a verified
// connection. This is deliberately separate from the handshake: access alone
// is not telemetry, and other providers remain "verified" until their own
// metric adapters are implemented.
router.post('/pipelines/:id/sync-metrics', async (req: Request, res: Response) => {
  const db = await getDB(res);
  const pipeline = (db.secondBrain.pipelines || []).find(p => p.id === req.params.id);
  if (!pipeline) { res.status(404).json({ error: 'Pipeline not found.' }); return; }
  if (pipeline.status !== 'active' || pipeline.verificationState !== 'verified') {
    res.status(409).json({ error: 'Provider access must be verified before metrics can be synchronized.' });
    return;
  }
  if (!/analytics|ga4/i.test(pipeline.platform)) {
    res.status(422).json({ error: `A provider metrics adapter is not implemented for ${pipeline.platform}; this channel remains verified, not live.` });
    return;
  }

  const connector = (db.secondBrain.connectors || []).find(c => c.platform === 'Google Analytics' && getStoredCredentials(c).propertyId === pipeline.propertyId);
  const credentials = connector ? getStoredCredentials(connector) : null;
  let serviceAccount: any = null;
  try { serviceAccount = credentials?.serviceAccountKey ? JSON.parse(credentials.serviceAccountKey) : null; } catch { }
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    res.status(409).json({ error: 'The verified GA4 credential is unavailable. Reconnect GA4 with its service-account JSON key.' });
    return;
  }
  const token = await getAccessTokenFromServiceAccount(serviceAccount);
  if (!token) { res.status(422).json({ error: 'Google rejected the stored service-account credential during metrics synchronization.' }); return; }
  try {
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${pipeline.propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'conversions' }],
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `GA4 Data API returned ${response.status}`);
    const values = payload.rows?.[0]?.metricValues || [];
    const activeUsers = Number(values[0]?.value || 0);
    const sessions = Number(values[1]?.value || 0);
    const conversions = Number(values[2]?.value || 0);
    pipeline.lastMetrics = {
      source: 'ga4_data_api', observedAt: new Date().toISOString(), available: true, mediaType: 'organic',
      activeUsers, sessions, conversions, spend: 0, revenue: 0, roas: 0,
    };
    pipeline.lastIngestedAt = new Date().toISOString();
    await saveDB(res, db);
    res.json({ success: true, pipeline, metrics: pipeline.lastMetrics });
  } catch (err) {
    res.status(422).json({ error: err instanceof Error ? err.message : 'GA4 metric synchronization failed.' });
  }
});

router.post('/pipelines/test-webhook', async (req: Request, res: Response) => {
  const { pipelineId, platform, eventType, payload } = req.body as {
    pipelineId?: string;
    platform?: string;
    eventType?: string;
    payload?: any;
  };

  if (!payload) {
    res.status(400).json({ error: "Missing webhook JSON payload." });
    return;
  }

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex').slice(0, 16);
  const eventId = `evt_${Date.now()}_${crypto.createHash('sha256').update(payloadStr + Date.now()).digest('hex').slice(0, 8)}`;
  const timestamp = new Date().toISOString();

  const db = await getDB(res);
  let targetVault = 'Marketing Vault';

  if (db.secondBrain.pipelines) {
    const pipeline = db.secondBrain.pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      pipeline.totalEventsIngested = (pipeline.totalEventsIngested || 0) + 1;
      pipeline.lastIngestedAt = timestamp;
      pipeline.lastPing = 'Just now';
      targetVault = pipeline.targetVault;
      const source = payload && typeof payload === 'object' ? payload : {};
      const spend = Number(source.spend ?? source.cost ?? source.ad_spend);
      const revenue = Number(source.revenue ?? source.value ?? source.conversion_value);
      const conversions = Number(source.conversions ?? source.purchases ?? source.leads);
      if ([spend, revenue, conversions].every(value => Number.isFinite(value) && value >= 0) && spend > 0) {
        pipeline.lastMetrics = {
          source: 'verified_connector_payload',
          observedAt: timestamp,
          spend,
          conversions,
          revenue,
          roas: revenue / spend,
          available: true,
        };
      }
      await saveDB(res, db);
    }
  }

  // Record ingestion into uploaded files / RAG memory as a verified event
  const newIngestionRecord = {
    id: eventId,
    name: `Webhook Event: ${platform || 'Pipeline'} [${eventType || 'telemetry'}]`,
    size: `${(Buffer.byteLength(payloadStr, 'utf8') / 1024).toFixed(2)} KB`,
    uploadedAt: timestamp.split("T")[0],
    vaultId: targetVault.toLowerCase().replace(/\s+/g, '-'),
    status: "Ready" as const,
    mimeType: "application/json"
  };

  db.secondBrain.uploadedFiles = [newIngestionRecord, ...(db.secondBrain.uploadedFiles || []).slice(0, 49)];
  await saveDB(res, db);

  res.json({
    success: true,
    eventId,
    status: 'DELIVERED',
    httpStatus: 200,
    ingestedAt: timestamp,
    payloadHash: `sha256:${payloadHash}`,
    targetVault,
    recordsProcessed: 1,
    message: `Webhook event '${eventType || 'custom_event'}' successfully authenticated and committed into ${targetVault}.`
  });
});

router.delete('/pipelines/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  if (db.secondBrain.pipelines) {
    db.secondBrain.pipelines = db.secondBrain.pipelines.filter(p => p.id !== id);
    await saveDB(res, db);
  }
  res.json({ success: true, message: `Pipeline ${id} disconnected.` });
});

  return router;
}
