export type CredentialFieldKey = 'accessToken' | 'developerToken' | 'serviceAccountKey';
export type ChannelMedia = 'organic' | 'paid';

export interface PriorityConnectorRequirement {
  canonicalPlatform: string;
  accountField: 'propertyId' | 'customerId' | 'adAccountId' | 'accountId';
  accountLabel: string;
  accountPlaceholder: string;
  accountHelp: string;
  credentialFields: Array<{
    key: CredentialFieldKey;
    label: string;
    placeholder: string;
  }>;
}

const requirements: Record<string, PriorityConnectorRequirement> = {
  'Google Analytics 4 (GA4)': {
    canonicalPlatform: 'Google Analytics',
    accountField: 'propertyId',
    accountLabel: 'GA4 Property ID / Account ID',
    accountPlaceholder: 'e.g. 458674440',
    accountHelp: 'Use the numeric Property ID. A permitted Account ID can be resolved to its property.',
    credentialFields: [{ key: 'serviceAccountKey', label: 'Google Cloud Service Account JSON Key', placeholder: 'Upload or paste the complete service-account JSON key.' }],
  },
  'Google Ads': {
    canonicalPlatform: 'Google Ads',
    accountField: 'customerId',
    accountLabel: 'Google Ads Customer ID',
    accountPlaceholder: 'e.g. 123-456-7890',
    accountHelp: 'The 10-digit client customer ID. Hyphens are accepted.',
    credentialFields: [
      { key: 'accessToken', label: 'OAuth Access Token', placeholder: 'OAuth 2.0 access token with Google Ads access' },
    ],
  },
  'Meta Ads Manager': {
    canonicalPlatform: 'Meta Ads', accountField: 'adAccountId', accountLabel: 'Meta Ad Account ID', accountPlaceholder: 'e.g. act_123456789', accountHelp: 'Use the exact Ads account ID beginning with act_. This is not the Facebook Page ID.',
    credentialFields: [{ key: 'accessToken', label: 'Meta System User Access Token', placeholder: 'Token for this app with ads_read; add ads_management only for approved writes' }],
  },
  'LinkedIn Ads': {
    canonicalPlatform: 'LinkedIn Ads', accountField: 'adAccountId', accountLabel: 'LinkedIn Ad Account ID', accountPlaceholder: 'e.g. 123456789', accountHelp: 'Use the numeric Campaign Manager account ID. The token needs r_ads or rw_ads.',
    credentialFields: [{ key: 'accessToken', label: 'LinkedIn OAuth 2.0 Access Token', placeholder: 'Token with r_ads or rw_ads scope' }],
  },
  'Twitter (X) Ads': {
    canonicalPlatform: 'Twitter (X) Ads', accountField: 'adAccountId', accountLabel: 'X Ads Account ID', accountPlaceholder: 'e.g. 18ce54d4x5t', accountHelp: 'Use the Ads API account ID; the app and user must have Ads API access.',
    credentialFields: [{ key: 'accessToken', label: 'X Ads User Access Token', placeholder: 'User-context access token authorized for Ads API' }],
  },
  'Reddit Ads': {
    canonicalPlatform: 'Reddit Ads', accountField: 'adAccountId', accountLabel: 'Reddit Ads Account ID', accountPlaceholder: 'e.g. a2_xxxxx', accountHelp: 'Use the Reddit Ads account ID. The token needs adsread and the app/account must have Ads API access.',
    credentialFields: [{ key: 'accessToken', label: 'Reddit OAuth Access Token', placeholder: 'OAuth token with adsread scope' }],
  },
  'LinkedIn Marketing & Pages': {
    canonicalPlatform: 'LinkedIn (Organic)', accountField: 'accountId', accountLabel: 'LinkedIn member or organization URN', accountPlaceholder: 'e.g. urn:li:organization:123456', accountHelp: 'Use the member or organization URN whose organic posts and followers are to be reported.',
    credentialFields: [{ key: 'accessToken', label: 'LinkedIn OAuth Access Token', placeholder: 'OAuth token with organic profile or organization read scope' }],
  },
  'X (Twitter) Developer API v2': {
    canonicalPlatform: 'Twitter/X (Organic)', accountField: 'accountId', accountLabel: 'X Profile ID', accountPlaceholder: 'e.g. 123456789', accountHelp: 'Use the numeric X profile ID associated with the user-context OAuth token.',
    credentialFields: [{ key: 'accessToken', label: 'X OAuth 2.0 User Token', placeholder: 'User-context token with users.read and tweet.read' }],
  },
  'Meta Pages & Instagram': {
    canonicalPlatform: 'Facebook Pages', accountField: 'accountId', accountLabel: 'Facebook Page or Instagram User ID', accountPlaceholder: 'e.g. 123456789', accountHelp: 'Use the Page ID or professional Instagram user ID that the access token can read.',
    credentialFields: [{ key: 'accessToken', label: 'Meta Page Access Token', placeholder: 'Page access token with pages_read_engagement and instagram_basic' }],
  },
  'Reddit Community (Organic)': {
    canonicalPlatform: 'Reddit (Organic)', accountField: 'accountId', accountLabel: 'Reddit username', accountPlaceholder: 'e.g. sigmatactix', accountHelp: 'Use the authenticated Reddit username for organic profile and post reporting.',
    credentialFields: [{ key: 'accessToken', label: 'Reddit OAuth Access Token', placeholder: 'OAuth token with identity and read scopes' }],
  },
  'Google Search Console': {
    canonicalPlatform: 'Google Search Console', accountField: 'accountId', accountLabel: 'Verified site URL', accountPlaceholder: 'e.g. https://example.com/', accountHelp: 'Use an exact Search Console property URL that the OAuth account can read.',
    credentialFields: [{ key: 'accessToken', label: 'Google OAuth Access Token', placeholder: 'OAuth token with webmasters.readonly scope' }],
  },
};

requirements['Google Analytics'] = requirements['Google Analytics 4 (GA4)'];
requirements['Meta Ads'] = requirements['Meta Ads Manager'];
requirements['X Ads'] = requirements['Twitter (X) Ads'];
requirements['LinkedIn (Organic)'] = requirements['LinkedIn Marketing & Pages'];
requirements['Twitter/X (Organic)'] = requirements['X (Twitter) Developer API v2'];
requirements['Facebook Pages'] = requirements['Meta Pages & Instagram'];
requirements['Instagram (Organic)'] = requirements['Meta Pages & Instagram'];
requirements['Reddit (Organic)'] = requirements['Reddit Community (Organic)'];

export function getPriorityConnectorRequirement(platform: string) {
  return requirements[platform];
}

export function validatePriorityConnectorCredentials(platform: string, accountId: string, credentials: Record<string, unknown>) {
  const requirement = getPriorityConnectorRequirement(platform);
  if (!requirement) return { valid: false as const, error: `Live verification is not implemented for ${platform}.` };
  if (!accountId.trim()) return { valid: false as const, error: `${requirement.accountLabel} is required.` };
  if (requirement.canonicalPlatform === 'Meta Ads' && !/^act_\d+$/.test(accountId.trim())) {
    return { valid: false as const, error: 'Meta Ads requires an Ad Account ID in the format act_<digits>; do not enter a Facebook Page ID.' };
  }
  const missing = requirement.credentialFields.filter(field => typeof credentials[field.key] !== 'string' || !(credentials[field.key] as string).trim());
  if (missing.length) return { valid: false as const, error: `${platform} requires ${requirement.credentialFields.map(field => field.label).join(' and ')}.` };
  return { valid: true as const };
}

/** A pipeline becomes verified only from a server-owned provider handshake. */
export function isVerifiedPipeline(pipeline: { status?: string; verificationState?: string }) {
  return pipeline.status === 'active' && pipeline.verificationState === 'verified';
}

export function getPipelineDisplayState(pipeline: { status?: string; verificationState?: string; lastMetrics?: { available?: boolean } }) {
  if (pipeline.status !== 'active') return pipeline.status === 'warning' || pipeline.status === 'syncing' ? 'configured' : 'failed';
  if (!isVerifiedPipeline(pipeline)) return 'configured';
  return pipeline.lastMetrics?.available ? 'live' : 'verified';
}

export function isPriorityMarketingPlatform(platform?: string) {
  return Boolean(platform && requirements[platform]);
}

/** Maps dashboard channels to a media mode. GA4 is organic behaviour data. */
export function classifyChannelMedia(platform?: string): ChannelMedia {
  const value = (platform || '').toLowerCase();
  if (/(ads|ad manager|campaign manager)/.test(value) && !/(pages|organic)/.test(value)) return 'paid';
  return 'organic';
}

export function filterMetricsByMedia<T extends { platform?: string; mediaType?: ChannelMedia }>(metrics: T[], mode: ChannelMedia) {
  return metrics.filter(metric => (metric.mediaType || classifyChannelMedia(metric.platform)) === mode);
}
