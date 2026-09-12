export interface MediaPlanTemplate {
  id: string;
  industry: string;
  name: string;
  objective: string;
  flightDays: number;
  totalBudget: number;
  targetBlendedCac: number;
  targetBlendedRoas: number;
  channelMix: { channel: string; weight: number; color: string; cpa: string; roas: string }[];
  benchmarks: { avgCpc: string; avgCvr: string; avgCtr: string };
  deviceSplit: { desktop: number; mobile: number; tablet: number };
  rationale: string;
}

export const INDUSTRY_MEDIA_PLAN_TEMPLATES: MediaPlanTemplate[] = [
  {
    id: 'mpt-b2b-saas',
    industry: 'B2B Enterprise SaaS',
    name: 'B2B Enterprise Pipeline & SQL Expansion',
    objective: 'High-Intent Demo & Pipeline Acceleration',
    flightDays: 90,
    totalBudget: 45000,
    targetBlendedCac: 48,
    targetBlendedRoas: 4.8,
    channelMix: [
      { channel: 'LinkedIn Ads (ABM & Sponsored)', weight: 42, color: '#0A66C2', cpa: '$62', roas: '5.4x' },
      { channel: 'Google Search (High-Intent RSA)', weight: 33, color: '#4285F4', cpa: '$38', roas: '6.1x' },
      { channel: 'Meta Feed & Retargeting', weight: 15, color: '#1877F2', cpa: '$28', roas: '3.9x' },
      { channel: 'YouTube Technical Deep-Dives', weight: 10, color: '#FF0000', cpa: '$45', roas: '3.2x' }
    ],
    benchmarks: { avgCpc: '$3.40', avgCvr: '3.8%', avgCtr: '4.2%' },
    deviceSplit: { desktop: 62, mobile: 34, tablet: 4 },
    rationale: 'B2B SaaS conversion funnels are heavily desktop-led during business hours. High allocation to LinkedIn and Google Exact Match ensures low bounce and verified firmographics.'
  },
  {
    id: 'mpt-ecommerce',
    industry: 'E-Commerce & D2C Brands',
    name: 'Omnichannel Scale & DTC Acquisition',
    objective: 'Direct Revenue & First-Order Scale',
    flightDays: 60,
    totalBudget: 60000,
    targetBlendedCac: 26,
    targetBlendedRoas: 3.8,
    channelMix: [
      { channel: 'Meta Advantage+ & IG Reels', weight: 48, color: '#1877F2', cpa: '$22', roas: '4.1x' },
      { channel: 'Google Performance Max & Shopping', weight: 28, color: '#4285F4', cpa: '$24', roas: '4.4x' },
      { channel: 'TikTok Ads (Spark Ads)', weight: 16, color: '#000000', cpa: '$18', roas: '3.2x' },
      { channel: 'YouTube Shorts & Discovery', weight: 8, color: '#FF0000', cpa: '$30', roas: '2.8x' }
    ],
    benchmarks: { avgCpc: '$1.15', avgCvr: '3.2%', avgCtr: '2.4%' },
    deviceSplit: { desktop: 24, mobile: 72, tablet: 4 },
    rationale: 'DTC retail captures >70% of impulse and evaluation transactions on mobile. Visual-first discovery on Meta and TikTok delivers lower CPMs and viral creative velocity.'
  },
  {
    id: 'mpt-advisory',
    industry: 'Professional Advisory & Services',
    name: 'High-Ticket Client Acquisition & Retainers',
    objective: 'Executive Mandates & Partner Inquiries',
    flightDays: 90,
    totalBudget: 30000,
    targetBlendedCac: 125,
    targetBlendedRoas: 6.5,
    channelMix: [
      { channel: 'LinkedIn Thought Leader & InMail', weight: 52, color: '#0A66C2', cpa: '$140', roas: '7.2x' },
      { channel: 'Google Search (Exact High-Intent)', weight: 36, color: '#4285F4', cpa: '$95', roas: '6.8x' },
      { channel: 'Meta Retargeting (Brand Authority)', weight: 12, color: '#1877F2', cpa: '$55', roas: '4.0x' }
    ],
    benchmarks: { avgCpc: '$6.20', avgCvr: '5.1%', avgCtr: '3.6%' },
    deviceSplit: { desktop: 70, mobile: 26, tablet: 4 },
    rationale: 'Advisory buyers conduct extensive due diligence. High CVR on desktop during executive review sessions makes LinkedIn Thought Leader ads and Google Exact Search the highest ROI combination.'
  },
  {
    id: 'mpt-healthtech',
    industry: 'HealthTech & Digital Health',
    name: 'Clinical & Provider Adoption Engine',
    objective: 'Practitioner Onboarding & Institutional Demos',
    flightDays: 90,
    totalBudget: 50000,
    targetBlendedCac: 68,
    targetBlendedRoas: 4.4,
    channelMix: [
      { channel: 'Google Search (Condition & Solution)', weight: 44, color: '#4285F4', cpa: '$52', roas: '5.2x' },
      { channel: 'LinkedIn Clinical Director ABM', weight: 28, color: '#0A66C2', cpa: '$85', roas: '4.8x' },
      { channel: 'Meta Feed (Patient & Provider Proof)', weight: 18, color: '#1877F2', cpa: '$34', roas: '3.6x' },
      { channel: 'YouTube Case Studies', weight: 10, color: '#FF0000', cpa: '$42', roas: '3.0x' }
    ],
    benchmarks: { avgCpc: '$4.10', avgCvr: '4.0%', avgCtr: '3.1%' },
    deviceSplit: { desktop: 55, mobile: 40, tablet: 5 },
    rationale: 'HealthTech relies on high compliance trust and problem-specific keyword queries. Search captures acute intent while LinkedIn validates provider credentials.'
  },
  {
    id: 'mpt-fintech',
    industry: 'FinTech & Capital Infrastructure',
    name: 'High-LTV Account Funding & Institutional Scale',
    objective: 'Funded Accounts & Enterprise Contracts',
    flightDays: 90,
    totalBudget: 75000,
    targetBlendedCac: 82,
    targetBlendedRoas: 5.2,
    channelMix: [
      { channel: 'Google Search (Commercial Intent)', weight: 40, color: '#4285F4', cpa: '$70', roas: '6.0x' },
      { channel: 'LinkedIn Finance Leader ABM', weight: 30, color: '#0A66C2', cpa: '$110', roas: '5.5x' },
      { channel: 'Meta Video (Platform Security Demo)', weight: 20, color: '#1877F2', cpa: '$45', roas: '4.2x' },
      { channel: 'Affiliate & Financial Publishing', weight: 10, color: '#10B981', cpa: '$65', roas: '4.0x' }
    ],
    benchmarks: { avgCpc: '$5.50', avgCvr: '4.5%', avgCtr: '3.8%' },
    deviceSplit: { desktop: 58, mobile: 38, tablet: 4 },
    rationale: 'Capital decision makers require proof of regulatory compliance and institutional security. Search and LinkedIn dominate initial verification.'
  }
];
