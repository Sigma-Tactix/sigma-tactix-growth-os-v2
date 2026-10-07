export const META_MARKETING_API_VERSION = 'v26.0';

export type MetaAdsVerificationResult =
  | { verified: true; adAccountId: string }
  | {
    verified: false;
    message: string;
    httpStatus?: number;
    providerCode?: number;
    providerSubcode?: number;
  };

type FetchLike = (input: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

/**
 * Meta Marketing endpoints require an ad-account identifier, not a Page ID.
 * Keeping this normalisation at the provider seam prevents a Page connector
 * credential from being presented as an Ads credential.
 */
export function normalizeMetaAdAccountId(value?: string): string | undefined {
  const candidate = value?.trim();
  return candidate && /^act_\d+$/.test(candidate) ? candidate : undefined;
}

function failureMessage(status: number, payload: unknown): MetaAdsVerificationResult {
  const error = typeof payload === 'object' && payload !== null && 'error' in payload
    ? (payload as { error?: { code?: unknown; error_subcode?: unknown } }).error
    : undefined;
  const providerCode = typeof error?.code === 'number' ? error.code : undefined;
  const providerSubcode = typeof error?.error_subcode === 'number' ? error.error_subcode : undefined;
  const identifiers = [
    `HTTP ${status}`,
    providerCode !== undefined ? `Meta code ${providerCode}` : undefined,
    providerSubcode !== undefined ? `subcode ${providerSubcode}` : undefined,
  ].filter(Boolean).join('; ');

  return {
    verified: false,
    message: `Meta Ads verification failed (${identifiers}). Check that this system user is assigned to this exact ad account and that its token has ads_read.`,
    httpStatus: status,
    providerCode,
    providerSubcode,
  };
}

/**
 * Performs a read-only, account-scoped Marketing API handshake. Tokens are
 * sent in the Authorization header and are never included in URLs or errors.
 */
export async function verifyMetaAdsConnection(
  accessToken?: string,
  accountId?: string,
  fetchImpl: FetchLike = fetch,
): Promise<MetaAdsVerificationResult> {
  if (!accessToken?.trim()) {
    return { verified: false, message: 'Meta Ads verification needs a system-user or user token with ads_read.' };
  }

  const adAccountId = normalizeMetaAdAccountId(accountId);
  if (!adAccountId) {
    return { verified: false, message: 'Meta Ads needs an Ad Account ID in the format act_<digits>; a Facebook Page ID cannot verify an Ads account.' };
  }

  try {
    const response = await fetchImpl(
      `https://graph.facebook.com/${META_MARKETING_API_VERSION}/${encodeURIComponent(adAccountId)}/insights?fields=spend&date_preset=last_7d&limit=1`,
      { headers: { Authorization: `Bearer ${accessToken.trim()}` } },
    );
    if (response.ok) return { verified: true, adAccountId };
    return failureMessage(response.status, await response.json().catch(() => undefined));
  } catch {
    return { verified: false, message: 'Meta Ads verification could not reach the provider. No credential state was changed.' };
  }
}
