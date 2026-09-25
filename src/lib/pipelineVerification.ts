import type { Connector, ConnectorPlatform } from '../types';

type Credentials = Record<string, unknown>;
type Adapter = (credentials: Credentials) => Promise<boolean>;

// These names are aliases in the pipeline catalogue, not separate providers.
const accountScopedPlatforms: Record<string, ConnectorPlatform> = {
  'Google Ads': 'Google Ads',
  'Meta Ads Manager': 'Meta Ads',
  'Meta Ads': 'Meta Ads',
  'LinkedIn Ads': 'LinkedIn Ads',
  'TikTok Ads': 'TikTok Ads',
  'Google Analytics': 'Google Analytics',
  'Google Analytics 4 (GA4)': 'Google Analytics',
  'Google Analytics 4': 'Google Analytics',
  'Twitter (X) Ads': 'Twitter (X) Ads',
  'X Ads': 'Twitter (X) Ads',
  'Reddit Ads': 'Reddit Ads',
  'LinkedIn Marketing & Pages': 'LinkedIn (Organic)',
  'LinkedIn (Organic)': 'LinkedIn (Organic)',
  'X (Twitter) Developer API v2': 'Twitter/X (Organic)',
  'Twitter/X (Organic)': 'Twitter/X (Organic)',
  'Meta Pages & Instagram': 'Facebook Pages',
  'Facebook Pages': 'Facebook Pages',
  'Instagram (Organic)': 'Instagram (Organic)',
  'Reddit Community (Organic)': 'Reddit (Organic)',
  'Reddit (Organic)': 'Reddit (Organic)',
  'Google Search Console': 'Google Search Console',
};

export function canonicalConnectorPlatform(platform: string) {
  return accountScopedPlatforms[platform];
}

export async function verifyPipelineConnection(
  platform: string,
  accountId: string,
  connectors: Connector[],
  credentialsFor: (connector: Connector) => Credentials,
  adapterFor: (platform: ConnectorPlatform) => Adapter,
) {
  const canonical = accountScopedPlatforms[platform];
  if (!canonical) throw new Error('Account verification is not implemented for this pipeline. Configuration does not establish a live connection.');
  const matches = connectors.filter(connector => connector.platform === canonical &&
    connector.status === 'Connected' &&
    (connector.verificationState === undefined || connector.verificationState === 'verified') &&
    (credentialsFor(connector).accountId === accountId || credentialsFor(connector).propertyId === accountId));
  if (matches.length !== 1) throw new Error('Connect this exact provider account in the credentials vault before testing the pipeline.');
  const connector = matches[0];
  const start = performance.now();
  const verified = await adapterFor(canonical)(credentialsFor(connector));
  if (!verified) throw new Error('The provider could not verify access to this account. Check credentials, permissions and API availability.');
  return { verified: true as const, latencyMs: Math.round(performance.now() - start), connectorId: connector.id };
}

export const unsupportedConnectorAdapter = async (): Promise<boolean> => false;
