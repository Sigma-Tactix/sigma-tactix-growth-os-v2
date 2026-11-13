import { describe, expect, it } from 'vitest';
import { resolveAgentAIConfig, providerEntry, providerStatus, selectAgentModel } from './aiSettings.js';

describe('saved AI provider configuration', () => {
  const decrypt = () => ({ apiKey: 'saved-provider-key' });
  it('reads both Google aliases, preferring the current UI entry', () => {
    const state = { aiProviderKeys: { google: { model: 'current' }, gemini: { model: 'legacy' } } };
    expect(providerEntry(state, 'gemini')?.model).toBe('current');
    expect(providerEntry({ aiProviderKeys: { gemini: { model: 'legacy' } } }, 'google')?.model).toBe('legacy');
  });
  it('uses the selected provider saved key, model and endpoint, not another provider key', () => {
    const state = { aiProviderKeys: { openai: { encrypted: 'cipher', model: 'saved-model', baseUrl: 'https://approved.example/v1' } } };
    selectAgentModel(state, 'openai', 'chosen-model');
    expect(resolveAgentAIConfig(state, decrypt, { GEMINI_API_KEY: 'wrong-key' })).toMatchObject({
      provider: 'openai', model: 'chosen-model', apiKey: 'saved-provider-key', baseUrl: 'https://approved.example/v1',
    });
  });
  it('fails closed for a selected provider without credentials', () => {
    expect(() => resolveAgentAIConfig({ agentAISelection: { provider: 'openai', model: 'chosen' } }, decrypt,
      { GEMINI_API_KEY: 'wrong-key' })).toThrow(/not configured/i);
  });
  it('keeps legacy Gemini defaults when no agent selection exists', () => {
    expect(resolveAgentAIConfig({ aiProviderKeys: { google: { encrypted: 'cipher', model: 'saved-gemini' } } }, decrypt, {}))
      .toMatchObject({ provider: 'google', model: 'saved-gemini', apiKey: 'saved-provider-key' });
  });
  it('does not require a key for a selected local model', () => {
    expect(resolveAgentAIConfig({ agentAISelection: { provider: 'ollama', model: 'local-test' } }, decrypt, {}))
      .toMatchObject({ provider: 'ollama', model: 'local-test' });
  });
  it('preserves explicitly configured local fallback only when there is no selection or Google key', () => {
    expect(resolveAgentAIConfig({}, decrypt, { USE_LOCAL_LLM: 'true', OLLAMA_MODEL: 'fallback-local' }))
      .toMatchObject({ provider: 'ollama', model: 'fallback-local' });
    expect(() => resolveAgentAIConfig({ agentAISelection: { provider: 'openai', model: 'chosen' } }, decrypt, { USE_LOCAL_LLM: 'true' }))
      .toThrow(/not configured/i);
  });
  it('does not claim saved credentials are verified or expose them', () => {
    const status = providerStatus({ aiProviderKeys: { openai: { encrypted: 'cipher', model: 'saved', verifiedAt: 'yesterday' } } }, 'openai', {});
    expect(status).toMatchObject({ configured: true, verified: false, selected: false, live: false });
    expect(JSON.stringify(status)).not.toContain('cipher');
  });
  it('ties verification to the current model and endpoint and expires it', () => {
    const state = { aiProviderKeys: { openai: { encrypted: 'cipher', model: 'chosen', verifiedModel: 'chosen', verifiedBaseUrl: '', verifiedAt: new Date().toISOString() } } };
    expect(providerStatus(state, 'openai', {}).verified).toBe(true);
    state.aiProviderKeys.openai.model = 'different';
    expect(providerStatus(state, 'openai', {}).verified).toBe(false);
  });
  it('rejects unsupported sign-in selection before altering the current choice', () => {
    const state: any = {};
    expect(() => selectAgentModel(state, 'openai-account', 'chosen')).toThrow(/not supported/i);
    expect(state.agentAISelection).toBeUndefined();
  });
});