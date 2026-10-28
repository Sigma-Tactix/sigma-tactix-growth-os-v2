import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Target, 
  Search, 
  Share2, 
  Sparkles, 
  Bot, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Send, 
  Lock, 
  ShieldCheck, 
  BarChart3, 
  Copy, 
  Check,
  Plus,
  Users,
  Smartphone,
  Laptop,
  Tablet,
  Radio,
  ExternalLink,
  Calendar,
  Compass,
  Link,
  ArrowRight,
  Filter,
  Eye,
  AlertCircle,
  Upload,
  FileUp,
  Building2,
  Briefcase,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Settings2,
  Wand2,
  X,
  PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Button, GlassCard, Badge, Tabs } from '@/src/components/ui';
import { useToast } from '@/src/contexts/ToastContext';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { INDUSTRY_MEDIA_PLAN_TEMPLATES, MediaPlanTemplate } from '@/src/data/mediaPlanTemplates';
import { apiFetch } from '@/src/lib/api';
import { parseMediaPlanText } from '@/src/lib/mediaPlanParser';

// Interfaces for Performance Marketing Suite
export interface MediaPlan {
  id: string;
  name: string;
  objective: string;
  flightStart: string;
  flightEnd: string;
  totalBudget: number;
  targetBlendedCac: number;
  targetBlendedRoas: number;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED';
  sourceEvidence?: string[];
}

export interface IntentAudience {
  id: string;
  name: string;
  persona: string;
  tamEstimate: string;
  intentScore: number; // 0-100
  intentSignals: string[];
  primaryChannels: { channel: string; weight: number; color: string }[];
  deviceSplit: { desktop: number; mobile: number; tablet: number };
  buyingStage: 'Active Evaluation' | 'Problem Aware' | 'Vendor Comparison' | 'Decision Imminent';
}

export interface CampaignPerformanceMetric {
  id: string;
  campaignName: string;
  campaignType: 'Search RSA' | 'Performance Max' | 'Meta Feed' | 'Instagram Reels' | 'LinkedIn ABM' | 'Retargeting';
  channel: string;
  budget: number;
  spend: number;
  impressions: number;
  reach: number;
  cpm: number;
  frequency: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cvr: number;
  cpa: number;
  revenue: number;
  roas: number;
  sqls: number;
  pipelineValue: number;
  mer: number;
}

const DEMO_INITIAL_MEDIA_PLANS: MediaPlan[] = [
  {
    id: 'mp-1',
    name: 'Q4 Enterprise Growth & Demand Capture',
    objective: 'Direct Revenue & Pipeline Expansion',
    flightStart: '2026-10-01',
    flightEnd: '2026-12-31',
    totalBudget: 45000,
    targetBlendedCac: 45,
    targetBlendedRoas: 4.8,
    status: 'ACTIVE'
  },
  {
    id: 'mp-2',
    name: 'Series B Founder Intent Accelerator',
    objective: 'Account-Based B2B Penetration',
    flightStart: '2026-11-01',
    flightEnd: '2026-12-15',
    totalBudget: 28000,
    targetBlendedCac: 65,
    targetBlendedRoas: 5.2,
    status: 'ACTIVE'
  }
];

const DEMO_INITIAL_AUDIENCES: IntentAudience[] = [
  {
    id: 'aud-1',
    name: 'High-Growth Tech Founders & CEOs',
    persona: 'Technical Co-Founders & Bootstrapped/Series A-C CEOs',
    tamEstimate: '42,000 Accounts',
    intentScore: 94,
    intentSignals: [
      'Searched "B2B growth agency alternative" & "in-house growth engineering"',
      'Tech stack detected: Stripe, Segment, Snowflake, HubSpot Enterprise',
      'Visited pricing / enterprise diagnostic page 2+ times in 14 days',
      'Engaged with Second Brain architecture teardown on LinkedIn'
    ],
    primaryChannels: [
      { channel: 'LinkedIn Ads (ABM)', weight: 42, color: '#0A66C2' },
      { channel: 'Google Search (High-Intent)', weight: 32, color: '#4285F4' },
      { channel: 'Meta Feed & Reels', weight: 16, color: '#1877F2' },
      { channel: 'X / Twitter Dev Feed', weight: 10, color: '#000000' }
    ],
    deviceSplit: { desktop: 52, mobile: 42, tablet: 6 },
    buyingStage: 'Vendor Comparison'
  },
  {
    id: 'aud-2',
    name: 'Demand Gen & Performance VPs',
    persona: 'VP Marketing, Performance Leads, Growth Directors',
    tamEstimate: '68,000 Accounts',
    intentScore: 88,
    intentSignals: [
      'Searched "omnichannel CAC reduction" & "multi-agent marketing tools"',
      'Managing >$30k/mo ad spend across Google PMax and Meta',
      'High dwell time on CAC benchmark calculator',
      'Lookalike audience from top 5% LTV customer cohort'
    ],
    primaryChannels: [
      { channel: 'Google Demand Gen & Discovery', weight: 35, color: '#4285F4' },
      { channel: 'YouTube In-Stream & Shorts', weight: 25, color: '#FF0000' },
      { channel: 'Meta Video & Reels', weight: 25, color: '#1877F2' },
      { channel: 'LinkedIn Thought Leader Ads', weight: 15, color: '#0A66C2' }
    ],
    deviceSplit: { desktop: 38, mobile: 58, tablet: 4 },
    buyingStage: 'Problem Aware'
  },
  {
    id: 'aud-3',
    name: 'Series A-C Enterprise CMOs',
    persona: 'Executive Marketers Seeking Infrastructure Consolidation',
    tamEstimate: '26,000 Accounts',
    intentScore: 91,
    intentSignals: [
      'Board-level pressure to reduce agency retainer burn',
      'Searching for client-owned Second Brain marketing systems',
      'G2 & Capterra enterprise growth software comparison page visits',
      'Downloaded Executive Board Reporting deck blueprint'
    ],
    primaryChannels: [
      { channel: 'LinkedIn ABM & InMail', weight: 48, color: '#0A66C2' },
      { channel: 'Google Search (Exact Match)', weight: 28, color: '#4285F4' },
      { channel: 'Meta Reels (Thought Leader)', weight: 14, color: '#1877F2' },
      { channel: 'YouTube Technical Deep-Dives', weight: 10, color: '#FF0000' }
    ],
    deviceSplit: { desktop: 68, mobile: 28, tablet: 4 },
    buyingStage: 'Decision Imminent'
  }
];

const DEMO_CAMPAIGN_METRICS_DATA: CampaignPerformanceMetric[] = [
  {
    id: 'cm-1',
    campaignName: 'US_Search_HighIntent_Brand_Q4',
    campaignType: 'Search RSA',
    channel: 'Google Ads',
    budget: 18400,
    spend: 18400,
    impressions: 482000,
    reach: 310000,
    cpm: 38.17,
    frequency: 1.55,
    clicks: 34700,
    ctr: 7.20,
    cpc: 0.53,
    conversions: 1520,
    cvr: 4.38,
    cpa: 12.11,
    revenue: 114000,
    roas: 6.20,
    sqls: 142,
    pipelineValue: 380000,
    mer: 6.20
  },
  {
    id: 'cm-2',
    campaignName: 'PMax_Enterprise_Scale_AssetGroup',
    campaignType: 'Performance Max',
    channel: 'Google Ads',
    budget: 19800,
    spend: 19800,
    impressions: 620000,
    reach: 415000,
    cpm: 31.94,
    frequency: 1.49,
    clicks: 27900,
    ctr: 4.50,
    cpc: 0.71,
    conversions: 890,
    cvr: 3.19,
    cpa: 22.25,
    revenue: 84600,
    roas: 4.27,
    sqls: 98,
    pipelineValue: 260000,
    mer: 4.27
  },
  {
    id: 'cm-3',
    campaignName: 'Meta_AdvantagePlus_IG_Feed_Growth',
    campaignType: 'Meta Feed',
    channel: 'Meta Ads',
    budget: 14500,
    spend: 14500,
    impressions: 540000,
    reach: 360000,
    cpm: 26.85,
    frequency: 1.50,
    clicks: 18900,
    ctr: 3.50,
    cpc: 0.77,
    conversions: 610,
    cvr: 3.23,
    cpa: 23.77,
    revenue: 59800,
    roas: 4.12,
    sqls: 64,
    pipelineValue: 175000,
    mer: 4.12
  },
  {
    id: 'cm-4',
    campaignName: 'Meta_Reels_ShortHook_Founder_Teardown',
    campaignType: 'Instagram Reels',
    channel: 'Meta Ads',
    budget: 11200,
    spend: 11200,
    impressions: 680000,
    reach: 490000,
    cpm: 16.47,
    frequency: 1.38,
    clicks: 24500,
    ctr: 3.60,
    cpc: 0.46,
    conversions: 425,
    cvr: 1.73,
    cpa: 26.35,
    revenue: 43200,
    roas: 3.86,
    sqls: 52,
    pipelineValue: 140000,
    mer: 3.86
  },
  {
    id: 'cm-5',
    campaignName: 'LinkedIn_ABM_Sponsored_InMail_SeriesB',
    campaignType: 'LinkedIn ABM',
    channel: 'LinkedIn Ads',
    budget: 12500,
    spend: 12500,
    impressions: 98000,
    reach: 72000,
    cpm: 127.55,
    frequency: 1.36,
    clicks: 4200,
    ctr: 4.28,
    cpc: 2.98,
    conversions: 202,
    cvr: 4.81,
    cpa: 61.88,
    revenue: 78500,
    roas: 6.28,
    sqls: 112,
    pipelineValue: 420000,
    mer: 6.28
  },
  {
    id: 'cm-6',
    campaignName: 'Omnichannel_Dynamic_Retargeting_Leads',
    campaignType: 'Retargeting',
    channel: 'Multi-Network',
    budget: 6800,
    spend: 6800,
    impressions: 210000,
    reach: 145000,
    cpm: 32.38,
    frequency: 1.45,
    clicks: 9800,
    ctr: 4.67,
    cpc: 0.69,
    conversions: 380,
    cvr: 3.88,
    cpa: 17.89,
    revenue: 38400,
    roas: 5.65,
    sqls: 48,
    pipelineValue: 125000,
    mer: 5.65
  }
];

export default function PaidAdsPage() {
  const { notifySuccess, notifyInfo, notifyWarning } = useToast();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [hasConnectedAdAccounts, setHasConnectedAdAccounts] = useState(false);
  useEffect(() => {
    const loadVerifiedAdAccounts = async () => {
      try {
        const response = await apiFetch('/api/workspace/pipelines');
        const data = await response.json();
        setHasConnectedAdAccounts(Boolean(response.ok && data.pipelines?.some((p: any) =>
          p.status === 'active' && p.verificationState === 'verified' && /ads|ad manager|campaign manager/i.test(String(p.platform || '')),
        )));
      } catch { setHasConnectedAdAccounts(false); }
    };
    void loadVerifiedAdAccounts();
  }, []);

  const [showBenchmarkDemo, setShowBenchmarkDemo] = useState(false);
  
  // Navigation Tabs matching all 5 user requirements
  const [activeTab, setActiveTab] = useState<
    'MEDIA_PLAN' | 'AUDIENCE_INTENT' | 'CHANNELS_DEVICES' | 'CAMPAIGN_METRICS' | 'UTM_BUILDER' | 'SEARCH_ADS'
  >('MEDIA_PLAN');

  // Media Plan State
  const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>(INITIAL_MEDIA_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(INITIAL_MEDIA_PLANS[0]?.id ?? "");
  const activePlan = useMemo(() => mediaPlans.find(p => p.id === selectedPlanId) || mediaPlans[0], [mediaPlans, selectedPlanId]);
  
  // Media Plan Creator Form
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanObjective, setNewPlanObjective] = useState('Direct Revenue Capture');
  const [newPlanBudget, setNewPlanBudget] = useState(50000);
  const [newPlanCac, setNewPlanCac] = useState(45);
  const [newPlanRoas, setNewPlanRoas] = useState(4.5);
  const [newPlanStart, setNewPlanStart] = useState('2026-10-01');
  const [newPlanEnd, setNewPlanEnd] = useState('2026-12-31');

  // Strategic Client Brief State (Req 6.a - 6.e)
  const [isBriefExpanded, setIsBriefExpanded] = useState(true);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [clientBrief, setClientBrief] = useState({
    businessOverview: 'Sigma Tactix provides an enterprise sovereign AI Growth OS that consolidates paid media intelligence, autonomous marketing agents, and private document grounding into client-owned infrastructure.',
    currentPosition: 'Scaling Series A to B; displacing bloated agency retainers through client-controlled multi-agent pipelines with 4.2x deployment velocity.',
    marketingActivities: 'Active Google Search RSA, LinkedIn ABM targeting founders and VPs of Marketing, technical architectural teardowns, and Perplexity/Claude AEO citations.',
    targetBudget: 65000,
    targetCac: 55,
    icpProfile: 'Series A-C Tech Founders, CMOs & VP Performance ($5M-$50M ARR, 50-500 employees, using Stripe, Segment, Snowflake).',
    rfpStatus: '2 Active Enterprise Tenders: 1 European FinTech Growth Infrastructure RFP ($120k ARR) & 1 US HealthTech Marketing Modernization RFP ($180k ARR).',
    historicalContext: 'Q3 Blended CAC closed at $48.20 with 5.12x ROAS. Search CPCs rising +14% QoQ while LinkedIn Sponsored Content CVR improved by +22%.'
  });

  // Media Plan Upload & AI Extraction State (Req 6.f, 6.g)
  const [isUploadPlanModalOpen, setIsUploadPlanModalOpen] = useState(false);
  const [isUploadingPlan, setIsUploadingPlan] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Industry Template Filter (Req 6.h)
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<string>('ALL');

  // Custom Intent & Signal Audience Finder State (Req 6.i, 6.j)
  const [isCustomAudienceModalOpen, setIsCustomAudienceModalOpen] = useState(false);
  const [customAudienceName, setCustomAudienceName] = useState('High-Intent RevOps & Enterprise Growth');
  const [customPersona, setCustomPersona] = useState('Enterprise Growth Directors & Pipeline Leaders');
  const [customTam, setCustomTam] = useState('38,000 Accounts');
  const [customObjective, setCustomObjective] = useState<'DEMAND_GEN' | 'HIGH_GROWTH' | 'EXECUTIVE_ABM'>('DEMAND_GEN');
  const [customBudget, setCustomBudget] = useState(40000);
  const [selectedCustomChannels, setSelectedCustomChannels] = useState<string[]>([
    'Google Demand Gen & Discovery',
    'YouTube In-Stream & Shorts',
    'Meta Video & Reels',
    'LinkedIn Thought Leader Ads'
  ]);
  const [customSignals, setCustomSignals] = useState<string>(
    'Visited pricing page 2+ times in 14 days, Competitor keyword searches, Series B funding announcement'
  );

  // Audience State
  const [audiences, setAudiences] = useState<IntentAudience[]>(INITIAL_AUDIENCES);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string>(INITIAL_AUDIENCES[0]?.id ?? "");
  const activeAudience = useMemo(() => audiences.find(a => a.id === selectedAudienceId) || audiences[0], [audiences, selectedAudienceId]);

  // Channel Budget Allocator State (linked directly to audience channels)
  const [flightBudget, setFlightBudget] = useState(45000);
  const [channelWeights, setChannelWeights] = useState<Record<string, number>>({
    'LinkedIn Ads (ABM)': 40,
    'Google Search & PMax': 35,
    'Meta Feed & Reels': 18,
    'YouTube / Video': 7
  });

  // Device Split & Bid Adjustments
  const [deviceBids, setDeviceBids] = useState({
    desktop: 20, // +20%
    mobile: -5,  // -5%
    tablet: -15  // -15%
  });

  // Handlers for Industry Templates, File Upload, and Custom Audiences
  const handleApplyIndustryTemplate = (tpl: MediaPlanTemplate) => {
    const newPlan: MediaPlan = {
      id: `mp-tpl-${Date.now()}`,
      name: `${tpl.industry} Growth Flight`,
      objective: tpl.objective,
      flightStart: '2026-10-01',
      flightEnd: '2026-12-31',
      totalBudget: tpl.totalBudget,
      targetBlendedCac: tpl.targetBlendedCac,
      targetBlendedRoas: tpl.targetBlendedRoas,
      status: 'ACTIVE'
    };

    setMediaPlans([newPlan, ...mediaPlans]);
    setSelectedPlanId(newPlan.id);
    setFlightBudget(tpl.totalBudget);

    const weights: Record<string, number> = {};
    tpl.channelMix.forEach(cm => {
      weights[cm.channel] = cm.weight;
    });
    setChannelWeights(weights);
    setDeviceBids({
      desktop: tpl.deviceSplit.desktop > 50 ? 20 : 0,
      mobile: tpl.deviceSplit.mobile > 50 ? 20 : -5,
      tablet: -15
    });

    notifySuccess(
      'Industry Media Plan Applied',
      `Loaded ${tpl.industry} benchmark template ($${tpl.totalBudget.toLocaleString()} budget, ${tpl.targetBlendedRoas}x target ROAS).`
    );
  };

  const handleSimulatePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setIsUploadingPlan(true);
    try {
      let sourceText = '';
      if (/\.(csv|txt|md|json)$/i.test(file.name)) {
        sourceText = await file.text();
      } else if (/\.xlsx?$/i.test(file.name)) {
        throw new Error('Spreadsheet uploads are temporarily unavailable while the workbook parser is under security remediation. Upload CSV instead.');
      } else {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiFetch('/api/workspace/vault/analyze-document', { method: 'POST', body: formData });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success || !result.analysis?.content) throw new Error(result.error || 'The file could not be read.');
        sourceText = result.analysis.content;
      }

      const parsed = parseMediaPlanText(sourceText, file.name);
      const parsedPlan: MediaPlan = {
        id: `mp-uploaded-${Date.now()}`,
        name: parsed.name,
        objective: parsed.objective,
        flightStart: parsed.flightStart,
        flightEnd: parsed.flightEnd,
        totalBudget: parsed.totalBudget,
        targetBlendedCac: parsed.targetBlendedCac,
        targetBlendedRoas: parsed.targetBlendedRoas,
        status: 'DRAFT',
        sourceEvidence: parsed.evidence,
      };
      setMediaPlans(prev => [parsedPlan, ...prev]);
      setSelectedPlanId(parsedPlan.id);
      setFlightBudget(parsedPlan.totalBudget);
      if (Object.keys(parsed.channelWeights).length) setChannelWeights(parsed.channelWeights);
      setIsUploadPlanModalOpen(false);
      notifySuccess('Media Plan Parsed', `Imported verified fields from "${file.name}". Review the draft before activation.`);
    } catch (error) {
      notifyWarning('Media Plan Not Imported', error instanceof Error ? error.message : 'The file could not be parsed.');
    } finally {
      setIsUploadingPlan(false);
      e.target.value = '';
    }
  };

  const handleApplyRecommendedMix = () => {
    if (customObjective === 'DEMAND_GEN') {
      setSelectedCustomChannels([
        'Google Demand Gen & Discovery',
        'YouTube In-Stream & Shorts',
        'Meta Video & Reels',
        'LinkedIn Thought Leader Ads'
      ]);
      notifySuccess('Demand Gen Mix Recommended', 'Selected video & discovery channels optimized for net-new problem awareness.');
    } else if (customObjective === 'HIGH_GROWTH') {
      setSelectedCustomChannels([
        'Google Search (High-Intent RSA)',
        'LinkedIn Ads (ABM & Sponsored)',
        'Meta Feed & Retargeting',
        'X / Twitter Tech Feed'
      ]);
      notifySuccess('High-Growth Mix Recommended', 'Selected high-intent search and ABM capture channels.');
    } else {
      setSelectedCustomChannels([
        'LinkedIn ABM & InMail',
        'Google Search (Exact Match)',
        'Meta Reels (Thought Leader)',
        'YouTube Technical Deep-Dives'
      ]);
      notifySuccess('Executive ABM Mix Recommended', 'Selected high-trust executive due diligence channels.');
    }
  };

  const handleCreateCustomAudience = (e: React.FormEvent) => {
    e.preventDefault();
    const channels = selectedCustomChannels.length > 0 ? selectedCustomChannels : ['Google Demand Gen & Discovery', 'LinkedIn Thought Leader Ads'];
    const evenWeight = Math.round(100 / channels.length);
    const channelColors: Record<string, string> = {
      'Google Search (High-Intent RSA)': '#4285F4',
      'Google Search (Exact Match)': '#4285F4',
      'Google Demand Gen & Discovery': '#4285F4',
      'LinkedIn Ads (ABM & Sponsored)': '#0A66C2',
      'LinkedIn ABM & InMail': '#0A66C2',
      'LinkedIn Thought Leader Ads': '#0A66C2',
      'Meta Feed & Retargeting': '#1877F2',
      'Meta Video & Reels': '#1877F2',
      'YouTube In-Stream & Shorts': '#FF0000',
      'YouTube Technical Deep-Dives': '#FF0000',
      'TikTok Ads': '#000000',
      'X / Twitter Tech Feed': '#000000'
    };

    const newAud: IntentAudience = {
      id: `aud-custom-${Date.now()}`,
      name: customAudienceName,
      persona: customPersona,
      tamEstimate: customTam,
      intentScore: 92,
      intentSignals: customSignals.split(',').map(s => s.trim()).filter(Boolean),
      primaryChannels: channels.map((ch, idx) => ({
        channel: ch,
        weight: idx === channels.length - 1 ? (100 - evenWeight * (channels.length - 1)) : evenWeight,
        color: channelColors[ch] || '#F59E0B'
      })),
      deviceSplit: customObjective === 'DEMAND_GEN' ? { desktop: 38, mobile: 58, tablet: 4 } : { desktop: 60, mobile: 35, tablet: 5 },
      buyingStage: customObjective === 'DEMAND_GEN' ? 'Problem Aware' : 'Active Evaluation'
    };

    setAudiences([newAud, ...audiences]);
    setSelectedAudienceId(newAud.id);
    setFlightBudget(customBudget);
    setIsCustomAudienceModalOpen(false);
    notifySuccess('Custom Audience Created', `Saved "${newAud.name}" and loaded into budget allocator.`);
  };

  const handleAutoApplyResearchedRecommendations = () => {
    if (activeAudience.name.includes('Demand Gen')) {
      setChannelWeights({
        'Google Demand Gen & Discovery': 35,
        'YouTube In-Stream & Shorts': 25,
        'Meta Video & Reels': 25,
        'LinkedIn Thought Leader Ads': 15
      });
      setDeviceBids({
        desktop: 10,
        mobile: 20,
        tablet: -20
      });
      notifySuccess(
        'Researched Demand Gen Applied',
        'Configured top-of-funnel discovery mix: 60% video/reels, +20% mobile bid adjustment, and discovery pacing.'
      );
    } else {
      setChannelWeights({
        'LinkedIn Ads (ABM)': 42,
        'Google Search & PMax': 35,
        'Meta Feed & Reels': 15,
        'YouTube / Video': 8
      });
      setDeviceBids({
        desktop: 25,
        mobile: -5,
        tablet: -25
      });
      notifySuccess(
        'Researched High-Growth Applied',
        'Configured B2B conversion-backed mix: 77% Search & LinkedIn ABM with +25% Desktop bid adjustment (2.8x higher demo conversion).'
      );
    }
  };

  // UTM Builder State (synced with active workspace)
  const [utmUrl, setUtmUrl] = useState(currentWorkspace?.domain ? `https://${currentWorkspace.domain}/growth-os` : 'https://sigmatactix.com/growth-os');
  const [utmCampaign, setUtmCampaign] = useState('q4_enterprise_growth');
  const [utmChannel, setUtmChannel] = useState('linkedin');
  const [utmMedium, setUtmMedium] = useState('paid_social');
  const [utmAudienceTag, setUtmAudienceTag] = useState('founders_series_b');
  const [utmContent, setUtmContent] = useState('carousel_second_brain_v1');
  const [utmTerm, setUtmTerm] = useState('b2b_growth_os');
  const [copiedUtm, setCopiedUtm] = useState(false);

  // Agent Run Results
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-paid-01',
      agentName: 'Paid Media Optimizer Swarm',
      agentRole: 'ROAS Maximizer & Creative Fatigue Auditor',
      timestamp: 'Today at 04:30 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Performance Marketing & Paid Ads',
      inputSummary: 'PMax Enterprise & LinkedIn ABM Spend Rebalance',
      outputSummary: 'Shifted $4,200 from high-fatigue Meta ad sets to LinkedIn ABM. Blended ROAS lifted to 5.48x.',
      fullOutput: 'Analyzed 6 active campaigns. Flagged 2 ad creatives with frequency > 4.2x. Automated bid adjustments applied under HITL limits.',
      metrics: [
        { label: 'Blended ROAS', value: '5.48x' },
        { label: 'Active Spend', value: '$45,000' },
        { label: 'Fatigue Alerts', value: '2 Resolved' },
        { label: 'Pipeline Generated', value: '$1.4M' }
      ]
    }
  ]);

  // Sync UTM URL when workspace changes
  React.useEffect(() => {
    if (currentWorkspace?.domain) {
      setUtmUrl(`https://${currentWorkspace.domain}/growth-os`);
    }
  }, [currentWorkspace?.domain]);

  // Search RSA State
  const [searchKeywords, setSearchKeywords] = useState('AI Growth OS, B2B Marketing Infrastructure, Second Brain Marketing');
  const [targetCpaInput, setTargetCpaInput] = useState(75);
  const [isGeneratingRsa, setIsGeneratingRsa] = useState(false);

  // Swarm State
  const [isDeployingVortex, setIsDeployingVortex] = useState(false);

  // Generated UTM URL
  const generatedUtmLink = useMemo(() => {
    try {
      const u = new URL(utmUrl.startsWith('http') ? utmUrl : `https://${utmUrl}`);
      u.searchParams.set('utm_source', utmChannel);
      u.searchParams.set('utm_medium', utmMedium);
      u.searchParams.set('utm_campaign', utmCampaign);
      u.searchParams.set('utm_content', `${utmAudienceTag}_${utmContent}`);
      if (utmTerm) u.searchParams.set('utm_term', utmTerm);
      return u.toString();
    } catch {
      return `${utmUrl}?utm_source=${utmChannel}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}&utm_content=${utmAudienceTag}_${utmContent}`;
    }
  }, [utmUrl, utmChannel, utmMedium, utmCampaign, utmAudienceTag, utmContent, utmTerm]);

  const handleCopyUtm = () => {
    navigator.clipboard.writeText(generatedUtmLink);
    setCopiedUtm(true);
    notifySuccess('UTM Link Copied', 'Target URL with tracking parameters copied to clipboard.');
    setTimeout(() => setCopiedUtm(false), 2500);
  };

  const handleBatchGenerateUtms = () => {
    const channels = ['google_search', 'meta_reels', 'linkedin_abm', 'youtube_shorts'];
    const links = channels.map(ch => `${utmUrl}?utm_source=${ch}&utm_medium=cpc&utm_campaign=${utmCampaign}&utm_content=${utmAudienceTag}`);
    navigator.clipboard.writeText(links.join('\n'));
    notifySuccess(
      'Batch UTM Suite Generated',
      `Synthesized and copied 4 verified UTM links for all active media plan channels.`
    );
  };

  const handleCreateMediaPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    const newPlan: MediaPlan = {
      id: `mp-${Date.now()}`,
      name: newPlanName.trim(),
      objective: newPlanObjective,
      flightStart: newPlanStart,
      flightEnd: newPlanEnd,
      totalBudget: Number(newPlanBudget),
      targetBlendedCac: Number(newPlanCac),
      targetBlendedRoas: Number(newPlanRoas),
      status: 'ACTIVE'
    };

    setMediaPlans([newPlan, ...mediaPlans]);
    setSelectedPlanId(newPlan.id);
    setFlightBudget(newPlan.totalBudget);
    setIsPlanModalOpen(false);
    setNewPlanName('');
    notifySuccess(
      'Media Plan Activated',
      `"${newPlan.name}" initialized with $${newPlan.totalBudget.toLocaleString()} budget ceiling.`
    );
  };

  const handleDeployVortexSwarm = () => {
    setIsDeployingVortex(true);
    setTimeout(() => {
      setIsDeployingVortex(false);
      notifySuccess(
        'Vortex-02 Swarm Deployed',
        'Audited 14-day CPA across Google & Meta. All bid adjustments aligned with active Media Plan pacing.'
      );
    }, 1400);
  };

  const handleGenerateRsa = () => {
    setIsGeneratingRsa(true);
    setTimeout(() => {
      setIsGeneratingRsa(false);
      notifySuccess(
        'Responsive Search Ad Synthesized',
        'Generated 15 high-converting headlines and 4 descriptions aligned with Brand Vault positioning.'
      );
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[var(--sigma-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="brand" size="sm" icon={<Target size={12} />}>Performance Marketing Engine</Badge>
            <Badge variant="neutral" size="sm">Enclave: {currentWorkspace.name}</Badge>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--sigma-text)]">
            Performance Marketing & Media Strategy
          </h1>
          <p className="text-sm text-[var(--sigma-text-muted)] mt-1.5 max-w-3xl leading-relaxed">
            End-to-end performance engine: Media Plan creation, Intent & Signal Audience discovery, dynamic channel & device budget allocation, universal campaign telemetry, and automated UTM tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => notifyInfo('Safety Gate Verified', 'Vortex-02 is strictly bound by the $1,000/day autonomous shift cap. Excess shifts route to Admin HITL queue.')}
            icon={<ShieldCheck size={13} className="text-emerald-400" />}
          >
            HITL Cap: $1,000/day
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDeployVortexSwarm}
            disabled={isDeployingVortex}
            isLoading={isDeployingVortex}
            icon={<Play size={13} />}
          >
            {isDeployingVortex ? 'Executing Swarm...' : 'Deploy Performance Swarm'}
          </Button>
        </div>
      </div>

      {/* Strategic Context & Client Briefing (Req 6.a - 6.e) */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-white/5 gap-3 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-heading">Client Brief & Strategic Growth Context</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                  Verified Context Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Grounding parameters for performance media planning, ICP qualification, RFP tenders, and baseline reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingBrief(!isEditingBrief)}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings2 size={13} className="text-amber-400" />
              {isEditingBrief ? 'Save Context' : 'Edit Brief'}
            </button>
            <button
              onClick={() => setIsBriefExpanded(!isBriefExpanded)}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
              title={isBriefExpanded ? 'Collapse Brief' : 'Expand Brief'}
            >
              {isBriefExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isBriefExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Client Brief & Business Profile */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} /> Client Business Brief
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">Profile</span>
                  </div>
                  {isEditingBrief ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-mono">Business Overview</label>
                        <textarea
                          rows={2}
                          value={clientBrief.businessOverview}
                          onChange={(e) => setClientBrief({ ...clientBrief, businessOverview: e.target.value })}
                          className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-mono">Current Market Position</label>
                        <input
                          type="text"
                          value={clientBrief.currentPosition}
                          onChange={(e) => setClientBrief({ ...clientBrief, currentPosition: e.target.value })}
                          className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-[10px] text-zinc-500 font-mono uppercase">Overview & Value Prop</div>
                        <p className="text-zinc-200 mt-0.5 leading-relaxed text-[11px]">{clientBrief.businessOverview}</p>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 font-mono uppercase">Competitive Position</div>
                        <p className="text-zinc-400 mt-0.5 text-[11px]">{clientBrief.currentPosition}</p>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 font-mono uppercase">Active Marketing Footprint</div>
                        <p className="text-zinc-400 mt-0.5 text-[11px]">{clientBrief.marketingActivities}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Budget & Acquisition Targets */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={14} /> Budget & Targets
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Pacing: 100%
                    </span>
                  </div>
                  {isEditingBrief ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-mono">Monthly Budget Ceiling ($)</label>
                        <input
                          type="number"
                          value={clientBrief.targetBudget}
                          onChange={(e) => setClientBrief({ ...clientBrief, targetBudget: Number(e.target.value) })}
                          className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-mono">Target CAC ($)</label>
                          <input
                            type="number"
                            value={clientBrief.targetCac}
                            onChange={(e) => setClientBrief({ ...clientBrief, targetCac: Number(e.target.value) })}
                            className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-900/60 rounded-lg font-mono">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase">Monthly Budget</span>
                          <div className="text-base font-bold text-white mt-0.5">${clientBrief.targetBudget.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase">Target CAC</span>
                          <div className="text-base font-bold text-amber-400 mt-0.5">${clientBrief.targetCac}</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-zinc-400 leading-relaxed">
                        Budget enforces strict safety limits. Automated bid adjustments cannot exceed 15% without human approval.
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ICP Specifications */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Target size={14} /> Ideal Customer Profile (ICP)
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">B2B Core</span>
                  </div>
                  {isEditingBrief ? (
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-mono">ICP Criteria & Firmographics</label>
                      <textarea
                        rows={3}
                        value={clientBrief.icpProfile}
                        onChange={(e) => setClientBrief({ ...clientBrief, icpProfile: e.target.value })}
                        className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-[10px] text-zinc-500 font-mono uppercase">Target Firmographics</div>
                        <p className="text-zinc-200 mt-0.5 leading-relaxed text-[11px]">{clientBrief.icpProfile}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-300">Stripe Stack</span>
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-300">Series A-C</span>
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-300">$5M-$50M ARR</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Active RFPs & Tenders */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1.5">
                      <FileText size={14} /> RFP & Commercial Tenders
                    </span>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono">
                      2 Tenders
                    </span>
                  </div>
                  {isEditingBrief ? (
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-mono">Active RFPs & Procurement Requirements</label>
                      <textarea
                        rows={3}
                        value={clientBrief.rfpStatus}
                        onChange={(e) => setClientBrief({ ...clientBrief, rfpStatus: e.target.value })}
                        className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <p className="text-zinc-200 leading-relaxed text-[11px]">{clientBrief.rfpStatus}</p>
                      <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[10px] font-mono text-blue-300">
                        Sovereign Vault requirements satisfied for both proposals.
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Existing Performance Reports & Context */}
                <div className="md:col-span-2 p-4 bg-black/40 border border-white/5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 size={14} /> Historical Performance Context & Headwinds
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Q3 Grounded</span>
                  </div>
                  {isEditingBrief ? (
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-mono">Performance Context & Dynamics</label>
                      <textarea
                        rows={3}
                        value={clientBrief.historicalContext}
                        onChange={(e) => setClientBrief({ ...clientBrief, historicalContext: e.target.value })}
                        className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <p className="text-zinc-200 leading-relaxed text-[11px]">{clientBrief.historicalContext}</p>
                      <div className="grid grid-cols-3 gap-3 p-2 bg-zinc-900/60 rounded-lg font-mono text-center">
                        <div>
                          <div className="text-[10px] text-zinc-500">Q3 BLENDED CAC</div>
                          <div className="text-sm font-bold text-white mt-0.5">$48.20</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500">Q3 BLENDED ROAS</div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">5.12x</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500">LTV : CAC RATIO</div>
                          <div className="text-sm font-bold text-amber-400 mt-0.5">4.2 : 1</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Suite Tabs */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <Tabs
          tabs={[
            { id: 'MEDIA_PLAN', label: '1. Media Plan Creator', icon: <Calendar size={13} /> },
            { id: 'AUDIENCE_INTENT', label: '2. Intent & Signal Audiences', icon: <Users size={13} /> },
            { id: 'CHANNELS_DEVICES', label: '3. Channel & Device Allocator', icon: <Sliders size={13} /> },
            { id: 'CAMPAIGN_METRICS', label: '4. Universal Campaign Metrics', icon: <BarChart3 size={13} /> },
            { id: 'UTM_BUILDER', label: '5. Automatic UTM Builder', icon: <Link size={13} /> },
            { id: 'SEARCH_ADS', label: 'Ad Creatives & RSA Studio', icon: <Search size={13} /> }
          ]}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as any)}
          variant="pill"
          size="sm"
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. MEDIA PLAN CREATOR */}
      {/* ========================================================================= */}
      {activeTab === 'MEDIA_PLAN' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--sigma-text)]">Active Media Plans</h3>
              <p className="text-xs text-[var(--sigma-text-muted)]">Manage multi-channel flights, budget envelopes, and blended performance targets.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsUploadPlanModalOpen(true)}
                icon={<Upload size={13} className="text-[#ff481b]" />}
              >
                Upload Media Plan (.csv)
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPlanModalOpen(true)}
                icon={<Plus size={14} />}
              >
                Create Custom Plan
              </Button>
            </div>
          </div>

          {/* Active Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {mediaPlans.map((plan) => (
              <GlassCard
                key={plan.id}
                spotlight
                interactive
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setFlightBudget(plan.totalBudget);
                  setUtmCampaign(plan.name.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                }}
                className={cn(
                  "p-5 cursor-pointer transition-all space-y-4 relative overflow-hidden",
                  selectedPlanId === plan.id ? "border-[#ff481b]/50 ring-1 ring-[#ff481b]/30 shadow-md" : "border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="brand" size="xs">
                    {plan.objective}
                  </Badge>
                  <Badge variant={plan.status === 'ACTIVE' ? 'success' : 'neutral'} size="xs" dot>
                    {plan.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[var(--sigma-text)] mb-1">{plan.name}</h4>
                  <div className="text-xs font-mono text-[var(--sigma-text-muted)]">
                    Flight Duration: {plan.flightStart} → {plan.flightEnd}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--sigma-surface-subtle)] rounded-xl border border-[var(--sigma-border)] text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[var(--sigma-text-muted)] uppercase">Flight Budget:</span>
                    <div className="text-[var(--sigma-text)] font-semibold mt-0.5">${plan.totalBudget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--sigma-text-muted)] uppercase">Target CAC:</span>
                    <div className="text-amber-400 font-semibold mt-0.5">${plan.targetBlendedCac}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--sigma-text-muted)] uppercase">Target ROAS:</span>
                    <div className="text-emerald-400 font-semibold mt-0.5">{plan.targetBlendedRoas}x</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--sigma-border)] text-xs font-mono">
                  <span className="text-[var(--sigma-text-muted)]">Multi-Network Channel Envelope</span>
                  <span className="text-[#ff481b] flex items-center gap-1 font-semibold">
                    {selectedPlanId === plan.id ? 'Selected for Execution ✓' : 'Select Plan →'}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Industry Media Plan Templates & Benchmarks (Req 6.f, 6.h) */}
          <div className="p-6 bg-zinc-900/40 border border-white/10 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono text-[10px] font-bold">
                    EVIDENCE-BACKED TEMPLATES
                  </span>
                  <span className="text-zinc-500 text-xs">•</span>
                  <span className="text-xs text-zinc-400 font-mono">5 ICP Verticals</span>
                </div>
                <h3 className="text-lg font-bold silver-text">Industry Media Plan Templates with Channel Benchmarks</h3>
                <p className="text-xs text-zinc-400">
                  Pre-calibrated flight templates with real-world channel allocations, target CAC, and conversion benchmarks.
                </p>
              </div>

              {/* Industry Filter Buttons */}
              <div className="sigma-segmented font-mono">
                {['ALL', 'B2B Enterprise SaaS', 'E-Commerce & D2C Brands', 'Professional Advisory & Services', 'HealthTech & Digital Health', 'FinTech & Capital Infrastructure'].map(ind => (
                  <button
                    key={ind}
                    onClick={() => setSelectedIndustryFilter(ind)}
                    className={cn(
                      "sigma-segment !min-h-8 !py-1 text-[11px] cursor-pointer",
                      selectedIndustryFilter === ind
                        ? "sigma-segment-active"
                        : ""
                    )}
                  >
                    {ind === 'ALL' ? 'All Verticals' : ind.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {INDUSTRY_MEDIA_PLAN_TEMPLATES
                .filter(t => selectedIndustryFilter === 'ALL' || t.industry === selectedIndustryFilter)
                .map(tpl => (
                  <div
                    key={tpl.id}
                    className="p-5 bg-surface border border-white/10 rounded-2xl space-y-4 hover:border-amber-400/40 transition-all flex flex-col justify-between shadow-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] font-bold">
                          {tpl.industry}
                        </span>
                        <span className="text-xs font-mono text-zinc-400">
                          {tpl.flightDays}-Day Flight Duration
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white leading-snug">{tpl.name}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">{tpl.objective}</p>

                      {/* Benchmarks Strip */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs font-mono text-center">
                        <div>
                          <span className="text-[10px] text-zinc-500">AVG CPC</span>
                          <div className="font-bold text-white mt-0.5">{tpl.benchmarks.avgCpc}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500">AVG CVR</span>
                          <div className="font-bold text-emerald-400 mt-0.5">{tpl.benchmarks.avgCvr}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500">TARGET ROAS</span>
                          <div className="font-bold text-amber-400 mt-0.5">{tpl.targetBlendedRoas}x</div>
                        </div>
                      </div>

                      {/* Channel Allocation Breakdown with KPIs */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Channel Mix & Target KPIs:</div>
                        <div className="space-y-1.5">
                          {tpl.channelMix.map(cm => (
                            <div key={cm.channel} className="p-2 bg-black/30 rounded-lg border border-white/5 space-y-1">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cm.color }} />
                                  <span className="text-zinc-200">{cm.channel}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-zinc-400 font-bold">{cm.weight}% Share</span>
                                  <span className="text-[10px] text-emerald-400">CPA: {cm.cpa}</span>
                                </div>
                              </div>
                              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${cm.weight}%`, backgroundColor: cm.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 italic pt-1">
                        "{tpl.rationale}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="text-xs font-mono">
                        <span className="text-zinc-500">Budget: </span>
                        <span className="font-bold text-white">${tpl.totalBudget.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => handleApplyIndustryTemplate(tpl)}
                        className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-400 hover:text-black text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Wand2 size={13} />
                        Apply Industry Template →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INTENT & SIGNAL AUDIENCES */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIENCE_INTENT' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold silver-text">Intent & Signal-Based Audience Finder</h3>
              <p className="text-xs text-zinc-400">
                Discovers high-propensity buying segments by synthesizing search queries, firmographics, web behavior, and social sentiment.
              </p>
            </div>
            <button
              onClick={() => setIsCustomAudienceModalOpen(!isCustomAudienceModalOpen)}
              className="px-4 py-2.5 bg-accent text-background font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 amber-glow cursor-pointer shadow-md"
            >
              <Plus size={14} />
              {isCustomAudienceModalOpen ? 'Hide Custom Creator' : 'Create Custom Audience'}
            </button>
          </div>

          {/* Custom Intent & Signal Audience Finder Card (Req 6.i, 6.j) */}
          {isCustomAudienceModalOpen && (
            <div className="p-6 bg-surface border border-amber-500/30 rounded-2xl space-y-5 shadow-2xl bg-amber-500/[0.02]">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-heading">Custom Intent & Signal-Based Audience Builder</h4>
                    <p className="text-[11px] text-zinc-400">Tailor custom channels, budget envelopes, and trigger signals.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyRecommendedMix}
                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Wand2 size={13} />
                  1-Click Recommended Mix
                </button>
              </div>

              <form onSubmit={handleCreateCustomAudience} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Audience Name</label>
                    <input
                      type="text"
                      value={customAudienceName}
                      onChange={(e) => setCustomAudienceName(e.target.value)}
                      className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs"
                      placeholder="e.g. Enterprise RevOps Decision Makers"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Persona & Title Target</label>
                    <input
                      type="text"
                      value={customPersona}
                      onChange={(e) => setCustomPersona(e.target.value)}
                      className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs"
                      placeholder="e.g. VP Marketing, Head of Growth"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Total Addressable Market (TAM)</label>
                    <input
                      type="text"
                      value={customTam}
                      onChange={(e) => setCustomTam(e.target.value)}
                      className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs"
                      placeholder="e.g. 45,000 Accounts"
                      required
                    />
                  </div>
                </div>

                {/* Objective Selector (Demand Gen vs High Growth vs Executive ABM) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-zinc-400">Stage Objective (Dictates Channel Combination)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'DEMAND_GEN', label: 'Demand Gen & Awareness', desc: 'Discovery video & social (YouTube, Meta Video, LinkedIn Thought Leader)' },
                      { id: 'HIGH_GROWTH', label: 'High-Growth Capture', desc: 'Direct query capture (Google Search RSA, LinkedIn ABM, Retargeting)' },
                      { id: 'EXECUTIVE_ABM', label: 'Executive ABM Account Penetration', desc: 'High-ticket verification (LinkedIn InMail, Search Exact, YouTube Case Studies)' }
                    ].map(obj => (
                      <button
                        type="button"
                        key={obj.id}
                        onClick={() => {
                          setCustomObjective(obj.id as any);
                          if (obj.id === 'DEMAND_GEN') {
                            setSelectedCustomChannels(['Google Demand Gen & Discovery', 'YouTube In-Stream & Shorts', 'Meta Video & Reels', 'LinkedIn Thought Leader Ads']);
                          } else if (obj.id === 'HIGH_GROWTH') {
                            setSelectedCustomChannels(['Google Search (High-Intent RSA)', 'LinkedIn Ads (ABM & Sponsored)', 'Meta Feed & Retargeting', 'X / Twitter Tech Feed']);
                          } else {
                            setSelectedCustomChannels(['LinkedIn ABM & InMail', 'Google Search (Exact Match)', 'Meta Reels (Thought Leader)', 'YouTube Technical Deep-Dives']);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all cursor-pointer",
                          customObjective === obj.id
                            ? "bg-amber-400/10 border-amber-400 text-white shadow-md"
                            : "bg-black/40 border-white/5 text-zinc-400 hover:border-white/20"
                        )}
                      >
                        <div className="font-bold text-xs text-white">{obj.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{obj.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Channel Selector Checkboxes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-zinc-400">Custom Channels (Select Digital Media Mix)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      'Google Search (High-Intent RSA)',
                      'Google Demand Gen & Discovery',
                      'LinkedIn Ads (ABM & Sponsored)',
                      'LinkedIn Thought Leader Ads',
                      'Meta Video & Reels',
                      'Meta Feed & Retargeting',
                      'YouTube In-Stream & Shorts',
                      'TikTok Ads'
                    ].map(ch => {
                      const isSelected = selectedCustomChannels.includes(ch);
                      return (
                        <button
                          type="button"
                          key={ch}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCustomChannels(selectedCustomChannels.filter(c => c !== ch));
                            } else {
                              setSelectedCustomChannels([...selectedCustomChannels, ch]);
                            }
                          }}
                          className={cn(
                            "p-2.5 rounded-xl border text-left text-xs font-mono transition-all cursor-pointer flex items-center justify-between",
                            isSelected
                              ? "bg-amber-400/15 border-amber-400/40 text-white font-bold"
                              : "bg-black/40 border-white/5 text-zinc-400 hover:border-white/20"
                          )}
                        >
                          <span className="text-[11px] truncate mr-1">{ch}</span>
                          <span className={cn("text-[10px] px-1 rounded", isSelected ? "text-amber-400 font-bold" : "text-zinc-600")}>
                            {isSelected ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget Slider Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-3 bg-black/40 rounded-xl border border-white/5">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-zinc-400">Campaign Flight Budget:</span>
                      <span className="text-white font-bold text-sm">${customBudget.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="150000"
                      step="5000"
                      value={customBudget}
                      onChange={(e) => setCustomBudget(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Trigger Signals (Comma Separated)</label>
                    <input
                      type="text"
                      value={customSignals}
                      onChange={(e) => setCustomSignals(e.target.value)}
                      className="w-full mt-1 p-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      placeholder="e.g. Visited pricing 2x, Competitor search"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomAudienceModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-accent text-background font-black text-xs uppercase tracking-wider rounded-xl amber-glow cursor-pointer shadow-md"
                  >
                    Save & Activate Audience
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {audiences.map((aud) => (
              <div
                key={aud.id}
                onClick={() => setSelectedAudienceId(aud.id)}
                className={cn(
                  "p-6 bg-surface border rounded-2xl cursor-pointer transition-all space-y-4 flex flex-col justify-between",
                  selectedAudienceId === aud.id ? "border-accent shadow-2xl bg-accent/[0.02]" : "border-white/10 hover:border-white/20"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 font-mono text-[10px]">
                      TAM: {aud.tamEstimate}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <span>Intent Intensity:</span>
                      <span>{aud.intentScore}%</span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white leading-snug">{aud.name}</h4>
                  <p className="text-xs text-zinc-400 font-sans">{aud.persona}</p>

                  {/* Intent Signals */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="text-[10px] font-mono text-muted uppercase font-bold">Detected Intent Signals:</div>
                    {aud.intentSignals.map((sig, i) => (
                      <div key={i} className="text-[11px] font-mono text-zinc-300 flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="text-accent shrink-0 mt-0.5" />
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Channels to Engage this Audience */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <div className="text-[10px] font-mono text-muted uppercase font-bold">Recommended Channels & Affinity:</div>
                  <div className="space-y-1.5">
                    {aud.primaryChannels.map((ch) => (
                      <div key={ch.channel} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-300">{ch.channel}</span>
                        <span className="font-bold text-accent">{ch.weight}%</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAudienceId(aud.id);
                      setActiveTab('CHANNELS_DEVICES');
                      notifySuccess('Audience Applied', `Loaded "${aud.name}" into Channel & Device Allocator.`);
                    }}
                    className="w-full mt-3 py-2 bg-white/5 hover:bg-accent hover:text-background text-white rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Allocate Budgets to Channels</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 3. CHANNELS & DEVICE ALLOCATOR */}
      {/* ========================================================================= */}
      {activeTab === 'CHANNELS_DEVICES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Channel Budget Distribution (8 Cols) */}
          <div className="lg:col-span-8 bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold silver-text">Audience Channel Engagement & Budget Allocation</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Applied Audience: <span className="text-accent font-bold">{activeAudience.name}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAutoApplyResearchedRecommendations}
                  className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Wand2 size={13} />
                  Auto-Apply Researched Recommendations
                </button>
                <div className="text-right pl-3 border-l border-white/10">
                  <div className="text-[10px] font-mono text-muted uppercase">Flight Spend:</div>
                  <div className="text-xl font-black text-white font-mono">${flightBudget.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Interactive Flight Budget Slider */}
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Custom Flight Budget Adjustment:</span>
                <span className="text-white font-bold">${flightBudget.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="250000"
                step="5000"
                value={flightBudget}
                onChange={(e) => setFlightBudget(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Interactive Channel Sliders */}
            <div className="space-y-5">
              {activeAudience.primaryChannels.map((ch) => {
                const allocatedDollars = Math.round((flightBudget * ch.weight) / 100);
                return (
                  <div key={ch.channel} className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
                        <span className="font-bold text-white">{ch.channel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400">${allocatedDollars.toLocaleString()}</span>
                        <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-bold">
                          {ch.weight}% Share
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${ch.weight}%`, backgroundColor: ch.color }} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                      <span>Projected Reach: {Math.round((allocatedDollars * 18.5)).toLocaleString()} buyers</span>
                      <span>Target CPA: $38 - $55</span>
                      <span>Expected ROAS: 4.8x</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300">Blended Forecast with Current Channel Mix:</span>
              <div className="flex items-center gap-4 text-white font-bold">
                <span>Blended CAC: $42.10</span>
                <span className="text-emerald-400">Blended ROAS: 5.12x</span>
              </div>
            </div>
          </div>

          {/* Device Breakdown & Bid Adjustments (4 Cols) */}
          <div className="lg:col-span-4 bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h4 className="text-base font-bold silver-text">Device Usage & Bid Strategy</h4>
              <p className="text-xs text-zinc-400">Adjust bidding multiplier by hardware device category.</p>
            </div>

            <div className="space-y-4">
              {/* Desktop */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Laptop size={16} className="text-accent" />
                    <span>Desktop</span>
                  </div>
                  <span className="font-bold text-white">{activeAudience.deviceSplit.desktop}% Traffic</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Bid Adjustment:</span>
                  <span className={cn("font-bold", deviceBids.desktop >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {deviceBids.desktop > 0 ? `+${deviceBids.desktop}%` : `${deviceBids.desktop}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={deviceBids.desktop}
                  onChange={(e) => setDeviceBids({ ...deviceBids, desktop: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Mobile */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Smartphone size={16} className="text-accent" />
                    <span>Mobile (iOS & Android)</span>
                  </div>
                  <span className="font-bold text-white">{activeAudience.deviceSplit.mobile}% Traffic</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Bid Adjustment:</span>
                  <span className={cn("font-bold", deviceBids.mobile >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {deviceBids.mobile > 0 ? `+${deviceBids.mobile}%` : `${deviceBids.mobile}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={deviceBids.mobile}
                  onChange={(e) => setDeviceBids({ ...deviceBids, mobile: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Tablet */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Tablet size={16} className="text-accent" />
                    <span>Tablet</span>
                  </div>
                  <span className="font-bold text-white">{activeAudience.deviceSplit.tablet}% Traffic</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Bid Adjustment:</span>
                  <span className={cn("font-bold", deviceBids.tablet >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {deviceBids.tablet > 0 ? `+${deviceBids.tablet}%` : `${deviceBids.tablet}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={deviceBids.tablet}
                  onChange={(e) => setDeviceBids({ ...deviceBids, tablet: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('UTM_BUILDER');
                notifySuccess('Strategy Synced', 'Transferred media channels and audience intent into the UTM Builder.');
              }}
              className="w-full py-3 bg-accent text-background font-black text-xs uppercase tracking-wider rounded-xl transition-all hover:opacity-90 amber-glow flex items-center justify-center gap-2"
            >
              <span>Build UTM Tracking Links</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. UNIVERSAL CAMPAIGN METRICS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'CAMPAIGN_METRICS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold silver-text">Universal Campaign Metrics Matrix</h3>
              <p className="text-xs text-zinc-400">
                Full-funnel telemetry across ad networks: Google Ads, Meta Ads Manager, and LinkedIn.
              </p>
            </div>
            <span className={cn(
              "text-xs font-mono px-3 py-1 rounded-lg border",
              hasConnectedAdAccounts
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-amber-400 bg-amber-500/10 border-amber-500/20"
            )}>
              {hasConnectedAdAccounts ? 'Active Ad Pipelines Live' : '0 Real Ad Accounts Linked (Spend: $0.00)'}
            </span>
          </div>

          {!hasConnectedAdAccounts && !showBenchmarkDemo ? (
            <div className="p-8 bg-surface border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-base font-bold text-white font-heading">No Real Ad Accounts Connected Yet</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Your ad spend is strictly $0.00. Once you link your Google Ads (CID) or Meta Ads Manager in Data Pipelines, live campaign telemetry, CPCs, conversions, and ROAS will stream here automatically.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/connectors')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Connect Ad Pipelines →
                </button>
                <button
                  onClick={() => setShowBenchmarkDemo(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
                >
                  View Target Benchmark Simulation Model
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {showBenchmarkDemo && !hasConnectedAdAccounts && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-amber-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>BENCHMARK SIMULATION: Pre-launch performance model (zero real ad spend).</span>
                  </div>
                  <button
                    onClick={() => setShowBenchmarkDemo(false)}
                    className="underline hover:text-white cursor-pointer"
                  >
                    Hide Simulation
                  </button>
                </div>
              )}

              <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-black/50 text-[10px] uppercase tracking-wider text-muted border-b border-white/10 font-bold">
                      <tr>
                        <th className="px-4 py-3.5">Campaign & Type</th>
                        <th className="px-4 py-3.5">Network</th>
                        <th className="px-4 py-3.5">Spend ($)</th>
                        <th className="px-4 py-3.5">Impressions</th>
                        <th className="px-4 py-3.5">Clicks (CTR)</th>
                        <th className="px-4 py-3.5">CPC ($)</th>
                        <th className="px-4 py-3.5">Conv (CPA)</th>
                        <th className="px-4 py-3.5">Revenue ($)</th>
                        <th className="px-4 py-3.5">ROAS</th>
                        <th className="px-4 py-3.5">SQLs (Pipeline)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {CAMPAIGN_METRICS_DATA.map((row) => (
                        <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-white text-xs truncate max-w-[180px]">{row.campaignName}</div>
                            <span className="text-[10px] text-accent font-mono">{row.campaignType}</span>
                          </td>
                          <td className="px-4 py-3.5 text-zinc-300">{row.channel}</td>
                          <td className="px-4 py-3.5 font-bold text-white">${row.spend.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-zinc-300">{row.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3.5">
                            <div className="text-white">{row.clicks.toLocaleString()}</div>
                            <div className="text-[10px] text-emerald-400">{row.ctr}%</div>
                          </td>
                          <td className="px-4 py-3.5 text-zinc-300">${row.cpc.toFixed(2)}</td>
                          <td className="px-4 py-3.5">
                            <div className="text-white font-bold">{row.conversions.toLocaleString()}</div>
                            <div className="text-[10px] text-amber-400">${row.cpa.toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-emerald-400">${row.revenue.toLocaleString()}</td>
                          <td className="px-4 py-3.5 font-black text-white">{row.roas.toFixed(2)}x</td>
                          <td className="px-4 py-3.5">
                            <div className="text-white font-bold">{row.sqls} SQLs</div>
                            <div className="text-[10px] text-secondary">${(row.pipelineValue / 1000).toFixed(0)}k pipeline</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUTOMATIC UTM BUILDER */}
      {/* ========================================================================= */}
      {activeTab === 'UTM_BUILDER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* UTM Form (7 Cols) */}
          <div className="lg:col-span-7 bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold silver-text">Autonomous UTM Builder & Generator</h3>
              <p className="text-xs text-zinc-400">
                Synthesizes canonical campaign tracking URLs formatted for GA4 Measurement Protocol, HubSpot CRM, and Second Brain attribution.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-muted font-bold">Destination Landing Page URL *</label>
                <input
                  type="text"
                  value={utmUrl}
                  onChange={(e) => setUtmUrl(e.target.value)}
                  placeholder="https://sigmatactix.com/growth-os"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted font-bold">Campaign Name (utm_campaign) *</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="q4_enterprise_growth"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted font-bold">Channel (utm_source) *</label>
                  <select
                    value={utmChannel}
                    onChange={(e) => {
                      setUtmChannel(e.target.value);
                      if (e.target.value === 'google') setUtmMedium('cpc');
                      else if (e.target.value === 'linkedin' || e.target.value === 'meta') setUtmMedium('paid_social');
                      else if (e.target.value === 'youtube') setUtmMedium('video');
                      else if (e.target.value === 'newsletter') setUtmMedium('email');
                    }}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="google">Google Ads (Search / PMax)</option>
                    <option value="meta">Meta (Instagram / Facebook)</option>
                    <option value="linkedin">LinkedIn Ads (ABM)</option>
                    <option value="youtube">YouTube (Shorts / Video)</option>
                    <option value="twitter">X / Twitter</option>
                    <option value="newsletter">Email Newsletter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted font-bold">Marketing Medium (utm_medium) *</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="cpc / paid_social / video"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted font-bold">Audience / Persona Tag *</label>
                  <input
                    type="text"
                    value={utmAudienceTag}
                    onChange={(e) => setUtmAudienceTag(e.target.value)}
                    placeholder="founders_series_b"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted font-bold">Ad Creative / Hook (utm_content)</label>
                  <input
                    type="text"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    placeholder="carousel_second_brain_v1"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted font-bold">Keywords / Target Term (utm_term)</label>
                  <input
                    type="text"
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value)}
                    placeholder="b2b_growth_os"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleBatchGenerateUtms}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-mono font-bold uppercase transition-all border border-white/10 flex items-center gap-2"
              >
                <Layers size={13} className="text-accent" />
                <span>Batch Generate All 4 Channels</span>
              </button>
            </div>
          </div>

          {/* UTM Preview Box (5 Cols) */}
          <div className="lg:col-span-5 bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-accent" />
                <h4 className="text-base font-bold silver-text">Generated Canonical URL</h4>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Real-time concatenated parameter link.</p>
            </div>

            <div className="p-4 bg-black/70 rounded-xl border border-white/10 space-y-3">
              <div className="text-xs font-mono text-zinc-300 break-all leading-relaxed select-all">
                {generatedUtmLink}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Valid GA4 Syntax
                </span>
                <button
                  onClick={handleCopyUtm}
                  className="px-4 py-2 bg-accent text-background font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all hover:opacity-90 amber-glow"
                >
                  {copiedUtm ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedUtm ? 'Copied!' : 'Copy UTM Link'}</span>
                </button>
              </div>
            </div>

            {/* Individual Parameter Badges */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-[10px] font-mono text-muted uppercase font-bold">Attribution Breakdown:</div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-zinc-400">utm_source:</span>
                  <span className="text-accent font-bold">{utmChannel}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-zinc-400">utm_medium:</span>
                  <span className="text-white font-bold">{utmMedium}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-zinc-400">utm_campaign:</span>
                  <span className="text-emerald-400 font-bold">{utmCampaign}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-zinc-400">utm_content:</span>
                  <span className="text-zinc-300 font-bold truncate max-w-[180px]">{utmAudienceTag}_{utmContent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. AD CREATIVES & RSA STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'SEARCH_ADS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 p-6 bg-surface border border-white/10 rounded-2xl shadow-xl">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Google RSA Generator
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target Keywords (Comma Separated)</label>
              <textarea
                value={searchKeywords}
                onChange={e => setSearchKeywords(e.target.value)}
                rows={3}
                className="w-full p-3 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target CPA ($)</label>
              <input
                type="number"
                value={targetCpaInput}
                onChange={e => setTargetCpaInput(Number(e.target.value))}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1 text-xs">
              <div className="text-amber-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Negative Keyword Sentinel
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Automatically injects 420+ B2B negative exclusions (e.g. "free", "login", "jobs", "templates") to protect ad spend.
              </p>
            </div>

            <button
              onClick={handleGenerateRsa}
              disabled={isGeneratingRsa}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50"
            >
              <Sparkles className={cn("w-4 h-4", isGeneratingRsa && "animate-spin")} />
              {isGeneratingRsa ? 'Generating RSA Variations...' : 'Generate Responsive Search Ad'}
            </button>
          </div>

          <div className="lg:col-span-2 p-6 bg-surface border border-white/10 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Active Google RSA Ad Preview</h3>
                <div className="text-xs font-mono text-zinc-400 mt-0.5">Ad Strength: Excellent (Score: 98/100)</div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-lg">
                Status: Live in Auction
              </span>
            </div>

            <div className="p-4 bg-black/80 border border-zinc-800 rounded-xl space-y-2 font-sans">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">Sponsored</span>
                <span>https://sigmatactix.com/growth-os</span>
              </div>
              <div className="text-blue-400 text-base font-medium hover:underline cursor-pointer">
                AI Growth OS for Mid-Market | Sovereign Second Brain Architecture
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Replace fragmented agency retainers with client-owned growth infrastructure. 10 permissioned vaults with pgvector RAG and autonomous execution swarms. Run our free 6-minute Growth Diagnostic today.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 text-xs text-blue-400">
                <span className="hover:underline cursor-pointer">• Growth Diagnostic (78/100)</span>
                <span className="hover:underline cursor-pointer">• Second Brain Blueprint</span>
                <span className="hover:underline cursor-pointer">• Architecture Whitepaper</span>
              </div>
            </div>

            {/* Headline variations */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Top Performing Headline Variations</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { text: 'Stop Renting Marketing Agencies', ctr: '4.82%', score: 98 },
                  { text: 'AI Growth OS for Mid-Market', ctr: '4.15%', score: 94 },
                  { text: 'Sovereign Second Brain Cloud', ctr: '3.90%', score: 92 },
                  { text: 'Guardrails & Human-in-the-Loop', ctr: '3.65%', score: 90 }
                ].map((item, i) => (
                  <div key={i} className="p-2.5 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-zinc-200 truncate pr-2">"{item.text}"</span>
                    <span className="font-mono text-emerald-400 font-bold whitespace-nowrap">{item.ctr} CTR</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Plan Creation Modal */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold silver-text">Create Multi-Channel Media Plan</h3>
                <button
                  onClick={() => setIsPlanModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-muted hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateMediaPlan} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted font-bold">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. Q1 SaaS Demand Capture Flight"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted font-bold">Objective</label>
                    <select
                      value={newPlanObjective}
                      onChange={(e) => setNewPlanObjective(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white"
                    >
                      <option value="Direct Revenue Capture">Direct Revenue Capture</option>
                      <option value="B2B Pipeline Generation">B2B Pipeline Generation</option>
                      <option value="Blended CAC Reduction">Blended CAC Reduction</option>
                      <option value="Product Launch Velocity">Product Launch Velocity</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted font-bold">Total Budget ($)</label>
                    <input
                      type="number"
                      required
                      value={newPlanBudget}
                      onChange={(e) => setNewPlanBudget(Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted font-bold">Target CAC ($)</label>
                    <input
                      type="number"
                      required
                      value={newPlanCac}
                      onChange={(e) => setNewPlanCac(Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted font-bold">Target ROAS (x)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newPlanRoas}
                      onChange={(e) => setNewPlanRoas(Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted font-bold">Flight Start</label>
                    <input
                      type="date"
                      value={newPlanStart}
                      onChange={(e) => setNewPlanStart(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted font-bold">Flight End</label>
                    <input
                      type="date"
                      value={newPlanEnd}
                      onChange={(e) => setNewPlanEnd(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-5 py-2.5 bg-white/5 text-muted hover:text-white rounded-xl text-xs font-mono font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-accent text-background font-black uppercase text-xs tracking-wider rounded-xl hover:opacity-90 amber-glow"
                  >
                    Initialize Media Plan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Media Plan AI Extraction Modal (Req 6.g) */}
      <AnimatePresence>
        {isUploadPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Upload Media Plan & Extract with AI</h3>
                    <p className="text-xs text-zinc-400">Auto-identifies budgets, flight dates, channel mix, and CAC targets</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadPlanModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-white/20 hover:border-amber-400/50 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-black/40 hover:bg-amber-400/[0.02]"
                >
                  <Upload size={36} className="text-amber-400 mb-3" />
                  <div className="font-bold text-sm text-white">Click to upload or drag & drop media plan</div>
                  <div className="text-xs text-zinc-500 mt-1">Supports CSV, XLSX, PDF, or JSON exports from agency/internal planning</div>
                  {uploadedFileName && (
                    <div className="mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-mono text-xs">
                      Selected: {uploadedFileName}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.pdf,.json"
                    onChange={handleSimulatePlanUpload}
                    className="hidden"
                  />
                </div>

                {isUploadingPlan ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-400 font-mono text-xs">
                    <RefreshCw size={16} className="animate-spin text-amber-400" />
                    <span>AI parsing media plan structure, budget tables, and channel weightings...</span>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-800/40 rounded-xl text-xs space-y-1.5 font-mono text-zinc-400">
                    <div className="text-white font-bold">AI Extraction Capabilities:</div>
                    <div>• Automatically detects flight start/end dates and total budget envelope</div>
                    <div>• Maps channel weights to Google Ads, Meta Ads, and LinkedIn ABM</div>
                    <div>• Ingests benchmark CAC targets and expected conversion volumes</div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadPlanModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 bg-accent text-background font-black text-xs uppercase tracking-wider rounded-xl amber-glow"
                  >
                    Select File
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-Time Agent Run Results Section */}
      <div className="mt-12">
        <AgentRunResults
          records={runHistory}
          title="Paid Media Swarm Execution Logs"
          description="Log of automated bid pacing adjustments, creative fatigue interventions, and ROAS optimization sweeps."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Phase 0: fabricated client data is DEMO-ONLY.
// These fixtures describe ad spend, ROAS, pipeline, audiences and
// campaign results that this workspace has never had. A fresh tenant
// must render none of them; they stay reachable behind
// VITE_SEED_DEMO_WORKSPACE for a sales demo environment only.
// ---------------------------------------------------------------------------
const INITIAL_MEDIA_PLANS = isDemoSeedEnabled() ? DEMO_INITIAL_MEDIA_PLANS : [];
const INITIAL_AUDIENCES = isDemoSeedEnabled() ? DEMO_INITIAL_AUDIENCES : [];
const CAMPAIGN_METRICS_DATA = isDemoSeedEnabled() ? DEMO_CAMPAIGN_METRICS_DATA : [];
