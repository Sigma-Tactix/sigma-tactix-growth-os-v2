import { describe, expect, it } from 'vitest';
import {
  buildLandingPageDraft,
  validateLandingArtifactForApproval,
} from './landingArtifact';

describe('LandingArtifact contract', () => {
  it('creates an editable, provenance-linked proposal with no performance claim', () => {
    const draft = buildLandingPageDraft({
      artifactId: 'artifact-1',
      workspaceId: 'workspace-a',
      source: {
        url: 'https://example.com/pricing',
        title: 'Example <Platform>',
        metaDescription: 'A useful product for teams.',
        h1s: ['Move work forward'],
        h2s: ['One workspace', 'Clear approvals'],
        fetchedAt: '2026-10-08T12:00:00.000Z',
      },
      brief: {
        objective: 'Make the demo journey clearer',
        audience: 'Operations leaders',
        primaryCta: 'Request a working session',
      },
    });

    expect(draft.status).toBe('draft');
    expect(draft.html).toContain('<!doctype html>');
    expect(draft.html).toContain('Proposal — not published');
    expect(draft.html).toContain('Example &lt;Platform&gt;');
    expect(draft.html).not.toMatch(/guaranteed|\+\d+%|conversion lift/i);
    expect(draft.sourceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(draft.sections.map(section => section.id)).toEqual([
      'hero', 'proof', 'workflow', 'cta',
    ]);
  });

  it('will not approve an artifact without a captured source and rendered desktop/mobile previews', () => {
    const result = validateLandingArtifactForApproval({
      sourceUrl: 'https://example.com',
      sourceCapturedAt: '2026-10-08T12:00:00.000Z',
      htmlHash: 'a'.repeat(64),
      previews: { sourceDesktop: null, sourceMobile: 'https://storage/mobile.jpg', proposedDesktop: null, proposedMobile: 'https://storage/proposed-mobile.jpg' },
    });

    expect(result.ready).toBe(false);
    expect(result.reasons).toEqual([
      'Missing captured desktop source evidence.',
      'Missing rendered desktop proposal preview.',
    ]);
  });
});
