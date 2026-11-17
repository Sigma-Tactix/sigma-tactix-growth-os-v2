import { describe, expect, it } from 'vitest';
import {
  buildClientWorkspaceDraft,
  createEmptyOnboardingDraft,
  mergeDocumentSuggestion,
  normalizeDomain,
  validateOnboardingDraft,
  buildInitialBrainGraphEntities,
  saveOnboardingSession,
  loadOnboardingSession,
  clearOnboardingSession,
} from './clientOnboarding';

describe('client onboarding contract', () => {
  it('starts blank and does not invent a client profile', () => {
    expect(createEmptyOnboardingDraft()).toMatchObject({
      companyName: '',
      domain: '',
      industry: '',
      icp: '',
      geography: '',
      brandVault: {
        corePositioning: '',
        offersAndPricing: '',
        voiceAndTone: '',
      },
      connectors: [],
    });
  });

  it('normalizes a website URL into a tenant domain', () => {
    expect(normalizeDomain(' https://www.Example.com/path/ ')).toBe('example.com');
  });

  it('keeps document extraction provisional and never overwrites confirmed fields', () => {
    const draft = createEmptyOnboardingDraft();
    draft.companyName = 'Confirmed Company';
    draft.sources.companyName = { kind: 'manual', status: 'confirmed' };

    const merged = mergeDocumentSuggestion(draft, {
      fileName: 'brief.pdf',
      title: 'Suggested Company',
      summary: 'A source-grounded positioning summary.',
      category: 'Brief',
    });

    expect(merged.companyName).toBe('Confirmed Company');
    expect(merged.brandVault.corePositioning).toBe('A source-grounded positioning summary.');
    expect(merged.sources.corePositioning).toEqual({
      kind: 'file',
      status: 'suggested',
      fileName: 'brief.pdf',
    });
  });

  it('requires client identity and explicit review of file suggestions', () => {
    const draft = mergeDocumentSuggestion(createEmptyOnboardingDraft(), {
      fileName: 'brief.pdf',
      summary: 'Draft positioning',
    });
    draft.companyName = 'Acme';
    draft.domain = 'acme.test';

    expect(validateOnboardingDraft(draft)).toContain(
      'Review or clear every file-derived suggestion before creating the workspace.',
    );
  });

  it('builds an honest local workspace payload without infrastructure claims', () => {
    const draft = createEmptyOnboardingDraft();
    draft.companyName = 'Acme';
    draft.domain = 'https://acme.test';
    draft.industry = 'Logistics';
    draft.sources.companyName = { kind: 'manual', status: 'confirmed' };
    draft.sources.domain = { kind: 'manual', status: 'confirmed' };

    expect(buildClientWorkspaceDraft(draft)).toEqual({
      name: 'Acme',
      domain: 'acme.test',
      industry: 'Logistics',
      icp: '',
      geography: '',
      brandVault: {
        corePositioning: '',
        offersAndPricing: '',
        voiceAndTone: '',
      },
      connectors: [],
    });
  });

  it('builds initial Second Brain knowledge graph entities from onboarding inputs', () => {
    const draft = createEmptyOnboardingDraft('acme.com');
    draft.companyName = 'Acme Corp';
    draft.icp = 'B2B SaaS VPs of Growth with >$20k ad spend';
    draft.brandVault.corePositioning = 'Autonomous growth marketing without agency markups';
    draft.brandVault.offersAndPricing = '$4,999/mo growth retainer';

    const entities = buildInitialBrainGraphEntities(draft);
    expect(entities).toHaveLength(4);
    expect(entities.map((e) => e.name)).toEqual([
      'Acme Corp',
      'Acme Corp ICP Target',
      'Acme Corp Core Positioning',
      'Acme Corp Core Offer',
    ]);
    expect(entities.find((e) => e.entityType === 'Persona')?.summary).toBe(
      'B2B SaaS VPs of Growth with >$20k ad spend',
    );
  });
it('saves, restores, and clears resumable onboarding sessions', () => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    };

    const draft = createEmptyOnboardingDraft('beta.io');
    draft.companyName = 'Beta Technologies';
    draft.industry = 'Clean Energy';

    saveOnboardingSession({
      draft,
      step: 2,
      uploadedFileName: 'clean-energy-deck.pdf',
      savedAt: '2026-11-17T20:00:00.000Z',
    });

    const restored = loadOnboardingSession();
    expect(restored).not.toBeNull();
    expect(restored?.step).toBe(2);
    expect(restored?.draft.companyName).toBe('Beta Technologies');
    expect(restored?.draft.domain).toBe('beta.io');
    expect(restored?.uploadedFileName).toBe('clean-energy-deck.pdf');

    clearOnboardingSession();
    expect(loadOnboardingSession()).toBeNull();
  });
});
