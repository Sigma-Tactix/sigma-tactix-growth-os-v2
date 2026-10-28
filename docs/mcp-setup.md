# Growth OS MCP setup

Status: locally implemented. Provider access, database migration and public deployment are separate gates.

## Scope

Nazim selected both directions, starting with VANTA connections. This pilot is restricted to the authenticated, confirmed account `sigmatactix@gmail.com` with an owner/admin role on inbound requests. The outbound credential identity must also resolve to that Google email.

The configured Supabase project was read-only inspected on 2026-10-27:

| Item | Verified value |
| --- | --- |
| Project | `Sigmatactix-Growth-OS` (`rqktjogegbdlsdvpusie`) |
| Workspace | `My Workspace` |
| Workspace UUID | `9a1fadcf-9c68-4b89-a51f-4a8ba3b5f148` |
| Account | `sigmatactix@gmail.com`, confirmed email, workspace owner |
| Receipt table | Not deployed at inspection |
| Local Google Ads developer token / ADC file | Not configured at inspection |

No Google Ads customer ID has been verified or allowed. No remote database changes were made by this setup.

## Outbound: VANTA to Google Ads

`@mcp-use/client@2.4.5` replaces the custom Google Ads JSON-RPC transport. The existing orchestrator remains authoritative. Only the `channel-mix-analyst`, `spend-efficiency-scorer` and `kpi-tracker` specialists receive the `read_google_ads_mcp` grant. VANTA can propose a governed Marketing Agent mission and read recent receipt evidence; its chat does not receive an unrestricted executor.

The gateway supports only account discovery, resource metadata and reporting. Reporting requires an explicit customer allowlist, valid identifiers and a maximum of 100 rows. Tool annotations supplement the local allowlist; annotations alone grant nothing. Do not add mutation tools to this pilot.

Before contacting the Ads runtime, the gateway writes a `started` receipt. It then verifies the explicit user ADC file's Google identity and Ads scope. Google must identify that credential as `sigmatactix@gmail.com`; service-account/external-account credentials and identity-less OAuth proxy paths are unsupported for this pilot. The same ADC file is passed to the stdio runtime. The child receives only selected Google/runtime environment variables, never the complete application environment. SDK telemetry is disabled.

Results and terminal status are stored under the same receipt UUID. A finalization failure reports uncertain execution, with no automatic retry. Receipts are application records under RLS, not cryptographic proof from Google. Caller-readable receipt records are never authorization grants. A `started` receipt after a process crash indicates an unresolved outcome.

Local `.env` now contains the verified workspace binding, enabled inbound flag and disabled telemetry. `.env.example` documents the remaining server-only settings. Neither contains invented credentials or customer IDs.

Setup sequence:

1. Review `backend/database/migrations/0020_mcp_tool_calls.sql`. Select the intended database before applying it. This is the currently configured live project; a separate staging project was not found in the connected project list.
2. Apply the receipt migration on the approved target and verify RLS with separate workspace users. Do not call local protocol tests a database isolation test.
3. Install the existing pinned Google runtime with `npm run setup:google-ads-mcp`. Configure a Google Ads developer token, Google Cloud project and a server-side authorized-user ADC file outside the repository, obtained while authorizing `sigmatactix@gmail.com`. The grant must include Ads and email identity scopes. Do not paste tokens or credential JSON into chat.
4. Restart the Node backend. Sign in as that account. Open Skills & MCP, select the MCP tab, and use **Check configuration and receipts**, then **Discover accounts with receipt**.
5. Review the discovery receipt and choose actual account IDs from its output. Set `MCP_GOOGLE_ADS_CUSTOMER_IDS` to those IDs, comma-separated without hyphens. Discovery alone does not allow reporting against every accessible account.
6. Request resource metadata before selecting fields for a report. Run a governed Marketing Agent mission and inspect its execution logs and MCP receipt. Restart and reopen the UI to verify persistence.

The base API is `/api/workspace/mcp`. `/status` reports configuration, `/receipts` reads persisted receipts and `POST /google-ads/read` performs a strict, read-only operation. Request bodies do not accept workspace, actor or arbitrary server settings. All routes inherit the app's authenticated workspace middleware. Legacy Google Ads account discovery now uses the same receipt gateway, closing that alternate unaudited path.

## Inbound: external assistants to Growth OS

`POST /api/workspace/mcp` is a stateless Streamable HTTP MCP endpoint, implemented with the official `@modelcontextprotocol/server@2.3.1` SDK used by the mcp-use ecosystem. This avoids installing a second application server framework into Express. Fresh server instances are bound to the authenticated workspace on every request.

Only these tools are registered:

| Tool | Output |
| --- | --- |
| `get_capability_status` | Declared capability states; catalogue entries do not become verified automatically |
| `list_recent_runs` | Bounded execution lifecycle summaries, not artifact bodies |
| `list_mcp_receipts` | Bounded receipt lifecycle summaries, not raw provider results |

There are no execution, publishing, approval, filesystem or generic SQL tools. All input schemas reject unexpected fields, including workspace override arguments. Calls require a valid Supabase bearer token for `sigmatactix@gmail.com` and an owner/admin role. Tokens must be obtained through the existing login and handled by the connecting client; none are generated or written into documentation.

External clients must support authenticated Streamable HTTP with a custom Bearer header. OAuth discovery, dynamic client registration and automatic token refresh for external assistants are not implemented, so this is not yet a one-click ChatGPT/Claude connector. Browser origins must be explicitly listed in `GROWTH_OS_MCP_ALLOWED_ORIGINS`; native clients can omit Origin. Set `GROWTH_OS_MCP_ENABLED=false` to disable inbound protocol access.

The public frontend deployment recorded in `MASTER_CONTEXT.md` does not prove a running Express backend. Public MCP access requires a separately verified Node deployment, HTTPS routing and real authenticated requests. This setup did not publish the endpoint or expose a tunnel.

## Verification

Node must be at least `22.22.2` for the pinned mcp-use client. The local Node was `22.23.2`.

Completed on 2026-10-27: TypeScript validation passed, 54 focused tests passed across seven files, and the production build passed. A temporary process running the built Express server returned HTTP 200 for `/healthz` and HTTP 401 without authentication for the inbound MCP endpoint, its status endpoint and the legacy Google Ads status endpoint. The temporary process was stopped afterward. Existing frontend build warnings remain for chunk size, browser externalization of `crypto` and a CSS property.

Guardian follow-up: the response adapter now parses the SDK's JSON response and uses Express `res.json()` with `nosniff` and `no-store`; it rejects non-JSON bodies and preserves empty acknowledgments. All three endpoint tests passed after this change, including an HTML-payload regression. The production build noted above predates this follow-up.

Run:

```sh
npm run lint
npx vitest run src/server/mcp/googleAdsGateway.test.ts src/server/routes/mcpRoutes.test.ts src/server/googleAdsMcpService.test.ts src/lib/agentRegistry.test.ts src/lib/agentPipeline.test.ts src/lib/aiProvider.test.ts src/lib/missionExecution.test.ts --exclude '**/worktrees/**' --testTimeout 20000
npm run build
```

The HTTP tests need permission to listen on loopback. Protocol tests use real mcp-use clients, a fixture stdio server and authenticated local HTTP contexts. They prove local protocol behavior and request scoping; they do not exercise Supabase's deployed JWT verification/RLS or live Google Ads credentials.

## Sources

- [mcp-use packages](https://github.com/mcp-use/mcp-use#ecosystem)
- [mcp-use client documentation](https://docs.mcp-use.com/v2/typescript/client/index)
- [Google Ads MCP search implementation](https://github.com/googleads/google-ads-mcp/blob/main/ads_mcp/tools/search.py)
- [Google Ads MCP credential handling](https://github.com/googleads/google-ads-mcp/blob/main/ads_mcp/utils.py)
