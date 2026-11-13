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

  // Audit P0 regression lock: the open-weights model list is a reference
  // facade — every render is produced by the HyperFrames governed renderer,
  // and the page must say so instead of attributing output to a picked
  // neural model.
  it('labels the model list as reference and attributes renders to HyperFrames', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <VideoStudioPage />
      </ToastProvider>,
    );

    expect(html).toContain('Reference stack');
    expect(html).toContain('not wired');
    expect(html).toContain('HYPERFRAMES RENDERER');
    // The decorative selectors no longer exist as working controls.
    expect(html).not.toContain('Voiceover Speed');
    expect(html).not.toContain('4K Ultra HD');
    expect(html).not.toContain('0.75x Slow');
  });
});
