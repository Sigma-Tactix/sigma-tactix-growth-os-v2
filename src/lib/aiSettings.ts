import type { AIProviderConfig, SupportedProvider } from './aiProvider.js';

export const AGENT_AI_PROVIDERS = ['google', 'openai', 'anthropic', 'xai', 'qwen', 'deepseek', 'glm', 'lmstudio', 'ollama', 'omniroute', 'opencode', 'openrouter', 'opusmax'] as const;
type Entry = { encrypted?: string; model?: string; baseUrl?: string; accountAuth?: boolean; updatedAt?: string; verifiedAt?: string; verifiedModel?: string; verifiedBaseUrl?: string };
export interface AISettingsState {
  aiProviderKeys?: Record<string, Entry>;
  agentAISelection?: { provider: string; model: string };
}
export const canonicalAIProvider = (provider: string) => provider === 'gemini' ? 'google' : provider;
export function providerEntry(state: AISettingsState, provider: string): Entry | undefined {
  return state.aiProviderKeys?.[canonicalAIProvider(provider)] ||
    (canonicalAIProvider(provider) === 'google' ? state.aiProviderKeys?.gemini : undefined);
}
const ENV_KEYS: Record<string, string[]> = {
  google: ['GEMINI_API_KEY'], openai: ['OPENAI_API_KEY'], anthropic: ['ANTHROPIC_API_KEY'],
  xai: ['XAI_API_KEY'], deepseek: ['DEEPSEEK_API_KEY'], qwen: ['DASHSCOPE_API_KEY', 'QWEN_API_KEY'],
  glm: ['GLM_API_KEY', 'ZHIPU_API_KEY'], omniroute: ['OMNIROUTE_API_KEY'], opencode: ['OPENCODE_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'], opusmax: ['OPUSMAX_API_KEY', 'ANTHROPIC_AUTH_TOKEN'],
};
export function environmentProviderKey(provider: string, env: Record<string, string | undefined>) {
  return ENV_KEYS[canonicalAIProvider(provider)]?.map(name => env[name]).find(Boolean);
}
export function selectAgentModel(state: AISettingsState, provider: string, model: string) {
  provider = canonicalAIProvider(provider);
  if (!(AGENT_AI_PROVIDERS as readonly string[]).includes(provider)) throw new Error('Provider is not supported for agent execution.');
  if (!model?.trim() || model.length > 200) throw new Error('A valid model identifier is required.');
  state.agentAISelection = { provider, model: model.trim() };
}
export function resolveAgentAIConfig(
  state: AISettingsState,
  decrypt: (blob: string) => { apiKey?: unknown },
  env: Record<string, string | undefined>,
): AIProviderConfig {
  const selection = state.agentAISelection;
  let provider = canonicalAIProvider(selection?.provider || 'google');
  if (!selection && !providerEntry(state, 'google')?.encrypted && !env.GEMINI_API_KEY && (env.OLLAMA_BASE_URL || env.USE_LOCAL_LLM === 'true')) provider = 'ollama';
  if (!(AGENT_AI_PROVIDERS as readonly string[]).includes(provider)) throw new Error('Selected agent provider is not supported.');
  const entry = providerEntry(state, provider);
  const local = provider === 'ollama' || provider === 'lmstudio';
  // A stored credential that cannot be decrypted must fail, not silently change identity.
  const savedKey = entry?.encrypted ? decrypt(entry.encrypted).apiKey : undefined;
  const apiKey = typeof savedKey === 'string' && savedKey ? savedKey : environmentProviderKey(provider, env);
  if (!local && !apiKey) throw new Error(`${provider} is not configured. Save credentials in AI Provider settings.`);
  return {
    provider: provider as SupportedProvider,
    model: selection?.model || entry?.model || (provider === 'ollama' ? env.OLLAMA_MODEL || 'qwen2.5:14b' : 'gemini-3.5-flash'),
    apiKey: local ? 'local-on-device' : apiKey,
    baseUrl: entry?.baseUrl || (provider === 'ollama' ? env.OLLAMA_BASE_URL : provider === 'lmstudio' ? env.LMSTUDIO_BASE_URL : undefined),
    timeoutMs: 90_000,
  };
}
export function providerStatus(state: AISettingsState, provider: string, env: Record<string, string | undefined>) {
  provider = canonicalAIProvider(provider);
  const entry = providerEntry(state, provider);
  const selected = canonicalAIProvider(state.agentAISelection?.provider || 'google') === provider;
  const selectedModel = selected ? state.agentAISelection?.model || entry?.model : undefined;
  const timestamp = Date.parse(entry?.verifiedAt || '');
  const verified = Number.isFinite(timestamp) && timestamp <= Date.now() && Date.now() - timestamp < 7 * 86400_000 &&
    entry?.verifiedModel === (selectedModel || entry?.model) && entry?.verifiedBaseUrl === (entry?.baseUrl || '');
  return {
    provider, configured: !!entry?.encrypted || !!environmentProviderKey(provider, env) ||
      ((provider === 'ollama' || provider === 'lmstudio') && !!entry?.model),
    model: entry?.model || (provider === 'google' ? 'gemini-3.5-flash' : ''),
    baseUrl: entry?.baseUrl, accountAuth: entry?.accountAuth,
    updatedAt: entry?.updatedAt || null, verifiedAt: entry?.verifiedAt || null,
    verified, live: verified, selected, selectedModel,
    agentSupported: (AGENT_AI_PROVIDERS as readonly string[]).includes(provider),
  };
}