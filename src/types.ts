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
}

export interface GrowthAudit {
  status: 'pending' | 'completed';
  score: number;
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
  completedMilestones?: string[];
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
