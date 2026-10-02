import { describe, it, expect } from 'vitest';
import {
  COMMERCIAL_CATALOGUE_V2026_1,
  generateCommercialQuote,
  type QuoteRequest,
} from './commercialCatalogue';

describe('Versioned Commercial Catalogue & Fee Proposal (Phase 4)', () => {
  it('supplies versioned, categorized service items with setup, recurring, and media spend separated', () => {
    expect(COMMERCIAL_CATALOGUE_V2026_1.version).toBe('v2026.1');
    expect(COMMERCIAL_CATALOGUE_V2026_1.currency).toBe('USD');
    expect(COMMERCIAL_CATALOGUE_V2026_1.services.length).toBeGreaterThan(0);

    const setupItems = COMMERCIAL_CATALOGUE_V2026_1.services.filter(s => s.type === 'setup_sprint');
    const recurringItems = COMMERCIAL_CATALOGUE_V2026_1.services.filter(s => s.type === 'recurring_retainer');

    expect(setupItems.length).toBeGreaterThan(0);
    expect(recurringItems.length).toBeGreaterThan(0);
  });

  it('generates an approved, valid commercial quote for catalogue items', () => {
    const request: QuoteRequest = {
      workspaceId: 'ws-sigmatactix',
      catalogueVersion: 'v2026.1',
      selectedServiceIds: ['sprint-attribution-foundation', 'retainer-growth-core'],
      plannedMediaSpendMonthly: 5000,
    };

    const quote = generateCommercialQuote(request);
    expect(quote.status).toBe('approved_quote');
    expect(quote.totalSetupFee).toBe(2700);
    expect(quote.totalRecurringMonthlyFee).toBe(1500);
    expect(quote.mediaSpendBudgetMonthly).toBe(5000);
    // Crucial check: media spend is segregated from agency fee
    expect(quote.totalAgencyMonthlyFee).toBe(1500);
    expect(quote.disclaimer).toContain('90-day planning horizon is distinct from guaranteed recovery');
  });

  it('flags unapproved service requests as draft/quote required', () => {
    const invalidRequest: QuoteRequest = {
      workspaceId: 'ws-sigmatactix',
      catalogueVersion: 'v2026.1',
      selectedServiceIds: ['unknown-custom-bespoke-work'],
    };

    const quote = generateCommercialQuote(invalidRequest);
    expect(quote.status).toBe('draft_quote_required');
    expect(quote.unapprovedServiceIds).toContain('unknown-custom-bespoke-work');
  });
});
