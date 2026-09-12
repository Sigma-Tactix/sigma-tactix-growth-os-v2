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
};

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
    connector.status === 'Connected' && credentialsFor(connector).accountId === accountId);
  if (matches.length !== 1) throw new Error('Connect this exact provider account in the credentials vault before testing the pipeline.');
  const connector = matches[0];
  const start = performance.now();
  const verified = await adapterFor(canonical)(credentialsFor(connector));
  if (!verified) throw new Error('The provider could not verify access to this account. Check credentials, permissions and API availability.');
  return { verified: true as const, latencyMs: Math.round(performance.now() - start), connectorId: connector.id };
}

export const unsupportedConnectorAdapter = async (): Promise<boolean> => false;
