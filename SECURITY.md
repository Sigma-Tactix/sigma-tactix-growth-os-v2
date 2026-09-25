<![CDATA[# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.1.x (current) | ✅ Active |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security issue, please report it responsibly:

1. **Email**: [security@sigmatactix.com](mailto:security@sigmatactix.com)
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)
3. **Response time**: We aim to acknowledge within 48 hours and provide a fix timeline within 7 days

---

## Security Architecture

### Authentication & Authorization
- **AuthGate** (`src/components/AuthGate.tsx`) enforces browser session for all protected routes
- **Row-Level Security** on 100% of Supabase tables, audited via `verify.sql`
- **Vault RBAC** prevents agents from accessing Executive and Credentials vaults

### Data Protection
- **AES-256-GCM** encryption for stored credentials (`src/lib/credentialCrypto.ts`)
- **Helmet** HTTP security headers (HSTS, X-Content-Type-Options, Referrer-Policy)
- **SSRF Protection** blocks loopback, link-local, and RFC1918 IPs (`assertPublicHost`)

### API Security
- **Zod validation** on all request body and query parameters
- **2-tier rate limiting** — general API + expensive LLM/scraper routes
- **Stripe HMAC-SHA256** webhook signature verification

### Secrets Management
- `.gitignore` blocks `.env*`, `.pem`, `.key`, `.cert`, `credentials.json`, `service-account*.json`
- `SUPABASE_SERVICE_ROLE_KEY` restricted to `server.ts` (never exposed to client bundle)
- `CONNECTOR_CREDENTIALS_KEY` provides symmetric encryption for vault secrets

---

## Known Security Considerations

1. **CSP relaxed in development** — Content Security Policy is disabled in dev mode for Vite HMR compatibility. CSP is enforced in production.
2. **Monolithic server** — `server.ts` handles multiple responsibilities. Route decomposition is planned for v0.3.0 to improve isolation.
3. **Anti-bot countermeasures** — Headless scrapers may be challenged by YouTube BotGuard or Cloudflare. The system uses oEmbed and Jina Reader fallbacks.

---

_Copyright © 2026 SigmaTactix. All rights reserved._
]]>
