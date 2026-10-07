# Hostinger and Novamira Publishing Integration Plan

**Status:** proposed; no hosting or publishing credentials are stored or exercised by this plan.

## Decision

Use each product at its strongest seam:

| Concern | System of record | Allowed responsibility |
| --- | --- | --- |
| Public website, SEO pages, legal pages and designed landing pages | WordPress + Novamira at `www.sigmatactix.com` | Draft and publish reviewed content through WordPress |
| Growth OS, provider OAuth callbacks and connector webhooks | A separately deployed Node runtime at `app.sigmatactix.com` | Authenticate providers, store encrypted credentials, govern agent work and record receipts |
| DNS, subdomains, deployment archives, redirects and hosting controls | Hostinger | Provision and deploy only after approval |
| Landing-page strategy, copy, evidence and approval packet | Growth OS | Generate drafts and evidence; never publish directly |

This avoids making a WordPress visual editor responsible for secret-bearing OAuth callbacks, and avoids using hosting automation as a CMS.

## Required hosting topology

```text
www.sigmatactix.com                 WordPress + Novamira
  └── approved public pages         legal, SEO and branded landing pages

app.sigmatactix.com                 Growth OS Node runtime
  ├── /api/oauth/{provider}/callback
  ├── /api/webhooks/{provider}
  └── governed connector and ledger endpoints

Hostinger API                       server-side deployment adapter only
```

`app.sigmatactix.com` must terminate HTTPS and run the server process continuously. Do not point OAuth callbacks at a local development server, an unverified temporary subdomain, or a WordPress page.

## Publishing module interface

The implementation should introduce one deep **Website Publishing module**. Its interface is intentionally limited to:

1. `stageDraft`: create a non-public landing-page draft plus source/evidence record.
2. `requestApproval`: queue a human review with the target hostname and rollback reference.
3. `publishApproved`: publish only an approved draft and return a durable provider receipt.
4. `rollback`: restore the recorded WordPress revision or Hostinger deployment reference.
5. `verifyLivePage`: check the public URL, canonical URL, HTTP status and page artifact hash.

Hostinger and WordPress/Novamira are two adapters behind that interface. A planned landing page must remain a draft until HITL approval has been recorded.

## Adapter work order

### 1. Hostinger adapter

- Read-only inventory first: website type, hosting account, subdomain availability, SSL, deployment capability and redirects.
- Store the Hostinger token only in server-side encrypted credentials; never in a browser form, generated page, or credentials sheet.
- Support preview deployment to a dedicated preview host before production.
- Capture deployment ID, target domain, timestamp, artifact hash, actor and rollback reference in the execution ledger.
- Never call Hostinger's destructive website replacement endpoint as part of routine publishing.

### 2. WordPress / Novamira adapter

- Use WordPress as the publishing authority. Novamira is confirmed as installed in the current website admin UI, but no verified programmatic Novamira contract has been established.
- Start with the WordPress REST API using a dedicated least-privilege publishing identity and application password stored server-side.
- Create content as a draft; return the WordPress post/page ID and preview URL.
- Treat any Novamira-specific generation action as unsupported until its plugin interface and preview/rollback behaviour are verified.
- Publish only after the Growth OS approval and final reviewer acknowledgement.

## Landing-page selection rule

Use **Novamira / WordPress** for primary brand pages and SEO landing pages that need visual editing, reusable sections and editorial review. Use the **Hostinger deployment adapter** for isolated, static campaign variants only when a preview has passed review and the site can be restored from a deployment receipt.

## Prerequisites before implementation can become live

1. Confirm that the Hostinger plan supports a persistent Node runtime for `app.sigmatactix.com`, or nominate an alternative production runtime.
2. Create the `app.sigmatactix.com` subdomain and provision HTTPS.
3. Set the exact OAuth redirect URLs in Google, LinkedIn and Meta after the deployed callback host is known.
4. Provide a dedicated WordPress publishing user and server-side secret location; do not place its application password in chat.
5. Verify whether Novamira exposes a supported automation interface. If it does not, WordPress draft publishing remains the first adapter.
6. Replace every placeholder and validate every operational claim on the public data-deletion policy before submitting it to Meta.
