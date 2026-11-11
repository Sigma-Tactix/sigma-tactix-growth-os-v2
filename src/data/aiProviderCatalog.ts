/**
 * Client-side provider catalog for the Admin AI-key screen.
 *
 * The SERVER keeps its own authoritative lists (`UI_PRIMARY_PROVIDERS` for the
 * read endpoint, `SUPPORTED_AI_PROVIDERS` for validation) in `server.ts` and is
 * deliberately NOT coupled to this file — its handlers are extracted and stubbed
 * in `src/lib/aiSettingsRoutes.test.ts`. This catalog is the mirror the browser
 * merges saved keys against: if a provider the server can save/list is missing
 * here, a just-saved key silently disappears on the next refresh and reads as
 * "my key update didn't stick".
 *
 * `src/data/aiProviderCatalog.test.ts` locks the parity invariant.
 */

export interface ProviderCatalogEntry {
  provider: string;
  name: string;
  defaultModel: string;
  live: boolean;
  priceRange: string;
}

/**
 * Mirrors server.ts `UI_PRIMARY_PROVIDERS`. Keep these two lists in sync; the
 * test asserts every server-listed provider has a catalog entry.
 */
export const ALL_SUPPORTED_PROVIDERS: ProviderCatalogEntry[] = [
  { provider: 'google', name: 'Google Cloud (Gemini)', defaultModel: 'gemini-3.5-flash', live: true, priceRange: '$0.075 – $1.25 / 1M' },
  { provider: 'anthropic', name: 'Anthropic (Claude)', defaultModel: 'claude-3-5-sonnet', live: false, priceRange: '$0.80 – $15.00 / 1M' },
  { provider: 'openai', name: 'OpenAI (GPT & o-Series)', defaultModel: 'gpt-4o', live: false, priceRange: '$0.15 – $15.00 / 1M' },
  { provider: 'xai', name: 'xAI (Grok)', defaultModel: 'grok-2-1212', live: false, priceRange: '$2.00 – $5.00 / 1M' },
  { provider: 'qwen', name: 'Alibaba Cloud (Qwen)', defaultModel: 'qwen-2.5-72b', live: false, priceRange: '$0.05 – $1.60 / 1M' },
  { provider: 'deepseek', name: 'DeepSeek AI', defaultModel: 'deepseek-v3', live: false, priceRange: '$0.14 – $0.55 / 1M' },
  { provider: 'glm', name: 'Zhipu AI (GLM)', defaultModel: 'glm-4-plus', live: false, priceRange: '$0.01 – $1.40 / 1M' },
  { provider: 'lmstudio', name: 'LM Studio (Local)', defaultModel: 'llama-3.3-70b-instruct', live: false, priceRange: '$0.00 / 1M (on-device)' },
  { provider: 'ollama', name: 'Ollama (Local)', defaultModel: 'qwen2.5:14b', live: false, priceRange: '$0.00 / 1M (on-device)' },
  { provider: 'omniroute', name: 'Omniroute Gateway', defaultModel: 'omniroute-auto', live: false, priceRange: 'Per-gateway tier' },
  { provider: 'opencode', name: 'Open Code', defaultModel: 'opencode-default', live: false, priceRange: 'Per-gateway tier' },
  { provider: 'openrouter', name: 'OpenRouter Unified', defaultModel: 'openrouter/auto', live: false, priceRange: 'Per-route' },
  { provider: 'opusmax', name: 'OpusMax Gateway (Claude family)', defaultModel: 'claude-opus-5-5', live: false, priceRange: '$0.80 – $15.00 / 1M (per gateway tier)' },
  { provider: 'openai-account', name: 'OpenAI Account (ChatGPT / Codex)', defaultModel: 'openai-account', live: false, priceRange: 'Subscription (no per-token cost)' },
];

/** The set of provider ids the client must be able to represent. */
export const ALL_AI_PROVIDER_IDS: ReadonlySet<string> = new Set(
  ALL_SUPPORTED_PROVIDERS.map((p) => p.provider),
);
