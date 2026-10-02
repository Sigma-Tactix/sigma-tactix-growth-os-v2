import { describe, it, expect } from 'vitest';
import {
  type CampaignBundle,
  validateCampaignBundle,
  createCampaignBundle,
  dispatchCampaignPublish,
  computeCampaignContentHash,
  DurableScheduler,
} from './campaignBundlePublisher';

describe('Campaign Bundle Publisher & Durable Social Delivery (Phase 5)', () => {
  const fivePoints = [
    'Attribution Leak: Missing server-side GA4 Measurement Protocol',
    'Friction Leak: 5 required fields on mobile contact form',
    'Security Leak: Missing HSTS and CSP headers',
    'AEO Leak: 0/0 structured entity schema markup',
    'Media Leak: 3.8x ad frequency fatigue without hook resets',
  ];

  it('generates and validates a complete campaign bundle with all 5 leaks represented', () => {
    const bundle = createCampaignBundle({
      workspaceId: 'ws-sigmatactix',
      title: '5 Growth Leaks Found in Diagnostic',
      topic: 'B2B Growth Engineering',
      contentPoints: fivePoints,
      targetChannels: ['LinkedIn (Organic)', 'Twitter/X (Organic)'],
    });

    const validation = validateCampaignBundle(bundle);
    expect(validation.valid).toBe(true);
    // 5 content points + cover slide + CTA slide = 7 slides
    expect(bundle.carousel.slides.length).toBeGreaterThanOrEqual(7);
    expect(bundle.thread.length).toBeGreaterThanOrEqual(3);
    expect(bundle.approval.status).toBe('draft');
  });

  it('invalidates approval when publishable content is edited after sign-off', () => {
    const bundle = createCampaignBundle({
      workspaceId: 'ws-sigmatactix',
      title: 'Original Title',
      topic: 'Topic',
      contentPoints: fivePoints,
      targetChannels: ['LinkedIn (Organic)'],
    });

    // Sign off / approve
    bundle.approval.status = 'approved';
    bundle.approval.contentHash = computeCampaignContentHash(bundle);
    bundle.approval.approvedBy = 'user-growth-lead';

    const checkBeforeEdit = validateCampaignBundle(bundle);
    expect(checkBeforeEdit.valid).toBe(true);
    expect(checkBeforeEdit.approvalValid).toBe(true);

    // Edit content after approval
    bundle.carousel.caption = 'Altered caption without re-approval!';

    const checkAfterEdit = validateCampaignBundle(bundle);
    expect(checkAfterEdit.approvalValid).toBe(false);
    expect(checkAfterEdit.reasons).toContain('Content was edited after approval; re-approval is required.');
  });

  it('rejects dispatch if approval is invalidated or missing', async () => {
    const bundle = createCampaignBundle({
      workspaceId: 'ws-sigmatactix',
      title: 'Draft Campaign',
      topic: 'Topic',
      contentPoints: fivePoints,
      targetChannels: ['LinkedIn (Organic)'],
    });

    // Attempt to dispatch while status is still 'draft'
    const result = await dispatchCampaignPublish(bundle, {
      channels: ['LinkedIn (Organic)'],
      adapters: {
        'LinkedIn (Organic)': async () => ({ success: true, url: 'https://linkedin.com/post/123' }),
      },
      connectors: {
        'LinkedIn (Organic)': { connected: true, accountName: 'Sigma Tactix Corporate' },
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Asset is not in approved state');
  });

  it('records per-channel receipts and derives partial success when one channel fails', async () => {
    const bundle = createCampaignBundle({
      workspaceId: 'ws-sigmatactix',
      title: 'Multi-Channel Push',
      topic: 'Topic',
      contentPoints: fivePoints,
      targetChannels: ['LinkedIn (Organic)', 'Twitter/X (Organic)'],
    });

    // Sign off
    bundle.approval.status = 'approved';
    bundle.approval.contentHash = computeCampaignContentHash(bundle);
    bundle.approval.approvedBy = 'user-admin';

    const result = await dispatchCampaignPublish(bundle, {
      channels: ['LinkedIn (Organic)', 'Twitter/X (Organic)'],
      adapters: {
        'LinkedIn (Organic)': async () => ({ success: true, url: 'https://linkedin.com/post/789' }),
        'Twitter/X (Organic)': async () => ({ success: false, error: 'Rate limit exceeded on X API' }),
      },
      connectors: {
        'LinkedIn (Organic)': { connected: true, accountName: 'Sigma LinkedIn' },
        'Twitter/X (Organic)': { connected: true, accountName: 'Sigma X' },
      },
    });

    // Must be partial, NOT unconditional true!
    expect(result.status).toBe('partial');
    expect(result.success).toBe(false);
    expect(result.channelResults['LinkedIn (Organic)'].success).toBe(true);
    expect(result.channelResults['Twitter/X (Organic)'].success).toBe(false);
  });

  it('manages durable schedules with leases, retries, and cancellation state', () => {
    const scheduler = new DurableScheduler('ws-sigmatactix');

    const job = scheduler.scheduleJob({
      jobType: 'social_publish',
      payload: { campaignId: 'camp-1' },
      scheduledAt: new Date(Date.now() - 1000).toISOString(), // Ready now
      maxAttempts: 2,
    });

    expect(job.status).toBe('scheduled');

    // Worker acquires lease
    const acquired = scheduler.acquireNextJob('worker-node-1');
    expect(acquired?.id).toBe(job.id);
    expect(acquired?.status).toBe('running');

    // Worker marks failure with retry
    scheduler.recordJobOutcome(job.id, {
      success: false,
      error: 'Temporary connection failure',
      retry: true,
    });

    const retriedJob = scheduler.getJob(job.id);
    expect(retriedJob?.attempts).toBe(1);
    expect(retriedJob?.status).toBe('scheduled'); // Back in queue for retry

    // Can be cancelled
    scheduler.cancelJob(job.id);
    expect(scheduler.getJob(job.id)?.status).toBe('cancelled');
  });
});
