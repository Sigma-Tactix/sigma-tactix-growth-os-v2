import { getIdToken } from './auth';
import { TokenTelemetrySummary, AIKeyConfig } from '../types';

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
  model?: string
): Promise<{ success: boolean; configured: boolean; live: boolean }> {
  const res = await apiFetch('/api/workspace/admin/ai-keys', {
    method: 'POST',
    body: JSON.stringify({ provider, apiKey, model }),
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

export async function testModelInference(provider: string, model: string, prompt?: string): Promise<{
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
    body: JSON.stringify({ provider, model, prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Inference test failed: ${res.statusText}`);
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

