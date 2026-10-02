/**
 * Versioned Commercial Service Catalogue & Proposal Generator (Phase 4)
 *
 * Implements approved, versioned service packaging with setup, recurring,
 * scoped project work, media spend, and third-party costs strictly separated.
 * Ensures commercial fees and engineering effort estimates are distinct,
 * and highlights that a 90-day planning horizon is not a guaranteed recovery.
 */

export interface ServiceItem {
  id: string;
  name: string;
  type: 'setup_sprint' | 'recurring_retainer' | 'scoped_project';
  fee: number;
  durationDays: number;
  description: string;
  deliverables: string[];
}

export interface CommercialCatalogue {
  version: string;
  currency: string;
  effectiveDate: string;
  services: ServiceItem[];
}

export const COMMERCIAL_CATALOGUE_V2026_1: CommercialCatalogue = {
  version: 'v2026.1',
  currency: 'USD',
  effectiveDate: '2026-01-01',
  services: [
    {
      id: 'sprint-attribution-foundation',
      name: 'Attribution & Conversion Telemetry Foundation',
      type: 'setup_sprint',
      fee: 2700,
      durationDays: 14,
      description: 'Deploy server-side GA4 Measurement Protocol, Meta CAPI, and DNS security headers.',
      deliverables: [
        'Verified server-side GA4 telemetry pipeline',
        'Meta Conversions API (CAPI) active with >8.0 match quality',
        'Strict-Transport-Security (HSTS) & CSP headers configured',
      ],
    },
    {
      id: 'sprint-progressive-funnel',
      name: 'Mobile Funnel Friction Remediation',
      type: 'setup_sprint',
      fee: 2200,
      durationDays: 10,
      description: 'Redesign intake contact form with mobile-first progressive disclosure.',
      deliverables: [
        'Single-step initial email capture',
        'Conditional qualification steps',
        'A/B test instrumentation against baseline',
      ],
    },
    {
      id: 'sprint-creative-velocity',
      name: 'Creative Hook Saturation Automation',
      type: 'setup_sprint',
      fee: 1800,
      durationDays: 7,
      description: 'Implement automated 72h creative fatigue detection and angle resets.',
      deliverables: [
        'Algorithmic frequency alert trigger at 3.5x',
        'Pre-approved carousel & copy variant bundle',
      ],
    },
    {
      id: 'retainer-growth-core',
      name: 'Autonomous Growth OS Core Retainer',
      type: 'recurring_retainer',
      fee: 1500,
      durationDays: 30,
      description: 'Ongoing agent-directed growth optimization, bi-weekly diagnostics, and HITL supervision.',
      deliverables: [
        'Continuous second-brain telemetry ingestion',
        'Bi-weekly executive diagnostic report snapshots',
        'Human-in-the-loop task governance',
      ],
    },
    {
      id: 'retainer-growth-scale',
      name: 'Enterprise Growth OS Scale Retainer',
      type: 'recurring_retainer',
      fee: 3500,
      durationDays: 30,
      description: 'Full multi-channel autonomous optimization across Search, Social, and Generative Answer Engines.',
      deliverables: [
        'Daily social listening and competitor radar',
        'Omnichannel campaign generation and verified publication',
        'Custom pgvector knowledge graph syndicate',
      ],
    },
  ],
};

export interface QuoteRequest {
  workspaceId: string;
  catalogueVersion: string;
  selectedServiceIds: string[];
  plannedMediaSpendMonthly?: number;
}

export interface CommercialQuote {
  quoteId: string;
  workspaceId: string;
  catalogueVersion: string;
  currency: string;
  status: 'approved_quote' | 'draft_quote_required';
  validUntil: string;
  selectedServices: ServiceItem[];
  unapprovedServiceIds: string[];
  totalSetupFee: number;
  totalRecurringMonthlyFee: number;
  totalAgencyMonthlyFee: number;
  mediaSpendBudgetMonthly: number;
  disclaimer: string;
}

export function generateCommercialQuote(request: QuoteRequest): CommercialQuote {
  const catalogue =
    request.catalogueVersion === COMMERCIAL_CATALOGUE_V2026_1.version
      ? COMMERCIAL_CATALOGUE_V2026_1
      : null;

  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const quoteId = `quote-${request.workspaceId}-${Date.now()}`;

  if (!catalogue) {
    return {
      quoteId,
      workspaceId: request.workspaceId,
      catalogueVersion: request.catalogueVersion,
      currency: 'USD',
      status: 'draft_quote_required',
      validUntil,
      selectedServices: [],
      unapprovedServiceIds: request.selectedServiceIds,
      totalSetupFee: 0,
      totalRecurringMonthlyFee: 0,
      totalAgencyMonthlyFee: 0,
      mediaSpendBudgetMonthly: request.plannedMediaSpendMonthly || 0,
      disclaimer: 'Catalogue version unverified; custom quote required.',
    };
  }

  const selectedServices: ServiceItem[] = [];
  const unapprovedServiceIds: string[] = [];

  for (const id of request.selectedServiceIds) {
    const found = catalogue.services.find(s => s.id === id);
    if (found) {
      selectedServices.push(found);
    } else {
      unapprovedServiceIds.push(id);
    }
  }

  const status = unapprovedServiceIds.length > 0 ? 'draft_quote_required' : 'approved_quote';

  const totalSetupFee = selectedServices
    .filter(s => s.type === 'setup_sprint' || s.type === 'scoped_project')
    .reduce((acc, s) => acc + s.fee, 0);

  const totalRecurringMonthlyFee = selectedServices
    .filter(s => s.type === 'recurring_retainer')
    .reduce((acc, s) => acc + s.fee, 0);

  const mediaSpendBudgetMonthly = request.plannedMediaSpendMonthly || 0;

  return {
    quoteId,
    workspaceId: request.workspaceId,
    catalogueVersion: catalogue.version,
    currency: catalogue.currency,
    status,
    validUntil,
    selectedServices,
    unapprovedServiceIds,
    totalSetupFee,
    totalRecurringMonthlyFee,
    totalAgencyMonthlyFee: totalRecurringMonthlyFee, // Segregated from media spend
    mediaSpendBudgetMonthly,
    disclaimer:
      'A 90-day planning horizon is distinct from guaranteed recovery. Third-party ad spend is managed directly and excluded from agency retainers. All task executions require human-in-the-loop authorization.',
  };
}
