import { describe, it, expect } from 'vitest';
import {
  deriveModuleStatuses,
  summarizeMatrix,
  AGENT_MODULE,
  HEALTH_GLYPH,
  HEALTH_LABEL,
  HEALTH_COLOR,
  STALE_AFTER_DAYS,
  type ModuleHealth,
  type TelemetryInput,
} from './hologramTelemetry';
import { GROWTH_MATRIX_MODULES } from './hologramGraph';
import type { AgentTask, SecondBrain } from '../types';

const NOW = Date.parse('2026-08-27T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

/** A workspace with every dependency satisfied and a recent audit. */
const healthyBrain = (): SecondBrain =>
  ({
    executiveVault: { financialsOverview: 'x', strategicPlans: 'x', intellectualProperty: 'x' },
    credentialsVault: [
      { id: 'c1', platform: 'Meta Ads', username: 'a', status: 'Connected', category: 'Ads' },
      { id: 'c2', platform: 'GA4', username: 'a', status: 'Connected', category: 'Analytics' },
      { id: 'c3', platform: 'HubSpot', username: 'a', status: 'Connected', category: 'CRM' },
      { id: 'c4', platform: 'LinkedIn', username: 'a', status: 'Connected', category: 'Social' },
    ],
    brandVault: { voiceAndTone: 'x', corePositioning: 'x', offersAndPricing: 'x', brandSlogan: 'x', keyMessages: ['x'] },
    customerVault: { idealCustomerProfile: 'x', targetSegments: ['x'], customerObjections: [], testimonials: [] },
    marketingVault: { campaignHistory: 'x' },
    websiteVault: { siteUrl: 'https://example.com', cmsType: 'x', analyticsId: 'GA-1', pageHistory: '' },
    authorityVault: { targetKeywords: ['growth os'], backlinkProfileSummary: '', seoFocusAreas: [] },
    operationsVault: { standardOperatingProcedures: [], orgHierarchy: '' },
    aiWorkflowVault: [{ id: 'w1', agentType: 'Marketing Agent', systemPrompt: 'x', modelRouterEndpoint: 'x', temperature: 0.2, maxTokens: 100, agentConstraints: [] }],
    auditVault: {
      overallScore: 68,
      lastAuditedAt: daysAgo(3),
      findings: {
        websitePresence: 'x', socialMediaPresence: 'x', seoReadiness: 'x', aiVisibility: 'x',
        offerClarity: 'x', positioningStrength: 'x', funnelQuality: 'x', analyticsReadiness: 'x',
      },
    },
    uploadedFiles: [{ id: 'f1', name: 'a.pdf', size: '1kb', uploadedAt: daysAgo(2), vaultId: 'brandVault', status: 'Ready' }],
  }) as unknown as SecondBrain;

const task = (over: Partial<AgentTask>): AgentTask =>
  ({
    id: 't1',
    agentName: 'Creative Director Agent',
    goal: 'Draft launch copy',
    timestamp: daysAgo(1),
    status: 'Pending Approval',
    ...over,
  }) as AgentTask;

const statusFor = (key: string, input: TelemetryInput) =>
  deriveModuleStatuses({ now: NOW, ...input }).find((s) => s.moduleKey === key)!;

describe('module health derivation', () => {
  it('covers every module in the Matrix', () => {
    const statuses = deriveModuleStatuses({ now: NOW });
    expect(statuses).toHaveLength(GROWTH_MATRIX_MODULES.length);
    expect(statuses.map((s) => s.moduleKey)).toEqual(GROWTH_MATRIX_MODULES.map((m) => m.moduleKey));
  });

  it('reports an empty workspace as blocked, naming what is missing', () => {
    const s = statusFor('growth', {});
    expect(s.health).toBe('blocked');
    expect(s.missing).toContain('Target site URL');
    expect(s.detail.join(' ')).toContain('Set the site URL in the Website Vault');
  });

  it('never claims a number it cannot source', () => {
    for (const s of deriveModuleStatuses({ now: NOW })) {
      expect(s.lastActivityAt).toBeNull();
      expect(s.pendingApprovals).toBe(0);
      expect(s.activity).toBe(0);
    }
  });

  it('turns active once dependencies are met and work is recent', () => {
    const s = statusFor('growth', { brain: healthyBrain() });
    expect(s.health).toBe('active');
    expect(s.missing).toHaveLength(0);
  });

  it('goes stale after the threshold', () => {
    const brain = healthyBrain();
    brain.auditVault.lastAuditedAt = daysAgo(STALE_AFTER_DAYS + 5);
    const s = statusFor('growth', { brain });
    expect(s.health).toBe('stale');
    expect(s.headline).toMatch(/No activity in 3\d days/);
  });

  it('reports configured-but-never-run as unknown, not active', () => {
    const brain = healthyBrain();
    brain.auditVault.lastAuditedAt = '';
    brain.auditVault.findings.websitePresence = 'x';
    const s = statusFor('authority', { brain: { ...brain, aiWorkflowVault: brain.aiWorkflowVault } });
    expect(s.health).toBe('unknown');
    expect(s.headline).toContain('no runs recorded');
  });

  it('raises a pending approval above staleness and blocked deps', () => {
    const s = statusFor('content', {
      agentTasks: [task({ agentName: 'Creative Director Agent', status: 'Pending Approval' })],
    });
    expect(s.health).toBe('pending');
    expect(s.pendingApprovals).toBe(1);
    expect(s.detail.join(' ')).toContain('Draft launch copy');
  });

  it('reports a locked module as locked, above dependencies and staleness', () => {
    const s = statusFor('content', {
      isModuleUnlocked: (key) => key !== 'content',
    });
    expect(s.health).toBe('locked');
    expect(s.activity).toBe(0);
    expect(s.detail.join(' ')).toContain('plan');
  });

  // Regression: the HUD's HITL counter must always have a module to point at.
  // Hiding an approval behind a plan lock left "3 PENDING" with 0 pending modules.
  it('keeps an approval visible even when the module is locked', () => {
    const s = statusFor('content', {
      brain: healthyBrain(),
      agentTasks: [task({})],
      isModuleUnlocked: (key) => key !== 'content',
    });
    expect(s.health).toBe('pending');
    expect(s.pendingApprovals).toBe(1);
    expect(s.detail.join(' ')).toContain('plan');
  });

  it('routes every agent type to a module that exists in the Matrix', () => {
    const keys = new Set(GROWTH_MATRIX_MODULES.map((m) => m.moduleKey));
    for (const target of Object.values(AGENT_MODULE)) {
      expect(keys.has(target)).toBe(true);
    }
  });

  it('keeps activity inside 0..1 and rewards live work', () => {
    const idle = statusFor('content', { brain: healthyBrain() });
    const busy = statusFor('content', {
      brain: healthyBrain(),
      agentTasks: [
        task({ id: 'a', status: 'Running' }),
        task({ id: 'b', status: 'Running' }),
      ],
    });
    for (const s of [idle, busy]) {
      expect(s.activity).toBeGreaterThanOrEqual(0);
      expect(s.activity).toBeLessThanOrEqual(1);
    }
    expect(busy.activity).toBeGreaterThan(idle.activity);
  });

  it('gives every health state a glyph, a word and a colour', () => {
    const states: ModuleHealth[] = ['active', 'pending', 'stale', 'blocked', 'locked', 'unknown'];
    for (const state of states) {
      expect(HEALTH_GLYPH[state]).toBeTruthy();
      expect(HEALTH_LABEL[state]).toBeTruthy();
      expect(HEALTH_COLOR[state]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
    expect(new Set(Object.values(HEALTH_GLYPH)).size).toBe(states.length);
  });
});

describe('matrix summary', () => {
  it('counts the HITL queue across every module', () => {
    const input: TelemetryInput = {
      now: NOW,
      brain: healthyBrain(),
      agentTasks: [
        task({ id: '1', agentName: 'Creative Director Agent' }),
        task({ id: '2', agentName: 'SEO & Authority Agent' }),
        task({ id: '3', agentName: 'Marketing Agent', status: 'Success' }),
      ],
    };
    const summary = summarizeMatrix(deriveModuleStatuses(input), input);
    expect(summary.hitlQueue).toBe(2);
    expect(summary.byHealth.pending).toBe(2);
  });

  it('reads vault fill and audit score off the workspace', () => {
    const input: TelemetryInput = { now: NOW, brain: healthyBrain() };
    const summary = summarizeMatrix(deriveModuleStatuses(input), input);
    expect(summary.vaultsTotal).toBe(10);
    expect(summary.vaultsFilled).toBeGreaterThan(7);
    expect(summary.growthScore).toBe(68);
    expect(summary.lastAuditAt).not.toBeNull();
  });

  it('reports zeros, not placeholders, for an empty workspace', () => {
    const summary = summarizeMatrix(deriveModuleStatuses({ now: NOW }), { now: NOW });
    expect(summary.vaultsFilled).toBe(0);
    expect(summary.growthScore).toBeNull();
    expect(summary.lastAuditAt).toBeNull();
    expect(summary.hitlQueue).toBe(0);
    expect(summary.dependencyCoverage).toBe(0);
  });

  it('counts dependency coverage as the share of unblocked modules', () => {
    const input: TelemetryInput = { now: NOW, brain: healthyBrain() };
    const summary = summarizeMatrix(deriveModuleStatuses(input), input);
    expect(summary.dependencyCoverage).toBeGreaterThan(0.9);
    expect(summary.total).toBe(GROWTH_MATRIX_MODULES.length);
  });
});
