export interface IndustryChannelBenchmark {
  name: string;
  channelType: string;
  benchmarkCpc: string;
  benchmarkCvr: string;
  benchmarkCpa: string;
  benchmarkRoas: string;
  shareOfBudget: string;
  status: 'ACTIVE' | 'SCALING' | 'OPTIMAL';
  color: string;
}

export interface IndustryReportFormat {
  id: string;
  name: string;
  description: string;
  targetIcp: string;
  metrics: {
    primaryKpiName: string;
    primaryKpiValue: string;
    secondaryKpiName: string;
    secondaryKpiValue: string;
    cacBenchmark: string;
    roasBenchmark: string;
    conversionRate: number;
    spendBenchmark: number;
  };
  channels: IndustryChannelBenchmark[];
  chartData: { name: string; value: number }[];
}

export const INDUSTRY_REPORT_FORMATS: IndustryReportFormat[] = [
  {
    id: 'b2b_saas',
    name: 'B2B Enterprise SaaS',
    description: 'Pipeline velocity, ARR expansion, CAC payback, and high-intent ABM metrics.',
    targetIcp: 'Enterprise & Mid-Market Software (ACV $25k - $120k)',
    metrics: {
      primaryKpiName: 'ARR Run-Rate',
      primaryKpiValue: '$2.45M',
      secondaryKpiName: 'LTV : CAC Ratio',
      secondaryKpiValue: '4.8x',
      cacBenchmark: '$1,420',
      roasBenchmark: '5.2x',
      conversionRate: 4.85,
      spendBenchmark: 18500
    },
    channels: [
      { name: 'LinkedIn ABM & Thought Leadership', channelType: 'Paid Social', benchmarkCpc: '$7.80', benchmarkCvr: '4.2%', benchmarkCpa: '$185', benchmarkRoas: '5.4x', shareOfBudget: '42%', status: 'SCALING', color: '#0A66C2' },
      { name: 'Google High-Intent Search RSA', channelType: 'Search RSA', benchmarkCpc: '$5.40', benchmarkCvr: '5.8%', benchmarkCpa: '$93', benchmarkRoas: '6.2x', shareOfBudget: '35%', status: 'OPTIMAL', color: '#4285F4' },
      { name: 'Cold Outreach & Lead Enrichment', channelType: 'Outbound', benchmarkCpc: 'N/A', benchmarkCvr: '8.4%', benchmarkCpa: '$210', benchmarkRoas: '4.5x', shareOfBudget: '15%', status: 'ACTIVE', color: '#F97316' },
      { name: 'SEO & Organic Authority', channelType: 'Organic / AEO', benchmarkCpc: '$0.00', benchmarkCvr: '6.1%', benchmarkCpa: '$0', benchmarkRoas: '∞', shareOfBudget: '8%', status: 'OPTIMAL', color: '#10B981' }
    ],
    chartData: [
      { name: 'Week 1', value: 4200 },
      { name: 'Week 2', value: 6800 },
      { name: 'Week 3', value: 9400 },
      { name: 'Week 4', value: 12600 },
      { name: 'Week 5', value: 15800 },
      { name: 'Week 6', value: 18500 }
    ]
  },
  {
    id: 'ecom_d2c',
    name: 'E-Commerce & D2C Brands',
    description: 'Blended ROAS, Marketing Efficiency Ratio (MER), AOV, and customer retention.',
    targetIcp: 'High-Growth Consumer & D2C Brands ($1M - $25M GMV)',
    metrics: {
      primaryKpiName: 'Marketing Efficiency Ratio (MER)',
      primaryKpiValue: '4.85x',
      secondaryKpiName: 'Average Order Value (AOV)',
      secondaryKpiValue: '$134.50',
      cacBenchmark: '$34.20',
      roasBenchmark: '4.1x',
      conversionRate: 3.65,
      spendBenchmark: 24500
    },
    channels: [
      { name: 'Meta Advantage+ Reels & Feed', channelType: 'Paid Social', benchmarkCpc: '$0.82', benchmarkCvr: '3.4%', benchmarkCpa: '$24.10', benchmarkRoas: '4.2x', shareOfBudget: '48%', status: 'SCALING', color: '#1877F2' },
      { name: 'Google Shopping & Performance Max', channelType: 'PMax', benchmarkCpc: '$0.95', benchmarkCvr: '4.1%', benchmarkCpa: '$23.20', benchmarkRoas: '4.6x', shareOfBudget: '32%', status: 'OPTIMAL', color: '#F59E0B' },
      { name: 'TikTok Creative Spark Ads', channelType: 'Short Video', benchmarkCpc: '$0.44', benchmarkCvr: '2.8%', benchmarkCpa: '$15.70', benchmarkRoas: '3.4x', shareOfBudget: '12%', status: 'ACTIVE', color: '#8B5CF6' },
      { name: 'Email & SMS Lifecycle (Klaviyo)', channelType: 'Retention', benchmarkCpc: '$0.02', benchmarkCvr: '12.4%', benchmarkCpa: '$1.80', benchmarkRoas: '16.5x', shareOfBudget: '8%', status: 'OPTIMAL', color: '#10B981' }
    ],
    chartData: [
      { name: 'Week 1', value: 6500 },
      { name: 'Week 2', value: 11200 },
      { name: 'Week 3', value: 15400 },
      { name: 'Week 4', value: 19800 },
      { name: 'Week 5', value: 22100 },
      { name: 'Week 6', value: 24500 }
    ]
  },
  {
    id: 'services_advisory',
    name: 'Professional & Advisory Services',
    description: 'Cost per qualified inbound consultation, pipeline deal velocity, and close rates.',
    targetIcp: 'Consultancies, Corporate Law, Financial Advisory & M&A Firms',
    metrics: {
      primaryKpiName: 'Pipeline Velocity',
      primaryKpiValue: '$480k/mo',
      secondaryKpiName: 'Consultation Booking Rate',
      secondaryKpiValue: '21.4%',
      cacBenchmark: '$210',
      roasBenchmark: '6.4x',
      conversionRate: 5.20,
      spendBenchmark: 12000
    },
    channels: [
      { name: 'Google High-Intent Advisory Search', channelType: 'Search RSA', benchmarkCpc: '$8.90', benchmarkCvr: '6.8%', benchmarkCpa: '$131', benchmarkRoas: '6.8x', shareOfBudget: '50%', status: 'OPTIMAL', color: '#4285F4' },
      { name: 'LinkedIn Thought Leader Ads', channelType: 'Paid Social', benchmarkCpc: '$6.50', benchmarkCvr: '4.9%', benchmarkCpa: '$132', benchmarkRoas: '5.8x', shareOfBudget: '30%', status: 'SCALING', color: '#0A66C2' },
      { name: 'Executive Whitepaper Teardowns', channelType: 'Inbound Content', benchmarkCpc: '$1.20', benchmarkCvr: '9.2%', benchmarkCpa: '$13', benchmarkRoas: '8.4x', shareOfBudget: '12%', status: 'OPTIMAL', color: '#6366F1' },
      { name: 'Direct Referral Partnerships', channelType: 'Partner Network', benchmarkCpc: '$0.00', benchmarkCvr: '32.0%', benchmarkCpa: '$0', benchmarkRoas: '∞', shareOfBudget: '8%', status: 'OPTIMAL', color: '#10B981' }
    ],
    chartData: [
      { name: 'Week 1', value: 2800 },
      { name: 'Week 2', value: 4900 },
      { name: 'Week 3', value: 7200 },
      { name: 'Week 4', value: 9100 },
      { name: 'Week 5', value: 10800 },
      { name: 'Week 6', value: 12000 }
    ]
  },
  {
    id: 'health_medtech',
    name: 'HealthTech & Healthcare Services',
    description: 'Patient/Client Acquisition Cost, consult booking compliance, and lifetime value.',
    targetIcp: 'Digital Health, Clinical Providers & HIPAA-Regulated MedTech',
    metrics: {
      primaryKpiName: 'Patient/Account LTV',
      primaryKpiValue: '$1,850',
      secondaryKpiName: 'HIPAA Compliance Score',
      secondaryKpiValue: '100%',
      cacBenchmark: '$78.50',
      roasBenchmark: '4.6x',
      conversionRate: 6.80,
      spendBenchmark: 15400
    },
    channels: [
      { name: 'Google Verified Healthcare Search', channelType: 'Search RSA', benchmarkCpc: '$4.10', benchmarkCvr: '7.8%', benchmarkCpa: '$52.50', benchmarkRoas: '5.2x', shareOfBudget: '55%', status: 'OPTIMAL', color: '#4285F4' },
      { name: 'Targeted Clinical Display Networks', channelType: 'Display', benchmarkCpc: '$1.40', benchmarkCvr: '2.6%', benchmarkCpa: '$53.80', benchmarkRoas: '3.6x', shareOfBudget: '25%', status: 'ACTIVE', color: '#0EA5E9' },
      { name: 'Medical Directory Citations & AEO', channelType: 'AEO / Local', benchmarkCpc: '$0.00', benchmarkCvr: '14.2%', benchmarkCpa: '$0', benchmarkRoas: '∞', shareOfBudget: '12%', status: 'OPTIMAL', color: '#10B981' },
      { name: 'Patient Education Email Series', channelType: 'Email', benchmarkCpc: '$0.01', benchmarkCvr: '18.4%', benchmarkCpa: '$0.50', benchmarkRoas: '12.0x', shareOfBudget: '8%', status: 'OPTIMAL', color: '#8B5CF6' }
    ],
    chartData: [
      { name: 'Week 1', value: 3400 },
      { name: 'Week 2', value: 5900 },
      { name: 'Week 3', value: 8700 },
      { name: 'Week 4', value: 11400 },
      { name: 'Week 5', value: 13800 },
      { name: 'Week 6', value: 15400 }
    ]
  },
  {
    id: 'fintech_finance',
    name: 'FinTech & Financial Services',
    description: 'Cost per funded account, KYC verification rates, and payback velocity.',
    targetIcp: 'Neobanks, WealthTech, Payment Infrastructure & FinTech APIs',
    metrics: {
      primaryKpiName: 'Cost Per Funded Account',
      primaryKpiValue: '$62.40',
      secondaryKpiName: 'KYC Verification Rate',
      secondaryKpiValue: '84.2%',
      cacBenchmark: '$92.00',
      roasBenchmark: '5.8x',
      conversionRate: 4.90,
      spendBenchmark: 21000
    },
    channels: [
      { name: 'Google High-Intent FinTech Search', channelType: 'Search RSA', benchmarkCpc: '$6.40', benchmarkCvr: '5.2%', benchmarkCpa: '$123', benchmarkRoas: '5.9x', shareOfBudget: '45%', status: 'OPTIMAL', color: '#4285F4' },
      { name: 'Financial Publisher Sponsorships', channelType: 'Programmatic', benchmarkCpc: '$3.80', benchmarkCvr: '3.4%', benchmarkCpa: '$111', benchmarkRoas: '4.8x', shareOfBudget: '30%', status: 'SCALING', color: '#10B981' },
      { name: 'LinkedIn FinTech Leader Posts', channelType: 'Paid Social', benchmarkCpc: '$7.10', benchmarkCvr: '4.1%', benchmarkCpa: '$173', benchmarkRoas: '5.1x', shareOfBudget: '15%', status: 'ACTIVE', color: '#0A66C2' },
      { name: 'Verified Referral Programs', channelType: 'Viral Engine', benchmarkCpc: '$0.50', benchmarkCvr: '24.0%', benchmarkCpa: '$2.10', benchmarkRoas: '14.2x', shareOfBudget: '10%', status: 'OPTIMAL', color: '#F59E0B' }
    ],
    chartData: [
      { name: 'Week 1', value: 4500 },
      { name: 'Week 2', value: 8200 },
      { name: 'Week 3', value: 12100 },
      { name: 'Week 4', value: 15800 },
      { name: 'Week 5', value: 18900 },
      { name: 'Week 6', value: 21000 }
    ]
  }
];

export type ReportColorProfile = 'amber' | 'indigo' | 'emerald';

export const COLOR_PROFILES: Record<ReportColorProfile, {
  id: ReportColorProfile;
  name: string;
  badge: string;
  accentText: string;
  accentBorder: string;
  accentBgSubtle: string;
  chartStroke: string;
  chartGradientStop1: string;
  dotClass: string;
  themeBadgeClass: string;
  cardBg: string;
  cardBorder: string;
  cardLeftBorder: string;
  kpiValue: string;
  tableHeaderBg: string;
  barFill: string;
  signalDot: string;
}> = {
  amber: {
    id: 'amber',
    name: 'Executive Amber & Slate',
    badge: 'Amber',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-400/30',
    accentBgSubtle: 'bg-amber-400/10',
    chartStroke: '#F59E0B',
    chartGradientStop1: '#F59E0B',
    dotClass: 'bg-amber-400',
    themeBadgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
    cardBg: 'bg-gradient-to-br from-amber-950/20 to-transparent',
    cardBorder: 'border-amber-500/15',
    cardLeftBorder: 'border-l-amber-400',
    kpiValue: 'text-amber-300',
    tableHeaderBg: 'bg-amber-950/30',
    barFill: 'bg-amber-400/40',
    signalDot: 'bg-amber-400'
  },
  indigo: {
    id: 'indigo',
    name: 'Modern Royal Indigo',
    badge: 'Indigo',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-400/30',
    accentBgSubtle: 'bg-sky-400/10',
    chartStroke: '#38BDF8',
    chartGradientStop1: '#38BDF8',
    dotClass: 'bg-sky-400',
    themeBadgeClass: 'bg-sky-500/15 border-sky-500/40 text-sky-400',
    cardBg: 'bg-gradient-to-br from-indigo-950/25 to-transparent',
    cardBorder: 'border-sky-500/15',
    cardLeftBorder: 'border-l-sky-400',
    kpiValue: 'text-sky-300',
    tableHeaderBg: 'bg-indigo-950/30',
    barFill: 'bg-sky-400/40',
    signalDot: 'bg-sky-400'
  },
  emerald: {
    id: 'emerald',
    name: 'Minimal Monochrome & Emerald',
    badge: 'Emerald',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-400/30',
    accentBgSubtle: 'bg-emerald-400/10',
    chartStroke: '#10B981',
    chartGradientStop1: '#10B981',
    dotClass: 'bg-emerald-400',
    themeBadgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    cardBg: 'bg-gradient-to-br from-emerald-950/20 to-transparent',
    cardBorder: 'border-emerald-500/15',
    cardLeftBorder: 'border-l-emerald-400',
    kpiValue: 'text-emerald-300',
    tableHeaderBg: 'bg-emerald-950/30',
    barFill: 'bg-emerald-400/40',
    signalDot: 'bg-emerald-400'
  }
};
