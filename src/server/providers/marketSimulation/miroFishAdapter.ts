import type { MarketSimulationCapabilities, MarketSimulationProvider, ScenarioEvidencePack, SimulationRef } from './types';

interface MiroFishOptions {
  baseUrl?: string;
  serviceToken?: string;
  licensingApproved?: boolean;
}

function assertPrivateServiceUrl(raw: string): string {
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();
  const privateHost = host === 'localhost' || host === '127.0.0.1' || host === '::1'
    || host.endsWith('.internal') || host.endsWith('.svc') || host.endsWith('.local')
    || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (!['http:', 'https:'].includes(url.protocol) || !privateHost || url.username || url.password) {
    throw new Error('MiroFish must use a private or loopback service URL');
  }
  return url.toString().replace(/\/$/, '');
}

export class MiroFishMarketSimulationAdapter implements MarketSimulationProvider {
  private readonly baseUrl: string;
  private readonly serviceToken: string;
  private readonly licensingApproved: boolean;

  constructor(options: MiroFishOptions = {}) {
    const configuredUrl = (options.baseUrl ?? process.env.MIROFISH_BASE_URL ?? '').trim();
    this.baseUrl = configuredUrl ? assertPrivateServiceUrl(configuredUrl) : '';
    this.serviceToken = (options.serviceToken ?? process.env.MIROFISH_SERVICE_TOKEN ?? '').trim();
    this.licensingApproved = options.licensingApproved ?? process.env.MIROFISH_LICENSING_APPROVED === 'true';
  }

  async capabilities(): Promise<MarketSimulationCapabilities> {
    const blockers = [
      ...(!this.baseUrl ? ['private_service_url'] : []),
      ...(!this.serviceToken ? ['service_token'] : []),
      ...(!this.licensingApproved ? ['licensing_approval'] : []),
    ];
    return {
      provider: 'mirofish',
      configured: blockers.length === 0,
      verified: false,
      executionEligible: false,
      blockers,
      detail: blockers.length
        ? `MiroFish remains disabled until these gates pass: ${blockers.join(', ')}.`
        : 'Private service settings exist; runtime, tenant gateway, Zep, model provider, and deletion behavior are not verified.',
    };
  }

  async create(_input: ScenarioEvidencePack): Promise<SimulationRef> {
    const capability = await this.capabilities();
    if (!capability.configured) throw new Error(capability.detail);
    throw new Error('MiroFish project creation remains disabled until the private gateway contract is verified.');
  }
}
