import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isJevConfigured,
  classifyActionRisk,
  routeIssueToModule,
  evaluateAgentSwarmSafety,
  SYSTEM_ONE_URL,
} from './jevDecisionEngine';

describe('TypeSafe AI — Jev Decision Engine', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TYPESAFE_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('correctly reports configuration status based on TYPESAFE_API_KEY', () => {
    expect(isJevConfigured()).toBe(false);
    expect(isJevConfigured('MY_KEY_PLACEHOLDER')).toBe(false);
    expect(isJevConfigured('ts_live_key_abc123')).toBe(true);

    process.env.TYPESAFE_API_KEY = 'ts_live_key_xyz987';
    expect(isJevConfigured()).toBe(true);
  });

  it('classifies action risks via heuristic fallback when unconfigured', async () => {
    const budgetAction = {
      title: 'Budget Shift Proposal',
      summary: 'Re-distribute $4,500 ad spend to high ROAS campaigns',
      module: 'PAID_ADS',
    };

    const result = await classifyActionRisk(budgetAction);
    expect(result.risk).toBe('HIGH');
    expect(result.requiresHITL).toBe(true);
    expect(result.engine).toBe('heuristic');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    const minorAction = {
      title: 'Generate Thumbnail Variation',
      summary: 'Render 1 extra slide thumbnail for LinkedIn carousel',
      module: 'CREATIVE',
    };

    const minorResult = await classifyActionRisk(minorAction);
    expect(minorResult.risk).toBe('LOW');
    expect(minorResult.requiresHITL).toBe(false);
  });

  it('routes inbound issues to appropriate modules via fallback', async () => {
    const seoIssue = await routeIssueToModule({
      issueText: 'Perplexity citations dropped 15% on core keyword clusters after site update',
    });
    expect(seoIssue.targetModule).toBe('SEO_AEO');
    expect(seoIssue.engine).toBe('heuristic');

    const leadIssue = await routeIssueToModule({
      issueText: 'New enterprise inbound lead submitted demo request form via WhatsApp',
    });
    expect(leadIssue.targetModule).toBe('INTAKE');

    const adIssue = await routeIssueToModule({
      issueText: 'ROAS declined on Meta ad set due to creative fatigue',
    });
    expect(adIssue.targetModule).toBe('PAID_ADS');
  });

  it('evaluates agent swarm safety and flags destructive commands', async () => {
    const safeAction = await evaluateAgentSwarmSafety({
      agentName: 'SEO Agent',
      goal: 'Audit meta tags',
      proposedAction: 'Fetch HTML sitemap and inspect meta title tags',
    });
    expect(safeAction.safe).toBe(true);
    expect(safeAction.risk).toBe('LOW');

    const dangerousAction = await evaluateAgentSwarmSafety({
      agentName: 'Rogue Agent',
      goal: 'Cleanup storage',
      proposedAction: 'DROP TABLE credentials CASCADE',
    });
    expect(dangerousAction.safe).toBe(false);
    expect(dangerousAction.risk).toBe('CRITICAL');
  });

  it('calls TypeSafe API when configured and parses parallel probabilistic answers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answers: {
          risk_level: {
            value: 'HIGH',
            confidence: 0.98,
            probabilities: { LOW: 0.01, MEDIUM: 0.01, HIGH: 0.98, CRITICAL: 0.0 },
          },
          requires_hitl: {
            value: 'YES',
            confidence: 0.95,
            probabilities: { YES: 0.95, NO: 0.05 },
          },
        },
      }),
    });

    global.fetch = mockFetch;

    const result = await classifyActionRisk(
      {
        title: 'Campaign Overhaul',
        summary: 'Shift budget',
        module: 'PAID_ADS',
      },
      { apiKey: 'ts_mock_test_key' }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      SYSTEM_ONE_URL,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ts_mock_test_key',
        }),
      })
    );
    expect(result.risk).toBe('HIGH');
    expect(result.requiresHITL).toBe(true);
    expect(result.engine).toBe('jev');
    expect(result.confidence).toBe(0.98);
  });
});
