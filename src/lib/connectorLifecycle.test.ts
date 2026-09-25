import { describe, expect, it } from 'vitest';
import {
  classifyChannelMedia,
  filterMetricsByMedia,
  getPriorityConnectorRequirement,
  getPipelineDisplayState,
  isVerifiedPipeline,
  validatePriorityConnectorCredentials,
} from './connectorLifecycle';

describe('priority connector lifecycle', () => {
  it.each([
    ['Google Analytics 4 (GA4)', ['serviceAccountKey'], 'propertyId'],
    ['Google Ads', ['accessToken', 'developerToken'], 'customerId'],
    ['Meta Ads Manager', ['accessToken'], 'adAccountId'],
    ['LinkedIn Ads', ['accessToken'], 'adAccountId'],
    ['Twitter (X) Ads', ['accessToken'], 'adAccountId'],
    ['Reddit Ads', ['accessToken'], 'adAccountId'],
  ])('publishes explicit requirements for %s', (platform, fields, accountField) => {
    const requirement = getPriorityConnectorRequirement(platform);
    expect(requirement?.credentialFields.map(field => field.key)).toEqual(fields);
    expect(requirement?.accountField).toBe(accountField);
  });

  it('rejects incomplete provider credentials instead of treating configuration as live', () => {
    expect(validatePriorityConnectorCredentials('Google Ads', '123-456-7890', { accessToken: 'oauth' })).toEqual({
      valid: false,
      error: 'Google Ads requires OAuth Access Token and Developer Token.',
    });
    expect(validatePriorityConnectorCredentials('Meta Ads Manager', '', { accessToken: 'oauth' }).valid).toBe(false);
  });

  it('distinguishes verified access from live metrics', () => {
    expect(getPipelineDisplayState({ status: 'active' })).toBe('configured');
    expect(getPipelineDisplayState({ status: 'active', verificationState: 'verified' })).toBe('verified');
    expect(getPipelineDisplayState({ status: 'active', verificationState: 'verified', lastMetrics: { available: true } })).toBe('live');
    expect(getPipelineDisplayState({ status: 'warning' })).toBe('configured');
  });

  it('does not allow a cached active record to impersonate a verified channel', () => {
    expect(isVerifiedPipeline({ status: 'active' })).toBe(false);
    expect(isVerifiedPipeline({ status: 'active', verificationState: 'failed' })).toBe(false);
    expect(isVerifiedPipeline({ status: 'active', verificationState: 'verified' })).toBe(true);
  });

  it('classifies channels and filters reporting data by the selected media mode', () => {
    expect(classifyChannelMedia('Google Analytics 4 (GA4)')).toBe('organic');
    expect(classifyChannelMedia('LinkedIn Marketing & Pages')).toBe('organic');
    expect(classifyChannelMedia('Meta Ads Manager')).toBe('paid');
    expect(filterMetricsByMedia([
      { platform: 'Google Analytics 4 (GA4)', mediaType: 'organic' },
      { platform: 'Google Ads', mediaType: 'paid' },
    ], 'organic')).toHaveLength(1);
  });
});
