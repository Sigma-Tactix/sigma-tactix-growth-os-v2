export interface VantaPageContext {
  clientName: string;
  workspaceId: string;
  routePath: string;
  objectName: string;
  filterSummary: string;
  period: string;
  selection?: string;
}

export const ROUTE_OBJECT_MAP: Record<string, string> = {
  '/': 'Executive Command & Overview',
  '/diagnostics': 'Growth Diagnostics & Levers',
  '/vaults': 'Second Brain Knowledge Vaults',
  '/suite/creative': 'Creative Studio & Generation Hub',
  '/suite/social': 'Social Media & Carousel Distribution',
  '/suite/search': 'SEO & Answer Engine Optimization (AEO)',
  '/suite/demand': 'Demand Generation & Outbound Levers',
  '/suite/paid': 'Paid Performance Ads & Budget Levers',
  '/suite/intelligence': 'Market Radar & Competitor Intelligence',
  '/suite/attribution': 'Revenue Attribution & Unit Economics',
  '/seo-aeo': 'Topical Authority & AEO Matrix',
  '/paid-ads': 'Ad Sets & Cross-Network Budgets',
  '/content': 'Editorial Engine & Thought Leadership',
  '/social-carousels': 'Social Carousel Generation',
  '/image-studio': 'Image Production & Asset Generation',
  '/video-studio': 'Generative Video Studio',
  '/email-marketing': 'Lifecycle Sequences & Retention',
  '/cro-studio': 'CRO Experiments & Conversion Audit',
  '/intake': 'Client Intake & Sovereign Discovery',
  '/outreach': 'Targeted Prospecting & Outbound Enclaves',
  '/social-listening': 'Social Signals & Sentiment Radar',
  '/attribution': 'Touchpoint Attribution & CAC Analysis',
  '/competitors': 'Competitor Positioning & Benchmarks',
  '/market-simulator': 'Market Simulation & Agent Modeling',
  '/content-engine': 'Editorial Pipeline & Syndication',
  '/connectors': 'Verified Marketing Data Connectors',
  '/data-sources': 'Verified Marketing Data Connectors',
  '/sources': 'Verified Marketing Data Connectors',
  '/learnings': 'Organizational Growth Learnings',
  '/explorer': 'AI Knowledge Explorer & Synthesis',
  '/living-system': 'Living System Neural Core & Topology',
  '/vanta-lab': 'VANTA Neural Interface Lab',
  '/agents': 'Autonomous Multi-Agent Cockpit',
  '/agent-reach': 'Omnichannel Distribution Reach',
  '/scheduler': 'Job Scheduler & Durable Workers',
  '/reports': 'Executive Performance Reports & Artifacts',
  '/architecture': 'System Architecture & Data Flow',
  '/tenants': 'Client Enclaves & Workspace Directory',
  '/harness': 'Execution Harness & Runtime View',
  '/models': 'AI Model Providers & Routing',
  '/prompts': 'System Prompts & Directives',
  '/skills': 'MCP Skills & Operational Tools',
  '/cron': 'Durable Cron Schedules & Automation',
};

function formatPathSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function resolveObjectNameFromPath(pathname: string): string {
  const normalized = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (ROUTE_OBJECT_MAP[normalized]) {
    return ROUTE_OBJECT_MAP[normalized];
  }

  // Dynamic fallback for nested paths like /suite/xyz or /tenants/xyz
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) return 'Executive Overview';
  return segments.map(formatPathSegment).join(' › ');
}

export function resolveVantaPageContext(params: {
  pathname: string;
  search?: string;
  workspaceName?: string;
  workspaceId?: string;
  selection?: string;
}): VantaPageContext {
  const { pathname, search = '', workspaceName, workspaceId, selection } = params;
  const cleanPath = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  const objectName = resolveObjectNameFromPath(cleanPath);

  const urlParams = new URLSearchParams(search);
  const period =
    urlParams.get('period') ||
    urlParams.get('range') ||
    urlParams.get('timeframe') ||
    'Last 30 Days';

  const filters: string[] = [];
  if (urlParams.get('status')) filters.push(`Status: ${urlParams.get('status')}`);
  if (urlParams.get('channel')) filters.push(`Channel: ${urlParams.get('channel')}`);
  if (urlParams.get('tier')) filters.push(`Tier: ${urlParams.get('tier')}`);
  if (urlParams.get('tab')) filters.push(`Tab: ${urlParams.get('tab')}`);
  if (urlParams.get('q')) filters.push(`Search: "${urlParams.get('q')}"`);

  const filterSummary = filters.length > 0 ? filters.join(' · ') : 'Default View';

  return {
    clientName: workspaceName?.trim() || 'Sigma Tactix (HQ)',
    workspaceId: workspaceId?.trim() || 'ws-primary',
    routePath: cleanPath,
    objectName,
    filterSummary,
    period,
    selection: selection?.trim() || undefined,
  };
}
