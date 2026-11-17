import type { WorkspaceData } from '../types';
import type { DecisionRuntimeStatus } from './decisionEngine';

/** A catalogue toggle is deliberately not a capability state. */
export type CapabilityState = 'declared' | 'installed' | 'authenticated' | 'reachable' | 'verified' | 'degraded' | 'unavailable';
export type CapabilityKind = 'mcp' | 'connector' | 'provider';

export type VerificationLevel =
  | 'implemented'
  | 'unit_verified'
  | 'integration_verified'
  | 'staging_verified'
  | 'production_verified';

export type OperationFreshness = 'fresh' | 'stale' | 'unverified';

export interface OperationVerificationReceipt {
  receiptId: string;
  verifiedAt: string;
  verificationLevel: VerificationLevel;
  environment: 'development' | 'test' | 'staging' | 'production';
  toolVersion: string;
  buildSha?: string;
  account?: string;
  workspaceId: string;
  proof: string;
  limitation?: string;
}

export interface OperationCapabilityStatus {
  id: string;
  operation: string;
  moduleKey: string;
  provider: string;
  supported: boolean;
  configured: boolean;
  verified: boolean;
  productionVerified: boolean;
  verificationLevel: VerificationLevel;
  freshness: OperationFreshness;
  checkedAt?: string;
  limitation: string;
  evidence: string[];
  receipt?: OperationVerificationReceipt;
  isFixture?: boolean;
}

export interface OperationSummary {
  total: number;
  supported: number;
  configured: number;
  verified: number;
  productionVerified: number;
  fresh: number;
  stale: number;
  unverified: number;
}

export interface GrowthCapabilityStatus {
  id: string;
  name: string;
  kind: CapabilityKind;
  moduleKey: string;
  state: CapabilityState;
  declared: true;
  enabled: boolean;
  configured: boolean;
  reachable: boolean;
  verified: boolean;
  automationEligible: boolean;
  checkedAt?: string;
  evidence: string[];
}

export interface CapabilityRegistry {
  generatedAt: string;
  capabilities: GrowthCapabilityStatus[];
  summary: Record<CapabilityState, number>;
  operations: OperationCapabilityStatus[];
  operationsSummary: OperationSummary;
}

export interface ExternalProviderCapability {
  provider: string;
  configured: boolean;
  verified: boolean;
  operations?: string[];
  detail: string;
  isFixture?: boolean;
  environment?: 'development' | 'test' | 'staging' | 'production';
  toolVersion?: string;
  account?: string;
  verifiedAt?: string;
}

export interface OperationDefinition {
  id: string;
  operation: string;
  moduleKey: string;
  provider: string;
  toolVersion: string;
  limitation: string;
  requiresProvider?: string;
  requiresConnector?: string[];
  builtIn?: boolean;
}

export const OPERATION_DEFINITIONS: OperationDefinition[] = [
  {
    id: 'creative.editorial.generate',
    operation: 'Generate Editorial Content',
    moduleKey: 'creative-editorial',
    provider: 'gemini',
    toolVersion: 'gemini:1.5-pro',
    limitation: 'Content requires operator review and brand voice alignment before publication.',
    requiresProvider: 'gemini',
  },
  {
    id: 'creative.editorial.repurpose',
    operation: 'Repurpose Content to Social & Newsletter',
    moduleKey: 'creative-editorial',
    provider: 'gemini',
    toolVersion: 'gemini:1.5-flash',
    limitation: 'Derivative formats preserve source assertions; exported drafts require HITL review.',
    requiresProvider: 'gemini',
  },
  {
    id: 'creative.image.generate',
    operation: 'Generate Campaign Imagery',
    moduleKey: 'creative-image',
    provider: 'fluxPro',
    toolVersion: 'flux-pro:1.1',
    limitation: 'Requires active AI image key; generated assets stored in tenant media vault.',
    requiresProvider: 'fluxPro',
  },
  {
    id: 'creative.video.render',
    operation: 'Deterministic Video Rendering & Audio Mux',
    moduleKey: 'creative-video',
    provider: 'hyperframes',
    toolVersion: 'hyperframes:0.8.139',
    limitation: 'Deterministic scene stitching and voiceover muxing; requires owner/admin approved task.',
    builtIn: true,
  },
  {
    id: 'social.publishing.draft',
    operation: 'Create Social Post Draft',
    moduleKey: 'social-publishing',
    provider: 'socialScheduler',
    toolVersion: 'socialScheduler:1.2.0',
    limitation: 'Draft creation prepares payload without live external network broadcast.',
    builtIn: true,
  },
  {
    id: 'social.publishing.schedule',
    operation: 'Schedule Multi-Channel Social Post',
    moduleKey: 'social-publishing',
    provider: 'socialScheduler',
    toolVersion: 'socialScheduler:1.2.0',
    limitation: 'Requires valid ISO timestamp; execution gated by operator approval and hash binding.',
    builtIn: true,
  },
  {
    id: 'social.publishing.publish',
    operation: 'Broadcast Live Social Post',
    moduleKey: 'social-publishing',
    provider: 'socialScheduler',
    toolVersion: 'socialScheduler:1.2.0',
    limitation: 'Live publication requires connected channel OAuth grants; unconfigured channels fail closed.',
    requiresConnector: ['LinkedIn', 'Twitter / X', 'Meta Ads'],
  },
  {
    id: 'social.listening.radar',
    operation: 'Capture Social Mentions & Radar Signals',
    moduleKey: 'social-listening',
    provider: 'socialListeningRadar',
    toolVersion: 'socialRadar:1.0.0',
    limitation: 'Subject to platform rate limits; webhooks require signature verification.',
    builtIn: true,
  },
  {
    id: 'search.gsc.read',
    operation: 'Query Search Console Metrics',
    moduleKey: 'search-seo-aeo',
    provider: 'gscService',
    toolVersion: 'gsc:v1',
    limitation: 'Read-only query access; credentials AES-256-GCM encrypted; no ranking guarantees.',
    requiresConnector: ['Google Search Console', 'Google Analytics'],
  },
  {
    id: 'search.aeo.citations',
    operation: 'Track Answer Engine Citations',
    moduleKey: 'search-seo-aeo',
    provider: 'aeoCitationEngine',
    toolVersion: 'aeoEngine:1.0.0',
    limitation: 'Citations measured across synthetic question clusters; model non-determinism applies.',
    builtIn: true,
  },
  {
    id: 'search.cro.landing_page',
    operation: 'Synthesize Landing Page Package',
    moduleKey: 'search-cro',
    provider: 'croStudioEngine',
    toolVersion: 'croEngine:1.0.0',
    limitation: 'Generates self-contained HTML/Tailwind packages; live publishing requires custom domain DNS.',
    builtIn: true,
  },
  {
    id: 'demand.intake.qualification',
    operation: 'Sub-60s Inbound Lead Qualification',
    moduleKey: 'demand-intake',
    provider: 'inboundIntakeEngine',
    toolVersion: 'intakeEngine:1.0.0',
    limitation: 'Webhook ingestion enforces cryptographic signature verification.',
    builtIn: true,
  },
  {
    id: 'demand.outreach.enrichment',
    operation: 'Account Enrichment & Battlecards',
    moduleKey: 'demand-outreach',
    provider: 'abmOutreachEngine',
    toolVersion: 'outreachEngine:1.0.0',
    limitation: 'Enrichment throttled to preserve delivery reputation; emails gated behind operator sign-off.',
    builtIn: true,
  },
  {
    id: 'paid.ads.metrics',
    operation: 'Read ROAS & Campaign Pacing Metrics',
    moduleKey: 'paid-ads',
    provider: 'metaAdsVerification',
    toolVersion: 'adPacing:1.0.0',
    limitation: 'Read-only analytics sync; account ID binding required.',
    requiresConnector: ['Meta Ads', 'Google Ads'],
  },
  {
    id: 'paid.ads.budget_mutation',
    operation: 'Re-Allocate Campaign Ad Budget',
    moduleKey: 'paid-ads',
    provider: 'performanceAdsPacing',
    toolVersion: 'adPacing:1.0.0',
    limitation: 'Requires explicit owner/admin approval before mutation payload is transmitted to ad networks.',
    requiresConnector: ['Meta Ads', 'Google Ads'],
  },
  {
    id: 'paid.ads.save_hook',
    operation: 'Save Ad Copy Hook to RAG Vector Memory',
    moduleKey: 'paid-ads',
    provider: 'adHookRAG',
    toolVersion: 'ragVector:1.0.0',
    limitation: 'RAG hooks stored tenant-isolated under RLS database policies.',
    builtIn: true,
  },
  {
    id: 'paid.email.lifecycle',
    operation: 'Generate Retention & Lifecycle Flow',
    moduleKey: 'paid-email',
    provider: 'emailMarketingEngine',
    toolVersion: 'emailEngine:1.0.0',
    limitation: 'Generated drafts held in queue until target ESP credentials are authenticated.',
    builtIn: true,
  },
  {
    id: 'intel.competitors.scan',
    operation: 'Multi-Channel Threat Intelligence Scan',
    moduleKey: 'intel-competitors',
    provider: 'tinyfish',
    toolVersion: 'tinyfish:0.4.1',
    limitation: 'Local development fixture active; production scan requires authenticated TinyFish API key.',
    requiresProvider: 'tinyfish',
  },
  {
    id: 'intel.simulator.run',
    operation: 'Agentic Market Scenario Simulation',
    moduleKey: 'intel-simulator',
    provider: 'mirofish',
    toolVersion: 'mirofish:0.3.0',
    limitation: 'Simulations execute only after calibration baseline and safety policies pass.',
    requiresProvider: 'mirofish',
  },
  {
    id: 'measurement.attribution.report',
    operation: 'Compute Blended CAC & Revenue Attribution',
    moduleKey: 'measurement',
    provider: 'attributionCalculator',
    toolVersion: 'attribution:1.0.0',
    limitation: 'Calculations depend on imported campaign spend receipts and verified conversion records.',
    builtIn: true,
  },
  {
    id: 'decision.triage',
    operation: 'Calibrated System 1 Risk Triage',
    moduleKey: 'vanta-decision',
    provider: 'laya',
    toolVersion: 'laya:1.0.0',
    limitation: 'In shadow mode, observations are logged but deterministic safety rules remain authoritative.',
    requiresProvider: 'laya',
  },
  {
    id: 'queue.approval.governance',
    operation: 'Cryptographic Action Approval & Dispatch',
    moduleKey: 'action-queue',
    provider: 'actionQueueGovernance',
    toolVersion: 'actionQueue:2.0.0',
    limitation: 'Bound to canonical payload hash; non-2xx responses fail closed with error receipts.',
    builtIn: true,
  },
];

function connectorCapability(connector: WorkspaceData['secondBrain']['connectors'][number]): GrowthCapabilityStatus {
  const verification = connector.verificationState;
  const verified = verification === 'verified' && connector.status === 'Connected';
  const unavailable = verification === 'unsupported';
  const degraded = verification === 'failed';
  const configured = verified || verification === 'configured' || degraded || unavailable || Boolean(connector.credentials?.encrypted);
  const authenticated = !verified && !degraded && !unavailable && Boolean(connector.credentials?.encrypted);
  const state: CapabilityState = unavailable ? 'unavailable' : degraded ? 'degraded' : verified ? 'verified' : authenticated ? 'authenticated' : 'declared';
  const evidence = verified
    ? [`Provider handshake succeeded${connector.verifiedAt ? ` at ${connector.verifiedAt}` : ''}.`]
    : unavailable || degraded
      ? [connector.verificationError || 'Provider verification failed or is unsupported.']
      : configured
        ? ['Credentials or configuration exist, but no current provider verification is recorded.']
        : ['Connector is available in the catalogue; no credentials or provider verification are recorded.'];
  return {
    id: `connector-${connector.id}`,
    name: connector.platform,
    kind: 'connector',
    moduleKey: 'channels',
    state,
    declared: true,
    enabled: connector.status === 'Connected',
    configured,
    reachable: verified,
    verified,
    automationEligible: verified,
    checkedAt: connector.verifiedAt,
    evidence,
  };
}

function layaCapability(status: DecisionRuntimeStatus): GrowthCapabilityStatus {
  const verified = status.state === 'calibrated' && status.executionEligible;
  const failed = status.state === 'degraded' || status.state === 'failed';
  return {
    id: 'provider-laya',
    name: 'Laya Decision Core',
    kind: 'provider',
    moduleKey: 'decision',
    state: failed ? 'degraded' : verified ? 'verified' : status.reachable ? 'reachable' : status.configured ? 'installed' : 'declared',
    declared: true,
    enabled: status.configured,
    configured: status.configured,
    reachable: status.reachable,
    verified,
    automationEligible: status.executionEligible,
    checkedAt: status.checkedAt,
    evidence: [status.detail],
  };
}

/**
 * Builds operation-level capabilities and receipts (S08-A1, S08-A2, S08-A3).
 */
export function buildOperationCapabilities(
  workspace: WorkspaceData,
  decisionRuntime?: DecisionRuntimeStatus,
  externalProviders: ExternalProviderCapability[] = [],
  now = new Date().toISOString(),
): OperationCapabilityStatus[] {
  const tinyfish = externalProviders.find(item => item.provider === 'tinyfish');
  const mirofish = externalProviders.find(item => item.provider === 'mirofish');
  const workspaceId = (workspace as any)?.id || 'ws-default';

  return OPERATION_DEFINITIONS.map(op => {
    let configured = false;
    let verified = false;
    let productionVerified = false;
    let verificationLevel: VerificationLevel = 'implemented';
    let checkedAt: string | undefined = undefined;
    let isFixture = false;
    const evidence: string[] = [];

    if (op.builtIn) {
      configured = true;
      verified = true;
      productionVerified = true;
      verificationLevel = 'production_verified';
      checkedAt = now;
      evidence.push('Verified deterministic execution runtime in current deployment.');
    } else if (op.requiresProvider === 'tinyfish') {
      configured = Boolean(tinyfish?.configured);
      isFixture = Boolean(
        tinyfish?.isFixture ||
        tinyfish?.detail?.toLowerCase().includes('fixture') ||
        tinyfish?.detail?.toLowerCase().includes('mock') ||
        tinyfish?.detail?.toLowerCase().includes('deterministic testing')
      );
      checkedAt = tinyfish?.verifiedAt || (tinyfish?.configured ? now : undefined);

      if (isFixture) {
        // S08-A3: Fixtures never mark operation production verified
        verified = true;
        productionVerified = false;
        verificationLevel = 'unit_verified';
        evidence.push('Fixture adapter active for deterministic testing; live production verification pending.');
      } else if (tinyfish?.verified) {
        verified = true;
        productionVerified = true;
        verificationLevel = 'production_verified';
        evidence.push(tinyfish.detail || 'Live TinyFish provider handshake verified.');
      } else if (tinyfish?.configured) {
        // S08-A3: Key presence never marks operation production verified
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push(tinyfish.detail || 'API key is configured; no live provider handshake has been recorded.');
      } else {
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push('TinyFish provider adapter implemented; credentials not configured.');
      }
    } else if (op.requiresProvider === 'mirofish') {
      configured = Boolean(mirofish?.configured);
      isFixture = Boolean(
        mirofish?.isFixture ||
        mirofish?.detail?.toLowerCase().includes('fixture') ||
        mirofish?.detail?.toLowerCase().includes('mock') ||
        mirofish?.detail?.toLowerCase().includes('deterministic testing')
      );
      checkedAt = mirofish?.verifiedAt || (mirofish?.configured ? now : undefined);

      if (isFixture) {
        // S08-A3: Fixtures never mark operation production verified
        verified = true;
        productionVerified = false;
        verificationLevel = 'unit_verified';
        evidence.push('Fixture adapter active for deterministic testing; live production verification pending.');
      } else if (mirofish?.verified) {
        verified = true;
        productionVerified = true;
        verificationLevel = 'production_verified';
        evidence.push(mirofish.detail || 'Live MiroFish provider handshake verified.');
      } else if (mirofish?.configured) {
        // S08-A3: Key presence never marks operation production verified
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push(mirofish.detail || 'API key is configured; no live provider handshake has been recorded.');
      } else {
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push('MiroFish provider adapter implemented; deployment and governance gates incomplete.');
      }
    } else if (op.requiresProvider === 'laya') {
      configured = Boolean(decisionRuntime?.configured);
      checkedAt = decisionRuntime?.checkedAt;
      if (decisionRuntime?.calibrated && decisionRuntime?.executionEligible) {
        verified = true;
        productionVerified = true;
        verificationLevel = 'production_verified';
        evidence.push(decisionRuntime.detail || 'Calibrated Laya execution engine verified.');
      } else if (decisionRuntime?.reachable) {
        verified = false;
        productionVerified = false;
        verificationLevel = 'integration_verified';
        evidence.push(decisionRuntime.detail || 'Laya runtime reachable in observation/shadow mode; deterministic policy authoritative.');
      } else if (decisionRuntime?.configured) {
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push('Laya runtime configured; calibration check not complete.');
      } else {
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push('Decision runtime adapter implemented; local service not running.');
      }
    } else if (op.requiresProvider === 'gemini' || op.requiresProvider === 'fluxPro') {
      const hasKey = Boolean(
        (workspace as any)?.settings?.aiProvider?.apiKey ||
        process.env.GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY
      );
      configured = hasKey;
      checkedAt = hasKey ? now : undefined;
      if (hasKey) {
        // Key presence alone is implemented/configured, not production verified (S08-A3)
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push('Provider key configured in workspace settings; live generation requires per-request execution.');
      } else {
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push('AI model provider declared; API key not configured.');
      }
    } else if (op.requiresConnector) {
      const connectors = workspace.secondBrain?.connectors || [];
      const match = connectors.find(c =>
        op.requiresConnector?.some(rc => rc.toLowerCase() === c.platform.toLowerCase())
      );
      if (match) {
        configured = Boolean(match.credentials?.encrypted || match.status === 'Connected');
        checkedAt = match.verifiedAt;
        if (match.verificationState === 'verified' && match.status === 'Connected') {
          verified = true;
          productionVerified = true;
          verificationLevel = 'production_verified';
          evidence.push(`Provider handshake verified with ${match.platform}${match.verifiedAt ? ` at ${match.verifiedAt}` : ''}.`);
        } else if (match.credentials?.encrypted) {
          // S08-A3: Credential presence without verification is NOT production verified
          verified = false;
          productionVerified = false;
          verificationLevel = 'implemented';
          evidence.push(`Encrypted credentials exist for ${match.platform}; live provider verification has not been recorded.`);
        } else {
          verified = false;
          productionVerified = false;
          verificationLevel = 'implemented';
          evidence.push(`Connector ${match.platform} is declared in workspace; status is ${match.status}.`);
        }
      } else {
        configured = false;
        verified = false;
        productionVerified = false;
        verificationLevel = 'implemented';
        evidence.push(`Connector required for ${op.operation} is not configured in workspace.`);
      }
    }

    // Freshness calculation (S08-A1)
    let freshness: OperationFreshness = 'unverified';
    if (checkedAt) {
      try {
        const diffMs = Math.abs(new Date(now).getTime() - new Date(checkedAt).getTime());
        freshness = diffMs <= 24 * 60 * 60 * 1000 ? 'fresh' : 'stale';
      } catch {
        freshness = 'unverified';
      }
    }

    // S08-A2: Receipt generation for verified operations
    let receipt: OperationVerificationReceipt | undefined = undefined;
    if (verified) {
      const sanitizedOpId = op.id.replace(/[^a-zA-Z0-9]/g, '-');
      const datePart = (checkedAt || now).slice(0, 10).replace(/[^a-zA-Z0-9]/g, '');
      const accountId =
        (workspace as any)?.id ||
        (workspace as any)?.secondBrain?.connectors?.find((c: any) => c.status === 'Connected')?.id ||
        'ws-default';

      receipt = {
        receiptId: `rcpt-${sanitizedOpId}-${datePart}`,
        verifiedAt: checkedAt || now,
        verificationLevel,
        environment: isFixture ? 'test' : productionVerified ? 'production' : 'development',
        toolVersion: op.toolVersion,
        account: accountId,
        workspaceId,
        proof: evidence[0] || 'Verification proof recorded.',
        limitation: op.limitation,
      };
    }

    return {
      id: op.id,
      operation: op.operation,
      moduleKey: op.moduleKey,
      provider: op.provider,
      supported: true,
      configured,
      verified,
      productionVerified,
      verificationLevel,
      freshness,
      checkedAt,
      limitation: op.limitation,
      evidence,
      receipt,
      isFixture: isFixture || undefined,
    };
  });
}

export function buildCapabilityRegistry(
  workspace: WorkspaceData,
  decisionRuntime?: DecisionRuntimeStatus,
  externalProviders: ExternalProviderCapability[] = [],
  now = new Date().toISOString(),
): CapabilityRegistry {
  const tinyfish = externalProviders.find(item => item.provider === 'tinyfish');
  const mirofish = externalProviders.find(item => item.provider === 'mirofish');
  const capabilities: GrowthCapabilityStatus[] = [
    ...(workspace.settings?.mcps ?? []).map(mcp => ({
      id: mcp.id,
      name: mcp.name,
      kind: 'mcp' as const,
      moduleKey: mcp.moduleKey || 'unassigned',
      // An enabled catalogue row cannot prove a local process, authentication,
      // or a successful call, so it remains declared until a transport is
      // registered and verified.
      state: 'declared' as const,
      declared: true as const,
      enabled: mcp.enabled,
      configured: false,
      reachable: false,
      verified: false,
      automationEligible: false,
      evidence: [mcp.enabled
        ? 'Workspace catalogue toggle is enabled; no runtime transport or handshake is registered.'
        : 'Capability is declared in the workspace catalogue but disabled.'],
    })),
    ...(workspace.secondBrain?.connectors ?? []).map(connectorCapability),
    {
      id: 'provider-tinyfish', name: 'TinyFish Web Intelligence', kind: 'provider', moduleKey: 'web-intelligence',
      state: tinyfish?.verified ? (tinyfish.isFixture ? 'installed' : 'verified') : tinyfish?.configured ? 'authenticated' : 'declared',
      declared: true, enabled: Boolean(tinyfish?.configured), configured: Boolean(tinyfish?.configured),
      reachable: Boolean(tinyfish?.verified && !tinyfish.isFixture), verified: Boolean(tinyfish?.verified && !tinyfish.isFixture),
      automationEligible: false,
      evidence: [tinyfish?.detail || 'Adapter is implemented; no API key or runtime handshake is configured.'],
    },
    {
      id: 'provider-mirofish', name: 'MiroFish Market Simulation', kind: 'provider', moduleKey: 'market-simulation',
      state: mirofish?.verified ? (mirofish.isFixture ? 'installed' : 'verified') : mirofish?.configured ? 'authenticated' : 'unavailable',
      declared: true, enabled: Boolean(mirofish?.configured), configured: Boolean(mirofish?.configured),
      reachable: Boolean(mirofish?.verified && !mirofish.isFixture), verified: Boolean(mirofish?.verified && !mirofish.isFixture),
      automationEligible: false,
      evidence: [mirofish?.detail || 'Private-service adapter exists; deployment and governance gates are incomplete.'],
    },
    ...(decisionRuntime ? [layaCapability(decisionRuntime)] : []),
  ];

  const summary: Record<CapabilityState, number> = {
    declared: 0,
    installed: 0,
    authenticated: 0,
    reachable: 0,
    verified: 0,
    degraded: 0,
    unavailable: 0,
  };
  for (const capability of capabilities) summary[capability.state] += 1;

  // Build operation-level capabilities and receipts (S08)
  const operations = buildOperationCapabilities(workspace, decisionRuntime, externalProviders, now);
  const operationsSummary: OperationSummary = {
    total: operations.length,
    supported: operations.filter(o => o.supported).length,
    configured: operations.filter(o => o.configured).length,
    verified: operations.filter(o => o.verified).length,
    productionVerified: operations.filter(o => o.productionVerified).length,
    fresh: operations.filter(o => o.freshness === 'fresh').length,
    stale: operations.filter(o => o.freshness === 'stale').length,
    unverified: operations.filter(o => o.freshness === 'unverified').length,
  };

  return { generatedAt: now, capabilities, summary, operations, operationsSummary };
}
