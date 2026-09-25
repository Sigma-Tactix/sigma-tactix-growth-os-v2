import { describe, expect, it } from 'vitest';
import { parseMediaPlanText } from './mediaPlanParser';

describe('media plan parser', () => {
  it('extracts verified fields instead of inventing defaults', () => {
    const plan = parseMediaPlanText(`Plan Name: Q4 Demand Capture\nObjective: Pipeline expansion\nTotal Budget: $55,000\nFlight: 2026-10-15 to 2026-12-31\nTarget Blended CAC: $42\nTarget ROAS: 5.2\nGoogle Search, 40%`);
    expect(plan.name).toBe('Q4 Demand Capture');
    expect(plan.totalBudget).toBe(55000);
    expect(plan.flightStart).toBe('2026-10-15');
    expect(plan.targetBlendedRoas).toBe(5.2);
    expect(plan.channelWeights['Google Search']).toBe(40);
  });

  it('rejects incomplete plans', () => {
    expect(() => parseMediaPlanText('Budget: $55,000')).toThrow('total budget and both flight dates');
  });
});
