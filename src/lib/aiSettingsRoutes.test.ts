import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canUseLocalSockets } from '../test/socketProbe.js';
import * as settings from './aiSettings.js';

// Exercise the actual registered handlers without starting the monolithic server,
// loading .env, connecting to Supabase or calling paid model endpoints.
const source = ts.createSourceFile('server.ts', readFileSync(new URL('../../server.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const paths = ['/api/workspace/admin/ai-keys', '/api/workspace/admin/ai/selection', '/api/workspace/admin/ai/test-inference', '/api/workspace/admin/ai-keys/:provider'];
const helpers = ['resolveEffectiveGeminiKey', 'resolveEffectiveGeminiModel', 'resolveEffectiveProviderKey', 'resolveStoredProviderConfig', 'validateAIEndpoint', 'resolveWorkspaceAgentAI'];
const statements = source.statements.filter(node => {
  if (ts.isFunctionDeclaration(node)) return helpers.includes(node.name?.text || '');
  if (!ts.isExpressionStatement(node) || !ts.isCallExpression(node.expression)) return false;
  const call = node.expression;
  return ts.isPropertyAccessExpression(call.expression) && call.expression.expression.getText(source) === 'app' &&
    !!call.arguments[0] && ts.isStringLiteral(call.arguments[0]) && paths.includes(call.arguments[0].text);
});
const compiled = ts.transpileModule(statements.map(node => node.getText(source)).join('\n'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

describe.skipIf(await canUseLocalSockets().then(ok => !ok))('AI settings HTTP handlers', () => {
  let server: Server;
  let url: string;
  let state: any;
  let admin: boolean;
  let context: any;
  let completion: ReturnType<typeof vi.fn>;
  let assertPublicHost: ReturnType<typeof vi.fn>;
  beforeEach(async () => {
    state = {};
    admin = true;
    const app = express();
    app.use(express.json());
    completion = vi.fn(async (options: any) => ({ text: 'Verified synthetic response', provider: options.provider, model: options.model,
      promptTokens: 10, candidateTokens: 2, totalTokens: 12, durationMs: 1 }));
    assertPublicHost = vi.fn(async (target: string) => {
      if (new URL(target).hostname === '127.0.0.1') throw new Error('Private target blocked');
    });
    context = createContext({ ...settings, app, process: { env: {} }, console, URL, Date,
      DEFAULT_GEMINI_MODEL: 'gemini-default',
      SUPPORTED_AI_PROVIDERS: [...settings.AGENT_AI_PROVIDERS, 'gemini', 'openai-account'],
      UI_PRIMARY_PROVIDERS: [...settings.AGENT_AI_PROVIDERS, 'openai-account'],
      expensiveLimiter: (_req: any, _res: any, next: any) => next(),
      callerIsOwnerOrAdmin: async () => admin,
      getDB: async () => structuredClone(state), saveDB: async (_res: any, db: any) => { state = structuredClone(db); },
      encryptCredentials: (value: any) => `encrypted:${value.apiKey}`,
      decryptCredentials: (value: string) => ({ apiKey: value.replace('encrypted:', '') }),
      assertPublicHost, executeUniversalAICompletion: completion,
      calculateTokenCost: () => 0, recordTokenUsage: async () => {},
    });
    runInContext(compiled, context);
    server = await new Promise<Server>(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/workspace/admin`;
  });
  afterEach(async () => {
    if (!server) return;
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  const post = async (path: string, body: unknown) => {
    const response = await fetch(`${url}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };

  it('saves Google from the UI and resolves its saved key/model for Gemini and agent consumers', async () => {
    expect((await post('/ai-keys', { provider: 'google', apiKey: 'synthetic-google', model: 'saved-gemini' })).status).toBe(200);
    expect(await context.resolveEffectiveGeminiKey({})).toBe('synthetic-google');
    expect(await context.resolveEffectiveGeminiModel({})).toBe('saved-gemini');
    expect(await context.resolveWorkspaceAgentAI({})).toMatchObject({ provider: 'google', apiKey: 'synthetic-google', model: 'saved-gemini' });
    const listed = await (await fetch(`${url}/ai-keys`)).json();
    expect(listed.providers.find((p: any) => p.provider === 'google')).toMatchObject({ configured: true, verified: false });
    expect(JSON.stringify(listed)).not.toContain('synthetic-google');
  });
  it('persists the agent choice independently of saved defaults and resolves provider-specific credentials', async () => {
    await post('/ai-keys', { provider: 'openai', apiKey: 'saved-openai', model: 'default-model', baseUrl: 'https://approved.example/v1' });
    expect((await post('/ai/selection', { provider: 'openai', model: 'chosen-model' })).status).toBe(200);
    expect(await context.resolveWorkspaceAgentAI({})).toMatchObject({ provider: 'openai', apiKey: 'saved-openai', model: 'chosen-model', baseUrl: 'https://approved.example/v1' });
    expect(state.agentAISelection).toEqual({ provider: 'openai', model: 'chosen-model' });
  });
  it('requires admin rights for save, select and inference test before any paid call', async () => {
    admin = false;
    for (const path of ['/ai-keys', '/ai/selection', '/ai/test-inference']) expect((await post(path, { provider: 'openai', model: 'test', apiKey: 'synthetic' })).status).toBe(403);
    expect(completion).not.toHaveBeenCalled();
    expect(state).toEqual({});
  });
  it('only marks a successful saved model test verified, then clears verification when credentials change', async () => {
    await post('/ai-keys', { provider: 'openai', apiKey: 'saved-openai', model: 'test-model' });
    expect((await post('/ai/test-inference', { provider: 'openai', model: 'test-model' })).status).toBe(200);
    expect(state.aiProviderKeys.openai.verifiedModel).toBe('test-model');
    expect(settings.providerStatus(state, 'openai', {}).verified).toBe(true);
    completion.mockRejectedValueOnce(new Error('Synthetic provider failure'));
    expect((await post('/ai/test-inference', { provider: 'openai', model: 'test-model' })).status).toBe(502);
    expect(settings.providerStatus(state, 'openai', {}).verified).toBe(false);
    await post('/ai-keys', { provider: 'openai', apiKey: 'replacement-key', model: 'test-model' });
    expect(settings.providerStatus(state, 'openai', {}).verified).toBe(false);
  });
  it('rejects hosted private endpoints before inference and keeps failed selections out of persisted state', async () => {
    state = { aiProviderKeys: { openai: { encrypted: 'encrypted:synthetic', model: 'test', baseUrl: 'https://127.0.0.1/v1' } } };
    expect((await post('/ai/selection', { provider: 'openai', model: 'test' })).status).toBe(400);
    expect(state.agentAISelection).toBeUndefined();
    expect((await post('/ai/test-inference', { provider: 'openai', model: 'test' })).status).toBe(502);
    expect(completion).not.toHaveBeenCalled();
  });
  it('rejects malformed settings and blocks unsafe endpoint saves before persistence', async () => {
    expect((await post('/ai-keys', { provider: 'openai', apiKey: {}, model: 'test' })).status).toBe(400);
    expect((await post('/ai-keys', { provider: 'openai', apiKey: 'synthetic', model: 'test', baseUrl: 'https://127.0.0.1/v1' })).status).toBe(400);
    expect(state).toEqual({});
    expect((await post('/ai/test-inference', { provider: 'openai', model: {}, prompt: [] })).status).toBe(400);
    expect(completion).not.toHaveBeenCalled();
  });
  it('supports keyless local settings and does not resurrect legacy Google credentials after deletion', async () => {
    expect((await post('/ai-keys', { provider: 'ollama', model: 'local-model', baseUrl: 'http://127.0.0.1:11434/v1' })).status).toBe(200);
    expect((await post('/ai/selection', { provider: 'ollama', model: 'local-model' })).status).toBe(200);
    expect(await context.resolveWorkspaceAgentAI({})).toMatchObject({ provider: 'ollama', model: 'local-model' });
    state.aiProviderKeys.gemini = { encrypted: 'encrypted:old-key' };
    await fetch(`${url}/ai-keys/google`, { method: 'DELETE' });
    expect(settings.providerEntry(state, 'google')).toBeUndefined();
  });
});