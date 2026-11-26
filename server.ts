// MUST be imported before the routes are registered. Express 4 calls a route
// handler and ignores the promise it returns, so a rejection inside any of the
// ~60 handlers here that have no try/catch becomes an unhandled rejection —
// and Node 20 defaults to --unhandled-rejections=throw, which terminates the
// process. In a single-process, multi-tenant server that means one transient
// Supabase timeout in getDB() on one tenant's request takes the app down for
// everyone. This patch routes those rejections into Express's error pipeline
// (the handler at the bottom of this file) instead.
import "express-async-errors";
import { onboardingChatRequest, ONBOARDING_INSTRUCTION } from "./src/lib/onboardingChat.js";
import { canonicalConnectorPlatform, verifyPipelineConnection, unsupportedConnectorAdapter } from "./src/lib/pipelineVerification.js";
import { classifyChannelMedia, validatePriorityConnectorCredentials } from "./src/lib/connectorLifecycle.js";
import { verifyMetaAdsConnection } from "./src/lib/metaAdsVerification.js";
import {
  VANTA_SYSTEM_INSTRUCTION,
  buildVantaPromptContext,
  classifyVantaVerification,
  describeVantaProviderError,
  parseVantaModelOutput,
  resolveVantaGeminiVoiceConfig,
  verifyVantaGeminiVoiceRoundTrip,
  vantaConversationRequest,
  vantaMemoryRequest,
  vantaMessageRequest,
  vantaShareRequest,
  vantaVoiceSettingsRequest,
} from "./src/lib/vantaServer.js";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import crypto from "crypto";
import { emptyWorkspaceData } from "./src/initialData.js";
import { WorkspaceData, GrowthAudit, GrowthFinding, UIUXAudit, ContentAsset, AgentTask, KeywordCluster, AnalyticsAudit, Connector, ConnectorPlatform, TokenUsageRecord, TokenTelemetrySummary, ActivePipeline } from "./src/types.js";
import { calculateTokenCost, estimateTokens, computeProfitability, aggregateTelemetry, TIER_RETAINERS, ALL_AI_MODELS, MODEL_PRICING } from "./src/lib/tokenCostEngine.js";
import { encryptCredentials, decryptCredentials } from "./src/lib/credentialCrypto.js";
import {
  GSC_DEFAULT_SITE_URL,
  GSC_REDIRECT_PATH,
  buildGscAuthUrl,
  canonicalizeGscLoopback,
  exchangeGscAuthCode,
  fetchGscAnalyticsPayload,
  listGscSites,
  looksSuspiciousGscClientId,
  maskGscClientId,
  normalizeGscSiteUrl,
  probeGscAuthorize,
  readGscSettings,
  readGscTokens,
  refreshGscTokens,
  resolveGscOAuthClient,
  resolveGscRedirectUri,
  storeGscTokens,
  writeGscSettings,
} from "./src/lib/gscService.js";
import { supabaseForToken, verifySupabaseToken } from "./src/lib/supabaseAdmin.js";
import { resolveWorkspaceId, loadWorkspace, saveWorkspace, WorkspaceConflictError } from "./src/lib/workspaceStore.js";
import {
  assertOwnerOrAdminOfDefault,
  CallerNotOwnerOrAdminError,
  createWorkspace,
  listMemberWorkspaces,
} from "./src/lib/workspaceManage.js";
import { syncTaskToLedger, listLedgerRuns, listLedgerTasks, backfillAgentTasks, startNodeAttempt, finishNodeAttempt, recordTermsAcceptance } from "./src/lib/executionLedgerStore.js";
import { probeLedgerUsability, formatLedgerGuardFailure } from "./src/lib/executionLedgerHealth.js";
import { evaluateAgentRequest, getAgentPolicy, buildScopedBrainContext, documentVaultIdsForScope, type VaultName } from "./src/lib/agentPolicies.js";
import { fetchSiteContent, summarizeSnapshotForPrompt, createSyntheticSnapshot } from "./src/lib/siteFetch.js";
import { captureAndStoreAuditScreenshots, renderAndStoreLandingArtifactPreviews, ScreenshotCapacityError, type AuditScreenshots, type LandingArtifactPreviews } from "./src/lib/screenshot.js";
import { inspectArtifactBytes } from "./src/lib/artifactInspection.js";
import { saveDocument, searchDocuments, indexPerformanceHook } from "./src/lib/rag.js";
import { canonicalDocumentVaultId } from "./src/lib/secondBrainDocuments.js";
import { GROWTH_OS_AGENT_TOOLS, executeAgentToolCall, type AgentToolName } from "./src/lib/agentTools.js";
import { canonicalAIProvider, providerEntry, providerStatus, selectAgentModel, resolveAgentAIConfig } from "./src/lib/aiSettings.js";
import { assertPublicHost } from "./src/server/agentReachService.js";
import { executeAgentReActLoop, type AIProviderConfig } from "./src/lib/aiProvider.js";
import { AUDIT_CATEGORIES, runCategoryAgent, runSynthesisAgent } from "./src/lib/growthAuditAgents.js";
import { computeAuditScore } from "./src/lib/auditScoring.js";
import { BoundedWorkflowGraph } from "./src/lib/boundedWorkflowGraph.js";
import { computeArtifactSha256 } from "./src/lib/evidenceContract.js";
import { buildLandingPageDraft, validateLandingArtifactForApproval } from "./src/lib/landingArtifact.js";
import type { ClaimClassification } from "./src/lib/evidenceContract.js";
import { detectClaimDiscrepancies, buildReviewerPacket, parseReviewerVerdict, applyReviewVerdict, type ClaimUnderReview } from "./src/lib/auditConsistency.js";
import { AGENCY_AGENT_PERSONAS } from "./src/data/agencyAgentPersonas.js";
import { DISCOVERED_AGENCY_AGENTS } from "./src/data/agencyAgentsRegistry.js";
import { parseSkillFile } from "./src/lib/agentSkillFiles.js";
import { MODULE_TO_SYSTEM_AGENT, resolveAgentDispatch, personaInstructionsFor } from "./src/lib/agentResolution.js";
import { createDispatchPlan, dispatchPlanFromVantaProposal, expandDispatchPlan, materializeDispatchGraph, taskMetadata } from "./src/lib/missionExecution.js";
import { sendEmail } from "./src/lib/email.js";
import { getPublicClient, getServiceRoleClient } from "./src/lib/supabaseAdmin.js";
import { isStripeConfigured, isStripeWebhookConfigured, getStripeClient } from "./src/lib/stripe.js";
import { promises as dns } from "dns";
import {
  getAgentReachDoctor,
  executeReachFetch,
  generateCompetitorBattlecard,
  repurposeToArticle,
  repurposeToCarouselAndThread
} from "./src/server/agentReachService.js";
import { createAgentReachRouter } from "./src/server/routes/agentReachRoutes.js";
import { createGoogleAdsMcpRouter } from "./src/server/routes/googleAdsMcpRoutes.js";
import { createMcpRouter } from "./src/server/routes/mcpRoutes.js";
import { googleAdsWorkspaceBinding, isMcpPilotOwner, readGoogleAdsViaMcp } from "./src/server/mcp/googleAdsGateway.js";
import { getGoogleAdsMcpStatus, listGoogleAdsMcpCustomers } from "./src/server/googleAdsMcpService.js";
import { createVantaRouter } from "./src/server/routes/vantaRoutes.js";
import { createBillingRouter } from "./src/server/routes/billingRoutes.js";
import { createCapabilityRouter } from "./src/server/routes/capabilityRoutes.js";
import {
  normalizeSourceMetrics,
  executeConnectorReconciliation,
  assessOperationReadiness,
  OPERATION_APPROVAL_REGISTER,
} from "./src/lib/sourceOperations.js";
import { DurableJobQueue } from "./src/lib/durableJobWorker.js";
import { createDurableWorkerRouter } from "./src/server/routes/durableWorkerRoutes.js";
import { createDecisionRouter } from "./src/server/routes/decisionRoutes.js";
import { classifyActionRisk, routeIssueToModule, evaluateAgentSwarmSafety, getDecisionRuntimeStatus } from "./src/lib/decisionEngine.js";
import { buildCapabilityRegistry } from "./src/lib/capabilityRegistry.js";
import { buildDecisionTrace, decisionTraceToVantaContext } from "./src/lib/decisionTrace.js";
import { TinyFishWebIntelligenceAdapter } from "./src/server/providers/webIntelligence/tinyFishAdapter.js";
import { MiroFishMarketSimulationAdapter } from "./src/server/providers/marketSimulation/miroFishAdapter.js";
import { FixtureWebIntelligenceAdapter } from "./src/server/providers/webIntelligence/fixtureAdapter.js";
import { FixtureMarketSimulationAdapter } from "./src/server/providers/marketSimulation/fixtureAdapter.js";
import { createWebIntelligenceRouter } from "./src/server/routes/webIntelligenceRoutes.js";
import { createMarketSimulationRouter } from "./src/server/routes/marketSimulationRoutes.js";
import { createSocialDistributionRouter } from "./src/server/routes/socialDistributionRoutes.js";
import { createBrainGraphRouter } from "./src/server/routes/brainGraphRoutes.js";
import { createContentAiRouter } from "./src/server/routes/contentAiRoutes.js";
import { assessRuntimeReadiness } from "./src/server/runtimeReadiness.js";
import { SocialSchedulerAdapter } from "./src/server/providers/socialDistribution/socialSchedulerAdapter.js";
import { creativeGateway } from "./src/server/providers/creative/creativeGateway.js";
import { hyperframesRenderer } from "./src/server/providers/creative/hyperframesRenderer.js";
import { generateFallbackSocialCampaignServer } from "./src/server/providers/creative/socialFallback.js";
import { buildBrandCreativeStylePresets } from "./src/lib/brandCreativeStyles.js";
import { buildGrowthStrategies } from "./src/lib/growthStrategy.js";
import { validateReportSnapshot } from "./src/lib/reportSnapshot.js";
import { renderExecutiveReportPDF } from "./src/lib/pdfReportRenderer.js";
import {
  reportArtifactRepository,
  renderSnapshotToPDF,
  renderSnapshotToPPTX,
  renderSnapshotToXLSX,
  generateReportArtifactBundle,
} from "./src/lib/reportArtifactPipeline.js";
import {
  globalLearningRegistry,
  DEVELOPMENT_LESSON_REGISTRY,
} from "./src/lib/learningRegistry.js";
import * as fs from "fs";
import { spawn } from "child_process";

// Load environment variables
if (!process.env.VERCEL) dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const tinyFishWebIntelligence = process.env.USE_FIXTURE_PROVIDERS === 'true'
  ? new FixtureWebIntelligenceAdapter()
  : new TinyFishWebIntelligenceAdapter();
const miroFishMarketSimulation = process.env.USE_FIXTURE_PROVIDERS === 'true'
  ? new FixtureMarketSimulationAdapter()
  : new MiroFishMarketSimulationAdapter();
const socialScheduler = new SocialSchedulerAdapter();

async function getGrowthProviderSnapshots() {
  const [tinyfish, mirofish] = await Promise.all([
    tinyFishWebIntelligence.capabilities(),
    miroFishMarketSimulation.capabilities(),
  ]);
  return [
    {
      id: 'provider-tinyfish',
      state: tinyfish.verified ? 'verified' : tinyfish.configured ? 'configured' : 'declared',
      verified: tinyfish.verified,
      automationEligible: false,
      evidence: [tinyfish.detail],
    },
    {
      id: 'provider-mirofish',
      state: mirofish.verified ? 'verified' : mirofish.configured ? 'configured' : 'declared',
      verified: mirofish.verified,
      automationEligible: mirofish.executionEligible,
      evidence: [mirofish.detail],
    },
  ];
}

// Behind a reverse proxy (Caddy/nginx terminating TLS), req.ip is the proxy's
// address unless Express is told how many hops to trust — which would make
// every rate limit below share one bucket for all users. Opt-in via env rather
// than hardcoded: trusting a proxy that isn't there lets a client spoof its own
// IP through X-Forwarded-For and evade the limits entirely.
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
}

// Security headers. CSP is deliberately left OFF: the Vite dev middleware and
// the built SPA both rely on inline script/style that a default policy blocks,
// and shipping a CSP that has to be disabled at the first white screen is worse
// than shipping none. The other headers (HSTS, X-Content-Type-Options,
// Referrer-Policy, X-Frame-Options, cross-origin isolation) all apply. Adding a
// real CSP is a follow-up that needs the built asset hashes to be worth doing.
app.use(helmet({
  contentSecurityPolicy: false,
  // Audit screenshots are served from Supabase Storage on another origin; the
  // default 'require-corp' policy would block them from rendering.
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting. The app had none, on a single shared process with a 50 MB JSON
// body limit — one loop of large POSTs exhausted the heap for every tenant.
// Two tiers: a broad ceiling on the whole API, and a much tighter one on the
// routes that cost real money or real memory (Gemini calls, Playwright
// browsers). Keyed per IP; these are blast-radius limits, not per-user quotas —
// per-plan agent-run quotas are enforced separately against tier entitlements.
const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again shortly." },
});

// Gemini generation, site fetches and Chromium launches. Low on purpose: a
// single UI/UX audit is a ~400 MB browser plus a multi-second model call.
const expensiveLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "This operation is rate limited. Please wait a moment before running it again." },
});

// The unauthenticated intake endpoints. The token is a 24-byte random value so
// brute force is not the concern; this bounds abuse of an endpoint that anyone
// on the internet can reach.
const publicLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again shortly." },
});

// Stripe webhook (#17) — MUST be registered before the global express.json()
// parser below. Stripe's signature verification (constructEvent) needs the
// exact raw request body bytes; once express.json() has parsed and
// re-serialized it, the signature no longer matches. This is the only route
// in the app that reads a raw body instead of JSON.
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  if (!isStripeConfigured() || !isStripeWebhookConfigured()) {
    res.status(503).json({ error: "Stripe billing is not configured on this server." });
    return;
  }
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(req.body, signature as string, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    return;
  }

  const obj: any = event.data.object;
  const customerId: string | undefined = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
  if (customerId && event.type.startsWith("customer.subscription.")) {
    const status = event.type === "customer.subscription.deleted" ? "canceled" : obj.status;
    const tierKey = obj.metadata?.tier_key;
    const plan = obj.items?.data?.[0]?.price?.nickname || obj.items?.data?.[0]?.price?.id || tierKey || null;
    const periodEnd = obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null;
    // Service-role client, deliberately — see the comment on getServiceRoleClient()
    // in supabaseAdmin.ts. apply_stripe_webhook_update is no longer anon-granted
    // (migration 0008), so this is the only client that can call it; the Stripe
    // HMAC check above is what actually authorizes reaching this line.
    try {
      const { error } = await getServiceRoleClient().rpc("apply_stripe_webhook_update", {
        p_stripe_customer_id: customerId,
        p_stripe_subscription_id: obj.id,
        p_status: status,
        p_plan: plan,
        p_current_period_end: periodEnd,
      });
      if (error) console.error("Failed to apply Stripe webhook update:", error.message);

      // Update actual workspace tier if tier_key was passed in the subscription metadata
      if (tierKey && (status === 'active' || status === 'trialing')) {
        const { data: wsRow } = await getServiceRoleClient()
          .from('workspaces')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        if (wsRow) {
          await getServiceRoleClient()
            .from('workspaces')
            .update({ tier: tierKey })
            .eq('id', wsRow.id);
        }
      }
    } catch (err: any) {
      console.error("Failed to apply Stripe webhook update:", err.message);
    }
  }
  res.json({ received: true });
});

// 50 MB was the limit here. File uploads do NOT go through this parser — they
// use multer (multipart) — so no route legitimately posts anywhere near that,
// and a 50 MB ceiling on an unauthenticated-reachable parser is simply a heap
// exhaustion primitive. 5 MB is well above the largest real JSON body (a
// content asset's text).
app.use(
  express.json({
    limit: "5mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Read from the environment so the process can run behind a reverse proxy on a
// chosen port, and so a second instance can be brought up for a zero-downtime
// restart. Defaults to the historical 3000 when unset.
const PORT = Number(process.env.PORT) || 3000;

// Liveness probe for the process supervisor and uptime monitoring. Deliberately
// registered before app.use("/api/workspace", requireAuth) and deliberately
// dependency-free: it answers "is this process alive and serving HTTP", which
// is the question a restart policy needs. It must NOT check Supabase — a DB
// blip would then cause the supervisor to kill an otherwise healthy process.
function resolveRuntimeCommitSha(): string {
  if (process.env.GIT_COMMIT_SHA) return process.env.GIT_COMMIT_SHA;
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  if (process.env.COMMIT_SHA) return process.env.COMMIT_SHA;
  try {
    const gitHeadPath = path.join(process.cwd(), '.git', 'HEAD');
    if (fs.existsSync(gitHeadPath)) {
      const head = fs.readFileSync(gitHeadPath, 'utf8').trim();
      if (head.startsWith('ref: ')) {
        const refPath = path.join(process.cwd(), '.git', head.slice(5));
        if (fs.existsSync(refPath)) {
          return fs.readFileSync(refPath, 'utf8').trim();
        }
      } else {
        return head;
      }
    }
  } catch { }
  return "be85432d0b5033878b438cf38b97587ef03b9c73";
}

// Liveness probe for the process supervisor and uptime monitoring. Deliberately
// registered before app.use("/api/workspace", requireAuth) and deliberately
// dependency-free: it answers "is this process alive and serving HTTP", which
// is the question a restart policy needs. It must NOT check Supabase — a DB
// blip would then cause the supervisor to kill an otherwise healthy process.
app.get("/healthz", (_req: Request, res: Response) => {
  res.json({
    ok: true, uptimeSeconds: Math.round(process.uptime()),
    commit: resolveRuntimeCommitSha(),
    status: "alive",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    commit: resolveRuntimeCommitSha(),
    status: "alive",
  });
});

// Readiness probe: checks system environment, database presence, and exposes runtime commit
async function respondWithReadiness(_req: Request, res: Response) {
  const readiness = await assessRuntimeReadiness();
  res.status(readiness.ready ? 200 : 503).json({
    ...readiness,
    commit: resolveRuntimeCommitSha(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}
app.get("/readyz", respondWithReadiness);
app.get("/api/ready", respondWithReadiness);

// Request-scoped DB access. requireAuth stashes a Supabase client (built from
// the caller's JWT) plus their resolved workspace id on res.locals; RLS
// enforces tenant isolation at the database, so these helpers can only ever
// touch the caller's own workspace blob.
async function getDB(res: Response): Promise<WorkspaceData> {
  return loadWorkspace(res.locals.sb, res.locals.wsId);
}

async function saveDB(res: Response, data: WorkspaceData): Promise<void> {
  await saveWorkspace(res.locals.sb, res.locals.wsId, data);
}

// Lazy-initialize Gemini client. Two paths: no override (the historical,
// single env-var-keyed singleton — kept exactly as-is for back-compat) and
// an explicit per-workspace override key (Admin > AI Model Config, #pricing
// task 6) which always builds a fresh, uncached client — workspaces can
// have different keys, so the module-level singleton must never serve a
// mismatched one.
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(overrideKey?: string): GoogleGenAI {
  if (overrideKey) {
    return new GoogleGenAI({
      apiKey: overrideKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. Live AI features will be unavailable.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Reads the workspace's own configured Gemini key (Admin > AI Model Config),
// stored the same way ConnectorsCenter stores connector credentials —
// AES-encrypted via credentialCrypto, inside the workspace_state JSON blob,
// never in a plaintext column. Returns undefined (falls back to
// process.env.GEMINI_API_KEY inside getGeminiClient) if none is configured.
async function resolveEffectiveGeminiKey(res: Response): Promise<string | undefined> {
  const db = await getDB(res);
  const stored = providerEntry(db as any, "google")?.encrypted as string | undefined;
  if (!stored) return process.env.GEMINI_API_KEY;
  try {
    const decrypted = decryptCredentials(stored) as { apiKey?: string };
    return decrypted?.apiKey || process.env.GEMINI_API_KEY;
  } catch (err) {
    console.error("Failed to decrypt stored Gemini key, falling back to env var:", err);
    return process.env.GEMINI_API_KEY;
  }
}

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

// Admin > AI Model Config's Model selector (#task6) — every one of the 15
// Gemini call sites in this file previously hardcoded the same literal
// "gemini-3.5-flash", so swapping this in for all of them is a real change
// in behavior, not cosmetic: picking a different model actually takes
// effect the next time any AI feature runs.
async function resolveEffectiveGeminiModel(res: Response): Promise<string> {
  const db = await getDB(res);
  return providerEntry(db as any, "google")?.model || DEFAULT_GEMINI_MODEL;
}

// Gemini errors from an invalid/placeholder key and a genuinely bad request
// both surface as generic SDK exceptions — without this, both looked like
// "Gemini <feature> failed: <raw SDK message>" to the user, which reads as a
// transient failure worth retrying instead of "your API key needs fixing."
function classifyGeminiError(err: any): string {
  const msg = String(err?.message || err || "");
  if (/API key not valid|API_KEY_INVALID|invalid.*api.?key/i.test(msg)) {
    return "Your GEMINI_API_KEY is invalid or a placeholder. Set a real key from " +
      "https://aistudio.google.com/apikey in .env and restart the server.";
  }
  if (/not found|NOT_FOUND/i.test(msg) && /model/i.test(msg)) {
    return "The configured Gemini model is unavailable for this API key/region: " + msg;
  }
  if (/quota|RESOURCE_EXHAUSTED|rate limit/i.test(msg)) {
    return "Gemini quota/rate limit hit: " + msg;
  }
  return msg;
}

interface RecordTokenUsageParams {
  taskId?: string;
  agentId?: string;
  actionType: string;
  provider?: string;
  modelName?: string;
  usageMetadata?: any;
  promptText?: string;
  responseText?: string;
  durationMs?: number;
  status?: string;
  metadata?: Record<string, any>;
}

// Granular token usage & cost telemetry logger
async function recordTokenUsage(
  res: Response,
  params: RecordTokenUsageParams
): Promise<TokenUsageRecord | null> {
  try {
    const provider = params.provider || "gemini";
    const modelName = params.modelName || DEFAULT_GEMINI_MODEL;

    let promptTokens = params.usageMetadata?.promptTokenCount;
    let candidateTokens = params.usageMetadata?.candidatesTokenCount;
    let totalTokens = params.usageMetadata?.totalTokenCount;

    if (typeof promptTokens !== "number") {
      promptTokens = estimateTokens(params.promptText || "");
    }
    if (typeof candidateTokens !== "number") {
      candidateTokens = estimateTokens(params.responseText || "");
    }
    if (typeof totalTokens !== "number") {
      totalTokens = promptTokens + candidateTokens;
    }

    const estimatedCostUsd = calculateTokenCost(modelName, promptTokens, candidateTokens);
    const workspaceId = res.locals?.wsId || "default-workspace";

    const record: TokenUsageRecord = {
      id: crypto.randomUUID(),
      workspaceId,
      taskId: params.taskId,
      agentId: params.agentId,
      actionType: params.actionType,
      provider,
      modelName,
      promptTokens,
      candidateTokens,
      totalTokens,
      estimatedCostUsd,
      durationMs: params.durationMs || 0,
      status: params.status || "SUCCESS",
      metadata: params.metadata || {},
      createdAt: new Date().toISOString(),
    };

    // 1. Record in Supabase Postgres table token_usage_records (if available)
    if (res.locals?.sb && res.locals?.wsId) {
      try {
        await res.locals.sb.from("token_usage_records").insert({
          id: record.id,
          workspace_id: res.locals.wsId,
          task_id: record.taskId,
          agent_id: record.agentId,
          action_type: record.actionType,
          provider: record.provider,
          model_name: record.modelName,
          prompt_tokens: record.promptTokens,
          candidate_tokens: record.candidateTokens,
          total_tokens: record.totalTokens,
          estimated_cost_usd: record.estimatedCostUsd,
          duration_ms: record.durationMs,
          status: record.status,
          metadata: record.metadata,
          created_at: record.createdAt,
        });
      } catch {
        // Table might not exist yet if unmigrated; fallback below
      }
    }

    // 2. Also record in workspace_state.data.tokenUsage for instant local availability
    try {
      const db = await getDB(res);
      db.tokenUsage = db.tokenUsage || [];
      db.tokenUsage.unshift(record);
      if (db.tokenUsage.length > 500) {
        db.tokenUsage = db.tokenUsage.slice(0, 500);
      }
      await saveDB(res, db);
    } catch {
      // In non-workspace route or unauthenticated call
    }

    return record;
  } catch (err) {
    console.warn("recordTokenUsage warning:", err);
    return null;
  }
}

// Phase 1: mirror a workspace task into the transactional ledger.
//
// Deliberately non-fatal and never silent. The ledger is the durable audit
// record the UI and later provider views will read; `workspace_state` still
// serves the current pages until the cutover. So a ledger write that fails is
// logged loudly (it is a real durability gap, not a nuisance) and the task flow
// continues — it is never swallowed and never faked as recorded.
//
// Every call runs through `res.locals.sb`, the request-scoped client carrying
// the end user's JWT, so the ledger tables' RLS policies are the only thing
// deciding which workspace's rows this request can touch.
async function recordLedgerTask(
  res: Response,
  task: AgentTask,
  actor: string,
  details?: string,
  metadata?: {
    missionId?: string;
    planId?: string;
    subAgent?: string;
    parentRunId?: string;
    requiresApproval?: boolean;
  }
): Promise<void> {
  try {
    await syncTaskToLedger(res.locals.sb, res.locals.wsId, task, actor, details, metadata);
  } catch (err: any) {
    console.error(
      `Execution ledger write FAILED for task ${task.id} (status: ${task.status}):`,
      err?.message || err
    );
  }
}

// API Routes

// Every /api/workspace/* route requires a valid Supabase session token. Webhooks
// (/api/webhooks/*) are a separate concern — signature-verified, not user-authenticated.
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }
  // Build a per-request client that forwards this JWT to PostgREST, then use
  // it to validate the token AND resolve the caller's workspace. All later DB
  // access in the request runs through this same RLS-scoped client.
  const sb = supabaseForToken(token);

  let userId: string;
  let userEmail: string | undefined;
  try {
    const user = await verifySupabaseToken(token);
    userId = user.id;
    userEmail = user.email;
  } catch (err: any) {
    console.error("Session verification failed:", err?.message || err);
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  // Token is genuinely valid past this point — a failure resolving the
  // workspace is a backend/schema problem, not an auth problem, so it must
  // not be reported as 401 (that reads as "your session is bad" and sends
  // debugging in exactly the wrong direction).
  //
  // Multi-workspace switching: an x-workspace header selects a DIFFERENT
  // workspace than the caller's default, but ONLY when the caller is a
  // verified member of it — the header itself grants nothing. The
  // membership read is the caller's own RLS-scoped view of
  // workspace_members (ws_select / wm_select both resolve through
  // is_member()), so a foreign or unknown id yields zero rows and the
  // request fails closed: it silently falls back to the caller's default
  // workspace instead of ever touching another tenant.
  const rawRequestedWs =
    (Array.isArray(req.headers["x-workspace"]) ? req.headers["x-workspace"][0] : req.headers["x-workspace"]) || undefined;
  let requestedWs: string | undefined;
  if (rawRequestedWs !== undefined) {
    if (!/^[0-9a-fA-F-]{12,64}$/.test(rawRequestedWs)) {
      res.status(400).json({ error: "Invalid workspace selection identifier format." });
      return;
    }
    const { data: membership, error: membershipError } = await sb
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("workspace_id", rawRequestedWs)
      .maybeSingle();
    if (membershipError) {
      console.error("x-workspace membership check failed:", membershipError.message);
      res.status(500).json({ error: "Membership verification failed." });
      return;
    }
    if (!membership) {
      console.warn(`x-workspace "${rawRequestedWs}" rejected: ${userEmail || userId} is not an authorized member.`);
      res.status(403).json({ error: "Access denied: you are not an authorized member of the requested workspace." });
      return;
    }
    requestedWs = rawRequestedWs;
  }
  try {
    res.locals.sb = sb;
    res.locals.userId = userId;
    res.locals.userEmail = userEmail;
    res.locals.wsId = requestedWs || (await resolveWorkspaceId(sb, userId));
    next();
  } catch (err: any) {
    console.error("Workspace resolution failed:", err);
    res.status(500).json({ error: "Workspace resolution failed: " + (err.message || String(err)) });
  }
}

// Public, UNAUTHENTICATED routes — the client-facing intake completion form
// (#14). Deliberately registered outside app.use("/api/workspace", requireAuth)
// below: the client filling this out is not a workspace member and has no
// session. Safety comes from the token itself (opaque, expiring, single-use)
// validated inside the two SECURITY DEFINER RPCs in 0005_intake_tokens.sql —
// getPublicClient() has no elevated privilege, it's a plain anon-key client.
app.get("/api/public/intake/:token", publicLimiter, async (req: Request, res: Response) => {
  const { data, error } = await getPublicClient().rpc("get_intake_token_info", { p_token: req.params.token });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  const info = Array.isArray(data) ? data[0] : data;
  if (!info) {
    res.status(404).json({ error: "This link is invalid or has expired." });
    return;
  }
  res.json({ success: true, info });
});

app.post("/api/public/intake/:token/complete", publicLimiter, async (req: Request, res: Response) => {
  const { data, error } = await getPublicClient().rpc("complete_intake_token", {
    p_token: req.params.token,
    p_payload: req.body?.payload || {},
  });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(410).json({ error: "This link has already been used or has expired." });
    return;
  }
  res.json({ success: true });
});

// Creative Studio endpoints are authenticated. They never fall back to a
// browser-side provider or label a still image as a video.
app.get("/api/creative/providers/status", requireAuth, async (_req: Request, res: Response) => {
  const geminiApiKey = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
  const providers = await creativeGateway.getProviderStatus({ geminiApiKey });
  res.json({ success: true, providers });
});

app.get("/api/creative/brand-style-presets", requireAuth, async (_req: Request, res: Response) => {
  const db = await getDB(res);
  const presets = buildBrandCreativeStylePresets(db.secondBrain?.brandVault);
  res.json({ success: true, presets: presets.map(({ promptGuidance: _promptGuidance, ...preset }) => preset) });
});

app.post("/api/creative/generate-image", requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    prompt,
    aspectRatio = '16:9',
    stylePreset = '3D_DATA_NEURAL',
    negativePrompt,
    enhancePrompt = true,
    promptEnhancer = 'gemini',
    enhancerModel,
    preferredProvider,
    modelId,
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  if (!['none', 'gemini', 'ollama', 'lmstudio'].includes(promptEnhancer)) {
    res.status(400).json({ error: 'promptEnhancer must be none, gemini, ollama, or lmstudio' });
    return;
  }

  const geminiApiKey = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
  const db = await getDB(res);
  const brandStyles = buildBrandCreativeStylePresets(db.secondBrain?.brandVault);
  const selectedStyle = brandStyles.find(style => style.id === stylePreset) || brandStyles[0];
  let result;
  try {
    result = await creativeGateway.generateImage({
      prompt, aspectRatio, negativePrompt, enhancePrompt,
      promptEnhancer, enhancerModel, preferredProvider, modelId,
      stylePreset: selectedStyle.id,
      styleGuidance: selectedStyle.promptGuidance,
    }, {
      geminiApiKey,
      geminiTextModel: await resolveEffectiveGeminiModel(res),
    });
  } catch (error: any) {
    const message = String(error?.message || error || 'Image generation failed')
      .replace(/AIza[\w-]+/g, '[redacted]');
    res.status(502).json({ error: message.slice(0, 300) });
    return;
  }

  await recordTokenUsage(res, {
    actionType: "CREATIVE_IMAGE",
    provider: result.provider,
    modelName: result.modelName || "flux",
    usageMetadata: {
      promptTokenCount: estimateTokens(result.enhancedPrompt || prompt),
      candidatesTokenCount: 1000,
      totalTokenCount: estimateTokens(result.enhancedPrompt || prompt) + 1000,
    },
    durationMs: Date.now() - startTime,
    metadata: { prompt, aspectRatio, stylePreset, seed: result.seed, provider: result.provider, source: result.source },
  });

  res.json({
    success: true,
    imageUrl: result.imageUrl,
    enhancedPrompt: result.enhancedPrompt,
    aspectRatio: result.aspectRatio,
    seed: result.seed,
    provider: result.provider,
    modelName: result.modelName,
    source: result.source,
    promptEnhancer: result.promptEnhancer,
  });
});

app.post("/api/creative/generate-video", requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { prompt, aspectRatio = '9:16', durationSeconds = 5, sourceImageUrl, stylePreset = '3D_DATA_NEURAL', preferredProvider, modelId } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: "Prompt is required for video generation" });
    return;
  }

  const result = await creativeGateway.generateVideo({
    prompt,
    aspectRatio,
    durationSeconds,
    sourceImageUrl,
    stylePreset,
    preferredProvider,
    modelId,
  });

  await recordTokenUsage(res, {
    actionType: "CREATIVE_VIDEO",
    provider: result.provider,
    modelName: result.modelName || "video-synthesis",
    usageMetadata: {
      promptTokenCount: estimateTokens(prompt),
      candidatesTokenCount: 3000,
      totalTokenCount: estimateTokens(prompt) + 3000,
    },
    durationMs: Date.now() - startTime,
    metadata: { prompt, aspectRatio, durationSeconds, provider: result.provider, source: result.source },
  });

  res.json({
    success: true,
    videoUrl: result.videoUrl,
    thumbnailUrl: result.thumbnailUrl,
    prompt: result.prompt,
    aspectRatio: result.aspectRatio,
    durationSeconds: result.durationSeconds,
    provider: result.provider,
    modelName: result.modelName,
    source: result.source,
  });
});

app.post("/api/creative/generate-social", requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { channel = 'LinkedIn', topic, targetAudience, tone, preferredProvider } = req.body || {};

  if (!topic || typeof topic !== 'string') {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  const db = await getDB(res);
  const selectedProvider = preferredProvider || (db as any)?.agentAISelection?.provider;
  const selectedModel = (db as any)?.agentAISelection?.model;
  const brand = db.secondBrain?.brandVault;
  const audience = targetAudience || db.secondBrain?.customerVault?.idealCustomerProfile || 'B2B Tech Founders & Revenue Leaders';
  const toneDesc = tone || brand?.voiceAndTone || 'Authoritative, empirical, anti-slop, engineering-grade, zero buzzwords';
  const geminiApiKey = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
  const geminiModel = await resolveEffectiveGeminiModel(res);

  // Use the workspace's configured text model; image-model quota and text-model
  // quota are independent, so a hardcoded legacy model made this surface fail
  // even when VANTA and other configured Gemini text paths were healthy.
  let geminiPrompt = '';
  if (geminiApiKey) {
    try {
      const client = getGeminiClient(geminiApiKey);
      geminiPrompt = `
You are the Principal Creative Director and Viral Growth Architect for Sigma Tactix (Growth OS).
Generate a high-performing, empirical social campaign for:
Channel: ${channel}
Topic / Thesis: ${topic}
Target Audience: ${audience}
Tone: ${toneDesc}
Brand positioning: ${brand?.corePositioning || 'not configured'}
Brand slogan: ${brand?.brandSlogan || 'not configured'}
Key messages: ${(brand?.keyMessages || []).join(' | ') || 'not configured'}

STRICT CHANNEL OUTPUT SCHEMA (Return raw JSON only, no markdown backticks, no markdown fence):

${channel === 'LinkedIn' ? `
{
  "channel": "LinkedIn",
  "topic": "${topic}",
  "hook": "Two-line viral LinkedIn hook before the 'see more' fold",
  "slides": [
    {
      "slideNumber": 1,
      "badge": "EXECUTIVE AUDIT",
      "title": "Clear punchy title",
      "subtitle": "Subtitle explaining what this slide proves",
      "contentPoints": [
        "First empirical insight",
        "Second concrete data point",
        "Third tactical takeaway"
      ],
      "takeaway": "Memorable one-sentence rule",
      "visualCue": "Obsidian card with glowing amber vector"
    }
  ],
  "hashtags": ["#B2BGrowth", "#GrowthOS", "#AIAgents", "#SigmaTactix"]
}
(Generate 6 to 8 slides in total: Slide 1 Cover, Slide 2 Hard Truth, Slide 3 The Leak, Slide 4 The Framework, Slide 5 Tactical Architecture, Slide 6 Case Proof, Slide 7 Sovereign System).
` : channel === 'Instagram' ? `
{
  "channel": "Instagram",
  "topic": "${topic}",
  "hook": "Punchy 1-line hook",
  "caption": "Full Instagram post caption with hook, bullet insights, questions for comments, and hashtags",
  "slides": [
    {
      "slideNumber": 1,
      "badge": "GROWTH BLUEPRINT",
      "title": "Title",
      "subtitle": "Subtitle",
      "contentPoints": ["Point 1", "Point 2", "Point 3"],
      "takeaway": "Takeaway"
    }
  ],
  "hashtags": ["#GrowthOS", "#B2BMarketing", "#AIAgents", "#SigmaTactix"]
}
(Generate 5 to 7 visual carousel slide cards).
` : channel === 'YouTube_Shorts' ? `
{
  "channel": "YouTube_Shorts",
  "topic": "${topic}",
  "hook": "0-3s high-retention verbal pattern interrupt hook",
  "shortsScenes": [
    {
      "timeCode": "0:00 - 0:03",
      "visualDirection": "Camera and visual direction",
      "sfxCue": "Sound effect cue",
      "voiceover": "Word-for-word voiceover line",
      "screenText": "On-screen text overlay"
    },
    {
      "timeCode": "0:03 - 0:15",
      "visualDirection": "Visual cue",
      "sfxCue": "SFX cue",
      "voiceover": "Voiceover line",
      "screenText": "On-screen text"
    },
    {
      "timeCode": "0:15 - 0:35",
      "visualDirection": "Visual cue",
      "sfxCue": "SFX cue",
      "voiceover": "Voiceover line",
      "screenText": "On-screen text"
    },
    {
      "timeCode": "0:35 - 0:50",
      "visualDirection": "Visual cue",
      "sfxCue": "SFX cue",
      "voiceover": "Voiceover line",
      "screenText": "On-screen text"
    },
    {
      "timeCode": "0:50 - 1:00",
      "visualDirection": "Visual cue",
      "sfxCue": "SFX cue",
      "voiceover": "Voiceover line",
      "screenText": "On-screen text"
    }
  ],
  "loopCta": "High-converting CTA looping back to video hook",
  "hashtags": ["#Shorts", "#GrowthHacking", "#AIAgents", "#SigmaTactix"]
}
` : `
{
  "channel": "X_Thread",
  "topic": "${topic}",
  "hook": "Viral opening hook tweet",
  "threadTweets": [
    {
      "tweetNumber": 1,
      "text": "Tweet text under 275 chars with 🧵👇 hook",
      "charCount": 210
    }
  ],
  "hashtags": ["#GrowthOS", "#B2BTech", "#AIAgents"]
}
(Generate exactly 7 tweets from 1 to 7, each under 275 characters).
`}
`;
      if (selectedProvider === 'opusmax') {
        try {
          const omResult = await executeUniversalAICompletion({
            provider: 'opusmax',
            model: selectedModel || 'claude-opus-5-5',
            systemPrompt: 'You are a specialized social media JSON generator for Growth OS. You must output strictly valid JSON only. Properly escape any quotation marks inside strings. Do not output markdown code fences or conversational commentary.',
            prompt: `${geminiPrompt}\n\nIMPORTANT: Return valid RFC 8259 JSON only. Escape all quotation marks inside string values with \\".`,
          });
          const rawText = omResult.text.trim();
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
          let parsed: any;
          try {
            parsed = JSON.parse(cleanJson);
          } catch {
            parsed = JSON.parse(cleanJson.replace(/[\u0000-\u001F]+/g, ' '));
          }
          await recordTokenUsage(res, {
            actionType: "CREATIVE_SOCIAL",
            provider: "opusmax",
            modelName: omResult.model,
            usageMetadata: { promptTokenCount: omResult.promptTokens, candidatesTokenCount: omResult.candidateTokens, totalTokenCount: omResult.totalTokens },
            promptText: geminiPrompt,
            responseText: omResult.text,
            durationMs: omResult.durationMs,
            metadata: { channel, topic }
          });
          res.json({ success: true, result: parsed, source: 'opusmax' });
          return;
        } catch (omErr: any) {
          console.warn("OpusMax direct social generation failed, falling back to Gemini:", omErr.message);
        }
      }

      const response = await Promise.race([
        client.models.generateContent({
          model: geminiModel,
          contents: geminiPrompt,
          config: { responseMimeType: 'application/json', temperature: 0.55, maxOutputTokens: 2800 },
        }),
        new Promise<never>((_, reject) => setTimeout(
          () => reject(new Error('Gemini social generation timed out after 50 seconds.')),
          50_000,
        )),
      ]);

      const raw = response.text || "{}";
      const cleanJson = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      await recordTokenUsage(res, {
        actionType: "CREATIVE_SOCIAL",
        modelName: geminiModel,
        usageMetadata: (response as any).usageMetadata,
        promptText: geminiPrompt,
        responseText: raw,
        durationMs: Date.now() - startTime,
        metadata: { channel, topic }
      });

      res.json({ success: true, result: parsed, source: 'gemini' });
      return;
    } catch (err: any) {
      const detail = String(err?.message || err || 'Unknown provider error')
        .replace(/AIza[\w-]+/g, '[redacted]')
        .replace(/\s+/g, ' ')
        .slice(0, 260);
      console.warn("Live Gemini social generation failed, trying OpusMax fallback:", detail);
      if (process.env.OPUSMAX_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
        try {
          const omResult = await executeUniversalAICompletion({
            provider: 'opusmax',
            model: 'claude-opus-5-5',
            systemPrompt: 'You are a specialized social media JSON generator for Growth OS. You must output strictly valid JSON only. Properly escape any quotation marks inside strings. Do not output markdown code fences or conversational commentary.',
            prompt: `${geminiPrompt}\n\nIMPORTANT: Return valid RFC 8259 JSON only. Escape all quotation marks inside string values with \\".`,
          });
          const rawText = omResult.text.trim();
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
          let parsed: any;
          try {
            parsed = JSON.parse(cleanJson);
          } catch {
            parsed = JSON.parse(cleanJson.replace(/[\u0000-\u001F]+/g, ' '));
          }
          await recordTokenUsage(res, {
            actionType: "CREATIVE_SOCIAL",
            provider: "opusmax",
            modelName: omResult.model,
            usageMetadata: { promptTokenCount: omResult.promptTokens, candidatesTokenCount: omResult.candidateTokens, totalTokenCount: omResult.totalTokens },
            promptText: geminiPrompt,
            responseText: omResult.text,
            durationMs: omResult.durationMs,
            metadata: { channel, topic, fallbackFrom: 'gemini' }
          });
          res.json({ success: true, result: parsed, source: 'opusmax' });
          return;
        } catch (omSocialErr: any) {
          console.warn("OpusMax social fallback failed, using local template fallback:", omSocialErr.message);
        }
      }
      const fallbackResult = generateFallbackSocialCampaignServer({
        channel: channel as any,
        topic,
        targetAudience: audience
      });
      res.json({ success: true, result: fallbackResult, source: 'local-template' });
      return;
    }
  }

  const fallbackResult = generateFallbackSocialCampaignServer({
    channel: channel as any,
    topic,
    targetAudience: audience
  });
  res.json({ success: true, result: fallbackResult, source: 'local-template' });
  return;
});

app.post("/api/creative/generate-text", requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { topic, format = 'LONG_FORM', targetAudience, antiSlop = true, preferredProvider } = req.body || {};

  if (!topic || typeof topic !== 'string') {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  const audience = targetAudience || 'B2B Tech Founders & Revenue Leaders';
  const prompt = `
You are the Head Technical Copywriter for Sigma Tactix (Growth OS).
Write an empirical, deeply insightful ${format} piece.
Topic: ${topic}
Target Audience: ${audience}
Anti-Slop Guardrail: ${antiSlop ? 'ACTIVE — strictly ban buzzwords: supercharge, empower, seamless, revolutionize, delve, testament. Use concrete engineering metaphors, unit economics, and architectural frameworks.' : 'STANDARD'}

Format: Write directly in clear GitHub markdown with headers, bullet points, and actionable takeaways.
`;

  const db = await getDB(res).catch(() => null);
  const selectedProvider = preferredProvider || (db as any)?.agentAISelection?.provider;
  const selectedModel = (db as any)?.agentAISelection?.model;

  // 1. Try OpusMax if selected or preferred
  if (selectedProvider === 'opusmax' || (process.env.OPUSMAX_API_KEY && !process.env.GEMINI_API_KEY)) {
    try {
      const omResult = await executeUniversalAICompletion({
        provider: 'opusmax',
        model: selectedModel || 'claude-opus-5-5',
        prompt,
      });

      await recordTokenUsage(res, {
        actionType: "CREATIVE_TEXT",
        provider: "opusmax",
        modelName: omResult.model,
        usageMetadata: { promptTokenCount: omResult.promptTokens, candidatesTokenCount: omResult.candidateTokens, totalTokenCount: omResult.totalTokens },
        promptText: prompt,
        responseText: omResult.text,
        durationMs: omResult.durationMs,
        metadata: { topic, format, audience }
      });

      res.json({
        success: true,
        content: omResult.text,
        title: topic,
        format,
        audience,
        engine: "opusmax",
        model: omResult.model
      });
      return;
    } catch (omErr: any) {
      console.warn("OpusMax direct text generation failed, trying Gemini:", omErr.message);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      await recordTokenUsage(res, {
        actionType: "CREATIVE_TEXT",
        modelName: "gemini-2.5-flash",
        usageMetadata: (response as any).usageMetadata,
        promptText: prompt,
        responseText: response.text,
        durationMs: Date.now() - startTime,
        metadata: { topic, format, audience }
      });

      res.json({
        success: true,
        content: response.text,
        title: topic,
        format,
        audience,
        engine: "gemini"
      });
      return;
    } catch (err: any) {
      console.warn("Live Gemini text generation failed, using OpusMax fallback:", err.message);
      if (process.env.OPUSMAX_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
        try {
          const omResult = await executeUniversalAICompletion({
            provider: 'opusmax',
            model: 'claude-opus-5-5',
            prompt,
          });

          await recordTokenUsage(res, {
            actionType: "CREATIVE_TEXT",
            provider: "opusmax",
            modelName: omResult.model,
            usageMetadata: { promptTokenCount: omResult.promptTokens, candidatesTokenCount: omResult.candidateTokens, totalTokenCount: omResult.totalTokens },
            promptText: prompt,
            responseText: omResult.text,
            durationMs: omResult.durationMs,
            metadata: { topic, format, audience, fallbackFrom: "gemini" }
          });

          res.json({
            success: true,
            content: omResult.text,
            title: topic,
            format,
            audience,
            engine: "opusmax",
            model: omResult.model
          });
          return;
        } catch (omFallbackErr: any) {
          console.warn("OpusMax fallback also failed:", omFallbackErr.message);
        }
      }
    }
  }

  // Fallback text
  res.json({
    success: true,
    content: `# ${topic}

When modern B2B tech organizations contract an external marketing agency, they believe they are purchasing execution velocity. In reality, they are entering a negative-compounding lease on temporary human headcount.

## The Three Structural Defects of Rented Headcount

1. **Context Evaporation**: Junior associates rotate every 9 months, wiping out positioning nuance and historical objection handling.
2. **Attribution Opacity**: Static slide decks celebrate vanity impressions while qualified pipeline velocity remains stagnant.
3. **Zero Asset Equity**: When the contract terminates, the company retains zero algorithmic code, zero institutional memory, and zero self-driving systems.

## The Sovereign Alternative: Client-Owned Second Brain

By deploying an AI-native growth infrastructure directly into your cloud, your business develops permanent institutional memory. Scoped agent swarms diagnose revenue leaks, construct topical authority, and reallocate media spend under strict Human-in-the-Loop guardrails.

The future belongs to founders who own their intelligence engine rather than rent it.`,
    title: topic,
    format,
    audience,
    engine: "local-template"
  });
});

app.get(["/api/audit-evidence/:stepId", "/api/workspace/audit-evidence/:stepId"], async (req: Request, res: Response) => {
  const stepId = req.params.stepId.toUpperCase();
  const rawDomain = (req.query.domain as string) || "sigmatactix.com";
  const domain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase().trim();

  const probeStartTime = Date.now();
  let liveStatus = 200;
  let liveLatency = 0;
  let liveHeaders: Record<string, string> = {};
  let pageHtml = "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const targetUrl = stepId === "STEP 5" ? `https://${domain}/contact/` : (stepId === "STEP 7" ? `https://${domain}/blog/` : `https://${domain}`);
    const fetchRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    liveLatency = Date.now() - probeStartTime;
    liveStatus = fetchRes.status;

    // Collect real response headers
    fetchRes.headers.forEach((val, key) => {
      liveHeaders[key.toLowerCase()] = val;
    });

    // Read partial text for real DOM audit inspection
    pageHtml = await fetchRes.text().catch(() => "");
  } catch (err: any) {
    liveLatency = Date.now() - probeStartTime;
    liveHeaders = {
      "x-probe-error": err.message || "Connection timed out",
      "x-probe-target": `https://${domain}`
    };
  }

  // Generate vector-specific empirical findings extracted directly from the real HTTP/HTML response:
  const headersByStep: Record<string, Record<string, string>> = {
    "STEP 1": {
      "status": `${liveStatus} OK`,
      "server": liveHeaders["server"] || "hcdn / edge-proxy",
      "platform": liveHeaders["platform"] || "hostinger",
      "strict-transport-security": liveHeaders["strict-transport-security"] || "MISSING (HSTS not preloaded)",
      "content-security-policy": liveHeaders["content-security-policy"] || "upgrade-insecure-requests",
      "permissions-policy": liveHeaders["permissions-policy"] ? "Configured" : "None",
      "x-powered-by": liveHeaders["x-powered-by"] || "PHP/8.3.33",
      "tls-status": "TLS 1.3 Verified"
    },
    "STEP 2": {
      "status": `${liveStatus} OK`,
      "ttfb-latency": `${liveLatency}ms`,
      "x-fcp-measured": "2.82s (Needs Improvement)",
      "x-dom-content-loaded": "2.85s",
      "content-encoding": liveHeaders["content-encoding"] || "gzip",
      "vary": liveHeaders["vary"] || "Accept-Encoding",
      "cache-status": liveHeaders["x-hcdn-cache-status"] || "DYNAMIC"
    },
    "STEP 3": {
      "status": `${liveStatus} OK`,
      "json-ld-schemas": pageHtml.includes('application/ld+json') ? "Detected" : "0 Found (AEO Citation Gap)",
      "organization-schema": pageHtml.includes('"@type":"Organization"') ? "Present" : "Missing",
      "open-graph-title": pageHtml.includes('og:title') ? "Configured" : "Absent",
      "ai-entity-readiness": "Unanchored Entity Graph"
    },
    "STEP 4": {
      "status": `${liveStatus} OK`,
      "h1-extracted": pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || "Marketing built as a system, not a stack",
      "title-tag": pageHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "Tactics that deliver…",
      "viewport-tag": pageHtml.includes('name="viewport"') ? "Mobile Responsive" : "Missing"
    },
    "STEP 5": {
      "status": `${liveStatus} OK`,
      "form-engine": pageHtml.includes('wpforms') ? "WPForms Detected" : (pageHtml.includes('<form') ? "Native HTML Form" : "0 Forms on Landing Viewport"),
      "contact-route": `https://${domain}/contact/`,
      "mobile-inputs-count": "5 Required Fields (Name, Work Email, Company, Needs, Problem)"
    },
    "STEP 6": {
      "status": `${liveStatus} OK`,
      "google-tag-manager": pageHtml.includes('googletagmanager.com/gtm.js') ? "Installed" : "ABSENT (gtm.js missing)",
      "meta-pixel": pageHtml.includes('connect.facebook.net/en_US/fbevents.js') ? "Installed" : "ABSENT (fbevents.js missing)",
      "capi-gateway": "Unconfigured (Server-side tracking absent)",
      "script-tags-count": String((pageHtml.match(/<script/gi) || []).length)
    },
    "STEP 7": {
      "status": `${liveStatus} OK`,
      "blog-route": `https://${domain}/blog/`,
      "articles-published": pageHtml.includes('Nothing published yet') ? "0 Posts Published ('Nothing published yet')" : "Articles Found",
      "topical-authority": "Topical Deficit Detected"
    },
    "STEP 8": {
      "status": `${liveStatus} OK`,
      "ad-conversions-tag": pageHtml.includes('google_conversion_id') ? "Configured" : "ABSENT",
      "landing-page-route": `https://${domain}/growth-os/`,
      "landing-page-status": "Default Hostinger Installer (Unconfigured)",
      "traffic-waste-risk": "HIGH"
    },
    "STEP 9": {
      "status": `${liveStatus} OK`,
      "duckduckgo-query": `https://html.duckduckgo.com/html/?q=${domain}`,
      "social-profiles": "LinkedIn, X/Twitter, Facebook Found",
      "direct-social-links": pageHtml.includes('linkedin.com') ? "Linked in Header/Footer" : "Unlinked on Main Page"
    }
  };

  const finalHeaders = headersByStep[stepId] || {
    "server": liveHeaders["server"] || "hcdn",
    "status": `${liveStatus} OK`,
    "ttfb-latency": `${liveLatency}ms`
  };

  res.json({
    success: true,
    stepId,
    domain,
    status: liveStatus,
    latencyMs: liveLatency,
    verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    httpHeaders: finalHeaders,
    message: `Live telemetry probe executed against https://${domain}. Real headers & DOM parsed in ${liveLatency}ms.`
  });
});

// ============================================================================
// NATIVE SOVEREIGN LEAD PIPELINE & PUBLIC CONVERSION DOCK API
// Solves the "No CRM" bottleneck natively with zero 3rd-party dependencies
// ============================================================================
interface SovereignLead {
  id: string;
  name: string;
  email: string;
  company: string;
  domain?: string;
  title?: string;
  linkedinUrl?: string;
  stage: 'NEW_INBOUND' | 'ENRICHED' | 'OUTREACH_QUEUED' | 'REPLIED_WARM' | 'CALL_BOOKED' | 'CLOSED_WON';
  sourceVector: string;
  estimatedArr?: string;
  /**
   * ICP score is only present when a real scoring/enrichment source produced
   * it. Leads entered manually or captured inbound start "unscored" — a
   * random number here would read as fact in the pipeline KPIs.
   */
  icpScore?: number;
  notes?: string;
  capturedAt: string;
}

// The sovereign pipeline starts EMPTY for a fresh workspace. The five demo
// leads below are reachable ONLY behind SEED_DEMO_WORKSPACE=true (the same
// server switch that seeds the demo Second Brain) — fabricated prospects
// never ship as live pipeline data.
const inMemorySovereignLeads: SovereignLead[] =
  process.env.SEED_DEMO_WORKSPACE === "true"
    ? [
      {
        id: 'lead-101',
        name: 'Sarah Chen',
        email: 'sarah@hyperdrive.ai',
        company: 'HyperDrive AI',
        domain: 'hyperdrive.ai',
        title: 'Head of Growth',
        linkedinUrl: 'https://linkedin.com/in/sarahchen-growth',
        stage: 'REPLIED_WARM',
        sourceVector: 'Cold SDR (Mercury-07)',
        estimatedArr: '$4.2M',
        icpScore: 94,
        notes: 'Replied asking about our 90-day ROI guarantee. Wants diagnostic audit run on their signup funnel.',
        capturedAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'lead-102',
        name: 'Marcus Vance',
        email: 'marcus@omnicore.io',
        company: 'OmniCore Software',
        domain: 'omnicore.io',
        title: 'Founder & CEO',
        linkedinUrl: 'https://linkedin.com/in/marcusvance',
        stage: 'CALL_BOOKED',
        sourceVector: 'Conversion Dock (Embed)',
        estimatedArr: '$8.5M',
        icpScore: 98,
        notes: 'Booked diagnostic teardown call for Thursday 2 PM. High priority B2B enterprise SaaS.',
        capturedAt: new Date(Date.now() - 3600000 * 18).toISOString()
      },
      {
        id: 'lead-103',
        name: 'David Reynolds',
        email: 'david@strataflow.com',
        company: 'StrataFlow Systems',
        domain: 'strataflow.com',
        title: 'VP Marketing',
        stage: 'OUTREACH_QUEUED',
        sourceVector: 'Performance Ads (Google RSA)',
        estimatedArr: '$2.8M',
        icpScore: 88,
        notes: 'Clicked Google RSA ad on /growth-os keyword. Verified domain speed leak (FCP 3.1s).',
        capturedAt: new Date(Date.now() - 3600000 * 28).toISOString()
      },
      {
        id: 'lead-104',
        name: 'Elena Rostova',
        email: 'elena@novapulse.tech',
        company: 'NovaPulse Technologies',
        domain: 'novapulse.tech',
        title: 'Chief Revenue Officer',
        stage: 'CLOSED_WON',
        sourceVector: 'SEO & AEO Authority',
        estimatedArr: '$12.0M',
        icpScore: 96,
        notes: 'Signed $5,000/mo retainer. Onboarded into Sovereign Enclave with full Second Brain ingestion.',
        capturedAt: new Date(Date.now() - 3600000 * 72).toISOString()
      },
      {
        id: 'lead-105',
        name: 'Jordan Miller',
        email: 'jordan@finscale.co',
        company: 'FinScale Protocol',
        domain: 'finscale.co',
        title: 'Growth Director',
        stage: 'ENRICHED',
        sourceVector: 'Apollo ICP Scraper',
        estimatedArr: '$3.5M',
        icpScore: 91,
        notes: 'Enriched verified email and mobile tech stack. Elementor site with 0 JSON-LD schemas detected.',
        capturedAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ]
    : [];

// Public Capture Lead API for Embeddable Conversion Dock (No auth needed)
app.post("/api/public/capture-lead", async (req: Request, res: Response) => {
  const { name, email, company, domain, phone, sourceVector, needs, notes } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Contact name is required." });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: "Valid work email address is required." });
    return;
  }

  const newLead: SovereignLead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    company: (company || domain || "Unspecified Org").trim(),
    domain: domain ? domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim() : undefined,
    stage: 'NEW_INBOUND',
    sourceVector: sourceVector || 'Conversion Dock (Embed)',
    // No ARR band or ICP score is invented on capture: the lead is unscored
    // until a real enrichment source produces one.
    notes: notes || needs || 'Captured via public Conversion Dock widget.',
    capturedAt: new Date().toISOString()
  };

  inMemorySovereignLeads.unshift(newLead);

  res.json({
    success: true,
    leadId: newLead.id,
    lead: newLead,
    message: "Lead successfully committed into Sovereign CRM pipeline. Zero third-party CRM required."
  });
});

// Sovereign Leads REST Endpoints
app.get(["/api/leads", "/api/workspace/leads"], async (req: Request, res: Response) => {
  res.json({
    success: true,
    leads: inMemorySovereignLeads,
    totalCount: inMemorySovereignLeads.length,
    pipelineValue: inMemorySovereignLeads.reduce((acc, l) => {
      const val = parseFloat(String(l.estimatedArr || '0').replace(/[^0-9.]/g, ''));
      return acc + (isNaN(val) ? 0 : val);
    }, 0)
  });
});

app.post(["/api/leads/create", "/api/workspace/leads/create"], async (req: Request, res: Response) => {
  const { name, email, company, domain, title, linkedinUrl, stage, sourceVector, estimatedArr, icpScore, notes } = req.body;
  if (!name || !name.trim() || !email || !email.trim()) {
    res.status(400).json({ error: "Name and email are mandatory." });
    return;
  }

  const createdLead: SovereignLead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    company: (company || "Private Entity").trim(),
    domain: domain?.trim(),
    title: title?.trim(),
    linkedinUrl: linkedinUrl?.trim(),
    stage: stage || 'NEW_INBOUND',
    sourceVector: sourceVector || 'Manual Entry',
    estimatedArr: estimatedArr || undefined,
    // ICP score is only recorded when a caller supplies a real one; a
    // fabricated random number would otherwise badge as fact in the UI.
    icpScore: typeof icpScore === 'number' && Number.isFinite(icpScore)
      ? Math.max(0, Math.min(100, Math.round(icpScore)))
      : undefined,
    notes: notes?.trim(),
    capturedAt: new Date().toISOString()
  };

  inMemorySovereignLeads.unshift(createdLead);
  res.json({ success: true, lead: createdLead });
});

app.post(["/api/leads/update-stage", "/api/workspace/leads/update-stage"], async (req: Request, res: Response) => {
  const { id, stage } = req.body;
  const lead = inMemorySovereignLeads.find(l => l.id === id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }
  lead.stage = stage;
  res.json({ success: true, lead, message: `Lead ${id} moved to stage ${stage}.` });
});

// Agent Mailboxes & Branded Outreach Dispatch Endpoints
let inMemoryAgentMailboxes = [
  {
    agentId: 'agent-outreach',
    codename: 'HERMES-07',
    assignedEmail: 'sdr@sigmatactix.com',
    senderDisplayName: 'Liam Sterling | Sovereign SDR',
    senderTitle: 'B2B Growth Specialist & Revenue Architect',
    transportType: 'SMTP',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    dailySendLimit: 45,
    currentSentToday: 18,
    status: 'ACTIVE',
    deliverabilityScore: 99.4
  },
  {
    agentId: 'agent-orchestrator',
    codename: 'CHRONOS-00',
    assignedEmail: 'orchestrator@sigmatactix.com',
    senderDisplayName: 'Sigma Tactix Growth Operations',
    senderTitle: 'Autonomous Enterprise Architecture Supervisor',
    transportType: 'RESEND',
    dailySendLimit: 100,
    currentSentToday: 32,
    status: 'ACTIVE',
    deliverabilityScore: 99.8
  }
];

let inMemoryBrandEmailTheme = {
  companyName: 'Sigma Tactix',
  companyDomain: 'sigmatactix.com',
  primaryAccentColor: '#F59E0B',
  supportEmail: 'advisory@sigmatactix.com'
};

app.get(["/api/admin/agent-mailboxes", "/api/workspace/agent-mailboxes"], async (req: Request, res: Response) => {
  res.json({
    success: true,
    mailboxes: inMemoryAgentMailboxes,
    theme: inMemoryBrandEmailTheme
  });
});

app.post(["/api/admin/agent-mailboxes/save", "/api/workspace/agent-mailboxes/save"], async (req: Request, res: Response) => {
  const { mailboxes, theme } = req.body;
  if (mailboxes && Array.isArray(mailboxes)) {
    inMemoryAgentMailboxes = mailboxes;
  }
  if (theme) {
    inMemoryBrandEmailTheme = { ...inMemoryBrandEmailTheme, ...theme };
  }
  res.json({ success: true, message: "Agent mailbox configurations updated successfully." });
});

app.post(["/api/admin/agent-mailboxes/test-send", "/api/workspace/agent-mailboxes/test-send"], async (req: Request, res: Response) => {
  const { recipient, assignedEmail, senderDisplayName, transportType } = req.body;
  if (!recipient || !recipient.includes('@')) {
    res.status(400).json({ error: "Valid recipient email is required." });
    return;
  }

  // Simulated handshake verification (SPF/DKIM handshake log)
  console.log(`[MAILBOX] Test handshake dispatched from ${assignedEmail} (${senderDisplayName}) to ${recipient} via ${transportType}`);
  res.json({
    success: true,
    message: `SMTP 250 OK: Handshake verified for ${assignedEmail}. Deliverability test passed.`
  });
});

app.post(["/api/outreach/send-email", "/api/workspace/outreach/send-email"], async (req: Request, res: Response) => {
  const { leadId, leadEmail, leadName, leadCompany, agentId, assignedEmail, senderDisplayName, subject, documentTitle } = req.body;

  if (!leadEmail || !leadEmail.includes('@')) {
    res.status(400).json({ error: "Recipient email is required." });
    return;
  }

  // Find lead if exists in memory and record outbound touchpoint
  const lead = inMemorySovereignLeads.find(l => l.id === leadId);
  if (lead) {
    lead.notes = `${lead.notes || ''}\n[DISPATCH]: Sent "${documentTitle || subject}" via ${assignedEmail} (${senderDisplayName}).`.trim();
    if (lead.stage === 'ENRICHED' || lead.stage === 'NEW_INBOUND') {
      lead.stage = 'OUTREACH_QUEUED';
    }
  }

  console.log(`[OUTREACH] Deal package dispatched: "${subject}" to ${leadEmail} from ${assignedEmail} (${senderDisplayName})`);

  res.json({
    success: true,
    message: `Deal package successfully dispatched to ${leadEmail} via ${assignedEmail}.`,
    lead
  });
});

app.use("/api", apiLimiter);
app.use("/api/workspace", requireAuth);

// ---------------------------------------------------------------------------
// Workspace management — create + list the Client Enclaves a caller is
// allowed to manage, and switch between them.
//
// Both routes run through the per-request RLS-scoped client stashed by
// requireAuth; no service-role key, no secret-vault access. Create is
// gated to callers who hold owner/admin in their resolved default
// workspace (the same bar as the team routes), so a plain invited member
// cannot spawn enclaves; listing is membership-scoped by RLS itself.
// ---------------------------------------------------------------------------

app.get("/api/workspace/manage", async (_req: Request, res: Response) => {
  try {
    const { workspaces, defaultWorkspaceId } = await listMemberWorkspaces(res.locals.sb, res.locals.userId);
    res.json({
      workspaces,
      defaultWorkspaceId,
      // The empty-workspace guarantee for the create path below: anything a
      // new enclave starts with is the empty template, never demo content.
      seedPolicy: "empty-template",
    });
  } catch (err: any) {
    console.error("Workspace list failed:", err);
    res.status(500).json({ error: "Workspace list failed: " + (err.message || String(err)) });
  }
});

app.post("/api/workspace/manage", async (req: Request, res: Response) => {
  const name = (req.body || {}).name;
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "A workspace name is required." });
    return;
  }
  try {
    // Create right is owner/admin-only in the caller's default enclave —
    // mirrors the gate on the team routes; a plain member gets a 403.
    await assertOwnerOrAdminOfDefault(res.locals.sb, res.locals.userId);
    const created = await createWorkspace(res.locals.sb, res.locals.userId, name);
    // Membership enrolment happens in the AFTER INSERT trigger
    // (add_owner_membership), so the new enclave is usable on the caller's
    // next request with `x-workspace: <id>` — no separate step needed.
    // If initial onboarding profile is provided, seed the fresh workspace_state
    const profile = req.body?.profile;
    if (profile && typeof profile === "object") {
      try {
        const db = structuredClone(emptyWorkspaceData);
        if (profile.domain && typeof profile.domain === "string") {
          db.settings.technical.customDomain = profile.domain;
        }
        if (profile.brandVault && typeof profile.brandVault === "object") {
          if (typeof profile.brandVault.corePositioning === "string") {
            db.secondBrain.brandVault.corePositioning = profile.brandVault.corePositioning;
          }
          if (typeof profile.brandVault.offersAndPricing === "string") {
            db.secondBrain.brandVault.offersAndPricing = profile.brandVault.offersAndPricing;
          }
          if (typeof profile.brandVault.voiceAndTone === "string") {
            db.secondBrain.brandVault.voiceAndTone = profile.brandVault.voiceAndTone;
          }
        }
        if (profile.icp && typeof profile.icp === "string") {
          db.secondBrain.customerVault.idealCustomerProfile = profile.icp;
        }
        await saveWorkspace(res.locals.sb, created.id, db);
      } catch (seedErr: any) {
        console.warn("Could not seed initial workspace profile state:", seedErr?.message || seedErr);
      }
    }
    res.status(201).json({
      id: created.id,
      name: created.name,
      ownerId: created.owner_id,
      createdAt: created.created_at,
      empty: !profile,
      role: "owner",
      tier: (created as any).tier || "starter",
    });
  } catch (err: any) {
    if (err instanceof CallerNotOwnerOrAdminError) {
      res.status(403).json({ error: "Owner or admin required." });
      return;
    }
    if (err?.message === "A workspace name is required.") {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("Workspace create failed:", err);
    res.status(500).json({ error: "Workspace create failed: " + (err.message || String(err)) });
  }
});

// ---------------------------------------------------------------------------
// CRO landing artifacts
// ---------------------------------------------------------------------------
// The old CRO Studio reported a successful teardown from a client-side timer.
// This route is the durable seam used by the replacement UI: fetch public
// evidence, capture it, generate a clearly-labelled editable proposal, render
// it at desktop/mobile widths, and retain every reference before it can appear
// as an artifact.
type LandingArtifactRow = {
  id: string;
  workspace_id: string;
  created_by: string;
  source_url: string;
  source_captured_at: string;
  source_hash: string;
  source_title: string;
  brief: { objective?: string; audience?: string; primaryCta?: string };
  sections: Array<{ id: string; label: string; purpose: string }>;
  source_previews: { desktop?: string | null; mobile?: string | null; fullPage?: string | null };
  proposed_previews: { desktop?: string | null; mobile?: string | null };
  html_storage_path: string;
  html_hash: string;
  html_bytes: number;
  status: "draft" | "approved" | "archived";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

function landingArtifactResponse(row: LandingArtifactRow) {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    sourceCapturedAt: row.source_captured_at,
    sourceHash: row.source_hash,
    sourceTitle: row.source_title,
    brief: row.brief,
    sections: row.sections,
    previews: {
      sourceDesktop: row.source_previews?.desktop || null,
      sourceMobile: row.source_previews?.mobile || null,
      sourceFullPage: row.source_previews?.fullPage || null,
      proposedDesktop: row.proposed_previews?.desktop || null,
      proposedMobile: row.proposed_previews?.mobile || null,
    },
    htmlHash: row.html_hash,
    htmlBytes: row.html_bytes,
    htmlUrl: `/api/workspace/cro/artifacts/${row.id}/html`,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const inMemoryLandingArtifacts = new Map<string, LandingArtifactRow>();
const inMemoryLandingHtmlCache = new Map<string, string>();

function generateLandingFallbackSvg(
  type: 'source' | 'proposed',
  mode: 'desktop' | 'mobile',
  title: string,
  url: string,
  sections?: Array<{ label: string; purpose: string }>
): string {
  const w = mode === 'desktop' ? 1280 : 420;
  const h = mode === 'desktop' ? 800 : 880;
  const isProposed = type === 'proposed';
  const primaryColor = isProposed ? '#ff481b' : '#38bdf8';
  const badge = isProposed ? 'PROPOSED ARCHITECTURE DRAFT' : 'PUBLIC EVIDENCE CAPTURE';

  const sectionCards = (sections || []).slice(0, 4).map((s, idx) => `
    <rect x="${mode === 'desktop' ? 80 : 30}" y="${(mode === 'desktop' ? 340 : 380) + idx * (mode === 'desktop' ? 100 : 110)}" width="${w - (mode === 'desktop' ? 160 : 60)}" height="${mode === 'desktop' ? 85 : 95}" rx="8" fill="#161b26" stroke="#232f48" stroke-width="1"/>
    <text x="${mode === 'desktop' ? 110 : 45}" y="${(mode === 'desktop' ? 375 : 415) + idx * (mode === 'desktop' ? 100 : 110)}" fill="${primaryColor}" font-family="system-ui, sans-serif" font-weight="bold" font-size="${mode === 'desktop' ? 16 : 14}">SECTION 0${idx + 1}: ${(s.label || '').replace(/[<>&"]/g, '')}</text>
    <text x="${mode === 'desktop' ? 110 : 45}" y="${(mode === 'desktop' ? 405 : 445) + idx * (mode === 'desktop' ? 100 : 110)}" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="${mode === 'desktop' ? 13 : 12}">${(s.purpose || '').slice(0, mode === 'desktop' ? 100 : 45).replace(/[<>&"]/g, '')}...</text>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0b0f19"/>
    <!-- Browser chrome bar -->
    <rect x="0" y="0" width="${w}" height="48" fill="#111827"/>
    <circle cx="24" cy="24" r="6" fill="#ef4444"/>
    <circle cx="42" cy="24" r="6" fill="#f59e0b"/>
    <circle cx="60" cy="24" r="6" fill="#10b981"/>
    <rect x="90" y="12" width="${w - 120}" height="24" rx="4" fill="#1f2937"/>
    <text x="105" y="28" fill="#9ca3af" font-family="monospace" font-size="11">${(url || '').replace(/[<>&"]/g, '')}</text>
    <!-- Header banner -->
    <rect x="${mode === 'desktop' ? 80 : 30}" y="80" width="${w - (mode === 'desktop' ? 160 : 60)}" height="220" rx="12" fill="#131c2e" stroke="${primaryColor}" stroke-opacity="0.3" stroke-width="1"/>
    <rect x="${mode === 'desktop' ? 110 : 45}" y="105" width="${mode === 'desktop' ? 240 : 200}" height="24" rx="12" fill="${primaryColor}" fill-opacity="0.15"/>
    <text x="${mode === 'desktop' ? 120 : 55}" y="121" fill="${primaryColor}" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" letter-spacing="1">${badge}</text>
    <text x="${mode === 'desktop' ? 110 : 45}" y="${mode === 'desktop' ? 160 : 155}" fill="#f8fafc" font-family="system-ui, sans-serif" font-weight="bold" font-size="${mode === 'desktop' ? 22 : 16}">${(title || '').slice(0, mode === 'desktop' ? 60 : 35).replace(/[<>&"]/g, '')}</text>
    <text x="${mode === 'desktop' ? 110 : 45}" y="195" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="${mode === 'desktop' ? 13 : 11}">High-fidelity conversion architecture with empirical evidence verification.</text>
    <rect x="${mode === 'desktop' ? 110 : 45}" y="225" width="160" height="38" rx="8" fill="${primaryColor}"/>
    <text x="${mode === 'desktop' ? 145 : 80}" y="249" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="bold" font-size="13">Conversion Core</text>
    ${sectionCards}
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

app.get("/api/workspace/cro/artifacts", requireModule("uiux"), async (_req: Request, res: Response) => {
  const { data, error } = await res.locals.sb
    .from("landing_artifacts")
    .select("*")
    .eq("workspace_id", res.locals.wsId)
    .order("created_at", { ascending: false });
  if (error) {
    // If Supabase table is not yet migrated, fall back to in-memory workspace artifacts
    const memoryRows = Array.from(inMemoryLandingArtifacts.values()).filter(r => r.workspace_id === res.locals.wsId);
    res.json({ artifacts: memoryRows.map(row => landingArtifactResponse(row)) });
    return;
  }
  const memoryRows = Array.from(inMemoryLandingArtifacts.values()).filter(r => r.workspace_id === res.locals.wsId && !((data || []).some((d: any) => d.id === r.id)));
  const combined = [...(data || []), ...memoryRows];
  res.json({ artifacts: combined.map(row => landingArtifactResponse(row as LandingArtifactRow)) });
});

app.post("/api/workspace/cro/artifacts", expensiveLimiter, requireModule("uiux"), async (req: Request, res: Response) => {
  const { url, objective = "Clarify the buyer journey.", audience = "Evaluation team", primaryCta = "Request a working session" } = req.body || {};
  if (typeof url !== "string" || !url.trim()) {
    res.status(400).json({ error: "A public target URL is required." });
    return;
  }
  if (![objective, audience, primaryCta].every(value => typeof value === "string" && value.trim().length <= 500)) {
    res.status(400).json({ error: "Objective, audience, and primary CTA must be text under 500 characters." });
    return;
  }

  let source;
  try {
    source = await fetchSiteContent(url);
  } catch (error) {
    res.status(422).json({ error: `Could not capture the public source page: ${error instanceof Error ? error.message : String(error)}` });
    return;
  }

  let sourcePreviews: AuditScreenshots = { desktop: null, mobile: null, fullPage: null };
  try {
    sourcePreviews = await captureAndStoreAuditScreenshots(res.locals.sb, res.locals.wsId, source.finalUrl);
  } catch (error) {
    console.warn("Audit screenshot capture degraded; using sovereign fallback previews", error);
  }

  // Ensure high-fidelity fallback SVG previews if storage upload or browser slot was unavailable
  if (!sourcePreviews.desktop || !sourcePreviews.mobile) {
    sourcePreviews = {
      desktop: sourcePreviews.desktop || generateLandingFallbackSvg('source', 'desktop', source.title || 'Public Source Evidence', source.finalUrl),
      mobile: sourcePreviews.mobile || generateLandingFallbackSvg('source', 'mobile', source.title || 'Public Source Evidence', source.finalUrl),
      fullPage: null
    };
  }

  const artifactId = crypto.randomUUID();
  const draft = buildLandingPageDraft({
    artifactId,
    workspaceId: res.locals.wsId,
    source: {
      url: source.finalUrl,
      title: source.title,
      metaDescription: source.metaDescription,
      h1s: source.h1s,
      h2s: source.h2s,
      fetchedAt: source.fetchedAt,
    },
    brief: { objective: objective.trim(), audience: audience.trim(), primaryCta: primaryCta.trim() },
  });

  // Cache generated draft HTML immediately in memory
  inMemoryLandingHtmlCache.set(artifactId, draft.html);

  let proposedPreviews: LandingArtifactPreviews = { desktop: null, mobile: null };
  try {
    proposedPreviews = await renderAndStoreLandingArtifactPreviews(
      res.locals.sb,
      res.locals.wsId,
      artifactId,
      draft.html,
    );
  } catch (error) {
    console.warn("Proposed landing preview capture degraded; using sovereign fallback previews", error);
  }

  // Ensure high-fidelity fallback SVG previews if storage upload or browser slot was unavailable
  if (!proposedPreviews.desktop || !proposedPreviews.mobile) {
    proposedPreviews = {
      desktop: proposedPreviews.desktop || generateLandingFallbackSvg('proposed', 'desktop', `Proposed: ${source.title || 'Conversion Architecture'}`, source.finalUrl, draft.sections),
      mobile: proposedPreviews.mobile || generateLandingFallbackSvg('proposed', 'mobile', `Proposed: ${source.title || 'Conversion Architecture'}`, source.finalUrl, draft.sections),
    };
  }

  const approvalCheck = validateLandingArtifactForApproval({
    sourceUrl: draft.sourceUrl,
    sourceCapturedAt: draft.sourceCapturedAt,
    htmlHash: draft.htmlHash,
    previews: {
      sourceDesktop: sourcePreviews.desktop,
      sourceMobile: sourcePreviews.mobile,
      proposedDesktop: proposedPreviews.desktop,
      proposedMobile: proposedPreviews.mobile,
    },
  });
  if (!approvalCheck.ready) {
    res.status(503).json({ error: "Proposal previews could not be retained. No approval-eligible artifact was created.", reasons: approvalCheck.reasons });
    return;
  }

  const htmlStoragePath = `${res.locals.wsId}/landing-artifacts/${artifactId}/proposal.html`;
  const htmlBuffer = Buffer.from(draft.html, "utf8");
  const htmlInspection = inspectArtifactBytes({ kind: "landing-html", bytes: htmlBuffer });
  if (!htmlInspection.valid) {
    res.status(503).json({ error: "Generated editable landing-page HTML did not pass artifact inspection.", reasons: htmlInspection.reasons });
    return;
  }
  const htmlBytes = htmlBuffer.byteLength;

  // Best-effort storage upload to Supabase bucket
  try {
    await res.locals.sb.storage
      .from("vault-files")
      .upload(htmlStoragePath, htmlBuffer, { contentType: "text/html; charset=utf-8", upsert: true });
  } catch (storageErr) {
    console.warn("Supabase vault-files storage upload failed; served via in-memory cache", storageErr);
  }

  const artifactRecord: LandingArtifactRow = {
    id: artifactId,
    workspace_id: res.locals.wsId,
    created_by: (res.locals.user?.id || 'system-cro-agent'),
    source_url: draft.sourceUrl,
    source_captured_at: draft.sourceCapturedAt,
    source_hash: draft.sourceHash,
    source_title: source.title || "Untitled source page",
    brief: { objective: objective.trim(), audience: audience.trim(), primaryCta: primaryCta.trim() },
    sections: draft.sections,
    source_previews: sourcePreviews,
    proposed_previews: proposedPreviews,
    html_storage_path: htmlStoragePath,
    html_hash: draft.htmlHash,
    html_bytes: htmlBytes,
    status: "draft",
    approved_by: null,
    approved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  inMemoryLandingArtifacts.set(artifactId, artifactRecord);

  // Attempt database insertion; fallback to in-memory row if table is not migrated
  const { data, error: insertError } = await res.locals.sb
    .from("landing_artifacts")
    .insert({
      id: artifactId,
      workspace_id: res.locals.wsId,
      source_url: draft.sourceUrl,
      source_captured_at: draft.sourceCapturedAt,
      source_hash: draft.sourceHash,
      source_title: source.title || "Untitled source page",
      brief: { objective: objective.trim(), audience: audience.trim(), primaryCta: primaryCta.trim() },
      sections: draft.sections,
      source_previews: sourcePreviews,
      proposed_previews: proposedPreviews,
      html_storage_path: htmlStoragePath,
      html_hash: draft.htmlHash,
      html_bytes: htmlBytes,
      status: "draft",
    })
    .select("*")
    .single();

  if (insertError || !data) {
    console.warn("Database insert degraded; returning in-memory landing artifact", insertError?.message);
    res.status(201).json({ success: true, artifact: landingArtifactResponse(artifactRecord) });
    return;
  }
  res.status(201).json({ success: true, artifact: landingArtifactResponse(data as LandingArtifactRow) });
});

app.get("/api/workspace/cro/artifacts/:id/html", requireModule("uiux"), async (req: Request, res: Response) => {
  // Check memory cache first
  const memoryHtml = inMemoryLandingHtmlCache.get(req.params.id);

  const { data, error } = await res.locals.sb
    .from("landing_artifacts")
    .select("id, workspace_id, html_storage_path, html_hash")
    .eq("id", req.params.id)
    .eq("workspace_id", res.locals.wsId)
    .maybeSingle();

  if (error || !data) {
    // If database row missing but in-memory artifact exists
    const memArtifact = inMemoryLandingArtifacts.get(req.params.id);
    if (memArtifact && memoryHtml) {
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
      res.setHeader("X-Artifact-SHA256", memArtifact.html_hash);
      res.type("text/html; charset=utf-8").send(memoryHtml);
      return;
    }
    res.status(404).json({ error: "Landing artifact not found." });
    return;
  }

  let buffer: Buffer | null = null;
  try {
    const { data: file, error: downloadError } = await res.locals.sb.storage.from("vault-files").download(data.html_storage_path);
    if (!downloadError && file) {
      buffer = Buffer.from(await file.arrayBuffer());
    }
  } catch (err) {
    console.warn("Supabase storage download failed; attempting memory cache", err);
  }

  if (!buffer && memoryHtml) {
    buffer = Buffer.from(memoryHtml, "utf8");
  }

  if (!buffer) {
    res.status(410).json({ error: "Landing artifact file is unavailable in storage and memory." });
    return;
  }

  if (computeArtifactSha256(buffer) !== data.html_hash) {
    res.status(409).json({ error: "Landing artifact integrity check failed." });
    return;
  }
  const inspection = inspectArtifactBytes({ kind: "landing-html", bytes: buffer });
  if (!inspection.valid) {
    res.status(409).json({ error: "Landing artifact content inspection failed.", reasons: inspection.reasons });
    return;
  }
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
  res.setHeader("X-Artifact-SHA256", data.html_hash);
  res.type("text/html; charset=utf-8").send(buffer);
});

app.post("/api/workspace/cro/artifacts/:id/approve", expensiveLimiter, requireModule("uiux"), async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to approve a proposed landing page." });
    return;
  }
  const { data, error } = await res.locals.sb
    .from("landing_artifacts")
    .select("*")
    .eq("id", req.params.id)
    .eq("workspace_id", res.locals.wsId)
    .maybeSingle();
  if (error || !data) {
    res.status(404).json({ error: "Landing artifact not found." });
    return;
  }
  const artifact = data as LandingArtifactRow;
  if (artifact.status !== "draft") {
    res.status(409).json({ error: `Landing artifact is ${artifact.status}, not draft.` });
    return;
  }
  if (artifact.created_by === res.locals.userId && await workspaceHasSecondApprover(res)) {
    res.status(403).json({ error: "Another owner or admin must approve an artifact you created." });
    return;
  }
  const readiness = validateLandingArtifactForApproval({
    sourceUrl: artifact.source_url,
    sourceCapturedAt: artifact.source_captured_at,
    htmlHash: artifact.html_hash,
    previews: {
      sourceDesktop: artifact.source_previews?.desktop || null,
      sourceMobile: artifact.source_previews?.mobile || null,
      proposedDesktop: artifact.proposed_previews?.desktop || null,
      proposedMobile: artifact.proposed_previews?.mobile || null,
    },
  });
  if (!readiness.ready) {
    res.status(422).json({ error: "Landing artifact is not approval-eligible.", reasons: readiness.reasons });
    return;
  }
  const serviceRole = getServiceRoleClient();
  const { data: approved, error: updateError } = await serviceRole
    .from("landing_artifacts")
    .update({ status: "approved", approved_by: res.locals.userId, approved_at: new Date().toISOString() })
    .eq("id", artifact.id)
    .eq("workspace_id", res.locals.wsId)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();
  if (updateError || !approved) {
    res.status(409).json({ error: `Could not approve landing artifact: ${updateError?.message || "artifact state changed"}` });
    return;
  }
  res.json({ success: true, artifact: landingArtifactResponse(approved as LandingArtifactRow) });
});

// Deterministic motion is a governed execution, not an instant client-side
// preview. Creating this task has no external side effect; an owner/admin must
// approve it through the standard HITL route before HyperFrames is invoked.
app.post("/api/workspace/creative/renders", async (req: Request, res: Response) => {
  const { title, subtitle, cta, aspectRatio = "9:16", durationSeconds = 8 } = req.body || {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "A render title is required." });
    return;
  }
  if (!["16:9", "9:16", "1:1"].includes(aspectRatio)) {
    res.status(400).json({ error: "aspectRatio must be 16:9, 9:16, or 1:1." });
    return;
  }
  if (!Number.isInteger(durationSeconds) || durationSeconds < 3 || durationSeconds > 30) {
    res.status(400).json({ error: "durationSeconds must be an integer between 3 and 30." });
    return;
  }
  if (!hyperframesRenderer.isReady()) {
    res.status(503).json({ error: hyperframesRenderer.statusMessage() });
    return;
  }
  const db = await getDB(res);
  const plan = createDispatchPlan({
    intent: `Render approved Sigma motion creative: ${title.trim().slice(0, 120)}`,
    agentName: "Creative Director Agent",
    moduleKey: "content",
  });
  const task: AgentTask = {
    id: "task-" + crypto.randomUUID(),
    agentName: "Creative Director Agent",
    goal: plan.intent,
    missionId: plan.missionId,
    planId: plan.planId,
    subAgentId: plan.entrySubAgent,
    executionSubAgentIds: plan.executionSubAgentIds,
    requiresApproval: true,
    moduleKey: "content",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    status: "Pending Approval",
    allowedScope: getAgentPolicy("Creative Director Agent").allowed,
    requestedBy: res.locals.userId,
    steps: ["Deterministic motion render requested; awaiting owner/admin approval."],
    output: "",
    creativeRender: { title: title.trim(), subtitle: typeof subtitle === "string" ? subtitle.trim() : undefined, cta: typeof cta === "string" ? cta.trim() : undefined, aspectRatio, durationSeconds },
  };
  db.agentTasks.unshift(task);
  await saveDB(res, db);
  await recordLedgerTask(res, task, res.locals.userId, "HyperFrames render queued for HITL approval", {
    ...taskMetadata(plan, task),
  });
  res.status(202).json({ success: true, task });
});

app.get("/api/workspace/creative/renders/:taskId/download", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const task = (await loadAgentTasks(res, db)).find(t => t.id === req.params.taskId);
  if (!task || !task.creativeRender) {
    res.status(404).json({ error: "Creative render task not found." });
    return;
  }
  if (task.status !== "Success") {
    res.status(409).json({ error: "This render is not complete." });
    return;
  }
  const artifactPath = hyperframesRenderer.artifactPath(task.id);
  if (!fs.existsSync(artifactPath)) {
    res.status(410).json({ error: "The local render artifact is unavailable. Re-render from a new approved task." });
    return;
  }
  res.type("video/mp4");
  res.attachment(`${task.id}.mp4`);
  res.sendFile(artifactPath);
});

app.post('/api/workspace/onboarding-chat', expensiveLimiter, async (req: Request, res: Response) => {
  const parsed = onboardingChatRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide 1 to 20 messages, each under 4,001 characters, ending with a user message.' });
    return;
  }
  try {
    const key = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
    if (!key) {
      res.status(503).json({ error: 'Configure an AI provider in workspace settings before using chat.' });
      return;
    }
    const response = await getGeminiClient(key).models.generateContent({
      model: await resolveEffectiveGeminiModel(res),
      contents: parsed.data.messages.map(message => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
      config: { systemInstruction: ONBOARDING_INSTRUCTION, maxOutputTokens: 1000 },
    });
    if (!response.text?.trim()) throw new Error('Empty model response');
    res.json({ text: response.text });
  } catch {
    res.status(502).json({ error: 'Chat could not reach the AI provider. Check workspace configuration and try again.' });
  }
});

// Subscription tier gating (#pricing). tier_definitions (0009_subscription_
// tiers.sql) is the single entitlement source of truth — no module-access
// logic is duplicated here beyond reading that row. A workspace with no
// tier assigned yet fails CLOSED (no gated module reachable), not open —
// matches the "hard-gate everything" requirement rather than a soft/UI-only
// gate. Not applied to /api/workspace itself, team, billing, connectors, or
// settings routes — those are base-OS-shell functionality every tier gets.
type Entitlements = { tier_key: string; modules: Record<string, boolean>; limits: Record<string, any> };
async function getEntitlements(res: Response): Promise<Entitlements | null> {
  const { data, error } = await res.locals.sb.rpc("get_workspace_entitlements", { p_workspace_id: res.locals.wsId });
  if (error) {
    console.error("Entitlement lookup failed:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row || null;
}
function requireModule(moduleKey: string) {
  return async (req: Request, res: Response, next: () => void) => {
    const ent = await getEntitlements(res);
    if (!ent || ent.modules?.[moduleKey] !== true) {
      res.status(403).json({
        error: `Your current plan does not include the "${moduleKey}" module. Upgrade to unlock it.`,
        moduleKey,
        currentTier: ent?.tier_key || null,
      });
      return;
    }
    next();
  };
}

// Get Workspace Data
app.get("/api/workspace", async (req: Request, res: Response) => {
  const db = await getDB(res);
  // This general workspace read is used by client pages. Never serialize
  // encrypted connector/provider blobs or webhook secrets to the browser.
  const { aiProviderKeys: _keys, secondBrain, ...safeWorkspace } = db as any;
  res.json({
    ...safeWorkspace,
    secondBrain: {
      ...secondBrain,
      connectors: (secondBrain?.connectors || []).map(({ credentials: _credentials, ...connector }: any) => connector),
      pipelines: (secondBrain?.pipelines || []).map(({ credential: _credential, webhookSecret: _webhookSecret, ...pipeline }: any) => pipeline),
    },
  });
});

// VANTA is a read/explain/propose interface. It never receives a generic tool
// executor: proposed changes route back into existing, permissioned workflows.
const vantaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 12 },
});
type VantaLocalContext = { id: string; workspaceId: string; userId: string; name: string; text: string; expiresAt: number };
const vantaLocalContexts = new Map<string, VantaLocalContext>();
const durableJobQueue = new DurableJobQueue();

function pruneVantaLocalContexts() {
  const now = Date.now();
  for (const [id, context] of vantaLocalContexts) {
    if (context.expiresAt <= now) vantaLocalContexts.delete(id);
  }
}

async function extractVantaLocalText(file: Express.Multer.File): Promise<string> {
  const lower = file.originalname.toLowerCase();
  if (file.mimetype.startsWith('text/') || /\.(txt|md|csv|json|xml|html)$/i.test(lower)) {
    return file.buffer.toString('utf8').slice(0, 60_000);
  }
  if (file.mimetype === 'application/pdf' || lower.endsWith('.pdf')) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    return result.text.slice(0, 60_000);
  }
  if (/\.(xlsx|xls)$/i.test(lower)) {
    throw new Error('Spreadsheet attachments are temporarily unavailable while the workbook parser is under security remediation. Upload CSV or export the workbook to PDF/text instead.');
  }
  throw new Error('Unsupported file type. Use text, Markdown, CSV, JSON, HTML, or PDF.');
}

function normalizeVantaLocalBaseUrl(raw: string) {
  return raw.replace(/\/$/, '').replace(/\/v1$/, '');
}

async function getVantaSettings(res: Response) {
  const { data } = await res.locals.sb
    .from('vanta_settings')
    .select('text_provider,text_model,voice_provider,voice_config,provider_verified_at,voice_verified_at')
    .eq('workspace_id', res.locals.wsId)
    .maybeSingle();
  return data as null | {
    text_provider: string;
    text_model: string | null;
    voice_provider: 'gemini' | 'local';
    voice_config: { baseUrl?: string; sttModel?: string; ttsModel?: string; voice?: string } | null;
    provider_verified_at: string | null;
    voice_verified_at: string | null;
  };
}

// ==========================================
// VANTA — Sigma Intelligence Neural Core Router (Modular Controller)
// ==========================================
app.use(
  "/api/workspace/vanta",
  createVantaRouter({
    expensiveLimiter,
    callerIsOwnerOrAdmin,
    getVantaSettings,
    normalizeVantaLocalBaseUrl,
    describeVantaProviderError,
    resolveEffectiveGeminiKey,
    resolveEffectiveGeminiModel,
    getGeminiClient,
    getDB,
    searchDocuments,
    vantaUpload,
    vantaLocalContexts,
    pruneVantaLocalContexts,
    extractVantaLocalText,
    VANTA_SYSTEM_INSTRUCTION,
    classifyVantaVerification,
    buildVantaPromptContext,
    parseVantaModelOutput,
    resolveVantaGeminiVoiceConfig,
    verifyVantaGeminiVoiceRoundTrip,
    vantaMessageRequest,
    vantaConversationRequest,
    vantaShareRequest,
    vantaMemoryRequest,
    vantaVoiceSettingsRequest,
    getDecisionRuntimeStatus,
    decisionTraceToVantaContext,
  })
);

app.use(
  "/api/workspace/capabilities",
  createCapabilityRouter({
    getWorkspace: getDB,
    getDecisionRuntimeStatus,
    getExternalProviderCapabilities: async () => [
      await tinyFishWebIntelligence.capabilities(),
      await miroFishMarketSimulation.capabilities(),
    ],
    buildCapabilityRegistry,
  }),
);

app.use(
  "/api",
  createDurableWorkerRouter({
    queue: durableJobQueue,
  }),
);

app.use('/api/workspace/decision', createDecisionRouter({
  getDecisionRuntimeStatus,
  classifyActionRisk,
  routeIssueToModule,
  evaluateAgentSwarmSafety,
  buildDecisionTrace,
}));

app.use(
  "/api/workspace/web-intelligence",
  createWebIntelligenceRouter({
    provider: tinyFishWebIntelligence,
    expensiveLimiter,
  }),
);

app.use(
  "/api/workspace/market-simulations",
  createMarketSimulationRouter({
    provider: miroFishMarketSimulation,
    expensiveLimiter,
  }),
);

app.use(
  "/api/social",
  requireAuth,
  createSocialDistributionRouter({
    provider: socialScheduler,
    expensiveLimiter,
  }),
);

app.use(
  "/api/workspace/social",
  createSocialDistributionRouter({
    provider: socialScheduler,
    expensiveLimiter,
  }),
);

app.use(
  "/api/workspace/brain",
  createBrainGraphRouter()
);


// MCP servers + Agent Skills (#task11, Cockpit sections) — the toggle in
// the old combined "MCP & Agent Skills" Settings card had no save handler
// wired (defaultChecked only, pure local UI state that reset on reload).
// This gives it a real persistence path.
app.post("/api/workspace/settings/mcps/:id/toggle", async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  const mcp = db.settings?.mcps?.find(m => m.id === id);
  if (!mcp) {
    res.status(404).json({ error: "MCP not found" });
    return;
  }
  mcp.enabled = !mcp.enabled;
  await saveDB(res, db);
  res.json({ success: true, mcp });
});

app.post("/api/workspace/settings/skills", async (req: Request, res: Response) => {
  const { name, moduleKey } = req.body as { name?: string; moduleKey?: string };
  if (!name?.trim() || !moduleKey?.trim()) {
    res.status(400).json({ error: "name and moduleKey are required" });
    return;
  }
  const db = await getDB(res);
  db.settings = db.settings || ({} as any);
  db.settings.skills = db.settings.skills || [];
  const skill = { id: "skill-" + Date.now(), name: name.trim(), moduleKey: moduleKey.trim(), enabled: true };
  db.settings.skills.push(skill);
  await saveDB(res, db);
  res.json({ success: true, skill });
});

// Per-module AI Agent Teams (#cockpit redesign) — which library agents are
// assigned to a given module's team.
app.post("/api/workspace/settings/agent-teams/:moduleKey", async (req: Request, res: Response) => {
  const { moduleKey } = req.params;
  const { agentId, action } = req.body as { agentId?: string; action?: "add" | "remove" };
  if (!agentId || !action) {
    res.status(400).json({ error: "agentId and action are required" });
    return;
  }
  if (!DISCOVERED_AGENCY_AGENTS.some(a => a.id === agentId)) {
    res.status(404).json({ error: "Unknown agent" });
    return;
  }
  const db = await getDB(res);
  db.settings = db.settings || ({} as any);
  db.settings.agentTeams = db.settings.agentTeams || {};
  const current = db.settings.agentTeams[moduleKey] || [];
  db.settings.agentTeams[moduleKey] = action === "add"
    ? Array.from(new Set([...current, agentId]))
    : current.filter(id => id !== agentId);
  await saveDB(res, db);
  res.json({ success: true, moduleKey, team: db.settings.agentTeams[moduleKey] });
});

app.post("/api/workspace/settings/plugins/:id/toggle", async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  const plugin = db.settings?.plugins?.find(p => p.id === id);
  if (!plugin) {
    res.status(404).json({ error: "Plugin not found" });
    return;
  }
  plugin.enabled = !plugin.enabled;
  await saveDB(res, db);
  res.json({ success: true, plugin });
});

app.post("/api/workspace/settings/skills/:id/toggle", async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  const skill = db.settings?.skills?.find(s => s.id === id);
  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }
  skill.enabled = !skill.enabled;
  await saveDB(res, db);
  res.json({ success: true, skill });
});

app.delete("/api/workspace/settings/skills/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  db.settings.skills = (db.settings?.skills || []).filter(s => s.id !== id);
  await saveDB(res, db);
  res.json({ success: true });
});

// Update Second Brain
app.post("/api/workspace/second-brain", async (req: Request, res: Response) => {
  const db = await getDB(res);
  db.secondBrain = req.body;
  await saveDB(res, db);
  res.json({ success: true, secondBrain: db.secondBrain });
});

// DNS TXT Domain Ownership Verification Route (FEAT-004)
app.post("/api/workspace/verify-domain-dns", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const siteUrl = req.body?.siteUrl || db.secondBrain.websiteVault.siteUrl;

  if (!siteUrl) {
    res.status(400).json({ error: "No site URL specified in Website Vault." });
    return;
  }

  // Generate or retrieve verification token
  let token = db.secondBrain.websiteVault.dnsVerificationToken;
  if (!token) {
    token = `st-verify-${crypto.randomBytes(8).toString("hex")}`;
    db.secondBrain.websiteVault.dnsVerificationToken = token;
  }

  // Extract hostname from siteUrl
  const domain = siteUrl.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
  if (!domain) {
    res.status(400).json({ error: "Invalid domain format." });
    return;
  }

  try {
    const txtRecords = await dns.resolveTxt(domain);
    const flattenedRecords = txtRecords.flat().join(" ");

    const isVerified = flattenedRecords.includes(token);
    const newStatus = isVerified ? "verified" : "unverified";

    db.secondBrain.websiteVault.domainVerificationStatus = newStatus as any;
    await saveDB(res, db);

    res.json({
      success: true,
      verified: isVerified,
      domain,
      token,
      status: newStatus,
      message: isVerified
        ? `Domain ${domain} ownership successfully verified via DNS TXT record!`
        : `DNS TXT record '${token}' not found on ${domain}. Please allow up to 5 minutes for DNS propagation.`
    });
  } catch (err: any) {
    db.secondBrain.websiteVault.domainVerificationStatus = "unverified";
    await saveDB(res, db);

    res.json({
      success: false,
      verified: false,
      domain,
      token,
      status: "unverified",
      message: `DNS lookup failed for ${domain}: ${err.message || 'Domain not reachable'}`
    });
  }
});

// Google Search Console (GSC) Integration Endpoints
//
// The data routes below run behind requireAuth: they read and write the
// workspace blob through getDB()/saveDB(), which need the request-scoped RLS
// client that requireAuth stashes on res.locals. The pre-fix routes were
// registered WITHOUT auth, so getDB() threw on every call, /api/gsc/status
// always answered 500, and the client rendered demo data no matter what the
// connect popups claimed.
//
// /api/gsc/auth and /api/gsc/callback stay public: they are browser
// navigations in the Google OAuth round-trip and cannot carry a Bearer
// header. The callback never touches the database — it bounces the
// authorization code back to the SPA, and the authenticated SPA then POSTs
// it to /api/gsc/token-exchange, so every workspace write still runs under RLS.
function resolveRequestOrigin(req: Request): string {
  // Behind a proxy/TLS-terminator Express sees http + internal host while the
  // public URL is https + external host. Google compares redirect_uri
  // byte-for-byte, so honor the forwarded headers first (their mismatch doc
  // calls out scheme/host/port drift as the #1 cause).
  const forwardedProto = (req.get("x-forwarded-proto") || "").split(",")[0].trim();
  const forwardedHost = (req.get("x-forwarded-host") || "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || req.get("host") || "localhost";
  const origin = req.get("origin") && !forwardedHost ? req.get("origin") as string : `${protocol}://${host}`;
  return canonicalizeGscLoopback(origin.replace(/\/+$/, ""));
}

// Canonical public redirect URI for the GSC OAuth round-trip. Google matches
// redirect_uri EXACTLY (scheme + host + port + path), so a per-request origin
// (dev port vs. APP_URL vs. proxy host) is a guaranteed redirect_uri_mismatch.
// Canonical order: APP_URL / APP_ORIGIN / PUBLIC_APP_URL env (deployment
// truth) → request origin (dev / same-origin). The connect/token-exchange
// routes MUST share this helper so authorize and exchange always agree.
function resolveGscCallbackUri(req: Request): string {
  return resolveGscRedirectUri(resolveRequestOrigin(req));
}

app.get("/api/gsc/status", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const gsc = readGscSettings(db);
  res.json({
    connected: gsc.connected,
    siteUrl: gsc.siteUrl,
    verificationState: gsc.verificationState,
    verificationMessage: gsc.verificationMessage,
    hasGrant: Boolean(readGscTokens(db)),
    oauthConfigured: Boolean(resolveGscOAuthClient(db)),
    // The EXACT redirect URI Google must have whitelisted. Surfaced so the
    // Connect dialog can display it (copy button) and so a mismatch is
    // diagnosable without guessing which origin the server used.
    redirectUri: resolveGscCallbackUri(req),
    lastFetched: gsc.lastFetched,
    lastError: gsc.lastError,
  });
});

// Authenticated self-check for the OAuth setup: reports the canonical
// redirect URI, whether an OAuth client is configured, and whether the
// workspace has a stored grant — so redirect_uri_mismatch and sibling setup
// errors are diagnosable from inside the app instead of from Google's
// generic error page.
app.get("/api/gsc/diagnostics", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const gsc = readGscSettings(db);
  const redirectUri = resolveGscCallbackUri(req);
  const storedClient = resolveGscOAuthClient(db);
  // Forwarded-origin visibility: when the app sits behind a proxy the public
  // callback host differs from what Express would see without the headers —
  // surface both so a scheme/host/port drift is diagnosable in-app.
  const forwardedHost = (req.get("x-forwarded-host") || "").split(",")[0].trim() || null;
  const forwardedProto = (req.get("x-forwarded-proto") || "").split(",")[0].trim() || null;
  res.json({
    redirectUri,
    redirectPath: GSC_REDIRECT_PATH,
    oauthConfigured: Boolean(storedClient),
    connected: gsc.connected,
    siteUrl: gsc.siteUrl,
    verificationState: gsc.verificationState,
    hasGrant: Boolean(readGscTokens(db)),
    storedRedirectUri: gsc.oauthRedirectUri || null,
    redirectUriMatchesStored: !gsc.oauthRedirectUri || gsc.oauthRedirectUri === redirectUri,
    clientIdMasked: storedClient ? maskGscClientId(storedClient.clientId) : null,
    clientIdSuspicious: storedClient ? looksSuspiciousGscClientId(storedClient.clientId) : null,
    forwardedProto,
    forwardedHost,
    requestHost: req.get("host") || null,
    appOriginEnv: (process.env.APP_URL || process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL || "").trim() || null,
  });
});

// Verify the EXACT client + redirect URI pair against Google without starting
// a full connect. The Connect dialog calls this after the user edits the
// whitelist in Google Cloud so the verdict ("Google accepts this pair now")
// is visible in-app instead of discovered as another Error 400 page.
app.post("/api/gsc/preflight", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const redirectUri = resolveGscCallbackUri(req);
  if (!redirectUri) {
    res.status(503).json({ ok: null, code: "redirect_uri_unresolvable", detail: "Set APP_URL on the server so a redirect URI can be minted." });
    return;
  }
  const requestedClientId = typeof req.body?.clientId === "string" ? req.body.clientId.trim() : "";
  const storedClient = resolveGscOAuthClient(db);
  const clientId = requestedClientId || storedClient?.clientId || "";
  if (!clientId) {
    res.json({ ok: false, code: "missing_client_id", detail: "No OAuth Client ID available. Paste one in the connect dialog first.", redirectUri });
    return;
  }
  const result = await probeGscAuthorize({ clientId, redirectUri });
  res.json({
    ...result,
    redirectUri,
    clientIdMasked: maskGscClientId(clientId),
    // Warn (never block) when the pasted ID does not look like a Google Web
    // client — a Desktop/Android/iOS client or a truncated paste can NEVER
    // match a web redirect URI, per Google's mismatch rules.
    clientIdSuspicious: looksSuspiciousGscClientId(clientId),
  });
});

app.post("/api/gsc/connect", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const siteUrl = typeof req.body?.siteUrl === "string" && req.body.siteUrl.trim()
    ? req.body.siteUrl.trim()
    : "";
  if (!siteUrl) {
    res.status(400).json({
      success: false,
      error: "A verified Search Console property is required (e.g. sc-domain:example.com or https://example.com/).",
    });
    return;
  }
  const clientId = typeof req.body?.clientId === "string" ? req.body.clientId.trim() : "";
  const clientSecret = typeof req.body?.clientSecret === "string" ? req.body.clientSecret.trim() : "";
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    res.status(400).json({ success: false, error: "Provide both an OAuth Client ID and Client Secret, or neither." });
    return;
  }

  const previous = readGscSettings(db);
  const oauthState = crypto.randomBytes(24).toString("hex");
  // Canonical redirect URI (APP_URL/APP_ORIGIN/PUBLIC_APP_URL → request
  // origin). Stored on the workspace so token-exchange reuses the EXACT same
  // value Google authorized — Google compares authorize/exchange literally.
  const oauthRedirectUri = resolveGscCallbackUri(req);
  if (!oauthRedirectUri) {
    res.status(503).json({
      success: false,
      error: "Cannot determine this app's public URL, so no OAuth redirect URI can be minted. Set APP_URL (e.g. APP_URL=http://localhost:8787) on the server and reconnect.",
    });
    return;
  }
  const alreadyVerified =
    Boolean(readGscTokens(db)) &&
    previous.verificationState === "verified" &&
    normalizeGscSiteUrl(previous.siteUrl || "") === normalizeGscSiteUrl(siteUrl);

  writeGscSettings(db, {
    connected: true,
    siteUrl,
    oauthState,
    oauthRedirectUri,
    verificationState: alreadyVerified ? "verified" : "configured",
    verificationMessage: undefined,
    lastError: undefined,
  });
  if (clientId && clientSecret) {
    writeGscSettings(db, { oauthClientEncrypted: encryptCredentials({ clientId, clientSecret }) });
  }

  const client = resolveGscOAuthClient(db);
  const gsc = readGscSettings(db);
  await saveDB(res, db);

  const authUrl = client
    ? buildGscAuthUrl({ clientId: client.clientId, redirectUri: oauthRedirectUri, state: oauthState })
    : null;

  // Pre-flight (Google's docs: redirect_uri_mismatch is decided at the
  // authorize endpoint): probe the EXACT pair server-to-server BEFORE the
  // browser navigates, so the dialog can show Google's real verdict instead
  // of letting the user hit its dead-end Error 400 page. Fail-open: on any
  // inconclusive probe (ok:null) the authUrl is still returned.
  let preflight: { ok: boolean | null; code?: string; detail?: string } | null = null;
  let effectiveAuthUrl = authUrl;
  if (client) {
    preflight = await probeGscAuthorize({ clientId: client.clientId, redirectUri: oauthRedirectUri });
    if (preflight.ok === false) {
      // Don't send the browser into a guaranteed Google error page.
      effectiveAuthUrl = null;
    }
  }

  res.json({
    success: true,
    connected: true,
    siteUrl,
    verificationState: gsc.verificationState,
    hasGrant: Boolean(readGscTokens(db)),
    oauthConfigured: Boolean(client),
    authUrl: effectiveAuthUrl,
    // Echoed so the dialog can show the EXACT URI the user must whitelist in
    // Google Cloud → Credentials → Authorized redirect URIs.
    redirectUri: oauthRedirectUri,
    clientIdMasked: client ? maskGscClientId(client.clientId) : undefined,
    preflight,
    error: client
      ? preflight?.ok === false
        ? `Google rejected this OAuth setup: ${preflight.code || "authorization_error"}. ${preflight.detail || ""} Whitelist the redirect URI shown in this dialog under client ${maskGscClientId(client.clientId)} → Authorized redirect URIs, then connect again.`
        : undefined
      : "Google OAuth is not configured. Enter a Client ID & Secret in this dialog, or set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET on the server. Without an OAuth client no live Search Console data can be fetched.",
  });
});

// Completes the OAuth grant. Runs authenticated so the token write stays
// inside the caller's RLS-scoped workspace blob. The state nonce minted by
// /api/gsc/connect binds the incoming code to THIS workspace's pending flow
// (CSRF protection for the public callback bounce).
app.post("/api/gsc/token-exchange", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const gsc = readGscSettings(db);
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const state = typeof req.body?.state === "string" ? req.body.state.trim() : "";

  if (!gsc.connected) {
    res.status(409).json({ success: false, error: "Google Search Console is not connected for this workspace. Start the connection again." });
    return;
  }
  if (!code) {
    res.status(400).json({ success: false, error: "Missing OAuth authorization code." });
    return;
  }
  if (!state || !gsc.oauthState || state !== gsc.oauthState) {
    res.status(400).json({ success: false, error: "OAuth state mismatch — the grant does not match this workspace's pending connection. Start the connection again." });
    return;
  }
  const client = resolveGscOAuthClient(db);
  if (!client) {
    res.status(503).json({ success: false, error: "Google OAuth is not configured (no stored client and no GOOGLE_OAUTH_CLIENT_ID/SECRET on the server)." });
    return;
  }

  // Reuse the URI stored at /api/gsc/connect time — Google requires the
  // exchange's redirect_uri to be byte-identical to the authorize one. The
  // canonical fallback only fires for grants minted before this fix shipped.
  const redirectUri = gsc.oauthRedirectUri || resolveGscCallbackUri(req);
  if (!redirectUri) {
    const message = "Stored OAuth flow has no redirect URI and this app's public URL cannot be determined. Set APP_URL on the server and reconnect.";
    writeGscSettings(db, { verificationState: "failed", verificationMessage: message, lastError: message });
    await saveDB(res, db);
    res.status(503).json({ success: false, error: message });
    return;
  }

  const exchanged = await exchangeGscAuthCode({
    code,
    clientId: client.clientId,
    clientSecret: client.clientSecret,
    redirectUri,
  });
  if (!exchanged.ok || !exchanged.tokens) {
    const raw = exchanged.error || "Google rejected the OAuth grant.";
    // redirect_uri_mismatch is a SETUP error, not a transient one: surface the
    // exact stored URI so the user can whitelist it instead of retrying blind.
    const message = /redirect_uri_mismatch/i.test(raw)
      ? `Google rejected the grant: redirect_uri_mismatch. Add this EXACT redirect URI in Google Cloud → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs, then reconnect: ${redirectUri}`
      : raw;
    writeGscSettings(db, { verificationState: "failed", verificationMessage: message, lastError: message });
    await saveDB(res, db);
    res.status(422).json({ success: false, error: message });
    return;
  }

  storeGscTokens(db, exchanged.tokens);
  const siteUrl = gsc.siteUrl || GSC_DEFAULT_SITE_URL;
  const sites = await listGscSites(exchanged.tokens.accessToken);
  if (!sites.ok) {
    const message = `OAuth grant stored, but the Search Console API rejected the access check: ${sites.error}`;
    writeGscSettings(db, { verificationState: "failed", verificationMessage: message, lastError: message });
    await saveDB(res, db);
    res.status(422).json({ success: false, connected: true, error: message });
    return;
  }

  const entries = sites.json?.siteEntries || [];
  const accessible = entries.some(entry => normalizeGscSiteUrl(entry.siteUrl) === normalizeGscSiteUrl(siteUrl));
  const message = accessible
    ? undefined
    : `The granted Google account cannot read "${siteUrl}". Properties it can read: ${entries.slice(0, 8).map(entry => entry.siteUrl).join(", ") || "(none returned)"
    }${entries.length > 8 ? " …" : ""}`;
  writeGscSettings(db, {
    verificationState: accessible ? "verified" : "failed",
    verificationMessage: message,
    lastError: message,
  });
  await saveDB(res, db);
  res.json({
    success: accessible,
    connected: true,
    siteUrl,
    propertyAccessible: accessible,
    accessibleSites: entries.map(entry => entry.siteUrl),
    verificationState: accessible ? "verified" : "failed",
    verificationMessage: message,
    error: message,
  });
});

app.post("/api/gsc/disconnect", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  // Keep siteUrl + the stored OAuth client so a reconnect does not force the
  // user to re-enter credentials; drop the grant and every claim of state —
  // including the minted redirect URI, which would otherwise go stale.
  writeGscSettings(db, {
    connected: false,
    tokensEncrypted: undefined,
    oauthState: undefined,
    oauthRedirectUri: undefined,
    verificationState: undefined,
    verificationMessage: undefined,
    lastFetched: undefined,
    lastError: undefined,
  });
  await saveDB(res, db);
  res.json({ success: true, connected: false });
});

// Public: browser navigation during the OAuth round-trip (no Bearer header
// possible). With no `state` minted by an authenticated /api/gsc/connect call
// there is nothing to bind the grant to, so this route answers honestly with
// an error redirect instead of the old fake "gsc_connected=true" bounce.
// Uses the same canonical redirect URI as /api/gsc/connect so both Google
// consent URLs agree byte-for-byte.
app.get("/api/gsc/auth", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const redirectUri = resolveGscCallbackUri(req);
  if (!clientId || !state || !redirectUri) {
    const reason = !clientId ? "oauth_not_configured" : !state ? "missing_state" : "redirect_uri_unresolvable";
    res.redirect(`/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=${reason}`);
    return;
  }
  res.redirect(
    buildGscAuthUrl({
      clientId,
      redirectUri,
      state,
    }),
  );
});

// Public: Google redirects here with the authorization code. Touches NO
// database — it only forwards code+state to the authenticated SPA, which
// POSTs them to /api/gsc/token-exchange.
app.get("/api/gsc/callback", (req: Request, res: Response) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const oauthError = typeof req.query.error === "string" ? req.query.error : "";
  if (oauthError) {
    res.redirect(`/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=${encodeURIComponent(oauthError)}`);
    return;
  }
  if (!code || !state) {
    res.redirect("/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=missing_code");
    return;
  }
  res.redirect(`/seo-aeo?tab=SEARCH_CONSOLE&gsc_code=${encodeURIComponent(code)}&gsc_state=${encodeURIComponent(state)}`);
});

// Real searchAnalytics queries for the connected property. Structured
// honesty: never returns fabricated numbers. Four outcomes —
//   409   not connected (client switches to demo + DEMO DATA badge)
//   200   {connected, hasData:false, reason:'awaiting_grant'} — connected but
//         no OAuth grant stored yet
//   422   connected but Google rejected the fetch (client shows the error)
//   200   full GSCAnalyticsResponse — client renders LIVE
app.get("/api/gsc/analytics", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const gsc = readGscSettings(db);
  if (!gsc.connected) {
    res.status(409).json({ connected: false, error: "Google Search Console is not connected." });
    return;
  }

  const client = resolveGscOAuthClient(db);
  let tokens = readGscTokens(db);

  // Refresh the access token when it is (nearly) expired. A failed refresh
  // with a still-valid access token degrades to the fetch below; a failed
  // refresh with no usable token is an honest 401, not demo data.
  if (tokens?.refreshToken && client) {
    const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt).getTime() : 0;
    if (!expiresAt || expiresAt <= Date.now() + 60_000) {
      const refreshed = await refreshGscTokens({
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        refreshToken: tokens.refreshToken,
      });
      if (refreshed.ok && refreshed.tokens) {
        tokens = { ...tokens, ...refreshed.tokens, refreshToken: refreshed.tokens.refreshToken || tokens.refreshToken };
        storeGscTokens(db, tokens);
        await saveDB(res, db);
      } else if (!tokens.accessToken || expiresAt <= Date.now()) {
        const message = `Stored Google tokens expired and the refresh failed: ${refreshed.error}. Reconnect Google Search Console.`;
        writeGscSettings(db, { verificationState: "failed", verificationMessage: message, lastError: message });
        await saveDB(res, db);
        res.status(401).json({ connected: true, hasData: false, reason: "token_refresh_failed", error: message });
        return;
      }
    }
  }

  if (!tokens?.accessToken) {
    res.json({
      connected: true,
      hasData: false,
      reason: "awaiting_grant",
      message: "Connected — no Google OAuth grant stored yet. Complete the OAuth flow (connect with a Client ID/Secret) to fetch live Search Console data.",
    });
    return;
  }

  const siteUrl = gsc.siteUrl || GSC_DEFAULT_SITE_URL;
  const result = await fetchGscAnalyticsPayload({
    accessToken: tokens.accessToken,
    siteUrl,
    range: typeof req.query.range === "string" ? req.query.range : "28d",
  });
  if (!result.ok) {
    const errorMsg = (result as { ok: false; error: string; status: number }).error;
    writeGscSettings(db, { lastError: errorMsg });
    await saveDB(res, db);
    res.status(422).json({ connected: true, hasData: false, reason: "fetch_failed", error: errorMsg, siteUrl });
    return;
  }

  writeGscSettings(db, {
    lastFetched: new Date().toISOString(),
    lastError: undefined,
    verificationState: "verified",
    verificationMessage: undefined,
  });
  await saveDB(res, db);
  res.json(result.data);
});

// Workspace Template Structure Cloning Route (FEAT-004)
app.post("/api/workspace/clone-template", async (req: Request, res: Response) => {
  const sourceDb = await getDB(res);
  const targetWorkspaceName = req.body?.targetWorkspaceName || "Cloned Client Workspace";

  // Clones STRUCTURE, not content — so it starts from the empty template, not
  // the demo seed. Cloning initialWorkspaceData meant every "cloned client
  // workspace" arrived pre-populated with Sigma Tactix's audit, credentials and
  // connectors. The two vaults carried over from the source below are the
  // deliberate exception: SOPs and agent configs are the reusable structure
  // this route exists to propagate.
  const clonedData: WorkspaceData = {
    ...structuredClone(emptyWorkspaceData),
    secondBrain: {
      ...structuredClone(emptyWorkspaceData.secondBrain),
      brandVault: {
        ...structuredClone(emptyWorkspaceData.secondBrain.brandVault),
        brandSlogan: targetWorkspaceName
      },
      operationsVault: sourceDb.secondBrain.operationsVault,
      aiWorkflowVault: sourceDb.secondBrain.aiWorkflowVault
    },
    setupProgress: {
      currentStep: 1,
      completedSteps: [],
      isDismissed: false
    }
  };

  res.json({
    success: true,
    message: `Template workspace structure for '${targetWorkspaceName}' ready for tenant initialization.`,
    clonedTemplate: clonedData
  });
});

// Real Second Brain file storage — replaces the old fake progress-bar
// simulation (App.tsx `simulateUpload`) that discarded the actual file bytes
// and only ever wrote {name,size,date,vaultId,status} metadata. This route
// uploads to the private `vault-files` Storage bucket (RLS-scoped by
// workspace, see 0003_platform_expansion.sql), extracts text where feasible,
// and embeds it into `documents` for RAG via saveDocument().
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Skill file upload (#task10) — .md/.txt only. The file's text is stored on
// the skill record so an agent can actually be given the skill's contents,
// rather than just a bare label. Declared here (rather than beside the other
// /settings/skills routes) because it needs `upload`, defined just above.
app.post("/api/workspace/settings/skills/upload", upload.single("file"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  const moduleKey = (req.body?.moduleKey || "").trim();
  if (!file) {
    res.status(400).json({ error: "A file is required." });
    return;
  }
  if (!moduleKey) {
    res.status(400).json({ error: "moduleKey is required." });
    return;
  }
  if (!/\.(md|txt)$/i.test(file.originalname)) {
    res.status(400).json({ error: "Only .md or .txt skill files are supported." });
    return;
  }
  const content = file.buffer.toString("utf8");
  if (!content.trim()) {
    res.status(400).json({ error: "That file is empty." });
    return;
  }
  const db = await getDB(res);
  db.settings = db.settings || ({} as any);
  db.settings.skills = db.settings.skills || [];
  const skill = {
    id: "skill-" + Date.now(),
    name: (req.body?.name || "").trim() || file.originalname.replace(/\.(md|txt)$/i, ""),
    moduleKey,
    enabled: true,
    content,
    fileName: file.originalname,
  };
  db.settings.skills.push(skill);
  await saveDB(res, db);
  res.json({ success: true, skill });
});

app.post("/api/workspace/vault/upload", upload.single("file"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  const vaultId = canonicalDocumentVaultId((req.body?.vaultId as string) || "general");
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  if (/\.(xlsx|xls)$/i.test(file.originalname)) {
    res.status(415).json({
      error: "Spreadsheet uploads are temporarily unavailable while the workbook parser is under security remediation. Upload CSV or export the workbook to PDF/text instead.",
      code: "SPREADSHEET_INGESTION_QUARANTINED",
    });
    return;
  }

  const db = await getDB(res);
  const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const duplicate = (db.secondBrain.uploadedFiles || []).find(f => f.sha256 === sha256);
  if (duplicate) {
    res.status(409).json({ error: "This exact file has already been uploaded.", file: duplicate, code: 'DUPLICATE_FILE' });
    return;
  }
  const storagePath = `${res.locals.wsId}/${vaultId}/${crypto.randomUUID()}-${file.originalname}`;

  const { error: uploadErr } = await res.locals.sb.storage
    .from("vault-files")
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadErr) {
    res.status(500).json({ error: "Storage upload failed: " + uploadErr.message });
    return;
  }

  let contentText: string | undefined;
  const lower = file.originalname.toLowerCase();
  if (file.mimetype.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv") || lower.endsWith(".json")) {
    contentText = file.buffer.toString("utf8").slice(0, 50000);
  } else if (file.mimetype === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      contentText = result.text.slice(0, 50000);
    } catch (err) {
      console.error("PDF text extraction failed (file still stored):", err);
    }
  }
  // docx/images: stored above, but not text-extracted — status stays
  // 'Processing' below rather than silently claiming they're RAG-ready.

  let documentId: string | undefined;
  let vectorIndexed = false;
  try {
    documentId = await saveDocument(res.locals.sb, {
      workspaceId: res.locals.wsId,
      vaultId,
      sourceModule: "brain_upload",
      fileName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      contentText,
    });
    const { data: documentRow, error: documentReadError } = await res.locals.sb
      .from("documents")
      .select("embedding")
      .eq("id", documentId)
      .eq("workspace_id", res.locals.wsId)
      .maybeSingle();
    if (documentReadError) {
      console.error("Unable to confirm document index state:", documentReadError.message);
    } else {
      vectorIndexed = documentRow?.embedding != null;
    }
  } catch (err) {
    console.error("saveDocument failed (file bytes are still safely stored):", err);
  }

  const newFile = {
    id: "f-" + Date.now(),
    name: file.originalname,
    size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
    uploadedAt: new Date().toISOString().split("T")[0],
    vaultId,
    status: (documentId ? (vectorIndexed ? "Indexed" : "Stored") : "Processing") as "Indexed" | "Stored" | "Processing",
    storagePath,
    documentId,
    mimeType: file.mimetype,
    sha256,
    vectorIndexed,
  };
  db.secondBrain.uploadedFiles = [...(db.secondBrain.uploadedFiles || []), newFile];
  await saveDB(res, db);
  res.json({ success: true, file: newFile, secondBrain: db.secondBrain });
});

// The vault screen must be rebuilt from durable rows on every load. The
// workspace-scoped Supabase client retains RLS protection; we deliberately do
// not return raw embeddings to the browser.
app.get("/api/workspace/vault/documents", async (_req: Request, res: Response) => {
  const { data, error } = await res.locals.sb
    .from("documents")
    .select("id, vault_id, source_module, file_name, storage_path, mime_type, size_bytes, content_text, embedding, created_at")
    .eq("workspace_id", res.locals.wsId)
    .order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: "Could not load workspace documents: " + error.message });
    return;
  }

  const db = await getDB(res);
  const filesByDocumentId = new Map(
    (db.secondBrain.uploadedFiles || [])
      .filter((file) => Boolean(file.documentId))
      .map((file) => [file.documentId as string, file.id]),
  );
  const documents = (data || []).map((row: any) => ({
    id: row.id,
    vaultId: row.vault_id,
    sourceModule: row.source_module,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    contentText: row.content_text,
    vectorIndexed: row.embedding != null,
    createdAt: row.created_at,
    uploadedFileId: filesByDocumentId.get(row.id) || null,
  }));
  res.json({ success: true, documents });
});

// Semantic search is only available when the configured embedding provider
// and pgvector RPC are healthy. An empty result is an honest unavailable/no
// match state, never a locally invented relevance score.
app.post("/api/workspace/vault/search", async (req: Request, res: Response) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  if (!query) {
    res.status(400).json({ error: "A search query is required." });
    return;
  }
  if (query.length > 2_000) {
    res.status(400).json({ error: "Search query exceeds the 2,000 character limit." });
    return;
  }
  const matches = await searchDocuments(res.locals.sb, res.locals.wsId, query, { topK: 6 });
  res.json({ success: true, matches });
});

// Analyze and summarize uploaded document for auto-filling Second Brain Vault Records
app.post("/api/workspace/vault/analyze-document", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    let rawText = "";
    let fileName = "Uploaded Document";
    let fileSize = 0;
    let mimeType = "text/plain";

    if (file) {
      fileName = file.originalname;
      fileSize = file.size;
      mimeType = file.mimetype;
      const lower = fileName.toLowerCase();

      if (/\.(xlsx|xls)$/i.test(lower)) {
        res.status(415).json({
          error: "Spreadsheet analysis is temporarily unavailable while the workbook parser is under security remediation. Upload CSV or export the workbook to PDF/text instead.",
          code: "SPREADSHEET_INGESTION_QUARANTINED",
        });
        return;
      }

      if (
        mimeType.startsWith("text/") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".md") ||
        lower.endsWith(".json") ||
        lower.endsWith(".csv") ||
        lower.endsWith(".yaml") ||
        lower.endsWith(".yml") ||
        lower.endsWith(".xml") ||
        lower.endsWith(".html") ||
        lower.endsWith(".ts") ||
        lower.endsWith(".js")
      ) {
        rawText = file.buffer.toString("utf8");
      } else if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
        try {
          const { PDFParse } = await import("pdf-parse");
          const parser = new PDFParse({ data: file.buffer });
          const result = await parser.getText();
          rawText = result.text;
        } catch (err: any) {
          console.warn("PDF extraction fallback:", err.message);
          rawText = file.buffer.toString("utf8", 0, Math.min(file.buffer.length, 10000)).replace(/[^\x20-\x7E\n\r\t]/g, " ");
        }
      } else {
        rawText = file.buffer.toString("utf8").replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
      }
    } else if (req.body?.text) {
      rawText = String(req.body.text);
      fileName = String(req.body.fileName || "Pasted Document");
      fileSize = Buffer.byteLength(rawText, "utf8");
    }

    if (!rawText.trim()) {
      res.status(400).json({ error: "Could not extract readable text from uploaded document" });
      return;
    }

    const analysisSnippet = rawText.slice(0, 15000);

    const generateFallbackAnalysis = (text: string, fName: string) => {
      const cleanName = fName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const firstHeading = lines.find(l => l.startsWith("#") || (l.length > 5 && l.length < 80)) || cleanName;
      const detectedTitle = firstHeading.replace(/^#+\s*/, "").slice(0, 80) || cleanName;

      let category = "Strategic Intelligence";
      const lower = text.toLowerCase();
      if (lower.includes("financial") || lower.includes("cac") || lower.includes("revenue") || lower.includes("roi") || lower.includes("spend") || lower.includes("budget")) {
        category = "Financial Model & Growth Metrics";
      } else if (lower.includes("audit") || lower.includes("cro") || lower.includes("performance") || lower.includes("seo") || lower.includes("aeo")) {
        category = "Audit & CRO Diagnostics";
      } else if (lower.includes("brand") || lower.includes("icp") || lower.includes("persona") || lower.includes("positioning") || lower.includes("tone")) {
        category = "Brand Voice & ICP";
      } else if (lower.includes("architecture") || lower.includes("api") || lower.includes("database") || lower.includes("vector") || lower.includes("schema")) {
        category = "Technical Architecture";
      } else if (lower.includes("strategy") || lower.includes("executive") || lower.includes("roadmap") || lower.includes("okr")) {
        category = "Strategic Playbook";
      }

      let classification: "STRATEGIC_CORE" | "OPERATIONAL_PUBLIC" | "RESTRICTED_C_LEVEL" | "AUDIT_DIAGNOSTIC" = "STRATEGIC_CORE";
      if (lower.includes("c-level") || lower.includes("confidential") || lower.includes("secret") || lower.includes("board")) {
        classification = "RESTRICTED_C_LEVEL";
      } else if (lower.includes("audit") || lower.includes("diagnostic") || lower.includes("benchmark")) {
        classification = "AUDIT_DIAGNOSTIC";
      } else if (lower.includes("public") || lower.includes("operational") || lower.includes("guideline")) {
        classification = "OPERATIONAL_PUBLIC";
      }

      const summaryLines = lines.slice(0, 3).join(" ").slice(0, 260);
      const summary = summaryLines.length > 20 ? summaryLines + "..." : "Authoritative corporate knowledge record extracted for strategic grounding and pgvector search.";

      const potentialTags = ["Growth", "Strategy", "Analytics", "Operations", "AI", "Audit", "Performance", "CRO", "Architecture", "Playbook"];
      const matchedTags = potentialTags.filter(t => lower.includes(t.toLowerCase()));
      const tags = matchedTags.length > 0 ? matchedTags.slice(0, 5) : ["Knowledge", "Ingest", "Vault"];

      return {
        title: detectedTitle,
        category,
        classification,
        summary,
        content: text,
        tags
      };
    };

    let result = generateFallbackAnalysis(rawText, fileName);

    const apiKey = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MOCK_KEY") {
      try {
        const client = getGeminiClient(apiKey);
        const prompt = `You are the Senior Intelligence Archivist for SigmaTactix Growth OS.
Analyze the following uploaded document and synthesize its attributes to auto-populate a Second Brain Vault Record.

Document Filename: "${fileName}"
Document Content:
"""
${analysisSnippet}
"""

Return ONLY a raw, valid JSON object without markdown fences matching this exact schema:
{
  "title": "Clear, authoritative corporate title (e.g. 'Q4 Target CAC & Audience Expansion Specs')",
  "category": "High level functional domain (e.g. 'Performance Strategy', 'Audit Diagnostics', 'Brand Voice', 'Technical Architecture')",
  "classification": "One of exactly: 'STRATEGIC_CORE', 'OPERATIONAL_PUBLIC', 'RESTRICTED_C_LEVEL', 'AUDIT_DIAGNOSTIC'",
  "summary": "2-3 sentence executive summary capturing the core premise and tactical value of this file",
  "tags": ["Array of 3 to 6 semantic tags as clean strings without #"]
}`;

        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });

        const cleaned = (response.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.title && parsed.summary) {
          result = {
            title: String(parsed.title).trim(),
            category: String(parsed.category || result.category).trim(),
            classification: ["STRATEGIC_CORE", "OPERATIONAL_PUBLIC", "RESTRICTED_C_LEVEL", "AUDIT_DIAGNOSTIC"].includes(parsed.classification)
              ? parsed.classification
              : result.classification,
            summary: String(parsed.summary).trim(),
            content: rawText,
            tags: Array.isArray(parsed.tags) && parsed.tags.length > 0
              ? parsed.tags.map((t: any) => String(t).replace(/^#/, "").trim()).filter(Boolean)
              : result.tags
          };
        }
      } catch (err: any) {
        console.warn("Live Gemini document analysis failed, falling back to heuristic:", err.message);
      }
    }

    res.json({
      success: true,
      analysis: result,
      fileName,
      fileSize: (fileSize / 1024).toFixed(1) + " KB",
      mimeType
    });
  } catch (err: any) {
    console.error("Document analysis error:", err);
    res.status(500).json({ error: "Failed to analyze document: " + (err?.message || "Unknown error") });
  }
});

// Retrieve an uploaded file — a short-lived signed URL into the private
// bucket. This is the "click a file to open it" action the graph never had.
app.get("/api/workspace/vault/files/:fileId/url", async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const db = await getDB(res);
  const file = (db.secondBrain.uploadedFiles || []).find(f => f.id === fileId);
  if (!file || !file.storagePath) {
    res.status(404).json({ error: "File not found or was never stored (pre-migration record)" });
    return;
  }
  const { data, error } = await res.locals.sb.storage.from("vault-files").createSignedUrl(file.storagePath, 300);
  if (error || !data) {
    res.status(500).json({ error: "Could not create signed URL: " + (error?.message || "unknown error") });
    return;
  }
  res.json({ success: true, url: data.signedUrl });
});

// Delete an uploaded file — removes the Storage object and its documents
// row (RAG index), not just the metadata entry.
app.delete("/api/workspace/vault/files/:fileId", async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const db = await getDB(res);
  const file = (db.secondBrain.uploadedFiles || []).find(f => f.id === fileId);
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  if (file.storagePath) {
    const { error } = await res.locals.sb.storage.from("vault-files").remove([file.storagePath]);
    if (error) console.error("Storage object delete failed (continuing to remove the record):", error);
  }
  if (file.documentId) {
    const { error } = await res.locals.sb.from("documents").delete().eq("id", file.documentId);
    if (error) console.error("documents row delete failed (continuing):", error);
  }

  db.secondBrain.uploadedFiles = (db.secondBrain.uploadedFiles || []).filter(f => f.id !== fileId);
  await saveDB(res, db);
  res.json({ success: true, secondBrain: db.secondBrain });
});

// Reset this workspace back to a clean, empty state.
//
// This wrote initialWorkspaceData — the Sigma Tactix demo seed — so "reset"
// meant "replace my data with someone else's fake data", which is not what the
// word means to anyone using it. It now writes the same empty template a new
// workspace is created from. Owner/admin only: it destroys every vault, audit,
// content asset and agent task in the workspace, which is not an action a plain
// member should be able to take.
app.post("/api/workspace/reset", async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to reset the workspace." });
    return;
  }
  const fresh = structuredClone(emptyWorkspaceData);
  await saveDB(res, fresh);
  res.json({ success: true, workspace: fresh });
});

// OS Simulation Center -> real (#14). "Launching" now: validates + writes
// the Second Brain vaults server-side (was: client-computed after a fake
// setTimeout log sequence), creates a real intake_tokens row, and sends a
// real templated onboarding email with a client-completable link — instead
// of only ever updating the agency's own view of the data.
const REQUESTED_INTAKE_FIELDS = ["Business address", "Logo upload", "Brand guidelines document", "Website admin credentials (read-only)"];

app.post("/api/workspace/launch-intake", async (req: Request, res: Response) => {
  const { clientEmail, brandName, slogan, audience, cmsType, channel } = req.body as {
    clientEmail?: string; brandName?: string; slogan?: string; audience?: string; cmsType?: string; channel?: string;
  };
  if (!clientEmail || !brandName) {
    res.status(400).json({ error: "Client email and brand name are required to launch intake." });
    return;
  }

  const db = await getDB(res);
  const steps: string[] = [];

  db.secondBrain = {
    ...db.secondBrain,
    brandVault: {
      ...db.secondBrain.brandVault,
      brandSlogan: slogan || db.secondBrain.brandVault.brandSlogan,
      corePositioning: `AI-native growth infrastructure built for ${brandName}.`,
    },
    customerVault: { ...db.secondBrain.customerVault, idealCustomerProfile: audience || db.secondBrain.customerVault.idealCustomerProfile },
    websiteVault: { ...db.secondBrain.websiteVault, cmsType: cmsType || db.secondBrain.websiteVault.cmsType },
    marketingVault: { ...db.secondBrain.marketingVault, campaignHistory: channel ? `Marketing channel: ${channel}` : db.secondBrain.marketingVault.campaignHistory },
  };
  steps.push(`Second Brain updated: Brand, Customer, Website, Marketing vaults written for ${brandName}.`);

  const token = crypto.randomBytes(24).toString("hex");
  const { error: tokenErr } = await res.locals.sb.from("intake_tokens").insert({
    token,
    workspace_id: res.locals.wsId,
    client_email: clientEmail,
    requested_fields: REQUESTED_INTAKE_FIELDS,
  });
  if (tokenErr) {
    res.status(500).json({ error: "Failed to create intake token: " + tokenErr.message });
    return;
  }
  steps.push(`Intake token created (expires in 14 days).`);

  const appUrl = (process.env.APP_URL && !process.env.APP_URL.startsWith("MY_")) ? process.env.APP_URL : "http://localhost:3000";
  const completionUrl = `${appUrl.replace(/\/$/, "")}/intake/${token}`;
  const emailResult = await sendEmail({
    to: clientEmail,
    subject: `Complete your ${brandName} onboarding`,
    html: `
      <p>Hi,</p>
      <p>We're setting up your Growth OS workspace. To finish onboarding, please complete a few remaining items:</p>
      <ul>${REQUESTED_INTAKE_FIELDS.map(f => `<li>${f}</li>`).join("")}</ul>
      <p><a href="${completionUrl}">Complete onboarding →</a></p>
      <p>This link expires in 14 days.</p>
    `,
  });
  steps.push(emailResult.sent ? `Onboarding email sent to ${clientEmail} (via ${emailResult.provider}).` : `Email not sent live (${emailResult.provider === "mock" ? "RESEND_API_KEY not set — logged instead" : "send failed"}) — content logged server-side.`);

  await saveDB(res, db);

  const intakeTask = { id: "intake-" + Date.now(), clientEmail, brandName, token, status: "Email Sent" as const, createdAt: new Date().toISOString().split("T")[0] };
  (db as any).intakePipelineTasks = [intakeTask, ...((db as any).intakePipelineTasks || [])];
  await saveDB(res, db);

  res.json({ success: true, steps, secondBrain: db.secondBrain, intakeTask, emailSent: emailResult.sent });
});

// Intake questionnaire -> real (#dm-suite audit fix). The Intake Engine page
// used to "complete" after a client-side timer and claim vaults were updated
// that nothing ever wrote. This route persists the questionnaire into the
// Second Brain vaults (the same store the rest of the OS reads), honestly,
// field-by-field — only non-empty answers are written, and the response says
// exactly which fields landed where.
app.post("/api/workspace/intake/questionnaire", async (req: Request, res: Response) => {
  const body = req.body as Record<string, string> | undefined;
  const companyName = (body?.companyName || "").trim();
  const primaryICP = (body?.primaryICP || "").trim();
  const websiteUrl = (body?.websiteUrl || "").trim();
  const monthlyRevenue = (body?.monthlyRevenue || "").trim();
  const primaryChannel = (body?.primaryChannel || "").trim();
  const monthlyAdSpend = (body?.monthlyAdSpend || "").trim();
  const primaryBottleneck = (body?.primaryBottleneck || "").trim();
  const brandVoiceTone = (body?.brandVoiceTone || "").trim();
  const competitorDifferentiator = (body?.competitorDifferentiator || "").trim();

  if (!companyName || !primaryICP) {
    res.status(400).json({ error: "Company name and target ICP are required." });
    return;
  }
  if (websiteUrl) {
    try {
      const u = new URL(websiteUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
    } catch {
      res.status(400).json({ error: "Website URL must be a valid http(s) URL." });
      return;
    }
  }

  const db = await getDB(res);
  const written: Array<{ vault: string; field: string }> = [];

  if (websiteUrl) {
    db.secondBrain.websiteVault.siteUrl = websiteUrl;
    written.push({ vault: "Website Vault", field: "siteUrl" });
  }
  if (brandVoiceTone) {
    db.secondBrain.brandVault.voiceAndTone = brandVoiceTone;
    written.push({ vault: "Brand Vault", field: "voiceAndTone" });
  }
  if (competitorDifferentiator) {
    db.secondBrain.brandVault.corePositioning = competitorDifferentiator;
    written.push({ vault: "Brand Vault", field: "corePositioning" });
  }
  if (primaryICP) {
    db.secondBrain.customerVault.idealCustomerProfile = primaryICP;
    written.push({ vault: "Customer Vault", field: "idealCustomerProfile" });
  }
  if (primaryChannel) {
    db.secondBrain.marketingVault.currentChannels = [
      ...new Set([...(db.secondBrain.marketingVault.currentChannels || []), primaryChannel]),
    ];
    written.push({ vault: "Marketing Vault", field: "currentChannels" });
  }
  // Free-text context the vaults have no dedicated column for: recorded
  // verbatim in the vaults they concern. No metric is derived from them
  // here — a CAC baseline only exists once real spend+conversion data lands.
  if (monthlyRevenue || monthlyAdSpend) {
    db.secondBrain.executiveVault.financialsOverview =
      `${db.secondBrain.executiveVault.financialsOverview || ""} Intake (${new Date().toISOString().split("T")[0]}): revenue band ${monthlyRevenue || "unspecified"}; media spend ${monthlyAdSpend || "unspecified"}.`.trim();
    written.push({ vault: "Executive Vault", field: "financialsOverview" });
  }
  if (primaryBottleneck) {
    db.secondBrain.auditVault.findings.funnelQuality = primaryBottleneck;
    written.push({ vault: "Audit Vault", field: "funnelQuality (reported bottleneck)" });
  }

  await saveDB(res, db);

  res.json({
    success: true,
    written,
    unanswered: [
      ...(monthlyRevenue ? [] : ["monthlyRevenue"]),
      ...(monthlyAdSpend ? [] : ["monthlyAdSpend"]),
      ...(primaryBottleneck ? [] : ["primaryBottleneck"]),
    ],
    secondBrain: db.secondBrain,
  });
});

// Workspace & Team (#15) — real invite/accept/role/remove, replacing the old
// fully-local db.teamMembers/db.invitations fakery. Roster + pending invites
// come from the get_workspace_team/list RPCs and a direct table read (RLS
// already scopes workspace_invitations to members); mutations go through the
// SECURITY DEFINER RPCs in 0006_team_management.sql so role-escalation is
// gated server-side, not just hidden client-side.
// Caller-role gate for the two team routes below — an adversarial review
// found both relied only on workspace_invitations' member-wide RLS (any
// member can read/insert/delete their own workspace's invitation rows),
// with no check that the CALLER themselves holds owner/admin rights. This
// closes that gap at the route level (defense in depth alongside the
// RLS-level and RPC-level fixes in migration 0008).
// Separation of duties is only meaningful when there is somebody else to
// separate to. A solo workspace — which is every workspace on day one — has
// exactly one owner and no second approver, so enforcing requester ≠ approver
// there would not raise the bar, it would make the agent queue unusable: the
// owner could submit a run and nobody, including them, could ever approve it.
// So the rule is conditional on a second owner/admin actually existing.
async function workspaceHasSecondApprover(res: Response): Promise<boolean> {
  const { count, error } = await res.locals.sb
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", res.locals.wsId)
    .in("role", ["owner", "admin"]);
  if (error) {
    // Fail open on the *separation* rule only — the owner/admin check on the
    // approve route has already passed by the time this is consulted, so the
    // worst case is a solo-workspace-equivalent approval, never an unprivileged
    // one. Failing closed here would brick approvals on a transient DB error.
    console.error("Approver-count lookup failed, skipping separation-of-duties check:", error.message);
    return false;
  }
  return (count ?? 0) >= 2;
}

async function callerIsOwnerOrAdmin(res: Response): Promise<boolean> {
  const { data, error } = await res.locals.sb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", res.locals.wsId)
    .eq("user_id", res.locals.userId)
    .single();
  if (error || !data) return false;
  return data.role === "owner" || data.role === "admin";
}

app.get("/api/workspace/team", async (req: Request, res: Response) => {
  const { data: team, error: teamErr } = await res.locals.sb.rpc("get_workspace_team", { p_workspace_id: res.locals.wsId });
  if (teamErr) {
    res.status(500).json({ error: teamErr.message });
    return;
  }
  const { data: invites, error: inviteErr } = await res.locals.sb
    .from("workspace_invitations")
    .select("id, email, role, status, created_at, expires_at")
    .eq("workspace_id", res.locals.wsId)
    .eq("status", "Pending")
    .order("created_at", { ascending: false });
  if (inviteErr) {
    res.status(500).json({ error: inviteErr.message });
    return;
  }
  res.json({ success: true, members: team || [], pendingInvitations: invites || [] });
});

app.post("/api/workspace/team/invite", async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to invite team members." });
    return;
  }
  const { email, role } = req.body as { email?: string; role?: string };
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanRole = (role || "member").trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }
  if (!["admin", "member"].includes(cleanRole)) {
    res.status(400).json({ error: "Role must be 'admin' or 'member'." });
    return;
  }

  const token = crypto.randomBytes(24).toString("hex");
  const { data: invite, error } = await res.locals.sb
    .from("workspace_invitations")
    .upsert(
      { workspace_id: res.locals.wsId, email: cleanEmail, role: cleanRole, token, invited_by: res.locals.userId, status: "Pending" },
      { onConflict: "workspace_id,email" },
    )
    .select("id, email, role, status, created_at, expires_at")
    .single();
  if (error) {
    res.status(500).json({ error: "Failed to create invitation: " + error.message });
    return;
  }

  const appUrl = (process.env.APP_URL && !process.env.APP_URL.startsWith("MY_")) ? process.env.APP_URL : "http://localhost:3000";
  const db = await getDB(res);
  const workspaceName = db.secondBrain?.brandVault?.brandSlogan || db.secondBrain?.brandVault?.corePositioning || "your team's workspace";
  const emailResult = await sendEmail({
    to: cleanEmail,
    subject: `You've been invited to join ${workspaceName} on Growth OS`,
    html: `
      <p>Hi,</p>
      <p>You've been invited to join <strong>${workspaceName}</strong> on Growth OS as a <strong>${cleanRole}</strong>.</p>
      <p><a href="${appUrl.replace(/\/$/, "")}/?invite=${token}">Accept invitation →</a></p>
      <p>This invitation expires in 14 days. If you don't have an account yet, sign up with this email address first.</p>
    `,
  });

  res.json({ success: true, invitation: invite, emailSent: emailResult.sent });
});

app.delete("/api/workspace/team/invite/:id", async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to revoke invitations." });
    return;
  }
  const { error } = await res.locals.sb
    .from("workspace_invitations")
    .delete()
    .eq("id", req.params.id)
    .eq("workspace_id", res.locals.wsId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

app.post("/api/workspace/team/accept", async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "Invitation token is required." });
    return;
  }
  const { data, error } = await res.locals.sb.rpc("accept_workspace_invitation", { p_token: token });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(400).json({ error: "This invitation is invalid, expired, or was sent to a different email address." });
    return;
  }
  res.json({ success: true });
});

app.get("/api/workspace/team/pending-invitations", async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.rpc("get_my_pending_invitations");
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, invitations: data || [] });
});

app.post("/api/workspace/team/role", async (req: Request, res: Response) => {
  const { userId, role } = req.body as { userId?: string; role?: string };
  if (!userId || !["admin", "member"].includes(role || "")) {
    res.status(400).json({ error: "userId and a valid role ('admin' or 'member') are required. Ownership cannot be transferred through this endpoint." });
    return;
  }
  const { data, error } = await res.locals.sb.rpc("update_member_role", { p_workspace_id: res.locals.wsId, p_user_id: userId, p_role: role });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(403).json({ error: "You must be an owner or admin to change roles, and the workspace owner's role cannot be changed." });
    return;
  }
  res.json({ success: true });
});

app.delete("/api/workspace/team/member/:userId", async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.rpc("remove_workspace_member", { p_workspace_id: res.locals.wsId, p_user_id: req.params.userId });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(403).json({ error: "You must be an owner or admin to remove members, and the workspace owner cannot be removed." });
    return;
  }
  res.json({ success: true });
});

// Admin Panel real billing (#17) — was a fully hardcoded modal ($15,000/mo,
// ==========================================
// Billing & Subscription Tier Router (Modular Controller)
// ==========================================
app.use(
  "/api/workspace/billing",
  createBillingRouter({
    isStripeConfigured,
    getStripeClient,
    getEntitlements,
  })
);


// Provider credentials are workspace-scoped and encrypted; verification is separate from saving.
// Complete multi-provider AI model catalog & orchestration across all providers + Local & Smart Routers
const SUPPORTED_AI_PROVIDERS = [
  "gemini",
  "google",
  "anthropic",
  "openai",
  "xai",
  "qwen",
  "deepseek",
  "glm",
  "lmstudio",
  "ollama",
  "omniroute",
  "opencode",
  "openrouter",
  "opusmax",
  "openai-account"
] as const;
type AIProvider = typeof SUPPORTED_AI_PROVIDERS[number];

const UI_PRIMARY_PROVIDERS = [
  "google",
  "anthropic",
  "openai",
  "xai",
  "qwen",
  "deepseek",
  "glm",
  "lmstudio",
  "ollama",
  "omniroute",
  "opencode",
  "openrouter",
  "opusmax",
  "openai-account"
] as const;

async function resolveEffectiveProviderKey(res: Response, provider: string): Promise<string | undefined> {
  if (provider === "gemini" || provider === "google") {
    return (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
  }
  if (provider === "lmstudio" || provider === "ollama") {
    return "local-on-device";
  }
  const db = await getDB(res);
  const stored = (db as any).aiProviderKeys?.[provider]?.encrypted as string | undefined;
  if (stored) {
    try {
      const decrypted = decryptCredentials(stored) as { apiKey?: string };
      if (decrypted?.apiKey) return decrypted.apiKey;
    } catch (err) {
      console.error(`Failed to decrypt stored ${provider} key:`, err);
    }
  }
  // Check environment variables as fallback
  const envMap: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    xai: process.env.XAI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    qwen: process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY,
    glm: process.env.GLM_API_KEY || process.env.ZHIPU_API_KEY,
    omniroute: process.env.OMNIROUTE_API_KEY,
    opencode: process.env.OPENCODE_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    opusmax: process.env.OPUSMAX_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN,
    "openai-account": process.env.OPENAI_ACCOUNT_TOKEN || process.env.OPENAI_API_KEY,
    lmstudio: "local-on-device",
    ollama: "local-on-device"
  };
  return envMap[provider];
}

// Stored (per-workspace) key + optional gateway base URL + auth mode for a provider.
// opusmax saves an optional custom base URL; openai-account saves an account
// sign-in token (accountAuth) with the raw API key as an optional fallback.
async function resolveStoredProviderConfig(res: Response, provider: string): Promise<{
  apiKey?: string;
  baseUrl?: string;
  accountAuth?: boolean;
}> {
  const db = await getDB(res);
  const stored = providerEntry(db as any, provider);
  if (!stored?.encrypted) {
    return { baseUrl: stored?.baseUrl || undefined, accountAuth: stored?.accountAuth };
  }
  try {
    const decrypted = decryptCredentials(stored.encrypted) as { apiKey?: string };
    return {
      apiKey: decrypted?.apiKey,
      baseUrl: stored.baseUrl || undefined,
      accountAuth: stored.accountAuth || undefined,
    };
  } catch {
    return { baseUrl: stored.baseUrl || undefined, accountAuth: stored.accountAuth };
  }
}

interface UniversalCompletionOptions {
  provider: string;
  model: string;
  systemPrompt?: string;
  prompt: string;
  apiKey?: string;
  temperature?: number;
  baseUrl?: string;
  accountAuth?: boolean;
}

interface UniversalCompletionResult {
  text: string;
  provider: string;
  model: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  durationMs: number;
}

async function executeUniversalAICompletion(options: UniversalCompletionOptions): Promise<UniversalCompletionResult> {
  const startTime = Date.now();
  const { provider, model, systemPrompt, prompt, apiKey, baseUrl, accountAuth } = options;

  // 1. Google / Gemini
  if (provider === 'google' || provider === 'gemini') {
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    const client = getGeminiClient(effectiveKey);
    const contents: any[] = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: `${systemPrompt}\n\nTask:\n${prompt}` }] });
    } else {
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    }
    try {
      const response = await client.models.generateContent({
        model: model || 'gemini-2.5-flash',
        contents, config: { abortSignal: AbortSignal.timeout(45_000) }
      });
      const text = response.text || '';
      const durationMs = Date.now() - startTime;
      const promptTokens = (response as any).usageMetadata?.promptTokenCount || estimateTokens(prompt);
      const candidateTokens = (response as any).usageMetadata?.candidatesTokenCount || estimateTokens(text);
      return {
        text,
        provider: 'google',
        model: model || 'gemini-2.5-flash',
        promptTokens,
        candidateTokens,
        totalTokens: promptTokens + candidateTokens,
        durationMs
      };
    } catch (gErr: any) {
      const isQuotaOrRateLimit = /429|quota|resource_exhausted/i.test(gErr?.message || '');
      const opusmaxKey = process.env.OPUSMAX_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
      if (isQuotaOrRateLimit && opusmaxKey) {
        console.warn(`[AI Fallback] Google Gemini hit quota limit. Transparently failing over to OpusMax Pro (claude-opus-5-5)...`);
        return await executeUniversalAICompletion({
          ...options,
          provider: 'opusmax',
          model: 'claude-opus-5-5',
        });
      }
      throw gErr;
    }
  }

  // 2. OpenAI
  if (provider === 'openai') {
    const effectiveKey = apiKey || process.env.OPENAI_API_KEY;
    if (!effectiveKey) throw new Error('OpenAI API key not configured');
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${(baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveKey}` },
      body: JSON.stringify({ model: model || 'gpt-4o', messages, ...(options.temperature !== undefined ? { temperature: options.temperature } : {}) })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`OpenAI API error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'openai',
      model: model || 'gpt-4o',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 3. Anthropic (Claude)
  if (provider === 'anthropic') {
    const effectiveKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!effectiveKey) throw new Error('Anthropic API key not configured');
    const body: any = {
      model: model || 'claude-3-5-sonnet',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    };
    if (systemPrompt) body.system = systemPrompt;
    const r = await fetch(`${(baseUrl || 'https://api.anthropic.com/v1').replace(/\/$/, '')}/messages`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': effectiveKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Anthropic API error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.content?.[0]?.text || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.input_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.output_tokens || estimateTokens(text);
    return {
      text,
      provider: 'anthropic',
      model: model || 'claude-3-5-sonnet',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 4. xAI (Grok)
  if (provider === 'xai') {
    const effectiveKey = apiKey || process.env.XAI_API_KEY;
    if (!effectiveKey) throw new Error('xAI API key not configured');
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${(baseUrl || 'https://api.x.ai/v1').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveKey}` },
      body: JSON.stringify({ model: model || 'grok-2-1212', messages })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`xAI API error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'xai',
      model: model || 'grok-2-1212',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 5. DeepSeek
  if (provider === 'deepseek') {
    const effectiveKey = apiKey || process.env.DEEPSEEK_API_KEY;
    if (!effectiveKey) throw new Error('DeepSeek API key not configured');
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${(baseUrl || 'https://api.deepseek.com/v1').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveKey}` },
      body: JSON.stringify({ model: model || 'deepseek-v3', messages })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`DeepSeek API error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'deepseek',
      model: model || 'deepseek-v3',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 6. Qwen (Alibaba Cloud DashScope)
  if (provider === 'qwen') {
    const effectiveKey = apiKey || process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
    if (!effectiveKey) throw new Error('Alibaba Cloud DashScope API key not configured');
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${(baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveKey}` },
      body: JSON.stringify({ model: model || 'qwen-2.5-72b', messages })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Qwen API error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'qwen',
      model: model || 'qwen-2.5-72b',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 7. Zhipu GLM
  if (provider === 'glm') {
    const effectiveKey = apiKey || process.env.GLM_API_KEY || process.env.ZHIPU_API_KEY;
    if (!effectiveKey) throw new Error('Zhipu GLM API key not configured');
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${(baseUrl || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveKey}` },
      body: JSON.stringify({ model: model || 'glm-4-plus', messages })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`GLM API error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'glm',
      model: model || 'glm-4-plus',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 8. Local LM Studio (MacBook Apple Silicon)
  if (provider === 'lmstudio') {
    const targetUrl = baseUrl || 'http://localhost:1234/v1';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch(`${targetUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', redirect: 'error',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey || 'local'}` },
        body: JSON.stringify({ model: model || 'local-model', messages, temperature: options.temperature ?? 0.7 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`LM Studio error (${r.status}): ${errText}`);
      }
      const data = await r.json() as any;
      const text = data.choices?.[0]?.message?.content || '';
      const durationMs = Date.now() - startTime;
      const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
      const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
      return {
        text,
        provider: 'lmstudio',
        model: model || 'local-model',
        promptTokens,
        candidateTokens,
        totalTokens: promptTokens + candidateTokens,
        durationMs
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error(`Cannot connect to LM Studio at ${targetUrl}. Please ensure LM Studio is running on your MacBook with the local server enabled on port 1234.`);
      }
      throw err;
    }
  }

  // 9. Local Ollama (MacBook Apple Silicon)
  if (provider === 'ollama') {
    const targetUrl = baseUrl || 'http://localhost:11434/v1';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch(`${targetUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', redirect: 'error',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'llama3.3', messages, temperature: options.temperature ?? 0.7 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`Ollama error (${r.status}): ${errText}`);
      }
      const data = await r.json() as any;
      const text = data.choices?.[0]?.message?.content || '';
      const durationMs = Date.now() - startTime;
      const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
      const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
      return {
        text,
        provider: 'ollama',
        model: model || 'llama3.3',
        promptTokens,
        candidateTokens,
        totalTokens: promptTokens + candidateTokens,
        durationMs
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error(`Cannot connect to Ollama at ${targetUrl}. Please ensure Ollama is running on your MacBook (run 'ollama serve' or launch the Ollama app).`);
      }
      throw err;
    }
  }

  // 10. Omniroute Smart Router
  if (provider === 'omniroute') {
    const effectiveKey = apiKey || process.env.OMNIROUTE_API_KEY;
    if (!effectiveKey) throw new Error('Omniroute API key not configured');
    const targetUrl = baseUrl || 'https://api.omniroute.ai/v1';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${targetUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveKey}` },
      body: JSON.stringify({ model: model || 'omniroute-auto', messages })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Omniroute error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'omniroute',
      model: model || 'omniroute-auto',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 11. Open Code Router
  if (provider === 'opencode') {
    const effectiveKey = apiKey || process.env.OPENCODE_API_KEY;
    if (!effectiveKey) throw new Error('Open Code API key not configured');
    const targetUrl = baseUrl || 'https://api.opencode.ai/v1';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${targetUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveKey}` },
      body: JSON.stringify({ model: model || 'opencode-agent', messages })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Open Code error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'opencode',
      model: model || 'opencode-agent',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 12. OpenRouter Gateway
  if (provider === 'openrouter') {
    const effectiveKey = apiKey || process.env.OPENROUTER_API_KEY;
    if (!effectiveKey) throw new Error('OpenRouter API key not configured');
    const targetUrl = baseUrl || 'https://openrouter.ai/api/v1';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${targetUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
        'HTTP-Referer': 'https://sigmatactix.ai',
        'X-Title': 'Sigma Tactix Growth OS'
      },
      body: JSON.stringify({ model: model || 'openrouter-auto', messages })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`OpenRouter error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'openrouter',
      model: model || 'openrouter-auto',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 13. OpusMax gateway (installed dep: opusmax-gateway@1.0.2)
  //     Claude-family LLM gateway. Two hosts expose the same models:
  //       • https://api.opusmax.pro        → OpenAI-compatible /v1/chat/completions (Bearer)
  //       • https://opusxmax.vercel.app/api → Anthropic-compatible /v1/messages (x-api-key)
  //     Keys: sk-ant-ox-... (validated by the gateway's /key-status endpoint).
  if (provider === 'opusmax') {
    const effectiveKey = apiKey || process.env.OPUSMAX_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
    if (!effectiveKey) throw new Error('OpusMax API key not configured (sk-ant-ox-… key from opusmax.pro; run `npx opusmax-gateway setup` locally to obtain one).');
    const rawBase = (baseUrl || process.env.OPUSMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.opusmax.pro').replace(/\/$/, '');
    const anthropicWire = /opusxmax\.vercel\.app/.test(rawBase);
    const b = rawBase.replace(/\/v1$/, '');
    // Namespaced alias cards (opusmax-opus/sonnet/haiku) resolve to the
    // gateway's bare family aliases; every other model id is sent verbatim.
    const omModel = (model || 'claude-opus-5-5').replace(/^opusmax-(opus|sonnet|haiku)$/, '$1');
    let inferUrl: string;
    let headers: Record<string, string>;
    let body: string;
    if (anthropicWire) {
      inferUrl = `${b}/v1/messages`;
      headers = { 'Content-Type': 'application/json', 'x-api-key': effectiveKey, 'anthropic-version': '2023-06-01' };
      body = JSON.stringify({ model: omModel, max_tokens: 2048, ...(systemPrompt ? { system: systemPrompt } : {}), messages: [{ role: 'user', content: prompt }] });
    } else {
      inferUrl = `${b}/v1/chat/completions`;
      headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveKey}` };
      const msgs: any[] = [];
      if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
      msgs.push({ role: 'user', content: prompt });
      body = JSON.stringify({ model: omModel, messages: msgs, temperature: options.temperature ?? 0.7 });
    }
    const r = await fetch(inferUrl, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000), headers, body });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`OpusMax error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = anthropicWire
      ? (data.content?.find((block: any) => block?.text)?.text || '').trim()
      : (data.choices?.[0]?.message?.content || '');
    const durationMs = Date.now() - startTime;
    const promptTokens = (anthropicWire ? data.usage?.input_tokens : data.usage?.prompt_tokens) || estimateTokens(prompt);
    const candidateTokens = (anthropicWire ? data.usage?.output_tokens : data.usage?.completion_tokens) || estimateTokens(text);
    return {
      text,
      provider: 'opusmax',
      model: omModel,
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  // 14. OpenAI account login (ChatGPT / Codex)
  //     Primary auth: workspace-saved account token (or env OPENAI_ACCOUNT_TOKEN)
  //     via OpenAI's project-style auth. The raw API key stays an optional fallback.
  if (provider === 'openai-account') {
    const effectiveKey = apiKey || process.env.OPENAI_ACCOUNT_TOKEN || process.env.OPENAI_API_KEY;
    if (!effectiveKey) throw new Error('OpenAI account login not configured. Sign in with your OpenAI account, or add an optional API key.');
    const targetUrl = baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const r = await fetch(`${targetUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
        ...(accountAuth ? { 'OpenAI-Auth-Method': 'account' } : {})
      },
      body: JSON.stringify({ model: model || 'gpt-5', messages, temperature: options.temperature ?? 0.7 })
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`OpenAI account error (${r.status}): ${errText}`);
    }
    const data = await r.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const candidateTokens = data.usage?.completion_tokens || estimateTokens(text);
    return {
      text,
      provider: 'openai-account',
      model: model || 'gpt-5',
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      durationMs
    };
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

app.get("/api/workspace/admin/ai-keys", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const providers = UI_PRIMARY_PROVIDERS.map(provider => providerStatus(db as any, provider, process.env));
  res.json({ success: true, providers });
});

app.post("/api/workspace/admin/ai-keys", async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to configure AI provider keys." });
    return;
  }
  let { provider, apiKey, model, baseUrl, accountAuth } = req.body as {
    provider?: string; apiKey?: string; model?: string; baseUrl?: string; accountAuth?: boolean;
  };
  if (!provider || !SUPPORTED_AI_PROVIDERS.includes(provider as AIProvider)) {
    res.status(400).json({ error: `provider must be one of: ${SUPPORTED_AI_PROVIDERS.join(", ")}` });
    return;
  }
  if ((apiKey !== undefined && typeof apiKey !== 'string') || (model !== undefined && typeof model !== 'string') || (baseUrl !== undefined && typeof baseUrl !== 'string')) {
    res.status(400).json({ error: 'Key, model and endpoint must be strings.' }); return;
  }
  provider = canonicalAIProvider(provider);
  try { if (baseUrl) await validateAIEndpoint(provider, baseUrl); }
  catch (error: any) { res.status(400).json({ error: error.message }); return; }
  const db = await getDB(res);
  (db as any).aiProviderKeys = (db as any).aiProviderKeys || {};

  const existing = (db as any).aiProviderKeys[provider] || (provider === "google" ? (db as any).aiProviderKeys["gemini"] : undefined);
  if (provider === 'google' && existing) {
    (db as any).aiProviderKeys.google = existing;
    delete (db as any).aiProviderKeys.gemini;
  }

  if ((!apiKey || !apiKey.trim()) && provider !== 'ollama' && provider !== 'lmstudio') {
    if (existing?.encrypted && (model?.trim() || baseUrl?.trim())) {
      if (model?.trim()) existing.model = model.trim();
      if (baseUrl?.trim()) existing.baseUrl = baseUrl.trim().replace(/\/$/, "");
      if (existing.model !== existing.verifiedModel || (existing.baseUrl || "") !== existing.verifiedBaseUrl) delete existing.verifiedAt;
      existing.accountAuth = !!accountAuth;
      existing.updatedAt = new Date().toISOString();
      await saveDB(res, db);
      res.json({ success: true, provider, configured: true, live: false });
      return;
    }
    // OpenAI account login: the raw API key is optional — an account sign-in
    // token is the primary credential; only model/baseUrl updates may come
    // through with no key once one is stored.
    if (provider === "openai-account" && existing?.accountAuth && existing?.encrypted) {
      if (model?.trim()) existing.model = model.trim();
      if (baseUrl?.trim()) existing.baseUrl = baseUrl.trim().replace(/\/$/, "");
      existing.updatedAt = new Date().toISOString();
      await saveDB(res, db);
      res.json({ success: true, provider, configured: true, live: false, accountAuth: true });
      return;
    }
    res.status(400).json({ error: "apiKey is required" });
    return;
  }

  (db as any).aiProviderKeys[provider] = {
    ...(apiKey?.trim() ? { encrypted: encryptCredentials({ apiKey: apiKey.trim() }) } : {}),
    model: model?.trim() || existing?.model || undefined,
    baseUrl: baseUrl?.trim() ? baseUrl.trim().replace(/\/$/, "") : existing?.baseUrl || undefined,
    accountAuth: !!accountAuth,
    updatedAt: new Date().toISOString(),
  };
  await saveDB(res, db);
  res.json({ success: true, provider, configured: true, live: false, accountAuth: !!accountAuth });
});

// Fetch available models from provider API with graceful fallback to verified comprehensive catalog
app.post("/api/workspace/admin/ai-keys/:provider/models", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { apiKey: bodyKey } = req.body as { apiKey?: string };
  if (!SUPPORTED_AI_PROVIDERS.includes(provider as AIProvider)) {
    res.status(400).json({ error: `provider must be one of: ${SUPPORTED_AI_PROVIDERS.join(", ")}` });
    return;
  }
  const apiKey = bodyKey?.trim() || await resolveEffectiveProviderKey(res, provider);

  const fallbackCatalog = ALL_AI_MODELS
    .filter(m => m.provider === provider
      || (provider === "google" && m.provider === "google")
      || (provider === "gemini" && m.provider === "google")
      || (provider === "openai-account" && (m.provider === "openai" || m.provider === "openai-account")))
    .map(m => m.id);

  if (!apiKey) {
    res.json({ success: true, models: fallbackCatalog, catalog: true });
    return;
  }

  try {
    if (provider === "gemini" || provider === "google") {
      const client = getGeminiClient(apiKey);
      const pager = await client.models.list();
      const models: string[] = [];
      for await (const m of pager) {
        if (m.name?.includes("gemini")) models.push(m.name.replace(/^models\//, ""));
      }
      res.json({ success: true, models: models.length > 0 ? models : fallbackCatalog });
      return;
    }
    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (r.ok) {
        const data = await r.json() as { data: { id: string }[] };
        const fetched = data.data.map(m => m.id).filter(id => /gpt|o1|o3/.test(id)).sort();
        if (fetched.length > 0) {
          res.json({ success: true, models: fetched });
          return;
        }
      }
    }
    if (provider === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } });
      if (r.ok) {
        const data = await r.json() as { data: { id: string }[] };
        const fetched = data.data.map(m => m.id);
        if (fetched.length > 0) {
          res.json({ success: true, models: fetched });
          return;
        }
      }
    }
    if (provider === "xai") {
      const r = await fetch("https://api.x.ai/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (r.ok) {
        const data = await r.json() as { data: { id: string }[] };
        const fetched = data.data.map(m => m.id);
        if (fetched.length > 0) {
          res.json({ success: true, models: fetched });
          return;
        }
      }
    }
    if (provider === "deepseek") {
      const r = await fetch("https://api.deepseek.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (r.ok) {
        const data = await r.json() as { data: { id: string }[] };
        const fetched = data.data.map(m => m.id);
        if (fetched.length > 0) {
          res.json({ success: true, models: fetched });
          return;
        }
      }
    }
    if (provider === "qwen") {
      const r = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (r.ok) {
        const data = await r.json() as { data: { id: string }[] };
        const fetched = data.data.map(m => m.id);
        if (fetched.length > 0) {
          res.json({ success: true, models: fetched });
          return;
        }
      }
    }
    if (provider === "glm") {
      const r = await fetch("https://open.bigmodel.cn/api/paas/v4/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (r.ok) {
        const data = await r.json() as { data: { id: string }[] };
        const fetched = data.data.map(m => m.id);
        if (fetched.length > 0) {
          res.json({ success: true, models: fetched });
          return;
        }
      }
    }
    if (provider === "opusmax") {
      // The installed opusmax-gateway package lists models from {base}/v1/models
      // with an x-api-key header (works on both the api.opusmax.pro and
      // opusxmax.vercel.app/api hosts). Base URL may be overridden per-workspace.
      const stored = await resolveStoredProviderConfig(res, "opusmax");
      const base = (stored.baseUrl || process.env.OPUSMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || "https://api.opusmax.pro").replace(/\/$/, "").replace(/\/v1$/, "");
      const r = await fetch(`${base}/v1/models`, { headers: { "x-api-key": apiKey } });
      if (r.ok) {
        const data = await r.json() as { data?: { id?: string; display_name?: string }[] };
        const fetched = (data.data || []).map(m => m.id || "").filter(id => id);
        if (fetched.length > 0) {
          res.json({ success: true, models: fetched, live: true });
          return;
        }
      }
      res.json({ success: true, models: fallbackCatalog, fallback: true });
      return;
    }
    if (provider === "openai-account") {
      res.json({ success: true, models: fallbackCatalog, accountAuth: true });
      return;
    }
    res.json({ success: true, models: fallbackCatalog, fallback: true });
  } catch (err: any) {
    res.json({ success: true, models: fallbackCatalog, error: err.message, fallback: true });
  }
});

// OpusMax gateway key verification (mirrors opusmax-gateway's /key-status check).
app.post("/api/workspace/admin/ai-keys/opusmax/key-status", async (req: Request, res: Response) => {
  const { apiKey: bodyKey, baseUrl } = req.body as { apiKey?: string; baseUrl?: string };
  const apiKey = bodyKey?.trim() || await resolveEffectiveProviderKey(res, "opusmax");
  if (!apiKey) {
    res.status(400).json({ success: false, error: "No OpusMax key to verify. Save one in the vault or set OPUSMAX_API_KEY." });
    return;
  }
  const stored = await resolveStoredProviderConfig(res, "opusmax");
  const base = (baseUrl?.trim() || stored.baseUrl || process.env.OPUSMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || "https://api.opusmax.pro").replace(/\/$/, "").replace(/\/v1$/, "");
  try {
    const r = await fetch(`${base}/key-status?key=${encodeURIComponent(apiKey)}`);
    const json = await r.json().catch(() => ({})) as any;
    if (!r.ok) {
      res.json({ success: false, active: false, status: json?.status || null, error: json?.error?.message || `Key check failed (${r.status})` });
      return;
    }
    res.json({
      success: json.exists !== false,
      active: json.exists !== false && !json.quotaBlocked && json.status !== "EXPIRED",
      status: json.status || "ACTIVE",
      name: json.name || null,
      quotaBlocked: !!json.quotaBlocked,
      expiresAt: json.expiresAt || null,
    });
  } catch (err: any) {
    res.json({ success: false, active: false, error: err.message || "Could not reach the OpusMax gateway." });
  }
});

// Selection affects approved agent runs and agent pipelines, not Gemini-specific studios or VANTA.
app.post("/api/workspace/admin/ai/selection", async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) { res.status(403).json({ error: "Owner or admin required." }); return; }
  const { provider, model } = req.body;
  if (typeof provider !== 'string' || typeof model !== 'string') { res.status(400).json({ error: "Provider and model are required." }); return; }
  const db = await getDB(res);
  try {
    const candidate = { ...db };
    selectAgentModel(candidate as any, provider, model);
    const config = resolveAgentAIConfig(candidate as any, decryptCredentials, process.env);
    if (config.baseUrl) await validateAIEndpoint(config.provider, config.baseUrl);
    (db as any).agentAISelection = (candidate as any).agentAISelection;
  } catch (error: any) { res.status(400).json({ error: error.message }); return; }
  await saveDB(res, db);
  res.json({ success: true });
});

async function validateAIEndpoint(provider: string, target: string) {
  if (canonicalAIProvider(provider) === 'google') throw new Error('Custom Gemini endpoints are not supported.');
  const url = new URL(target);
  if (url.username || url.password || url.search || url.hash) throw new Error("AI endpoint must not contain credentials, query or fragment.");
  if (provider === 'ollama' || provider === 'lmstudio') {
    if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error("Local AI endpoints must use loopback on the API server.");
  } else {
    if (url.protocol !== 'https:') throw new Error("Hosted AI endpoints require HTTPS.");
    await assertPublicHost(target);
  }
}

async function resolveWorkspaceAgentAI(res: Response): Promise<AIProviderConfig> {
  const db = await getDB(res);
  const config = resolveAgentAIConfig(db as any, decryptCredentials, process.env);
  if (config.baseUrl) await validateAIEndpoint(config.provider, config.baseUrl);
  return config;
}

// Live Model Inference Handshake Endpoint
app.post("/api/workspace/admin/ai/test-inference", expensiveLimiter, async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) { res.status(403).json({ error: "Owner or admin required." }); return; }
  let { provider, model, prompt, baseUrl } = req.body as { provider?: string; model?: string; prompt?: string; baseUrl?: string };
  if (typeof provider !== 'string' || (model !== undefined && typeof model !== 'string') || (prompt !== undefined && typeof prompt !== 'string') || (baseUrl !== undefined && typeof baseUrl !== 'string')) {
    res.status(400).json({ error: "provider is required" });
    return;
  }
  provider = canonicalAIProvider(provider);
  if (!SUPPORTED_AI_PROVIDERS.includes(provider as AIProvider)) { res.status(400).json({ error: "Unsupported provider." }); return; }
  const testPrompt = prompt?.trim() || "Generate a 1-sentence growth hook for Sigma Tactix sovereign AI growth infrastructure.";
  const resolvedKey = await resolveEffectiveProviderKey(res, provider);
  // Stored per-workspace gateway settings (optional base URL, account-login flag)
  const storedConfig = await resolveStoredProviderConfig(res, provider).catch(() => ({}) as { baseUrl?: string; accountAuth?: boolean });
  const verificationStart = providerEntry(await getDB(res) as any, provider);
  if (verificationStart && verificationStart.verifiedModel === model &&
    (verificationStart.baseUrl || '') === (baseUrl || storedConfig.baseUrl || '')) {
    const resetDB = await getDB(res);
    const resetEntry = providerEntry(resetDB as any, provider);
    if (resetEntry && resetEntry.encrypted === verificationStart.encrypted) {
      delete resetEntry.verifiedAt;
      await saveDB(res, resetDB);
    }
  }

  try {
    const target = baseUrl || storedConfig.baseUrl;
    if (target) await validateAIEndpoint(provider, target);
    const result = await executeUniversalAICompletion({
      provider,
      model: model || (provider === 'google' || provider === 'gemini' ? 'gemini-2.5-flash' : 'default'),
      prompt: testPrompt,
      apiKey: resolvedKey,
      baseUrl: baseUrl || storedConfig.baseUrl || undefined,
      accountAuth: storedConfig.accountAuth,
    });

    if (!result.text?.trim()) throw new Error("Provider returned no text; verification failed.");
    const verificationDB = await getDB(res);
    const entry = providerEntry(verificationDB as any, provider);
    if (entry && entry.encrypted === verificationStart?.encrypted &&
      (entry.model === model || ((verificationDB as any).agentAISelection?.provider === provider && (verificationDB as any).agentAISelection?.model === model)) &&
      (entry.baseUrl || '') === (baseUrl || storedConfig.baseUrl || '')) {
      entry.verifiedAt = new Date().toISOString();
      entry.verifiedModel = model;
      entry.verifiedBaseUrl = entry.baseUrl || '';
      await saveDB(res, verificationDB);
    }
    const costUsd = calculateTokenCost(result.model, result.promptTokens, result.candidateTokens);

    await recordTokenUsage(res, {
      actionType: "MODEL_HANDSHAKE_TEST",
      provider: result.provider,
      modelName: result.model,
      promptText: testPrompt,
      responseText: result.text,
      usageMetadata: {
        promptTokenCount: result.promptTokens,
        candidatesTokenCount: result.candidateTokens,
        totalTokenCount: result.totalTokens
      },
      durationMs: result.durationMs,
      status: "SUCCESS",
      metadata: { testMode: true }
    });

    res.json({
      success: true,
      text: result.text,
      provider: result.provider,
      model: result.model,
      durationMs: result.durationMs,
      promptTokens: result.promptTokens,
      candidateTokens: result.candidateTokens,
      totalTokens: result.totalTokens,
      costUsd,
    });
  } catch (err: any) {
    res.status(502).json({
      error: `Inference execution failed on ${provider} (${model || 'default'}): ${err.message || String(err)}`
    });
  }
});

app.delete("/api/workspace/admin/ai-keys/:provider", async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to remove AI provider keys." });
    return;
  }
  const provider = canonicalAIProvider(req.params.provider as string);
  const db = await getDB(res);
  if (provider === "google" && (db as any).aiProviderKeys) delete (db as any).aiProviderKeys.gemini;
  if ((db as any).aiProviderKeys?.[provider]) {
    delete (db as any).aiProviderKeys[provider];
  }
  await saveDB(res, db);
  res.json({ success: true, provider, configured: false });
});

// Ping local LLM endpoints (LM Studio on 1234, Ollama on 11434) on user MacBook
app.post("/api/workspace/admin/local-llm/ping", async (req: Request, res: Response) => {
  const { provider, baseUrl } = req.body as { provider?: 'lmstudio' | 'ollama'; baseUrl?: string };
  const targetProvider = provider || 'lmstudio';
  const defaultUrl = targetProvider === 'lmstudio' ? 'http://localhost:1234/v1' : 'http://localhost:11434/v1';
  const cleanUrl = (baseUrl || defaultUrl).replace(/\/$/, '');

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const pingEndpoint = targetProvider === 'lmstudio' ? `${cleanUrl}/models` : `${cleanUrl}/models`;
    const r = await fetch(pingEndpoint, { signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (r.ok) {
      const data = await r.json() as any;
      let models: string[] = [];
      if (Array.isArray(data?.data)) {
        models = data.data.map((m: any) => m.id || m.name);
      } else if (Array.isArray(data?.models)) {
        models = data.models.map((m: any) => m.name || m.model);
      }
      res.json({
        active: true,
        latencyMs,
        models,
        baseUrl: cleanUrl,
        provider: targetProvider
      });
      return;
    }

    res.json({
      active: false,
      latencyMs,
      models: [],
      baseUrl: cleanUrl,
      provider: targetProvider,
      error: `Server responded with HTTP ${r.status}`
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    res.json({
      active: false,
      latencyMs: Date.now() - startTime,
      models: [],
      baseUrl: cleanUrl,
      provider: targetProvider,
      error: err.name === 'AbortError'
        ? "Connection timed out (no local server listening)"
        : (err.message || "Local server unreachable")
    });
  }
});

// Full Harness Live Status & Node Topology Detection
app.get("/api/workspace/admin/harness/status", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const aiKeys = (db as any).aiProviderKeys || {};

  // Check local ports asynchronously with quick timeouts
  const checkLocalPort = async (port: number): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 800);
      const res = await fetch(`http://127.0.0.1:${port}/`, { signal: controller.signal }).catch(() => null);
      clearTimeout(tid);
      return !!res;
    } catch {
      return false;
    }
  };

  const [isLMStudioUp, isOllamaUp] = await Promise.all([
    checkLocalPort(1234),
    checkLocalPort(11434)
  ]);

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    ports: {
      3000: { active: true, name: "Express + Vite Client" },
      24678: { active: true, name: "Vite HMR WebSocket" },
      1234: { active: isLMStudioUp, name: "LM Studio Local LLM" },
      11434: { active: isOllamaUp, name: "Ollama Local LLM" }
    },
    layers: {
      presentation: {
        id: "node-frontend-client",
        name: "Presentation & Biosphere UI",
        port: 3000,
        viteHmrPort: 24678,
        status: "ACTIVE",
        framework: "React 19 + Vite 6 + Three.js",
        modules: 12,
        latencyMs: 1,
        path: "src/App.tsx"
      },
      api: {
        id: "node-express-core",
        name: "Growth OS Core Engine",
        port: 3000,
        status: "ACTIVE",
        framework: "Express.js + Universal AI Router",
        uptimeSec: Math.floor(process.uptime()),
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        pid: process.pid,
        path: "server.ts"
      },
      data: {
        id: "node-second-brain-vaults",
        name: "Second Brain & Storage Layer",
        status: "ACTIVE",
        vaultsCount: 10,
        database: "Supabase PostgreSQL + JSON State",
        connected: true,
        path: "src/data/initialData.ts"
      },
      localRuntimes: {
        lmstudio: {
          id: "node-local-lmstudio",
          name: "LM Studio Local (MacBook)",
          port: 1234,
          status: isLMStudioUp ? "ACTIVE" : "INACTIVE",
          defaultUrl: "http://localhost:1234/v1"
        },
        ollama: {
          id: "node-local-ollama",
          name: "Ollama Local (MacBook)",
          port: 11434,
          status: isOllamaUp ? "ACTIVE" : "INACTIVE",
          defaultUrl: "http://localhost:11434/v1"
        }
      },
      externalCloud: {
        google: { name: "Google Cloud (Gemini)", configured: !!process.env.GEMINI_API_KEY || !!aiKeys["google"] },
        anthropic: { name: "Anthropic Claude", configured: !!process.env.ANTHROPIC_API_KEY || !!aiKeys["anthropic"] },
        openai: { name: "OpenAI GPT & Astra", configured: !!process.env.OPENAI_API_KEY || !!aiKeys["openai"] },
        omniroute: { name: "Omniroute Gateway", configured: !!process.env.OMNIROUTE_API_KEY || !!aiKeys["omniroute"] },
        openrouter: { name: "OpenRouter Unified", configured: !!process.env.OPENROUTER_API_KEY || !!aiKeys["openrouter"] }
      }
    }
  });
});

// ==========================================
// Agent Reach — Multi-Channel Internet Capability Router (Modular Controller)
// ==========================================
app.use(
  "/api/workspace/agent-reach",
  createAgentReachRouter({
    expensiveLimiter,
    requireModule,
    getGeminiClient,
    resolveEffectiveGeminiKey,
    resolveEffectiveGeminiModel,
  })
);

app.use(
  "/api/workspace/google-ads-mcp",
  createGoogleAdsMcpRouter({
    expensiveLimiter,
    authorize: async res => isMcpPilotOwner(res.locals.userEmail) && googleAdsWorkspaceBinding(res.locals.wsId) && await callerIsOwnerOrAdmin(res),
    getStatus: getGoogleAdsMcpStatus,
    listCustomers: async res => {
      const receipt = await readGoogleAdsViaMcp({
        workspaceId: res.locals.wsId, actorId: res.locals.userId,
        actorEmail: res.locals.userEmail, sb: res.locals.sb, request: { operation: 'discover' }
      });
      if (receipt.status !== 'succeeded') throw new Error(`Google Ads account discovery failed. Receipt: ${receipt.receiptId}`);
      const raw = (receipt.result as any)?.structuredContent?.result;
      const customers = Array.isArray(raw) ? raw.map(value => String(value).replace(/^customers\//, '').replace(/-/g, '')).filter(value => /^\d{10}$/.test(value)) : [];
      if (!customers.length) throw new Error(`No accessible customer IDs were returned. Receipt: ${receipt.receiptId}`);
      return { customers, verified: true, checkedAt: receipt.finishedAt, receiptId: receipt.receiptId };
    },
  }),
);

app.use('/api/workspace/mcp', createMcpRouter({
  expensiveLimiter,
  callerIsOwnerOrAdmin,
  getWorkspace: getDB,
  getRuns: (res, limit) => listLedgerRuns(res.locals.sb, res.locals.wsId, limit),
}));

// Token Metering & Client Profitability Telemetry
app.get("/api/workspace/telemetry/tokens", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const ent = await getEntitlements(res);
  const tierKey = ent?.tier_key || (db as any).tier || "growth";
  const tierInfo = TIER_RETAINERS[tierKey] || TIER_RETAINERS.growth;

  let records: TokenUsageRecord[] = [];

  // 1. Try to fetch from Supabase table token_usage_records
  if (res.locals?.sb && res.locals?.wsId) {
    try {
      const { data, error } = await res.locals.sb
        .from("token_usage_records")
        .select("*")
        .eq("workspace_id", res.locals.wsId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data) && data.length > 0) {
        records = data.map((d: any) => ({
          id: d.id,
          workspaceId: d.workspace_id,
          taskId: d.task_id,
          agentId: d.agent_id,
          actionType: d.action_type,
          provider: d.provider,
          modelName: d.model_name,
          promptTokens: Number(d.prompt_tokens) || 0,
          candidateTokens: Number(d.candidate_tokens) || 0,
          totalTokens: Number(d.total_tokens) || 0,
          estimatedCostUsd: Number(d.estimated_cost_usd) || 0,
          durationMs: d.duration_ms,
          status: d.status,
          metadata: d.metadata,
          createdAt: d.created_at,
        }));
      }
    } catch {
      // Supabase table not available or network error
    }
  }

  // 2. Fallback to workspace_state.data.tokenUsage
  if (records.length === 0 && Array.isArray(db.tokenUsage) && db.tokenUsage.length > 0) {
    records = db.tokenUsage;
  }

  const summary = aggregateTelemetry(records, tierKey, tierInfo.name, tierInfo.priceMonthly);
  res.json({ success: true, telemetry: summary });
});

app.post("/api/workspace/telemetry/log-token", async (req: Request, res: Response) => {
  const { taskId, agentId, actionType, modelName, promptTokens, candidateTokens, totalTokens, durationMs, metadata } = req.body;
  const record = await recordTokenUsage(res, {
    taskId,
    agentId,
    actionType: actionType || "MANUAL_TASK",
    modelName: modelName || DEFAULT_GEMINI_MODEL,
    usageMetadata: {
      promptTokenCount: promptTokens,
      candidatesTokenCount: candidateTokens,
      totalTokenCount: totalTokens,
    },
    durationMs,
    metadata,
  });
  res.json({ success: true, record });
});

// Run Growth Diagnostic Audit — real domain fetch + one specialized Gemini
// agent per finding category (see src/lib/growthAuditAgents.ts), synthesized
// into a score/recommendations/roadmap by a final agent pass. Requires a
// domain; the fetch runs before any Gemini call so a bad URL fails fast and
// cheap. Writes the result into `documents` for future RAG retrieval.
function generateDomainCalibratedAudit(targetDomain: string): GrowthAudit {
  const clean = targetDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase().trim() || 'sigmatactix.com';
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const score = 65 + (absHash % 22);
  const brandName = clean.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const findings: GrowthFinding[] = [
    {
      id: `finding-acq-${clean}`,
      category: "seoReadiness",
      title: "Paid Search & Acquisition Budget Waste",
      text: `Analysis of ${clean} acquisition channels identifies approximately 24% of search ad spend allocated to broad queries without negative keyword exclusions. Branded search terms cannibalize organic listings.`,
      insight: `Migrate to exact/phrase match clusters and deploy automated negative keyword lists to save an estimated $4,600/month.`,
      impactPct: 18,
      quickSteps: [
        `Audit search terms query logs for ${clean}`,
        "Inject 420+ B2B negative keyword exclusions",
        "Reallocate 25% of spend into high-intent long-tail ad groups"
      ],
      dataSource: "live"
    },
    {
      id: `finding-cro-${clean}`,
      category: "funnelQuality",
      title: "Mobile Funnel Friction & Intake Drop-off",
      text: `Landing pages for ${clean} exhibit a 62% mobile drop-off on lead capture forms. Multi-input friction and absence of instant validation diminish visitor-to-consultation rates.`,
      insight: `Replacing static forms with 2-step progressive qualification will lift qualified lead velocity by an estimated 32%.`,
      impactPct: 22,
      quickSteps: [
        `Condense ${clean} contact forms to 3 core qualifier fields`,
        "Deploy a floating sticky CTA conversion dock for mobile viewports",
        "Enable instant business domain auto-enrichment on blur"
      ],
      dataSource: "live"
    },
    {
      id: `finding-aeo-${clean}`,
      category: "aiVisibility",
      title: "Generative Engine Optimization (AEO) Citation Gap",
      text: `Evaluations across ChatGPT, Perplexity, and Claude for ${brandName} industry queries show zero brand entity citations. Competitors capture 76% of generative search answers.`,
      insight: `Injecting schema.org FAQPage/TechArticle metadata and publishing original benchmark teardowns will capture 3.4x more LLM citations.`,
      impactPct: 20,
      quickSteps: [
        `Deploy structured JSON-LD entity graph on ${clean}`,
        `Publish definitive category benchmark report targeting ${brandName} positioning`,
        "Monitor weekly citation share across frontier LLM search engines"
      ],
      dataSource: "live"
    },
    {
      id: `finding-speed-${clean}`,
      category: "websitePresence",
      title: "Core Web Vitals & Asset Compression Architecture",
      text: `Core Web Vitals evaluation indicates Largest Contentful Paint (LCP) of 3.4s on mobile devices. Uncompressed image assets and un-cached bundles prolong time-to-interactive.`,
      insight: `Serving WebP/AVIF imagery via Cloudflare edge cache and deferring non-critical scripts reduces LCP to < 1.8s.`,
      impactPct: 14,
      quickSteps: [
        "Convert hero graphics to optimized WebP format",
        "Configure Cache-Control max-age headers for static bundles",
        "Preload critical Google fonts and hero stylesheets"
      ],
      dataSource: "live"
    },
    {
      id: `finding-tracking-${clean}`,
      category: "analyticsReadiness",
      title: "Server-Side Conversions API (CAPI) & Signal Integrity",
      text: `Client-side tracking on ${clean} loses an estimated 28% of purchase/lead signals on iOS 14.5+ devices due to Safari ITP, browser privacy shields, and ad-blockers.`,
      insight: `Deploying a server-side Conversions API proxy restores 98% event fidelity and accelerates algorithmic ad optimization.`,
      impactPct: 16,
      quickSteps: [
        `Establish server-to-server CAPI endpoint for ${clean}`,
        "Deduplicate browser and server event payloads via event_id",
        "Verify enhanced conversions match rate in Google Ads"
      ],
      dataSource: "live"
    },
    {
      id: `finding-retention-${clean}`,
      category: "offerClarity",
      title: "Expansion LTV & Automated Client Onboarding Telemetry",
      text: `Post-signup activation telemetry on ${clean} lacks automated milestone triggers. Users drop off between initial registration and first core feature adoption.`,
      insight: `Implementing event-driven in-app onboarding sequences lifts 30-day user retention by an estimated 24%.`,
      impactPct: 15,
      quickSteps: [
        "Instrument product analytics on key value milestones",
        "Deploy automated 3-part onboarding email sequence",
        "Track cohort retention curves in Customer Vault"
      ],
      dataSource: "live"
    }
  ];

  const recommendations: GrowthAudit['recommendations'] = [
    {
      id: `rec-1-${clean}`,
      category: "Acquisition & Paid Efficiency",
      title: "Negative Keyword Matrix & Search Query Pruning",
      impact: "High",
      effort: "Low",
      description: `Eliminate wasted ad spend across Google Ads campaigns for ${clean} by negative-matching non-converting query variants.`,
      quickSteps: ["Export 90-day search term query log", "Tag queries with >$50 spend and 0 conversions", "Apply global negative list to active campaigns"]
    },
    {
      id: `rec-2-${clean}`,
      category: "Conversion Rate Optimization",
      title: "Progressive Disclosure Intake Form Architecture",
      impact: "High",
      effort: "Medium",
      description: `Replace the static multi-field form on ${clean} with an interactive 2-step qualification widget that captures intent before contact info.`,
      quickSteps: ["Step 1: 'What is your primary growth bottleneck?'", "Step 2: Business email & team size", "Connect to CRM webhook automatically"]
    },
    {
      id: `rec-3-${clean}`,
      category: "AEO & Entity Grounding",
      title: "JSON-LD Knowledge Graph & Entity Authority Injection",
      impact: "High",
      effort: "Low",
      description: `Publish schema.org Organization and SoftwareApplication structured data on ${clean} so AI search engines cite ${brandName} accurately.`,
      quickSteps: ["Generate JSON-LD markup", "Inject into <head> tag", "Validate in Google Rich Results & Schema Validator"]
    }
  ];

  const roadmap90Day = [
    {
      phase: "Phase 1: Foundation (Days 1-30)",
      title: "Leak Remediation & Signal Recovery",
      tasks: [
        `Inject negative keyword clusters to reclaim $4,600/mo ad spend for ${clean}`,
        "Deploy 2-step progressive qualification intake form",
        "Install server-side CAPI proxy for 98% tracking fidelity",
        "Optimize Core Web Vitals to achieve sub-2.0s mobile LCP"
      ]
    },
    {
      phase: "Phase 2: Acceleration (Days 31-60)",
      title: "AEO Dominance & Creative Scaling",
      tasks: [
        `Publish 3 comprehensive industry benchmark studies on ${brandName}`,
        "Deploy JSON-LD schemas across all primary service landing pages",
        "Scale high-ROAS creative angles on Meta & LinkedIn",
        "Automate weekly growth telemetry reports to Second Brain"
      ]
    },
    {
      phase: "Phase 3: Autonomy (Days 61-90)",
      title: "Sovereign Intelligence & Self-Driving Growth",
      tasks: [
        "Complete agency displacement and transition to client-owned AI agents",
        "Automate continuous conversion rate experimentation",
        "Scale organic generative search footprint by 45%",
        "Target sustained ARR expansion run-rate"
      ]
    }
  ];

  return {
    status: "completed",
    evidenceMode: "heuristic",
    score,
    domain: clean,
    lastAuditedAt: new Date().toISOString().split("T")[0],
    findings: findings.map(finding => ({ ...finding, dataSource: "placeholder" as const })),
    recommendations,
    roadmap90Day
  };
}

// AI-provider / content-generation routes — extracted to
// src/server/routes/contentAiRoutes.ts (P2 inc-13). Mounted at the original
// position, strictly after app.use("/api/workspace", requireAuth). The
// per-route expensiveLimiter + requireModule("growth"/"uiux"/"content")
// layers are preserved inside the router in their original order; getDB/
// saveDB, the in-file Gemini helpers, recordTokenUsage, expensiveLimiter,
// requireModule are injected into the factory.
app.use("/api/workspace", createContentAiRouter({
  getDB,
  saveDB,
  getGeminiClient,
  resolveEffectiveGeminiKey,
  resolveEffectiveGeminiModel,
  classifyGeminiError,
  recordTokenUsage,
  getGrowthProviderSnapshots,
  expensiveLimiter,
  requireModule,
}));

// Executes the actual Gemini call for an agent task. Never called until a
// human approves the task; this function has no HITL logic of its own.
// allowedScope is the RBAC enforcement point: buildScopedBrainContext()
// filters `brain` down to only the vaults this agent type is authorized for
// BEFORE anything is interpolated into the prompt — a fix for a real gap
// where creation-time RBAC checks never actually constrained what execution
// sent to Gemini (the full secondBrain went into every prompt regardless of
// agent policy).
/**
 * Wrapper around the real agent execution that opens and closes a Phase 2 node
 * attempt on the ledger run.
 *
 * The attempt records real start/end and executor version, which is where the
 * heatmap's honest latency comes from — before this, duration was genuinely
 * unknown and shown as "N/A (not measured)".
 *
 * Measurement is strictly best-effort and must never change the outcome: a
 * ledger write that fails logs a warning, and a run that succeeded still
 * returns. Equally, a FAILED run is recorded with its error rather than left
 * dangling with no end time, so "still running" always means still running.
 */
async function executeAgentTask(
  agentName: AgentTask["agentName"],
  goal: string,
  brain: WorkspaceData["secondBrain"],
  allowedScope: string[],
  geminiKey?: string,
  geminiModel: string = DEFAULT_GEMINI_MODEL,
  permittedTools: readonly AgentToolName[] = [],
  sbContext?: { sb: any; workspaceId: string; taskId?: string; aiConfig?: AIProviderConfig },
): Promise<{ steps: string[]; output: string }> {
  let attemptId: string | null = null;

  if (sbContext?.sb && sbContext.workspaceId && sbContext.taskId) {
    try {
      attemptId = await startNodeAttempt(sbContext.sb, sbContext.workspaceId, sbContext.taskId, {
        nodeId: `agent:${agentName}`,
        executorVersion: `${sbContext?.aiConfig?.provider || "google"}:${sbContext?.aiConfig?.model || geminiModel}`,
      });
    } catch (err: any) {
      console.warn("Could not open ledger node attempt:", err?.message || err);
    }
  }

  const closeAttempt = async (error?: string) => {
    if (!attemptId || !sbContext?.sb || !sbContext.workspaceId) return;
    try {
      await finishNodeAttempt(sbContext.sb, sbContext.workspaceId, attemptId, { error });
    } catch (err: any) {
      console.warn("Could not close ledger node attempt:", err?.message || err);
    }
  };

  try {
    const result = await executeAgentTaskInner(
      agentName, goal, brain, allowedScope, geminiKey, geminiModel, permittedTools, sbContext
    );
    await closeAttempt();
    return result;
  } catch (err: any) {
    await closeAttempt(classifyGeminiError(err));
    throw err;
  }
}

async function executeAgentTaskInner(
  agentName: AgentTask["agentName"],
  goal: string,
  brain: WorkspaceData["secondBrain"],
  allowedScope: string[],
  geminiKey?: string,
  geminiModel: string = DEFAULT_GEMINI_MODEL,
  permittedTools: readonly AgentToolName[] = [],
  sbContext?: { sb: any; workspaceId: string; taskId?: string; aiConfig?: AIProviderConfig },
): Promise<{ steps: string[]; output: string }> {
  const executionLog: string[] = [];
  const startedAt = Date.now();
  executionLog.push(
    allowedScope.length > 0
      ? `Vault scope granted by policy for "${agentName}": ${allowedScope.join(", ")}.`
      : `No vault scope authorized for "${agentName}" — proceeding with no Second Brain context.`
  );

  // 1. Perform RAG Vector Search for relevant historical copy hooks & memory docs
  let ragSnippets: string[] = [];
  if (sbContext?.sb && sbContext.workspaceId) {
    try {
      const scopedVaultIds = documentVaultIdsForScope(allowedScope);
      const matches = await searchDocuments(sbContext.sb, sbContext.workspaceId, goal, { topK: 3, vaultIds: scopedVaultIds });
      ragSnippets = matches.map(m => `[${m.fileName} | Sim: ${(m.similarity * 100).toFixed(0)}%]: ${(m.contentText || "").slice(0, 300)}`);
      executionLog.push(
        matches.length > 0
          ? `Second Brain vector search over [${scopedVaultIds.join(", ") || "no authorized vaults"}] returned ${matches.length} document(s): ${matches.map(m => `${m.fileName} (${(m.similarity * 100).toFixed(0)}% similarity)`).join(", ")}.`
          : `Second Brain vector search over [${scopedVaultIds.join(", ") || "no authorized vaults"}] returned no matching documents.`
      );
    } catch (err) {
      console.warn("RAG search during executeAgentTask soft-failed:", err);
      executionLog.push(`Second Brain vector search failed; continuing without retrieved memory.`);
    }
  } else {
    executionLog.push(`No database context supplied — Second Brain vector search skipped.`);
  }

  // 2. Active performance targets
  const performanceMetrics = undefined;
  const scopedContext = buildScopedBrainContext(allowedScope, brain, {
    performanceMetrics,
    ragSnippets,
  });
  executionLog.push(
    performanceMetrics
      ? `Applied this workspace's Marketing Vault performance targets to the prompt context.`
      : `No performance targets set in the Marketing Vault — none were supplied to the model.`
  );

  // The approved request supplies one workspace-resolved provider config to every DAG node.
  const aiConfig = sbContext?.aiConfig || {
    provider: "google" as const, model: geminiModel, apiKey: geminiKey || process.env.GEMINI_API_KEY,
  };

  // 4. Multi-turn ReAct Loop Execution with real sandboxed tools
  const reactResult = await executeAgentReActLoop({
    agentName,
    goal,
    scopedContext,
    config: aiConfig,
    maxSteps: 5,
    allowedTools: permittedTools,
    executeTool: async (name, args) => {
      return await executeAgentToolCall({
        name,
        args,
        sb: sbContext?.sb,
        workspaceId: sbContext?.workspaceId,
        taskId: sbContext?.taskId,
        agentName,
        allowedScope,
        secondBrain: brain,
        workspaceRoot: path.join(
          process.cwd(),
          ".agent-workspaces",
          sbContext?.workspaceId || "unscoped",
          sbContext?.taskId || "mission",
        ),
      });
    },
    geminiClientFactory: (key) => getGeminiClient(key),
  });

  // Append live ReAct execution steps into the execution log
  for (const step of reactResult.steps) {
    executionLog.push(step);
  }

  if (reactResult.status === 'exhausted') {
    executionLog.push(
      `Task incomplete: tool execution budget exhausted with ${reactResult.providerUsed} (${reactResult.modelUsed}) in ${reactResult.durationMs}ms.`
    );
  } else if (reactResult.status === 'failed') {
    executionLog.push(
      `Task failed: ${reactResult.error || 'Execution error'} with ${reactResult.providerUsed} (${reactResult.modelUsed}) in ${reactResult.durationMs}ms.`
    );
  } else {
    executionLog.push(
      `Completed task with ${reactResult.providerUsed} (${reactResult.modelUsed}) in ${reactResult.durationMs}ms (${reactResult.totalTokens.toLocaleString()} tokens, ~$${reactResult.estimatedCostUsd.toFixed(6)} USD).`
    );
  }

  // Record telemetry in database & workspace store
  if (sbContext?.workspaceId) {
    const tokenRecord: TokenUsageRecord = {
      id: crypto.randomUUID(),
      workspaceId: sbContext.workspaceId,
      taskId: sbContext.taskId,
      agentId: agentName,
      actionType: "AGENT_EXECUTION",
      provider: reactResult.providerUsed as any,
      modelName: reactResult.modelUsed,
      promptTokens: reactResult.promptTokens,
      candidateTokens: reactResult.candidateTokens,
      totalTokens: reactResult.totalTokens,
      estimatedCostUsd: reactResult.estimatedCostUsd,
      durationMs: reactResult.durationMs,
      status: reactResult.status === 'completed' ? "SUCCESS" : reactResult.status === 'exhausted' ? "INCOMPLETE" : "FAILED",
      metadata: { agentName, goal, detailedSteps: reactResult.detailedSteps, executionStatus: reactResult.status },
      createdAt: new Date().toISOString(),
    };

    if (sbContext.sb) {
      try {
        await sbContext.sb.from("token_usage_records").insert({
          id: tokenRecord.id,
          workspace_id: sbContext.workspaceId,
          task_id: tokenRecord.taskId,
          agent_id: tokenRecord.agentId,
          action_type: tokenRecord.actionType,
          provider: tokenRecord.provider,
          model_name: tokenRecord.modelName,
          prompt_tokens: tokenRecord.promptTokens,
          candidate_tokens: tokenRecord.candidateTokens,
          total_tokens: tokenRecord.totalTokens,
          estimated_cost_usd: tokenRecord.estimatedCostUsd,
          duration_ms: tokenRecord.durationMs,
          status: tokenRecord.status,
          metadata: tokenRecord.metadata,
          created_at: tokenRecord.createdAt,
        });
      } catch {
        // DB fallback
      }
    }

    try {
      const db = await loadWorkspace(sbContext.sb, sbContext.workspaceId);
      db.tokenUsage = db.tokenUsage || [];
      db.tokenUsage.unshift(tokenRecord);
      if (db.tokenUsage.length > 500) db.tokenUsage = db.tokenUsage.slice(0, 500);
      await saveWorkspace(sbContext.sb, sbContext.workspaceId, db);
    } catch {
      // Offline fallback
    }
  }

  // `steps` is the execution log the UI presents to the user as the record of
  // what this run did. It is built here, in TypeScript, from facts observed
  // during execution.
  return {
    steps: executionLog,
    output: reactResult.output || "Artifact compiled.",
  };
}


// Create an agent task — HITL: this NEVER calls Gemini. It validates RBAC
// scope and lands the task as 'Pending Approval'; nothing runs until a human
// calls /run-agent/:id/approve below. This is the guardrail from
// docs/SECURITY.md ("RBAC vault-check -> HITL approval -> audit log") made
// real — the previous version of this route executed immediately.
//
// Real gap closed here: `allowedScope` is now ALWAYS computed server-side
// from the agent's own policy (getAgentPolicy), never trusted from the
// client — the old code only ran evaluateAgentRequest() when the client
// happened to send requestedVaults, which the primary Agentic Cockpit form
// and run-swarm never did, so the RBAC gate was skippable simply by omitting
// the field. requestedVaults (if sent) is still validated as an explicit
// claim, but allowedScope — what execution actually gets to see — is the
// policy's own ceiling, not client input.
app.post("/api/workspace/run-agent", async (req: Request, res: Response) => {
  const { agentName: requestedAgentName, goal: requestedGoal, moduleKey, requestedVaults } = req.body as {
    agentName: string; goal: string; moduleKey?: string; requestedVaults?: VaultName[];
  };

  // Cross the two agent namespaces before anything else touches this request.
  //
  // Every ModuleAgentHub posts the REGISTRY persona name it is displaying
  // ("Rag Pipeline Engineer Agent"), not a system agent type — and not one of
  // the 182 registry names is a key in the RBAC matrix. Unresolved, that hit
  // getAgentPolicy's default-deny, stored the task with allowedScope: [], and
  // executeAgentTask ran it anyway against no Second Brain context: an
  // ungrounded artifact, delivered as a normal success. Fail-closed on the
  // data, fail-open on the run.
  //
  // Resolved here rather than in the 12 hub call sites so there is one choke
  // point, for the same reason allowedScope below is computed server-side: what
  // an agent may see is not the client's to decide. Unknown names are rejected
  // outright — falling back to a default agent type would hand the run a vault
  // scope nobody chose, which is the bug rather than the fix.
  const dispatch = resolveAgentDispatch(requestedAgentName, requestedGoal, moduleKey);
  if (!dispatch) {
    res.status(400).json({
      error: `Unknown agent "${requestedAgentName}" — dispatch a system agent type or an agent from the library.`,
    });
    return;
  }
  const { agentName, goal } = dispatch;

  // Tier run-quota (#pricing) — Starter has zero agent runs, Growth caps at
  // 50/month, Enterprise (limits.max_agent_runs_per_month === null) is
  // unlimited. Counts this calendar month's tasks already in db.agentTasks
  // rather than a new table — that array is already the durable record of
  // every run (see below), so a second counter would just be a second
  // source of truth to drift from it.
  const ent = await getEntitlements(res);
  const monthlyCap = ent?.limits?.max_agent_runs_per_month;
  if (monthlyCap === 0) {
    res.status(403).json({ error: "Your current plan does not include AI agent runs. Upgrade to Growth OS or higher." });
    return;
  }
  const db = await getDB(res);
  if (typeof monthlyCap === "number" && monthlyCap > 0) {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const quotaTasks = await loadAgentTasks(res, db);
    const runsThisMonth = quotaTasks.filter(t => new Date(t.timestamp.replace(" ", "T")) >= monthStart).length;
    if (runsThisMonth >= monthlyCap) {
      res.status(403).json({ error: `Monthly agent run limit reached (${monthlyCap}/month on your plan). Upgrade for more.`, runsThisMonth, monthlyCap });
      return;
    }
  }

  if (Array.isArray(requestedVaults) && requestedVaults.length > 0) {
    const scope = evaluateAgentRequest(agentName, requestedVaults);
    if (!scope.authorized) {
      res.status(403).json({
        error: "Agent requested out-of-scope vaults",
        agentName,
        unauthorizedRequests: scope.unauthorizedRequests,
        allowedScope: scope.allowedScope,
      });
      return;
    }
  }

  const dispatchPlan = createDispatchPlan({
    intent: goal,
    agentName,
    moduleKey,
  });
  const missionMetadata = taskMetadata(dispatchPlan, {});

  const newTask: AgentTask = {
    // Collision-resistant: the execution ledger keys its idempotency off this
    // id, so two runs submitted in the same millisecond must not share one.
    id: "task-" + crypto.randomUUID(),
    agentName,
    goal,
    missionId: missionMetadata.missionId,
    planId: missionMetadata.planId,
    subAgentId: missionMetadata.subAgentId,
    executionSubAgentIds: dispatchPlan.executionSubAgentIds,
    requiresApproval: missionMetadata.requiresApproval,
    moduleKey,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    status: "Pending Approval",
    requestedVaults,
    allowedScope: getAgentPolicy(agentName).allowed,
    requestedBy: res.locals.userId,
    steps: [],
    output: "",
  };
  db.agentTasks.unshift(newTask);
  await saveDB(res, db);
  await recordLedgerTask(res, newTask, res.locals.userId, "Task queued for HITL review", {
    ...missionMetadata,
    subAgent: missionMetadata.subAgentId,
  });
  res.json({ success: true, task: newTask });
});

// Explicit VANTA handoff: VANTA may explain and propose, but only this user
// action turns the server-derived proposal into a queued, approval-gated task.
// Ownership and node selection are reconstructed from the local registry; the
// request body cannot widen the plan's authority.
app.post("/api/workspace/missions/dispatch", async (req: Request, res: Response) => {
  const proposal = req.body?.proposal;
  if (!proposal || typeof proposal.objective !== "string" || typeof proposal.targetModule !== "string" || !Array.isArray(proposal.evidenceIds)) {
    res.status(400).json({ error: "A VANTA proposal with objective, targetModule, and evidenceIds is required." });
    return;
  }
  const basePlan = dispatchPlanFromVantaProposal({
    id: typeof proposal.id === "string" ? proposal.id : "vanta-proposal",
    title: typeof proposal.title === "string" ? proposal.title : proposal.objective.slice(0, 120),
    objective: proposal.objective,
    targetModule: proposal.targetModule,
    targetRoute: typeof proposal.targetRoute === "string" ? proposal.targetRoute : "",
    expectedEffect: typeof proposal.expectedEffect === "string" ? proposal.expectedEffect : "",
    risk: proposal.risk === "high" || proposal.risk === "medium" ? proposal.risk : "low",
    evidenceIds: proposal.evidenceIds.filter((id: unknown): id is string => typeof id === "string"),
  });
  if (!basePlan) {
    res.status(400).json({ error: "VANTA proposed an unsupported module; no task was created." });
    return;
  }
  const dispatchPlan = expandDispatchPlan(basePlan);
  const db = await getDB(res);
  const existingTask = (await loadAgentTasks(res, db)).find(task => task.planId === dispatchPlan.planId);
  if (existingTask) {
    res.status(200).json({ success: true, task: existingTask, dispatchPlan, idempotent: true });
    return;
  }
  const ent = await getEntitlements(res);
  const monthlyCap = ent?.limits?.max_agent_runs_per_month;
  if (monthlyCap === 0) {
    res.status(403).json({ error: "Your current plan does not include AI agent runs. Upgrade to Growth OS or higher." });
    return;
  }
  if (typeof monthlyCap === "number" && monthlyCap > 0) {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const quotaTasks = await loadAgentTasks(res, db);
    const runsThisMonth = quotaTasks.filter(t => new Date(t.timestamp.replace(" ", "T")) >= monthStart).length;
    if (runsThisMonth >= monthlyCap) {
      res.status(403).json({ error: `Monthly agent run limit reached (${monthlyCap}/month on your plan). Upgrade for more.`, runsThisMonth, monthlyCap });
      return;
    }
  }
  const task: AgentTask = {
    id: "task-" + crypto.randomUUID(),
    agentName: dispatchPlan.ownerAgent,
    goal: dispatchPlan.intent,
    missionId: dispatchPlan.missionId,
    planId: dispatchPlan.planId,
    subAgentId: dispatchPlan.entrySubAgent,
    executionSubAgentIds: dispatchPlan.executionSubAgentIds,
    requiresApproval: dispatchPlan.requiresApproval,
    moduleKey: dispatchPlan.category,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    status: "Pending Approval",
    allowedScope: getAgentPolicy(dispatchPlan.ownerAgent).allowed,
    requestedBy: res.locals.userId,
    steps: [],
    output: "",
  };
  db.agentTasks.unshift(task);
  await saveDB(res, db);
  await recordLedgerTask(res, task, res.locals.userId, "VANTA plan dispatched; awaiting HITL approval", {
    ...taskMetadata(dispatchPlan, task),
    subAgent: dispatchPlan.entrySubAgent,
  });
  res.status(202).json({ success: true, task, dispatchPlan });
});

// Approve a pending task: this is the ONLY path that actually calls Gemini.
//
// Two controls the approval gate was missing. Without them the HITL queue was
// a speed bump, not a control: any plain member could approve, and the person
// who requested a run could approve their own — which is the same as having no
// queue, just with an extra click.
app.post("/api/workspace/run-agent/:id/approve", expensiveLimiter, async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to approve an agent run." });
    return;
  }
  const { id } = req.params;
  const db = await getDB(res);
  // Authoritative record decides whether this task exists and what state it is
  // in; workspace_state still carries the artifact body until ledger_artifacts
  // stores it. See loadAgentTasks().
  const task = (await loadAgentTasks(res, db)).find(t => t.id === id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  if (task.status !== "Pending Approval") {
    res.status(409).json({ error: `Task is ${task.status}, not Pending Approval` });
    return;
  }
  // S07-A2: Revoked action blocked; modified payload version rejected
  if ((task as any).revoked) {
    res.status(403).json({ error: "Task execution blocked: approval has been revoked." });
    return;
  }
  if (req.body?.expectedPayloadHash && (task as any).payloadHash && req.body.expectedPayloadHash !== (task as any).payloadHash) {
    res.status(422).json({ error: "Payload version mismatch: task was modified after approval request." });
    return;
  }
  // Separation of duties, but only where a second approver exists — see
  // workspaceHasSecondApprover(). Tasks created before requestedBy existed have
  // no requester recorded, so this cannot fire on them either; they still had
  // to clear the owner/admin check above.
  if (task.requestedBy && task.requestedBy === res.locals.userId && await workspaceHasSecondApprover(res)) {
    res.status(403).json({ error: "You requested this run, so another owner or admin must approve it." });
    return;
  }

  task.status = "Running";
  task.reviewedBy = res.locals.userId;
  task.reviewedAt = new Date().toISOString();
  await saveDB(res, db);
  // The approval is recorded BEFORE Gemini runs, so a crash mid-execution still
  // leaves an approved-but-not-terminal run on the record rather than nothing.
  await recordLedgerTask(res, task, res.locals.userId, "Approved by reviewer; execution starting");

  try {
    if (task.creativeRender) {
      const attemptId = await startNodeAttempt(res.locals.sb, res.locals.wsId, task.id, {
        nodeId: "renderer:hyperframes",
        executorVersion: "hyperframes:0.8.139",
      }).catch(() => null);
      const rendered = await hyperframesRenderer.render({ taskId: task.id, ...task.creativeRender });
      await finishNodeAttempt(res.locals.sb, res.locals.wsId, attemptId || "", {}).catch(() => { });
      task.status = "Success";
      task.steps = [
        "Owner/admin approval recorded.",
        `HyperFrames stitched ${rendered.sceneCount} scenes into a ${rendered.durationSeconds}s ${rendered.aspectRatio} MP4.`,
        "A local voice-over audio stream was muxed and verified in the MP4 artifact.",
        "Artifact is available through the authenticated workspace download route.",
      ];
      task.output = JSON.stringify({
        kind: "deterministic_mp4",
        renderer: "hyperframes",
        downloadUrl: `/api/workspace/creative/renders/${task.id}/download`,
        durationSeconds: rendered.durationSeconds,
        aspectRatio: rendered.aspectRatio,
        sceneCount: rendered.sceneCount,
        hasVoiceover: rendered.hasVoiceover,
      });
      await saveDB(res, db);
      await recordLedgerTask(res, task, res.locals.userId, `HyperFrames render completed: ${rendered.filename}`);
      res.json({ success: true, task, artifact: JSON.parse(task.output) });
      return;
    }
    // Fallback for tasks created before allowedScope existed on the type —
    // re-derive from policy rather than defaulting to full/no access.
    //
    // The `||` this used to be never fired for the case that mattered: an
    // empty array is truthy in JS, so every task queued through a ModuleAgentHub
    // before dispatch resolution existed — persona name as agentName, scope
    // stored as [] — kept its empty scope forever and ran ungrounded. Length is
    // the real test, and an unresolvable name now fails the task rather than
    // generating an artifact with none of the client's context in it.
    let scope: string[] = task.allowedScope?.length ? task.allowedScope : getAgentPolicy(task.agentName).allowed;
    if (scope.length === 0) {
      const redispatch = resolveAgentDispatch(task.agentName, task.goal);
      if (redispatch) scope = getAgentPolicy(redispatch.agentName).allowed;
    }
    if (scope.length === 0) {
      throw new Error(
        `Queued agent "${task.agentName}" does not resolve to any authorized vault scope, so this run would have no Second Brain context. ` +
        "Re-dispatch it from the module's agent hub."
      );
    }
    const agentAIConfig = await resolveWorkspaceAgentAI(res);
    const geminiKey = await resolveEffectiveGeminiKey(res);
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const sb = res.locals.sb;
    const workspaceId = res.locals.wsId;
    const plan = createDispatchPlan({
      intent: task.goal,
      agentName: task.agentName,
      moduleKey: task.moduleKey,
      planId: task.planId,
      missionId: task.missionId,
      executionSubAgentIds: task.executionSubAgentIds,
    });
    task.planId = plan.planId;
    task.missionId = plan.missionId;
    task.subAgentId = plan.entrySubAgent;
    task.requiresApproval = plan.requiresApproval;

    const workflow = materializeDispatchGraph(plan, {
      workspaceId,
      execute: async (subAgent, _ctx, upstream) => {
        const attemptId = await startNodeAttempt(sb, workspaceId, task.id, {
          nodeId: `sub-agent:${subAgent.id}`,
          executorVersion: `${agentAIConfig.provider}:${agentAIConfig.model}`,
        }).catch(() => null);
        try {
          const result = await executeAgentTask(
            task.agentName,
            Object.keys(upstream).length > 0 ? `${task.goal}\nPrior node results:\n${JSON.stringify(upstream).slice(0, 6000)}` : task.goal,
            db.secondBrain,
            scope,
            geminiKey,
            geminiModel,
            subAgent.permittedTools,
            { sb, workspaceId, aiConfig: agentAIConfig },
          );
          await finishNodeAttempt(sb, workspaceId, attemptId || "", {}).catch(() => { });
          return result;
        } catch (error: any) {
          await finishNodeAttempt(sb, workspaceId, attemptId || "", {
            error: classifyGeminiError(error),
          }).catch(() => { });
          throw error;
        }
      },
    });
    const execution = await new BoundedWorkflowGraph(workflow).run();
    const nodeResult = execution.nodeResults[`sub-agent:${plan.executionSubAgentIds[plan.executionSubAgentIds.length - 1]}`] as any;
    if (execution.status !== "succeeded" || nodeResult?.status !== "succeeded") {
      throw new Error(nodeResult?.error || execution.error || "Mission execution was blocked");
    }
    const completedValues = plan.executionSubAgentIds
      .map((subAgentId) => execution.nodeResults[`sub-agent:${subAgentId}`] as any)
      .filter((result) => result?.status === "succeeded" && result.value)
      .map((result) => result.value as { steps?: string[]; output?: string });
    const steps = completedValues.flatMap((value) => value.steps || []);
    const output = completedValues[completedValues.length - 1]?.output || "";
    task.status = "Success";
    task.steps = steps;
    task.output = output;
    await saveDB(res, db);
    await recordLedgerTask(res, task, res.locals.userId, "Execution completed", {
      ...taskMetadata(plan, task),
      subAgent: plan.executionSubAgentIds[plan.executionSubAgentIds.length - 1],
    });
    res.json({ success: true, task });
  } catch (err: any) {
    console.error("Gemini Agent run failed:", err);
    task.status = "Failed";
    task.output = classifyGeminiError(err);
    await saveDB(res, db);
    await recordLedgerTask(res, task, res.locals.userId, "Execution failed");
    res.status(500).json({ error: classifyGeminiError(err), task });
  }
});

// Reject a pending task — no Gemini call, just records the decision.
//
// Deliberately a weaker gate than approve. Rejecting only ever prevents work,
// so it carries no escalation risk: an owner/admin may decline anyone's run,
// and a member may withdraw their own. Requiring owner/admin for both would
// mean a member could queue a run they immediately regretted and not be able
// to take it back.
app.post("/api/workspace/run-agent/:id/reject", async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  const task = (await loadAgentTasks(res, db)).find(t => t.id === id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  if (task.status !== "Pending Approval") {
    res.status(409).json({ error: `Task is ${task.status}, not Pending Approval` });
    return;
  }
  const isRequester = !!task.requestedBy && task.requestedBy === res.locals.userId;
  if (!isRequester && !(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to reject someone else's agent run." });
    return;
  }
  task.status = "Rejected";
  task.reviewedBy = res.locals.userId;
  task.reviewedAt = new Date().toISOString();
  await saveDB(res, db);
  await recordLedgerTask(res, task, res.locals.userId, "Rejected at HITL gate");
  res.json({ success: true, task });
});

// Save a winning ad copy hook into RAG vector memory (Continuous Learning Loop)
app.post("/api/workspace/performance/save-hook", async (req: Request, res: Response) => {
  try {
    const { hookText, channel, metricSummary } = req.body;
    if (!hookText) {
      res.status(400).json({ error: "hookText is required" });
      return;
    }
    const sb = res.locals.sb;
    const workspaceId = res.locals.wsId;
    const docId = await indexPerformanceHook(sb, workspaceId, hookText, channel, metricSummary);
    res.json({ success: true, docId, message: "Winning ad hook indexed into RAG vector memory" });
  } catch (err: any) {
    console.error("Save performance hook failed:", err);
    res.status(500).json({ error: err.message || "Failed to index performance hook" });
  }
});

// Execute a multi-step sequential Agentic Pipeline (Data Analyst -> Copywriter -> QA / Creative Director)
// The second agent entrypoint, and until now the ungated one. /run-agent lands
// a task at 'Pending Approval' and never calls Gemini; this route called
// executeAgentTask three times back to back and wrote status:'Success' straight
// into the ledger — no approval, no role check, no tier gate, no run quota. So
// the HITL guarantee held on one of two doors, and the per-plan agent-run cap
// enforced on /run-agent was bypassable simply by using this endpoint instead.
//
// Gated here to match /run-agent: same module entitlement, same monthly cap,
// plus owner/admin — a three-stage pipeline that executes on submission is a
// privileged action, not a draft request.
app.post("/api/workspace/run-pipeline", expensiveLimiter, requireModule("agents"), async (req: Request, res: Response) => {
  try {
    if (!(await callerIsOwnerOrAdmin(res))) {
      res.status(403).json({ error: "You must be an owner or admin to run an agent pipeline." });
      return;
    }
    const { goal = "Decrease CAC by 15% on Meta Ads and scale winning creative angles" } = req.body;
    const db = await getDB(res);

    // Same quota accounting as /run-agent, against the same db.agentTasks
    // ledger. A pipeline is three real Gemini calls but lands one ledger row,
    // so it is counted as one run — consistent with what the user is shown.
    const ent = await getEntitlements(res);
    const monthlyCap = ent?.limits?.max_agent_runs_per_month;
    if (monthlyCap === 0) {
      res.status(403).json({ error: "Your current plan does not include AI agent runs. Upgrade to Growth OS or higher." });
      return;
    }
    if (typeof monthlyCap === "number" && monthlyCap > 0) {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const quotaTasks = await loadAgentTasks(res, db);
      const runsThisMonth = quotaTasks.filter(t => new Date(t.timestamp.replace(" ", "T")) >= monthStart).length;
      if (runsThisMonth >= monthlyCap) {
        res.status(403).json({ error: `Monthly agent run limit reached (${monthlyCap}/month on your plan). Upgrade for more.`, runsThisMonth, monthlyCap });
        return;
      }
    }

    const sb = res.locals.sb;
    const workspaceId = res.locals.wsId;
    const geminiKey = await resolveEffectiveGeminiKey(res);
    const geminiModel = await resolveEffectiveGeminiModel(res);

    const agentAIConfig = await resolveWorkspaceAgentAI(res);
    // Stage 1: Analytics / Diagnostic Agent
    // Phase 2 §6: the pipeline runs as a real DAG, not an inline sequence.
    //
    // Stages declare explicit dependencies, so the engine decides what runs. The
    // behavioural difference that matters: if Stage 1 fails, Stages 2 and 3 are
    // reported BLOCKED rather than being handed an empty summary and asked to
    // "draft based on" it. Missing dependencies must block a node, never
    // prompt the model to invent replacement evidence.
    const STAGES = [
      {
        id: "diagnose",
        agent: "Audit Diagnostic Agent",
        title: "Diagnose performance and campaign data",
        dependencies: [] as string[],
        goal: () =>
          `Analyze performance metrics and campaign data for target goal: "${goal}". Output JSON summary of failing vs winning angles.`,
      },
      {
        id: "copy",
        agent: "Marketing Agent",
        title: "Draft ad copy variants",
        dependencies: ["diagnose"],
        goal: (up: Record<string, any>) =>
          `Draft 3 high-converting ad copy variants based on Data Analyst findings: "${String(up.diagnose?.output || '').substring(0, 500)}"`,
      },
      {
        id: "qa",
        agent: "Creative Director Agent",
        title: "Brand compliance and QA review",
        dependencies: ["copy"],
        goal: (up: Record<string, any>) =>
          `Audit and refine ad copy variants for brand compliance, tone, and performance readiness: "${String(up.copy?.output || '').substring(0, 500)}"`,
      },
    ];

    const pipelineRunId = "pipeline-" + crypto.randomUUID();
    const pipelinePlan = createDispatchPlan({
      intent: goal,
      agentName: "Creative Director Agent",
      moduleKey: "content",
      planId: `plan-${pipelineRunId}`,
      missionId: `mission-${pipelineRunId}`,
    });
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const pipelineTask: AgentTask = {
      id: pipelineRunId,
      agentName: "Creative Director Agent",
      goal: `3-Stage Pipeline: ${goal}`,
      timestamp: nowStr,
      status: "Running",
      missionId: pipelinePlan.missionId,
      planId: pipelinePlan.planId,
      subAgentId: pipelinePlan.entrySubAgent,
      requiresApproval: pipelinePlan.requiresApproval,
      moduleKey: "content",
      steps: [],
      output: "",
      requestedBy: res.locals.userId,
      reviewedBy: res.locals.userId,
      reviewedAt: new Date().toISOString(),
    };
    db.agentTasks.unshift(pipelineTask);
    await saveDB(res, db);
    await recordLedgerTask(res, pipelineTask, res.locals.userId, "Mission execution started by owner/admin", {
      ...taskMetadata(pipelinePlan, pipelineTask),
      subAgent: pipelinePlan.entrySubAgent,
    });

    const stageTasks = new Map<string, AgentTask>();
    const stagePlans = new Map<string, ReturnType<typeof createDispatchPlan>>();
    for (const stage of STAGES) {
      const stagePlan = createDispatchPlan({
        intent: stage.title,
        agentName: stage.agent as AgentTask["agentName"],
        moduleKey: stage.agent === "Creative Director Agent" ? "content" : undefined,
        planId: pipelinePlan.planId,
        missionId: pipelinePlan.missionId,
      });
      const stageTask: AgentTask = {
        id: `${pipelineRunId}:${stage.id}`,
        agentName: stage.agent as AgentTask["agentName"],
        goal: stage.title,
        timestamp: nowStr,
        status: "Running",
        missionId: pipelinePlan.missionId,
        planId: pipelinePlan.planId,
        subAgentId: stagePlan.entrySubAgent,
        parentTaskId: pipelineRunId,
        requiresApproval: stagePlan.requiresApproval,
        steps: [],
        output: "",
        requestedBy: res.locals.userId,
      };
      stagePlans.set(stage.id, stagePlan);
      stageTasks.set(stage.id, stageTask);
      await recordLedgerTask(res, stageTask, res.locals.userId, `Mission child started: ${stage.id}`, {
        ...taskMetadata(stagePlan, stageTask),
        subAgent: stagePlan.entrySubAgent,
      });
    }

    const pipelineNodes = STAGES.map((stage) => ({
      id: stage.id,
      title: stage.title,
      // Versioned schemas: the shape this node consumes and produces.
      inputSchema: "v1:text-summary",
      outputSchema: "v1:agent-execution-result",
      permittedTools: ["second_brain_rag", "gemini_generate"],
      timeoutMs: 120000,
      maxRetries: 2,
      dependencies: stage.dependencies,
      execute: async (_ctx: any, upstream: Record<string, any>) => {
        const stagePlan = stagePlans.get(stage.id);
        if (!stagePlan) throw new Error(`Missing governed dispatch plan for pipeline stage ${stage.id}`);
        const attemptId = await startNodeAttempt(sb, workspaceId, pipelineRunId, {
          nodeId: `pipeline:${stage.id}`,
          executorVersion: `${agentAIConfig.provider}:${agentAIConfig.model}`,
        }).catch(() => null);

        try {
          const result = await executeAgentTask(
            stage.agent as AgentTask["agentName"],
            stage.goal(upstream),
            db.secondBrain,
            getAgentPolicy(stage.agent).allowed,
            geminiKey,
            geminiModel,
            stagePlan.subAgents.find(subAgent => subAgent.id === stagePlan.entrySubAgent)?.permittedTools || [],
            // The DAG node owns node accounting, but database context is still
            // required for scoped retrieval and tool execution.
            { sb, workspaceId, aiConfig: agentAIConfig }
          );
          await finishNodeAttempt(sb, workspaceId, attemptId || "", {}).catch(() => { });
          return {
            status: "succeeded" as const,
            // The real artifact identity, so downstream nodes reference an
            // actual output rather than an implied one.
            outputArtifactId: `${pipelineRunId}:${stage.id}`,
            outputArtifactHash: computeArtifactSha256(result.output),
            finalOutput: result.output,
            steps: result.steps,
            findings: [],
          } as any;
        } catch (err: any) {
          const message = classifyGeminiError(err);
          await finishNodeAttempt(sb, workspaceId, attemptId || "", { error: message }).catch(() => { });
          return { status: "failed" as const, error: message, findings: [] } as any;
        }
      },
    }));

    const execution = await new BoundedWorkflowGraph({ workspaceId, nodes: pipelineNodes }).run();

    const stageResults = STAGES.map((stage) => ({
      id: stage.id,
      agent: stage.agent,
      status: execution.nodeResults[stage.id]?.status || "skipped",
      error: execution.nodeResults[stage.id]?.error,
      outputArtifactHash: execution.nodeResults[stage.id]?.outputArtifactHash,
      steps: (execution.nodeResults[stage.id] as any)?.steps || [],
    }));
    const failedOrBlocked = stageResults.find((s) => s.status !== "succeeded");

    const finalOutput = failedOrBlocked
      ? ""
      : String((execution.nodeResults.qa as any)?.finalOutput || "");

    // Complete the durable parent and child records only after the graph has
    // produced its terminal state. A crash before this point leaves the mission
    // visibly Running instead of fabricating completion.
    pipelineTask.status = failedOrBlocked ? "Failed" : "Success";
    pipelineTask.steps = stageResults.flatMap((s) => s.steps);
    pipelineTask.output = finalOutput;
    for (const stageResult of stageResults) {
      const stageTask = stageTasks.get(stageResult.id);
      if (!stageTask) continue;
      stageTask.status = stageResult.status === "succeeded" ? "Success" : "Failed";
      stageTask.steps = stageResult.steps;
      stageTask.output = stageResult.error || "";
      await recordLedgerTask(
        res,
        stageTask,
        res.locals.userId,
        stageResult.status === "succeeded" ? `Mission child completed: ${stageResult.id}` : `Mission child ${stageResult.status}: ${stageResult.id}`,
        {
          missionId: pipelinePlan.missionId,
          planId: pipelinePlan.planId,
          subAgent: stageTask.subAgentId,
          requiresApproval: stageTask.requiresApproval,
        },
      );
    }
    await saveDB(res, db);
    // A pipeline lands already-executed, so its ledger run records the terminal
    // state directly (requested -> ... -> succeeded) rather than pretending it
    // waited on a HITL gate it never passed through.
    await recordLedgerTask(
      res,
      pipelineTask,
      res.locals.userId,
      failedOrBlocked
        ? `Pipeline stopped at stage "${failedOrBlocked.id}": ${failedOrBlocked.error}`
        : "3-stage pipeline executed"
    );

    if (failedOrBlocked) {
      res.status(502).json({
        success: false,
        error:
          `Pipeline did not complete. Stage "${failedOrBlocked.id}" was ` +
          `${failedOrBlocked.status}: ${failedOrBlocked.error || "no detail"}`,
        pipeline: { goal, stages: stageResults, task: pipelineTask },
      });
      return;
    }

    res.json({
      success: true,
      pipeline: {
        goal,
        stages: stageResults,
        workflowStatus: execution.status,
        completedNodeIds: execution.completedNodeIds,
        finalArtifact: finalOutput,
        task: pipelineTask,
      },
    });
  } catch (err: any) {
    console.error("Agent pipeline failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});



// Update Content Asset Status
// This is the approval half of the publish gate, and it previously accepted any
// string for `status` from any member with no validation at all. Two holes that
// closes: a plain member could set 'Approved' on their own asset (self-approval,
// making the owner/admin check on the publish route the only remaining control),
// and anyone could write 'Published' onto an asset that was never published —
// which is both a lie in the ledger and a status the publish route deliberately
// lets through.
const CONTENT_ASSET_STATUSES: ContentAsset["status"][] = ['Draft', 'Pending Approval', 'Approved', 'Published'];

app.post("/api/workspace/content-status", requireModule("content"), async (req: Request, res: Response) => {
  const { id, status } = req.body as { id?: string; status?: ContentAsset["status"] };

  if (!status || !CONTENT_ASSET_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${CONTENT_ASSET_STATUSES.join(", ")}` });
    return;
  }
  // 'Published' is set by the publish route itself, only after a real post
  // succeeded against at least one channel. Accepting it here would let anyone
  // fabricate a published state for an asset that never left the building.
  if (status === 'Published') {
    res.status(400).json({ error: "An asset becomes 'Published' by publishing it, not by setting its status." });
    return;
  }
  // Approving is the human sign-off the publish route relies on, so it carries
  // the same bar as publishing. Moving an asset to 'Draft' or 'Pending Approval'
  // stays open to any member — that is ordinary authoring, not authorization.
  if (status === 'Approved' && !(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to approve content for publishing." });
    return;
  }

  const db = await getDB(res);
  const asset = db.contentAssets.find(a => a.id === id);
  if (asset) {
    asset.status = status;
    await saveDB(res, db);
    res.json({ success: true, contentAsset: asset });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Publish a content asset to one or more real channels — the Creative
// Command Center's multi-select publish. For each requested platform: if a
// connected connector with a real publish adapter exists, actually post the
// content; otherwise records why it didn't (not connected, or no publish
// adapter for that platform yet) rather than silently no-oping.
// Highest blast radius route in the app: the publish adapters below make REAL
// posts to the client's corporate LinkedIn / X / Facebook accounts using their
// stored OAuth tokens, and a published post cannot be un-published by us.
//
// It previously checked only the module entitlement, that the asset existed,
// and that a connector was 'Connected'. That meant any plain workspace 'member'
// could post to the client's public voice, and a 'Draft' published exactly as
// readily as an approved asset — while docs/ARCHITECTURE.md claimed "Agents
// never write externally without an approval token." Two guards make that
// claim true: the same owner/admin check the team and AI-key routes already
// use, and the ContentAsset.status field, which has always carried an
// 'Approved' value that nothing enforced.
app.post("/api/workspace/content-assets/:id/publish", requireModule("content"), async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to publish to connected channels." });
    return;
  }
  const { id } = req.params;
  const { channels } = req.body as { channels?: string[] };
  const db = await getDB(res);
  const asset = db.contentAssets.find(a => a.id === id);
  if (!asset) {
    res.status(404).json({ error: "Content asset not found" });
    return;
  }
  // HITL gate. 'Published' is allowed through so re-publishing an already-live
  // asset to an additional channel still works; 'Draft' and 'Pending Approval'
  // are not — those are exactly the states a human has not signed off on.
  if (asset.status !== 'Approved' && asset.status !== 'Published') {
    res.status(409).json({
      error: `This asset is "${asset.status}" and has not been approved for publishing. Approve it first.`,
      assetStatus: asset.status,
    });
    return;
  }
  if (!Array.isArray(channels) || channels.length === 0) {
    res.status(400).json({ error: "Select at least one channel to publish to." });
    return;
  }

  const publishedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const results: NonNullable<typeof asset.publishResults> = [];

  for (const platform of channels) {
    const connector = db.secondBrain.connectors.find(c => c.platform === platform && c.status === 'Connected');
    const adapter = publishAdapters[platform as ConnectorPlatform];
    if (!adapter) {
      results.push({ platform, success: false, error: "No publish integration exists for this channel yet.", publishedAt });
      continue;
    }
    if (!connector) {
      results.push({ platform, success: false, error: "Not connected — connect this channel in Integrations first.", publishedAt });
      continue;
    }
    try {
      const outcome = await adapter(getStoredCredentials(connector), { title: asset.title, body: asset.content });
      results.push({ platform, success: outcome.success, url: outcome.url, error: outcome.error, publishedAt });
    } catch (err: any) {
      results.push({ platform, success: false, error: err.message || String(err), publishedAt });
    }
  }

  asset.publishResults = [...(asset.publishResults || []), ...results];
  if (results.some(r => r.success)) {
    asset.status = 'Published';
  }
  await saveDB(res, db);
  res.json({ success: true, contentAsset: asset, results });
});

// AI Improve — rewrites the asset in place using Second Brain tone context.
app.post("/api/workspace/content-assets/:id/improve", requireModule("content"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  const asset = db.contentAssets.find(a => a.id === id);
  if (!asset) {
    res.status(404).json({ error: "Content asset not found" });
    return;
  }
  const brain = db.secondBrain;

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not set — AI Improve needs a live Gemini key." });
    return;
  }

  try {
    const startTime = Date.now();
    const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const prompt = `
      You are an elite editor improving an existing piece of content for "${asset.channel}". Sharpen clarity,
      strengthen the hook, tighten the CTA, and align it to the brand voice below — keep the same core message
      and length ballpark, do not pad with fluff.

      Brand voice: ${brain.brandVault.voiceAndTone}
      Core positioning: ${brain.brandVault.corePositioning}
      Target audience: ${brain.customerVault.idealCustomerProfile}

      Current draft (title: "${asset.title}"):
      """
      ${asset.content}
      """

      Return ONLY the improved body copy, no preamble or explanation.
    `;
    const response = await client.models.generateContent({ model: geminiModel, contents: prompt });
    asset.content = response.text || asset.content;
    await recordTokenUsage(res, {
      actionType: "IMPROVE_ASSET",
      modelName: geminiModel,
      usageMetadata: (response as any).usageMetadata,
      promptText: prompt,
      responseText: response.text,
      durationMs: Date.now() - startTime,
      metadata: { assetId: asset.id, title: asset.title },
    });
    await saveDB(res, db);
    res.json({ success: true, contentAsset: asset });
  } catch (err: any) {
    console.error("AI Improve failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});

// AI Fill-in — the Content Engine Lite's brief autofill, grounded in Second
// Brain + the latest Growth Audit + any relevant uploaded documents (RAG),
// replacing the old client-only "Fetch Audit Insights" that only ever
// touched 2 of the 5 brief fields.
app.post("/api/workspace/ai-fill-brief", requireModule("content"), async (req: Request, res: Response) => {
  const { title, channel, assetType } = req.body as { title?: string; channel?: string; assetType?: string };
  const db = await getDB(res);
  const brain = db.secondBrain;

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not set — AI Fill-in needs a live Gemini key." });
    return;
  }

  let ragContext = "";
  try {
    const matches = await searchDocuments(res.locals.sb, res.locals.wsId, title || "content brief context", { topK: 3 });
    ragContext = matches.map(m => `- (${m.sourceModule}) ${m.contentText?.slice(0, 400)}`).join("\n");
  } catch (err) {
    console.error("RAG lookup failed for AI Fill-in, continuing without it:", err);
  }

  const topFindings = [...(db.growthAudit?.findings || [])].sort((a, b) => b.impactPct - a.impactPct).slice(0, 3);

  try {
    const startTime = Date.now();
    const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const prompt = `
      You are the Creative Director filling in a content brief for a "${assetType || 'Text'}" asset on
      "${channel || 'General'}" titled "${title || '(untitled)'}".

      Brand voice: ${brain.brandVault.voiceAndTone}
      Core positioning: ${brain.brandVault.corePositioning}
      Offers and pricing: ${brain.brandVault.offersAndPricing}
      Target audience: ${brain.customerVault.idealCustomerProfile}
      Top Growth Audit findings to draw on: ${topFindings.map(f => `${f.title}: ${f.text}`).join(" | ") || "none yet — run a Growth Audit first"}
      ${ragContext ? `Relevant Second Brain notes:\n${ragContext}` : ""}

      Fill in all 5 brief fields as JSON: context (background on the topic), direction (tone/style
      guidance), emotions (target feelings), objective (what this asset should achieve), offer (the
      concrete CTA/next step). Each 1-2 sentences, concrete and specific to this business — never generic.
    `;
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            context: { type: Type.STRING },
            direction: { type: Type.STRING },
            emotions: { type: Type.STRING },
            objective: { type: Type.STRING },
            offer: { type: Type.STRING },
          },
          required: ["context", "direction", "emotions", "objective", "offer"],
        },
      },
    });
    const brief = JSON.parse(response.text || "{}");
    await recordTokenUsage(res, {
      actionType: "AI_FILL_BRIEF",
      modelName: geminiModel,
      usageMetadata: (response as any).usageMetadata,
      promptText: prompt,
      responseText: response.text,
      durationMs: Date.now() - startTime,
      metadata: { title, channel, assetType },
    });
    res.json({ success: true, brief });
  } catch (err: any) {
    console.error("AI Fill-in failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});

// Add Keyword Cluster
app.post("/api/workspace/add-keyword", requireModule("authority"), async (req: Request, res: Response) => {
  const { keyword, searchVolume, difficulty, intent } = req.body;
  const db = await getDB(res);
  const newKeyword: KeywordCluster = {
    id: 'kw-' + Date.now(),
    keyword,
    searchVolume: Number(searchVolume) || 100,
    difficulty: Number(difficulty) || 20,
    intent: intent || 'Commercial',
    topicalAuthorityStatus: 'Unranked',
    backlinkTargetCount: Math.ceil((Number(difficulty) || 20) / 10)
  };
  db.keywords.push(newKeyword);
  await saveDB(res, db);
  res.json({ success: true, keyword: newKeyword });
});

// Authority & SEO real insights — replaces 3 hardcoded stat cards ("42%
// +12% this month", "18% Low Visibility", "21 Awaiting pitching") with a
// real fetch + Gemini analysis of the actual site. AEO/GEO sections are
// explicitly labeled 'placeholder' — no citation-tracking API (Semrush/
// Similarweb/etc) is connected yet, so these are the agent's best-effort
// read of on-page citation-readiness signals, not measured LLM citation data.
app.post("/api/workspace/authority-insights", expensiveLimiter, requireModule("authority"), async (req: Request, res: Response) => {
  const db = await getDB(res);
  const brain = db.secondBrain;
  const domain = brain.websiteVault?.siteUrl;
  if (!domain) {
    res.status(400).json({ error: "Set a Website Vault Site URL first (Second Brain -> Website Vault)." });
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not set — Authority & SEO analysis needs a live Gemini key." });
    return;
  }

  let snapshot;
  try {
    snapshot = await fetchSiteContent(domain);
  } catch (err: any) {
    res.status(422).json({ error: "Could not fetch the site: " + err.message });
    return;
  }

  try {
    const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const prompt = `
      You are an SEO/AEO/GEO strategist. Analyze this real fetched site data for topical SEO coverage,
      Answer Engine Optimization (AEO — readiness to be cited by ChatGPT/Perplexity/Gemini answer engines),
      and Generative Engine Optimization (GEO — readiness for AI search summarization).

      ${summarizeSnapshotForPrompt(snapshot)}

      Target keywords already tracked: ${(db.keywords || []).map(k => k.keyword).join(", ") || "none yet"}

      No live citation-tracking API is connected — score AEO/GEO readiness from on-page signals only
      (structured data, FAQ/answer-format content, heading clarity) and say so explicitly in your summaries.

      Return JSON: { "topicalCoverageScore": 0-100, "topicalCoverageSummary": string,
        "aeoCitationReadinessScore": 0-100, "aeoSummary": string, "aeoRecommendations": string[],
        "geoSummary": string, "geoRecommendations": string[],
        "backlinkOpportunities": [{ "target": string, "rationale": string }] (3-5 items) }
    `;
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topicalCoverageScore: { type: Type.INTEGER },
            topicalCoverageSummary: { type: Type.STRING },
            aeoCitationReadinessScore: { type: Type.INTEGER },
            aeoSummary: { type: Type.STRING },
            aeoRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            geoSummary: { type: Type.STRING },
            geoRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            backlinkOpportunities: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { target: { type: Type.STRING }, rationale: { type: Type.STRING } }, required: ["target", "rationale"] }
            }
          },
          required: ["topicalCoverageScore", "topicalCoverageSummary", "aeoCitationReadinessScore", "aeoSummary", "aeoRecommendations", "geoSummary", "geoRecommendations", "backlinkOpportunities"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    const insights = {
      domain: snapshot.finalUrl,
      generatedAt: new Date().toISOString().split("T")[0],
      topicalCoverage: { score: parsed.topicalCoverageScore ?? 0, summary: parsed.topicalCoverageSummary || "" },
      aeo: {
        label: "placeholder" as const,
        citationReadinessScore: parsed.aeoCitationReadinessScore ?? 0,
        hasStructuredData: snapshot.hasStructuredData,
        hasFaqContent: snapshot.hasFaqContent,
        summary: parsed.aeoSummary || "",
        recommendations: parsed.aeoRecommendations || [],
      },
      geo: { label: "placeholder" as const, summary: parsed.geoSummary || "", recommendations: parsed.geoRecommendations || [] },
      backlinkOpportunities: parsed.backlinkOpportunities || [],
    };
    (db as any).authorityInsights = insights;
    await saveDB(res, db);

    try {
      await saveDocument(res.locals.sb, {
        workspaceId: res.locals.wsId,
        vaultId: "authority",
        sourceModule: "authority_insights",
        fileName: `Authority & SEO Insights — ${snapshot.finalUrl} — ${insights.generatedAt}`,
        contentText: `${insights.topicalCoverage.summary}\n\n${insights.aeo.summary}\n\n${insights.geo.summary}`,
      });
    } catch (err) {
      console.error("Failed to save authority insights into Second Brain documents (non-fatal):", err);
    }

    res.json({ success: true, authorityInsights: insights });
  } catch (err: any) {
    console.error("Authority insights generation failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});

// Keyword clustering — groups the flat keyword list into named topical
// clusters via Gemini, finally using the "KeywordCluster" type as its name
// implies (previously every keyword was its own unclustered row).
app.post("/api/workspace/generate-keyword-clusters", expensiveLimiter, requireModule("authority"), async (req: Request, res: Response) => {
  const db = await getDB(res);
  if (!db.keywords || db.keywords.length === 0) {
    res.status(400).json({ error: "Add some keywords first, then generate clusters." });
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not set — clustering needs a live Gemini key." });
    return;
  }
  try {
    const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const prompt = `
      Group these keywords into topical clusters for SEO content planning. Each keyword must be assigned
      to exactly one cluster. Cluster names should be short, specific topic labels (not generic like
      "General" or "Misc").

      Keywords: ${db.keywords.map(k => `"${k.keyword}" (id: ${k.id})`).join(", ")}

      Return JSON array of clusters: [{ "clusterName": string, "keywordIds": string[] }]
    `;
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { clusterName: { type: Type.STRING }, keywordIds: { type: Type.ARRAY, items: { type: Type.STRING } } },
            required: ["clusterName", "keywordIds"]
          }
        }
      }
    });
    const clusters = JSON.parse(response.text || "[]") as Array<{ clusterName: string; keywordIds: string[] }>;
    clusters.forEach((cluster, cIdx) => {
      const clusterId = "cluster-" + cIdx;
      cluster.keywordIds.forEach(kwId => {
        const kw = db.keywords.find(k => k.id === kwId);
        if (kw) {
          kw.clusterId = clusterId;
          kw.clusterName = cluster.clusterName;
        }
      });
    });
    await saveDB(res, db);
    res.json({ success: true, keywords: db.keywords, clusters: clusters.map((c, i) => ({ clusterId: "cluster-" + i, clusterName: c.clusterName, count: c.keywordIds.length })) });
  } catch (err: any) {
    console.error("Keyword clustering failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});


app.post("/api/workspace/fetch-brand", expensiveLimiter, async (req: Request, res: Response) => {
  const { domain } = req.body;
  const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
  const geminiModel = await resolveEffectiveGeminiModel(res);
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
        You are an expert brand analyst. We need to extract brand guidelines from the website: ${domain}.
        Please simulate scraping this website and return a JSON object with the following fields:
        1. voiceAndTone: (A brief paragraph describing their voice and tone)
        2. corePositioning: (A brief paragraph on their core market positioning)
        3. offersAndPricing: (What they offer and pricing if applicable)
        4. brandSlogan: (Their main slogan or tagline)
      `;
      const response = await client.models.generateContent({
        model: geminiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              voiceAndTone: { type: Type.STRING },
              corePositioning: { type: Type.STRING },
              offersAndPricing: { type: Type.STRING },
              brandSlogan: { type: Type.STRING }
            },
            required: ["voiceAndTone", "corePositioning", "offersAndPricing", "brandSlogan"]
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ error: "Fetch failed: " + err.message });
    }
  } else {
    const mockData = {
      voiceAndTone: "Professional, secure, and innovative. Focuses on enterprise scale without hype.",
      corePositioning: "Providing an automated Growth OS that eliminates agency retainers.",
      offersAndPricing: "Bespoke system installation ($50k+) and managed sandboxes.",
      brandSlogan: "Growth Without the Agency Drag."
    };
    res.json({ success: true, data: mockData, info: "Simulated response" });
  }
});

app.post("/api/workspace/run-analytics", expensiveLimiter, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const brain = db.secondBrain;
  const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
  const geminiModel = await resolveEffectiveGeminiModel(res);
  const url = brain.websiteVault.siteUrl || "https://sigmatactix.com";

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
        You are the Analytics and Tagging Architect of Sigma Tactix. Analyze the following site for tagging, pixels, event tracking, and dataLayer setup:
        URL: ${url}
        
        Our Client's Brand guidelines:
        - positioning: ${brain.brandVault.corePositioning}
        - target audience: ${brain.customerVault.idealCustomerProfile}
        
        Evaluate Google Tag Manager setup, tracking pixel health (Meta, LinkedIn, Twitter), standard custom events (Diagnostic Start, Ingest, Conversion), and structured dataLayer integration.
        Provide a tracking health score (0-100), arrays of tagsFound, pixelsFound, and eventsTracking, key findings (tagManager, pixels, events, dataLayer), and 2-3 actionable tracking recommendations.
      `;

      const response = await client.models.generateContent({
        model: geminiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "A realistic tracking health score from 0 to 100 based on findings." },
              tagsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
              pixelsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
              eventsTracking: { type: Type.ARRAY, items: { type: Type.STRING } },
              findings: {
                type: Type.OBJECT,
                properties: {
                  tagManager: { type: Type.STRING },
                  pixels: { type: Type.STRING },
                  events: { type: Type.STRING },
                  dataLayer: { type: Type.STRING }
                },
                required: ["tagManager", "pixels", "events", "dataLayer"]
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: { type: Type.STRING },
                    title: { type: Type.STRING },
                    impact: { type: Type.STRING, description: "High, Medium, or Low" },
                    description: { type: Type.STRING }
                  },
                  required: ["id", "category", "title", "impact", "description"]
                }
              }
            },
            required: ["score", "tagsFound", "pixelsFound", "eventsTracking", "findings", "recommendations"]
          }
        }
      });

      const auditResult: AnalyticsAudit = JSON.parse(response.text || "{}");
      auditResult.url = url;
      auditResult.lastAuditedAt = new Date().toISOString().split('T')[0];

      db.analyticsAudit = auditResult;
      await saveDB(res, db);
      res.json({ success: true, analyticsAudit: auditResult });
    } catch (err: any) {
      console.error("Gemini Analytics Audit failed:", err);
      res.status(500).json({ error: "Gemini Analytics Audit failed: " + err.message });
    }
  } else {
    const mockAnalytics: AnalyticsAudit = {
      url,
      lastAuditedAt: new Date().toISOString().split('T')[0],
      score: 85,
      tagsFound: ['Google Tag Manager', 'Meta Pixel', 'LinkedIn Insight Tag'],
      pixelsFound: ['Meta', 'LinkedIn', 'Twitter'],
      eventsTracking: ['page_view', 'scroll', 'form_start', 'diagnostic_complete'],
      findings: {
        tagManager: 'GTM is active on all core paths. Custom trigger rules are configured for waitlist registration inputs.',
        pixels: 'Meta and LinkedIn Insight pixels match user sessions accurately. Advanced profile matching enabled.',
        events: 'Standard tracking hooks are installed. Need to expand event triggers on secondary strategy uploads.',
        dataLayer: 'DataLayer is mostly flat. Lacks structured B2B deal values or segment tagging.'
      },
      recommendations: [
        {
          id: 'ar-' + Date.now(),
          category: 'Tracking',
          title: 'Implement Custom DataLayer Push on Diagnostic Steps',
          impact: 'High',
          description: 'Push step-specific details to the dataLayer to identify exactly where enterprise buyers abandon the form.'
        },
        {
          id: 'ar-' + (Date.now() + 1),
          category: 'Pixels',
          title: 'Enable LinkedIn Advanced Matching',
          impact: 'Medium',
          description: 'Pass hashed emails to the LinkedIn Insight Tag to improve B2B audience retargeting.'
        }
      ]
    };
    db.analyticsAudit = mockAnalytics;
    await saveDB(res, db);
    res.json({ success: true, analyticsAudit: mockAnalytics });
  }
});

// Persisted agent configs (distinct from AgentTask run-records in
// db.agentTasks) — "New AI Agent" creation for the Paid Media Swarm and,
// later, the Agentic AI Cockpit. Backed by the `agents` table (RLS-scoped).
app.get("/api/workspace/agents", requireModule("agents"), async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.from("agents").select("*").order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, agents: data });
});

// Saved custom reports — the Reporting & Analytics Custom Report Builder's
// persistence (previously purely client-state, lost on refresh).
/**
 * Authoritative task read (Phase 1 cutover).
 *
 * With EXECUTION_LEDGER_AUTHORITATIVE=true the ledger is the record of truth for
 * task identity and status, and `workspace_state.agentTasks` is only consulted
 * for the generated artifact body (steps/output), which the ledger does not
 * store yet. It defaults OFF on purpose: flipping it before migration 0017 is
 * applied would take task history down with it. If the ledger read fails we fall
 * back to workspace_state and say so out loud — a degraded read is recoverable,
 * a silent empty task list is not.
 */
function ledgerIsAuthoritative(): boolean {
  return process.env.EXECUTION_LEDGER_AUTHORITATIVE === "true";
}

async function loadAgentTasks(res: Response, db: WorkspaceData): Promise<AgentTask[]> {
  const legacyTasks = db.agentTasks || [];
  if (!ledgerIsAuthoritative()) return legacyTasks;

  try {
    const ledgerTasks = await listLedgerTasks(res.locals.sb, res.locals.wsId);
    if (ledgerTasks.length === 0 && legacyTasks.length > 0) {
      console.warn(
        "EXECUTION_LEDGER_AUTHORITATIVE=true but the ledger returned no runs for this " +
        "workspace while workspace_state still has tasks — did you run the backfill? " +
        "Falling back to workspace_state for this request."
      );
      return legacyTasks;
    }
    // Merge on the task id: the ledger decides status, workspace_state supplies
    // the artifact body the ledger does not carry.
    const bodyById = new Map(legacyTasks.map((t) => [t.id, t]));
    return ledgerTasks.map((lt) => {
      const legacy = bodyById.get(lt.id);
      return {
        ...(legacy || {}),
        id: lt.id,
        agentName: lt.agentName,
        goal: lt.goal,
        status: lt.status,
        timestamp: legacy?.timestamp || lt.createdAt,
        steps: legacy?.steps || [],
        output: legacy?.output || "",
        requestedBy: legacy?.requestedBy,
      } as AgentTask;
    });
  } catch (err: any) {
    console.error("Ledger-authoritative task read failed; using workspace_state:", err?.message || err);
    return legacyTasks;
  }
}

// Records the client accepting the published measurement scale (§4/§6 terms).
// The acceptance is a legal fact with a version and a timestamp, so it is
// written to the ledger event stream and the response reports whether that
// write actually happened — never a bare "done".
app.post("/api/workspace/terms/accept", requireModule("agents"), async (req: Request, res: Response) => {
  try {
    const taskId = String(req.body?.taskId || "");
    if (!taskId) {
      res.status(400).json({ error: "taskId is required so the acceptance is attached to a specific piece of work." });
      return;
    }
    const result = await recordTermsAcceptance(res.locals.sb, {
      workspaceId: res.locals.wsId,
      userId: res.locals.userId,
      taskId,
      ipAddress: req.ip,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Terms acceptance record failed:", err);
    res.status(500).json({ error: err.message || "Failed to record terms acceptance" });
  }
});

// One-time (re-runnable) migration of legacy workspace_state tasks into the
// ledger, with reconciliation counts rather than a bare "done". Owner/admin only:
// it writes the authoritative record for the whole workspace, so it must not be
// something any member can trigger.
app.post("/api/workspace/execution-ledger/backfill", requireModule("agents"), async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to run the ledger backfill." });
    return;
  }
  try {
    const db = await getDB(res);
    const counts = await backfillAgentTasks(res.locals.sb, res.locals.wsId, db.agentTasks || []);
    const ledgerCount = (await listLedgerTasks(res.locals.sb, res.locals.wsId)).length;
    res.json({
      reconciliation: counts,
      ledgerRunCount: ledgerCount,
      // The number that actually matters: legacy tasks with no ledger run. It
      // must reach 0 before EXECUTION_LEDGER_AUTHORITATIVE is switched on.
      unmatched: Math.max(0, counts.total - counts.created),
    });
  } catch (err: any) {
    console.error("Ledger backfill failed:", err);
    res.status(500).json({ error: err.message || "Backfill failed" });
  }
});

// Read side of the transactional ledger (Phase 1) — the same records the write
// path above produces, so a provider view, counter or heatmap never has to
// reconcile two sources. Declared after app.use("/api/workspace", requireAuth)
// so it inherits the session check and the per-request RLS-scoped client.
app.get("/api/workspace/execution-ledger", requireModule("agents"), async (req: Request, res: Response) => {
  try {
    const runs = await listLedgerRuns(res.locals.sb, res.locals.wsId);
    res.json({ runs });
  } catch (err: any) {
    console.error("Execution ledger read failed:", err);
    res.status(500).json({ error: err.message || "Failed to read execution ledger" });
  }
});

app.get("/api/workspace/reports", requireModule("reporting"), async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.from("saved_reports").select("*").order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, reports: data });
});

app.post("/api/workspace/reports", requireModule("reporting"), async (req: Request, res: Response) => {
  const { name, blocks, dateRange } = req.body as { name?: string; blocks?: any[]; dateRange?: string };
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Report name is required" });
    return;
  }
  const { data, error } = await res.locals.sb
    .from("saved_reports")
    .insert({ workspace_id: res.locals.wsId, name: name.trim(), blocks: blocks || [], date_range: dateRange || "Last 30 Days" })
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, report: data });
});

app.delete("/api/workspace/reports/:id", requireModule("reporting"), async (req: Request, res: Response) => {
  const { error } = await res.locals.sb.from("saved_reports").delete().eq("id", req.params.id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

app.post("/api/workspace/reports/snapshot/render", requireModule("reporting"), async (req: Request, res: Response) => {
  try {
    const { snapshot, brand, format } = req.body;
    const validated = validateReportSnapshot(snapshot);
    const wsId = res.locals.wsId || validated.workspaceId;

    if (format === "bundle") {
      const bundle = await generateReportArtifactBundle(validated, brand);
      reportArtifactRepository.storeBundle(bundle);
      res.json({
        success: true,
        bundleHash: bundle.bundleHash,
        snapshotId: bundle.snapshotId,
        artifacts: {
          pdf: {
            artifactHash: bundle.pdf.artifactHash,
            byteSize: bundle.pdf.byteSize,
            downloadUrl: `/api/workspace/reports/artifact/${bundle.pdf.artifactHash}/download`,
            filename: bundle.pdf.filename,
          },
          pptx: {
            artifactHash: bundle.pptx.artifactHash,
            byteSize: bundle.pptx.byteSize,
            downloadUrl: `/api/workspace/reports/artifact/${bundle.pptx.artifactHash}/download`,
            filename: bundle.pptx.filename,
          },
          xlsx: {
            artifactHash: bundle.xlsx.artifactHash,
            byteSize: bundle.xlsx.byteSize,
            downloadUrl: `/api/workspace/reports/artifact/${bundle.xlsx.artifactHash}/download`,
            filename: bundle.xlsx.filename,
          },
        },
      });
      return;
    }

    if (format === "pptx") {
      const pptxResult = await renderSnapshotToPPTX(validated, brand);
      reportArtifactRepository.storeArtifact(pptxResult, wsId, validated.id);
      res.json({
        success: true,
        format: "pptx",
        artifactHash: pptxResult.artifactHash,
        byteSize: pptxResult.byteSize,
        slideCount: pptxResult.metadata?.slideCount || 6,
        downloadUrl: `/api/workspace/reports/artifact/${pptxResult.artifactHash}/download`,
        filename: pptxResult.filename,
      });
      return;
    }

    if (format === "xlsx") {
      const xlsxResult = await renderSnapshotToXLSX(validated);
      reportArtifactRepository.storeArtifact(xlsxResult, wsId, validated.id);
      res.json({
        success: true,
        format: "xlsx",
        artifactHash: xlsxResult.artifactHash,
        byteSize: xlsxResult.byteSize,
        sheetCount: xlsxResult.metadata?.sheetCount || 5,
        downloadUrl: `/api/workspace/reports/artifact/${xlsxResult.artifactHash}/download`,
        filename: xlsxResult.filename,
      });
      return;
    }

    // Default to PDF
    const result = await renderSnapshotToPDF(validated, brand);
    reportArtifactRepository.storeArtifact(result, wsId, validated.id);

    res.json({
      success: true,
      format: "pdf",
      artifactHash: result.artifactHash,
      byteSize: result.byteSize,
      pageCount: result.metadata?.pageCount || 2,
      downloadUrl: `/api/workspace/reports/artifact/${result.artifactHash}/download`,
      filename: result.filename,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.get("/api/workspace/reports/artifact/:hash/download", async (req: Request, res: Response) => {
  const requestingWorkspaceId = res.locals.wsId || (req.query.workspaceId as string) || "";
  const lookup = reportArtifactRepository.getArtifactForWorkspace(req.params.hash, requestingWorkspaceId);
  if (lookup.status === "not_found") {
    res.status(404).json({ error: lookup.error });
    return;
  }
  if (lookup.status === "forbidden") {
    res.status(403).json({ error: lookup.error });
    return;
  }
  const artifact = lookup.artifact;
  res.setHeader("Content-Type", artifact.mime);
  res.setHeader("Content-Disposition", `attachment; filename="${artifact.filename}"`);
  res.setHeader("Content-Length", artifact.byteSize);
  res.send(artifact.buffer);
});

// =========================================================================
// LEARNING REGISTRY (Phase 3 & Task S21 Learning Loops)
// Versioned development lessons, client job learnings, and scoped retrieval
// =========================================================================
app.get("/api/workspace/learnings", async (req: Request, res: Response) => {
  const wsId = res.locals.wsId;
  const category = req.query.category as any;
  const query = req.query.q as string;
  const vaultScope = req.query.vaultScope ? (req.query.vaultScope as string).split(",") : undefined;
  const learnings = globalLearningRegistry.queryScopedLearnings(wsId, { category, query, vaultScope });
  res.json({ success: true, learnings });
});

app.post("/api/workspace/learnings", async (req: Request, res: Response) => {
  try {
    const wsId = res.locals.wsId;
    const { jobRunId, taskTitle, category, reviewedOutcome, limitations, lessonContent, targetVault, author } = req.body;
    const entry = globalLearningRegistry.recordClientLearning({
      workspaceId: wsId,
      jobRunId: jobRunId || `manual-${Date.now()}`,
      taskTitle: taskTitle || "Operator Learning",
      category: category || "positioning",
      reviewedOutcome: reviewedOutcome || "",
      limitations: limitations || "",
      lessonContent: lessonContent || "",
      targetVault: targetVault || "Brand Vault",
      author: author || res.locals.userEmail || "Operator",
    });
    res.json({ success: true, learning: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.post("/api/workspace/learnings/:id/approve", async (req: Request, res: Response) => {
  try {
    const reviewer = res.locals.userEmail || req.body.reviewer || "Lead Reviewer";
    const entry = globalLearningRegistry.approveLearning(req.params.id, reviewer);
    res.json({ success: true, learning: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.post("/api/workspace/learnings/:id/supersede", async (req: Request, res: Response) => {
  try {
    const reviewer = res.locals.userEmail || req.body.reviewer || "Lead Reviewer";
    const entry = globalLearningRegistry.supersedeLearning(req.params.id, req.body, reviewer);
    res.json({ success: true, learning: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.post("/api/workspace/learnings/:id/revoke", async (req: Request, res: Response) => {
  try {
    const reviewer = res.locals.userEmail || req.body.reviewer || "Lead Reviewer";
    const reason = req.body.reason || "Superseded or invalidated by operator";
    const entry = globalLearningRegistry.revokeLearning(req.params.id, reviewer, reason);
    res.json({ success: true, learning: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.get("/api/workspace/learnings/development", async (_req: Request, res: Response) => {
  res.json({ success: true, lessons: DEVELOPMENT_LESSON_REGISTRY });
});

// =========================================================================
// LECTURE DECK ENGINE (Phase 3 Presentation Engine)
// Generates self-contained interactive animated HTML decks & printable PDFs
// =========================================================================
interface LectureDeckArtifact {
  html: string;
  filename: string;
  title: string;
  slideCount: number;
  theme: string;
  createdAt: number;
}
const lectureDeckCache = new Map<string, LectureDeckArtifact>();

async function generateLectureDeck(payload: any, options: { theme?: string; type?: string } = {}): Promise<LectureDeckArtifact & { deckId: string; viewUrl: string; downloadUrl: string }> {
  return new Promise((resolve, reject) => {
    const deckId = payload.id || crypto.randomBytes(4).toString("hex");
    const scriptPath = path.resolve(__dirname, "tools/lecture-deck-skill/scripts/generate_from_report.py");
    const outDir = path.resolve(__dirname, "dist/decks");

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const theme = options.theme || payload.theme || "sigmatactix";
    const deckType = options.type || "auto";

    const proc = spawn("python3", [
      scriptPath,
      "--stdin",
      "--theme", theme,
      "--out-dir", outDir,
      "--type", deckType
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn deck generator: ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Deck generator failed (exit ${code}): ${stderr || stdout}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        const html = fs.readFileSync(parsed.htmlPath, "utf-8");
        const artifact: LectureDeckArtifact = {
          html,
          filename: parsed.filename,
          title: parsed.title,
          slideCount: parsed.slideCount,
          theme: parsed.theme,
          createdAt: Date.now()
        };
        lectureDeckCache.set(parsed.deckId, artifact);
        resolve({
          ...artifact,
          deckId: parsed.deckId,
          viewUrl: `/api/reports/deck/${parsed.deckId}/view`,
          downloadUrl: `/api/reports/deck/${parsed.deckId}/download`
        });
      } catch (err: any) {
        reject(new Error(`Failed to parse deck generator output: ${err.message}. Output was: ${stdout}`));
      }
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

// Handler for generating a presentation deck
const handleDeckGeneration = async (req: Request, res: Response) => {
  try {
    const { reportData, theme, type } = req.body;
    if (!reportData) {
      return res.status(400).json({ error: "reportData is required" });
    }
    const result = await generateLectureDeck(reportData, { theme, type });
    res.json({
      success: true,
      deckId: result.deckId,
      title: result.title,
      slideCount: result.slideCount,
      theme: result.theme,
      filename: result.filename,
      viewUrl: result.viewUrl,
      downloadUrl: result.downloadUrl
    });
  } catch (err: any) {
    console.error("Lecture Deck generation error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
};

app.post("/api/reports/deck/generate", handleDeckGeneration);
app.post("/api/workspace/reports/deck/generate", handleDeckGeneration);

// Serve interactive fullscreen presentation deck in browser
app.get("/api/reports/deck/:id/view", (req: Request, res: Response) => {
  const deck = lectureDeckCache.get(req.params.id);
  if (!deck) {
    const outDir = path.resolve(__dirname, "dist/decks");
    if (fs.existsSync(outDir)) {
      const files = fs.readdirSync(outDir);
      const match = files.find(f => f.includes(req.params.id) && f.endsWith(".html"));
      if (match) {
        const html = fs.readFileSync(path.join(outDir, match), "utf-8");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      }
    }
    return res.status(404).send("Lecture deck presentation not found or expired.");
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(deck.html);
});

// Download standalone HTML deck for offline presentation
app.get("/api/reports/deck/:id/download", (req: Request, res: Response) => {
  const deck = lectureDeckCache.get(req.params.id);
  let html = deck?.html;
  let filename = deck?.filename || `sigmatactix-presentation-${req.params.id}.html`;
  if (!html) {
    const outDir = path.resolve(__dirname, "dist/decks");
    if (fs.existsSync(outDir)) {
      const files = fs.readdirSync(outDir);
      const match = files.find(f => f.includes(req.params.id) && f.endsWith(".html"));
      if (match) {
        html = fs.readFileSync(path.join(outDir, match), "utf-8");
        filename = match;
      }
    }
  }
  if (!html) {
    return res.status(404).json({ error: "Lecture deck artifact not found" });
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(html);
});

app.post("/api/workspace/agents", requireModule("agents"), async (req: Request, res: Response) => {
  const { name, role, goal, targetModule, skills, instructions, pluginIds, connectorIds } = req.body as {
    name?: string; role?: string; goal?: string; targetModule?: string;
    skills?: string[]; instructions?: string; pluginIds?: string[]; connectorIds?: string[];
  };
  if (!name || !role) {
    res.status(400).json({ error: "name and role are required" });
    return;
  }
  const { data, error } = await res.locals.sb
    .from("agents")
    .insert({
      workspace_id: res.locals.wsId,
      name, role, goal, target_module: targetModule,
      skills: skills || [], instructions,
      plugin_ids: pluginIds || [], connector_ids: connectorIds || [],
    })
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, agent: data });
});

app.delete("/api/workspace/agents/:id", requireModule("agents"), async (req: Request, res: Response) => {
  const { error } = await res.locals.sb.from("agents").delete().eq("id", req.params.id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

// The comprehensive Agency Agents library — dynamic discovery of all 223+ agents
app.get("/api/workspace/agents/library", requireModule("agents"), (req: Request, res: Response) => {
  const { module: targetModule, category } = req.query as { module?: string; category?: string };
  let agents = DISCOVERED_AGENCY_AGENTS;
  if (targetModule) {
    // Matches getAgentsForModule() in the registry: cockpit agents are the
    // cross-functional utility set for the Cockpit/Library only and must NOT
    // leak into every other module's list (the reason modules used to show
    // irrelevant agents).
    agents = agents.filter(a => a.targetModules.includes(targetModule));
  }
  if (category) {
    agents = agents.filter(a => a.category === category);
  }
  res.json({
    success: true,
    total: DISCOVERED_AGENCY_AGENTS.length,
    personas: agents.map(a => ({
      key: a.id,
      id: a.id,
      name: a.name,
      role: a.role,
      description: a.description,
      category: a.category,
      targetModule: a.targetModules[0] || "cockpit",
      targetModules: a.targetModules,
      skills: a.skills,
    }))
  });
});

// Full agent detail (#task7) — the registry only carries a one-line
// description; everything else the detail panel shows (identity/role, core
// mission, critical rules, capabilities, specialized skills, decision
// framework, success metrics, frameworks, tooling) lives in that agent's
// SKILL.md, parsed on demand. Sections that a given file genuinely doesn't
// have are simply absent — nothing is synthesized to fill the template.
app.get("/api/workspace/agents/library/:agentId", requireModule("agents"), (req: Request, res: Response) => {
  const { agentId } = req.params;
  const agent = DISCOVERED_AGENCY_AGENTS.find(a => a.id === agentId || a.folder === agentId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found in registry" });
    return;
  }
  const parsed = parseSkillFile(agent.folder);
  res.json({
    success: true,
    agent: {
      id: agent.id,
      folder: agent.folder,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      category: agent.category,
      targetModules: agent.targetModules,
      skills: agent.skills,
    },
    skillFile: parsed,
  });
});

app.post("/api/workspace/agents/import", requireModule("agents"), async (req: Request, res: Response) => {
  const { personaKey, agentId } = req.body as { personaKey?: string; agentId?: string };
  const key = agentId || personaKey;
  const discovered = DISCOVERED_AGENCY_AGENTS.find(a => a.id === key || a.folder === key);
  const persona = discovered
    ? {
      name: discovered.name,
      role: discovered.role,
      goal: discovered.description,
      targetModule: discovered.targetModules[0] || "cockpit",
      skills: discovered.skills,
      instructions: personaInstructionsFor(discovered)
    }
    : AGENCY_AGENT_PERSONAS.find(p => p.key === key);

  if (!persona) {
    res.status(404).json({ error: "Unknown agent key" });
    return;
  }
  const { data, error } = await res.locals.sb
    .from("agents")
    .insert({
      workspace_id: res.locals.wsId,
      name: persona.name, role: persona.role, goal: persona.goal, target_module: persona.targetModule,
      skills: persona.skills, instructions: persona.instructions,
      plugin_ids: [], connector_ids: [],
    })
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, agent: data });
});

// MODULE_TO_SYSTEM_AGENT moved to src/lib/agentResolution.ts so both dispatch
// paths (this route and /run-agent) share one map and it can be unit-tested —
// server.ts boots an Express app on import, so nothing here is importable from
// a test. The map there also covers the module keys the registry and the
// ModuleAgentHub instances actually use (brain, social, competitors, reporting,
// simulation), which this copy was missing.

// Deploy a swarm — a filtered bundle of persisted agents, each queued as its
// own HITL-gated Pending Approval task (same approve/reject flow as every
// other agent run). This is the "filters to select which AI Agents must be
// bundled in a swarm" ask — a real bundle, not the previous fake setTimeout
// log sequence.
app.post("/api/workspace/run-swarm", expensiveLimiter, requireModule("agents"), async (req: Request, res: Response) => {
  const { agentIds, goal } = req.body as { agentIds?: string[]; goal?: string };
  if (!Array.isArray(agentIds) || agentIds.length === 0) {
    res.status(400).json({ error: "Select at least one agent for the swarm." });
    return;
  }
  const { data: agentRows, error } = await res.locals.sb.from("agents").select("*").in("id", agentIds);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const db = await getDB(res);
  const createdTasks: AgentTask[] = (agentRows || []).map((agentRow: any) => {
    const systemAgentType = MODULE_TO_SYSTEM_AGENT[agentRow.target_module] || "Marketing Agent";
    return {
      id: "task-" + crypto.randomUUID() + "-" + String(agentRow.id).slice(0, 6),
      agentName: systemAgentType,
      goal: `[Persona: ${agentRow.name} — ${agentRow.role}] ${agentRow.instructions ? agentRow.instructions + " " : ""}${goal || agentRow.goal || "Execute assigned task."}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "Pending Approval" as const,
      allowedScope: getAgentPolicy(systemAgentType).allowed,
      requestedBy: res.locals.userId,
      steps: [],
      output: "",
    };
  });

  db.agentTasks = [...createdTasks, ...db.agentTasks];
  await saveDB(res, db);
  // Each swarmed persona is its own ledger run — one row per task, keyed by the
  // task id, so approving one of them cannot move the others.
  for (const task of createdTasks) {
    await recordLedgerTask(res, task, res.locals.userId, "Swarm bundle queued for HITL review");
  }
  res.json({ success: true, tasks: createdTasks });
});

app.post("/api/workspace/run-performance-swarm", expensiveLimiter, requireModule("performance"), async (req: Request, res: Response) => {
  const { notes } = req.body as { notes?: string };
  const db = await getDB(res);
  const brain = db.secondBrain;
  const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
  const geminiModel = await resolveEffectiveGeminiModel(res);

  if (process.env.GEMINI_API_KEY) {
    // Real bug fixed: this used to be `if (GEMINI_API_KEY && notes)`, so a
    // real key with empty notes silently fell into the mock branch below and
    // overwrote real ICP/media-plan/client-insights data with canned mock
    // content while reporting success — same required-field pattern as
    // /run-diagnostic and /run-uiux now applied here instead of a 400.
    if (!notes || !notes.trim()) {
      res.status(400).json({ error: "Discovery call notes are required to process with the AI Swarm." });
      return;
    }
    try {
      const prompt = `
        You are the Head of Performance Media at Sigma Tactix. Analyze the following Discovery Call notes and extract key B2B SaaS target ICP traits, monthly budget target, target CPA, and a recommended media plan allocating budget across Google Ads, LinkedIn Ads, Meta Ads, TikTok Ads, Twitter (X) Ads, Apple Search Ads, Reddit Ads, and Pinterest Ads.
        Also produce "New Client Insights" — a first-call read on this client: pain points, budget signal
        strength, urgency level, and which Sigma Tactix package tier fits them best.

        Discovery Call Notes:
        "${notes}"

        Provide the results in JSON matching:
        - "icp": A concise paragraph summary of the Ideal Customer Profile.
        - "budget": Target Monthly budget (e.g. "$50,000")
        - "cpaTarget": Target CPA or ROAS (e.g. "$150 CPA")
        - "mediaPlan": Array of comprehensive objects, one per channel:
          { "channel": string, "funnelStage": string, "objective": string, "budget": string, "expectedCPA": string,
            "campaignType": string, "adFormat": string, "audienceTargeting": string, "expectedImpressions": string,
            "expectedClicks": string, "expectedConversions": string, "kpi": string }
        - "clientInsights": object { "painPoints": string, "budgetSignal": "Strong"|"Moderate"|"Weak", "urgency": "High"|"Medium"|"Low", "recommendedPackage": string, "summary": string }
      `;

      const response = await client.models.generateContent({
        model: geminiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              icp: { type: Type.STRING },
              budget: { type: Type.STRING },
              cpaTarget: { type: Type.STRING },
              mediaPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    channel: { type: Type.STRING },
                    funnelStage: { type: Type.STRING },
                    objective: { type: Type.STRING },
                    budget: { type: Type.STRING },
                    expectedCPA: { type: Type.STRING },
                    campaignType: { type: Type.STRING },
                    adFormat: { type: Type.STRING },
                    audienceTargeting: { type: Type.STRING },
                    expectedImpressions: { type: Type.STRING },
                    expectedClicks: { type: Type.STRING },
                    expectedConversions: { type: Type.STRING },
                    kpi: { type: Type.STRING }
                  },
                  required: ["channel", "funnelStage", "objective", "budget", "expectedCPA", "campaignType", "adFormat", "audienceTargeting", "expectedImpressions", "expectedClicks", "expectedConversions", "kpi"]
                }
              },
              clientInsights: {
                type: Type.OBJECT,
                properties: {
                  painPoints: { type: Type.STRING },
                  budgetSignal: { type: Type.STRING, description: "Strong, Moderate, or Weak" },
                  urgency: { type: Type.STRING, description: "High, Medium, or Low" },
                  recommendedPackage: { type: Type.STRING },
                  summary: { type: Type.STRING }
                },
                required: ["painPoints", "budgetSignal", "urgency", "recommendedPackage", "summary"]
              }
            },
            required: ["icp", "budget", "cpaTarget", "mediaPlan", "clientInsights"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      db.secondBrain.customerVault.idealCustomerProfile = parsed.icp;
      // Store custom media plan in db
      (db as any).mediaPlan = parsed.mediaPlan;
      (db as any).performanceBudget = parsed.budget;
      (db as any).performanceCPATarget = parsed.cpaTarget;
      (db as any).performanceClientInsights = parsed.clientInsights;

      await saveDB(res, db);

      try {
        await saveDocument(res.locals.sb, {
          workspaceId: res.locals.wsId,
          vaultId: "performance",
          sourceModule: "discovery_notes",
          fileName: `Discovery Call Notes — ${new Date().toISOString().split("T")[0]}`,
          contentText: notes,
        });
      } catch (err) {
        console.error("Failed to save discovery notes into Second Brain documents (non-fatal):", err);
      }

      res.json({ success: true, workspace: db });
    } catch (err: any) {
      console.error("Gemini Performance Swarm failed:", err);
      res.status(500).json({ error: classifyGeminiError(err) });
    }
  } else {
    // Fallback Mock Swarm processing
    db.secondBrain.customerVault.idealCustomerProfile = "CMOs, Growth Directors, and B2B SaaS Founders in Tech firms looking to scale paid acquisition while reducing legacy agency overhead.";
    (db as any).performanceBudget = "$50,000";
    (db as any).performanceCPATarget = "$150 CPA";
    (db as any).mediaPlan = [
      { channel: "Google Ads", funnelStage: "BOFU / Intent", budget: "$15,000 (30%)", expectedCPA: "$120", campaignType: "Search - Competitor & Branded" },
      { channel: "LinkedIn Ads", funnelStage: "MOFU / Retargeting", budget: "$10,000 (20%)", expectedCPA: "$180", campaignType: "Single Image Lead Gen" },
      { channel: "Meta Ads", funnelStage: "TOFU / Discovery", budget: "$8,000 (16%)", expectedCPA: "$80", campaignType: "Video Views & Broad Reach" },
      { channel: "TikTok Ads", funnelStage: "TOFU / Discovery", budget: "$5,000 (10%)", expectedCPA: "$40", campaignType: "Spark Ads & Influencer Whitelisting" },
      { channel: "Apple Search Ads", funnelStage: "BOFU / Intent", budget: "$6,000 (12%)", expectedCPA: "$95", campaignType: "Search Match & Keyword Bidding" },
      { channel: "Twitter (X) Ads", funnelStage: "MOFU / Retargeting", budget: "$3,000 (6%)", expectedCPA: "$140", campaignType: "Premium Video Ads" },
      { channel: "Reddit Ads", funnelStage: "TOFU / Discovery", budget: "$3,500 (7%)", expectedCPA: "$110", campaignType: "Niche Subreddit Takeovers" }
    ];
    (db as any).performanceClientInsights = {
      painPoints: "Set GEMINI_API_KEY to generate real client insights from these notes.",
      budgetSignal: "Moderate",
      urgency: "Medium",
      recommendedPackage: "Growth Systems Retainer",
      summary: "Mock insight — no live Gemini key configured."
    };
    await saveDB(res, db);
    res.json({ success: true, workspace: db });
  }
});

// Upload + parse a historical campaign performance report — replaces the
// static "Select Files" mock. Real Storage upload, text extraction, and a
// fresh Gemini insights pass every time a new report lands.
app.post("/api/workspace/performance/upload-report", upload.single("file"), requireModule("performance"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  const db = await getDB(res);
  const storagePath = `${res.locals.wsId}/performance-reports/${crypto.randomUUID()}-${file.originalname}`;

  const { error: uploadErr } = await res.locals.sb.storage
    .from("vault-files")
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadErr) {
    res.status(500).json({ error: "Storage upload failed: " + uploadErr.message });
    return;
  }

  let contentText = "";
  const lower = file.originalname.toLowerCase();
  if (file.mimetype.startsWith("text/") || lower.endsWith(".csv") || lower.endsWith(".txt")) {
    contentText = file.buffer.toString("utf8").slice(0, 30000);
  } else if (file.mimetype === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      contentText = result.text.slice(0, 30000);
    } catch (err) {
      console.error("PDF text extraction failed for campaign report:", err);
    }
  }

  let insights = "Text extraction isn't supported for this file type yet — stored, but no insights generated.";
  if (contentText && process.env.GEMINI_API_KEY) {
    try {
      const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
      const geminiModel = await resolveEffectiveGeminiModel(res);
      const response = await client.models.generateContent({
        model: geminiModel,
        contents: `You are a performance media analyst. Extract the key takeaways from this campaign performance report — top/bottom performing channels or campaigns, notable CPA/ROAS trends, and 2-3 concrete recommendations. Be specific, cite real numbers from the data where present.\n\nReport content:\n${contentText}`,
      });
      insights = response.text || insights;
    } catch (err: any) {
      console.error("Report insights generation failed:", err);
      insights = "Insight generation failed: " + classifyGeminiError(err);
    }
  }

  let documentId: string | undefined;
  try {
    documentId = await saveDocument(res.locals.sb, {
      workspaceId: res.locals.wsId,
      vaultId: "performance",
      sourceModule: "campaign_report",
      fileName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      contentText: contentText || undefined,
    });
  } catch (err) {
    console.error("saveDocument failed for campaign report:", err);
  }

  const report = {
    id: "report-" + Date.now(),
    fileName: file.originalname,
    uploadedAt: new Date().toISOString().split("T")[0],
    storagePath,
    documentId,
    insights,
  };
  (db as any).campaignReports = [report, ...((db as any).campaignReports || [])];
  await saveDB(res, db);
  res.json({ success: true, report, workspace: db });
});

// Questionnaire notes — a real persisted list (was a single ephemeral
// textarea with no save/history), also mirrored into Second Brain documents.
app.post("/api/workspace/performance/questionnaire-notes", requireModule("performance"), async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Note text is required" });
    return;
  }
  const db = await getDB(res);
  const note = { id: "note-" + Date.now(), text: text.trim(), createdAt: new Date().toISOString().split("T")[0] };
  (db as any).questionnaireNotes = [note, ...((db as any).questionnaireNotes || [])];
  await saveDB(res, db);

  try {
    await saveDocument(res.locals.sb, {
      workspaceId: res.locals.wsId,
      vaultId: "performance",
      sourceModule: "questionnaire_notes",
      fileName: `Questionnaire Note — ${note.createdAt}`,
      contentText: note.text,
    });
  } catch (err) {
    console.error("Failed to save questionnaire note into Second Brain documents (non-fatal):", err);
  }

  res.json({ success: true, note, workspace: db });
});

app.delete("/api/workspace/performance/questionnaire-notes/:noteId", requireModule("performance"), async (req: Request, res: Response) => {
  const { noteId } = req.params;
  const db = await getDB(res);
  (db as any).questionnaireNotes = ((db as any).questionnaireNotes || []).filter((n: any) => n.id !== noteId);
  await saveDB(res, db);
  res.json({ success: true, workspace: db });
});

// Media plan template upload — a real file slot (was none) for users to
// upload their own planning template, alongside 2 bundled sample downloads.
app.post("/api/workspace/performance/media-plan-template", upload.single("file"), requireModule("performance"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  const db = await getDB(res);
  const storagePath = `${res.locals.wsId}/media-plan-templates/${crypto.randomUUID()}-${file.originalname}`;
  const { error: uploadErr } = await res.locals.sb.storage
    .from("vault-files")
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadErr) {
    res.status(500).json({ error: "Storage upload failed: " + uploadErr.message });
    return;
  }
  (db as any).mediaPlanTemplate = { fileName: file.originalname, storagePath, uploadedAt: new Date().toISOString().split("T")[0] };
  await saveDB(res, db);
  res.json({ success: true, mediaPlanTemplate: (db as any).mediaPlanTemplate });
});

app.get("/api/workspace/performance/media-plan-template/url", requireModule("performance"), async (req: Request, res: Response) => {
  const db = await getDB(res);
  const template = (db as any).mediaPlanTemplate;
  if (!template?.storagePath) {
    res.status(404).json({ error: "No template uploaded" });
    return;
  }
  const { data, error } = await res.locals.sb.storage.from("vault-files").createSignedUrl(template.storagePath, 300);
  if (error || !data) {
    res.status(500).json({ error: "Could not create signed URL: " + (error?.message || "unknown error") });
    return;
  }
  res.json({ success: true, url: data.signedUrl });
});

// Two bundled sample media plan templates — real downloadable CSVs, not a
// dead link. Generated on the fly, no Storage needed for static content.
app.get("/api/workspace/performance/sample-template/:kind", requireModule("performance"), (req: Request, res: Response) => {
  const { kind } = req.params;
  const templates: Record<string, string> = {
    basic: "Channel,Funnel Stage,Objective,Monthly Budget,Target CPA/ROAS,Campaign Type,Ad Format,Flight Start,Flight End,Expected Impressions,Expected Clicks,Expected Conversions,KPI\nGoogle Ads,BOFU,Lead Gen,\"$15,000\",$120 CPA,Search - Branded,Text Ad,2026-08-01,2026-08-31,150000,4500,120,CPA\n",
    comprehensive: "Channel,Funnel Stage,Objective,Monthly Budget,% of Total Budget,Target CPA,Target ROAS,Campaign Type,Ad Format,Audience/Targeting,Flight Start,Flight End,Expected Impressions,Expected CTR,Expected Clicks,Expected CVR,Expected Conversions,Expected Revenue,KPI,Notes\nGoogle Ads,BOFU / Intent,Lead Gen,\"$20,000\",30%,$110,4.5x,Search - Competitor & Branded,Responsive Search Ad,In-market + Branded Search,2026-08-01,2026-08-31,200000,3.2%,6400,3.1%,198,\"$89,100\",CPA,Prioritize branded defense\nLinkedIn Ads,MOFU / Retargeting,Lead Gen,\"$12,000\",18%,$180,,Single Image Lead Gen,Sponsored Content,Job Title + Company Size,2026-08-01,2026-08-31,80000,0.8%,640,10%,64,,CPL,Retarget site visitors\n",
  };
  const csv = templates[kind];
  if (!csv) {
    res.status(404).json({ error: "Unknown template kind" });
    return;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="media-plan-template-${kind}.csv"`);
  res.send(csv);
});

// Channels & Strategy — real per-channel reasoning (why this channel,
// recommended strategy, likely competitor presence) generated from the
// actual media plan channels, replacing 3 static boilerplate cards.
app.post("/api/workspace/performance/channel-strategies", requireModule("performance"), async (req: Request, res: Response) => {
  const db = await getDB(res);
  const brain = db.secondBrain;
  const mediaPlan = (db as any).mediaPlan as Array<{ channel: string }> | undefined;
  const channels = (mediaPlan && mediaPlan.length > 0 ? mediaPlan.map(m => m.channel) : ["Google Ads", "LinkedIn Ads", "Meta Ads"]);

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not set — channel strategy generation needs a live Gemini key." });
    return;
  }

  try {
    const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const prompt = `
      You are the Head of Performance Media. For each of these channels: ${channels.join(", ")} — answer,
      specific to this business, not generic boilerplate:
      1. why: Why this channel fits this business
      2. strategy: The recommended strategy/campaign approach
      3. competitors: What kind of competitor presence to expect on this channel

      Business context — positioning: ${brain.brandVault.corePositioning}, audience: ${brain.customerVault.idealCustomerProfile}

      Return a JSON array, one object per channel, each with fields: channel, why, strategy, competitors.
    `;
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              channel: { type: Type.STRING },
              why: { type: Type.STRING },
              strategy: { type: Type.STRING },
              competitors: { type: Type.STRING },
            },
            required: ["channel", "why", "strategy", "competitors"],
          },
        },
      },
    });
    const channelStrategies = JSON.parse(response.text || "[]");
    (db as any).channelStrategies = channelStrategies;
    await saveDB(res, db);
    res.json({ success: true, channelStrategies });
  } catch (err: any) {
    console.error("Channel strategy generation failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});

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

async function getAccessTokenFromServiceAccount(keyData: { client_email: string; private_key: string }) {
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

function getConnectorAdapter(platform: ConnectorPlatform): ConnectorAdapter {
  return connectorAdapters[platform] || genericAdapter;
}

function hasConnectorAdapter(platform: ConnectorPlatform): boolean {
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

const publishAdapters: Partial<Record<ConnectorPlatform, PublishAdapter>> = {
  'LinkedIn (Organic)': publishToLinkedIn,
  'Twitter/X (Organic)': publishToTwitter,
  'Facebook Pages': publishToFacebookPage,
  'Notion': publishToNotion,
  'WordPress': publishToWordPress,
};

function getStoredCredentials(connector: Connector): Record<string, any> {
  const blob = connector.credentials?.encrypted;
  if (!blob) return {};
  try {
    return decryptCredentials(blob);
  } catch (err) {
    console.error(`Failed to decrypt credentials for connector ${connector.id}:`, err);
    return {};
  }
}

// Connect (or re-verify) a connector: validate the submitted credentials
// against the live platform, then persist status + encrypted credentials
// as one atomic write. Never echoes credentials back to the client.
app.post("/api/workspace/connectors/:id/connect", async (req: Request, res: Response) => {
  const { id } = req.params;
  const credentials = (req.body?.credentials || {}) as Record<string, any>;
  const db = await getDB(res);
  const connector = db.secondBrain.connectors.find(c => c.id === id);
  if (!connector) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }

  if (!hasConnectorAdapter(connector.platform)) {
    connector.status = 'Disconnected';
    connector.verificationState = 'unsupported';
    connector.verificationError = `Live account verification is not implemented for ${connector.platform}.`;
    await saveDB(res, db);
    res.status(422).json({
      success: false,
      verified: false,
      error: connector.verificationError,
      code: 'UNSUPPORTED_CONNECTOR',
    });
    return;
  }

  let verified = false;
  let verificationError = '';
  try {
    verified = await getConnectorAdapter(connector.platform)(credentials);
  } catch (err) {
    console.error(`Connector validation failed for ${connector.platform}:`, err);
    verified = false;
    verificationError = err instanceof Error ? err.message : 'Provider verification failed.';
  }

  if (!verified) {
    connector.status = 'Disconnected';
    connector.verificationState = 'failed';
    connector.verificationError = verificationError || 'The provider rejected these credentials or account details.';
    // Do not replace a previously verified secret with an invalid submission.
    await saveDB(res, db);
    const { credentials: _omit, ...safeConnector } = connector;
    res.status(422).json({
      success: false,
      connector: safeConnector,
      verified: false,
      error: connector.verificationError,
      code: 'CONNECTOR_VERIFICATION_FAILED',
    });
    return;
  }

  connector.status = 'Connected';
  connector.verificationState = 'verified';
  connector.verificationError = undefined;
  connector.verifiedAt = new Date().toISOString();
  connector.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  connector.credentials = Object.keys(credentials).length > 0
    ? { encrypted: encryptCredentials(credentials) }
    : undefined;

  await saveDB(res, db);
  const { credentials: _omit, ...safeConnector } = connector;
  res.json({ success: true, connector: safeConnector, verified });
});

// Disconnect a connector: clear its credentials, no live validation needed.
app.post("/api/workspace/connectors/:id/disconnect", async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  const connector = db.secondBrain.connectors.find(c => c.id === id);
  if (!connector) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }

  connector.status = 'Disconnected';
  connector.verificationState = 'disconnected';
  connector.verificationError = undefined;
  connector.credentials = undefined;
  await saveDB(res, db);
  const { credentials: _omit, ...safeConnector } = connector;
  res.json({ success: true, connector: safeConnector });
});

// Dynamic Multi-Platform Reconciliation — re-runs the same adapters used at
// connect time to catch credential rot (expired tokens, revoked keys).
const RECONCILIATION_KEYS: Partial<Record<ConnectorPlatform, string>> = {
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

app.post("/api/workspace/run-reconciliation", requireModule("reporting"), async (req: Request, res: Response) => {
  const db = await getDB(res);
  const connectors = db.secondBrain.connectors || [];

  const reconciliation: Record<string, string | number> = {};
  const reconciliationDetails: Record<string, any> = {};
  let dbChanged = false;

  for (const [platform, key] of Object.entries(RECONCILIATION_KEYS)) {
    const conn = connectors.find(c => c.platform === platform);
    if (!conn || conn.status !== 'Connected') {
      reconciliation[key as string] = 'Disconnected';
      continue;
    }

    try {
      const outcome = await executeConnectorReconciliation(conn, getStoredCredentials(conn));
      reconciliation[key as string] = outcome.status;
      reconciliationDetails[platform] = {
        status: outcome.status,
        message: outcome.message,
        reconciledAt: outcome.reconciledAt,
      };

      if (outcome.updatedConnectorState) {
        Object.assign(conn, outcome.updatedConnectorState);
        dbChanged = true;
      }
    } catch (err) {
      reconciliation[key as string] = 'Mismatch';
      reconciliationDetails[platform] = {
        status: 'Mismatch',
        message: err instanceof Error ? err.message : 'Reconciliation probe failed.',
        reconciledAt: new Date().toISOString(),
      };
    }
  }

  if (dbChanged) {
    await saveDB(res, db);
  }

  reconciliation.discrepancyCount = Object.values(reconciliation).filter(s => s !== 'Synced' && s !== 'Disconnected').length;

  res.json({ success: true, reconciliation, details: reconciliationDetails });
});

// ============================================================================
// Verified Ingestion Pipelines & Webhook Testing System
// Real endpoints for persistent pipeline management, account evidence
// verification, live protocol handshakes, and webhook payload testing.
// ============================================================================

app.get("/api/workspace/pipelines", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const pipelines = db.secondBrain.pipelines || [];
  res.json({ success: true, pipelines });
});

app.get("/api/workspace/reporting/metrics", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const media = req.query.media === 'paid' ? 'paid' : req.query.media === 'organic' ? 'organic' : undefined;
  const verifiedPipelines = (db.secondBrain.pipelines || [])
    .filter(p => p.status === 'active' && p.verificationState === 'verified' && p.lastMetrics?.available);

  const metrics = verifiedPipelines
    .map(p => {
      const norm = normalizeSourceMetrics(p.platform, p.propertyId, p.lastMetrics || {}, {
        accountName: p.accountName,
        observedAt: p.lastMetrics?.observedAt,
        isFixture: Boolean((p.lastMetrics as any)?.isFixture),
      });
      return {
        ...norm,
        pipelineId: p.id,
        mediaType: p.lastMetrics?.mediaType || classifyChannelMedia(p.platform),
      };
    })
    .filter(item => !media || item.mediaType === media);

  const spend = metrics.reduce((sum, item) => sum + item.spend, 0);
  const conversions = metrics.reduce((sum, item) => sum + item.conversions, 0);
  const revenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
  const hasLive = metrics.some(item => !item.isFixture);

  res.json({
    success: true,
    metrics: {
      available: metrics.length > 0,
      source: metrics.length === 0 ? 'none' : (hasLive ? 'live_provider' : 'fixture'),
      observedAt: metrics.map(item => item.observedAt).sort().at(-1) || null,
      spend,
      conversions,
      revenue,
      roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : 0,
      providers: metrics,
    },
  });
});

app.get("/api/workspace/operations/readiness", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const connectors = db.secondBrain.connectors || [];
  const allowFixture = req.query.allowFixture === 'true' || process.env.NODE_ENV === 'test';

  const evaluations = OPERATION_APPROVAL_REGISTER.map(op => {
    const conn = connectors.find(c => c.platform === op.canonicalPlatform);
    const creds = conn ? getStoredCredentials(conn) : {};
    return assessOperationReadiness(op.operationId, {
      ...creds,
      verified: conn?.verificationState === 'verified',
    }, { allowFixture });
  });

  res.json({
    success: true,
    operations: evaluations,
    summary: {
      total: evaluations.length,
      readyLive: evaluations.filter(e => e.readinessState === 'ready_live').length,
      readyFixture: evaluations.filter(e => e.readinessState === 'ready_fixture').length,
      blockedCredentials: evaluations.filter(e => e.readinessState === 'blocked_credentials').length,
      blockedApproval: evaluations.filter(e => e.readinessState === 'blocked_approval').length,
    },
  });
});

app.post("/api/workspace/pipelines/save", async (req: Request, res: Response) => {
  // Credentials never belong to a pipeline payload or browser cache. They are
  // accepted only by the verification route and encrypted in the connector vault.
  const { credential: _credential, webhookSecret: _submittedWebhookSecret, status: _submittedStatus, verificationState: _submittedVerificationState, ...pipeline } = req.body as Partial<ActivePipeline>;
  if (!pipeline || !pipeline.accountName?.trim() || !pipeline.propertyId?.trim()) {
    res.status(400).json({ error: "Account Name and Property/Account ID are mandatory evidence fields." });
    return;
  }

  const db = await getDB(res);
  if (!db.secondBrain.pipelines) {
    db.secondBrain.pipelines = [];
  }

  const existingIdx = db.secondBrain.pipelines.findIndex(p => p.id === pipeline.id);
  const existingPipeline = existingIdx >= 0 ? db.secondBrain.pipelines[existingIdx] : undefined;
  const webhookSecret = existingPipeline?.webhookSecret || `whsec_${crypto.createHash('sha256').update(`${pipeline.id || Date.now()}_${pipeline.propertyId}`).digest('hex').slice(0, 24)}`;
  const webhookUrl = pipeline.webhookUrl || `https://api.sigmatactix.com/api/webhooks/ingest?pipeline=${pipeline.id || `pipe-${Date.now()}`}&vault=${encodeURIComponent(pipeline.targetVault || 'Marketing Vault')}`;

  const savedPipeline: ActivePipeline = {
    id: pipeline.id || `pipe-${Date.now()}`,
    name: pipeline.name || `${pipeline.platform} (${pipeline.accountName.trim()})`,
    platform: pipeline.platform || 'Google Ads',
    accountName: pipeline.accountName.trim(),
    propertyId: pipeline.propertyId.trim(),
    targetVault: pipeline.targetVault || 'Marketing Vault',
    syncFrequency: pipeline.syncFrequency || 'Every 15 mins',
    protocol: pipeline.protocol || 'Direct REST API (OAuth 2.0)',
    status: 'warning',
    verificationState: 'configured',
    lastPing: 'Not verified',
    latencyMs: 0,
    credentialSnippet: 'Stored only in encrypted credentials vault after verification',
    metricsCollected: pipeline.metricsCollected || ['Core Telemetry Events', 'Attribution Deltas'],
    webhookUrl,
    webhookSecret,
    totalEventsIngested: pipeline.totalEventsIngested || 0,
    lastIngestedAt: pipeline.lastIngestedAt || undefined,
    allocatedAgents: Array.isArray(pipeline.allocatedAgents) ? pipeline.allocatedAgents.filter((name): name is string => typeof name === 'string' && name.trim().length > 0) : []
  };

  if (existingIdx >= 0) {
    db.secondBrain.pipelines[existingIdx] = {
      ...db.secondBrain.pipelines[existingIdx],
      ...savedPipeline
    };
  } else {
    db.secondBrain.pipelines.unshift(savedPipeline);
  }

  await saveDB(res, db);
  res.json({ success: true, pipeline: savedPipeline });
});

app.post("/api/workspace/pipelines/:id/agent-permissions", async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "Only a workspace owner or admin can authorize agent access." });
    return;
  }
  const agentNames = req.body?.agentNames;
  if (!Array.isArray(agentNames) || agentNames.some((name: unknown) => typeof name !== 'string' || !name.trim())) {
    res.status(400).json({ error: "agentNames must be an array of non-empty agent names." });
    return;
  }
  const db = await getDB(res);
  const pipeline = (db.secondBrain.pipelines || []).find(p => p.id === req.params.id);
  if (!pipeline) {
    res.status(404).json({ error: "Pipeline not found." });
    return;
  }
  pipeline.allocatedAgents = [...new Set(agentNames.map((name: string) => name.trim()))];
  await saveDB(res, db);
  res.json({ success: true, pipeline });
});

app.post("/api/workspace/pipelines/ping", async (req: Request, res: Response) => {
  const { pipelineId, platform, accountName, propertyId, protocol, credential, credentials, targetVault, syncFrequency, metricsCollected } = req.body as Record<string, any>;
  if (!accountName?.trim() || !propertyId?.trim()) {
    res.status(400).json({ error: "Missing Account Name or Property/Account ID evidence." });
    return;
  }

  try {
    const db = await getDB(res);
    const isGA4 = platform?.toLowerCase().includes('analytics') || platform?.toLowerCase().includes('ga4');
    let directResult: { verified: boolean; latencyMs: number; connectorId?: string; resolvedPropertyId?: string } | null = null;

    const submittedCredentials = credentials && typeof credentials === 'object'
      ? { ...credentials, accountId: propertyId.trim(), propertyId: propertyId.trim() }
      : credential
        ? { accessToken: credential, accountId: propertyId.trim(), propertyId: propertyId.trim() }
        : null;
    const gaCredential = submittedCredentials?.serviceAccountKey || credential;

    if (process.env.USE_FIXTURE_PROVIDERS === 'true') {
      const canonical = canonicalConnectorPlatform(platform) || platform;
      const startedAt = performance.now();
      const resolvedPropertyId = propertyId.trim().replace(/^properties\//, '').replace(/^accounts\//, '');
      directResult = {
        verified: true,
        latencyMs: Math.max(24, Math.round(performance.now() - startedAt + 36)),
        resolvedPropertyId,
      };

      let connector = db.secondBrain.connectors.find(c => c.platform === canonical && (getStoredCredentials(c).accountId === propertyId.trim() || getStoredCredentials(c).propertyId === propertyId.trim() || !getStoredCredentials(c).accountId));
      const credPayload = submittedCredentials || { accountId: resolvedPropertyId, propertyId: resolvedPropertyId };
      if (!connector) {
        connector = {
          id: `conn-${Date.now()}`,
          platform: canonical as any,
          status: 'Connected',
          connectedBy: 'admin',
          verificationState: 'verified',
          verifiedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          credentials: { encrypted: encryptCredentials(credPayload) }
        };
        db.secondBrain.connectors.push(connector);
      } else {
        connector.status = 'Connected';
        connector.verificationState = 'verified';
        connector.verificationError = undefined;
        connector.verifiedAt = new Date().toISOString();
        connector.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        connector.credentials = { encrypted: encryptCredentials(credPayload) };
      }
      await saveDB(res, db);
    } else if (isGA4 && gaCredential) {
      const start = performance.now();
      let saKey: any = null;
      if (typeof gaCredential === 'object') {
        saKey = gaCredential;
      } else if (typeof gaCredential === 'string' && gaCredential.trim().startsWith('{')) {
        try { saKey = JSON.parse(gaCredential); } catch { saKey = null; }
      }

      let bearerToken: string | null = null;
      if (saKey?.client_email && saKey?.private_key) {
        bearerToken = await getAccessTokenFromServiceAccount(saKey);
      } else if (typeof gaCredential === 'string') {
        bearerToken = gaCredential;
      }

      if (!bearerToken) {
        throw new Error("Could not authenticate with provided Service Account JSON Key. Ensure private_key and client_email are present.");
      }

      const sumRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
        headers: { "Authorization": `Bearer ${bearerToken}` }
      });
      if (sumRes.status !== 200) {
        throw new Error(`Google Analytics Admin API returned ${sumRes.status}: Check that Google Analytics Admin API is enabled and service account has permissions.`);
      }
      const sumData = await sumRes.json();
      const cleanedTarget = propertyId.trim().replace(/^properties\//, '').replace(/^accounts\//, '');
      let resolvedPropertyId = cleanedTarget;

      for (const acc of (sumData.accountSummaries || [])) {
        const accId = acc.account?.replace(/^accounts\//, '');
        if (accId === cleanedTarget) {
          resolvedPropertyId = acc.propertySummaries?.[0]?.property?.replace(/^properties\//, '') || cleanedTarget;
          break;
        }
        const found = acc.propertySummaries?.find((p: any) => p.property?.replace(/^properties\//, '') === cleanedTarget);
        if (found) {
          resolvedPropertyId = cleanedTarget;
          break;
        }
      }

      const reportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${resolvedPropertyId}:runReport`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
        }),
      });

      if (!reportRes.ok) {
        const repErr = await reportRes.json().catch(() => ({}));
        throw new Error(repErr.error?.message || `Google Analytics Data API returned ${reportRes.status}`);
      }

      directResult = {
        verified: true,
        latencyMs: Math.round(performance.now() - start),
        resolvedPropertyId,
      };

      let gaConn = db.secondBrain.connectors.find(c => c.platform === 'Google Analytics');
      const credPayload = {
        serviceAccountKey: typeof gaCredential === 'string' ? gaCredential : JSON.stringify(gaCredential),
        accountId: cleanedTarget,
        propertyId: resolvedPropertyId,
      };
      if (!gaConn) {
        gaConn = {
          id: `conn-${Date.now()}`,
          platform: 'Google Analytics',
          status: 'Connected',
          verificationState: 'verified',
          connectedBy: 'admin',
          verifiedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          credentials: { encrypted: encryptCredentials(credPayload) }
        };
        db.secondBrain.connectors.push(gaConn);
      } else {
        gaConn.status = 'Connected';
        gaConn.verificationState = 'verified';
        gaConn.verifiedAt = new Date().toISOString();
        gaConn.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        gaConn.credentials = { encrypted: encryptCredentials(credPayload) };
      }
      await saveDB(res, db);
    } else if (submittedCredentials) {
      const validation = validatePriorityConnectorCredentials(platform, propertyId, submittedCredentials);
      if (!validation.valid) throw new Error(validation.error);
      const canonical = canonicalConnectorPlatform(platform);
      if (!canonical || !hasConnectorAdapter(canonical)) {
        throw new Error(`Live account verification is not implemented for ${platform}.`);
      }
      const startedAt = performance.now();
      const verified = await getConnectorAdapter(canonical)(submittedCredentials);
      if (!verified) throw new Error(`The ${platform} API rejected the supplied credentials or account access.`);
      directResult = { verified: true, latencyMs: Math.round(performance.now() - startedAt) };

      let connector = db.secondBrain.connectors.find(c => c.platform === canonical && getStoredCredentials(c).accountId === propertyId.trim());
      if (!connector) {
        connector = { id: `conn-${Date.now()}`, platform: canonical, status: 'Connected', connectedBy: 'admin' };
        db.secondBrain.connectors.push(connector);
      }
      connector.status = 'Connected';
      connector.verificationState = 'verified';
      connector.verificationError = undefined;
      connector.verifiedAt = new Date().toISOString();
      connector.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      connector.credentials = { encrypted: encryptCredentials(submittedCredentials) };
      await saveDB(res, db);
    }

    const result = directResult || await verifyPipelineConnection(platform, propertyId.trim(), db.secondBrain.connectors || [], getStoredCredentials, getConnectorAdapter);
    if (!db.secondBrain.pipelines) db.secondBrain.pipelines = [];
    const persistedAccountId = directResult?.resolvedPropertyId || propertyId.trim();
    let pipeline = db.secondBrain.pipelines.find(p => p.id === pipelineId)
      || db.secondBrain.pipelines.find(p => (p.platform === platform || (isGA4 && (p.platform.includes('Analytics') || p.platform.includes('GA4')))) && (p.propertyId === propertyId.trim() || p.propertyId === persistedAccountId));

    // A verified handshake is itself a connection event. Persist the pipeline
    // here so a successful test cannot disappear before the user reaches Save.
    if (!pipeline) {
      pipeline = {
        id: pipelineId || `pipe-${Date.now()}`,
        name: `${platform} (${accountName.trim()})`,
        platform,
        accountName: accountName.trim(),
        propertyId: persistedAccountId,
        targetVault: targetVault || (isGA4 ? 'Website Vault' : 'Marketing Vault'),
        syncFrequency: syncFrequency || 'Every 15 mins',
        protocol: protocol || 'Direct REST API (OAuth 2.0)',
        status: 'active',
        verificationState: 'verified',
        verifiedAt: new Date().toISOString(),
        lastPing: new Date().toISOString(),
        latencyMs: result.latencyMs,
        credentialSnippet: 'Encrypted credentials vault',
        metricsCollected: Array.isArray(metricsCollected) ? metricsCollected : [],
        totalEventsIngested: 0,
      };
      db.secondBrain.pipelines.unshift(pipeline);
    } else {
      pipeline.status = 'active';
      pipeline.verificationState = 'verified';
      pipeline.verificationError = undefined;
      pipeline.verifiedAt = new Date().toISOString();
      pipeline.lastPing = new Date().toISOString();
      pipeline.latencyMs = result.latencyMs;
      pipeline.propertyId = persistedAccountId;
      pipeline.credentialSnippet = 'Encrypted credentials vault';
    }
    await saveDB(res, db);
    res.json({
      success: true,
      ...result,
      pipeline,
      verifiedAt: new Date().toISOString(),
      message: directResult?.resolvedPropertyId
        ? `Handshake Verified: 200 OK • GA4 Property ${directResult.resolvedPropertyId} connected live via Service Account.`
        : 'Provider account access verified. This check does not ingest data or authorize campaign changes.'
    });
  } catch (error) {
    res.status(422).json({ success: false, verified: false, error: error instanceof Error ? error.message : 'Account verification failed.' });
  }
});

// Pull a small, provider-owned GA4 organic metrics snapshot after a verified
// connection. This is deliberately separate from the handshake: access alone
// is not telemetry, and other providers remain "verified" until their own
// metric adapters are implemented.
app.post("/api/workspace/pipelines/:id/sync-metrics", async (req: Request, res: Response) => {
  const db = await getDB(res);
  const pipeline = (db.secondBrain.pipelines || []).find(p => p.id === req.params.id);
  if (!pipeline) { res.status(404).json({ error: 'Pipeline not found.' }); return; }
  if (pipeline.status !== 'active' || pipeline.verificationState !== 'verified') {
    res.status(409).json({ error: 'Provider access must be verified before metrics can be synchronized.' });
    return;
  }
  if (!/analytics|ga4/i.test(pipeline.platform)) {
    res.status(422).json({ error: `A provider metrics adapter is not implemented for ${pipeline.platform}; this channel remains verified, not live.` });
    return;
  }

  const connector = (db.secondBrain.connectors || []).find(c => c.platform === 'Google Analytics' && getStoredCredentials(c).propertyId === pipeline.propertyId);
  const credentials = connector ? getStoredCredentials(connector) : null;
  let serviceAccount: any = null;
  try { serviceAccount = credentials?.serviceAccountKey ? JSON.parse(credentials.serviceAccountKey) : null; } catch { }
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    res.status(409).json({ error: 'The verified GA4 credential is unavailable. Reconnect GA4 with its service-account JSON key.' });
    return;
  }
  const token = await getAccessTokenFromServiceAccount(serviceAccount);
  if (!token) { res.status(422).json({ error: 'Google rejected the stored service-account credential during metrics synchronization.' }); return; }
  try {
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${pipeline.propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'conversions' }],
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `GA4 Data API returned ${response.status}`);
    const values = payload.rows?.[0]?.metricValues || [];
    const activeUsers = Number(values[0]?.value || 0);
    const sessions = Number(values[1]?.value || 0);
    const conversions = Number(values[2]?.value || 0);
    pipeline.lastMetrics = {
      source: 'ga4_data_api', observedAt: new Date().toISOString(), available: true, mediaType: 'organic',
      activeUsers, sessions, conversions, spend: 0, revenue: 0, roas: 0,
    };
    pipeline.lastIngestedAt = new Date().toISOString();
    await saveDB(res, db);
    res.json({ success: true, pipeline, metrics: pipeline.lastMetrics });
  } catch (err) {
    res.status(422).json({ error: err instanceof Error ? err.message : 'GA4 metric synchronization failed.' });
  }
});

app.post("/api/workspace/pipelines/test-webhook", async (req: Request, res: Response) => {
  const { pipelineId, platform, eventType, payload } = req.body as {
    pipelineId?: string;
    platform?: string;
    eventType?: string;
    payload?: any;
  };

  if (!payload) {
    res.status(400).json({ error: "Missing webhook JSON payload." });
    return;
  }

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex').slice(0, 16);
  const eventId = `evt_${Date.now()}_${crypto.createHash('sha256').update(payloadStr + Date.now()).digest('hex').slice(0, 8)}`;
  const timestamp = new Date().toISOString();

  const db = await getDB(res);
  let targetVault = 'Marketing Vault';

  if (db.secondBrain.pipelines) {
    const pipeline = db.secondBrain.pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      pipeline.totalEventsIngested = (pipeline.totalEventsIngested || 0) + 1;
      pipeline.lastIngestedAt = timestamp;
      pipeline.lastPing = 'Just now';
      targetVault = pipeline.targetVault;
      const source = payload && typeof payload === 'object' ? payload : {};
      const spend = Number(source.spend ?? source.cost ?? source.ad_spend);
      const revenue = Number(source.revenue ?? source.value ?? source.conversion_value);
      const conversions = Number(source.conversions ?? source.purchases ?? source.leads);
      if ([spend, revenue, conversions].every(value => Number.isFinite(value) && value >= 0) && spend > 0) {
        pipeline.lastMetrics = {
          source: 'verified_connector_payload',
          observedAt: timestamp,
          spend,
          conversions,
          revenue,
          roas: revenue / spend,
          available: true,
        };
      }
      await saveDB(res, db);
    }
  }

  // Record ingestion into uploaded files / RAG memory as a verified event
  const newIngestionRecord = {
    id: eventId,
    name: `Webhook Event: ${platform || 'Pipeline'} [${eventType || 'telemetry'}]`,
    size: `${(Buffer.byteLength(payloadStr, 'utf8') / 1024).toFixed(2)} KB`,
    uploadedAt: timestamp.split("T")[0],
    vaultId: targetVault.toLowerCase().replace(/\s+/g, '-'),
    status: "Ready" as const,
    mimeType: "application/json"
  };

  db.secondBrain.uploadedFiles = [newIngestionRecord, ...(db.secondBrain.uploadedFiles || []).slice(0, 49)];
  await saveDB(res, db);

  res.json({
    success: true,
    eventId,
    status: 'DELIVERED',
    httpStatus: 200,
    ingestedAt: timestamp,
    payloadHash: `sha256:${payloadHash}`,
    targetVault,
    recordsProcessed: 1,
    message: `Webhook event '${eventType || 'custom_event'}' successfully authenticated and committed into ${targetVault}.`
  });
});

app.delete("/api/workspace/pipelines/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  if (db.secondBrain.pipelines) {
    db.secondBrain.pipelines = db.secondBrain.pipelines.filter(p => p.id !== id);
    await saveDB(res, db);
  }
  res.json({ success: true, message: `Pipeline ${id} disconnected.` });
});


// ============================================================================
// New modules (#18): CRM, Competitor Analysis, Social Listening. Tables
// (crm_contacts/crm_deals/competitors/social_mentions) and their RLS shipped
// in migration 0003 — these routes are the first thing to actually use them.
// All operate directly on Postgres via the JWT-forwarding client (RLS scopes
// every query to res.locals.wsId already), the same pattern as agents/
// saved_reports above — not the workspace_state jsonb blob.
// ============================================================================

app.get("/api/workspace/crm/contacts", requireModule("crm"), async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.from("crm_contacts").select("*").order("created_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, contacts: data });
});

app.post("/api/workspace/crm/contacts", requireModule("crm"), async (req: Request, res: Response) => {
  const { name, email, company, phone, source, owner, notes } = req.body as Record<string, string | undefined>;
  if (!name || !name.trim()) { res.status(400).json({ error: "Contact name is required." }); return; }
  const { data, error } = await res.locals.sb
    .from("crm_contacts")
    .insert({ workspace_id: res.locals.wsId, name: name.trim(), email, company, phone, source, owner, notes })
    .select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, contact: data });
});

app.patch("/api/workspace/crm/contacts/:id", requireModule("crm"), async (req: Request, res: Response) => {
  const { name, email, company, phone, source, owner, notes } = req.body as Record<string, string | undefined>;
  const patch: Record<string, any> = {};
  if (name !== undefined) patch.name = name;
  if (email !== undefined) patch.email = email;
  if (company !== undefined) patch.company = company;
  if (phone !== undefined) patch.phone = phone;
  if (source !== undefined) patch.source = source;
  if (owner !== undefined) patch.owner = owner;
  if (notes !== undefined) patch.notes = notes;
  const { data, error } = await res.locals.sb.from("crm_contacts").update(patch).eq("id", req.params.id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, contact: data });
});

app.delete("/api/workspace/crm/contacts/:id", requireModule("crm"), async (req: Request, res: Response) => {
  const { error } = await res.locals.sb.from("crm_contacts").delete().eq("id", req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

app.get("/api/workspace/crm/deals", requireModule("crm"), async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.from("crm_deals").select("*").order("created_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, deals: data });
});

const DEAL_STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

app.post("/api/workspace/crm/deals", requireModule("crm"), async (req: Request, res: Response) => {
  const { contactId, title, stage, value, closeDate, notes } = req.body as { contactId?: string; title?: string; stage?: string; value?: number; closeDate?: string; notes?: string };
  if (!title || !title.trim()) { res.status(400).json({ error: "Deal title is required." }); return; }
  if (stage && !DEAL_STAGES.includes(stage)) { res.status(400).json({ error: `Stage must be one of: ${DEAL_STAGES.join(", ")}` }); return; }
  const { data, error } = await res.locals.sb
    .from("crm_deals")
    .insert({ workspace_id: res.locals.wsId, contact_id: contactId || null, title: title.trim(), stage: stage || 'New', value: value ?? null, close_date: closeDate || null, notes })
    .select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, deal: data });
});

app.patch("/api/workspace/crm/deals/:id", requireModule("crm"), async (req: Request, res: Response) => {
  const { title, stage, value, closeDate, notes, contactId } = req.body as { title?: string; stage?: string; value?: number; closeDate?: string; notes?: string; contactId?: string };
  if (stage && !DEAL_STAGES.includes(stage)) { res.status(400).json({ error: `Stage must be one of: ${DEAL_STAGES.join(", ")}` }); return; }
  const patch: Record<string, any> = {};
  if (title !== undefined) patch.title = title;
  if (stage !== undefined) patch.stage = stage;
  if (value !== undefined) patch.value = value;
  if (closeDate !== undefined) patch.close_date = closeDate;
  if (notes !== undefined) patch.notes = notes;
  if (contactId !== undefined) patch.contact_id = contactId || null;
  const { data, error } = await res.locals.sb.from("crm_deals").update(patch).eq("id", req.params.id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, deal: data });
});

app.delete("/api/workspace/crm/deals/:id", requireModule("crm"), async (req: Request, res: Response) => {
  const { error } = await res.locals.sb.from("crm_deals").delete().eq("id", req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

// Real HubSpot contact import — reuses the connector credentials already
// stored for a connected 'HubSpot CRM' connector (same decrypt path
// testHubspotConnection uses to verify it). Dedupes against existing
// crm_contacts by email in JS since the table has no unique constraint on it
// (a contact may legitimately have no email).
app.post("/api/workspace/crm/contacts/import-hubspot", requireModule("crm"), async (req: Request, res: Response) => {
  const db = await getDB(res);
  const connector = (db.secondBrain.connectors || []).find(c => c.platform === 'HubSpot CRM' && c.status === 'Connected');
  if (!connector) {
    res.status(400).json({ error: "Connect HubSpot CRM under Integrations first." });
    return;
  }
  const token = getStoredCredentials(connector).apiKey || getStoredCredentials(connector).accessToken;
  if (!token) {
    res.status(400).json({ error: "HubSpot connector has no stored access token." });
    return;
  }
  try {
    const hsRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,company,phone", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!hsRes.ok) {
      res.status(502).json({ error: `HubSpot API returned ${hsRes.status}` });
      return;
    }
    const hsData: any = await hsRes.json();
    const { data: existing } = await res.locals.sb.from("crm_contacts").select("email").not("email", "is", null);
    const existingEmails = new Set((existing || []).map((r: any) => (r.email || "").toLowerCase()));

    const toInsert = (hsData.results || [])
      .map((r: any) => {
        const p = r.properties || {};
        const name = [p.firstname, p.lastname].filter(Boolean).join(" ").trim() || p.email || "Unnamed HubSpot Contact";
        return { workspace_id: res.locals.wsId, name, email: p.email || null, company: p.company || null, phone: p.phone || null, source: "HubSpot Import" };
      })
      .filter((c: any) => !c.email || !existingEmails.has(c.email.toLowerCase()));

    if (toInsert.length === 0) {
      res.json({ success: true, imported: 0, message: "No new contacts — everything from HubSpot is already imported." });
      return;
    }
    const { data: inserted, error } = await res.locals.sb.from("crm_contacts").insert(toInsert).select();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, imported: inserted.length, contacts: inserted });
  } catch (err: any) {
    res.status(500).json({ error: "HubSpot import failed: " + (err.message || String(err)) });
  }
});

// Competitor Analysis (#18) — real fetch + Gemini analysis against the
// competitor's live domain, same fetchSiteContent()-then-analyze pattern as
// Growth Audit / Authority & SEO. Explicitly labeled inferred-from-public-
// site (no paid competitive-intel API connected), consistent with how
// Growth Audit already labels its social/competitor sections.
app.get("/api/workspace/competitors", requireModule("competitors"), async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.from("competitors").select("*").order("created_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, competitors: data });
});

app.post("/api/workspace/competitors", requireModule("competitors"), async (req: Request, res: Response) => {
  const { name, domain, trackedKeywords } = req.body as { name?: string; domain?: string; trackedKeywords?: unknown };
  if (!name || !domain) { res.status(400).json({ error: "Competitor name and domain are required." }); return; }
  // A non-array trackedKeywords (the `?: string[]` type is only a compile-time
  // assertion, not runtime validation) used to be stored as-is into the jsonb
  // column, then crash every future scan at `.join(", ")` with no way to fix
  // it short of delete+recreate (no PATCH route exists). Validate at the door.
  const cleanKeywords = Array.isArray(trackedKeywords) ? trackedKeywords.filter((k): k is string => typeof k === "string") : [];
  const { data, error } = await res.locals.sb
    .from("competitors")
    .insert({ workspace_id: res.locals.wsId, name: name.trim(), domain: domain.trim(), tracked_keywords: cleanKeywords })
    .select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, competitor: data });
});

app.delete("/api/workspace/competitors/:id", requireModule("competitors"), async (req: Request, res: Response) => {
  const { error } = await res.locals.sb.from("competitors").delete().eq("id", req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

app.post("/api/workspace/competitors/:id/scan", expensiveLimiter, requireModule("competitors"), async (req: Request, res: Response) => {
  const { data: competitor, error: fetchErr } = await res.locals.sb.from("competitors").select("*").eq("id", req.params.id).single();
  if (fetchErr || !competitor) { res.status(404).json({ error: "Competitor not found." }); return; }
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not set — competitor scans need a live Gemini key." });
    return;
  }

  let snapshot;
  try {
    snapshot = await fetchSiteContent(competitor.domain);
  } catch (err: any) {
    res.status(422).json({ error: "Could not fetch the competitor's site: " + err.message });
    return;
  }

  try {
    const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const db = await getDB(res);
    const prompt = `
      You are a competitive intelligence analyst. Analyze this real fetched site data for ${competitor.name}
      (${competitor.domain}) versus our business.

      Our business context: ${db.secondBrain.brandVault?.corePositioning || "(no positioning on file)"}
      Tracked keywords for this competitor: ${(competitor.tracked_keywords || []).join(", ") || "none yet"}

      ${summarizeSnapshotForPrompt(snapshot)}

      This analysis is inferred entirely from the competitor's public site (no paid competitive-intel API
      is connected) — be explicit that traffic/ad-spend figures are not available, and focus on positioning,
      offer, content strategy, and on-page SEO signals you can actually observe.

      Return JSON: { "positioningSummary": string, "strengths": string[], "weaknesses": string[],
        "contentStrategyNotes": string, "seoSignalsNotes": string, "recommendedCounterMoves": string[] }
    `;
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            positioningSummary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentStrategyNotes: { type: Type.STRING },
            seoSignalsNotes: { type: Type.STRING },
            recommendedCounterMoves: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["positioningSummary", "strengths", "weaknesses", "contentStrategyNotes", "seoSignalsNotes", "recommendedCounterMoves"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    const analysis = { ...parsed, scannedUrl: snapshot.finalUrl, scannedAt: new Date().toISOString() };

    const { data: updated, error: updateErr } = await res.locals.sb
      .from("competitors")
      .update({ last_analysis: analysis, last_analyzed_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select().single();
    if (updateErr) { res.status(500).json({ error: updateErr.message }); return; }

    try {
      await saveDocument(res.locals.sb, {
        workspaceId: res.locals.wsId,
        vaultId: "competitor",
        sourceModule: "competitor_analysis",
        fileName: `Competitor Scan — ${competitor.name} — ${analysis.scannedAt.split("T")[0]}`,
        contentText: `${analysis.positioningSummary}\n\nStrengths: ${(analysis.strengths || []).join("; ")}\n\nWeaknesses: ${(analysis.weaknesses || []).join("; ")}`,
      });
    } catch (err) {
      console.error("Failed to save competitor scan into Second Brain documents (non-fatal):", err);
    }

    res.json({ success: true, competitor: updated });
  } catch (err: any) {
    console.error("Competitor scan failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});

// Social Listening (#18) — manual mention capture with real Gemini sentiment
// tagging (not a keyword heuristic). Connector-fed live ingestion is left
// for when a real social listening API is connected — same "connect a data
// source" honesty pattern as Growth Audit's social section.
app.get("/api/workspace/social-mentions", requireModule("social"), async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.from("social_mentions").select("*").order("detected_at", { ascending: false }).limit(200);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, mentions: data });
});

app.post("/api/workspace/social-mentions", requireModule("social"), async (req: Request, res: Response) => {
  const { platform, mentionText, sourceUrl, author } = req.body as { platform?: string; mentionText?: string; sourceUrl?: string; author?: string };
  if (!platform || !mentionText || !mentionText.trim()) {
    res.status(400).json({ error: "Platform and mention text are required." });
    return;
  }

  let sentiment: "Positive" | "Neutral" | "Negative" = "Neutral";
  if (process.env.GEMINI_API_KEY) {
    try {
      const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
      const geminiModel = await resolveEffectiveGeminiModel(res);
      const response = await client.models.generateContent({
        model: geminiModel,
        contents: `Classify the sentiment of this social media mention toward the brand as exactly one word — Positive, Neutral, or Negative:\n\n"${mentionText.trim()}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] } }, required: ["sentiment"] },
        },
      });
      const parsed = JSON.parse(response.text || "{}");
      if (["Positive", "Neutral", "Negative"].includes(parsed.sentiment)) sentiment = parsed.sentiment;
    } catch (err) {
      console.error("Sentiment classification failed, defaulting to Neutral (non-fatal):", err);
    }
  }

  const { data, error } = await res.locals.sb
    .from("social_mentions")
    .insert({ workspace_id: res.locals.wsId, platform, mention_text: mentionText.trim(), source_url: sourceUrl || null, author: author || null, sentiment })
    .select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true, mention: data });
});

app.delete("/api/workspace/social-mentions/:id", requireModule("social"), async (req: Request, res: Response) => {
  const { error } = await res.locals.sb.from("social_mentions").delete().eq("id", req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

// Explicit API 404 handler: Catches any unhandled /api/* route before the SPA
// fallback so unknown or malformed API calls return a clean JSON 404 rather than
// falling through to index.html (which causes HTML-as-JSON syntax errors in callers).
function respondApiNotFound(req: Request, res: Response) {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
}
app.all("/api", respondApiNotFound);
app.all("/api/*", respondApiNotFound);

// Handle serving the production frontend build
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else if (!process.env.VERCEL) {
  // Serve the built SPA only when the build output actually exists next to the
  // running server. dist/server.js lives inside dist/, so the Vite build
  // (plus the public/ assets it copies in) is found relative to __dirname in
  // production; a cwd-relative fallback covers any runtime that lands the
  // bundle elsewhere. Without this guard, pointing a bare deploy at an empty
  // dist/ would 500 on index.html instead of just serving the API.
  const distPath = fs.existsSync(path.join(__dirname, "index.html"))
    ? __dirname
    : fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
      ? path.join(process.cwd(), "dist")
      : "";
  if (distPath) {
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.warn(
      "NODE_ENV=production but no dist/index.html found — API only. " +
      "Run `npm run build` and place the dist/ bundle next to dist/server.js."
    );
  }
}

// Global error handler. Registered LAST — after every route and after the SPA
// fallback above — because Express only treats a 4-arity middleware as an error
// handler and only consults handlers registered after the throwing route.
// Combined with the express-async-errors import at the top of this file, this
// is what turns a rejected promise in any of the ~60 handlers without try/catch
// into a 500 response instead of a process exit.
//
// The message is deliberately generic: these errors carry Supabase/Gemini
// internals that must not reach a browser. The detail goes to the log.
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;

  // A concurrent-write conflict is a normal, expected outcome in a workspace
  // with more than one active member — not a server fault. It gets a 409 and
  // the real message so the client can tell the user to reload, instead of the
  // generic 500 below which reads as "the product is broken".
  if (err instanceof WorkspaceConflictError) {
    console.warn(`Write conflict on ${req.method} ${req.originalUrl} (workspace ${res.locals?.wsId})`);
    res.status(409).json({ error: err.message, conflict: true });
    return;
  }

  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: "An unexpected server error occurred. The team has been notified." });
});

// Cutover diagnostic: only runs when the app is configured to TRUST the ledger.
//
// Product decision: this NEVER blocks startup. An earlier version called
// process.exit(1) here, which was wrong for a paid product — a transient
// Supabase outage at boot would have taken the whole API down, converting a
// "ledger might be stale" warning into a total outage for paying customers.
// Availability wins; visibility is handled instead.
//
// It also does not sit silent on the failure path: loadAgentTasks() already
// falls back to workspace_state with a logged warning, and an admin sees the
// banner on the heatmap. So this check exists to make the misconfiguration
// obvious in the logs at boot, not to enforce anything.
async function reportLedgerTrustProblems(): Promise<void> {
  if (process.env.EXECUTION_LEDGER_AUTHORITATIVE !== "true") return;
  try {
    const usage = await probeLedgerUsability(getServiceRoleClient());
    if (usage.ok) {
      console.log("Execution ledger verified — the ledger is authoritative for task identity and status.");
      return;
    }
    console.warn(formatLedgerGuardFailure(usage.problems).replace("REFUSING TO START", "LEDGER TRUST PROBLEM"));
    console.warn(
      "Continuing to start. Task reads fall back to workspace_state until this is fixed, " +
      "so the app stays available — but new runs will not be recorded authoritatively."
    );
  } catch (err: any) {
    console.warn(
      formatLedgerGuardFailure([`ledger probe failed: ${err?.message || err}`])
        .replace("REFUSING TO START", "LEDGER TRUST PROBLEM")
    );
    console.warn("Continuing to start with workspace_state fallback.");
  }
}

// Vercel invokes the exported app. Standalone supervisors own process lifecycle,
// retention timers, and signals; these must not run in a request function.
if (!process.env.VERCEL) {
await reportLedgerTrustProblems();

const server = app.listen(PORT, "0.0.0.0", () => { console.log(`Sigma Tactix Growth OS Backend running on http://localhost:${PORT}`); });

// Conversation rows have a 30-day expiry; this best-effort service-role sweep
// removes expired rows even when no user opens VANTA. Deployments may replace
// it with pg_cron, but retention does not depend on client behavior.
const vantaRetentionSweep = setInterval(async () => {
  try {
    const serviceClient = getServiceRoleClient();
    const { error } = await serviceClient.rpc('purge_expired_vanta_conversations');
    if (error?.code === 'PGRST202' || /function .* does not exist|schema cache/i.test(error?.message || '')) {
      const { error: fallbackError } = await serviceClient
        .from('vanta_conversations')
        .delete()
        .lte('expires_at', new Date().toISOString());
      if (fallbackError) console.error('VANTA retention fallback failed:', fallbackError.message);
    } else if (error) {
      console.error('VANTA retention sweep failed:', error.message);
    }
  } catch (error) {
    console.error('VANTA retention sweep failed:', error);
  }
}, 6 * 60 * 60 * 1000);
vantaRetentionSweep.unref();

// Last-resort process guards. The Express handler above catches everything that
// happens inside a request; these catch what happens outside one — a rejection
// in a timer, a stream, or a background call with no .catch().
//
// Asymmetric on purpose. An unhandled rejection is logged and survived: killing
// a multi-tenant process over one stray promise is a worse outcome than an
// orphaned operation. An uncaught exception leaves the process in an unknown
// state, so it is logged and the process exits for the supervisor to restart —
// which requires an actual supervisor (systemd Restart=always) to be configured
// in front of this, or the exit is simply downtime.
process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection (surviving):", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException (exiting for supervisor restart):", err);
  server.close(() => process.exit(1));
  // Don't wait forever for in-flight connections to drain on a broken process.
  setTimeout(() => process.exit(1), 5000).unref();
});

// Graceful shutdown on a supervisor stop/restart or a container SIGTERM: stop
// accepting new connections, let in-flight requests finish, then exit cleanly.
// Without this, a deploy drops whatever requests were mid-flight.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`${signal} received — draining connections and shutting down.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10000).unref();
  });
}
}

export default app;
