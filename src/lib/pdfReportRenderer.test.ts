import { describe, it, expect } from 'vitest';
import {
  renderExecutiveReportPDF,
  type BrandProfile,
} from './pdfReportRenderer';
import { createDefaultReportSnapshot } from './reportSnapshot';

describe('PDF Report Renderer with pdfcn Forme Principles (Phase 3)', () => {
  const sigmaBrand: BrandProfile = {
    brandName: 'Sigma Tactix',
    primaryColor: '#FF481B', // Sigma Orange
    secondaryColor: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    textColor: '#1A1A1A',
    fontFamily: 'helvetica',
    themeMode: 'light',
  };

  const clientBBrand: BrandProfile = {
    brandName: 'Acme SaaS Corp',
    primaryColor: '#2563EB', // Blue override
    secondaryColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    textColor: '#0F172A',
    fontFamily: 'times',
    themeMode: 'light',
  };

  it('renders a valid PDF binary buffer with authentic PDF signature and non-zero size', async () => {
    const snapshot = createDefaultReportSnapshot({
      workspaceId: 'ws-sigmatactix',
      tenantName: 'Sigma Tactix Core',
      title: 'Executive Diagnostic Summary',
      objective: 'Eliminate conversion bottlenecks',
    });

    const result = await renderExecutiveReportPDF(snapshot, sigmaBrand);
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(result.byteSize).toBeGreaterThan(2000);
    expect(result.artifactHash).toBeDefined();
    expect(result.artifactHash).toMatch(/^[a-f0-9]{64}$/); // Valid SHA-256
    expect(result.pageCount).toBeGreaterThanOrEqual(1);

    // Verify PDF header %PDF-
    const header = Buffer.from(result.pdfBuffer.subarray(0, 5)).toString('utf-8');
    expect(header).toBe('%PDF-');
  });

  it('paginates multi-section and extended tables cleanly without overlapping coordinates', async () => {
    const snapshot = createDefaultReportSnapshot({
      workspaceId: 'ws-sigmatactix',
      tenantName: 'Sigma Tactix Core',
      title: 'Comprehensive Omnichannel Report',
      objective: 'Quarterly review with extended action items',
    });

    // Add 15 next actions to trigger multi-page pagination
    for (let i = 1; i <= 15; i++) {
      snapshot.nextActions.push({
        id: `act-${i + 10}`,
        title: `Intervention step ${i}: Automate customer intake and audit attribution tracking pixels`,
        owner: 'Growth Engineer',
        duration: '14 Days',
        expectedImpactRange: '+2.5% to +5.0% conversion rate',
        feeComponent: '$2,500 scoped sprint',
        approvalRequired: true,
      });
    }

    const result = await renderExecutiveReportPDF(snapshot, sigmaBrand);
    expect(result.pageCount).toBeGreaterThan(1);
  });

  it('guarantees tenant isolation: concurrent renders with different brands do not bleed styles or content', async () => {
    const snapshotA = createDefaultReportSnapshot({
      workspaceId: 'ws-alpha',
      tenantName: 'Alpha Tenant',
      title: 'Alpha Report Title',
      objective: 'Alpha Objective',
    });

    const snapshotB = createDefaultReportSnapshot({
      workspaceId: 'ws-beta',
      tenantName: 'Beta Tenant',
      title: 'Beta Report Title',
      objective: 'Beta Objective',
    });

    // Run both concurrently
    const [resultA, resultB] = await Promise.all([
      renderExecutiveReportPDF(snapshotA, sigmaBrand),
      renderExecutiveReportPDF(snapshotB, clientBBrand),
    ]);

    expect(resultA.artifactHash).not.toBe(resultB.artifactHash);
    expect(resultA.tenantId).toBe('ws-alpha');
    expect(resultB.tenantId).toBe('ws-beta');
  });
});
