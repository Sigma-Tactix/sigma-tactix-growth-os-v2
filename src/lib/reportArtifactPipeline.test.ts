import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  renderSnapshotToPDF,
  renderSnapshotToPPTX,
  renderSnapshotToXLSX,
  generateReportArtifactBundle,
  ReportArtifactRepository,
} from './reportArtifactPipeline';
import { createDefaultReportSnapshot, type ReportSnapshot } from './reportSnapshot';

describe('Report Artifact Pipeline (Task S16: PDF, PPTX, XLSX Delivery)', () => {
  const testSnapshot: ReportSnapshot = createDefaultReportSnapshot({
    workspaceId: 'ws-client-acme',
    tenantName: 'Acme Growth Labs',
    title: 'Enterprise Growth & Omnichannel Attribution Review',
    objective: 'Reconcile multi-channel media spend, verify attribution provenance, and deliver executive roadmap.',
  });

  // Enrich snapshot with sample telemetry for verification
  testSnapshot.kpis = [
    {
      id: 'kpi-roas',
      name: 'Blended ROAS',
      value: 3.4,
      baselineValue: 2.1,
      delta: '+1.3x',
      classification: 'calculation',
      dataSource: 'reconciliation_engine',
    },
    {
      id: 'kpi-cac',
      name: 'Blended CAC',
      value: 120,
      baselineValue: 180,
      delta: '-$60',
      classification: 'measured_fact',
      dataSource: 'crm_ledger',
    },
    {
      id: 'kpi-revenue',
      name: 'Attributed Revenue',
      value: 37750,
      baselineValue: 22000,
      delta: '+$15,750',
      classification: 'measured_fact',
      dataSource: 'stripe_ledger',
    },
  ];

  testSnapshot.workCompleted = [
    {
      taskId: 'task-creative-01',
      title: 'Editorial Article & Social Carousel Generation',
      status: 'completed',
      completedAt: '2026-11-17T12:00:00Z',
    },
    {
      taskId: 'task-paid-02',
      title: 'Meta Ads ROAS Guardrail Rebalancing',
      status: 'completed',
      completedAt: '2026-11-17T14:30:00Z',
    },
  ];

  testSnapshot.nextActions = [
    {
      id: 'act-01',
      title: 'Deploy High-Intent Landing Page to Custom Domain',
      owner: 'Growth Marketing Lead',
      duration: '2 business days',
      expectedImpactRange: '+15-25% CVR lift',
      feeComponent: 'Standard Retainer',
      approvalRequired: true,
    },
  ];

  testSnapshot.evidenceAppendix = [
    {
      evidenceId: 'ev-ga4-01',
      claimId: 'claim-conversion-rate',
      sourceLocator: 'google-analytics://properties/458674440/runReport',
      observationTime: '2026-11-17T18:00:00Z',
      classification: 'measured_fact',
      scope: 'workspace_acme',
    },
    {
      evidenceId: 'ev-meta-02',
      claimId: 'claim-ad-spend',
      sourceLocator: 'meta-marketing://act_109090252077535/insights',
      observationTime: '2026-11-17T18:05:00Z',
      classification: 'measured_fact',
      scope: 'workspace_acme',
    },
  ];

  describe('S16-A1: Immutable Source Snapshot Produces Persisted PDF/PPTX/XLSX Bytes', () => {
    it('produces valid PDF, PPTX, and XLSX bytes from the same snapshot', async () => {
      const bundle = await generateReportArtifactBundle(testSnapshot);

      expect(bundle.snapshotId).toBe(testSnapshot.id);
      expect(bundle.version).toBe(testSnapshot.version);
      expect(bundle.workspaceId).toBe('ws-client-acme');
      expect(bundle.bundleHash).toMatch(/^[a-f0-9]{64}$/);

      // Verify PDF
      expect(bundle.pdf.format).toBe('pdf');
      expect(bundle.pdf.byteSize).toBeGreaterThan(1000);
      expect(bundle.pdf.buffer.length).toBe(bundle.pdf.byteSize);
      expect(bundle.pdf.artifactHash).toMatch(/^[a-f0-9]{64}$/);
      expect(bundle.pdf.mime).toBe('application/pdf');

      // Verify PPTX
      expect(bundle.pptx.format).toBe('pptx');
      expect(bundle.pptx.byteSize).toBeGreaterThan(20000);
      expect(bundle.pptx.buffer.length).toBe(bundle.pptx.byteSize);
      expect(bundle.pptx.artifactHash).toMatch(/^[a-f0-9]{64}$/);
      expect(bundle.pptx.mime).toContain('presentationml');

      // Verify XLSX
      expect(bundle.xlsx.format).toBe('xlsx');
      expect(bundle.xlsx.byteSize).toBeGreaterThan(5000);
      expect(bundle.xlsx.buffer.length).toBe(bundle.xlsx.byteSize);
      expect(bundle.xlsx.artifactHash).toMatch(/^[a-f0-9]{64}$/);
      expect(bundle.xlsx.mime).toContain('spreadsheetml');
    });
  });

  describe('S16-A2: Independent Render Proves Editable Native Presentation Elements', () => {
    it('renders a 6-slide presentation with cover, decision, KPIs, delivery, next steps, and evidence', async () => {
      const pptxResult = await renderSnapshotToPPTX(testSnapshot);

      expect(pptxResult.format).toBe('pptx');
      expect(pptxResult.metadata.slideCount).toBe(6);
      expect(pptxResult.filename).toContain(testSnapshot.id);
      expect(pptxResult.filename).toContain('.pptx');
      expect(pptxResult.byteSize).toBeGreaterThan(30000);
    });

    it('renders a multi-page PDF with table layout, AI disclosure, and tenant theme', async () => {
      const pdfResult = await renderSnapshotToPDF(testSnapshot);

      expect(pdfResult.format).toBe('pdf');
      expect(pdfResult.metadata.pageCount).toBeGreaterThanOrEqual(1);
      expect(pdfResult.filename).toContain('.pdf');
      expect(pdfResult.byteSize).toBeGreaterThan(5000);
    });
  });

  describe('S16-A3: Workbook Formulas, Numbers, Dates, and Cross-Client Download Security', () => {
    it('generates Excel workbook with authentic formulas, numbers, and multiple structured sheets', async () => {
      const xlsxResult = await renderSnapshotToXLSX(testSnapshot);
      expect(xlsxResult.format).toBe('xlsx');
      expect(xlsxResult.metadata.sheetCount).toBe(5);

      // Parse the generated bytes back into a SheetJS workbook
      const wb = XLSX.read(xlsxResult.buffer, { type: 'buffer', cellFormula: true });
      expect(wb.SheetNames).toEqual([
        'Executive Summary',
        'KPI Telemetry',
        'Channel Operations',
        'Strategic Actions',
        'Evidence Appendix',
      ]);

      // Verify formulas in Channel Operations sheet
      const channelSheet = wb.Sheets['Channel Operations'];
      expect(channelSheet).toBeDefined();

      // Row 2 ROAS formula: C2/B2 (Revenue / Spend)
      const roasCell = channelSheet['D2'];
      expect(roasCell).toBeDefined();
      expect(roasCell.f).toBe('C2/B2');

      // Verify KPI Telemetry formula: C2-D2
      const kpiSheet = wb.Sheets['KPI Telemetry'];
      expect(kpiSheet).toBeDefined();
      const deltaCell = kpiSheet['E2'];
      expect(deltaCell).toBeDefined();
      expect(deltaCell.f).toBe('C2-D2');
    });

    it('strictly denies cross-client artifact downloads', async () => {
      const repository = new ReportArtifactRepository();
      const bundle = await generateReportArtifactBundle(testSnapshot);

      repository.storeBundle(bundle);
      expect(repository.count()).toBe(3);

      // Caller from same workspace succeeds
      const authorizedAccess = repository.getArtifactForWorkspace(bundle.pdf.artifactHash, 'ws-client-acme');
      expect(authorizedAccess.status).toBe('found');
      if (authorizedAccess.status === 'found') {
        expect(authorizedAccess.artifact.filename).toBe(bundle.pdf.filename);
        expect(authorizedAccess.artifact.byteSize).toBe(bundle.pdf.byteSize);
      }

      // Caller from foreign workspace is strictly DENIED
      const foreignAccess = repository.getArtifactForWorkspace(bundle.pdf.artifactHash, 'ws-foreign-attacker');
      expect(foreignAccess.status).toBe('forbidden');
      if (foreignAccess.status === 'forbidden') {
        expect(foreignAccess.error).toContain('Forbidden: Cross-client download denied');
      }

      // Non-existent hash returns not_found
      const missingAccess = repository.getArtifactForWorkspace('non-existent-hash', 'ws-client-acme');
      expect(missingAccess.status).toBe('not_found');
    });
  });
});
