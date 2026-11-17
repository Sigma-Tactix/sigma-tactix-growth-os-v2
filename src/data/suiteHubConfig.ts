import {
  FileText,
  ImageIcon,
  Video,
  Share2,
  Ear,
  Globe,
  Target,
  Zap,
  Send,
  Megaphone,
  Mail,
  Trophy,
  Swords,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import type { LifecycleStageId } from './marketingWorkflowSequence';

/**
 * Concise Digital Marketing Suite.
 *
 * The 14 working modules are grouped into 6 user-facing hubs that mirror the
 * standard marketing departments found in global marketing orgs. Every hub is
 * a stable deep-linkable surface; the original module routes are kept intact
 * so existing bookmarks and generated reports do not break.
 */

export interface SuiteModule {
  id: string;
  label: string;
  /** Existing module route — kept stable for deep links. */
  href: string;
  icon: LucideIcon;
  /** One-line purpose. No invented metrics. */
  description: string;
  badge?: string;
  lifecycleStage: LifecycleStageId;
  purpose: string;
  input: string;
  mainAction: string;
  output: string;
  status: string;
  nextStep: string;
}

export interface SuiteHub {
  id:
    | 'creative'
    | 'social'
    | 'search'
    | 'demand'
    | 'paid'
    | 'intelligence';
  title: string;
  tagline: string;
  /** The marketing department(s) this module consolidates (global reference). */
  department: string;
  modules: SuiteModule[];
}

export const SUITE_HUBS: Record<SuiteHub['id'], SuiteHub> = {
  creative: {
    id: 'creative',
    title: 'Creative Studio',
    tagline: 'All text, image and video generation in one space.',
    department: 'Content & Creative Production',
    modules: [
      {
        id: 'creative-editorial',
        label: 'Editorial Content Engine',
        href: '/content',
        icon: FileText,
        description: 'Long-form articles, newsletters and repurposing into threads, carousels and Shorts.',
        lifecycleStage: 'create',
        purpose: 'Produce authoritative editorial articles, thought leadership, and multi-format derivative assets.',
        input: 'Core brief topic, Brand Vault voice guidelines, and source research notes.',
        mainAction: 'Draft Article & Generate Social Derivations',
        output: 'Structured Markdown article, LinkedIn carousel JSON, and newsletter draft.',
        status: 'Ready',
        nextStep: 'Submit generated drafts to Action Queue for review (Stage 5: Review).',
      },
      {
        id: 'creative-image',
        label: 'Image Studio',
        href: '/image-studio',
        icon: ImageIcon,
        description: 'AI image generation and asset production for campaigns and posts.',
        badge: 'Flux Pro',
        lifecycleStage: 'create',
        purpose: 'Generate high-resolution visual assets and campaign creative variations.',
        input: 'Creative prompt, aspect ratio (1:1, 16:9, 9:16), and Brand Vault visual style.',
        mainAction: 'Generate AI Campaign Imagery',
        output: 'High-resolution PNG/WebP files stored in Sovereign Media Vault.',
        status: 'Ready',
        nextStep: 'Mount generated visual assets into Social Carousels or Landing Pages (Stage 6: Execute).',
      },
      {
        id: 'creative-video',
        label: 'Video & Motion Studio',
        href: '/video-studio',
        icon: Video,
        description: 'Storyboard-to-motion video production and short-form cuts.',
        badge: 'HyperFrames',
        lifecycleStage: 'create',
        purpose: 'Assemble deterministic video scenes, voiceover audio, and motion typography.',
        input: 'Storyboard scenes, script copy, voiceover audio track, and aspect ratio.',
        mainAction: 'Render Deterministic MP4 Video',
        output: 'Production-ready MP4 video file with verification hash.',
        status: 'Ready',
        nextStep: 'Queue video for operator sign-off in Action Queue (Stage 5: Review).',
      },
    ],
  },
  social: {
    id: 'social',
    title: 'Social Publishing Hub',
    tagline: 'Create, schedule and monitor every social surface in one unified space.',
    department: 'Social Media & Community',
    modules: [
      {
        id: 'social-publishing',
        label: 'Social Publishing & Carousels',
        href: '/social-carousels',
        icon: Share2,
        description: 'Unified scheduler and carousel builder across LinkedIn, X, Meta and YouTube.',
        badge: 'LinkedIn',
        lifecycleStage: 'execute',
        purpose: 'Schedule and publish multi-platform carousels across LinkedIn, X, and Meta.',
        input: 'Approved carousel slides, schedule ISO timestamp, and channel targets.',
        mainAction: 'Dispatch Scheduled Multi-Channel Post',
        output: 'Cryptographic publish receipt with external post URLs.',
        status: 'Configured',
        nextStep: 'Monitor engagement signals and citation metrics (Stage 7: Measure).',
      },
      {
        id: 'social-listening',
        label: 'Social Listening & Radar',
        href: '/social-listening',
        icon: Ear,
        description: 'Mention capture, sentiment tracking and AI-drafted responses.',
        lifecycleStage: 'understand',
        purpose: 'Monitor brand keywords, sentiment shifts, and high-intent social conversations.',
        input: 'Tracked keywords, brand handles, and webhook telemetry stream.',
        mainAction: 'Capture & Score Inbound Mentions',
        output: 'Categorized mention feed with sentiment scores and response drafts.',
        status: 'Ready',
        nextStep: 'Incorporate top sentiment objections into Editorial Content (Stage 4: Create).',
      },
    ],
  },
  search: {
    id: 'search',
    title: 'Search & Conversion',
    tagline: 'Own the queries people and AI engines ask, then turn visits into pipeline.',
    department: 'SEO, AEO & CRO',
    modules: [
      {
        id: 'search-seo-aeo',
        label: 'SEO & AEO Authority',
        href: '/seo-aeo',
        icon: Globe,
        description: 'Search Console data, keyword clusters and answer-engine citation tracking.',
        badge: 'GSC + AI',
        lifecycleStage: 'understand',
        purpose: 'Analyze search queries, track keyword authority, and measure AI engine citation presence.',
        input: 'Verified Google Search Console property and target topic clusters.',
        mainAction: 'Fetch Query Analytics & AEO Citations',
        output: 'Search performance trends, ranking distribution, and citation audits.',
        status: 'Configured',
        nextStep: 'Draft authoritative articles targeting underserved queries (Stage 4: Create).',
      },
      {
        id: 'search-cro',
        label: 'CRO & Landing Pages',
        href: '/cro-studio',
        icon: Target,
        description: 'Landing page production and conversion experiments.',
        lifecycleStage: 'create',
        purpose: 'Synthesize self-contained, responsive Tailwind landing page packages.',
        input: 'Value proposition, target audience ICP, and conversion goal.',
        mainAction: 'Generate Production Landing Page Package',
        output: 'Stand-alone HTML + Tailwind CSS deliverable ready for DNS deployment.',
        status: 'Ready',
        nextStep: 'Review conversion copy and test form intake (Stage 5: Review).',
      },
    ],
  },
  demand: {
    id: 'demand',
    title: 'Demand Engine',
    tagline: 'Capture inbound instantly and run guarded outbound to a defined ICP.',
    department: 'Demand Generation & Outbound',
    modules: [
      {
        id: 'demand-intake',
        label: 'Inbound Leads & WhatsApp',
        href: '/intake',
        icon: Zap,
        description: 'Sub-60-second lead qualification across forms and messaging.',
        badge: 'Sub-60s',
        lifecycleStage: 'execute',
        purpose: 'Qualify inbound prospect form fills and WhatsApp inquiries in sub-60 seconds.',
        input: 'Webhook form submission payload or WhatsApp message.',
        mainAction: 'Evaluate ICP Tier & Route Lead',
        output: 'Enriched lead record with score tier (A/B/C/D) and routed notification.',
        status: 'Ready',
        nextStep: 'Sync qualified pipeline into Attribution & Reporting (Stage 7: Measure).',
      },
      {
        id: 'demand-outreach',
        label: 'Cold Outreach & ABM',
        href: '/outreach',
        icon: Send,
        description: 'ICP-scored sequences and account-based campaigns with HITL gates.',
        lifecycleStage: 'plan',
        purpose: 'Build account-based outbound campaigns and battlecards targeted at defined ICPs.',
        input: 'Target account domain list, buyer persona title, and value proposition.',
        mainAction: 'Synthesize ABM Account Battlecard & Sequence',
        output: 'Multi-touch outbound email/social sequence with personalization points.',
        status: 'Ready',
        nextStep: 'Submit outbound sequence to Action Queue for approval (Stage 5: Review).',
      },
    ],
  },
  paid: {
    id: 'paid',
    title: 'Paid & Retention',
    tagline: 'Buy pipeline profitably and keep it with lifecycle messaging.',
    department: 'Paid Media & Lifecycle / CRM',
    modules: [
      {
        id: 'paid-ads',
        label: 'Performance Ads & ROAS',
        href: '/paid-ads',
        icon: Megaphone,
        description: 'Campaign operations across Google, Meta, LinkedIn and TikTok with ROAS guardrails.',
        lifecycleStage: 'execute',
        purpose: 'Monitor ad campaign spend, track ROAS guardrails, and execute budget adjustments.',
        input: 'Verified ad account ID, target ROAS floor, and daily budget ceiling.',
        mainAction: 'Synchronize Campaign Pacing & Rebalance Budget',
        output: 'Budget mutation receipt with before/after spend telemetry.',
        status: 'Configured',
        nextStep: 'Reconcile ad spend against revenue in Attribution (Stage 7: Measure).',
      },
      {
        id: 'paid-email',
        label: 'Email & Lifecycle',
        href: '/email-marketing',
        icon: Mail,
        description: 'Newsletters, lifecycle automation and retention flows.',
        lifecycleStage: 'create',
        purpose: 'Design automated lifecycle email sequences and retention newsletter campaigns.',
        input: 'Subscriber segment, lifecycle trigger event, and offer details.',
        mainAction: 'Generate Responsive Email Sequence Draft',
        output: 'Multi-step email template copy with subject line variations.',
        status: 'Ready',
        nextStep: 'Review email copy and export to connected ESP (Stage 5: Review).',
      },
    ],
  },
  intelligence: {
    id: 'intelligence',
    title: 'Market Intelligence',
    tagline: 'See competitors and whole markets moving before you commit budget.',
    department: 'Research & Competitive Intelligence',
    modules: [
      {
        id: 'intel-competitors',
        label: 'Competitor Intelligence',
        href: '/competitors',
        icon: Trophy,
        description: 'Competitor profiles, ad teardowns and counter-positioning.',
        badge: 'TinyFish',
        lifecycleStage: 'understand',
        purpose: 'Deconstruct competitor advertising strategies, positioning angles, and product offers.',
        input: 'Competitor domain URL and category search queries.',
        mainAction: 'Execute Multi-Channel Threat Intelligence Scan',
        output: 'Structured competitor battlecard with counter-positioning angles.',
        status: 'Ready',
        nextStep: 'Refine product differentiation in Growth Strategy (Stage 3: Plan).',
      },
      {
        id: 'intel-simulator',
        label: 'Market Simulator',
        href: '/market-simulator',
        icon: Swords,
        description: 'Scenario simulation of market and pricing moves.',
        badge: 'MiroFish',
        lifecycleStage: 'understand',
        purpose: 'Run agentic market scenario simulations on prospective pricing and product moves.',
        input: 'Strategic scenario question, baseline evidence snapshot, and assumption set.',
        mainAction: 'Execute Calibrated Scenario Simulation',
        output: 'Probabilistic simulation report with risk-adjusted payoff matrix.',
        status: 'Ready',
        nextStep: 'Incorporate simulation findings into Growth Strategy roadmap (Stage 3: Plan).',
      },
    ],
  },
};

/** Single-module measurement hub — linked directly, no wrapper page. */
export const MEASUREMENT_MODULE: SuiteModule = {
  id: 'measurement',
  label: 'Attribution & Blended CAC',
  href: '/attribution',
  icon: BarChart3,
  description: 'Blended CAC, ROAS and multi-channel attribution reporting.',
  lifecycleStage: 'measure',
  purpose: 'Reconcile multi-channel spend against verified conversion records to compute blended CAC and ROAS.',
  input: 'Normalized ad network spend receipts and verified CRM revenue records.',
  mainAction: 'Compute Blended Attribution Matrix',
  output: 'Attribution report with channel-by-channel CAC and blended return.',
  status: 'Ready',
  nextStep: 'Record campaign retrospectives and lessons in Knowledge Vault (Stage 8: Learn).',
};

/** All 14 working modules, flattened — used by tests and future tooling. */
export const SUITE_MODULES: SuiteModule[] = [
  ...Object.values(SUITE_HUBS).flatMap((hub) => hub.modules),
  MEASUREMENT_MODULE,
];
