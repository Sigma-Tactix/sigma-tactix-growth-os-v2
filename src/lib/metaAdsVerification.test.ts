import { describe, expect, it, vi } from 'vitest';
import { META_MARKETING_API_VERSION, normalizeMetaAdAccountId, verifyMetaAdsConnection } from './metaAdsVerification';

describe('Meta Ads verification', () => {
  it('accepts only an Ads account identifier, never a Page ID', () => {
    expect(normalizeMetaAdAccountId('act_123456789')).toBe('act_123456789');
    expect(normalizeMetaAdAccountId('109090252077535')).toBeUndefined();
  });

  it('uses a supported version, read-only endpoint, and bearer header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) });
    await expect(verifyMetaAdsConnection('secret-token', 'act_123456789', fetchImpl)).resolves.toEqual({
      verified: true,
      adAccountId: 'act_123456789',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(`/${META_MARKETING_API_VERSION}/act_123456789/insights?`),
      expect.objectContaining({ headers: { Authorization: 'Bearer secret-token' } }),
    );
    expect(fetchImpl.mock.calls[0][0]).not.toContain('secret-token');
  });

  it('returns actionable redacted provider diagnostics', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { code: 200, error_subcode: 33, message: 'sensitive provider detail' } }),
    });
    const result = await verifyMetaAdsConnection('secret-token', 'act_123456789', fetchImpl);
    expect(result).toMatchObject({ verified: false, httpStatus: 403, providerCode: 200, providerSubcode: 33 });
    if (result.verified !== false) throw new Error('Expected Meta verification to fail');
    expect(result.message).not.toContain('sensitive provider detail');
    expect(result.message).not.toContain('secret-token');
  });
});
