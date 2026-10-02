/**
 * Report Snapshot Contract (Phase 3)
 *
 * Server-owned, versioned ReportSnapshot containing workspace/client identity,
 * reporting period, empirical KPI provenance, narrative cards, work completed,
 * next actions, commercial fee estimates, and evidence appendix.
 */

import { z } from 'zod';

export type ClaimClassification =
  | 'measured_fact'
  | 'calculation'
  | 'estimate'
  | 'hypothesis'
  | 'unavailable';

export const ReportSnapshotSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  reportingPeriod: z.object({
    start: z.string().datetime({ offset: true }).or(z.string()),
    end: z.string().datetime({ offset: true }).or(z.string()),
  }),
  generatedAt: z.string(),
  tenant: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    brandColor: z.string().optional(),
    logoUrl: z.string().optional(),
  }),
  brief: z.object({
    recipient: z.string().default('Executive Team'),
    audience: z.string().default('Leadership & Operations'),
    language: z.string().default('en'),
    currency: z.string().default('USD'),
    pageSize: z.enum(['a4', 'letter']).default('a4'),
    deliveryMethod: z.enum(['download', 'email', 'portal']).default('download'),
    sections: z.array(z.string()).default([
      'decision_summary',
      'performance_cards',
      'delivery_summary',
      'next_actions',
      'evidence_appendix',
    ]),
  }),
  decisionSummary: z.object({
    headline: z.string(),
    verdict: z.string(),
    keyTakeaway: z.string(),
    actionRequired: z.string(),
  }),
  kpis: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      value: z.union([z.string(), z.number()]),
      baselineValue: z.union([z.string(), z.number()]).optional(),
      unit: z.string().optional(),
      delta: z.string().optional(),
      classification: z.enum(['measured_fact', 'calculation', 'estimate', 'hypothesis', 'unavailable']),
      evidenceId: z.string().optional(),
      dataSource: z.string().optional(),
    })
  ),
  narrativeCards: z.array(
    z.object({
      title: z.string(),
      finding: z.string(),
      interpretation: z.string(),
      evidenceRef: z.string(),
      classification: z.string(),
    })
  ).default([]),
  workCompleted: z.array(
    z.object({
      taskId: z.string(),
      title: z.string(),
      status: z.string(),
      outputArtifactId: z.string().optional(),
      completedAt: z.string().optional(),
    })
  ).default([]),
  nextActions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      owner: z.string(),
      dependency: z.string().optional(),
      duration: z.string(),
      expectedImpactRange: z.string(),
      feeComponent: z.string().optional(),
      approvalRequired: z.boolean(),
    })
  ).default([]),
  fees: z.object({
    catalogueVersion: z.string(),
    setupFee: z.number(),
    recurringMonthlyFee: z.number(),
    mediaSpendBudget: z.number(),
    currency: z.string(),
  }).optional(),
  evidenceAppendix: z.array(
    z.object({
      evidenceId: z.string(),
      claimId: z.string(),
      sourceLocator: z.string(),
      observationTime: z.string(),
      classification: z.string(),
      scope: z.string(),
    })
  ).default([]),
  artifactHash: z.string().optional(),
  byteSize: z.number().optional(),
});

export type ReportSnapshot = z.infer<typeof ReportSnapshotSchema>;

export function validateReportSnapshot(data: unknown): ReportSnapshot {
  const parsed = ReportSnapshotSchema.parse(data);
  const start = new Date(parsed.reportingPeriod.start).getTime();
  const end = new Date(parsed.reportingPeriod.end).getTime();

  if (start > end) {
    throw new Error('reportingPeriod start must be before or equal to end');
  }

  return parsed;
}

export function createDefaultReportSnapshot(params: {
  workspaceId: string;
  tenantName: string;
  title: string;
  objective: string;
}): ReportSnapshot {
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `rep-${params.workspaceId}-${Date.now()}`,
    version: 1,
    workspaceId: params.workspaceId,
    title: params.title,
    objective: params.objective,
    reportingPeriod: {
      start: thirtyDaysAgo,
      end: now,
    },
    generatedAt: now,
    tenant: {
      id: params.workspaceId,
      name: params.tenantName,
      brandColor: '#FF481B',
    },
    brief: {
      recipient: 'Executive Leadership',
      audience: 'Growth & Executive Team',
      language: 'en',
      currency: 'USD',
      pageSize: 'a4',
      deliveryMethod: 'download',
      sections: [
        'decision_summary',
        'performance_cards',
        'delivery_summary',
        'next_actions',
        'evidence_appendix',
      ],
    },
    decisionSummary: {
      headline: 'Conversion Funnel & Attribution Reconfiguration',
      verdict: 'High-Impact Recovery Required',
      keyTakeaway: 'Current website form exhibits friction with 5 mandatory fields and uninstrumented GA4 / Meta CAPI.',
      actionRequired: 'Deploy progressive intake flow and configure server-side conversion telemetry.',
    },
    kpis: [
      {
        id: 'kpi-form-fields',
        name: 'Contact Form Inputs',
        value: '5 Fields',
        baselineValue: '3 Fields (Target)',
        classification: 'measured_fact',
        evidenceId: 'ev-funnel-1',
        dataSource: 'live',
      },
      {
        id: 'kpi-security-headers',
        name: 'Security Headers Grade',
        value: 'Grade D (Missing HSTS)',
        baselineValue: 'Grade A',
        classification: 'measured_fact',
        evidenceId: 'ev-sec-1',
        dataSource: 'live',
      },
      {
        id: 'kpi-aeo-citations',
        name: 'AEO Citations Readiness',
        value: '0 / 0 Structured Entities',
        baselineValue: 'Schema.org JSON-LD',
        classification: 'measured_fact',
        evidenceId: 'ev-aeo-1',
        dataSource: 'live',
      },
      {
        id: 'kpi-mrr-recovery',
        name: 'Estimated MRR Opportunity',
        value: '$12,500 / mo',
        classification: 'estimate',
        dataSource: 'model_projection',
      },
    ],
    narrativeCards: [
      {
        title: 'Funnel Friction Root Cause',
        finding: 'Contact form asks for work email and company details up-front without trust indicators.',
        interpretation: 'Mobile drop-off occurs before user establishes value perception.',
        evidenceRef: 'ev-funnel-1',
        classification: 'measured_fact',
      },
    ],
    workCompleted: [
      {
        taskId: 'task-audit-1',
        title: 'Empirical 9-Vector Growth Diagnostic Inspection',
        status: 'completed',
        completedAt: now,
      },
    ],
    nextActions: [
      {
        id: 'act-1',
        title: 'Deploy progressive intake form with mobile-first validation',
        owner: 'Growth Engineer',
        duration: '7 Days',
        expectedImpactRange: '+15% to +25% form completion rate',
        feeComponent: '$1,500 sprint',
        approvalRequired: true,
      },
      {
        id: 'act-2',
        title: 'Configure Meta CAPI and Google Tag Manager container',
        owner: 'Operations Agent',
        duration: '5 Days',
        expectedImpactRange: 'Attribution match quality > 8.0/10',
        feeComponent: '$1,200 sprint',
        approvalRequired: true,
      },
    ],
    fees: {
      catalogueVersion: 'v2026.1',
      setupFee: 2700,
      recurringMonthlyFee: 1500,
      mediaSpendBudget: 5000,
      currency: 'USD',
    },
    evidenceAppendix: [
      {
        evidenceId: 'ev-funnel-1',
        claimId: 'claim-funnel-1',
        sourceLocator: 'https://sigmatactix.com/contact',
        observationTime: now,
        classification: 'measured_fact',
        scope: 'mobile_funnel_audit',
      },
      {
        evidenceId: 'ev-sec-1',
        claimId: 'claim-sec-1',
        sourceLocator: 'https://securityheaders.com/?q=sigmatactix.com',
        observationTime: now,
        classification: 'measured_fact',
        scope: 'dns_ssl_headers',
      },
    ],
  };
}
