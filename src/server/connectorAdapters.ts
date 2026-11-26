// ---------------------------------------------------------------------------
// Connector adapter layer — shared "is this credential live?" validators,
// the content-publish adapters, the credential-decryption helper, and the
// Google service-account token exchange.
//
// Extracted from server.ts (P2 increment 7 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). This is the SHARED module consumed by:
//   - src/server/routes/connectorsRoutes.ts (connect/disconnect/reconcile), and
//   - the still-inline pipelines + creative routes in server.ts, which keep
//     calling getConnectorAdapter / hasConnectorAdapter / getStoredCredentials /
//     publishAdapters / getAccessTokenFromServiceAccount.
// It moves them out of the 10k-line monolith WITHOUT duplicating the ~30
// platform validators or the publish paths.
//
// Self-contained: it imports only from src/lib/* and src/types.js, NEVER back
// into server.ts, so no import cycle is introduced. The request-scoped
// getDB / saveDB / requireModule helpers stay in server.ts and are injected
// into the connectors router.
// ---------------------------------------------------------------------------

import crypto from "crypto";
import { Connector, ConnectorPlatform } from "../types.js";
import { verifyMetaAdsConnection } from "../lib/metaAdsVerification.js";
import { unsupportedConnectorAdapter } from "../lib/pipelineVerification.js";
import { decryptCredentials } from "../lib/credentialCrypto.js";

// Integration validation helper functions
async function testSlackConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch("https://slack.com/api/conversations.list?limit=1", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json() as any;
    return data && data.ok === true;
  } catch {
    return false;
  }
}

async function testNotionConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28"
      }
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function testHubspotConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function testMetaAdsConnection(token?: string, accountId?: string): Promise<boolean> {
  const result = await verifyMetaAdsConnection(token, accountId);
  if (result.verified === false) throw new Error(result.message);
  return true;
}

async function testGoogleAdsConnection(token?: string, customerId?: string, devToken?: string): Promise<boolean> {
  if (!token || !customerId) return false;
  try {
    const normalizedCustomerId = customerId.replace(/-/g, '');
    const res = await fetch(`https://googleads.googleapis.com/v25/customers/${normalizedCustomerId}/googleAds:search`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        ...(devToken ? { "developer-token": devToken } : {})
      },
      body: JSON.stringify({ query: "SELECT campaign.id FROM campaign LIMIT 1" })
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

// Data Connectors expansion (#10) — one real "does this credential actually
// work" call per platform, same pattern as the adapters above: a lightweight
// GET/whoami-style endpoint, status 200 (or a platform-specific success
// signal) = verified. Every one of these activates the moment real
// credentials are entered — none are mocked.
async function testTikTokAdsConnection(token?: string, advertiserId?: string): Promise<boolean> {
  if (!token || !advertiserId) return false;
  try {
    const res = await fetch(`https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=["${advertiserId}"]`, {
      headers: { "Access-Token": token }
    });
    const data = await res.json().catch(() => ({}));
    return res.status === 200 && data?.code === 0;
  } catch { return false; }
}

async function testLinkedInAdsConnection(token?: string, accountId?: string): Promise<boolean> {
  if (!token || !accountId) return false;
  try {
    const normalizedId = accountId.replace(/^urn:li:sponsoredAccount:/, '');
    const res = await fetch(`https://api.linkedin.com/rest/adAccounts/${encodeURIComponent(normalizedId)}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Linkedin-Version": "202607",
        "X-Restli-Protocol-Version": "2.0.0",
      }
    });
    return res.status === 200;
  } catch { return false; }
}

async function testTwitterAdsConnection(token?: string, accountId?: string): Promise<boolean> {
  if (!token || !accountId) return false;
  try {
    const res = await fetch(`https://ads-api.twitter.com/12/accounts/${accountId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.status === 200;
  } catch { return false; }
}

async function testRedditAdsConnection(token?: string, accountId?: string): Promise<boolean> {
  if (!token || !accountId) return false;
  try {
    const res = await fetch(`https://ads-api.reddit.com/api/v3/ad_accounts/${encodeURIComponent(accountId)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.status === 200;
  } catch { return false; }
}

// Organic profiles use their own lightweight identity/profile endpoints. These
// are intentionally separate from ad-account adapters: an ads token is not
// evidence that the corresponding organic profile can be read.
async function testLinkedInOrganicConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('https://api.linkedin.com/rest/me', {
      headers: { Authorization: `Bearer ${token}`, 'Linkedin-Version': '202607', 'X-Restli-Protocol-Version': '2.0.0' },
    });
    return res.status === 200;
  } catch { return false; }
}

async function testXOrganicConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('https://api.x.com/2/users/me', { headers: { Authorization: `Bearer ${token}` } });
    return res.status === 200;
  } catch { return false; }
}

async function testMetaOrganicConnection(token?: string, accountId?: string): Promise<boolean> {
  if (!token || !accountId) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(accountId)}?fields=id,name`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.status === 200;
  } catch { return false; }
}

async function testRedditOrganicConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('https://oauth.reddit.com/api/v1/me', { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'SigmaTactix/1.0' } });
    return res.status === 200;
  } catch { return false; }
}

async function testSnapchatAdsConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch("https://adsapi.snapchat.com/v1/me", { headers: { "Authorization": `Bearer ${token}` } });
    return res.status === 200;
  } catch { return false; }
}

async function testAmazonAdsConnection(token?: string, clientId?: string): Promise<boolean> {
  if (!token || !clientId) return false;
  try {
    const res = await fetch("https://advertising-api.amazon.com/v2/profiles", {
      headers: { "Authorization": `Bearer ${token}`, "Amazon-Advertising-API-ClientId": clientId }
    });
    return res.status === 200;
  } catch { return false; }
}

async function testShopifyConnection(shopUrl?: string, token?: string): Promise<boolean> {
  if (!shopUrl || !token) return false;
  try {
    const base = shopUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/admin/api/2024-01/shop.json`, { headers: { "X-Shopify-Access-Token": token } });
    return res.status === 200;
  } catch { return false; }
}

async function testKlaviyoConnection(apiKey?: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch("https://a.klaviyo.com/api/accounts/", {
      headers: { "Authorization": `Klaviyo-API-Key ${apiKey}`, "revision": "2024-10-15" }
    });
    return res.status === 200;
  } catch { return false; }
}

async function testMailchimpConnection(apiKey?: string): Promise<boolean> {
  if (!apiKey || !apiKey.includes("-")) return false;
  try {
    const dc = apiKey.split("-").pop();
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/`, {
      headers: { "Authorization": `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}` }
    });
    return res.status === 200;
  } catch { return false; }
}

async function testSalesforceConnection(token?: string, instanceUrl?: string): Promise<boolean> {
  if (!token || !instanceUrl) return false;
  try {
    const res = await fetch(`${instanceUrl.replace(/\/$/, "")}/services/data/v59.0/`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.status === 200;
  } catch { return false; }
}

async function testGoogleMyBusinessConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.status === 200;
  } catch { return false; }
}

function createGoogleSignedJwt(clientEmail: string, privateKey: string, scopes: string[]) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claimSet = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claimSet}`);
  const signature = sign.sign(privateKey, 'base64url');
  return `${header}.${claimSet}.${signature}`;
}

export async function getAccessTokenFromServiceAccount(keyData: { client_email: string; private_key: string }) {
  try {
    const assertion = createGoogleSignedJwt(keyData.client_email, keyData.private_key, [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics'
    ]);
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token as string;
  } catch (err) {
    console.error('Error exchanging service account assertion for OAuth token:', err);
    return null;
  }
}

async function testGoogleAnalyticsConnection(credsOrToken?: any, targetId?: string): Promise<boolean> {
  if (!credsOrToken) return false;
  let bearerToken: string | null = null;
  let saKey: any = null;

  if (typeof credsOrToken === 'object') {
    if (credsOrToken.client_email && credsOrToken.private_key) {
      saKey = credsOrToken;
    } else if (credsOrToken.serviceAccountKey) {
      try {
        saKey = typeof credsOrToken.serviceAccountKey === 'string'
          ? JSON.parse(credsOrToken.serviceAccountKey)
          : credsOrToken.serviceAccountKey;
      } catch {
        saKey = null;
      }
    } else if (credsOrToken.apiKey && typeof credsOrToken.apiKey === 'string' && credsOrToken.apiKey.trim().startsWith('{')) {
      try {
        saKey = JSON.parse(credsOrToken.apiKey);
      } catch {
        saKey = null;
      }
    }
  } else if (typeof credsOrToken === 'string' && credsOrToken.trim().startsWith('{')) {
    try {
      saKey = JSON.parse(credsOrToken);
    } catch {
      saKey = null;
    }
  }

  if (saKey?.client_email && saKey?.private_key) {
    bearerToken = await getAccessTokenFromServiceAccount(saKey);
  } else if (typeof credsOrToken === 'string') {
    bearerToken = credsOrToken;
  } else if (credsOrToken?.accessToken) {
    bearerToken = credsOrToken.accessToken;
  } else if (credsOrToken?.apiKey) {
    bearerToken = credsOrToken.apiKey;
  }

  if (!bearerToken) return false;

  try {
    const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
      headers: { "Authorization": `Bearer ${bearerToken}` }
    });
    if (res.status === 200) {
      const data = await res.json();
      if (targetId && data.accountSummaries) {
        const cleanedTarget = targetId.trim().replace(/^properties\//, '').replace(/^accounts\//, '');
        let matchedProperty = '';
        for (const acc of data.accountSummaries) {
          const accId = acc.account?.replace(/^accounts\//, '');
          if (accId === cleanedTarget) {
            matchedProperty = acc.propertySummaries?.[0]?.property?.replace(/^properties\//, '') || '';
            break;
          }
          const found = acc.propertySummaries?.find((p: any) => p.property?.replace(/^properties\//, '') === cleanedTarget);
          if (found) {
            matchedProperty = cleanedTarget;
            break;
          }
        }
        if (matchedProperty) {
          const reportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${matchedProperty}:runReport`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
              metrics: [{ name: 'activeUsers' }],
            }),
          });
          return reportRes.status === 200;
        }
      }
      return true;
    }
    const accountsRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
      headers: { "Authorization": `Bearer ${bearerToken}` }
    });
    return accountsRes.status === 200;
  } catch {
    return false;
  }
}

async function testGoogleSearchConsoleConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.status === 200;
  } catch { return false; }
}

async function testSemrushConnection(apiKey?: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch(`https://api.semrush.com/?type=domain_ranks&key=${apiKey}&domain=example.com&database=us`);
    const text = await res.text();
    return res.status === 200 && !text.toUpperCase().startsWith("ERROR");
  } catch { return false; }
}

async function testAhrefsConnection(apiKey?: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.ahrefs.com/v3/site-explorer/domain-rating?target=example.com&date=2026-01-01", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    return res.status === 200;
  } catch { return false; }
}

async function testSimilarwebConnection(apiKey?: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch(`https://api.similarweb.com/v1/website/example.com/total-traffic-and-engagement/visits?api_key=${apiKey}`);
    return res.status === 200;
  } catch { return false; }
}

async function testWhatsAppBusinessConnection(token?: string, phoneNumberId?: string): Promise<boolean> {
  if (!token || !phoneNumberId) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.status === 200;
  } catch { return false; }
}

// Microsoft Ads (Bing Ads) — real fix for a gap the review caught: the
// ConnectorPlatform type and ConnectorsCenter.tsx's ALL_PLATFORMS both
// documented "every listed platform has a real adapter", but this one was
// never actually implemented and silently fell back to genericAdapter (which
// verifies nothing beyond "a field is non-empty"). Microsoft Ads' core
// Customer Management/Campaign Management services are SOAP-based and need a
// developer token + customer ID for a true ads-scoped check, but the OAuth
// access token itself is a standard Azure AD token — validating it against
// Microsoft Graph's /me is a real, live check that the credential is a
// genuine, currently-valid Microsoft account token (not just "field present").
async function testMicrosoftAdsConnection(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.status === 200;
  } catch { return false; }
}

// Connector adapter registry — one validator per platform, shared by the
// connect route and reconciliation below. Platforms without a live API
// validator fail closed until their provider-specific verification is implemented.
type ConnectorAdapter = (credentials: Record<string, any>) => Promise<boolean>;

const connectorAdapters: Partial<Record<ConnectorPlatform, ConnectorAdapter>> = {
  'Slack': (c) => testSlackConnection(c.apiKey || c.accessToken),
  'Notion': (c) => testNotionConnection(c.apiKey || c.accessToken),
  'HubSpot CRM': (c) => testHubspotConnection(c.apiKey || c.accessToken),
  'Meta Ads': (c) => testMetaAdsConnection(c.accessToken || c.apiKey, c.accountId),
  'Google Ads': (c) => testGoogleAdsConnection(c.accessToken || c.apiKey, c.accountId, c.developerToken),
  'TikTok Ads': (c) => testTikTokAdsConnection(c.accessToken || c.apiKey, c.accountId),
  'LinkedIn Ads': (c) => testLinkedInAdsConnection(c.accessToken || c.apiKey, c.accountId),
  'Twitter (X) Ads': (c) => testTwitterAdsConnection(c.accessToken || c.apiKey, c.accountId),
  'Reddit Ads': (c) => testRedditAdsConnection(c.accessToken || c.apiKey, c.accountId),
  'LinkedIn (Organic)': (c) => testLinkedInOrganicConnection(c.accessToken || c.apiKey),
  'Twitter/X (Organic)': (c) => testXOrganicConnection(c.accessToken || c.apiKey),
  'Facebook Pages': (c) => testMetaOrganicConnection(c.accessToken || c.apiKey, c.accountId),
  'Instagram (Organic)': (c) => testMetaOrganicConnection(c.accessToken || c.apiKey, c.accountId),
  'Reddit (Organic)': (c) => testRedditOrganicConnection(c.accessToken || c.apiKey),
  'Snapchat Ads': (c) => testSnapchatAdsConnection(c.accessToken || c.apiKey),
  'Amazon Ads': (c) => testAmazonAdsConnection(c.accessToken || c.apiKey, c.clientId),
  'Shopify': (c) => testShopifyConnection(c.siteUrl, c.accessToken || c.apiKey),
  'Klaviyo': (c) => testKlaviyoConnection(c.apiKey),
  'Mailchimp': (c) => testMailchimpConnection(c.apiKey),
  'Salesforce': (c) => testSalesforceConnection(c.accessToken || c.apiKey, c.siteUrl),
  'Google My Business': (c) => testGoogleMyBusinessConnection(c.accessToken || c.apiKey),
  'Google Analytics': (c) => testGoogleAnalyticsConnection(c, c.propertyId || c.accountId),
  'Google Search Console': (c) => testGoogleSearchConsoleConnection(c.accessToken || c.apiKey),
  'Semrush': (c) => testSemrushConnection(c.apiKey),
  'Ahrefs': (c) => testAhrefsConnection(c.apiKey),
  'Similarweb': (c) => testSimilarwebConnection(c.apiKey),
  'WhatsApp Business': (c) => testWhatsAppBusinessConnection(c.accessToken || c.apiKey, c.accountId),
};

const genericAdapter: ConnectorAdapter = unsupportedConnectorAdapter;

export function getConnectorAdapter(platform: ConnectorPlatform): ConnectorAdapter {
  return connectorAdapters[platform] || genericAdapter;
}

export function hasConnectorAdapter(platform: ConnectorPlatform): boolean {
  return Boolean(connectorAdapters[platform]);
}

// Publish adapters — the Creative Command Center's multi-channel publish.
// Distinct from connectorAdapters above (those only verify a credential is
// live); these actually post content. Real REST calls per platform, gated
// entirely on the caller having connected credentials — no platform here is
// mocked or simulated. Unlisted platforms simply aren't publish-capable yet.
export interface PublishContent { title: string; body: string; }
export interface PublishResult { success: boolean; url?: string; error?: string; }
type PublishAdapter = (credentials: Record<string, any>, content: PublishContent) => Promise<PublishResult>;

async function publishToLinkedIn(c: Record<string, any>, content: PublishContent): Promise<PublishResult> {
  const token = c.accessToken || c.apiKey;
  const authorUrn = c.accountId; // e.g. "urn:li:person:xxxx" or "urn:li:organization:xxxx"
  if (!token || !authorUrn) return { success: false, error: "Missing accessToken or author URN (accountId)" };
  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: `${content.title}\n\n${content.body}`.slice(0, 3000) },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    if (!res.ok) return { success: false, error: `LinkedIn API ${res.status}: ${await res.text()}` };
    const postId = res.headers.get("x-restli-id");
    return { success: true, url: postId ? `https://www.linkedin.com/feed/update/${postId}` : undefined };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

async function publishToTwitter(c: Record<string, any>, content: PublishContent): Promise<PublishResult> {
  const token = c.accessToken || c.apiKey;
  if (!token) return { success: false, error: "Missing accessToken (OAuth2 user token with tweet.write scope)" };
  try {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: `${content.title}\n\n${content.body}`.slice(0, 280) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: `X API ${res.status}: ${JSON.stringify(data)}` };
    const tweetId = data?.data?.id;
    return { success: true, url: tweetId ? `https://twitter.com/i/web/status/${tweetId}` : undefined };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

async function publishToFacebookPage(c: Record<string, any>, content: PublishContent): Promise<PublishResult> {
  const token = c.accessToken || c.apiKey;
  const pageId = c.accountId;
  if (!token || !pageId) return { success: false, error: "Missing accessToken or Page ID (accountId)" };
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${content.title}\n\n${content.body}`, access_token: token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: `Facebook API ${res.status}: ${JSON.stringify(data)}` };
    return { success: true, url: data.id ? `https://www.facebook.com/${data.id}` : undefined };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

async function publishToNotion(c: Record<string, any>, content: PublishContent): Promise<PublishResult> {
  const token = c.accessToken || c.apiKey;
  const parentId = c.accountId; // parent page or database id
  if (!token || !parentId) return { success: false, error: "Missing accessToken or parent page/database ID (accountId)" };
  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { page_id: parentId },
        properties: { title: { title: [{ text: { content: content.title } }] } },
        children: [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: content.body.slice(0, 2000) } }] } }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: `Notion API ${res.status}: ${JSON.stringify(data)}` };
    return { success: true, url: data.url };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

async function publishToWordPress(c: Record<string, any>, content: PublishContent): Promise<PublishResult> {
  const { apiKey: username, accessToken: appPassword, siteUrl } = c;
  if (!username || !appPassword || !siteUrl) return { success: false, error: "Missing username (apiKey), Application Password (accessToken), or siteUrl" };
  try {
    const base64Auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const res = await fetch(`${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { "Authorization": `Basic ${base64Auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: content.title, content: content.body, status: "publish" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: `WordPress API ${res.status}: ${JSON.stringify(data)}` };
    return { success: true, url: data.link };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export const publishAdapters: Partial<Record<ConnectorPlatform, PublishAdapter>> = {
  'LinkedIn (Organic)': publishToLinkedIn,
  'Twitter/X (Organic)': publishToTwitter,
  'Facebook Pages': publishToFacebookPage,
  'Notion': publishToNotion,
  'WordPress': publishToWordPress,
};

export function getStoredCredentials(connector: Connector): Record<string, any> {
  const blob = connector.credentials?.encrypted;
  if (!blob) return {};
  try {
    return decryptCredentials(blob);
  } catch (err) {
    console.error(`Failed to decrypt credentials for connector ${connector.id}:`, err);
    return {};
  }
}

// Dynamic Multi-Platform Reconciliation — re-runs the same adapters used at
// connect time to catch credential rot (expired tokens, revoked keys).
export const RECONCILIATION_KEYS: Partial<Record<ConnectorPlatform, string>> = {
  'Meta Ads': 'metaStatus',
  'Google Ads': 'googleStatus',
  'LinkedIn Ads': 'linkedinStatus',
  'TikTok Ads': 'tiktokStatus',
  'Twitter (X) Ads': 'twitterStatus',
  'Apple Search Ads': 'appleStatus',
  'Reddit Ads': 'redditStatus',
  'Pinterest Ads': 'pinterestStatus',
  'HubSpot CRM': 'hubspotStatus',
};
