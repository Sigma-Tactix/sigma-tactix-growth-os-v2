export type ActionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TargetModuleKey =
  | 'SEO_AEO'
  | 'PAID_ADS'
  | 'OUTREACH'
  | 'CONTENT'
  | 'INTAKE'
  | 'DIAGNOSTICS'
  | 'CONNECTORS'
  | 'AGENTS'
  | 'CREATIVE';

export type DecisionRuntimeState =
  | 'unconfigured'
  | 'loading'
  | 'ready_unvalidated'
  | 'shadow'
  | 'calibrated'
  | 'degraded'
  | 'failed';

export type DecisionRuntimeMode = 'shadow' | 'active';
export type DecisionEngine = 'laya' | 'deterministic_policy';

export interface DecisionRuntimeStatus {
  provider: 'laya';
  configured: boolean;
  reachable: boolean;
  state: DecisionRuntimeState;
  mode: DecisionRuntimeMode;
  model: string;
  calibrated: boolean;
  executionEligible: boolean;
  checkedAt: string;
  detail: string;
}

export interface DecisionRuntimeOptions {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  mode?: DecisionRuntimeMode;
  calibrated?: boolean;
}

interface DecisionEnvironment {
  LAYA_BASE_URL?: string;
  LAYA_API_KEY?: string;
  LAYA_MODEL?: string;
  LAYA_TIMEOUT_MS?: string;
  LAYA_MODE?: string;
  LAYA_CALIBRATED?: string;
}

export interface LayaChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
}

export interface LayaScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

export interface LayaNoulQuestion {
  type: 'noul';
  instructions: string;
}

export type LayaQuestion = LayaChoiceQuestion | LayaScoreQuestion | LayaNoulQuestion;

export interface NormalizedDecisionAnswer {
  value: string | number | boolean;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface LayaSystemOneResult {
  answers: Record<string, NormalizedDecisionAnswer>;
  durationMs: number;
  usage?: { input_tokens?: number; output_tokens?: number };
}

function runtimeOptions(options: DecisionRuntimeOptions = {}, env: DecisionEnvironment = process.env): Required<DecisionRuntimeOptions> {
  const configuredTimeout = Number(env.LAYA_TIMEOUT_MS);
  return {
    baseUrl: (options.baseUrl ?? env.LAYA_BASE_URL ?? '').trim().replace(/\/$/, ''),
    apiKey: (options.apiKey ?? env.LAYA_API_KEY ?? '').trim(),
    model: (options.model ?? env.LAYA_MODEL ?? 'auto').trim(),
    timeoutMs: options.timeoutMs ?? (Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 8_000),
    mode: options.mode ?? (env.LAYA_MODE === 'active' ? 'active' : 'shadow'),
    calibrated: options.calibrated ?? env.LAYA_CALIBRATED === 'true',
  };
}

function answerConfidence(answer: any, probabilities: Record<string, number>): number {
  const explicit = Number(answer?.answer_confidence ?? answer?.confidence);
  if (Number.isFinite(explicit)) return Math.max(0, Math.min(1, explicit));
  const values = Object.values(probabilities).filter(Number.isFinite);
  return values.length ? Math.max(...values) : 0;
}

function normalizeAnswer(answer: any): NormalizedDecisionAnswer {
  const probabilities = answer?.probabilities && typeof answer.probabilities === 'object'
    ? Object.fromEntries(Object.entries(answer.probabilities).map(([key, value]) => [key, Number(value)]).filter(([, value]) => Number.isFinite(value)))
    : {};
  const value = answer?.choice ?? answer?.value ?? answer?.score ?? answer?.noul ?? false;
  return { value, confidence: answerConfidence(answer, probabilities), probabilities };
}

export async function callLayaSystemOne(
  state: unknown,
  questions: Record<string, LayaQuestion>,
  options: DecisionRuntimeOptions = {},
): Promise<LayaSystemOneResult> {
  const config = runtimeOptions(options);
  if (!config.baseUrl) throw new Error('LAYA_BASE_URL is not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(`${config.baseUrl}/v1/systemone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        state,
        questions,
        ...(config.model !== 'auto' ? { model: config.model } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Laya HTTP ${response.status}`);
    const payload = await response.json() as any;
    return {
      answers: Object.fromEntries(Object.entries(payload.answers ?? {}).map(([key, answer]) => [key, normalizeAnswer(answer)])),
      durationMs: Date.now() - startedAt,
      usage: payload.usage,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function getDecisionRuntimeStatus(
  input: { env?: DecisionEnvironment; options?: DecisionRuntimeOptions } = {},
): Promise<DecisionRuntimeStatus> {
  const config = runtimeOptions(input.options, input.env ?? process.env);
  const checkedAt = new Date().toISOString();
  if (!config.baseUrl) {
    return {
      provider: 'laya', configured: false, reachable: false, state: 'unconfigured', mode: config.mode,
      model: config.model, calibrated: false, executionEligible: false, checkedAt,
      detail: 'Set LAYA_BASE_URL after starting the local Laya HTTP runtime.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(config.timeoutMs, 3_000));
  try {
    const response = await fetch(`${config.baseUrl}/health`, {
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`health probe returned ${response.status}`);
    const health = await response.json().catch(() => ({})) as { loaded?: unknown };
    const checkpointLoaded = Array.isArray(health.loaded) && health.loaded.length > 0;
    const state: DecisionRuntimeState = !checkpointLoaded
      ? 'ready_unvalidated'
      : config.mode === 'shadow'
        ? 'shadow'
        : config.calibrated ? 'calibrated' : 'ready_unvalidated';
    return {
      provider: 'laya', configured: true, reachable: true, state, mode: config.mode,
      model: config.model, calibrated: config.calibrated,
      executionEligible: checkpointLoaded && config.mode === 'active' && config.calibrated,
      checkedAt,
      detail: !checkpointLoaded
        ? 'HTTP runtime is reachable, but no decision checkpoint is loaded or verified.'
        : state === 'shadow'
        ? 'Reachable and observing decisions; deterministic policy remains authoritative.'
        : state === 'calibrated'
          ? 'Reachable, calibrated, and eligible to drive governed workflows.'
          : 'Reachable but not calibrated; automation remains disabled.',
    };
  } catch (error) {
    const detail = error instanceof Error && error.name === 'AbortError'
      ? 'Laya health probe timed out.'
      : 'Laya is configured but its health endpoint is unreachable.';
    return {
      provider: 'laya', configured: true, reachable: false, state: 'degraded', mode: config.mode,
      model: config.model, calibrated: config.calibrated, executionEligible: false, checkedAt, detail,
    };
  } finally {
    clearTimeout(timer);
  }
}

function deterministicRisk(action: { title: string; summary: string; details?: string }) {
  const text = `${action.title} ${action.summary} ${action.details || ''}`.toLowerCase();
  let risk: ActionRiskLevel = 'LOW';
  let requiresHITL = false;
  if (/critical|emergency|breach|exploit|zero-day|drop table/i.test(text)) {
    risk = 'CRITICAL';
    requiresHITL = true;
  } else if (/budget|re-allocat|\$|spend|token|payment|stripe/i.test(text)) {
    risk = 'HIGH';
    requiresHITL = true;
  } else if (/schema|publish|cms|outreach|email|cadence|alert|warning|fatigue|decay|expired/i.test(text)) {
    risk = 'MEDIUM';
  }
  return { risk, requiresHITL, confidence: 0.88, probabilities: { [risk]: 0.88 } };
}

interface RiskDecision {
  risk: ActionRiskLevel;
  confidence: number;
  probabilities: Record<string, number>;
  requiresHITL: boolean;
  engine: DecisionEngine;
  durationMs: number;
}

export async function classifyActionRisk(
  action: { title: string; summary: string; module: string; details?: string },
  options: DecisionRuntimeOptions = {},
): Promise<RiskDecision & { shadowDecision?: RiskDecision }> {
  const startedAt = Date.now();
  const policy = deterministicRisk(action);
  const fallback: RiskDecision = { ...policy, engine: 'deterministic_policy', durationMs: Date.now() - startedAt };
  const config = runtimeOptions(options);
  if (!config.baseUrl) return fallback;
  try {
    const result = await callLayaSystemOne(action, {
      risk_level: {
        type: 'choice', instructions: 'Classify the operational risk of this Growth OS action.',
        criteria: { LOW: 'reversible and low impact', MEDIUM: 'bounded operational impact', HIGH: 'material spend, publishing, customer, or data impact', CRITICAL: 'destructive, security, or irreversible impact' },
      },
      requires_hitl: {
        type: 'choice', instructions: 'Must a human approve this action before execution?',
        criteria: { YES: 'human approval is required', NO: 'policy permits automatic execution' },
      },
    }, config);
    const riskAnswer = result.answers.risk_level;
    const hitlAnswer = result.answers.requires_hitl;
    const candidate = String(riskAnswer?.value ?? 'MEDIUM') as ActionRiskLevel;
    const risk: ActionRiskLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(candidate) ? candidate : 'MEDIUM';
    const layaDecision: RiskDecision = {
      risk,
      confidence: riskAnswer?.confidence ?? 0,
      probabilities: riskAnswer?.probabilities ?? {},
      requiresHITL: hitlAnswer?.value === 'YES' || risk === 'HIGH' || risk === 'CRITICAL',
      engine: 'laya',
      durationMs: result.durationMs,
    };
    return config.mode === 'active' && config.calibrated ? layaDecision : { ...fallback, shadowDecision: layaDecision };
  } catch {
    return fallback;
  }
}

function deterministicRoute(issueText: string): { targetModule: TargetModuleKey; suggestedAction: string } {
  const q = issueText.toLowerCase();
  if (/\b(whatsapp|intake|demo|booking|form|sla)\b/i.test(q)) return { targetModule: 'INTAKE', suggestedAction: 'Triage inbound submission via Sub-60s agent' };
  if (/\b(ads?|roas|cpc|meta|facebook|google ads|campaigns?)\b/i.test(q)) return { targetModule: 'PAID_ADS', suggestedAction: 'Inspect ad set pacing and budget allocation' };
  if (/\b(seo|keywords?|gsc|aeo|perplexity|searchgpt|ranking)\b/i.test(q)) return { targetModule: 'SEO_AEO', suggestedAction: 'Update structured citations and keyword targets' };
  if (/\b(leads?|outreach|email|prospects?|b2b|sequence|apollo)\b/i.test(q)) return { targetModule: 'OUTREACH', suggestedAction: 'Queue prospect into the governed outreach workflow' };
  if (/\b(blog|article|carousel|linkedin|copy|threads?)\b/i.test(q)) return { targetModule: 'CONTENT', suggestedAction: 'Open the content workflow with this issue attached' };
  if (/\b(connectors?|apis?|tokens?|oauth|webhooks?|sync)\b/i.test(q)) return { targetModule: 'CONNECTORS', suggestedAction: 'Verify connector health and authorization' };
  if (/\b(images?|videos?|motion|remotion|flux|thumbnails?)\b/i.test(q)) return { targetModule: 'CREATIVE', suggestedAction: 'Open the creative production workflow' };
  return { targetModule: 'DIAGNOSTICS', suggestedAction: 'Run a diagnostic scan to identify the cause' };
}

export async function routeIssueToModule(
  issue: { issueText: string; sourceChannel?: string },
  options: DecisionRuntimeOptions = {},
) {
  const startedAt = Date.now();
  const policy = deterministicRoute(issue.issueText);
  const fallback = { ...policy, confidence: 0.85, probabilities: { [policy.targetModule]: 0.85 }, engine: 'deterministic_policy' as const, durationMs: Date.now() - startedAt };
  const config = runtimeOptions(options);
  if (!config.baseUrl) return fallback;
  try {
    const criteria = Object.fromEntries((['SEO_AEO', 'PAID_ADS', 'OUTREACH', 'CONTENT', 'INTAKE', 'DIAGNOSTICS', 'CONNECTORS', 'AGENTS', 'CREATIVE'] as TargetModuleKey[])
      .map(module => [module, `Route issues owned by the ${module} Growth OS module.`]));
    const result = await callLayaSystemOne(issue, {
      target_module: { type: 'choice', instructions: 'Which Growth OS module should own this issue?', criteria },
    }, config);
    const answer = result.answers.target_module;
    const candidate = String(answer?.value ?? 'DIAGNOSTICS') as TargetModuleKey;
    const targetModule = candidate in criteria ? candidate : 'DIAGNOSTICS';
    const layaDecision = {
      targetModule, confidence: answer?.confidence ?? 0, probabilities: answer?.probabilities ?? {},
      suggestedAction: `Open the ${targetModule} workflow with this issue attached`, engine: 'laya' as const, durationMs: result.durationMs,
    };
    return config.mode === 'active' && config.calibrated ? layaDecision : { ...fallback, shadowDecision: layaDecision };
  } catch {
    return fallback;
  }
}

export async function evaluateAgentSwarmSafety(
  action: { agentName: string; goal: string; proposedAction: string },
  options: DecisionRuntimeOptions = {},
) {
  const startedAt = Date.now();
  const dangerous = /delete|drop|wipe|destroy|unauthorized|leak|export_all|format/i.test(`${action.proposedAction} ${action.goal}`);
  const fallback = {
    safe: !dangerous, risk: (dangerous ? 'CRITICAL' : 'LOW') as ActionRiskLevel, confidence: 0.9,
    rationale: dangerous ? 'Deterministic policy detected a potentially destructive action.' : 'Deterministic policy found no blocked operation.',
    engine: 'deterministic_policy' as const, durationMs: Date.now() - startedAt,
  };
  const config = runtimeOptions(options);
  if (!config.baseUrl) return fallback;
  try {
    const result = await callLayaSystemOne(action, {
      is_safe: { type: 'choice', instructions: 'Is this proposed agent action safe within the stated goal?', criteria: { YES: 'safe and bounded', NO: 'unsafe, destructive, or outside authority' } },
      risk_level: { type: 'choice', instructions: 'Classify the action risk.', criteria: { LOW: 'low impact', MEDIUM: 'bounded impact', HIGH: 'material impact', CRITICAL: 'destructive or irreversible' } },
    }, config);
    const safe = result.answers.is_safe?.value === 'YES';
    const candidate = String(result.answers.risk_level?.value ?? (safe ? 'LOW' : 'HIGH')) as ActionRiskLevel;
    const risk: ActionRiskLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(candidate) ? candidate : 'HIGH';
    const layaDecision = {
      safe, risk, confidence: result.answers.is_safe?.confidence ?? 0,
      rationale: safe ? 'Laya classified the action as safe and bounded.' : 'Laya classified the action as requiring human review.',
      engine: 'laya' as const, durationMs: result.durationMs,
    };
    return config.mode === 'active' && config.calibrated ? layaDecision : { ...fallback, shadowDecision: layaDecision };
  } catch {
    return fallback;
  }
}
