import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/src/contexts/ToastContext';
import VideoStudioPage from './VideoStudioPage';

vi.mock('@/src/lib/api', () => ({
  apiFetch: vi.fn(async () => new Response(JSON.stringify({ agentTasks: [] }), { status: 200 })),
}));

describe('VideoStudioPage', () => {
  it('renders a usable empty state when demo scenes are disabled', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <VideoStudioPage />
      </ToastProvider>,
    );

    expect(html).toContain('Video &amp; Motion Studio');
    expect(html).toContain('No storyboard scenes yet');
  });
});
