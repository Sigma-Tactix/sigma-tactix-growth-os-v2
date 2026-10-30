import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  callLayaSystemOne,
  classifyActionRisk,
  classifyCategory,
  authorizeSubAgentExecution,
  getDecisionRuntimeStatus,
  validateQuestionSet,
  CATEGORY_OWNERS,
  LAYA_LIMITS,
  MIN_AUTOMATION_CONFIDENCE,
  DEFAULT_LAYA_TIMEOUT_MS,
  recommendBoundedChoice,
  type LayaQuestion,
} from './decisionEngine';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('provider-neutral decision runtime', () => {
  it('uses a sub-second default deadline so a slow sidecar cannot stall decisions', () => {
    expect(DEFAULT_LAYA_TIMEOUT_MS).toBeLessThanOrEqual(750);
  });

  it('returns a bounded advisory recommendation for Antigravity without authorizing work', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      answers: {
        recommendation: {
          choice: 'fix_existing',
          answer_confidence: 0.82,
          probabilities: { fix_existing: 0.82, rebuild: 0.18 },
        },
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    await expect(recommendBoundedChoice({
      question: 'How should Antigravity handle the decision engine?',
      context: 'The tenant path already has a governed adapter.',
      options: [
        { id: 'fix_existing', description: 'Repair the shared adapter.' },
        { id: 'rebuild', description: 'Create a separate decision stack.' },
      ],
    }, { baseUrl: 'http://127.0.0.1:8000' })).resolves.toMatchObject({
      selectedOption: 'fix_existing',
      confidence: 0.82,
      engine: 'laya',
      advisoryOnly: true,
      requiresHITL: true,
    });
  });

  it('fails closed when Laya returns an option outside the supplied allowlist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      answers: { recommendation: { choice: 'invented_option', answer_confidence: 0.99 } },
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    await expect(recommendBoundedChoice({
      question: 'Choose the next implementation step.',
      options: [
        { id: 'repair', description: 'Repair the existing path.' },
        { id: 'defer', description: 'Defer the change.' },
      ],
    }, { baseUrl: 'http://127.0.0.1:8000' })).resolves.toMatchObject({
      selectedOption: null,
      engine: 'unavailable',
      advisoryOnly: true,
    });
  });

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

// ── Agent / sub-agent decision points + guard rails ─────────────────────────

describe('Laya request guard rails', () => {
  it('rejects an empty question set', () => {
    expect(validateQuestionSet({})).toMatch(/must not be empty/);
  });

  it('rejects a score level with no description (upstream would 422)', () => {
    expect(
      validateQuestionSet({ urgency: { type: 'score', instructions: 'How urgent?', criteria: ['low', ''] } }),
    ).toMatch(/empty score level/);
  });

  it('rejects more than 512 options across all questions', () => {
    const questions: Record<string, LayaQuestion> = {};
    for (let q = 0; q < 6; q += 1) {
      const criteria: Record<string, string> = {};
      for (let i = 0; i < LAYA_LIMITS.maxChoiceOptions; i += 1) criteria[`opt_${i}`] = 'x';
      questions[`q_${q}`] = { type: 'choice', instructions: 'pick', criteria };
    }
    expect(validateQuestionSet(questions)).toMatch(/options across all questions/);
  });

  it('accepts a well-formed question set', () => {
    expect(
      validateQuestionSet({
        risk: { type: 'choice', instructions: 'risk?', criteria: { LOW: 'safe', HIGH: 'risky' } },
      }),
    ).toBeNull();
  });
});

describe('classifyCategory', () => {
  it('derives the owning agent from CATEGORY_OWNERS', async () => {
    const result = await classifyCategory('our ROAS dropped, check campaign bid strategy');
    expect(result.category).toBe('performance');
    expect(result.ownerAgent).toBe(CATEGORY_OWNERS.performance);
    expect(result.engine).toBe('deterministic_policy');
  });

  it('routes lead work to the AI SDR owner', async () => {
    const result = await classifyCategory('qualify this inbound lead and start a sequence');
    expect(result.category).toBe('crm');
    expect(result.ownerAgent).toBe('AI SDR (Sales Agent)');
  });

  it('never honours an unknown category proposed by the model', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ answers: { category: { choice: 'not_a_category', answer_confidence: 0.99 } } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const result = await classifyCategory('audit the funnel', {
      baseUrl: 'http://127.0.0.1:8000', mode: 'active', calibrated: true,
    });
    expect(result.engine).toBe('deterministic_policy');
    expect(result.ownerAgent).toBe(CATEGORY_OWNERS.growth);
  });

  it('makes no network call when unconfigured', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    await classifyCategory('audit the funnel');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('authorizeSubAgentExecution — Laya never authorizes a write', () => {
  it('structurally blocks a write-plane sub-agent WITHOUT calling the model', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const result = await authorizeSubAgentExecution({
      subAgent: 'sequence-drafter', plane: 'write', proposedAction: 'Send an outreach sequence',
    }, { baseUrl: 'http://127.0.0.1:8000', mode: 'active', calibrated: true });

    expect(result.requiresHITL).toBe(true);
    expect(result.permitted).toBe(false);
    expect(result.engine).toBe('deterministic_policy');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('structurally blocks HIGH-risk read actions too', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const result = await authorizeSubAgentExecution({
      subAgent: 'budget-allocator', plane: 'read', proposedAction: 'reallocate ad spend',
    }, { baseUrl: 'http://127.0.0.1:8000', mode: 'active', calibrated: true });

    expect(result.requiresHITL).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('permits a plain read-plane action without a model call', async () => {
    const result = await authorizeSubAgentExecution({
      subAgent: 'web-vitals-scorer', plane: 'read', proposedAction: 'score core web vitals',
    });
    expect(result.permitted).toBe(true);
    expect(result.requiresHITL).toBe(false);
  });

  it('keeps policy when the model is under the confidence threshold', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answers: { is_safe: { choice: 'NO', answer_confidence: 0.4 } } }),
    }) as unknown as typeof fetch;

    const result = await authorizeSubAgentExecution(
      { subAgent: 'kpi-tracker', plane: 'read', proposedAction: 'compare target vs actual' },
      { baseUrl: 'http://127.0.0.1:8000', mode: 'active', calibrated: true },
    );
    expect(result.engine).toBe('deterministic_policy');
    expect(result.permitted).toBe(true);
    expect(MIN_AUTOMATION_CONFIDENCE).toBeGreaterThan(0.4);
  });
});

describe('runtime status honesty', () => {
  it('reports unconfigured with no probe when LAYA_BASE_URL is unset', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const status = await getDecisionRuntimeStatus({ env: {} });
    expect(status.state).toBe('unconfigured');
    expect(status.executionEligible).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses automation eligibility when no checkpoint is loaded', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ status: 'ok', loaded: [] }),
    }) as unknown as typeof fetch;

    const status = await getDecisionRuntimeStatus({
      env: { LAYA_BASE_URL: 'http://127.0.0.1:8000', LAYA_MODE: 'active', LAYA_CALIBRATED: 'true' },
    });
    expect(status.state).toBe('ready_unvalidated');
    expect(status.executionEligible).toBe(false);
  });
});
