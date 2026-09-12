export interface ChannelCampaignRow {
  id: string;
  channel: string;
  source: string;
  medium: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
  trend: string;
  status: 'SCALING' | 'OPTIMAL' | 'REVIEW' | 'PAUSED';
}

export interface AgeSegment {
  range: string;
  shareOfConversions: number;
  users: number;
  aov: number;
  cac: number;
  roas: number;
}

export interface GenderSegment {
  gender: string;
  percentage: number;
  conversions: number;
  revShare: number;
}

export interface GeoMetroSegment {
  id: string;
  metro: string;
  region: string;
  country: string;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  flag: string;
}

export interface DeviceSegment {
  platform: string;
  share: number;
  convRate: number;
  roas: number;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
}

export interface PersonaProfile {
  id: string;
  name: string;
  role: string;
  subtitle: string;
  shareOfLeads: number;
  primaryMotivation: string;
  corePainPoint: string;
  techAdoption: 'Innovator' | 'Early Adopter' | 'Pragmatist';
  buyingTrigger: string;
  projectedLtv: number;
  salesVelocityDays: number;
  channelAffinity: string[];
  objectionVector: string;
  sentimentScore: number;
}

export interface IntentTier {
  tier: string;
  percentage: number;
  description: string;
  avgDealSize: number;
  conversionRate: number;
}

export interface BehavioralCluster {
  cluster: string;
  count: number;
  conversionLikelihood: 'Very High' | 'High' | 'Moderate' | 'Low';
  description: string;
  topAction: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  targetAudience: string;
  recommendedCadence: string;
  iconName: string;
  kpiSummary: Array<{
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
    subtext: string;
  }>;
}

// ----------------------------------------------------------------------
// TEMPLATES DEFINITIONS
// ----------------------------------------------------------------------
export const EXECUTIVE_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tpl-omnichannel',
    name: 'Omnichannel Executive Growth',
    category: 'Executive Suite',
    badge: 'Board Standard',
    description: 'Comprehensive macro overview uniting blended ROAS, multi-channel spend efficiency, customer acquisition costs, and full-funnel attribution.',
    targetAudience: 'Chief Executive Officer, Board Members, Head of Growth',
    recommendedCadence: 'Weekly & Monthly Board Sync',
    iconName: 'LayoutGrid',
    kpiSummary: [
      { label: 'Blended Ad Spend', value: '$84,250', change: '+12.4%', isPositive: true, subtext: 'Within approved $90k envelope' },
      { label: 'Blended ROAS', value: '4.82x', change: '+0.42x', isPositive: true, subtext: 'Target benchmark: 4.20x' },
      { label: 'Blended CAC', value: '$24.50', change: '-18.2%', isPositive: true, subtext: 'Efficiency gain from Second Brain' },
      { label: 'Net Attributed Revenue', value: '$406,085', change: '+24.6%', isPositive: true, subtext: 'All tracked channels & assisted deals' }
    ]
  },
  {
    id: 'tpl-paid-acquisition',
    name: 'Paid Acquisition & Media Mix',
    category: 'Performance Marketing',
    badge: 'High Velocity',
    description: 'Micro-grain granular performance for paid channels (Google Ads, Meta, LinkedIn), campaign pacing, creative saturation, and cost per lead.',
    targetAudience: 'VP Performance Marketing, Media Buyers, Growth Engineers',
    recommendedCadence: 'Daily / 3x Weekly Pacing Check',
    iconName: 'BarChart3',
    kpiSummary: [
      { label: 'Paid Media Outlay', value: '$79,250', change: '+14.1%', isPositive: true, subtext: 'Google (48%), Meta (37%), LinkedIn (15%)' },
      { label: 'Paid ROAS (Target: 4.0x)', value: '4.64x', change: '+0.31x', isPositive: true, subtext: 'Top campaign generating 6.2x' },
      { label: 'Avg Cost Per Acquisition', value: '$26.80', change: '-11.4%', isPositive: true, subtext: 'PMax brand campaign at $12.10' },
      { label: 'Direct Conversions', value: '2,958', change: '+18.5%', isPositive: true, subtext: 'Verified conversion events' }
    ]
  },
  {
    id: 'tpl-audience-icp',
    name: 'Audience & ICP Segmentation',
    category: 'Market Intelligence',
    badge: 'Persona Deep-Dive',
    description: 'Multidimensional demographic and psychographic breakdown revealing buyer archetypes, motivations, geographical sweet-spots, and LTV predictability.',
    targetAudience: 'Chief Marketing Officer, Product Marketing, Strategy Directors',
    recommendedCadence: 'Bi-Weekly Strategy & Product Review',
    iconName: 'Users',
    kpiSummary: [
      { label: 'Core ICP Penetration', value: '68.4%', change: '+9.2%', isPositive: true, subtext: 'Matches Ideal Customer Profile criteria' },
      { label: 'Top Segment Conv Rate', value: '7.8%', change: '+1.9%', isPositive: true, subtext: 'Tech Founders & VP Growth 28-44 yrs' },
      { label: 'Avg Projected LTV', value: '$52,400', change: '+15.0%', isPositive: true, subtext: 'Calculated over 24-month horizon' },
      { label: 'Sales Cycle Velocity', value: '16.4 Days', change: '-5.2 Days', isPositive: true, subtext: 'Speed from lead to contract sign' }
    ]
  },
  {
    id: 'tpl-authority-organic',
    name: 'Organic Search & Authority Engine',
    category: 'Brand & SEO',
    badge: 'Long-Term Equity',
    description: 'Topical map dominance, non-brand organic clicks, referral traffic quality, and AI knowledge visibility scores generated by the Authority Vault.',
    targetAudience: 'Head of Content, SEO Director, Brand Strategists',
    recommendedCadence: 'Bi-Weekly & Monthly SEO Sprint',
    iconName: 'Globe',
    kpiSummary: [
      { label: 'Organic Search Spend Equiv', value: '$34,100', change: '+28.0%', isPositive: true, subtext: 'Cost if purchased via Google Search Ads' },
      { label: 'Organic ROAS Equivalent', value: '8.40x', change: '+1.10x', isPositive: true, subtext: 'Calculated on organic attribution' },
      { label: 'Non-Brand Organic Visits', value: '142,600', change: '+32.4%', isPositive: true, subtext: 'Covering 18 topical clusters' },
      { label: 'AI Engine Visibility Score', value: '91.8/100', change: '+6.4 pts', isPositive: true, subtext: 'Perplexity, ChatGPT & Gemini citations' }
    ]
  }
];

// ----------------------------------------------------------------------
// CHANNELS, SOURCE, MEDIUM, CAMPAIGN NAME DATASET
// ----------------------------------------------------------------------
export const CHANNEL_CAMPAIGN_DATA: ChannelCampaignRow[] = [
  {
    id: 'cc-1',
    channel: 'Google Ads',
    source: 'google',
    medium: 'cpc',
    campaignName: 'US_Search_HighIntent_Brand_Q4',
    spend: 18400,
    impressions: 482000,
    clicks: 34700,
    ctr: 7.20,
    conversions: 1520,
    cpa: 12.11,
    revenue: 114000,
    roas: 6.20,
    trend: '+18.4%',
    status: 'SCALING'
  },
  {
    id: 'cc-2',
    channel: 'Google Ads',
    source: 'google',
    medium: 'cpc',
    campaignName: 'PMax_Ecomm_Scale_Tier1',
    spend: 19800,
    impressions: 620000,
    clicks: 27900,
    ctr: 4.50,
    conversions: 890,
    cpa: 22.25,
    revenue: 84600,
    roas: 4.27,
    trend: '+8.1%',
    status: 'OPTIMAL'
  },
  {
    id: 'cc-3',
    channel: 'Meta Ads',
    source: 'instagram',
    medium: 'paid_social',
    campaignName: 'IG_Retargeting_Enterprise_LTV',
    spend: 14200,
    impressions: 390000,
    clicks: 16380,
    ctr: 4.20,
    conversions: 540,
    cpa: 26.30,
    revenue: 72900,
    roas: 5.13,
    trend: '+12.5%',
    status: 'SCALING'
  },
  {
    id: 'cc-4',
    channel: 'Meta Ads',
    source: 'facebook',
    medium: 'paid_social',
    campaignName: 'FB_Lookalike_CustomerVault_Top1Pct',
    spend: 15250,
    impressions: 410000,
    clicks: 14760,
    ctr: 3.60,
    conversions: 460,
    cpa: 33.15,
    revenue: 62500,
    roas: 4.10,
    trend: '+4.2%',
    status: 'OPTIMAL'
  },
  {
    id: 'cc-5',
    channel: 'LinkedIn Ads',
    source: 'linkedin',
    medium: 'sponsored',
    campaignName: 'LinkedIn_ABM_CTO_VP_Growth',
    spend: 11600,
    impressions: 184000,
    clicks: 4416,
    ctr: 2.40,
    conversions: 188,
    cpa: 61.70,
    revenue: 44080,
    roas: 3.80,
    trend: '-2.1%',
    status: 'OPTIMAL'
  },
  {
    id: 'cc-6',
    channel: 'Organic Search',
    source: 'google-organic',
    medium: 'organic',
    campaignName: 'SEO_Cluster_GrowthOS_Pillar',
    spend: 2800, // allocated creation cost
    impressions: 740000,
    clicks: 45880,
    ctr: 6.20,
    conversions: 780,
    cpa: 3.59,
    revenue: 58500,
    roas: 20.89,
    trend: '+34.2%',
    status: 'SCALING'
  },
  {
    id: 'cc-7',
    channel: 'Email Marketing',
    source: 'hubspot',
    medium: 'email',
    campaignName: 'Nurture_Workflow_LeadScore_High',
    spend: 1200,
    impressions: 42000,
    clicks: 8820,
    ctr: 21.00,
    conversions: 310,
    cpa: 3.87,
    revenue: 29450,
    roas: 24.54,
    trend: '+15.8%',
    status: 'SCALING'
  },
  {
    id: 'cc-8',
    channel: 'Partner & Referral',
    source: 'partner',
    medium: 'referral',
    campaignName: 'Affiliate_CFO_Network_Incentive',
    spend: 1000,
    impressions: 18000,
    clicks: 2160,
    ctr: 12.00,
    conversions: 94,
    cpa: 10.64,
    revenue: 14750,
    roas: 14.75,
    trend: '+6.3%',
    status: 'OPTIMAL'
  }
];

// ----------------------------------------------------------------------
// DEMOGRAPHICS DATASET
// ----------------------------------------------------------------------
export const DEMOGRAPHICS_AGE_DATA: AgeSegment[] = [
  { range: '18–24', shareOfConversions: 6.5, users: 3420, aov: 185, cac: 34.20, roas: 3.20 },
  { range: '25–34', shareOfConversions: 44.8, users: 23520, aov: 340, cac: 19.80, roas: 5.60 },
  { range: '35–44', shareOfConversions: 33.2, users: 17430, aov: 460, cac: 23.40, roas: 5.10 },
  { range: '45–54', shareOfConversions: 12.1, users: 6350, aov: 520, cac: 31.80, roas: 4.15 },
  { range: '55+', shareOfConversions: 3.4, users: 1780, aov: 610, cac: 42.10, roas: 3.40 }
];

export const DEMOGRAPHICS_GENDER_DATA: GenderSegment[] = [
  { gender: 'Male Decision-Makers', percentage: 56.4, conversions: 2690, revShare: 58.2 },
  { gender: 'Female Decision-Makers', percentage: 38.2, conversions: 1822, revShare: 37.4 },
  { gender: 'Enterprise Buying Committee', percentage: 5.4, conversions: 258, revShare: 4.4 }
];

export const DEMOGRAPHICS_GEOMETRO_DATA: GeoMetroSegment[] = [
  { id: 'geo-1', metro: 'San Francisco Bay Area', region: 'California', country: 'United States', flag: '🇺🇸', conversions: 1140, revenue: 102600, roas: 5.40, cpa: 18.20 },
  { id: 'geo-2', metro: 'New York Metro Area', region: 'New York', country: 'United States', flag: '🇺🇸', conversions: 980, revenue: 89180, roas: 5.15, cpa: 21.40 },
  { id: 'geo-3', metro: 'Austin / Central Texas', region: 'Texas', country: 'United States', flag: '🇺🇸', conversions: 620, revenue: 53320, roas: 4.90, cpa: 22.10 },
  { id: 'geo-4', metro: 'Greater London', region: 'England', country: 'United Kingdom', flag: '🇬🇧', conversions: 490, revenue: 44100, roas: 4.60, cpa: 24.80 },
  { id: 'geo-5', metro: 'Toronto Metro', region: 'Ontario', country: 'Canada', flag: '🇨🇦', conversions: 380, revenue: 32680, roas: 4.40, cpa: 25.30 },
  { id: 'geo-6', metro: 'Berlin / Brandenburg', region: 'Berlin', country: 'Germany', flag: '🇩🇪', conversions: 310, revenue: 27900, roas: 4.25, cpa: 26.50 },
  { id: 'geo-7', metro: 'Sydney Metropolitan', region: 'NSW', country: 'Australia', flag: '🇦🇺', conversions: 260, revenue: 23400, roas: 4.10, cpa: 27.20 }
];

export const DEMOGRAPHICS_DEVICE_DATA: DeviceSegment[] = [
  { platform: 'macOS (Desktop Safari/Chrome)', share: 46.2, convRate: 6.8, roas: 5.60, deviceType: 'Desktop' },
  { platform: 'iOS (iPhone Safari & Apps)', share: 29.5, convRate: 4.4, roas: 4.45, deviceType: 'Mobile' },
  { platform: 'Windows (Desktop Chrome/Edge)', share: 18.1, convRate: 5.2, roas: 4.90, deviceType: 'Desktop' },
  { platform: 'Android (Chrome Mobile)', share: 6.2, convRate: 3.1, roas: 3.40, deviceType: 'Mobile' }
];

// ----------------------------------------------------------------------
// PSYCHOGRAPHICS & ICP PERSONA DATASET
// ----------------------------------------------------------------------
export const PSYCHOGRAPHICS_PERSONAS: PersonaProfile[] = [
  {
    id: 'persona-1',
    name: 'The Quant Architect',
    role: 'VP of Growth & Data Infrastructure',
    subtitle: 'High analytical rigor • Skeptical of agency fluff • Model-driven',
    shareOfLeads: 38,
    primaryMotivation: 'Unify siloed performance data and remove multi-touch attribution uncertainty across channels without hiring 5 analysts.',
    corePainPoint: 'Disjointed reporting between HubSpot, Meta Ads, and GA4 resulting in inaccurate CAC/ROAS estimates and delayed board updates.',
    techAdoption: 'Early Adopter',
    buyingTrigger: 'Interactive demo proving automated data flow from APIs into the relational Second Brain schema.',
    projectedLtv: 78000,
    salesVelocityDays: 14,
    channelAffinity: ['Google Search (High Intent)', 'LinkedIn Thought Leadership', 'Technical Whitepapers'],
    objectionVector: 'Requires validation of strict read/write vault partitioning and API rate limits.',
    sentimentScore: 94
  },
  {
    id: 'persona-2',
    name: 'The Lean Scaler',
    role: 'Founder & CEO (Series A - B)',
    subtitle: 'Speed obsessed • High capital efficiency • Headcount averse',
    shareOfLeads: 31,
    primaryMotivation: 'Scale from $2M to $10M ARR without adding agency retainer costs or massive internal marketing departments.',
    corePainPoint: 'Paying $15k/month to traditional agencies with 7-day turnaround for basic creative variations and ad pacing adjustments.',
    techAdoption: 'Innovator',
    buyingTrigger: 'Review of the 90-Day Diagnostic Audit demonstrating automated agentic execution (Aurora-01 and Helios-04).',
    projectedLtv: 48000,
    salesVelocityDays: 9,
    channelAffinity: ['Instagram Retargeting', 'Direct Referral Networks', 'Executive Briefings'],
    objectionVector: 'Concerns regarding brand voice preservation and destructive actions (mitigated by HITL queue).',
    sentimentScore: 96
  },
  {
    id: 'persona-3',
    name: 'The Strategic Vanguard',
    role: 'Enterprise Chief Marketing Officer',
    subtitle: 'Governance minded • Board-level visibility • Risk-mitigated',
    shareOfLeads: 21,
    primaryMotivation: 'Deploy AI-native marketing infrastructure with verifiable enterprise governance, SOC-2 alignment, and auditable approvals.',
    corePainPoint: 'Rogue team members prompting consumer AI tools with unencrypted proprietary IP, customer records, and credentials.',
    techAdoption: 'Pragmatist',
    buyingTrigger: 'Demonstration of scoped RBAC matrix, Executive Vault encryption, and exportable audit trail logs.',
    projectedLtv: 142000,
    salesVelocityDays: 32,
    channelAffinity: ['LinkedIn ABM Campaigns', 'Industry Keynotes', 'Peer Referrals'],
    objectionVector: 'Requires formal security review of HMAC authentication and pgvector isolation.',
    sentimentScore: 89
  },
  {
    id: 'persona-4',
    name: 'The Authority Specialist',
    role: 'Head of Content & SEO Strategy',
    subtitle: 'Semantic mastery • Knowledge moat builder • Long-term compounder',
    shareOfLeads: 10,
    primaryMotivation: 'Build an unassailable organic search footprint and win citations across next-generation AI answer engines (Perplexity, ChatGPT).',
    corePainPoint: 'Keyword cannibalization, shallow AI content penalties, and manual topical mapping across hundreds of cluster pages.',
    techAdoption: 'Early Adopter',
    buyingTrigger: 'Inspection of Authority Vault topical clusters and autonomous backlink relevance matrices.',
    projectedLtv: 38000,
    salesVelocityDays: 18,
    channelAffinity: ['Organic Search Pillars', 'Interactive Tools', 'Developer Docs'],
    objectionVector: 'Needs reassurance that content generation is grounded in the Brand Vault tone vectors.',
    sentimentScore: 92
  }
];

export const PSYCHOGRAPHICS_INTENT_TIERS: IntentTier[] = [
  {
    tier: 'Tier 1: Active In-Market / Ready to Transact',
    percentage: 42,
    description: 'Actively searching for Growth OS / Autonomous Agency solutions with approved capital budget.',
    avgDealSize: 64000,
    conversionRate: 8.4
  },
  {
    tier: 'Tier 2: Solution Evaluator / Shortlisting',
    percentage: 36,
    description: 'Comparing Sigma Tactix architecture against legacy agencies and point solutions (TripleWhale, Northbeam).',
    avgDealSize: 46000,
    conversionRate: 4.8
  },
  {
    tier: 'Tier 3: Problem Aware / Diagnostic Seeking',
    percentage: 22,
    description: 'Experiencing CAC inflation and attribution fog; requested 90-day diagnostic audit.',
    avgDealSize: 32000,
    conversionRate: 2.9
  }
];

export const PSYCHOGRAPHICS_BEHAVIORAL_CLUSTERS: BehavioralCluster[] = [
  {
    cluster: 'Architecture Deep-Divers',
    count: 1420,
    conversionLikelihood: 'Very High',
    description: 'Users who inspect the Second Brain schema, RBAC tables, and pgvector settings in the cockpit.',
    topAction: 'Requests technical onboarding demo'
  },
  {
    cluster: 'Diagnostic Benchmark Testers',
    count: 2840,
    conversionLikelihood: 'High',
    description: 'Prospects who run complete audits and review high-severity UX/CRO heuristic friction points.',
    topAction: 'Generates 90-Day Growth Roadmap'
  },
  {
    cluster: 'ROAS Simulator Experimenters',
    count: 3650,
    conversionLikelihood: 'High',
    description: 'Leads who adjust target ROAS and budget allocation parameters in campaign planning.',
    topAction: 'Exports Executive Summary PDF'
  },
  {
    cluster: 'Passive Content Readers',
    count: 8120,
    conversionLikelihood: 'Moderate',
    description: 'Visitors browsing topical blog clusters and high-level marketing overview summaries.',
    topAction: 'Subscribes to weekly intelligence brief'
  }
];

// ----------------------------------------------------------------------
// CHART TIMELINE SERIES DATA (Aligned Charts)
// ----------------------------------------------------------------------
export const REVENUE_TIMELINE_SERIES = [
  { date: 'Oct 01', revenue: 10400, adSpend: 2400, roas: 4.33, blendedCac: 26.2 },
  { date: 'Oct 05', revenue: 12200, adSpend: 2650, roas: 4.60, blendedCac: 25.1 },
  { date: 'Oct 10', revenue: 13800, adSpend: 2900, roas: 4.75, blendedCac: 24.8 },
  { date: 'Oct 15', revenue: 16400, adSpend: 3200, roas: 5.12, blendedCac: 23.9 },
  { date: 'Oct 20', revenue: 15900, adSpend: 3100, roas: 5.12, blendedCac: 24.0 },
  { date: 'Oct 25', revenue: 18200, adSpend: 3450, roas: 5.27, blendedCac: 22.8 },
  { date: 'Oct 30', revenue: 21400, adSpend: 3800, roas: 5.63, blendedCac: 21.5 },
  { date: 'Nov 05', revenue: 20100, adSpend: 3700, roas: 5.43, blendedCac: 22.4 },
  { date: 'Nov 10', revenue: 23600, adSpend: 4100, roas: 5.75, blendedCac: 20.9 },
  { date: 'Nov 15', revenue: 26800, adSpend: 4500, roas: 5.95, blendedCac: 19.8 },
  { date: 'Nov 20', revenue: 25400, adSpend: 4350, roas: 5.83, blendedCac: 20.2 },
  { date: 'Nov 25', revenue: 28900, adSpend: 4800, roas: 6.02, blendedCac: 19.1 },
  { date: 'Nov 30', revenue: 31200, adSpend: 5100, roas: 6.11, blendedCac: 18.5 }
];

export const CHANNEL_SHARE_DONUT_DATA = [
  { name: 'Google Search & PMax', value: 38200, fill: '#f59e0b', share: '45.3%' },
  { name: 'Meta Ads (IG & FB)', value: 29450, fill: '#06b6d4', share: '34.9%' },
  { name: 'LinkedIn Sponsored', value: 11600, fill: '#3b82f6', share: '13.8%' },
  { name: 'Organic & Search Console', value: 2800, fill: '#10b981', share: '3.3%' },
  { name: 'Email & Partnerships', value: 2200, fill: '#8b5cf6', share: '2.7%' }
];
