/**
 * Deterministic MRR & Revenue Opportunity Engine (Phase 4)
 *
 * Implements deterministic next-month MRR calculation from movements,
 * explicit separation of planning gaps from recoverable opportunities,
 * strict denominator checks blocking numeric ROI when inputs are absent,
 * multi-scenario projections with capacity caps, and strict isolation
 * of ad spend cost savings from recurring MRR.
 */

export interface MRRMovements {
  newMRR?: number;
  expansionMRR?: number;
  contractionMRR?: number;
  churnMRR?: number;
}

export interface FunnelInputs {
  monthlyVisitors: number;
  visitorToLeadRate: number;
  leadToCustomerRate: number;
  averageRecurringValuePerCustomer: number;
  capacityCapCustomers?: number;
}

export interface RetentionInputs {
  atRiskMRR: number;
  avoidableChurnFraction: number;
  horizonMonths: number;
}

export interface MRRCalculationInput {
  revenueModel: 'saas_recurring' | 'ecommerce_monthly' | 'custom_retainer';
  currency: string;
  currentMRR: number | null;
  targetMRR: number | null;
  sourceProvenance: 'crm_billing' | 'user_input' | 'unverified';
  mrrMovements?: MRRMovements;
  funnel?: FunnelInputs;
  retention?: RetentionInputs;
  wastedAdSpendMonthly?: number;
}

export interface AcquisitionOpportunityResult {
  status: 'calculated' | 'blocked_missing_inputs';
  conservativeMRR: number | null;
  baseRecoverableMRR: number | null;
  upsideMRR: number | null;
  reasons: string[];
}

export interface RetentionOpportunityResult {
  recoverableMRR: number;
  horizonMonths: number;
}

export interface MRRCalculationResult {
  currentMRR: number | null;
  targetMRR: number | null;
  nextMonthProjectedMRR: number | null;
  planningGap: number;
  planningGapNotice: string;
  acquisitionOpportunity: AcquisitionOpportunityResult;
  retentionOpportunity: RetentionOpportunityResult;
  costSavingsBenefitMonthly: number;
  totalRecoverableMRROpportunity: number;
}

export function calculateMRRScenarios(input: MRRCalculationInput): MRRCalculationResult {
  const current = input.currentMRR || 0;
  const target = input.targetMRR || 0;

  // 1. Planning gap: target - current, floored at 0
  const planningGap = Math.max(0, target - current);
  const planningGapNotice =
    'Target MRR - current MRR is a strategic planning gap, not proof of lost revenue.';

  // 2. Next-month MRR calculation
  let nextMonthProjectedMRR: number | null = null;
  if (input.currentMRR !== null && input.mrrMovements) {
    const { newMRR = 0, expansionMRR = 0, contractionMRR = 0, churnMRR = 0 } = input.mrrMovements;
    nextMonthProjectedMRR = current + newMRR + expansionMRR - contractionMRR - churnMRR;
  }

  // 3. Acquisition opportunity with strict denominator checks
  let acquisitionOpportunity: AcquisitionOpportunityResult;
  if (
    !input.funnel ||
    !input.funnel.monthlyVisitors ||
    input.funnel.visitorToLeadRate <= 0 ||
    input.funnel.leadToCustomerRate <= 0 ||
    input.funnel.averageRecurringValuePerCustomer <= 0
  ) {
    acquisitionOpportunity = {
      status: 'blocked_missing_inputs',
      conservativeMRR: null,
      baseRecoverableMRR: null,
      upsideMRR: null,
      reasons: ['Missing denominator or funnel inputs block numeric ROI calculation.'],
    };
  } else {
    const {
      monthlyVisitors,
      visitorToLeadRate,
      leadToCustomerRate,
      averageRecurringValuePerCustomer,
      capacityCapCustomers,
    } = input.funnel;

    // Baseline current new customers
    const currentNewCustomers = monthlyVisitors * visitorToLeadRate * leadToCustomerRate;

    // Conservative scenario: +15% conversion lift
    const conservativeLift = currentNewCustomers * 0.15;
    let conservativeCustomers = conservativeLift;
    if (capacityCapCustomers && conservativeCustomers > capacityCapCustomers) {
      conservativeCustomers = capacityCapCustomers;
    }
    const conservativeMRR = Math.round(conservativeCustomers * averageRecurringValuePerCustomer);

    // Base scenario: +30% conversion lift
    const baseLift = currentNewCustomers * 0.30;
    let baseCustomers = baseLift;
    if (capacityCapCustomers && baseCustomers > capacityCapCustomers) {
      baseCustomers = capacityCapCustomers;
    }
    const baseRecoverableMRR = Math.round(baseCustomers * averageRecurringValuePerCustomer);

    // Upside scenario: +60% conversion lift
    const upsideLift = currentNewCustomers * 0.60;
    let upsideCustomers = upsideLift;
    if (capacityCapCustomers && upsideCustomers > capacityCapCustomers) {
      upsideCustomers = capacityCapCustomers;
    }
    const upsideMRR = Math.round(upsideCustomers * averageRecurringValuePerCustomer);

    acquisitionOpportunity = {
      status: 'calculated',
      conservativeMRR,
      baseRecoverableMRR,
      upsideMRR,
      reasons: [],
    };
  }

  // 4. Retention opportunity
  let retentionOpportunity: RetentionOpportunityResult = {
    recoverableMRR: 0,
    horizonMonths: 3,
  };
  if (input.retention && input.retention.atRiskMRR > 0 && input.retention.avoidableChurnFraction > 0) {
    const recoverable = Math.round(
      input.retention.atRiskMRR * input.retention.avoidableChurnFraction
    );
    retentionOpportunity = {
      recoverableMRR: recoverable,
      horizonMonths: input.retention.horizonMonths || 3,
    };
  }

  // 5. Cost savings benefit (saved ad spend is a cost benefit, NOT MRR)
  const costSavingsBenefitMonthly = input.wastedAdSpendMonthly || 0;

  // 6. Total recoverable recurring revenue (excluding cost savings)
  const baseAcquisition = acquisitionOpportunity.baseRecoverableMRR || 0;
  const totalRecoverableMRROpportunity = baseAcquisition + retentionOpportunity.recoverableMRR;

  return {
    currentMRR: input.currentMRR,
    targetMRR: input.targetMRR,
    nextMonthProjectedMRR,
    planningGap,
    planningGapNotice,
    acquisitionOpportunity,
    retentionOpportunity,
    costSavingsBenefitMonthly,
    totalRecoverableMRROpportunity,
  };
}
