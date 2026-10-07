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

  it('performs private gateway verification and transitions to verified state upon success', async () => {
    const fetchMock = (globalThis as any).fetch;
    try {
      (globalThis as any).fetch = () => Promise.resolve(new Response(JSON.stringify({ status: 'healthy' }), { status: 200 }));
      const adapter = new MiroFishMarketSimulationAdapter({
        baseUrl: 'http://127.0.0.1:5001',
        serviceToken: 'secure-token',
        licensingApproved: true,
      });
      const verified = await adapter.verify();
      expect(verified).toBe(true);

      const caps = await adapter.capabilities();
      expect(caps.configured).toBe(true);
      expect(caps.verified).toBe(true);
      expect(caps.detail).toContain('verified and reachable');
    } finally {
      (globalThis as any).fetch = fetchMock;
    }
  });
});

