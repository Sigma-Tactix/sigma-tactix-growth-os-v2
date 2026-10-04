import type { ClientWorkspace } from '@/src/types';

export type OnboardingField =
  | 'companyName'
  | 'domain'
  | 'industry'
  | 'icp'
  | 'geography'
  | 'corePositioning'
  | 'offersAndPricing'
  | 'voiceAndTone';

export type FieldSource = {
  kind: 'manual' | 'file';
  status: 'confirmed' | 'suggested';
  fileName?: string;
};

export type OnboardingConnector = {
  platform: string;
  accountName: string;
  propertyId: string;
};

export interface ClientOnboardingDraft {
  companyName: string;
  domain: string;
  industry: string;
  icp: string;
  geography: string;
  brandVault: {
    corePositioning: string;
    offersAndPricing: string;
    voiceAndTone: string;
  };
  connectors: OnboardingConnector[];
  sources: Partial<Record<OnboardingField, FieldSource>>;
}

export interface DocumentOnboardingSuggestion {
  fileName: string;
  title?: string;
  summary?: string;
  category?: string;
}

export function createEmptyOnboardingDraft(initialDomain = ''): ClientOnboardingDraft {
  const domain = normalizeDomain(initialDomain);
  return {
    companyName: '',
    domain,
    industry: '',
    icp: '',
    geography: '',
    brandVault: {
      corePositioning: '',
      offersAndPricing: '',
      voiceAndTone: '',
    },
    connectors: [],
    sources: domain ? { domain: { kind: 'manual', status: 'confirmed' } } : {},
  };
}

export function normalizeDomain(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase();
  }
}

export function mergeDocumentSuggestion(
  draft: ClientOnboardingDraft,
  suggestion: DocumentOnboardingSuggestion,
): ClientOnboardingDraft {
  const next = structuredClone(draft);
  const source: FieldSource = {
    kind: 'file',
    status: 'suggested',
    fileName: suggestion.fileName,
  };

  if (!next.companyName && suggestion.title?.trim()) {
    next.companyName = suggestion.title.trim();
    next.sources.companyName = source;
  }
  if (!next.brandVault.corePositioning && suggestion.summary?.trim()) {
    next.brandVault.corePositioning = suggestion.summary.trim();
    next.sources.corePositioning = source;
  }
  if (!next.industry && suggestion.category?.trim() && suggestion.category !== 'Uncategorized') {
    next.industry = suggestion.category.trim();
    next.sources.industry = source;
  }
  return next;
}

export function markFieldConfirmed(
  draft: ClientOnboardingDraft,
  field: OnboardingField,
): ClientOnboardingDraft {
  return {
    ...draft,
    sources: {
      ...draft.sources,
      [field]: { ...draft.sources[field], kind: draft.sources[field]?.kind ?? 'manual', status: 'confirmed' },
    },
  };
}

export function hasUnreviewedSuggestions(draft: ClientOnboardingDraft): boolean {
  return Object.values(draft.sources).some((source) => source?.status === 'suggested');
}

export function validateOnboardingDraft(draft: ClientOnboardingDraft): string[] {
  const errors: string[] = [];
  if (!draft.companyName.trim()) errors.push('Company name is required.');
  if (!normalizeDomain(draft.domain)) errors.push('Website domain is required.');
  if (hasUnreviewedSuggestions(draft)) {
    errors.push('Review or clear every file-derived suggestion before creating the workspace.');
  }
  return errors;
}

export function buildClientWorkspaceDraft(draft: ClientOnboardingDraft): Partial<ClientWorkspace> {
  return {
    name: draft.companyName.trim(),
    domain: normalizeDomain(draft.domain),
    industry: draft.industry.trim(),
    icp: draft.icp.trim(),
    geography: draft.geography.trim(),
    brandVault: {
      corePositioning: draft.brandVault.corePositioning.trim(),
      offersAndPricing: draft.brandVault.offersAndPricing.trim(),
      voiceAndTone: draft.brandVault.voiceAndTone.trim(),
    },
    connectors: draft.connectors,
  };
}
