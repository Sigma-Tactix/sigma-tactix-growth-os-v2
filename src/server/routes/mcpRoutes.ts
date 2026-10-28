import { Router, type Response } from 'express';
import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { WorkspaceData } from '../../types.js';
import { buildCapabilityRegistry } from '../../lib/capabilityRegistry.js';
import { googleAdsReadRequest, googleAdsWorkspaceBinding, isMcpPilotOwner, listMcpReceipts, readGoogleAdsViaMcp } from '../mcp/googleAdsGateway.js';

interface McpRouterDeps {
  expensiveLimiter: any;
  callerIsOwnerOrAdmin: (res: Response) => Promise<boolean>;
  getWorkspace: (res: Response) => Promise<WorkspaceData>;
  getRuns: (res: Response, limit: number) => Promise<unknown[]>;
  env?: NodeJS.ProcessEnv;
}

/** Mounted under /api/workspace AFTER requireAuth. Every request gets a fresh MCP server. */
export function createMcpRouter(deps: McpRouterDeps) {
  const router = Router();
  const env = deps.env || process.env;
  router.use(async (_req, res, next) => {
    if (!res.locals.wsId || !res.locals.userId || !res.locals.sb) {
      res.status(401).json({ error: 'An authenticated workspace is required.' }); return;
    }
    if (!isMcpPilotOwner(res.locals.userEmail) || !await deps.callerIsOwnerOrAdmin(res)) {
      res.status(403).json({ error: 'This MCP pilot requires sigmatactix@gmail.com with an owner or admin role.' }); return;
    }
    next();
  });

  router.get('/status', (_req, res) => res.json({
    inboundEnabled: env.GROWTH_OS_MCP_ENABLED === 'true',
    inboundPath: '/api/workspace/mcp',
    authentication: 'Supabase bearer token; owner/admin only; OAuth discovery is not implemented',
    outbound: { server: 'google-ads', boundToWorkspace: googleAdsWorkspaceBinding(res.locals.wsId, env),
      verified: false, detail: 'Binding is configuration. Inspect receipts for actual call outcomes.' },
  }));
  router.get('/receipts', async (_req, res) => {
    try { res.json({ receipts: await listMcpReceipts(res.locals.sb, res.locals.wsId) }); }
    catch { res.status(503).json({ error: 'MCP receipt storage is unavailable.' }); }
  });
  router.post('/google-ads/read', deps.expensiveLimiter, async (req, res) => {
    const parsed = googleAdsReadRequest.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Invalid Google Ads read request.' }); return; }
    try {
      res.json(await readGoogleAdsViaMcp({ workspaceId: res.locals.wsId, actorId: res.locals.userId, actorEmail: res.locals.userEmail,
        sb: res.locals.sb, request: parsed.data }));
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : 'MCP read unavailable.' });
    }
  });

  router.all('/', deps.expensiveLimiter, async (req, res) => {
    if (env.GROWTH_OS_MCP_ENABLED !== 'true') {
      res.status(503).json({ error: 'Inbound Growth OS MCP is disabled on this server.' }); return;
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.status(405).end(); return; }
    const origins = (env.GROWTH_OS_MCP_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (req.headers.origin && !origins.includes(req.headers.origin)) {
      res.status(403).json({ error: 'Origin is not allowed for MCP.' }); return;
    }
    if (Buffer.byteLength(JSON.stringify(req.body ?? {})) > 64_000) {
      res.status(413).json({ error: 'MCP request exceeds 64 KB.' }); return;
    }
    // Never hold workspace data in a shared singleton or accept workspace IDs as arguments.
    const server = new McpServer({ name: 'sigmatactix-growth-os', version: '0.1.0' });
    const annotations = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
    server.registerTool('get_capability_status', {
      description: 'Read this authenticated workspace\'s declared capability states. Declared does not mean provider-verified.',
      inputSchema: z.object({}).strict(), annotations,
    }, async () => {
      const registry = buildCapabilityRegistry(await deps.getWorkspace(res));
      return { content: [{ type: 'text', text: JSON.stringify(registry) }] };
    });
    server.registerTool('list_recent_runs', {
      description: 'Read recent execution lifecycle summaries in this workspace. No artifact bodies, credentials or approvals are exposed.',
      inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(10) }).strict(), annotations,
    }, async ({ limit }) => ({ content: [{ type: 'text', text: JSON.stringify(await deps.getRuns(res, limit)) }] }));
    server.registerTool('list_mcp_receipts', {
      description: 'Read recent MCP call lifecycle receipts. Receipts are app records, not independent provider attestations.',
      inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(10) }).strict(), annotations,
    }, async ({ limit }) => {
      const rows = await listMcpReceipts(res.locals.sb, res.locals.wsId, limit);
      const summaries = rows.map(({ result: _result, ...receipt }) => receipt);
      return { content: [{ type: 'text', text: JSON.stringify(summaries) }] };
    });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    try {
      await server.connect(transport);
      const headers = new Headers();
      for (const name of ['accept', 'content-type', 'mcp-protocol-version']) {
        const value = req.headers[name];
        if (typeof value === 'string') headers.set(name, value);
      }
      const response = await transport.handleRequest(new Request('http://localhost/mcp', {
        method: 'POST', headers, body: JSON.stringify(req.body),
      }));
      res.status(response.status);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      const protocolVersion = response.headers.get('mcp-protocol-version');
      if (protocolVersion) res.setHeader('mcp-protocol-version', protocolVersion);
      const body = await response.text();
      if (!body) { res.end(); return; }
      if (response.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
        throw new Error('Expected a JSON MCP transport response.');
      }
      res.json(JSON.parse(body));
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'MCP request failed.' });
    } finally {
      await server.close();
    }
  });
  return router;
}
