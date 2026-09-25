import crypto from 'crypto';

export type DecisionOperation = 'triage' | 'route' | 'safety';

export interface DecisionTraceInsert {
  operation: DecisionOperation;
  provider: string;
  mode: 'shadow' | 'active' | 'fallback';
  authoritative_engine: string;
  selected_value: Record<string, unknown>;
  confidence: number;
  probabilities: Record<string, number>;
  requires_hitl: boolean;
  policy_override: boolean;
  shadow_provider: string | null;
  shadow_decision: Record<string, unknown> | null;
  input_hash: string;
  question_set_hash: string;
  duration_ms: number;
}

interface DecisionTraceInput {
  operation: DecisionOperation;
  input: unknown;
  questionSet: unknown;
  result: Record<string, any>;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hash(value: unknown): string {
  return crypto.createHash('sha256').update(stable(value)).digest('hex');
}

function selection(operation: DecisionOperation, result: Record<string, any>): Record<string, unknown> {
  if (operation === 'triage') return { risk: result.risk };
  if (operation === 'route') return { targetModule: result.targetModule };
  return { safe: Boolean(result.safe), risk: result.risk };
}

export function buildDecisionTrace(input: DecisionTraceInput): DecisionTraceInsert {
  const selectedValue = selection(input.operation, input.result);
  const shadow = input.result.shadowDecision as Record<string, any> | undefined;
  const shadowValue = shadow ? selection(input.operation, shadow) : null;
  return {
    operation: input.operation,
    provider: input.result.engine === 'laya' ? 'laya' : 'deterministic_policy',
    mode: input.result.engine === 'laya' ? 'active' : shadow ? 'shadow' : 'fallback',
    authoritative_engine: String(input.result.engine || 'deterministic_policy'),
    selected_value: selectedValue,
    confidence: Number(input.result.confidence) || 0,
    probabilities: input.result.probabilities || {},
    requires_hitl: Boolean(input.result.requiresHITL ?? !input.result.safe),
    policy_override: Boolean(shadowValue && stable(shadowValue) !== stable(selectedValue)),
    shadow_provider: shadow?.engine ? String(shadow.engine) : null,
    shadow_decision: shadow ? {
      ...shadowValue,
      confidence: Number(shadow.confidence) || 0,
      probabilities: shadow.probabilities || {},
      requiresHITL: Boolean(shadow.requiresHITL ?? !shadow.safe),
      durationMs: Number(shadow.durationMs) || 0,
    } : null,
    input_hash: hash(input.input),
    question_set_hash: hash(input.questionSet),
    duration_ms: Number(input.result.durationMs) || 0,
  };
}

export function decisionTraceToVantaContext(trace: Record<string, any>): string {
  const content = {
    id: trace.id,
    operation: trace.operation,
    authoritativeEngine: trace.authoritative_engine,
    selectedValue: trace.selected_value,
    confidence: trace.confidence,
    probabilities: trace.probabilities,
    requiresHITL: trace.requires_hitl,
    policyOverride: trace.policy_override,
    shadowProvider: trace.shadow_provider,
    shadowDecision: trace.shadow_decision,
    durationMs: trace.duration_ms,
    observedAt: trace.created_at,
  };
  return JSON.stringify(content).slice(0, 999);
}
