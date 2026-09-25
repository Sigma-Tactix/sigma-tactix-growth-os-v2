import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  callLayaSystemOne,
  classifyActionRisk,
  getDecisionRuntimeStatus,
} from './decisionEngine';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('provider-neutral decision runtime', () => {
  it('reports Laya as unconfigured without claiming it is live', async () => {
    await expect(getDecisionRuntimeStatus({ env: {} })).resolves.toMatchObject({
      provider: 'laya',
      configured: false,
      reachable: false,
      state: 'unconfigured',
      executionEligible: false,
    });
  });

  it('does not call an empty lazy runtime shadow-ready before a checkpoint is loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'ok', loaded: [], device: 'auto',
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    await expect(getDecisionRuntimeStatus({
      options: { baseUrl: 'http://127.0.0.1:8000', mode: 'shadow' },
    })).resolves.toMatchObject({
      configured: true,
      reachable: true,
      state: 'ready_unvalidated',
      executionEligible: false,
    });
  });

  it('uses the typed Laya HTTP contract and normalizes choice answers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      answers: {
        risk_level: {
          choice: 'HIGH',
          answer_confidence: 0.91,
          probabilities: { LOW: 0.02, MEDIUM: 0.07, HIGH: 0.91, CRITICAL: 0 },
        },
      },
      usage: { input_tokens: 42, output_tokens: 4 },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await callLayaSystemOne(
      { title: 'Increase ad budget' },
      {
        risk_level: {
          type: 'choice',
          instructions: 'Classify operational risk.',
          criteria: { LOW: 'low impact', HIGH: 'material spend change' },
        },
      },
      { baseUrl: 'http://127.0.0.1:8000', apiKey: 'local-secret' },
    );

    expect(result.answers.risk_level).toMatchObject({ value: 'HIGH', confidence: 0.91 });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/v1/systemone',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer local-secret' }),
      }),
    );
  });

  it('keeps the deterministic policy authoritative while Laya is in shadow mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      answers: {
        risk_level: { choice: 'LOW', answer_confidence: 0.8, probabilities: { LOW: 0.8, HIGH: 0.2 } },
        requires_hitl: { choice: 'NO', answer_confidence: 0.85, probabilities: { YES: 0.15, NO: 0.85 } },
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    const result = await classifyActionRisk(
      { title: 'Raise campaign budget', summary: 'Increase spend by $5,000', module: 'Paid Ads' },
      { baseUrl: 'http://127.0.0.1:8000', mode: 'shadow' },
    );

    expect(result.engine).toBe('deterministic_policy');
    expect(result.risk).toBe('HIGH');
    expect(result.requiresHITL).toBe(true);
    expect(result.shadowDecision).toMatchObject({ engine: 'laya', risk: 'LOW', requiresHITL: false });
  });
});
