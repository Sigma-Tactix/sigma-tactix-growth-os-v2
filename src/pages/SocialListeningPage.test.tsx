import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/src/contexts/ToastContext';
import SocialListeningPage from './SocialListeningPage';

vi.mock('@/src/lib/api', () => ({
  apiFetch: vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })),
  syncAgentReachSocial: vi.fn(),
  scanCompetitorWithAgentReach: vi.fn(),
}));

// Audit P1 regression lock: the seeded demo mentions (invented authors,
// "48.2K followers", "12.4K Impressions", engagement 418) must NOT appear
// for a fresh tenant — the stream starts empty, and seeded data is only
// reachable behind VITE_SEED_DEMO_WORKSPACE, labelled "Seeded sample".
describe('SocialListeningPage', () => {
  it('starts with an honest empty stream — no seeded demo mentions', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <SocialListeningPage />
      </ToastProvider>,
    );

    expect(html).toContain('No mentions yet');
    expect(html).toContain('No mention selected');
    // None of the seeded fixture content may render for a fresh tenant.
    expect(html).not.toContain('Tariq Al-Mansoor');
    expect(html).not.toContain('@elena_dev_founder');
    expect(html).not.toContain('48.2K');
    expect(html).not.toContain('12.4K Impressions');
    // The per-card "Seeded sample" badge and the stream disclosure must not
    // appear (the pre-existing KPI card already discloses the local sample).
    expect(html).not.toContain('Sample item — not a live capture');
    expect(html).not.toContain('includes seeded sample');
  });
});
