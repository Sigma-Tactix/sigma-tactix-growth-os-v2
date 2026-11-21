import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/src/contexts/ToastContext';
import { ScheduleSocialPostModal, shouldTreatAsMock } from './ScheduleSocialPostModal';
import { SocialDistributionControl } from '../connectors/SocialDistributionControl';

vi.mock('@/src/lib/api', () => ({
  apiFetch: vi.fn(async () =>
    new Response(
      JSON.stringify({
        success: true,
        status: { mode: 'unavailable', configured: false, connectedChannelsCount: 3, supportedPlatforms: ['linkedin', 'twitter'] },
        channels: [
          { id: 'chan-li-01', name: 'Growth OS LinkedIn', platform: 'linkedin', connected: true, status: 'active' },
          { id: 'chan-tw-01', name: 'Growth OS X', platform: 'twitter', connected: true, status: 'active' },
        ],
      }),
      { status: 200 }
    )
  ),
}));

describe('Social Distribution Components', () => {
  it('renders ScheduleSocialPostModal with content and channel controls', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <ScheduleSocialPostModal
          isOpen={true}
          onClose={() => {}}
          initialContent="Empirical growth playbook launch announcement"
          title="Playbook Launch"
        />
      </ToastProvider>
    );

    expect(html).toContain('Schedule via Social Hub');
    expect(html).toContain('Empirical growth playbook launch announcement');
    expect(html).toContain('Select Destination Channels');
    expect(html).toContain('Confirm Schedule');
  });

  it('renders nothing when modal isOpen is false', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <ScheduleSocialPostModal
          isOpen={false}
          onClose={() => {}}
          initialContent="Hidden post"
        />
      </ToastProvider>
    );

    expect(html).not.toContain('Schedule via Social Hub');
    expect(html).not.toContain('Hidden post');
  });

  it('treats mock/offline and unloaded statuses as mock so fake success is impossible', () => {
    expect(shouldTreatAsMock({ mode: 'unavailable', configured: false, active: false, connectedChannelsCount: 0, supportedPlatforms: [] })).toBe(true);
    expect(shouldTreatAsMock(null)).toBe(true);
    expect(
      shouldTreatAsMock({ mode: 'live', configured: true, active: true, connectedChannelsCount: 2, supportedPlatforms: ['linkedin'] })
    ).toBe(false);
  });

  it('renders SocialDistributionControl with gateway details', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <SocialDistributionControl />
      </ToastProvider>
    );

    expect(html).toContain('Social connections');
    expect(html).toContain('Posts need a connected channel and your approval.');
    expect(html).not.toContain('SOCIAL_SCHEDULER_API_URL');
  });
});
