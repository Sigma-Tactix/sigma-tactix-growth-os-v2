import { getIdToken } from './auth';
import { 
  TokenTelemetrySummary, 
  AIKeyConfig, 
  AgentReachDoctorSummary, 
  AgentReachFetchResult,
  CompetitorBattlecard,
  RepurposedArticle,
  RepurposedCarouselAndThread,
  GoogleAdsMcpStatus,
  DecisionTraceRecord,
} from '../types';

// One fetch wrapper for every call to our own backend — attaches the
// Supabase session token so /api/workspace/* requests pass server-side auth.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();
  const headers = new Headers(options.headers);
  // FormData (file uploads) must NOT get an explicit Content-Type — the
  // browser sets multipart/form-data with the correct boundary itself; a
  // manually-set header here would break every upload.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!headers.has('Content-Type') && options.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(path, { ...options, headers });
}

// Token Metering & Profitability Telemetry
export async function getTokenTelemetry(): Promise<TokenTelemetrySummary> {
  const res = await apiFetch('/api/workspace/telemetry/tokens');
  if (!res.ok) {
    throw new Error(`Failed to load token telemetry: ${res.statusText}`);
  }
  const data = await res.json();
  return data.telemetry;
}

// AI Model & Provider Key Configuration
export async function selectAgentAIModel(provider: string, model: string): Promise<void> {
  const res = await apiFetch('/api/workspace/admin/ai/selection', {
    method: 'POST', body: JSON.stringify({ provider, model }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not select agent model.');
  }
}
export async function getAIProviderKeys(): Promise<AIKeyConfig[]> {
  const res = await apiFetch('/api/workspace/admin/ai-keys');
  if (!res.ok) {
    throw new Error(`Failed to load AI keys: ${res.statusText}`);
  }
  const data = await res.json();
  return data.providers || [];
}

export async function saveAIProviderKey(
  provider: string,
  apiKey: string,
  model?: string,
  extras?: { baseUrl?: string; accountAuth?: boolean }
): Promise<{ success: boolean; configured: boolean; live: boolean; accountAuth?: boolean }> {
  const res = await apiFetch('/api/workspace/admin/ai-keys', {
    method: 'POST',
    body: JSON.stringify({
      provider,
      apiKey,
      model,
      baseUrl: extras?.baseUrl?.trim() || undefined,
      accountAuth: extras?.accountAuth,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Failed to save AI key: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchProviderModels(provider: string, apiKey?: string): Promise<string[]> {
  const res = await apiFetch(`/api/workspace/admin/ai-keys/${provider}/models`, {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Failed to fetch models: ${res.statusText}`);
  }
  const data = await res.json();
  return data.models || [];
}

export async function deleteAIProviderKey(provider: string): Promise<{ success: boolean }> {
  const res = await apiFetch(`/api/workspace/admin/ai-keys/${provider}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete key: ${res.statusText}`);
  }
  return res.json();
}

export async function testModelInference(provider: string, model: string, prompt?: string, baseUrl?: string): Promise<{
  success: boolean;
  text: string;
  provider: string;
  model: string;
  durationMs: number;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  costUsd: number;
}> {
  const res = await apiFetch('/api/workspace/admin/ai/test-inference', {
    method: 'POST',
    body: JSON.stringify({ provider, model, prompt, baseUrl: baseUrl?.trim() || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Inference test failed: ${res.statusText}`);
  }
  return res.json();
}

// OpusMax gateway key verification (mirrors `opusmax-gateway`'s /key-status check)
export async function checkOpusMaxKeyStatus(apiKey?: string, baseUrl?: string): Promise<{
  success: boolean;
  active: boolean;
  status: string | null;
  name: string | null;
  quotaBlocked: boolean;
  expiresAt: string | null;
  error?: string;
}> {
  const res = await apiFetch('/api/workspace/admin/ai-keys/opusmax/key-status', {
    method: 'POST',
    body: JSON.stringify({ apiKey, baseUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `OpusMax key check failed: ${res.statusText}`);
  }
  return res.json();
}

// Local LLM Port & Status Handshake (LM Studio & Ollama)
export async function pingLocalLLM(provider: 'lmstudio' | 'ollama', baseUrl?: string): Promise<{
  active: boolean;
  latencyMs: number;
  models: string[];
  baseUrl: string;
  provider: string;
  error?: string;
}> {
  const res = await apiFetch('/api/workspace/admin/local-llm/ping', {
    method: 'POST',
    body: JSON.stringify({ provider, baseUrl }),
  });
  if (!res.ok) {
    return {
      active: false,
      latencyMs: 0,
      models: [],
      baseUrl: baseUrl || (provider === 'lmstudio' ? 'http://localhost:1234/v1' : 'http://localhost:11434/v1'),
      provider,
      error: `Server error: ${res.statusText}`
    };
  }
  return res.json();
}

// Full Harness Topology & Port Status
export async function getHarnessStatus(): Promise<{
  success: boolean;
  timestamp: string;
  ports?: Record<number, { active: boolean; name: string }>;
  layers: {
    presentation: any;
    api: any;
    data: any;
    localRuntimes: any;
    externalCloud: any;
  };
}> {
  const res = await apiFetch('/api/workspace/admin/harness/status');
  if (!res.ok) {
    throw new Error(`Failed to load harness status: ${res.statusText}`);
  }
  return res.json();
}

// Billing & Subscription Tier Gating
export async function getWorkspaceTier(): Promise<{ tier_key: string; modules: Record<string, boolean>; limits: Record<string, any> }> {
  const res = await apiFetch('/api/workspace/billing/tier');
  if (!res.ok) {
    throw new Error(`Failed to fetch workspace tier: ${res.statusText}`);
  }
  const data = await res.json();
  return data.entitlements;
}

export async function getBillingTiers(): Promise<any[]> {
  const res = await apiFetch('/api/workspace/billing/tiers');
  if (!res.ok) {
    throw new Error(`Failed to fetch tiers: ${res.statusText}`);
  }
  const data = await res.json();
  return data.tiers || [];
}

export async function setWorkspaceTier(tierKey: string): Promise<any> {
  const res = await apiFetch('/api/workspace/billing/set-tier', {
    method: 'POST',
    body: JSON.stringify({ tierKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Failed to set tier: ${res.statusText}`);
  }
  return res.json();
}

export async function createCheckoutSession(tierKey: string): Promise<{ success: boolean; url: string }> {
  const res = await apiFetch('/api/workspace/billing/checkout-session', {
    method: 'POST',
    body: JSON.stringify({ tierKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Failed to create checkout session: ${res.statusText}`);
  }
  return res.json();
}

// Second Brain Document Analysis & Summarization
export interface DocumentAnalysisResult {
  title: string;
  category: string;
  classification: 'STRATEGIC_CORE' | 'OPERATIONAL_PUBLIC' | 'RESTRICTED_C_LEVEL' | 'AUDIT_DIAGNOSTIC';
  summary: string;
  content: string;
  tags: string[];
}

export interface AnalyzeDocumentResponse {
  success: boolean;
  analysis: DocumentAnalysisResult;
  fileName: string;
  fileSize: string;
  mimeType: string;
}

export async function analyzeVaultDocument(fileOrPayload: File | { text: string; fileName?: string }): Promise<AnalyzeDocumentResponse> {
  let body: BodyInit;
  if (fileOrPayload instanceof File) {
    const formData = new FormData();
    formData.append('file', fileOrPayload);
    body = formData;
  } else {
    body = JSON.stringify(fileOrPayload);
  }

  const res = await apiFetch('/api/workspace/vault/analyze-document', {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Document analysis failed: ${res.statusText}`);
  }

  return res.json();
}

// Agent Reach — Multi-Channel Capability Router
export async function getAgentReachDoctor(): Promise<AgentReachDoctorSummary> {
  const res = await apiFetch('/api/workspace/agent-reach/doctor');
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('Backend route not registered on active server process. Please restart the backend server (Ctrl+C and npm run dev) to load new endpoints.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Failed to fetch Agent Reach doctor: ${res.statusText}`);
  }
  const data = await res.json();
  return data.summary;
}

export async function getGoogleAdsMcpStatus(): Promise<GoogleAdsMcpStatus> {
  const res = await apiFetch('/api/workspace/google-ads-mcp/status');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Google Ads MCP status check failed: ${res.statusText}`);
  return data.status;
}

export async function discoverGoogleAdsMcpCustomers(): Promise<{
  customers: string[];
  verified: boolean;
  checkedAt: string;
}> {
  const res = await apiFetch('/api/workspace/google-ads-mcp/customers', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Google Ads MCP customer discovery failed: ${res.statusText}`);
  return data;
}

export async function fetchAgentReachContent(payload: {
  channel: string;
  target: string;
  options?: any;
}): Promise<AgentReachFetchResult> {
  const res = await apiFetch('/api/workspace/agent-reach/fetch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const contentType = res.headers.get('content-type') || '';
  if (res.status === 404 || contentType.includes('text/html')) {
    throw new Error('Endpoint /api/workspace/agent-reach/fetch is not mounted on the active dev server process. Please restart `npm run dev` in your terminal.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Agent Reach fetch failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data.result;
}

export async function syncAgentReachSocial(payload: {
  keyword: string;
  channel?: string;
}): Promise<{ success: boolean; mention: any; rawResult: any; resultCount?: number }> {
  const res = await apiFetch('/api/workspace/agent-reach/sync-social', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const contentType = res.headers.get('content-type') || '';
  if (res.status === 404 || contentType.includes('text/html')) {
    throw new Error('Endpoint /api/workspace/agent-reach/sync-social is not mounted on the active dev server process. Please restart `npm run dev` in your terminal.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Agent Reach social sync failed: ${res.statusText}`);
  }
  return res.json();
}

// Phase 2: Live Competitor Radar Scan
export async function scanCompetitorWithAgentReach(payload: {
  target: string;
  competitorName?: string;
}): Promise<CompetitorBattlecard> {
  const res = await apiFetch('/api/workspace/agent-reach/competitor-scan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Competitor scan failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data.battlecard;
}

// Phase 3: Editorial Article Repurposing
export async function repurposeArticleWithAgentReach(payload: {
  sourceUrl: string;
  format?: string;
  targetAudience?: string;
}): Promise<RepurposedArticle> {
  const res = await apiFetch('/api/workspace/agent-reach/repurpose-article', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Article repurposing failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data.article;
}

// Phase 3: LinkedIn Carousel & Twitter Thread Repurposing
export async function repurposeCarouselWithAgentReach(payload: {
  sourceUrl: string;
  topic?: string;
}): Promise<RepurposedCarouselAndThread> {
  const res = await apiFetch('/api/workspace/agent-reach/repurpose-carousel', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Carousel repurposing failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDecisionTraces(limit: number = 25): Promise<DecisionTraceRecord[]> {
  const res = await apiFetch(`/api/workspace/decisions/traces?limit=${limit}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Decision traces unavailable: ${res.statusText}`);
  return data.traces || [];
}

// Web Intelligence (TinyFish) API
export async function getWebIntelligenceCapabilities() {
  const res = await apiFetch('/api/workspace/web-intelligence/capabilities');
  if (!res.ok) throw new Error(`Failed to fetch web intelligence capabilities: ${res.statusText}`);
  return res.json();
}

export async function verifyWebIntelligence() {
  const res = await apiFetch('/api/workspace/web-intelligence/verify', { method: 'POST' });
  if (!res.ok) throw new Error(`Web intelligence verification failed: ${res.statusText}`);
  return res.json();
}

export async function searchWebIntelligence(query: string, maxResults?: number, location?: string, language?: string) {
  const res = await apiFetch('/api/workspace/web-intelligence/search', {
    method: 'POST',
    body: JSON.stringify({ query, maxResults, location, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Web intelligence search failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchWebIntelligence(urls: string[], format?: 'markdown' | 'html' | 'json') {
  const res = await apiFetch('/api/workspace/web-intelligence/fetch', {
    method: 'POST',
    body: JSON.stringify({ urls, format }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Web intelligence fetch failed: ${res.statusText}`);
  }
  return res.json();
}

// Market Simulation (MiroFish) API
export async function getMarketSimulationCapabilities() {
  const res = await apiFetch('/api/workspace/market-simulations/capabilities');
  if (!res.ok) throw new Error(`Failed to fetch market simulation capabilities: ${res.statusText}`);
  return res.json();
}

export async function verifyMarketSimulation() {
  const res = await apiFetch('/api/workspace/market-simulations/verify', { method: 'POST' });
  if (!res.ok) throw new Error(`Market simulation verification failed: ${res.statusText}`);
  return res.json();
}

export async function createMarketSimulation(payload: {
  title: string;
  question: string;
  evidenceSnapshotIds?: string[];
  assumptions?: string[];
  excludedDataClasses?: string[];
}) {
  const res = await apiFetch('/api/workspace/market-simulations/simulations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Market simulation failed: ${res.statusText}`);
  }
  return res.json();
}

