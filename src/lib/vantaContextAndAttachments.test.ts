import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { resolveObjectNameFromPath, resolveVantaPageContext } from './vantaPageContext';
import { vantaMessageRequest } from './vantaServer';
import { createVantaRouter } from '../server/routes/vantaRoutes';
import express, { Express } from 'express';
import type { Server } from 'http';

describe('Task S09: VANTA Page Context and Attachments Everywhere', () => {
  describe('S09-A1: Released routes and context resolution', () => {
    it('resolves core released routes to human-readable objects', () => {
      expect(resolveObjectNameFromPath('/')).toBe('Executive Command & Overview');
      expect(resolveObjectNameFromPath('/diagnostics')).toBe('Growth Diagnostics & Levers');
      expect(resolveObjectNameFromPath('/vaults')).toBe('Second Brain Knowledge Vaults');
      expect(resolveObjectNameFromPath('/suite/creative')).toBe('Creative Studio & Generation Hub');
      expect(resolveObjectNameFromPath('/suite/social')).toBe('Social Media & Carousel Distribution');
      expect(resolveObjectNameFromPath('/suite/search')).toBe('SEO & Answer Engine Optimization (AEO)');
      expect(resolveObjectNameFromPath('/suite/attribution')).toBe('Revenue Attribution & Unit Economics');
      expect(resolveObjectNameFromPath('/connectors')).toBe('Verified Marketing Data Connectors');
      expect(resolveObjectNameFromPath('/scheduler')).toBe('Job Scheduler & Durable Workers');
      expect(resolveObjectNameFromPath('/tenants')).toBe('Client Enclaves & Workspace Directory');
    });

    it('falls back to capitalized hierarchical names for unmapped subpaths', () => {
      expect(resolveObjectNameFromPath('/suite/unmapped-module')).toBe('Suite › Unmapped Module');
      expect(resolveObjectNameFromPath('/custom/test-view')).toBe('Custom › Test View');
    });

    it('extracts filters and periods from URL search query parameters', () => {
      const context = resolveVantaPageContext({
        pathname: '/diagnostics',
        search: '?period=Q3-2026&channel=google-ads&status=active',
        workspaceName: 'Acme Growth Labs',
        workspaceId: 'ws-acme-101',
      });

      expect(context.clientName).toBe('Acme Growth Labs');
      expect(context.workspaceId).toBe('ws-acme-101');
      expect(context.routePath).toBe('/diagnostics');
      expect(context.objectName).toBe('Growth Diagnostics & Levers');
      expect(context.period).toBe('Q3-2026');
      expect(context.filterSummary).toBe('Status: active · Channel: google-ads');
    });

    it('defaults to 30-day window and default workspace when unspecified', () => {
      const context = resolveVantaPageContext({
        pathname: '/',
        search: '',
      });

      expect(context.clientName).toBe('Sigma Tactix (HQ)');
      expect(context.workspaceId).toBe('ws-primary');
      expect(context.period).toBe('Last 30 Days');
      expect(context.filterSummary).toBe('Default View');
    });

    it('binds page text selections when provided', () => {
      const context = resolveVantaPageContext({
        pathname: '/suite/attribution',
        search: '?period=Last%207%20Days',
        workspaceName: 'Acme Growth Labs',
        workspaceId: 'ws-acme-101',
        selection: 'ROAS dropped 14% week over week on Meta campaigns',
      });

      expect(context.selection).toBe('ROAS dropped 14% week over week on Meta campaigns');
    });
  });

  describe('S09-A2 & S09-A3: Attachment lifecycle, inspection, deletion, and foreign ref rejection', () => {
    let app: Express;
    let server: Server;
    let baseUrl: string;
    let localContextMap: Map<string, any>;
    let mockSupabase: any;

    beforeEach(async () => {
      localContextMap = new Map();

      mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'vanta_conversations') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              gt: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'c-100', workspace_id: 'ws-alpha', created_by: 'user-alpha' },
                error: null,
              }),
            };
          }
          if (table === 'vanta_settings') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  text_provider: 'gemini',
                  text_model: 'gemini-2.5-flash',
                  provider_verified_at: new Date().toISOString(),
                },
                error: null,
              }),
            };
          }
          if (table === 'workspaces') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'ws-alpha', name: 'Alpha Workspace' },
                error: null,
              }),
            };
          }
          if (table === 'vanta_messages') {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'm-100' },
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      };

      const router = createVantaRouter({
        expensiveLimiter: (_req: any, _res: any, next: any) => next(),
        callerIsOwnerOrAdmin: vi.fn().mockResolvedValue(true),
        getVantaSettings: vi.fn().mockResolvedValue({ provider_verified_at: new Date().toISOString() }),
        normalizeVantaLocalBaseUrl: (url: string) => url,
        describeVantaProviderError: (err: any) => err?.message || 'Error',
        resolveEffectiveGeminiKey: vi.fn().mockResolvedValue('test-gemini-key'),
        resolveEffectiveGeminiModel: vi.fn().mockResolvedValue('gemini-2.5-flash'),
        getGeminiClient: vi.fn().mockReturnValue({
          models: {
            generateContentStream: vi.fn().mockResolvedValue({
              stream: (async function* () {
                yield { text: 'VANTA grounded response' };
              })(),
            }),
          },
        }),
        getDB: vi.fn(),
        searchDocuments: vi.fn().mockResolvedValue([]),
        vantaUpload: {
          array: () => (_req: any, _res: any, next: any) => next(),
          single: () => (_req: any, _res: any, next: any) => next(),
        },
        vantaLocalContexts: localContextMap,
        pruneVantaLocalContexts: () => {
          const now = Date.now();
          for (const [id, item] of localContextMap.entries()) {
            if (item.expiresAt <= now) localContextMap.delete(id);
          }
        },
        extractVantaLocalText: vi.fn().mockResolvedValue('Extracted plain text from document'),
        VANTA_SYSTEM_INSTRUCTION: 'System prompt',
        classifyVantaVerification: () => ({ verified: true, label: 'Verified' }),
        buildVantaPromptContext: () => 'Prompt context',
        parseVantaModelOutput: (text: string) => ({ reply: text, evidence: [] }),
        resolveVantaGeminiVoiceConfig: () => ({ sttModel: 'whisper-1', ttsModel: 'tts-1', voice: 'alloy' }),
        verifyVantaGeminiVoiceRoundTrip: vi.fn().mockResolvedValue({ ok: true }),
        getDecisionRuntimeStatus: vi.fn().mockReturnValue({ healthy: true }),
        decisionTraceToVantaContext: vi.fn().mockReturnValue('Decision context'),
        vantaMessageRequest,
        vantaConversationRequest: {} as any,
        vantaShareRequest: {} as any,
        vantaMemoryRequest: {} as any,
        vantaVoiceSettingsRequest: {} as any,
      });

      app = express();
      app.use(express.json());
      // Middleware simulating authenticated context for workspace 'ws-alpha' and user 'user-alpha'
      app.use((req, res, next) => {
        res.locals.wsId = (req.headers['x-test-ws'] as string) || 'ws-alpha';
        res.locals.userId = (req.headers['x-test-user'] as string) || 'user-alpha';
        res.locals.sb = mockSupabase;
        next();
      });
      app.use('/vanta', router);

      await new Promise<void>(resolve => {
        server = app.listen(0, '127.0.0.1', () => {
          const port = (server.address() as any).port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    afterEach(async () => {
      await new Promise<void>(resolve => server.close(() => resolve()));
    });

    it('allows inspecting and deleting session attachments owned by the caller', async () => {
      const attachId = 'a1111111-1111-4111-8111-111111111111';
      localContextMap.set(attachId, {
        id: attachId,
        workspaceId: 'ws-alpha',
        userId: 'user-alpha',
        name: 'campaign_notes.txt',
        text: 'Detailed campaign objectives and performance benchmarks.',
        expiresAt: Date.now() + 600_000,
      });

      // GET inspect
      const inspectRes = await fetch(`${baseUrl}/vanta/local-context/${attachId}`, {
        headers: { 'x-test-ws': 'ws-alpha', 'x-test-user': 'user-alpha' },
      });
      expect(inspectRes.status).toBe(200);
      const inspectData = await inspectRes.json();
      expect(inspectData.name).toBe('campaign_notes.txt');
      expect(inspectData.snippet).toContain('Detailed campaign objectives');

      // DELETE attachment
      const deleteRes = await fetch(`${baseUrl}/vanta/local-context/${attachId}`, {
        method: 'DELETE',
        headers: { 'x-test-ws': 'ws-alpha', 'x-test-user': 'user-alpha' },
      });
      expect(deleteRes.status).toBe(200);
      const deleteData = await deleteRes.json();
      expect(deleteData.success).toBe(true);
      expect(localContextMap.has(attachId)).toBe(false);

      // Subsequent inspect fails 404
      const notFoundRes = await fetch(`${baseUrl}/vanta/local-context/${attachId}`, {
        headers: { 'x-test-ws': 'ws-alpha', 'x-test-user': 'user-alpha' },
      });
      expect(notFoundRes.status).toBe(404);
    });

    it('rejects foreign workspace or user attempts to inspect or delete attachments (HTTP 403)', async () => {
      const foreignId = 'f2222222-2222-4222-8222-222222222222';
      localContextMap.set(foreignId, {
        id: foreignId,
        workspaceId: 'ws-beta',
        userId: 'user-beta',
        name: 'competitor_intel.pdf',
        text: 'Proprietary beta workspace intel.',
        expiresAt: Date.now() + 600_000,
      });

      // User in ws-alpha attempts to inspect ws-beta file -> 403
      const inspectRes = await fetch(`${baseUrl}/vanta/local-context/${foreignId}`, {
        headers: { 'x-test-ws': 'ws-alpha', 'x-test-user': 'user-alpha' },
      });
      expect(inspectRes.status).toBe(403);
      const inspectErr = await inspectRes.json();
      expect(inspectErr.error).toContain('Forbidden');

      // User in ws-alpha attempts to delete ws-beta file -> 403
      const deleteRes = await fetch(`${baseUrl}/vanta/local-context/${foreignId}`, {
        method: 'DELETE',
        headers: { 'x-test-ws': 'ws-alpha', 'x-test-user': 'user-alpha' },
      });
      expect(deleteRes.status).toBe(403);
      expect(localContextMap.has(foreignId)).toBe(true);
    });

    it('rejects foreign attachment references when submitting messages (HTTP 403)', async () => {
      const foreignId = 'f3333333-3333-4333-8333-333333333333';
      localContextMap.set(foreignId, {
        id: foreignId,
        workspaceId: 'ws-beta',
        userId: 'user-beta',
        name: 'secret.txt',
        text: 'Foreign data',
        expiresAt: Date.now() + 600_000,
      });

      const res = await fetch(`${baseUrl}/vanta/conversations/c-100/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-ws': 'ws-alpha',
          'x-test-user': 'user-alpha',
        },
        body: JSON.stringify({
          content: 'Analyze this file',
          localContextIds: [foreignId],
        }),
      });

      expect(res.status).toBe(403);
      const err = await res.json();
      expect(err.error).toContain('Forbidden: foreign attachment reference');
    });

    it('rejects stale or expired attachment references when submitting messages (HTTP 400)', async () => {
      const expiredId = 'e4444444-4444-4444-8444-444444444444';
      localContextMap.set(expiredId, {
        id: expiredId,
        workspaceId: 'ws-alpha',
        userId: 'user-alpha',
        name: 'old_notes.txt',
        text: 'Old data',
        expiresAt: Date.now() - 1000, // expired
      });

      const res = await fetch(`${baseUrl}/vanta/conversations/c-100/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-ws': 'ws-alpha',
          'x-test-user': 'user-alpha',
        },
        body: JSON.stringify({
          content: 'Analyze this file',
          localContextIds: [expiredId],
        }),
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toContain('Stale or expired attachment reference');
    });

    it('rejects non-existent attachment references when submitting messages (HTTP 400)', async () => {
      const missingId = '00000000-0000-4000-8000-000000000000';

      const res = await fetch(`${baseUrl}/vanta/conversations/c-100/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-ws': 'ws-alpha',
          'x-test-user': 'user-alpha',
        },
        body: JSON.stringify({
          content: 'Analyze this file',
          localContextIds: [missingId],
        }),
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toContain('Stale or expired attachment reference');
    });

    it('accepts valid message with page context and valid session attachments', async () => {
      const validId = 'a5555555-5555-4555-8555-555555555555';
      localContextMap.set(validId, {
        id: validId,
        workspaceId: 'ws-alpha',
        userId: 'user-alpha',
        name: 'valid_data.csv',
        text: 'campaign,spend,conversions\nbrand,1000,50',
        expiresAt: Date.now() + 600_000,
      });

      const res = await fetch(`${baseUrl}/vanta/conversations/c-100/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-ws': 'ws-alpha',
          'x-test-user': 'user-alpha',
        },
        body: JSON.stringify({
          content: 'Summarize campaign performance',
          localContextIds: [validId],
          pageContext: {
            routePath: '/diagnostics',
            objectName: 'Growth Diagnostics & Levers',
            period: 'Last 30 Days',
            filterSummary: 'Status: active',
            selection: 'conversions 50',
          },
        }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');
    });
  });
});
