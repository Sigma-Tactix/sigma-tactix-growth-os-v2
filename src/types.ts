export type ConnectorPlatform =
  | 'Slack' | 'Microsoft Teams' | 'Notion' | 'Jira' | 'Linear' | 'Confluence'
  | 'LinkedIn Ads' | 'TikTok Ads' | 'Twitter (X) Ads' | 'Apple Search Ads'
  | 'Reddit Ads' | 'Pinterest Ads' | 'HubSpot CRM' | 'Meta Ads' | 'Google Ads'
  | 'LinkedIn (Organic)' | 'Twitter/X (Organic)' | 'Facebook Pages' | 'Instagram (Organic)' | 'Reddit (Organic)' | 'WordPress'
  | 'Snapchat Ads' | 'Amazon Ads' | 'Microsoft Ads' | 'Shopify' | 'Klaviyo'
  | 'Mailchimp' | 'Salesforce' | 'Google My Business' | 'Google Analytics'
  | 'Google Search Console' | 'Semrush' | 'Ahrefs' | 'Similarweb' | 'WhatsApp Business';

export interface ConnectorCredentialsInput {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  developerToken?: string;
  accountId?: string;
  propertyId?: string;
  serviceAccountKey?: string;
  webhookUrl?: string;
  siteUrl?: string;
}

export interface Connector {
  id: string;
  platform: ConnectorPlatform;
  status: 'Connected' | 'Disconnected';
  /** Server-owned verification state. `Connected` is retained for compatibility. */
  verificationState?: 'configured' | 'verified' | 'syncing' | 'stale' | 'unsupported' | 'failed' | 'disconnected';
  verificationError?: string;
  verifiedAt?: string;
  lastSyncedAt?: string;
  connectedBy: string;
  credentials?: {
    encrypted: string;
  };
}

export interface SecondBrain {
  executiveVault: {
    financialsOverview: string;
    strategicPlans: string;
    intellectualProperty: string;
  };
  credentialsVault: Array<{
    id: string;
    platform: string;
    username: string;
    status: 'Connected' | 'Disconnected' | 'Needs Re-auth';
    category: 'Website' | 'Social' | 'CRM' | 'Analytics' | 'Ads' | 'Email';
  }>;
  brandVault: {
    voiceAndTone: string;
    corePositioning: string;
    offersAndPricing: string;
    brandSlogan: string;
    keyMessages: string[];
  };
  customerVault: {
    idealCustomerProfile: string;
    targetSegments: string[];
    customerObjections: string[];
    testimonials: string[];
  };
  marketingVault: {
    campaignHistory: string;
    currentChannels: string[];
    recentPerformance: string;
  };
  websiteVault: {
    siteUrl: string;
    cmsType: string;
    analyticsId: string;
    pageHistory: string;
    dnsVerificationToken?: string;
    domainVerificationStatus?: 'unverified' | 'verifying' | 'verified';
  };
  authorityVault: {
    targetKeywords: string[];
    backlinkProfileSummary: string;
    seoFocusAreas: string[];
  };
  operationsVault: {
    standardOperatingProcedures: Array<{
      id: string;
      title: string;
      department: string;
      steps: string[];
    }>;
    orgHierarchy: string;
  };
  aiWorkflowVault: Array<{
    id: string;
    agentType: string;
    systemPrompt: string;
    modelRouterEndpoint: string;
    temperature: number;
    maxTokens: number;
    agentConstraints: string[];
  }>;
  auditVault: {
    overallScore: number;
    lastAuditedAt: string;
    findings: {
      websitePresence: string;
      socialMediaPresence: string;
      seoReadiness: string;
      aiVisibility: string;
      offerClarity: string;
      positioningStrength: string;
      funnelQuality: string;
      analyticsReadiness: string;
    };
  };
  uploadedFiles: Array<{
    id: string;
    name: string;
    size: string;
    uploadedAt: string;
    vaultId: string;
    status: 'Ready' | 'Processing';
    storagePath?: string;
    documentId?: string;
    mimeType?: string;
    sha256?: string;
  }>;
  connectors: Connector[];
  internalStack: Array<{
    id: string;
    name: string;
    category: 'Communication' | 'Collaboration' | 'Project Management' | 'Knowledge Base' | 'Other';
    status: 'Active' | 'Inactive';
    contextCoverage: string;
  }>;
  pipelines?: ActivePipeline[];
}

export interface ActivePipeline {
  id: string;
  name: string;
  platform: string;
  accountName: string;
  propertyId: string;
  targetVault: string;
  syncFrequency: string;
  protocol: string;
  status: 'active' | 'warning' | 'syncing';
  /** Set only after a server-side provider adapter succeeds. */
  verificationState?: 'configured' | 'verified' | 'failed' | 'unsupported';
  verificationError?: string;
  verifiedAt?: string;
  lastPing: string;
  latencyMs: number;
  credentialSnippet: string;
  credential?: string;
  metricsCollected: string[];
  webhookUrl?: string;
  webhookSecret?: string;
  totalEventsIngested?: number;
  lastIngestedAt?: string;
  allocatedAgents?: string[];
  lastMetrics?: NormalizedMetrics;
}

export interface NormalizedMetrics {
  source: string;
  observedAt: string;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  available: boolean;
  /** Organic channel metrics have no required spend or revenue. */
  mediaType?: 'organic' | 'paid';
  activeUsers?: number;
  sessions?: number;
  engagements?: number;
  impressions?: number;
}

export type GrowthFindingCategory =
  | 'websitePresence' | 'socialMediaPresence' | 'seoReadiness' | 'aiVisibility'
  | 'offerClarity' | 'positioningStrength' | 'funnelQuality' | 'analyticsReadiness';

export interface GrowthFinding {
  id: string;
  category: GrowthFindingCategory;
  title: string;
  text: string;
  insight: string;
  impactPct: number;
  quickSteps: string[];
  dataSource: 'live' | 'placeholder';
  /**
   * Phase 2: what KIND of claim this is. An impact percentage produced by a
   * model over a fetched page is an `estimate`, never a `measured_fact`, and
   * the UI must label it as such rather than showing a bare percentage that
   * reads like a measurement.
   */
  claimClassification?: 'measured_fact' | 'calculation' | 'estimate' | 'hypothesis' | 'unavailable';
  /** Evidence records backing this finding, by ID. */
  evidenceIds?: string[];
}

export interface GrowthAudit {
  status: 'pending' | 'completed';
  evidenceMode?: 'live' | 'mixed' | 'heuristic';
  /**
   * Phase 2: computed from the published, deterministic rubric (auditScoring.ts)
   * over observable signals — not the model's opinion. `null` means "no score
   * could be produced" (e.g. the page could not be fetched), which is NOT the
   * same as zero and must never be displayed as 0/100.
   */
  score: number | null;
  /** What the score is based on, and what could not be assessed. */
  scoringBasis?: string;
  scoringChecks?: Array<{
    id: string; label: string; category: string; points: number; passed: boolean; evidence: string;
  }>;
  notAssessedCategories?: string[];
  /**
   * Claims whose supporting evidence disagrees. Surfaced with BOTH references;
   * never resolved by a majority vote. Empty means "none detected", NOT
   * "nothing found" — single-observation claims are not cross-examined.
   */
  discrepancies?: Array<{
    claimId: string;
    claimText: string;
    references: Array<{ evidenceId: string; locator: string; value: unknown }>;
    resolvedByMajorityVote: false;
  }>;
  /**
   * Upgrades an independent reviewer attempted that the system REFUSED, because
   * a model's confidence may only lower a claim's strength, never raise it.
   * Recorded so a reviewer cannot quietly rewrite an evidence-backed claim.
   */
  refusedUpgrades?: Array<{ claimId: string; from: string; to: string; rationale?: string }>;
  domain?: string;
  lastAuditedAt?: string;
  findings: GrowthFinding[];
  recommendations: Array<{
    id: string;
    category: string;
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    effort: 'High' | 'Medium' | 'Low';
    description: string;
    quickSteps: string[];
  }>;
  roadmap90Day: Array<{
    phase: string;
    title: string;
    tasks: string[];
  }>;
  strategies?: GrowthStrategy[];
  completedMilestones?: string[];
}

export interface GrowthCapabilitySnapshot {
  id: string;
  state: string;
  verified: boolean;
  automationEligible: boolean;
  evidence: string[];
}

export interface GrowthStrategyTask {
  id: string;
  title: string;
  agentName: SystemAgentName;
  objective: string;
  status: 'recommended' | 'queuing' | 'pending-approval' | 'running' | 'completed' | 'failed';
  requiresHitl: true;
  taskId?: string;
}

export interface GrowthStrategy {
  id: string;
  rank: number;
  title: string;
  objective: string;
  rationale: string;
  impact: 'High' | 'Medium' | 'Low';
  successMetric: string;
  evidenceIds: string[];
  tasks: GrowthStrategyTask[];
  providers: Array<{
    provider: 'tinyfish' | 'mirofish';
    label: string;
    purpose: string;
    state: 'ready' | 'assisted' | 'setup-required' | 'unknown';
    guidance: string;
  }>;
}

export interface UIUXAudit {
  url: string;
  lastAuditedAt?: string;
  frictionRating: 'High' | 'Medium' | 'Low';
  overallScore: number;
  screenshots?: {
    desktop: string | null;
    mobile: string | null;
    fullPage: string | null;
  };
  findings: {
    usability: string;
    accessibility: string;
    navigation: string;
    mobileResponse: string;
    conversionFriction: string;
  };
  pageLevelRecommendations: Array<{
    page: string;
    issue: string;
    solution: string;
    impact: 'High' | 'Medium' | 'Low';
  }>;
}

export interface ContentAsset {
  id: string;
  title: string;
  channel: 'Website' | 'Blog' | 'LinkedIn' | 'Twitter' | 'Email' | 'Facebook' | 'Instagram' | 'TikTok' | 'General';
  assetType: 'Text' | 'Image' | 'Video' | 'Carousel';
  content: string;
  createdAt: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Published';
  brief: {
    context: string;
    direction: string;
    emotions: string;
    objective: string;
    offer: string;
  };
  publishResults?: Array<{
    platform: string;
    success: boolean;
    url?: string;
    error?: string;
    publishedAt: string;
  }>;
}

export interface KeywordCluster {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  topicalAuthorityStatus: 'Unranked' | 'Low Visibility' | 'High Visibility' | 'Authority Entity';
  backlinkTargetCount: number;
  clusterId?: string;
  clusterName?: string;
}

export interface AuthorityInsights {
  domain: string;
  generatedAt: string;
  topicalCoverage: { score: number; summary: string };
  aeo: {
    label: 'placeholder';
    citationReadinessScore: number;
    hasStructuredData: boolean;
    hasFaqContent: boolean;
    summary: string;
    recommendations: string[];
  };
  geo: {
    label: 'placeholder';
    summary: string;
    recommendations: string[];
  };
  backlinkOpportunities: Array<{ target: string; rationale: string }>;
}

export type SystemAgentName =
  | 'Marketing Agent'
  | 'AI SDR (Sales Agent)'
  | 'Customer Success Agent'
  | 'Operations Agent'
  | 'Audit Diagnostic Agent'
  | 'Creative Director Agent'
  | 'SEO & Authority Agent';

export interface AgentTask {
  id: string;
  agentName: SystemAgentName;

  /** Mission-control identity. A task may be resumed without losing its plan. */
  missionId?: string;
  planId?: string;
  subAgentId?: string;
  executionSubAgentIds?: string[];
  parentTaskId?: string;
  requiresApproval?: boolean;

  goal: string;
  timestamp: string;
  status: 'Pending Approval' | 'Running' | 'Success' | 'Failed' | 'Rejected';
  requestedVaults?: string[];
  allowedScope?: string[];
  requestedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  steps: string[];
  output: string;
  moduleKey?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  /** Server-owned deterministic-render request. Only the approval route may execute it. */
  creativeRender?: {
    title: string;
    subtitle?: string;
    cta?: string;
    aspectRatio: '16:9' | '9:16' | '1:1';
    durationSeconds: number;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  department: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Pending' | 'Accepted' | 'Revoked';
  invitedAt: string;
}

export interface AnalyticsAudit {
  url: string;
  lastAuditedAt?: string;
  score: number;
  tagsFound: string[];
  pixelsFound: string[];
  eventsTracking: string[];
  findings: {
    tagManager: string;
    pixels: string;
    events: string;
    dataLayer: string;
  };
  recommendations: Array<{
    id: string;
    category: string;
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    description: string;
  }>;
}

// Google Search Console (SEO & AEO Authority module).
//
// Secrets stored in these structures (OAuth client pair, Google-granted
// tokens) are always AES-256-GCM wrapped via credentialCrypto before they
// reach the workspace blob — never raw (clinerules rule 4).
export type GscVerificationState = 'configured' | 'verified' | 'failed';

export interface GscOAuthClientConfig {
  clientId: string;
  clientSecret: string;
}

export interface GscTokens {
  accessToken: string;
  refreshToken?: string;
  /** ISO timestamp after which accessToken must be refreshed. */
  expiresAt: string;
  scope?: string;
}

export interface GscWorkspaceSettings {
  connected: boolean;
  siteUrl: string;
  verificationState?: GscVerificationState;
  verificationMessage?: string;
  /** Single-use CSRF nonce minted at connect time for the OAuth grant. */
  oauthState?: string;
  /** Absolute callback URI captured from the connect request's origin. */
  oauthRedirectUri?: string;
  /** encryptCredentials({ clientId, clientSecret }) */
  oauthClientEncrypted?: string;
  /** encryptCredentials(GscTokens) */
  tokensEncrypted?: string;
  lastFetched?: string;
  lastError?: string;
}

export interface WorkspaceSettings {
  technical: {
    customDomain: string;
    sslStatus: 'Active' | 'Inactive';
  };
  integrations: Array<{ id: string; name: string; status: 'Connected' | 'Disconnected' }>;
  mcps: Array<{ id: string; name: string; enabled: boolean; moduleKey?: string; purpose?: string }>;
  skills: Array<{ id: string; name: string; moduleKey: string; enabled: boolean; content?: string; fileName?: string }>;
  agentTeams?: Record<string, string[]>;
  plugins?: Array<{ id: string; name: string; enabled: boolean; moduleKey?: string; purpose?: string }>;
  gsc?: GscWorkspaceSettings;
}

export interface SetupProgress {
  currentStep: number;
  completedSteps: number[];
  isDismissed?: boolean;
}

export interface WorkspaceData {
  secondBrain: SecondBrain;
  growthAudit: GrowthAudit;
  uiuxAudit: UIUXAudit | null;
  analyticsAudit: AnalyticsAudit | null;
  contentAssets: ContentAsset[];
  keywords: KeywordCluster[];
  authorityInsights?: AuthorityInsights | null;
  agentTasks: AgentTask[];
  teamMembers: TeamMember[];
  invitations: Invitation[];
  settings: WorkspaceSettings;
  setupProgress?: SetupProgress;
  tokenUsage?: TokenUsageRecord[];
}

// Additional UI / Component navigation and scheduling interfaces
export interface NavItem {
  label: string;
  href: string;
  icon: any;
}

export interface Metric {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: any;
}

export interface Schedule {
  id: string;
  name: string;
  category: string;
  format: 'PDF' | 'PPTX' | 'XLSX';
  frequency: string;
  recipients: string[];
  lastRun: string;
  status: 'active' | 'paused' | 'failed';
}

export interface HistoryItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'failed';
}

// Token Metering & Client Profitability Telemetry
export interface TokenUsageRecord {
  id: string;
  workspaceId: string;
  taskId?: string;
  agentId?: string;
  actionType: string;
  provider: string;
  modelName: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  durationMs?: number;
  status: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ClientProfitabilityMetrics {
  tierKey: string;
  tierDisplayName: string;
  monthlyRetainerUsd: number;
  aiTokenCostUsd: number;
  cloudInfraCostUsd: number;
  netProfitUsd: number;
  grossMarginPct: number;
  roiMultiplier: number;
}

export interface TokenTelemetrySummary {
  totalCalls: number;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  profitability: ClientProfitabilityMetrics;
  byModel: Record<string, { calls: number; totalTokens: number; costUsd: number }>;
  byAction: Record<string, { calls: number; totalTokens: number; costUsd: number }>;
  byAgent: Record<string, { calls: number; totalTokens: number; costUsd: number }>;
  recentRecords: TokenUsageRecord[];
}

export interface AIKeyConfig {
  provider: 'gemini' | 'google' | 'openai' | 'anthropic' | 'xai' | 'qwen' | 'deepseek' | 'glm' | string;
  configured: boolean;
  model: string;
  updatedAt?: string | null;
  live: boolean;
}

export interface ClientWorkspace {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  icp?: string;
  geography?: string;
  region: string;
  tier: 'starter' | 'growth' | 'enterprise';
  status: 'ACTIVE' | 'SYNCING' | 'PROVISIONING';
  vaultSecurity: string;
  createdAt: string;
  activeModel?: string;
  brandVault?: {
    corePositioning?: string;
    offersAndPricing?: string;
    voiceAndTone?: string;
  };
  connectors?: Array<{
    platform: string;
    accountName: string;
    propertyId: string;
  }>;
}

export interface AgentReachChannelStatus {
  id: string;
  name: string;
  tier: number;
  status: 'ok' | 'warn' | 'off' | 'error';
  message: string;
  backends: string[];
  activeBackend: string | null;
  fixCommand?: string;
}

export interface AgentReachDoctorSummary {
  timestamp: string;
  cliAvailable: boolean;
  cliVersion?: string;
  totalChannels: number;
  readyCount: number;
  warningCount: number;
  offlineCount: number;
  channels: Record<string, AgentReachChannelStatus>;
}

export interface GoogleAdsMcpStatus {
  checkedAt: string;
  installed: boolean;
  reachable: boolean;
  configured: boolean;
  verified: boolean;
  readOnly: boolean;
  command: string;
  serverVersion?: string;
  tools: string[];
  missingConfiguration: string[];
  detail: string;
}

export interface AgentReachFetchResult {
  success: boolean;
  channel: string;
  target: string;
  title?: string;
  content: string;
  byteCount: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface CompetitorBattlecard {
  competitorName: string;
  targetUrl: string;
  valueProposition: string;
  coreStrengths: string[];
  vulnerabilities: string[];
  pricingSignals: string;
  counterPositioning: string;
  salesTalkTrack: string;
  sourceDossierSummary: string;
  timestamp: string;
}

export interface RepurposedArticle {
  title: string;
  subtitle: string;
  format: string;
  targetAudience: string;
  markdownContent: string;
  keyTakeaways: string[];
  citedQuotes: Array<{ quote: string; context: string; sourceUrl: string }>;
  estimatedReadTime: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourceThumbnail?: string;
}

export interface RepurposedCarouselAndThread {
  sourceUrl: string;
  sourceTitle?: string;
  sourceThumbnail?: string;
  slides: Array<{
    slideNumber: number;
    badge: string;
    title: string;
    subtitle: string;
    contentPoints: string[];
    takeaway: string;
    visualCue: string;
  }>;
  tweetThread: Array<{
    tweetNumber: number;
    text: string;
    characterCount: number;
    hashtags: string[];
    engagementHook: string;
  }>;
}

export interface DecisionTraceRecord {
  id: string;
  operation: 'triage' | 'route' | 'safety';
  provider: string;
  mode: 'shadow' | 'active' | 'fallback';
  authoritative_engine: string;
  selected_value: Record<string, unknown>;
  confidence: number;
  probabilities: Record<string, number>;
  requires_hitl: boolean;
  policy_override: boolean;
  shadow_provider: string | null;
  shadow_decision: Record<string, unknown> | null;
  duration_ms: number;
  created_at: string;
}
