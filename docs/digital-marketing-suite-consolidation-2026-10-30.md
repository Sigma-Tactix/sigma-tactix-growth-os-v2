# Digital Marketing Suite — Consolidation & Production Fixes — 2026-10-30

> Scope: (1) map global digital-marketing departments against our suite and
> consolidate the 14 working modules into concise spaces; (2) diagnose and fix
> the features reported as not working (VANTA, 2D/3D brain map, Ecosystem
> Status, Agent Reach / Doctor, API-key updates). No new dependency added.
> Gate: `npm run verify` (build + typecheck + tests).

---

## 1. Global marketing departments vs our suite (before)

Standard marketing functions seen across in-house teams, agencies and
marketing platforms, grouped the way most org charts and SaaS competitors
present them:

| # | Function / Department | Core? | What it covers |
|---|---|---|---|
| 1 | Paid media / performance marketing | Core | Search/PPC, paid social, retargeting, programmatic, paid ABM, ROAS management |
| 2 | SEO & content marketing | Core | Technical SEO, editorial content, CRO, plus (in 2025+) AEO/GEO answer-engine optimization |
| 3 | Social media (organic + commerce + community) | Core | Scheduling, carousels/UGC, community, influencers |
| 4 | Email & lifecycle / CRM | Core | Newsletters, segmentation, automation, retention |
| 5 | Creative & media production | Core | Copywriting, graphic/image, video/motion, design |
| 6 | Marketing analytics & attribution | Core | BI, blended CAC/ROAS, experimentation, data plumbing |
| 7 | Conversion rate optimization / web | Core | Landing pages, funnels, A/B testing |
| 8 | Demand gen & outbound (SDR, ABM) | Core | Prospecting, cold email, lead qualification |
| 9 | Public relations, brand & comms | Specialist | PR, brand house, events, partnerships |
| 10 | Research & audience intelligence | Specialist | Market research, competitor intel, social listening, customer insight |
| 11 | Marketing operations (MarTech) | Specialist | Integrations, tooling governance, reporting ops |
| 12 | Growth product / onboarding | Specialist | Product-led growth, activation, in-app |
| 13 | Local / regional & multilingual, events | Specialist | Geo marketing, campaigns, webinars |

**Before:** the Digital Marketing Suite nav had **14 flat items** —
SEO & AEO, Performance Ads, Editorial Content, Social & Carousels, Image
Studio, Video Studio, Email & Lifecycle, CRO, Inbound/WhatsApp, Cold
Outreach & ABM, Social Listening, Competitor Intel, Market Simulator,
Attribution. Every item a separate sidebar entry; the three creative
generators and the two social surfaces were scattered, which is the inverse
of how the industry groups them ("one creative room", "one social room").

## 2. Consolidated structure (after) — 7 spaces, each mirroring a department

New source of truth: `src/data/suiteHubConfig.ts` (tested by
`suiteHubConfig.test.ts`). One shared surface `src/pages/SuiteHubPage.tsx`
mounts each group as tabs, reusing the existing module pages untouched;
`?tab=<moduleId>` keeps tabs deep-linkable. All 14 old routes stay live for
bookmarks and generated reports.

| Suite space (route) | Global department | Consolidated modules (old route) |
|---|---|---|
| **Creative Studio** `/suite/creative` | Content & Creative Production | Editorial Content Engine (`/content`), Image Studio (`/image-studio`), Video & Motion Studio (`/video-studio`) |
| **Social Publishing Hub** `/suite/social` | Social Media & Community | Social Publishing & Carousels (`/social-carousels`), Social Listening & Radar (`/social-listening`) |
| **Search & Conversion** `/suite/search` | SEO, AEO & CRO | SEO & AEO Authority (`/seo-aeo`), CRO & Landing Pages (`/cro-studio`) |
| **Demand Engine** `/suite/demand` | Demand Generation & Outbound | Inbound Leads & WhatsApp (`/intake`), Cold Outreach & ABM (`/outreach`) |
| **Paid & Retention** `/suite/paid` | Paid Media & Lifecycle / CRM | Performance Ads & ROAS (`/paid-ads`), Email & Lifecycle (`/email-marketing`) |
| **Market Intelligence** `/suite/intelligence` | Research & Competitive Intelligence | Competitor Intelligence (`/competitors`), Market Simulator (`/market-simulator`) |
| **Measurement** `/suite/attribution` | Marketing Analytics & Attribution | Attribution & Blended CAC (`/attribution`) |

Sidebar "Digital Marketing Suite" now has 7 items instead of 14. `Layout.tsx`
`isDigitalMarketingRoute` was also fixed to include `/suite/*` plus
`/competitors` and `/market-simulator`, which had silently lost the
`sigma-marketing-suite` themed container.

**Coverage gaps vs the global map (intentionally not added this pass):**
PR/brand comms, marketing ops, product-led growth, local/events are absent.
They are the natural next modules; each maps to a new hub member, not new
infrastructure, because the vault + agent + HITL seams already exist.

## 3. Reported-broken features — root causes & fixes applied

| Symptom | Root cause (evidence) | Fix applied | Follow-up (not this pass) |
|---|---|---|---|
| **VANTA "not working"** | Intentionally gated: `VITE_VANTA_ENABLED` default `false` (`.env.example` L141, `isVantaReleaseEnabled` in `src/lib/vantaFeatureFlag.ts`). When off, the sidebar item **disappeared entirely**, so the feature read as missing/broken. Held until migration `0015_vanta_conversations.sql` + provider verification pass (audit F-003). | Sidebar "Living System" now **always visible** with a `Gated` badge; the `/living-system` held-page now lists the 4 concrete enablement steps (migration, key, flag, `?vantaLab=1` dev preview). | Enable on real env: apply 0015, verify provider, set flag `true`. |
| **2D/3D map of the Second Brain + file relations "not working"** | The map (`MapsBrainOrbit`, `SecondBrainOrbit3D`) lives **on the VANTA-gated `/living-system` surface** and reads `getLivingSystemGraph()` (fixed registry of 10 vaults + 10 files + agents + connectors — data is real, not empty). It was invisible for the same reason: the gate removed the nav item and the route fell through to the held page. | Same fix as VANTA — surface is now discoverable; the map renders once the gate is lifted. The `?vantaLab=1` fidelity preview is now **dev-guarded** (`import.meta.env.DEV` in `VantaRoute`), so in a production build the release flag is the only way in — matching the held-page copy. | Promote to release when VANTA acceptance checks pass. |
| **Ecosystem Status "not working"** | `EcosystemStatusBar.tsx:105` — `sections` populated **only in demo-seed mode** (`VITE_SEED_DEMO_WORKSPACE`); in a real workspace it was `[]`, so the panel rendered an empty box with only "No runtime health checks recorded" — read as dead. `Ping all` explicitly refused to fake data ("No health-check endpoint is connected"). | Panel now shows an **honest, navigable inventory**: "No live health checks connected yet" + the 8 configured subsystems, each marked **Unverified** (never "OPERATIONAL" without evidence), each deep-linking to its surface. | Wire a real `/api/workspace/health` check endpoint; replace Unverified with measured states. |
| **Agent Reach "not working"** | The 15-channel router shells out to the external **`agent-reach` CLI on the API server** (`src/server/agentReachService.ts` `execFileAsync`). Not installed on this machine (absent from PATH and the probed dirs). Doctor path **already degrades gracefully** (all channels `error`, `cliAvailable: false`), but the service hard-coded another user's home dir `/Users/mac/.local/bin` and the UI showed a wall of 15 offline rows that read as a bug. | Honest banner when the CLI is unavailable: "runtime not installed — the N channels below correctly report offline, nothing is misfiring". The foreign `/Users/mac` probes were removed from the service (`agentReachCliPaths()` now derives the home-dir probe from `process.env.HOME`); `cliVersion` is now read from the CLI's doctor output instead of a hard-coded `1.5.0` (UI shows "DETECTED" when absent). | Install the CLI on the host for live channels; consider a `npm run setup:agent-reach` helper. |
| **Doctor (agent-reach diagnostics)** | Same root cause as Agent Reach — doctor output only ever produced all-offline results because the CLI was absent; nothing broken in the doctor code itself. | Covered by the Agent Reach banner (the doctor panel's "RUNTIME UNAVAILABLE" state is now contextually explained). | Re-run doctor after CLI install to populate ready/warn/offline counts. |
| **Changing/updating API keys "not working"** | Save path was already repaired (`4d69d6d`) and is correct end-to-end (UI → `POST /admin/ai-keys` → AES-256-GCM → Supabase `workspace_state` → agent runs). Two real defects made it *feel* broken: (a) the client provider catalog in `Tenants.tsx` listed **9 of the server's 14** providers, so saving `lmstudio`/`ollama`/`omniroute`/`opencode`/`openrouter` and refreshing **silently dropped the entry** ("my update didn't stick"); (b) a transient keys-fetch failure re-merged with `[]` and wiped the whole on-screen provider list. | Catalog extracted to `src/data/aiProviderCatalog.ts` (all 14, server-mirrored); **regression test `aiProviderCatalog.test.ts` parses `server.ts` and fails on any client/server drift**; `loadData` now keeps the previous list when the fetch fails (null-safe). | Surface the 409 workspace-version-conflict message explicitly in the save toast (currently the global handler returns 409 with the message; the tab shows it via `err.message` — verify on multi-user env). |

## 4. Other production-readiness improvements applied in this pass

- **Theme container bug:** `/competitors` and `/market-simulator` were missing from `isDigitalMarketingRoute`, so those suite pages lost the `sigma-marketing-suite` themed container (dark/light token discipline, AGENTS.md §3.6). Fixed.
- **No invented metrics** (AGENTS.md §3.5): the Ecosystem inventory and Agent Reach banner deliberately state "Unverified / no readiness claims" instead of fabricating OPERATIONAL states.
- **Test surface:** `suiteHubConfig.test.ts` (14 modules → 6 hubs + measurement; every href a live route) and `aiProviderCatalog.test.ts` (client/server parity + no duplicate ids) lock both consolidations against drift.

## 5. Verification

Per AGENTS.md §4: `npm run verify` (build + typecheck + full test suite) is
the single gate before merge. Run on this branch; results recorded in
MASTER_CONTEXT.

## 6. Suggested next steps (ranked)

1. **Enable VANTA on a real environment** — apply migration 0015, configure a
   verified provider key, set `VITE_VANTA_ENABLED="true"`. This single step
   makes both the neural core and the 2D/3D system map live (they share the
   surface). Acceptance criteria: audit item F-003.
2. **Wire Ecosystem Status to a real health endpoint** — replace the
   Unverified inventory with measured `OPERATIONAL/WARNING/OFFLINE` states
   (audit F-008 staging/prod monitoring is the parent gap).
3. **Install the Agent Reach CLI** on the host for live 15-channel doctor
   results (audit F-001 live-connector honesty: keep the "demo vs live" badge
   visible until verified).
4. **Next suite modules from the global map** — PR/brand comms, marketing
   ops, product-led growth; each slots into the hub pattern as a new member.
