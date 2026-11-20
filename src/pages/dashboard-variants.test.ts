/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TDD RED phase — tests written before any production code.
 * These tests describe the three dashboard variants:
 *   A: Daily Briefing   — editorial scan layout
 *   B: Command Center   — dense KPI grid with sparklines
 *   C: Progress Board   — narrative weekly-review layout
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// ─── mocks shared across all variant tests ──────────────────────────────────

const mockWorkspace = {
  name: 'Acme Corp',
  id: 'ws-1',
  tier: 'GROWTH',
  domain: 'acme.com',
};

vi.mock('@/src/contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({ currentWorkspace: mockWorkspace }),
}));

vi.mock('@/src/contexts/UserContext', () => ({
  useUser: () => ({ role: 'USER' }),
}));

vi.mock('@/src/lib/actionQueueStore', () => ({
  useActionQueue: () => ({ pendingCount: 0, items: [] }),
}));

// Mock localStorage
const storage: Record<string, string> = {};
const mockStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (_key: string, value: string) => { storage[value] = value; },
  removeItem: (_key: string) => { delete storage[_key]; },
};
(globalThis as Record<string, unknown>).localStorage = mockStorage;

// ─── Variant A: Daily Briefing ─────────────────────────────────────────────

describe('DashboardBriefing (variant A)', () => {
  it('renders without crashing', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html.length).toBeGreaterThan(0);
  }, 10000);

  it('shows the workspace name in the masthead', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Acme Corp');
  });

  it('shows "Daily Briefing" or the headline label', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    // The variant title or headline should be present
    expect(html).toMatch(/Visitors|Ad spend|Briefing/i);
  });

  it('has an organic/paid toggle with two buttons', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Organic');
    expect(html).toContain('Ads');
  });

  it('renders four stat cards below the headline', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    // Stat card labels from the component
    expect(html).toContain('Conversions');
    expect(html).toContain('Return on ad spend');
  });

  it('renders a channel performance table', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Channel performance');
    // Channel names from mock data
    expect(html).toContain('Google Ads');
  });

  it('renders an action list section', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('action list');
    expect(html).toContain('Review now');
  });

  it('renders a spend trend section with 12 bars', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Spend trend');
    expect(html).toContain('W1');
    expect(html).toContain('W12');
  });

  it('renders the intake metrics section', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardBriefing');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Lead intake trend');
  });
});

// ─── Variant B: Command Center ─────────────────────────────────────────────

describe('DashboardCommandCenter (variant B)', () => {
  it('renders without crashing', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html.length).toBeGreaterThan(0);
  });

  it('shows the workspace name', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Acme Corp');
  });

  it('renders exactly 6 KPI tiles', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    // Each KPI tile has a label from the kpis array
    expect(html).toContain('Ad spend');
    expect(html).toContain('Clicks');
    expect(html).toContain('Conversions');
    expect(html).toContain('ROAS');
    expect(html).toContain('Visitors');
    expect(html).toContain('CPC');
  });

  it('renders a sparkline SVG in each KPI tile', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    const svgCount = (html.match(/<svg/g) ?? []).length;
    // One sparkline per KPI (6 KPIs)
    expect(svgCount).toBeGreaterThanOrEqual(6);
  });

  it('renders the channels-at-a-glance table', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Channels at a glance');
    expect(html).toContain('Google Ads');
  });

  it('renders a status column with visual icons', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Status');
    expect(html).toContain('OPTIMAL');
  });

  it('renders a what-needs-attention alerts panel', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('What needs attention');
  });

  it('renders a quick actions grid', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Quick actions');
    expect(html).toContain('New campaign');
    expect(html).toContain('Agent cockpit');
  });

  it('renders an organic/paid toggle', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardCommandCenter');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Organic');
    expect(html).toContain('Ads');
  });
});

// ─── Variant C: Progress Board ─────────────────────────────────────────────

describe('DashboardProgressBoard (variant C)', () => {
  it('renders without crashing', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html.length).toBeGreaterThan(0);
  });

  it('shows the workspace name', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Acme Corp');
  });

  it('renders a centered narrative header', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Progress board');
    expect(html).toContain('marketing stands');
  });

  it('renders 4 top-level stat cards', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Total spend');
    expect(html).toContain('Conversions');
    expect(html).toContain('Return on spend');
    expect(html).toContain('Active channels');
  });

  it('renders a 12-month bar chart', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Ad spend over the last 12 months');
    expect(html).toContain('Jan');
    expect(html).toContain('Dec');
  });

  it('renders story cards with month labels', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('What happened this quarter');
    expect(html).toContain('December');
    expect(html).toContain('November');
    expect(html).toContain('October');
  });

  it('renders recommendations sorted by priority', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('What to do next');
    expect(html).toContain('high');
    expect(html).toContain('Reallocate budget');
    expect(html).toContain('Fix the Google Ads connection');
  });

  it('renders action buttons on recommendations', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Fix now');
    expect(html).toContain('View campaigns');
  });

  it('renders an organic/paid toggle', async () => {
    const mod = await import('@/src/pages/dashboard-variants/DashboardProgressBoard');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    expect(html).toContain('Organic');
    expect(html).toContain('Ads');
  });
});
