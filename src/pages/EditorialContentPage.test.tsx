import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/src/contexts/ToastContext';
import EditorialContentPage from './EditorialContentPage';

vi.mock('@/src/lib/api', () => ({
  apiFetch: vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })),
  repurposeArticleWithAgentReach: vi.fn(),
}));

// Audit P0 regression lock: a fresh workspace must not ship a pre-seeded
// "sample article", a fabricated 99.4% brand-voice badge, or an invented
// agent run ("Today at 04:15 AM, 1,420 words").
describe('EditorialContentPage', () => {
  it('starts empty — no pre-seeded article, voice score, or run record', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <EditorialContentPage />
      </ToastProvider>,
    );

    // Empty document state, not the old fabricated sample article.
    expect(html).toContain('No article yet');
    expect(html).not.toContain('Why Renting Marketing Headcount Kills');

    // No fabricated metrics.
    expect(html).not.toContain('99.4%');
    expect(html).not.toContain('Brand Voice:');
    expect(html).not.toContain('0 AI Clich');
    expect(html).not.toContain('Reading Level: Grade 11');

    // No pre-seeded agent run.
    expect(html).not.toContain('run-editorial-01');
    expect(html).not.toContain('Today at 04:15');
  });
});
