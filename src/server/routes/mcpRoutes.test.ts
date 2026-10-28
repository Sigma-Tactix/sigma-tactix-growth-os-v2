import { afterEach, describe, expect, it } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createMcpRouter } from './mcpRoutes.js';
import { withMcpConnection } from '../mcp/mcpClient.js';

const listeners: Server[] = [];
afterEach(async () => { await Promise.all(listeners.splice(0).map(server => new Promise<void>((resolve, reject) => {
  server.closeAllConnections(); server.close(error => error ? reject(error) : resolve());
}))); });

async function start(enabled = true, objective?: string) {
  const app = express(); app.use(express.json());
  app.use((req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) { res.locals.wsId = token; res.locals.userId = 'user'; res.locals.userEmail = token === 'other-email' ? 'other@example.com' : 'sigmatactix@gmail.com'; res.locals.sb = {}; }
    next();
  });
  app.use('/mcp', createMcpRouter({
    expensiveLimiter: (_req, _res, next) => next(),
    callerIsOwnerOrAdmin: async res => res.locals.wsId !== 'member',
    getWorkspace: async () => ({ settings: {}, secondBrain: {} }) as any,
    getRuns: async res => [{ id: `run-for-${res.locals.wsId}`, objective }],
    env: { GROWTH_OS_MCP_ENABLED: String(enabled) },
  }));
  const server = await new Promise<Server>(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  listeners.push(server);
  const address = server.address() as { port: number };
  return `http://127.0.0.1:${address.port}/mcp`;
}

describe('read-only inbound MCP endpoint', () => {
  it('serves HTML-like tool output as JSON and preserves empty notification acknowledgments', async () => {
    const objective = '<img src=x onerror=alert(1)>';
    const url = await start(true, objective);
    const headers = { Authorization: 'Bearer a', 'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' };
    const response = await fetch(url, { method: 'POST', headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_recent_runs', arguments: { limit: 1 } } }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^application\/json/);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const payload = await response.json();
    expect(JSON.parse(payload.result.content[0].text)[0].objective).toBe(objective);
    const notification = await fetch(url, { method: 'POST', headers,
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });
    expect(notification.status).toBe(202);
    expect(await notification.text()).toBe('');
  });
  it('denies missing auth, member access, disabled endpoints and unknown browser origins', async () => {
    const url = await start(false);
    expect((await fetch(url, { method: 'POST' })).status).toBe(401);
    expect((await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer member' } })).status).toBe(403);
    expect((await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer other-email' } })).status).toBe(403);
    expect((await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer a' } })).status).toBe(503);
    const enabledUrl = await start();
    expect((await fetch(enabledUrl, { method: 'POST', headers: { Authorization: 'Bearer a', Origin: 'https://untrusted.example' } })).status).toBe(403);
  });
  it('uses actual mcp-use HTTP clients without leaking workspace context between concurrent requests', async () => {
    // Import after the shared wrapper has disabled SDK telemetry.
    expect(withMcpConnection).toBeTypeOf('function');
    const { MCPClient } = await import('@mcp-use/client');
    const url = await start();
    async function read(workspace: string) {
      const client = new MCPClient({ mcpServers: { growth: { url, authToken: workspace, autoOAuth: false } } });
      try {
        const connection = await client.connect('growth');
        const tools = await connection.listTools();
        expect(tools.map(t => t.name).sort()).toEqual(['get_capability_status', 'list_mcp_receipts', 'list_recent_runs']);
        expect(tools.every(t => t.annotations?.readOnlyHint)).toBe(true);
        const result = await connection.callTool('list_recent_runs', { limit: 1 });
        expect(JSON.stringify(result)).toContain(`run-for-${workspace}`);
        expect(JSON.stringify(result)).not.toContain(workspace === 'a' ? 'run-for-b' : 'run-for-a');
        const denied = await connection.callTool('list_recent_runs', { limit: 1, workspaceId: 'other' });
        expect(denied.isError).toBe(true);
        await expect(connection.callTool('approve_task', {})).rejects.toThrow();
      } finally { await client.close(); }
    }
    await Promise.all([read('a'), read('b')]);
  });
});
