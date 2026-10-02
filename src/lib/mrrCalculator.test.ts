import { describe, it, expect } from 'vitest';
import {
  calculateMRRScenarios,
  type MRRCalculationInput,
} from './mrrCalculator';

describe('Deterministic MRR & Revenue Opportunity Engine (Phase 4)', () => {
  const baseInput: MRRCalculationInput = {
    revenueModel: 'saas_recurring',
    currency: 'USD',
    currentMRR: 50000,
    targetMRR: 80000,
    sourceProvenance: 'crm_billing',
    mrrMovements: {
      newMRR: 6000,
      expansionMRR: 2000,
      contractionMRR: 1000,
      churnMRR: 2000,
    },
    funnel: {
      monthlyVisitors: 25000,
      visitorToLeadRate: 0.02, // 2%
      leadToCustomerRate: 0.08, // 8%
      averageRecurringValuePerCustomer: 500, // $500/mo
      capacityCapCustomers: 50,
    },
    retention: {
      atRiskMRR: 8000,
      avoidableChurnFraction: 0.35, // 35% avoidable
      horizonMonths: 3,
    },
  };

  it('calculates deterministic next-month MRR from movements', () => {
    const result = calculateMRRScenarios(baseInput);
    expect(result.nextMonthProjectedMRR).toBe(55000); // 50000 + 6000 + 2000 - 1000 - 2000
    expect(result.planningGap).toBe(30000); // 80000 - 50000
    expect(result.planningGapNotice).toContain('planning gap, not proof of lost revenue');
  });

  it('blocks numeric ROI when required denominators or funnel inputs are missing', () => {
    const missingInputs: MRRCalculationInput = {
      ...baseInput,
      funnel: undefined, // Missing funnel numbers!
    };

    const result = calculateMRRScenarios(missingInputs);
    expect(result.acquisitionOpportunity.status).toBe('blocked_missing_inputs');
    expect(result.acquisitionOpportunity.reasons[0]).toContain('Missing denominator or funnel inputs');
    expect(result.acquisitionOpportunity.baseRecoverableMRR).toBeNull();
  });

  it('produces conservative, base, and upside scenarios without double-counting', () => {
    const result = calculateMRRScenarios(baseInput);
    expect(result.acquisitionOpportunity.status).toBe('calculated');
    expect(result.acquisitionOpportunity.conservativeMRR).toBeGreaterThan(0);
    expect(result.acquisitionOpportunity.baseRecoverableMRR!).toBeGreaterThan(
      result.acquisitionOpportunity.conservativeMRR!
    );
    expect(result.acquisitionOpportunity.upsideMRR!).toBeGreaterThan(
      result.acquisitionOpportunity.baseRecoverableMRR!
    );

    // Retention opportunity separated
    expect(result.retentionOpportunity.recoverableMRR).toBe(2800); // 8000 * 0.35
    expect(result.totalRecoverableMRROpportunity).toBe(
      result.acquisitionOpportunity.baseRecoverableMRR! + result.retentionOpportunity.recoverableMRR
    );
  });

  it('treats saved ad spend as a cost efficiency benefit, never mixing it into MRR', () => {
    const withAdSpend: MRRCalculationInput = {
      ...baseInput,
      wastedAdSpendMonthly: 4500,
    };

    const result = calculateMRRScenarios(withAdSpend);
    expect(result.costSavingsBenefitMonthly).toBe(4500);
    // Crucial check: saved ad spend must NOT inflate totalRecoverableMRROpportunity
    expect(result.totalRecoverableMRROpportunity).not.toContain(4500);
    expect(result.totalRecoverableMRROpportunity).toBe(
      result.acquisitionOpportunity.baseRecoverableMRR! + result.retentionOpportunity.recoverableMRR
    );
  });

  it('respects capacity caps to prevent unfeasible upside projections', () => {
    const hugeFunnel: MRRCalculationInput = {
      ...baseInput,
      funnel: {
        ...baseInput.funnel!,
        monthlyVisitors: 5000000, // Massive volume
        capacityCapCustomers: 10, // Max 10 new customers
      },
    };

    const result = calculateMRRScenarios(hugeFunnel);
    // 10 customers * $500 = $5,000 max upside capacity cap
    expect(result.acquisitionOpportunity.upsideMRR).toBeLessThanOrEqual(5000);
  });
});
