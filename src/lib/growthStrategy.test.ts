import { describe, expect, it } from 'vitest';
import type { GrowthAudit } from '../types';
import { buildGrowthStrategies } from './growthStrategy';

const audit: GrowthAudit = {
  status: 'completed',
  score: 61,
  findings: [{
    id: 'finding-cro',
    category: 'funnelQuality',
    title: 'Mobile funnel friction',
    text: 'The form loses qualified visitors.',
    insight: 'Shorten the path to conversion.',
    impactPct: 24,
    quickSteps: ['Reduce the form', 'Measure completions'],
    dataSource: 'live',
  }],
  recommendations: [{
    id: 'rec-cro',
    category: 'Conversion Rate Optimization',
    title: 'Progressive intake flow',
    impact: 'High',
    effort: 'Medium',
    description: 'Remove mobile form friction.',
    quickSteps: ['Reduce the form', 'Measure completions'],
  }],
  roadmap90Day: [],
};

describe('growth strategy builder', () => {
  it('turns diagnostics into a ranked strategy with a HITL task mix', () => {
    const [strategy] = buildGrowthStrategies(audit);
    expect(strategy.title).toBe('Remove conversion friction');
    expect(strategy.rank).toBe(1);
    expect(strategy.tasks).toHaveLength(3);
    expect(strategy.tasks.every(task => task.requiresHitl)).toBe(true);
    expect(strategy.tasks.map(task => task.agentName)).toContain('Audit Diagnostic Agent');
  });

  it('does not promote provider configuration into execution readiness', () => {
    const [strategy] = buildGrowthStrategies(audit, [{
      id: 'provider-tinyfish',
      state: 'configured',
      verified: false,
      automationEligible: false,
      evidence: ['Key exists; no verified handshake.'],
    }]);
    const tinyfish = strategy.providers.find(provider => provider.provider === 'tinyfish');
    expect(tinyfish?.state).toBe('setup-required');
    expect(tinyfish?.guidance).toContain('no verified handshake');
  });

  it('deduplicates tactics that map to the same strategy outcome', () => {
    const strategies = buildGrowthStrategies({
      ...audit,
      recommendations: [
        ...audit.recommendations,
        { ...audit.recommendations[0], id: 'rec-cro-2', title: 'Mobile conversion form' },
      ],
    });
    expect(strategies.filter(strategy => strategy.title === 'Remove conversion friction')).toHaveLength(1);
  });

  it('produces a reviewable strategy when a completed diagnostic contains only a roadmap', () => {
    const strategies = buildGrowthStrategies({
      ...audit,
      findings: [],
      recommendations: [],
      roadmap90Day: [{
        phase: 'Days 1-30',
        title: 'Measurement foundation',
        tasks: ['Verify conversion events', 'Create a trusted baseline'],
      }],
    });

    expect(strategies).toHaveLength(1);
    expect(strategies[0].objective).toContain('Verify conversion events');
    expect(strategies[0].tasks.every(task => task.requiresHitl)).toBe(true);
  });
});
