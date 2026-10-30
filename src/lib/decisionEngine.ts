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

/**
 * Minimum `answer_confidence` before Laya may steer anything, even in active
 * mode. Deliberately conservative and deliberately a named constant: it must be
 * fitted and validated against held-out client data before it is trusted. Until
 * then no number here has been measured for this workload.
 *
 * Two confidence numbers exist and are NOT interchangeable:
 *   - `confidence`        = 1 - normalised entropy (how peaked the distribution)
 *   - `answer_confidence` = probability of the reported answer  <- we gate on this
 */
export const MIN_AUTOMATION_CONFIDENCE = 0.9;

/**
 * Warm Laya calls were measured at 158-243 ms in this project. A 750 ms
 * deadline leaves room for local contention while keeping the UI and IDE
 * responsive. Cold-start is handled by preloading the sidecar, not by making
 * every user wait several seconds.
 */
export const DEFAULT_LAYA_TIMEOUT_MS = 750;

/** Upstream laya-serve amplification guards, mirrored so we fail locally. */
export const LAYA_LIMITS = {
  maxQuestions: 64,
  maxChoiceOptions: 100,
  maxLevels: 100,
  maxOptionsTotal: 512,
} as const;

/**
 * The 17 category keys mapped to their owning Tier 1 agent. Laya may *suggest* a
 * category, but the result is always validated against this map — the model can
 * never invent an owner or widen its own vault scope.
 *
 * Mirrors `AGENT_ARCHITECTURE.md` §6 and `agentRegistry.ts`.
 */
export const CATEGORY_OWNERS = {
  growth: 'Audit Diagnostic Agent',
  uiux: 'Audit Diagnostic Agent',
  reporting: 'Audit Diagnostic Agent',
  simulation: 'Audit Diagnostic Agent',
  performance: 'Marketing Agent',
  competitors: 'Marketing Agent',
  authority: 'SEO & Authority Agent',
  content: 'Creative Director Agent',
  social: 'Creative Director Agent',
  crm: 'AI SDR (Sales Agent)',
  customer_success: 'Customer Success Agent',
  cockpit: 'Operations Agent',
  brain: 'Operations Agent',
  second_brain: 'Operations Agent',
  operations: 'Operations Agent',
  security: 'Operations Agent',
  engineering: 'Operations Agent',
} as const;

export type CategoryKey = keyof typeof CATEGORY_OWNERS;

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
    timeoutMs: options.timeoutMs ?? (Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_LAYA_TIMEOUT_MS),
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

/**
 * Guards laya-serve's amplification limits. Exceeding them yields a 413/422 at
 * the boundary; failing here keeps the fault local and keeps shadow/fallback
 * alive instead of turning a guardrail into an outage.
 */
export function validateQuestionSet(questions: Record<string, LayaQuestion>): string | null {
  const names = Object.keys(questions);
  if (names.length === 0) return 'questions must not be empty';
  if (names.length > LAYA_LIMITS.maxQuestions) {
    return `at most ${LAYA_LIMITS.maxQuestions} questions per request`;
  }
  let optionTotal = 0;
  for (const [name, question] of Object.entries(questions)) {
    if (question.type === 'choice') {
      const count = Object.keys(question.criteria || {}).length;
      if (count > LAYA_LIMITS.maxChoiceOptions) {
        return `question "${name}" exceeds ${LAYA_LIMITS.maxChoiceOptions} choice options`;
      }
      optionTotal += count;
    } else if (question.type === 'score') {
      const levels = Array.isArray(question.criteria) ? question.criteria : [];
      if (levels.length > LAYA_LIMITS.maxLevels) {
        return `question "${name}" exceeds ${LAYA_LIMITS.maxLevels} score levels`;
      }
      // Upstream rejects an empty/null level rather than scoring it.
      if (levels.some(level => !String(level ?? '').trim())) {
        return `question "${name}" has an empty score level`;
      }
      optionTotal += levels.length;
    }
  }
  if (optionTotal > LAYA_LIMITS.maxOptionsTotal) {
    return `at most ${LAYA_LIMITS.maxOptionsTotal} options across all questions`;
  }
  return null;
}

export async function callLayaSystemOne(
  state: unknown,
  questions: Record<string, LayaQuestion>,
  options: DecisionRuntimeOptions = {},
): Promise<LayaSystemOneResult> {
  const config = runtimeOptions(options);
  if (!config.baseUrl) throw new Error('LAYA_BASE_URL is not configured');
  const limitError = validateQuestionSet(questions);
  if (limitError) throw new Error(`Laya request rejected: ${limitError}`);
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

export interface BoundedDecisionOption {
  id: string;
  description: string;
}

export interface BoundedChoiceInput {
  question: string;
  context?: string;
  options: BoundedDecisionOption[];
}

export interface BoundedChoiceDecision {
  selectedOption: string | null;
  confidence: number;
  probabilities: Record<string, number>;
  engine: 'laya' | 'unavailable';
  durationMs: number;
  advisoryOnly: true;
  requiresHITL: true;
  detail: string;
}

/**
 * Shared fast-decision seam for developer tooling such as Antigravity.
 * Laya may choose only from caller-supplied options and the result is always
 * advisory. It cannot approve execution, writes, spending, or publication.
 */
export async function recommendBoundedChoice(
  input: BoundedChoiceInput,
  options: DecisionRuntimeOptions = {},
): Promise<BoundedChoiceDecision> {
  const startedAt = Date.now();
  const question = input.question.trim();
  if (!question) throw new Error('question is required');
  if (input.options.length < 2 || input.options.length > 20) {
    throw new Error('between 2 and 20 decision options are required');
  }

  const criteria: Record<string, string> = {};
  for (const option of input.options) {
    const id = option.id.trim();
    const description = option.description.trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(id)) {
      throw new Error(`invalid option id: ${id || '<empty>'}`);
    }
    if (!description) throw new Error(`description is required for option: ${id}`);
    if (id in criteria) throw new Error(`duplicate option id: ${id}`);
    criteria[id] = description;
  }

  const unavailable = (detail: string): BoundedChoiceDecision => ({
    selectedOption: null,
    confidence: 0,
    probabilities: {},
    engine: 'unavailable',
    durationMs: Date.now() - startedAt,
    advisoryOnly: true,
    requiresHITL: true,
    detail,
  });

  const config = runtimeOptions(options);
  if (!config.baseUrl) return unavailable('Laya is not configured; no advisory recommendation was made.');

  try {
    const result = await callLayaSystemOne(
      { question, context: input.context?.trim() || undefined },
      {
        recommendation: {
          type: 'choice',
          instructions: 'Recommend one supplied option. This is advisory only and never authorizes execution.',
          criteria,
        },
      },
      config,
    );
    const answer = result.answers.recommendation;
    const selectedOption = String(answer?.value ?? '');
    if (!(selectedOption in criteria)) {
      return unavailable('Laya returned an option outside the supplied allowlist; no recommendation was accepted.');
    }
    return {
      selectedOption,
      confidence: answer?.confidence ?? 0,
      probabilities: answer?.probabilities ?? {},
      engine: 'laya',
      durationMs: result.durationMs,
      advisoryOnly: true,
      requiresHITL: true,
      detail: 'Laya recommended one allowlisted option. The operator or governing workflow remains authoritative.',
    };
  } catch {
    return unavailable('Laya did not answer within the decision deadline; no recommendation was made.');
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

// ── Agent / sub-agent decision points ──────────────────────────────────────
// Laya is a decision service the tiers call, not a tier itself.
//   T0 VANTA   -> classifyCategory()
//   T1 Agent   -> classifyActionRisk()
//   T2 Sub-agent-> authorizeSubAgentExecution()

/**
 * True only when Laya is explicitly permitted to steer AND was confident enough
 * to be believed. Anything else keeps deterministic policy in charge.
 */
function layaMaySteer(config: Required<DecisionRuntimeOptions>, confidence: number): boolean {
  return config.mode === 'active' && config.calibrated && confidence >= MIN_AUTOMATION_CONFIDENCE;
}

/**
 * Tier 0 decision: which category, and therefore which owning agent, handles
 * this intent. Deterministic keyword policy is authoritative in shadow mode.
 *
 * The returned owner always comes from `CATEGORY_OWNERS`, so a model can never
 * route work to an agent holding wider vault scope than the map allows.
 */
export async function classifyCategory(
  intent: string,
  options: DecisionRuntimeOptions = {},
) {
  const startedAt = Date.now();
  const q = intent.toLowerCase();
  let category: CategoryKey = 'growth';
  if (/\b(lead|outreach|prospect|sequence|sdr|crm|deal)\b/i.test(q)) category = 'crm';
  else if (/\b(roas|ad spend|campaign|bid|cpc|creative fatigue)\b/i.test(q)) category = 'performance';
  else if (/\b(seo|keyword|backlink|aeo|citation|schema)\b/i.test(q)) category = 'authority';
  else if (/\b(copy|carousel|video|creative|visual|brand)\b/i.test(q)) category = 'content';
  else if (/\b(churn|renewal|health score|qbr|retention)\b/i.test(q)) category = 'customer_success';
  else if (/\b(sop|workflow|schedule|cron|connector|pipeline)\b/i.test(q)) category = 'operations';
  else if (/\b(audit|diagnostic|score|funnel|competitor)\b/i.test(q)) category = 'growth';

  const fallback = {
    category,
    ownerAgent: CATEGORY_OWNERS[category],
    confidence: 0.85,
    probabilities: { [category]: 0.85 },
    engine: 'deterministic_policy' as DecisionEngine,
    durationMs: Date.now() - startedAt,
  };
  const config = runtimeOptions(options);
  if (!config.baseUrl) return fallback;
  try {
    const criteria = Object.fromEntries(
      (Object.keys(CATEGORY_OWNERS) as CategoryKey[]).map(key => [key, `work owned by ${CATEGORY_OWNERS[key]}`]),
    );
    const result = await callLayaSystemOne(`Operator intent: ${intent}`, {
      category: { type: 'choice', instructions: 'Which category of work is this?', criteria },
    }, config);
    const answer = result.answers.category;
    const candidate = String(answer?.value ?? category) as CategoryKey;
    // An unrecognised category is never honoured, even at full confidence. We
    // return the policy fallback rather than a Laya-labelled decision that
    // silently substituted a different category — the engine label must always
    // name the thing that actually chose the value.
    if (!(candidate in CATEGORY_OWNERS)) return fallback;
    const layaDecision = {
      category: candidate,
      ownerAgent: CATEGORY_OWNERS[candidate],
      confidence: answer?.confidence ?? 0,
      probabilities: answer?.probabilities ?? {},
      engine: 'laya' as DecisionEngine,
      durationMs: result.durationMs,
    };
    return layaMaySteer(config, layaDecision.confidence) ? layaDecision : { ...fallback, shadowDecision: layaDecision };
  } catch {
    return fallback;
  }
}

/**
 * Tier 2 decision: may this sub-agent run autonomously right now?
 *
 * Laya NEVER authorizes a write. The structural block below is evaluated and
 * returned BEFORE any network call, so no model is ever asked to rule on a
 * write-plane or destructive action. The human approval gate is structural,
 * not probabilistic.
 */
export async function authorizeSubAgentExecution(
  input: {
    subAgent: string;
    plane: 'read' | 'write';
    proposedAction: string;
    risk?: ActionRiskLevel;
  },
  options: DecisionRuntimeOptions = {},
) {
  const startedAt = Date.now();
  const policyRisk = input.risk || deterministicRisk({
    title: input.subAgent,
    summary: input.proposedAction,
  }).risk;
  const structuralBlock = input.plane === 'write' || policyRisk === 'CRITICAL' || policyRisk === 'HIGH';

  const authoritative = {
    permitted: !structuralBlock,
    requiresHITL: structuralBlock,
    rationale: structuralBlock
      ? `Write-plane or high-risk action (${policyRisk}) requires a human approval token.`
      : 'Read-plane action within policy; no approval required.',
    confidence: 1,
    engine: 'deterministic_policy' as DecisionEngine,
    durationMs: Date.now() - startedAt,
  };
  if (structuralBlock) return authoritative;

  const config = runtimeOptions(options);
  if (!config.baseUrl) return authoritative;
  try {
    const result = await callLayaSystemOne(
      `Sub-agent: ${input.subAgent}\nProposed action: ${input.proposedAction}`,
      {
        is_safe: {
          type: 'choice',
          instructions: 'Is this action safe to run without human review?',
          criteria: { YES: 'safe and bounded', NO: 'unsafe or outside authority' },
        },
      },
      config,
    );
    const answer = result.answers.is_safe;
    const layaDecision = {
      permitted: String(answer?.value) === 'YES',
      requiresHITL: String(answer?.value) !== 'YES',
      rationale: `Laya System 1 safety decision (confidence ${(answer?.confidence ?? 0).toFixed(2)}).`,
      confidence: answer?.confidence ?? 0,
      engine: 'laya' as DecisionEngine,
      durationMs: result.durationMs,
    };
    return layaMaySteer(config, layaDecision.confidence) ? layaDecision : { ...authoritative, shadowDecision: layaDecision };
  } catch {
    return authoritative;
  }
}
