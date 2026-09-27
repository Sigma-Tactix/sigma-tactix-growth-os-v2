import { describe, expect, it } from 'vitest';
import { buildDecisionTrace, decisionTraceToVantaContext } from './decisionTrace';

/**
 * These tests verify the governance contract for Area 4 of the
 * Governed Integration Hardening work order:
 *
 * "Add governed agent-trace inspection to the Agent Cockpit only if it
 *  can be integrated without exposing prompts, credentials, or client data."
 *
 * The tests prove that:
 * 1. Raw customer input never appears in the stored trace
 * 2. Credentials embedded in inputs are hashed, not stored
 * 3. The VANTA context projection is bounded and redacted
 * 4. The trace output shape matches what the browser consumes
 */

const SENSITIVE_INPUTS = [
  { title: 'Customer PII test', summary: 'John Smith applied for a loan at john.smith@secret.com', module: 'CRM' },
  { title: 'API key leak test', summary: 'Configure sk-proj-ABCDEFGHIJKLmnopqrstuvwxyz123456 in production', module: 'Connectors' },
  { title: 'OAuth token test', summary: 'Bearer ya29.a0AZYkNsE4jJxxxxxxxxx refresh the Google Ads session', module: 'Paid Ads' },
  { title: 'Password test', summary: 'Database password is Pr0duction!S3cret#2026', module: 'Operations' },
];

describe('agent trace governance — redaction contract', () => {
  SENSITIVE_INPUTS.forEach(({ title, summary, module }) => {
    it(`redacts "${title}" — no raw content in stored trace`, () => {
      const trace = buildDecisionTrace({
        operation: 'triage',
        input: { title, summary, module },
        questionSet: ['risk_level', 'requires_hitl'],
        result: {
          risk: 'HIGH',
          confidence: 0.95,
          probabilities: { HIGH: 0.95, MEDIUM: 0.04, LOW: 0.01 },
          requiresHITL: true,
          engine: 'deterministic_policy',
          durationMs: 3,
        },
      });

      const serialized = JSON.stringify(trace);

      // The raw title, summary, and module values must NEVER appear in the trace
      expect(serialized).not.toContain(title);
      expect(serialized).not.toContain(summary);

      // Input hash must be a proper SHA-256 hex digest
      expect(trace.input_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(trace.question_set_hash).toMatch(/^[a-f0-9]{64}$/);

      // Only structured decision outcomes should be present
      expect(trace.selected_value).toEqual({ risk: 'HIGH' });
      expect(trace.operation).toBe('triage');
      expect(trace.requires_hitl).toBe(true);
    });
  });

  it('produces different hashes for different inputs (collision resistance)', () => {
    const traces = SENSITIVE_INPUTS.map(input =>
      buildDecisionTrace({
        operation: 'triage',
        input,
        questionSet: ['risk_level'],
        result: { risk: 'LOW', confidence: 0.5, probabilities: {}, engine: 'test', durationMs: 1 },
      }),
    );

    const hashes = new Set(traces.map(t => t.input_hash));
    expect(hashes.size).toBe(SENSITIVE_INPUTS.length);
  });

  it('VANTA context projection is bounded and contains no raw inputs', () => {
    const context = decisionTraceToVantaContext({
      id: 'trace-gov-test',
      operation: 'safety',
      authoritative_engine: 'deterministic_policy',
      selected_value: { safe: false, risk: 'CRITICAL' },
      confidence: 0.99,
      probabilities: { CRITICAL: 0.99 },
      requires_hitl: true,
      policy_override: false,
      shadow_provider: null,
      shadow_decision: null,
      duration_ms: 1,
      created_at: '2026-09-27T00:00:00.000Z',
    });

    // VANTA context must be bounded (< 1000 chars)
    expect(context.length).toBeLessThan(1000);

    // Must contain the trace identifier and decision outcome
    expect(context).toContain('trace-gov-test');
    expect(context).toContain('CRITICAL');

    // Must NOT contain any of the sensitive input strings
    SENSITIVE_INPUTS.forEach(({ summary }) => {
      expect(context).not.toContain(summary);
    });
  });

  it('trace output shape matches the DecisionTraceRecord browser contract', () => {
    const trace = buildDecisionTrace({
      operation: 'route',
      input: { issueText: 'Confidential internal routing memo', sourceChannel: 'slack' },
      questionSet: ['target_module'],
      result: {
        targetModule: 'CONTENT',
        confidence: 0.87,
        probabilities: { CONTENT: 0.87, SEO: 0.13 },
        suggestedAction: 'Draft editorial brief',
        engine: 'deterministic_policy',
        durationMs: 2,
      },
    });

    // Verify every field the browser expects is present and correctly typed
    expect(typeof trace.operation).toBe('string');
    expect(typeof trace.provider).toBe('string');
    expect(typeof trace.mode).toBe('string');
    expect(typeof trace.authoritative_engine).toBe('string');
    expect(typeof trace.selected_value).toBe('object');
    expect(typeof trace.confidence).toBe('number');
    expect(typeof trace.probabilities).toBe('object');
    expect(typeof trace.requires_hitl).toBe('boolean');
    expect(typeof trace.policy_override).toBe('boolean');
    expect(typeof trace.input_hash).toBe('string');
    expect(typeof trace.question_set_hash).toBe('string');
    expect(typeof trace.duration_ms).toBe('number');

    // The raw input text must not be anywhere in the serialized trace
    expect(JSON.stringify(trace)).not.toContain('Confidential internal routing memo');
    expect(JSON.stringify(trace)).not.toContain('slack');
  });
});
