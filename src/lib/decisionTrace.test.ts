import { describe, expect, it } from 'vitest';
import { buildDecisionTrace, decisionTraceToVantaContext } from './decisionTrace';

describe('decision trace contract', () => {
  it('stores hashes and normalized outcomes without retaining raw customer input', () => {
    const trace = buildDecisionTrace({
      operation: 'triage',
      input: { title: 'Secret launch', summary: 'Customer token sk-secret-value', module: 'Paid Ads' },
      questionSet: ['risk_level', 'requires_hitl'],
      result: {
        risk: 'HIGH', confidence: 0.91, probabilities: { HIGH: 0.91, LOW: 0.09 },
        requiresHITL: true, engine: 'deterministic_policy', durationMs: 4,
        shadowDecision: { risk: 'MEDIUM', confidence: 0.62, probabilities: { MEDIUM: 0.62 }, requiresHITL: false, engine: 'laya', durationMs: 120 },
      },
    });

    expect(trace.input_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(trace.question_set_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(trace)).not.toContain('Secret launch');
    expect(JSON.stringify(trace)).not.toContain('sk-secret-value');
    expect(trace).toMatchObject({
      operation: 'triage', authoritative_engine: 'deterministic_policy', selected_value: { risk: 'HIGH' },
      requires_hitl: true, policy_override: true, shadow_provider: 'laya',
    });
  });

  it('gives VANTA a bounded explanation record without raw inputs', () => {
    const context = decisionTraceToVantaContext({
      id: 'trace-1', operation: 'route', authoritative_engine: 'deterministic_policy',
      selected_value: { targetModule: 'PAID_ADS' }, confidence: 0.85,
      probabilities: { PAID_ADS: 0.85 }, requires_hitl: false, policy_override: false,
      shadow_provider: 'laya', shadow_decision: { targetModule: 'CONTENT', confidence: 0.51 },
      duration_ms: 2, created_at: '2026-09-25T00:00:00.000Z',
    });

    expect(context).toContain('trace-1');
    expect(context).toContain('PAID_ADS');
    expect(context).toContain('CONTENT');
    expect(context.length).toBeLessThan(1000);
  });
});
