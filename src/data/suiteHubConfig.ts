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
      },
      {
        id: 'creative-image',
        label: 'Image Studio',
        href: '/image-studio',
        icon: ImageIcon,
        description: 'AI image generation and asset production for campaigns and posts.',
        badge: 'Flux Pro',
      },
      {
        id: 'creative-video',
        label: 'Video & Motion Studio',
        href: '/video-studio',
        icon: Video,
        description: 'Storyboard-to-motion video production and short-form cuts.',
        badge: 'HyperFrames',
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
      },
      {
        id: 'social-listening',
        label: 'Social Listening & Radar',
        href: '/social-listening',
        icon: Ear,
        description: 'Mention capture, sentiment tracking and AI-drafted responses.',
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
      },
      {
        id: 'search-cro',
        label: 'CRO & Landing Pages',
        href: '/cro-studio',
        icon: Target,
        description: 'Landing page production and conversion experiments.',
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
      },
      {
        id: 'demand-outreach',
        label: 'Cold Outreach & ABM',
        href: '/outreach',
        icon: Send,
        description: 'ICP-scored sequences and account-based campaigns with HITL gates.',
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
      },
      {
        id: 'paid-email',
        label: 'Email & Lifecycle',
        href: '/email-marketing',
        icon: Mail,
        description: 'Newsletters, lifecycle automation and retention flows.',
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
      },
      {
        id: 'intel-simulator',
        label: 'Market Simulator',
        href: '/market-simulator',
        icon: Swords,
        description: 'Scenario simulation of market and pricing moves.',
        badge: 'MiroFish',
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
};

/** All 14 working modules, flattened — used by tests and future tooling. */
export const SUITE_MODULES: SuiteModule[] = [
  ...Object.values(SUITE_HUBS).flatMap((hub) => hub.modules),
  MEASUREMENT_MODULE,
];
