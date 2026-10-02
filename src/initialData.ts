import { WorkspaceData, Connector, WorkspaceSettings } from './types';

// ============================================================================
// The state a REAL new workspace starts in. (FEAT-005)
//
// This file used to hold Sigma Tactix's demo dataset, and loadWorkspace()
// seeded it into Postgres on a new tenant's first request — so a pilot client's
// first screen showed a completed audit scoring 68 against sigmatactix.com,
// credentials at @sigmatactix.com, five uploaded files and nine connectors
// reporting 'Connected', all presented as theirs.
//
// That dataset now lives in its own fixture module under src/data/, imported
// only by tests and by the explicit SEED_DEMO_WORKSPACE path in
// src/lib/workspaceStore.ts. This file must never import it — FEAT-005 R4,
// whose acceptance criterion greps this file for that module's name.
//
// Two things below are deliberately NOT empty, because they are product catalog
// rather than tenant data:
//   * CONNECTOR_CATALOG — the connect/disconnect routes resolve a connector by
//     id out of secondBrain.connectors, so an empty array would make every
//     integration un-connectable. Structure is kept; state is not.
//   * MCP_CATALOG / PLUGIN_CATALOG — the registry the Agentic Cockpit renders.
//     Shared app configuration, identical for every tenant.
// ============================================================================

// Available integrations, as structure only — no status, no credentials, no
// sync history. Every entry starts Disconnected because nothing is connected.
export const CONNECTOR_CATALOG: Connector[] = [
  { id: 'conn-1', platform: 'Slack', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-2', platform: 'Microsoft Teams', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-3', platform: 'Notion', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-4', platform: 'Confluence', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-5', platform: 'Linear', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-6', platform: 'LinkedIn Ads', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-7', platform: 'TikTok Ads', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-8', platform: 'Twitter (X) Ads', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-9', platform: 'Apple Search Ads', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-10', platform: 'Reddit Ads', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-11', platform: 'Pinterest Ads', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-12', platform: 'HubSpot CRM', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-13', platform: 'Meta Ads', status: 'Disconnected', connectedBy: '' },
  { id: 'conn-14', platform: 'Google Ads', status: 'Disconnected', connectedBy: '' },
];

export const MCP_CATALOG: WorkspaceSettings['mcps'] = [
    { id: 'mcp-brain-1', name: 'Filesystem MCP', moduleKey: 'brain', purpose: 'Read/write vault documents and uploaded context files', enabled: true },
    { id: 'mcp-brain-2', name: 'Supabase MCP', moduleKey: 'brain', purpose: 'Query the Second Brain vault tables and pgvector RAG store', enabled: true },

    { id: 'mcp-growth-1', name: 'Fetch / Web MCP', moduleKey: 'growth', purpose: 'Fetch and parse target site pages during diagnostic audits', enabled: true },
    { id: 'mcp-growth-2', name: 'Lighthouse MCP', moduleKey: 'growth', purpose: 'Core Web Vitals and performance scoring for audits', enabled: true },

    { id: 'mcp-uiux-1', name: 'Chrome DevTools MCP', moduleKey: 'uiux', purpose: 'Live DOM inspection, screenshots and accessibility tree audits', enabled: true },
    { id: 'mcp-uiux-2', name: 'Figma MCP', moduleKey: 'uiux', purpose: 'Pull design specs and compare implementation against them', enabled: false },

    { id: 'mcp-content-1', name: 'Canva MCP', moduleKey: 'content', purpose: 'Generate and export creative assets for campaigns', enabled: false },
    { id: 'mcp-content-2', name: 'WordPress MCP', moduleKey: 'content', purpose: 'Publish and update content assets on the client CMS', enabled: false },

    { id: 'mcp-perf-1', name: 'Meta Ads API MCP', moduleKey: 'performance', purpose: 'Campaign, ad set and creative performance data', enabled: true },
    { id: 'mcp-perf-2', name: 'Google Ads MCP', moduleKey: 'performance', purpose: 'Search/PMax campaign metrics and keyword performance', enabled: true },
    { id: 'mcp-perf-3', name: 'Windsor.ai Connector', moduleKey: 'performance', purpose: 'Unified multi-channel ad spend and attribution data', enabled: true },

    { id: 'mcp-report-1', name: 'Google Analytics (GA4) MCP', moduleKey: 'reporting', purpose: 'Session, conversion and funnel data for reports', enabled: true },
    { id: 'mcp-report-2', name: 'Google Sheets MCP', moduleKey: 'reporting', purpose: 'Export report data and read client-supplied spreadsheets', enabled: false },

    { id: 'mcp-authority-1', name: 'Google Search Console MCP', moduleKey: 'authority', purpose: 'Query impressions, clicks, positions and indexation issues', enabled: true },
    { id: 'mcp-authority-2', name: 'Ahrefs MCP', moduleKey: 'authority', purpose: 'Backlink profile, domain rating and keyword difficulty', enabled: false },

    { id: 'mcp-crm-1', name: 'HubSpot API Connector', moduleKey: 'crm', purpose: 'Sync contacts, deals and pipeline stages', enabled: false },
    { id: 'mcp-crm-2', name: 'Klaviyo Connector', moduleKey: 'crm', purpose: 'Lifecycle email flows and segment membership', enabled: true },

    { id: 'mcp-comp-1', name: 'Firecrawl MCP', moduleKey: 'competitors', purpose: 'Scrape and monitor competitor sites for positioning changes', enabled: true },
    { id: 'mcp-comp-2', name: 'Meta Ad Library MCP', moduleKey: 'competitors', purpose: 'Track competitor paid creative and messaging', enabled: false },

    { id: 'mcp-social-1', name: 'X / Twitter MCP', moduleKey: 'social', purpose: 'Monitor brand mentions and conversation volume', enabled: false },
    { id: 'mcp-social-2', name: 'Reddit MCP', moduleKey: 'social', purpose: 'Track subreddit sentiment and organic brand discussion', enabled: false },

    { id: 'mcp-agents-1', name: 'Sequential Thinking MCP', moduleKey: 'agents', purpose: 'Structured multi-step reasoning for complex agent runs', enabled: true },
    { id: 'mcp-agents-2', name: 'Memory MCP', moduleKey: 'agents', purpose: 'Persistent cross-run agent memory scoped to the workspace', enabled: true },

    { id: 'mcp-sim-1', name: 'Sequential Thinking MCP', moduleKey: 'simulation', purpose: 'Branch and compare what-if scenario chains', enabled: true },
    { id: 'mcp-sim-2', name: 'Memory MCP', moduleKey: 'simulation', purpose: 'Recall prior scenario runs when projecting a new one', enabled: true }
];

export const PLUGIN_CATALOG: NonNullable<WorkspaceSettings['plugins']> = [
    { id: 'plg-brain-1', name: 'Vault Tagging Assistant', moduleKey: 'brain', purpose: 'Auto-suggests which vault an uploaded document belongs in', enabled: true },
    { id: 'plg-brain-2', name: 'Document OCR', moduleKey: 'brain', purpose: 'Extracts text from scanned/image-based uploads', enabled: false },

    { id: 'plg-growth-1', name: 'Core Web Vitals Calculator', moduleKey: 'growth', purpose: 'Scores LCP/CLS/INP against pass thresholds', enabled: true },
    { id: 'plg-growth-2', name: 'Diagnostic Score Benchmarker', moduleKey: 'growth', purpose: 'Compares this audit\'s score against prior runs', enabled: true },

    { id: 'plg-uiux-1', name: 'Contrast Ratio Checker', moduleKey: 'uiux', purpose: 'Flags text/background pairs failing WCAG AA', enabled: true },
    { id: 'plg-uiux-2', name: 'Heuristic Evaluation Checklist', moduleKey: 'uiux', purpose: 'Nielsen 10-heuristics pass for a given screen', enabled: false },

    { id: 'plg-content-1', name: 'Headline A/B Generator', moduleKey: 'content', purpose: 'Produces headline variants for a content asset', enabled: true },
    { id: 'plg-content-2', name: 'Brand Voice Consistency Checker', moduleKey: 'content', purpose: 'Flags copy drifting from the Brand Vault\'s tone rules', enabled: false },

    { id: 'plg-perf-1', name: 'CPA / ROAS Calculator', moduleKey: 'performance', purpose: 'Computes blended CPA and ROAS across channels', enabled: true },
    { id: 'plg-perf-2', name: 'Budget Pacing Alert', moduleKey: 'performance', purpose: 'Flags campaigns over/under-pacing against monthly budget', enabled: true },

    { id: 'plg-report-1', name: 'PDF Report Exporter', moduleKey: 'reporting', purpose: 'Renders a report view to a branded PDF', enabled: true },
    { id: 'plg-report-2', name: 'Chart Template Library', moduleKey: 'reporting', purpose: 'Reusable chart layouts for recurring report sections', enabled: false },

    { id: 'plg-authority-1', name: 'Keyword Difficulty Estimator', moduleKey: 'authority', purpose: 'Scores target keywords for realistic ranking effort', enabled: true },
    { id: 'plg-authority-2', name: 'Content Gap Finder', moduleKey: 'authority', purpose: 'Diffs ranked competitor topics against owned content', enabled: false },

    { id: 'plg-crm-1', name: 'Lead Scoring Calculator', moduleKey: 'crm', purpose: 'Weights contact fields into a qualification score', enabled: true },
    { id: 'plg-crm-2', name: 'Deal Stage Reminder', moduleKey: 'crm', purpose: 'Flags deals stalled past a stage\'s typical duration', enabled: false },

    { id: 'plg-comp-1', name: 'Pricing Comparison Builder', moduleKey: 'competitors', purpose: 'Builds a side-by-side pricing table from tracked competitors', enabled: true },
    { id: 'plg-comp-2', name: 'SWOT Generator', moduleKey: 'competitors', purpose: 'Drafts a SWOT from a competitor\'s tracked findings', enabled: false },

    { id: 'plg-social-1', name: 'Hashtag Trend Finder', moduleKey: 'social', purpose: 'Surfaces rising hashtags relevant to tracked keywords', enabled: false },
    { id: 'plg-social-2', name: 'Mention Sentiment Scorer', moduleKey: 'social', purpose: 'Scores logged mentions as positive/neutral/negative', enabled: true },

    { id: 'plg-agents-1', name: 'Prompt Template Library', moduleKey: 'agents', purpose: 'Reusable prompt scaffolds for common agent tasks', enabled: true },
    { id: 'plg-agents-2', name: 'Token Usage Estimator', moduleKey: 'agents', purpose: 'Estimates cost/tokens before dispatching a run', enabled: false },

    { id: 'plg-sim-1', name: 'Monte Carlo Projection', moduleKey: 'simulation', purpose: 'Runs randomized trials across a scenario\'s input ranges', enabled: true },
    { id: 'plg-sim-2', name: 'Scenario Comparison Matrix', moduleKey: 'simulation', purpose: 'Side-by-side outcome comparison across saved scenarios', enabled: false }
];

export const emptyWorkspaceData: WorkspaceData = {
  secondBrain: {
    executiveVault: { financialsOverview: '', strategicPlans: '', intellectualProperty: '' },
    credentialsVault: [],
    brandVault: { voiceAndTone: '', corePositioning: '', offersAndPricing: '', brandSlogan: '', keyMessages: [] },
    customerVault: { idealCustomerProfile: '', targetSegments: [], customerObjections: [], testimonials: [] },
    marketingVault: { campaignHistory: '', currentChannels: [], recentPerformance: '' },
    websiteVault: { siteUrl: '', cmsType: '', analyticsId: '', pageHistory: '', domainVerificationStatus: 'unverified' },
    authorityVault: { targetKeywords: [], backlinkProfileSummary: '', seoFocusAreas: [] },
    operationsVault: { standardOperatingProcedures: [], orgHierarchy: '' },
    aiWorkflowVault: [],
    auditVault: {
      overallScore: 0,
      lastAuditedAt: '',
      findings: {
        websitePresence: '', socialMediaPresence: '', seoReadiness: '', aiVisibility: '',
        offerClarity: '', positioningStrength: '', funnelQuality: '', analyticsReadiness: '',
      },
    },
    uploadedFiles: [],
    connectors: CONNECTOR_CATALOG,
    internalStack: [],
  },
  // NOTE (FEAT-005 R2 deviation, needs a human call): the spec asks for
  // growthAudit.status === 'not_started', but the GrowthAudit type in
  // src/types.ts only permits 'pending' | 'completed'. 'pending' is used here
  // as the un-run state. Widening the union to add 'not_started' would ripple
  // through every status branch in App.tsx for no behavioural gain, so it was
  // not done unilaterally — open decision, tracked in ../.gsd/ROADMAP.md M1.
  growthAudit: {
    status: 'pending',
    // `null`, not 0. No audit has been run, so there is no score — and a zero
    // would render as "0/100", telling the client the site failed every check
    // when in fact nothing was ever measured.
    score: null,
    findings: [],
    recommendations: [],
    roadmap90Day: [],
    completedMilestones: [],
  },
  uiuxAudit: null,
  analyticsAudit: null,
  contentAssets: [],
  keywords: [],
  authorityInsights: null,
  agentTasks: [],
  teamMembers: [],
  invitations: [],
  settings: {
    technical: { customDomain: '', sslStatus: 'Inactive' },
    integrations: [],
    mcps: MCP_CATALOG,
    skills: [],
    agentTeams: {},
    plugins: PLUGIN_CATALOG,
  },
  setupProgress: { currentStep: 1, completedSteps: [] },
};

// Historical name, kept so the ~6 existing import sites keep compiling. It now
// points at the empty template — which is the entire point of FEAT-005.
export const initialWorkspaceData: WorkspaceData = emptyWorkspaceData;
