import { readFile } from 'node:fs/promises';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';

/** Verify the same explicit ADC user file passed to the stdio Google Ads server. */
export async function verifyGoogleAdsIdentity(env: NodeJS.ProcessEnv): Promise<string> {
  if (!env.GOOGLE_APPLICATION_CREDENTIALS || !env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    throw new Error('Google Ads user credentials and developer token are required.');
  }
  const credentials = JSON.parse(await readFile(env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  if (credentials.type !== 'authorized_user') {
    throw new Error('This pilot requires user ADC credentials; service-account and external-account credentials are unsupported.');
  }
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/adwords', 'https://www.googleapis.com/auth/userinfo.email'],
    clientOptions: { transporterOptions: { timeout: 10_000, retry: false } },
  });
  const token = await auth.getAccessToken();
  if (!token) throw new Error('Google did not return an access token.');
  const info = await new OAuth2Client({ transporterOptions: { timeout: 10_000, retry: false } }).getTokenInfo(token);
  if (!info.email || String(info.email_verified) !== 'true' || !info.scopes.includes('https://www.googleapis.com/auth/adwords')) {
    throw new Error('Google identity, email verification or Ads scope could not be established.');
  }
  return info.email.trim().toLowerCase();
}
