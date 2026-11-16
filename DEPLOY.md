# DEPLOY — SigmaTactix Growth OS (Node backend)

A deployed SPA needs a running Node process behind it: the Express API in
`server.ts` (built to `dist/server.js`) serves the built client **and** every
`requireAuth` route (`/api/workspace/*`, GSC OAuth, creative gateway,
billing/webhooks). Today only the static bundle is hosted on Hostinger, so
those routes are dead in production. This runbook makes the backend
deployable.

## 1. Build

```bash
npm ci
npm run build      # Vite -> dist/ (client assets) + esbuild -> dist/server.js
npm run lint && npm test   # project gate: `npm run verify` runs both
```

Do not ship a branch that hasn't passed `verify`.

## 2. Runtime options

### A. Docker (recommended for VPS / container hosts)

```bash
docker build -t sigmatactix .
docker run -d -p 3000:3000 --env-file .env -e TRUST_PROXY=1 sigmatactix
```

- The image runs `node dist/server.js` as a **non-root** user on Node 22.
- The built SPA is served automatically from `dist/` (the static block in
  `server.ts` only activates when `dist/index.html` exists — so one image
  serves the frontend and the API).
- `public/` brand/evidence assets are baked into `dist/` at build time.
- Optional features that need a runtime present *outside* the image:
  - **Playwright/Chromium** (audit screenshots, landing-artifact previews) —
    the alpine image skips the browser download; switch `FROM` to
    `node:22` (Debian) to get it.
  - **Lecture Deck engine** — spawns `python3` (included in the image).
  - **Supabase DB / PostgREST** — remote; nothing to install in the image.

### B. Plain Node host (Railway, Render, Hostinger VPS)

```bash
npm ci && npm run build
NODE_ENV=production PORT=3000 node dist/server.js
```

- **Set `NODE_ENV=production`** — without it the server runs the Vite dev
  middleware instead of the static `dist/` block.
- Put `backend/agent-skills/` and `tools/` next to `dist/` (the server reads
  them from disk relative to its location / cwd).
- Reverse proxy (nginx/Caddy/TLS) → set `TRUST_PROXY=1` so rate-limit and
  session handling see the real client IP.
- Hosts: Railway/Render run `npm run build` then `node dist/server.js`
  (Render: root command `node dist/server.js`, build command `npm ci && npm run build`).

## 3. Required env vars (boot-critical + billing + GSC)

Canonical list lives in `.env.example`. Minimum to boot **and** make the
features that matter:

| Var | Why |
|-----|-----|
| `SUPABASE_URL` | Supabase project URL (Settings → API). Server reads at request time; throws if unset. |
| `SUPABASE_ANON_KEY` | Used with the caller's JWT for RLS-scoped reads. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Stripe webhook billing updates. Never in the client bundle or standard API routes. |
| `STRIPE_SECRET_KEY` | Billing/pricing routes. |
| `STRIPE_WEBHOOK_SECRET` | Webhook HMAC verification. |
| `APP_URL` | **Public origin** the app is served from (e.g. `https://app.example.com`). |
| `APP_ORIGIN` | Fallback for `APP_URL` (server reads `APP_URL \|\| APP_ORIGIN \|\| PUBLIC_APP_URL`). |
| `PORT` | Listen port (default 3000). Set to your host's expected port. |
| `TRUST_PROXY` | `1` when behind a reverse proxy. |

All AI/LLM provider keys (`GEMINI_API_KEY`, `OPUSMAX_API_KEY`, …) are
optional — the server warns and disables that feature when absent.

## 4. GSC OAuth: `APP_URL` byte-match (critical)

The server mints the GSC OAuth redirect URI from the **first** of
`APP_URL` / `APP_ORIGIN` / `PUBLIC_APP_URL` that is set, then falls back to
the request origin in dev. Whichever value wins **must be whitelisted
verbatim** in Google Cloud (OAuth 2.0 client → Authorized redirect URIs):

```
${APP_URL}/api/gsc/callback
```

Byte-for-byte: **scheme + host + port** must match exactly. `http` vs
`https`, a trailing slash, or a wrong port all produce a
`redirect_uri_mismatch` (Error 400) and a broken Connect dialog. When the
public origin is served over HTTPS, set `APP_URL=https://your-domain` (no
trailing slash) and add `https://your-domain/api/gsc/callback` to the GCP
client. Debug any mismatch via `GET /api/gsc/diagnostics`.

## 5. Health-check verification

After the process is up:

```bash
# Liveness — must be 200 { "ok": true, "uptimeSeconds": N }
curl -fsS http://localhost:3000/healthz

# Unauthenticated API access — must be 401 (requireAuth guard)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/workspace
# expect: 401

# Static SPA fallback (production static block active)
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/
# expect: 200 text/html
```

- `/healthz` is **dependency-free**: it answers "is the process alive", not
  "is Supabase up". Do not couple it to the DB (a transient DB outage must
  not make the supervisor restart a healthy process).
- A `401` from `/api/workspace` confirms the auth middleware is wired; a
  `500` there usually means `SUPABASE_URL`/`SUPABASE_ANON_KEY` are missing.
- For an HTTPS host, point these at `https://your-domain/...` and add
  `TRUST_PROXY=1`.

## 6. Stripe webhook

Point the Stripe endpoint to `${APP_URL}/api/webhooks/stripe` (or the
gateway's public URL). The handler verifies the signature with
`STRIPE_WEBHOOK_SECRET` and applies billing state via the
service-role-only `apply_stripe_webhook_update` RPC.

---

**Security invariants (do not regress):** `SUPABASE_SERVICE_ROLE_KEY` is
server-side only — never in frontend code or standard API routes. Tenant
isolation is enforced by Postgres RLS on the caller's JWT; the service-role
key is used solely for the signature-verified Stripe webhook path.
