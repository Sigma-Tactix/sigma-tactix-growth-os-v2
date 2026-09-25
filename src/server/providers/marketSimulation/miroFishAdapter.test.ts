import { describe, expect, it } from 'vitest';
import { MiroFishMarketSimulationAdapter } from './miroFishAdapter';

describe('MiroFish private-service adapter', () => {
  it('reports missing deployment and governance gates truthfully', async () => {
    await expect(new MiroFishMarketSimulationAdapter({}).capabilities()).resolves.toMatchObject({
      provider: 'mirofish', configured: false, verified: false, executionEligible: false,
      blockers: expect.arrayContaining(['private_service_url', 'service_token', 'licensing_approval']),
    });
  });

  it('rejects a public MiroFish URL because the upstream service has no tenant authentication boundary', () => {
    expect(() => new MiroFishMarketSimulationAdapter({
      baseUrl: 'https://public-mirofish.example.com', serviceToken: 'secret', licensingApproved: true,
    })).toThrow('MiroFish must use a private or loopback service URL');
  });
});
