import { describe, it, expect } from 'vitest';
import {
  type ReportSnapshot,
  validateReportSnapshot,
  createDefaultReportSnapshot,
} from './reportSnapshot';

describe('Report Snapshot Contract & Validation (Phase 3)', () => {
  it('creates and validates a well-formed report snapshot', () => {
    const snapshot = createDefaultReportSnapshot({
      workspaceId: 'ws-sigmatactix',
      tenantName: 'Sigma Tactix Core',
      title: 'Q3 Executive Growth Diagnostic',
      objective: 'Identify conversion bottlenecks and paid media waste',
    });

    const validated = validateReportSnapshot(snapshot);
    expect(validated.id).toBeDefined();
    expect(validated.version).toBe(1);
    expect(validated.workspaceId).toBe('ws-sigmatactix');
    expect(validated.decisionSummary.actionRequired).toBeDefined();
    expect(validated.kpis.length).toBeGreaterThan(0);
    expect(validated.evidenceAppendix.length).toBeGreaterThan(0);
  });

  it('rejects snapshots missing required workspace or objective', () => {
    const invalid = {
      id: 'rep-invalid',
      version: 1,
      // Missing workspaceId & objective
    };

    expect(() => validateReportSnapshot(invalid)).toThrow();
  });

  it('ensures all headline KPIs carry an explicit claim classification and provenance', () => {
    const snapshot = createDefaultReportSnapshot({
      workspaceId: 'ws-sigmatactix',
      tenantName: 'Sigma Tactix Core',
      title: 'Growth Audit',
      objective: 'Baseline assessment',
    });

    for (const kpi of snapshot.kpis) {
      expect(['measured_fact', 'calculation', 'estimate', 'hypothesis', 'unavailable']).toContain(
        kpi.classification
      );
      if (kpi.classification === 'measured_fact') {
        expect(kpi.evidenceId).toBeDefined();
      }
    }
  });

  it('strictly validates date bounds for reporting period', () => {
    const snapshot = createDefaultReportSnapshot({
      workspaceId: 'ws-sigmatactix',
      tenantName: 'Sigma Tactix Core',
      title: 'Growth Audit',
      objective: 'Baseline assessment',
    });

    // Invert start and end date
    snapshot.reportingPeriod = {
      start: '2026-10-30T00:00:00Z',
      end: '2026-10-01T00:00:00Z',
    };

    expect(() => validateReportSnapshot(snapshot)).toThrow(/reportingPeriod start must be before or equal to end/);
  });
});
