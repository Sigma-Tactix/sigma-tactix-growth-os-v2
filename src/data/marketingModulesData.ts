export interface KeywordCluster {
  id: string;
  pillar: string;
  intent: 'INFORMATIONAL' | 'COMMERCIAL' | 'TRANSACTIONAL' | 'NAVIGATIONAL';
  monthlyVolume: number;
  difficulty: number; // 0-100
  cpc: number;
  serpFeatures: string[];
  aeoCitationScore: number; // 0-100
  spokes: {
    keyword: string;
    volume: number;
    intent: string;
    urlSlug: string;
    aiEngineVisibility: string;
  }[];
}

export interface AeoCitationBenchmark {
  engine: 'ChatGPT Search' | 'Perplexity AI' | 'Claude 3.7 Sonnet' | 'Google Gemini' | 'Google SGE / Overviews';
  brandCitationRate: number; // percentage 0-100
  sentimentScore: number; // percentage 0-100
  rankPosition: number; // average rank in citation list
  primarySourceCited: string;
  lastTested: string;
  status: 'OPTIMAL' | 'COMPETITIVE' | 'INSUFFICIENT_DATA';
}

export interface CompetitorProfile {
  id: string;
  name: string;
  domain: string;
  marketShare: string;
  monthlyTraffic: string;
  positioning: string;
  estimatedAdSpend: string;
  topChannels: string[];
  techStack: string[];
  strengths: string[];
  vulnerabilities: string[];
  adCreativesCount: number;
}

export interface CreativeComparisonItem {
  id: string;
  competitorName: string;
  channel: 'META_ADS' | 'GOOGLE_SEARCH' | 'LINKEDIN_SPONSORED' | 'TIKTOK';
  adHeadline: string;
  adCopy: string;
  creativeType: 'Static Visual' | 'UGC Video' | 'Carousel' | 'RSA Search Ad';
  hookAngle: string;
  offer: string;
  estimatedCtr: string;
  sigmaTactixCounterAd: {
    headline: string;
    copy: string;
    counterHookAngle: string;
    strategicAdvantage: string;
  };
}

export interface CarouselSlide {
  slideNumber: number;
  badge?: string;
  title: string;
  subtitle?: string;
  contentPoints?: string[];
  takeaway?: string;
  visualCue?: string;
}

export interface TweetItem {
  tweetNumber: number;
  text: string;
  charCount: number;
}

export interface ShortsScene {
  timeCode: string;
  visualDirection: string;
  sfxCue: string;
  voiceover: string;
  screenText: string;
}

export interface SocialCampaignData {
  channel: 'LinkedIn' | 'X_Thread' | 'Instagram' | 'YouTube_Shorts';
  topic: string;
  hook: string;
  caption?: string;
  slides?: CarouselSlide[];
  threadTweets?: TweetItem[];
  shortsScenes?: ShortsScene[];
  loopCta?: string;
  hashtags?: string[];
}

export interface ContentEngineItem {
  id: string;
  title: string;
  type: 'LONG_FORM' | 'SOCIAL_CAROUSEL' | 'IMAGE_ASSET' | 'VIDEO_STORYBOARD' | 'NEWSLETTER';
  channel: 'LinkedIn' | 'Blog' | 'X/Twitter' | 'YouTube Shorts' | 'Meta' | 'Email';
  status: 'DRAFT' | 'READY_FOR_HITL' | 'PUBLISHED';
  voiceAlignmentScore: number;
  targetAudience: string;
  generatedContent: string;
  mediaUrl?: string;
  carouselSlides?: CarouselSlide[];
  threadTweets?: TweetItem[];
  shortsScenes?: ShortsScene[];
  socialCampaign?: SocialCampaignData;
  videoStoryboard?: {
    sceneNumber: number;
    visualDirection: string;
    motionPrompt: string;
    voiceoverText: string;
    durationSeconds: number;
  }[];
}

export interface PaidAdCampaign {
  id: string;
  platform: 'Google Search' | 'Meta (FB/IG)' | 'LinkedIn Ads' | 'TikTok Ads' | 'Microsoft / Bing';
  name: string;
  type: 'SEARCH_RSA' | 'META_FEED_REEL' | 'B2B_SPONSORED' | 'VIDEO_AD';
  objective: 'Lead Generation' | 'High-Intent Pipeline' | 'Product Demo' | 'Brand Authority';
  monthlyBudget: number;
  roas: number;
  cpa: number;
  targetCpa: number;
  status: 'ACTIVE' | 'SCALING' | 'OPTIMIZING' | 'PAUSED';
  adVariations: {
    headline: string;
    primaryText: string;
    cta: string;
    ctr: string;
    score: number;
  }[];
}

export interface SocialMention {
  id: string;
  platform: 'X / Twitter' | 'LinkedIn' | 'Reddit' | 'YouTube' | 'HackerNews' | 'News / PR' | string;
  author: string;
  authorHandle: string;
  // Phase 0: these are provider metrics. A capture channel frequently cannot
  // supply them, and an unmeasured metric must stay absent rather than be
  // filled with a plausible number — a fabricated reach figure attached to a
  // real mention is exactly the unsupported claim the plan bans.
  followersCount?: string;
  content: string;
  /** `null` means sentiment was not classified — which is not the same as Neutral. */
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'HIGH_ALERT' | null;
  /** The real permalink to the captured discussion, when the channel gave one. */
  sourceUrl?: string;
  timestamp: string;
  reach?: number;
  engagement?: number;
  suggestedAction: 'AMPLIFY' | 'ENGAGE' | 'RESOLVE' | 'IGNORE';
  aiDraftReply?: string;
  aiResponseDraft?: string;
  requiresAttention?: boolean;
  contentSnippet?: string;
  channel?: string;
  reachEstimate?: string;
}

export interface LeadProspect {
  id: string;
  name: string;
  title: string;
  company: string;
  companyName?: string;
  industry: string;
  companySize: string;
  employeeCount?: string;
  estimatedArr?: string;
  icpScore: number; // 0-100
  icpMatchScore?: number;
  buyingIntent: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'WARMING';
  email: string;
  linkedinUrl: string;
  status: 'NEW' | 'SEQUENCE_ACTIVE' | 'REPLIED' | 'MEETING_BOOKED' | 'DISQUALIFIED';
  currentStep: string;
  touchpointsCompleted?: number;
  triggerEvent: string;
  intentSignals?: string[];
  personalizedHook: string;
  personalizedOutreachCopy?: string;
}

export interface MarketingLearningItem {
  id: string;
  date?: string;
  dateAdded?: string;
  author?: string;
  source?: string;
  category: 'WINNING_HOOK' | 'OBJECTION_OVERCOME' | 'AD_FATIGUE' | 'AUDIENCE_DISCOVERY' | 'CHANNEL_SHIFT' | 'COPYWRITING' | 'POSITIONING' | 'AUDIENCE_ICP' | 'PAID_ADS' | 'CONVERSION_CRO' | string;
  title?: string;
  insight?: string;
  finding?: string;
  evidenceMetric?: string;
  confidenceScore?: number;
  actionTaken: string;
  targetVault: string;
  syncStatus?: 'SYNCED_TO_BRAIN' | 'PENDING_EMBEDDING';
}

export type MarketingTeamLearning = MarketingLearningItem;

export interface DigitalIntegrationItem {
  id: string;
  name: string;
  category: 'SOCIAL_CHANNEL' | 'AD_NETWORK' | 'MARKETING_TOOL' | 'MCP_PROTOCOL' | 'APP_PLUGIN';
  iconName: string;
  description: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'NEEDS_AUTH' | 'SYNCING';
  syncFrequency: string;
  lastSync: string;
  targetVault: string;
  protocolDetails?: string;
  apiVersion: string;
  features: string[];
}

// -------------------------------------------------------------
// SEED DATA
// -------------------------------------------------------------

export const SEED_KEYWORD_CLUSTERS: KeywordCluster[] = [
  {
    id: 'cluster-1',
    pillar: 'AI Growth Infrastructure & Second Brain OS',
    intent: 'COMMERCIAL',
    monthlyVolume: 12400,
    difficulty: 38,
    cpc: 14.50,
    serpFeatures: ['AI Overview', 'Featured Snippet', 'People Also Ask', 'Video Carousel'],
    aeoCitationScore: 92,
    spokes: [
      { keyword: 'ai native growth architecture b2b', volume: 2400, intent: 'Commercial', urlSlug: '/ai-growth-infrastructure', aiEngineVisibility: 'Cited in 4/5 AI Engines' },
      { keyword: 'second brain enterprise marketing database', volume: 3800, intent: 'Informational', urlSlug: '/enterprise-second-brain-marketing', aiEngineVisibility: 'Rank #1 in Perplexity' },
      { keyword: 'autonomous marketing agent orchestration hitl', volume: 1900, intent: 'Transactional', urlSlug: '/autonomous-agent-orchestration', aiEngineVisibility: 'Snippet in Gemini' },
      { keyword: 'marketing memory pgvector rag', volume: 1600, intent: 'Informational', urlSlug: '/marketing-rag-vector-memory', aiEngineVisibility: 'Cited in ChatGPT Search' },
    ]
  },
  {
    id: 'cluster-2',
    pillar: 'Digital Growth Diagnostic & Revenue Leaks',
    intent: 'TRANSACTIONAL',
    monthlyVolume: 8600,
    difficulty: 32,
    cpc: 22.80,
    serpFeatures: ['AI Overview', 'Direct Answer', 'FAQ Schema'],
    aeoCitationScore: 88,
    spokes: [
      { keyword: 'b2b digital marketing audit checklist', volume: 4100, intent: 'Informational', urlSlug: '/growth-audit-checklist', aiEngineVisibility: 'Featured Snippet Google' },
      { keyword: 'detect paid ads revenue leaks cpa', volume: 1800, intent: 'Commercial', urlSlug: '/paid-ads-revenue-leaks', aiEngineVisibility: 'Cited in Perplexity' },
      { keyword: '90 day growth engine roadmap enterprise', volume: 2700, intent: 'Transactional', urlSlug: '/90-day-growth-roadmap', aiEngineVisibility: 'Rank #2 in Claude' },
    ]
  },
  {
    id: 'cluster-3',
    pillar: 'AEO / Generative Engine Optimization',
    intent: 'COMMERCIAL',
    monthlyVolume: 18200,
    difficulty: 45,
    cpc: 19.20,
    serpFeatures: ['AI Overview', 'Knowledge Panel', 'People Also Ask'],
    aeoCitationScore: 95,
    spokes: [
      { keyword: 'how to get cited in perplexity chatgpt search', volume: 7400, intent: 'Informational', urlSlug: '/how-to-get-cited-in-perplexity', aiEngineVisibility: 'Pillar Resource Cited' },
      { keyword: 'generative engine optimization geo framework', volume: 5600, intent: 'Commercial', urlSlug: '/geo-aeo-framework', aiEngineVisibility: 'Leader in ChatGPT' },
      { keyword: 'brand citation index monitoring tools', volume: 3200, intent: 'Transactional', urlSlug: '/brand-citation-monitoring', aiEngineVisibility: 'Cited in Gemini' },
    ]
  }
];

export const SEED_AEO_BENCHMARKS: AeoCitationBenchmark[] = [
  {
    engine: 'Perplexity AI',
    brandCitationRate: 88,
    sentimentScore: 94,
    rankPosition: 1.4,
    primarySourceCited: 'sigma-tactix.com/architecture & /case-studies',
    lastTested: '10 mins ago',
    status: 'OPTIMAL'
  },
  {
    engine: 'ChatGPT Search',
    brandCitationRate: 82,
    sentimentScore: 91,
    rankPosition: 2.1,
    primarySourceCited: 'LinkedIn Thought Leadership + Technical Whitepapers',
    lastTested: '25 mins ago',
    status: 'OPTIMAL'
  },
  {
    engine: 'Google SGE / Overviews',
    brandCitationRate: 74,
    sentimentScore: 86,
    rankPosition: 2.8,
    primarySourceCited: 'JSON-LD Schema + Verified Press Releases',
    lastTested: '1 hr ago',
    status: 'COMPETITIVE'
  },
  {
    engine: 'Google Gemini',
    brandCitationRate: 79,
    sentimentScore: 89,
    rankPosition: 2.0,
    primarySourceCited: 'Google Cloud Marketplace & Technical Documentation',
    lastTested: '45 mins ago',
    status: 'OPTIMAL'
  },
  {
    engine: 'Claude 3.7 Sonnet',
    brandCitationRate: 85,
    sentimentScore: 96,
    rankPosition: 1.6,
    primarySourceCited: 'GitHub Repositories & Second Brain Architectural Papers',
    lastTested: '30 mins ago',
    status: 'OPTIMAL'
  }
];

export const SEED_COMPETITORS: CompetitorProfile[] = [
  {
    id: 'comp-1',
    name: 'OmniVanguard Marketing Agency',
    domain: 'omnivanguard.io',
    marketShare: '18%',
    monthlyTraffic: '145K visits/mo',
    positioning: 'Traditional full-service retainers with slow manual reporting and heavy human headcount.',
    estimatedAdSpend: '$45,000 / mo',
    topChannels: ['Google Search (Non-brand)', 'LinkedIn Sponsored Content', 'Conference Sponsorships'],
    techStack: ['WordPress', 'HubSpot', 'Marketo', 'Hotjar'],
    strengths: ['Established brand recognition', 'Enterprise Fortune 500 references', 'Broad PR presence'],
    vulnerabilities: [
      'High monthly retainer ($15k/mo minimum)',
      'Zero proprietary AI memory or client Second Brain asset creation',
      'Average 14-day lag for creative campaign iterations',
      'Attribution blindness on multi-channel touchpoints'
    ],
    adCreativesCount: 42
  },
  {
    id: 'comp-2',
    name: 'GrowthSpire Automation',
    domain: 'growthspire.ai',
    marketShare: '12%',
    monthlyTraffic: '92K visits/mo',
    positioning: 'Generic Zapier/Make wrapper promising 100% automated spam outreach without brand safety.',
    estimatedAdSpend: '$28,000 / mo',
    topChannels: ['Cold Email Blasts', 'Meta Direct Response', 'YouTube Mid-roll Ads'],
    techStack: ['Webflow', 'Clay', 'Instantly', 'OpenAI API direct'],
    strengths: ['Low entry price', 'Fast onboarding', 'Viral short-form clips'],
    vulnerabilities: [
      'No RBAC or Human-in-the-Loop guardrails; frequent hallucinations',
      'Zero durable client ownership; vendor lock-in',
      'Severe brand damage from uncalibrated AI email spam',
      'No deep Second Brain integration'
    ],
    adCreativesCount: 36
  },
  {
    id: 'comp-3',
    name: 'Apex Velocity Studio',
    domain: 'apexvelocity.co',
    marketShare: '15%',
    monthlyTraffic: '110K visits/mo',
    positioning: 'Boutique fractional CMO studio focusing on paid social performance.',
    estimatedAdSpend: '$35,000 / mo',
    topChannels: ['Meta Reels Ads', 'TikTok for B2B', 'Founder Personal Branding'],
    techStack: ['Shopify Plus', 'Klaviyo', 'Triple Whale', 'Canva Teams'],
    strengths: ['High aesthetic visual creative', 'Strong founder charisma', 'Quick ad testing'],
    vulnerabilities: [
      'Weak on technical SEO/AEO and structured data',
      'Relies on manual human design pipelines',
      'No vector memory or systematic audit-to-config engine'
    ],
    adCreativesCount: 29
  }
];

export const SEED_CREATIVE_COMPARISONS: CreativeComparisonItem[] = [
  {
    id: 'comp-ad-1',
    competitorName: 'OmniVanguard Marketing Agency',
    channel: 'LINKEDIN_SPONSORED',
    adHeadline: 'Tired of juggling 5 different marketing agencies? Hire our 40-person team.',
    adCopy: 'Most B2B tech companies burn cash trying to manage separate SEO, paid media, and content contractors. Partner with OmniVanguard to get a dedicated account manager and monthly slide decks.',
    creativeType: 'Static Visual',
    hookAngle: 'Agency fatigue / All-in-one pitch',
    offer: 'Book a 45-minute capabilities presentation',
    estimatedCtr: '0.65%',
    sigmaTactixCounterAd: {
      headline: 'Stop Renting Agency Headcount. Own an AI-Native Growth Infrastructure.',
      copy: 'Agencies keep your operational memory in their siloed heads and charge you $18k/mo to maintain it. Sigma Tactix Growth OS installs a permanent Second Brain in your cloud with autonomous swarms that compound your business equity daily.',
      counterHookAngle: 'Permanent Ownership vs. Rented Headcount',
      strategicAdvantage: '3.4x higher conversion rate by offering client-owned infrastructure instead of another bloated services retainer.'
    }
  },
  {
    id: 'comp-ad-2',
    competitorName: 'GrowthSpire Automation',
    channel: 'META_ADS',
    adHeadline: 'Send 50,000 AI Cold Emails a Day with Zero Human Work.',
    adCopy: 'Automate your outbound prospecting end-to-end. Scrape LinkedIn, throw it into our ChatGPT prompt, and blast out thousands of messages instantly. Guaranteed 100 meetings.',
    creativeType: 'UGC Video',
    hookAngle: 'Unchecked brute force automation',
    offer: 'Start 7-day free trial ($99/mo)',
    estimatedCtr: '1.12%',
    sigmaTactixCounterAd: {
      headline: 'Cold Email Spam Is Dead. Deploy Guarded AI SDRs with Vector Memory.',
      copy: 'Blasting generic AI spam destroys your domain reputation and burns your TAM. Growth OS deploys calibrated SDR agents that research buyer personas from your Customer Vault, respect strict HITL clearance gates, and generate bespoke high-conviction memos.',
      counterHookAngle: 'Precision & Brand Safety vs. Reckless Spam',
      strategicAdvantage: 'Positions us as the enterprise-grade grown-up in the room; appeals to mid-market CMOs terrified of domain blacklisting.'
    }
  },
  {
    id: 'comp-ad-3',
    competitorName: 'Apex Velocity Studio',
    channel: 'GOOGLE_SEARCH',
    adHeadline: 'Fractional CMO Services | Paid Media Scaling Experts',
    adCopy: 'Scale your Meta and Google ads profitably. Former Silicon Valley CMOs audit your ad accounts and optimize your ROAS. Retainers from $10,000/mo.',
    creativeType: 'RSA Search Ad',
    hookAngle: 'Fractional executive pedigree',
    offer: 'Audit Your Ad Accounts',
    estimatedCtr: '2.4%',
    sigmaTactixCounterAd: {
      headline: 'Automate Paid Media Bidding & Creative Swarms 24/7 | Sigma Tactix',
      copy: 'Why wait 2 weeks for a human CMO to review your ad accounts? Vortex-02 monitors CPA drift every 15 minutes, detects creative fatigue before your CAC spikes, and reallocates capital autonomously under strict $1k safety gates.',
      counterHookAngle: 'Continuous Real-Time Machine Optimization vs. Bi-Weekly Human Slides',
      strategicAdvantage: 'Direct proof of continuous speed and mathematical optimization without $10k human retainer drag.'
    }
  }
];

export const SEED_CONTENT_ITEMS: ContentEngineItem[] = [
  {
    id: 'cnt-1',
    title: 'The Death of the Agency Retainer: Why Autonomous Growth Infrastructure Is Inevitable',
    type: 'LONG_FORM',
    channel: 'Blog',
    status: 'READY_FOR_HITL',
    voiceAlignmentScore: 99.4,
    targetAudience: 'Series A-C Founders, CMOs, Heads of Growth',
    generatedContent: `# The Death of the Agency Retainer: Why Autonomous Growth Infrastructure Is Inevitable

Over the past decade, the default playbook for enterprise marketing has been to lease human agency labor. A company raises capital, hires an agency of record, and watches as six junior associates try to master their product architecture. 

Six months later, the agency turns over its staff, your historical context vanishes, and you receive another 40-slide monthly PDF justifying a 20% CAC increase.

## The Architectural Flaw of Modern Marketing

The problem isn't that agency professionals are incompetent; it's that human memory is structurally incompatible with modern high-velocity growth. When business context lives in scattered Google Docs, Slack DMs, and transient heads, your growth engine has zero compounding equity.

**Every single marketing workflow breaks down into five sequential phases:**
1. Context Retrieval (Extracting positioning, ICPs, and objections)
2. Hypothesis Formation (Diagnosing gaps and determining the next move)
3. Asset Generation (Producing copy, visual layouts, and bid configurations)
4. Guarded Verification (Verifying brand voice, legal compliance, and budget limits)
5. Execution & Memory Feedback (Deploying assets and writing learnings back to the core)

Traditional agencies perform steps 1-3 through endless meetings. Sigma Tactix Growth OS automates steps 1-5 through a client-owned Second Brain and scoped agent swarms.

## From Human Dependency to Owned Capital

When you install an AI-native growth infrastructure, the balance of power shifts:
- Your Second Brain becomes an appreciating corporate asset that gets smarter with every campaign run.
- Guardrails eliminate hallucinations while Human-in-the-Loop approvals protect capital.
- Autonomous swarms execute across content, authority, and paid media at the speed of code.

The future does not belong to the company that rents the most agency headcount. It belongs to the company that builds the most intelligent sovereign growth machine.`,
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cnt-2',
    title: '5 Signs Your Business Has Digital Revenue Leaks (LinkedIn Carousel)',
    type: 'SOCIAL_CAROUSEL',
    channel: 'LinkedIn',
    status: 'READY_FOR_HITL',
    voiceAlignmentScore: 98.7,
    targetAudience: 'B2B Tech Executives & Revenue Leaders',
    generatedContent: `HOOK:
Most B2B founders believe their CAC is rising because "ad costs are up."
In reality, your business is hemorrhaging revenue across 5 invisible digital cracks.

Here is the exact empirical audit breakdown (and the sovereign system to seal them) ⬇️

SLIDE 1: 5 Hidden Digital Revenue Leaks Siphoning Your Pipeline (And How to Fix Them)
SLIDE 2: Leak #1 — Attribution Blindness. You are tracking last-click conversions while 82% of buyer journeys originate in dark social, AI answer engines, and organic podcasts.
SLIDE 3: Leak #2 — Ad Creative Fatigue. Your Meta frequency has climbed to 4.8x while your CTR dropped 28%, but nobody refreshed the hooks.
SLIDE 4: Leak #3 — Zero AEO Visibility. Perplexity and ChatGPT are answering buyer queries in your category, but citing your competitor 8x more often.
SLIDE 5: Leak #4 — Form Latency Drag. Your SDR team takes 4.2 hours to reply to inbound high-intent leads. Every minute past 5 minutes cuts qualification rate by 10x.
SLIDE 6: Leak #5 — The Fragmented Tooling Tax. Your CRM doesn't speak to your ad accounts, your CMS has zero schema markup, and your agency sends static PDFs.
SLIDE 7: The Fix: Deploy an AI-Native Second Brain. Connect your fragmented data into one coordinated Growth OS.`,
    carouselSlides: [
      {
        slideNumber: 1,
        badge: 'EXECUTIVE AUDIT',
        title: '5 Hidden Digital Revenue Leaks',
        subtitle: 'Why B2B Tech pipelines dry up despite $30k/mo ad spend',
        contentPoints: [
          'Rising CAC is rarely a media buying problem.',
          'It is almost always an uncoordinated infrastructure problem.',
          'Swipe through the 5 architectural leaks and how top 1% operators seal them.'
        ],
        takeaway: 'Client-owned systems compound. Rented retainers evaporate.',
        visualCue: 'Obsidian glass HUD with red diagnostic warning vectors'
      },
      {
        slideNumber: 2,
        badge: 'LEAK 01',
        title: 'Attribution Blindness',
        subtitle: 'Last-click measurement is killing high-intent demand',
        contentPoints: [
          '82% of B2B buyer journeys originate in dark social & AI search.',
          'Your CRM credits Google Brand Search for deals sparked on LinkedIn.',
          'You underfund high-converting brand affinity channels.'
        ],
        takeaway: 'Shift from last-click delusion to unified blended CAC telemetry.',
        visualCue: 'Radar chart showing fragmented touchpoints converging on deal close'
      },
      {
        slideNumber: 3,
        badge: 'LEAK 02',
        title: 'Ad Creative Fatigue',
        subtitle: 'Ad frequency hits 4.8x while CTR plummets 28%',
        contentPoints: [
          'Your target accounts have seen the same 2 static graphics for 90 days.',
          'Agency turnaround for fresh creative hooks takes 3 weeks.',
          'Result: algorithmic decay and negative brand recall.'
        ],
        takeaway: 'Deploy autonomous multi-hook creative sprints every 72 hours.',
        visualCue: 'Decaying curve showing frequency spikes vs conversion drop'
      },
      {
        slideNumber: 4,
        badge: 'LEAK 03',
        title: 'Zero AEO Visibility',
        subtitle: 'ChatGPT & Perplexity are recommending your competitors',
        contentPoints: [
          '58% of executive purchase queries now hit AI answer engines.',
          'Traditional SEO keywords miss conversational citation indexing.',
          'Competitors with structured knowledge graphs own 8x more citations.'
        ],
        takeaway: 'Engineer categorical schema markup and authoritative citation nodes.',
        visualCue: 'Generative search engine answer card highlighting competitor citations'
      },
      {
        slideNumber: 5,
        badge: 'LEAK 04',
        title: 'Inbound Latency Drag',
        subtitle: 'The 4.2-hour qualification death zone',
        contentPoints: [
          'Inbound demo requests sit in queues for hours.',
          'Qualification conversion drops by 10x after the first 5 minutes.',
          'Prospects research two alternatives while waiting for an SDR email.'
        ],
        takeaway: 'Sub-60s autonomous AI agent enrichment and instant calendar booking.',
        visualCue: 'Stopwatch visual comparing 5-minute close rate to 4-hour drop'
      },
      {
        slideNumber: 6,
        badge: 'LEAK 05',
        title: 'Fragmented Tooling Tax',
        subtitle: '12 disconnected subscriptions & zero shared memory',
        contentPoints: [
          'CRM, ad platforms, analytics, and CMS live in separate silos.',
          'Learnings evaporate every time a junior agency rep turns over.',
          'No single source of truth for customer positioning or unit economics.'
        ],
        takeaway: 'Unify company intelligence into a permissioned Second Brain.',
        visualCue: 'Fragmented puzzle pieces assembling into a central glowing vault'
      },
      {
        slideNumber: 7,
        badge: 'THE SOVEREIGN FIX',
        title: 'Deploy an AI-Native Growth OS',
        subtitle: 'Permanent institutional intelligence you own forever',
        contentPoints: [
          '10 permissioned vaults preserving brand voice, ICPs, and telemetry.',
          'Autonomous agent swarms executing CRO, content, and ad optimization.',
          'Strict Human-in-the-Loop guardrails protecting brand capital.'
        ],
        takeaway: 'Stop renting headcount. Own your growth infrastructure.',
        visualCue: 'Sigma Tactix Growth OS golden core radiating active telemetry'
      }
    ],
    threadTweets: [
      {
        tweetNumber: 1,
        text: 'Most B2B tech founders think their CAC is rising because "ad costs are up."\n\nFalse.\n\nYour pipeline is leaking across 5 invisible digital cracks.\n\nHere is the 5-point autopsy (and how top operators fix it): 🧵👇',
        charCount: 221
      },
      {
        tweetNumber: 2,
        text: '1/ Attribution Blindness\n\nTracking last-click conversions means 82% of dark social & podcast touchpoints get zero credit.\n\nYou keep cutting the channels that actually create buying intent to feed last-click Google Search.\n\nFix: Blend platform CAC with sovereign pipeline telemetry.',
        charCount: 279
      },
      {
        tweetNumber: 3,
        text: '2/ Ad Creative Fatigue\n\nWhen Meta or LinkedIn frequency crosses 3.5x, your CTR drops 28% while CPMs spike.\n\nAgencies take 3 weeks to design 2 new banners.\n\nFix: Scoped AI swarms synthesizing 20+ angle variations, hook teardowns, and visual assets weekly under HITL review.',
        charCount: 275
      },
      {
        tweetNumber: 4,
        text: '3/ Zero AEO Visibility\n\n58% of software buyers now ask Perplexity, Gemini, or ChatGPT for vendor comparisons.\n\nIf your site lacks deep semantic graph indexing, AI engines cite your competitors 8x more often.\n\nFix: Authoritative topical authority maps & entity schemas.',
        charCount: 272
      },
      {
        tweetNumber: 5,
        text: '4/ Inbound Latency Drag\n\nIf your sales team takes 4+ hours to contact an inbound demo lead, your close rate drops by 10x.\n\nBuyers are looking for solutions NOW.\n\nFix: AI agent qualification that enriches the lead and books calendar slots in under 60 seconds.',
        charCount: 254
      },
      {
        tweetNumber: 6,
        text: '5/ The Fragmented Tooling Tax\n\n12 disparate SaaS subscriptions. Zero shared memory. When agency staff turns over every 9 months, all your accumulated positioning nuance disappears.\n\nFix: Install an enterprise Second Brain directly into your cloud. Permanent equity.',
        charCount: 269
      },
      {
        tweetNumber: 7,
        text: 'Summary:\n\nRenting headcount guarantees negative compounding.\n\nInstalling an AI-native Growth OS guarantees permanent intelligence, lower CAC, and automated execution.\n\nBookmark this thread 🔖 and follow @SigmaTactix for empirical B2B teardowns.',
        charCount: 247
      }
    ]
  },
  {
    id: 'cnt-3',
    title: 'Visual Asset: Second Brain Neural Core Architecture',
    type: 'IMAGE_ASSET',
    channel: 'Blog',
    status: 'PUBLISHED',
    voiceAlignmentScore: 100,
    targetAudience: 'Technical Founders & Architects',
    generatedContent: 'Prompt: High-resolution dark aesthetic schematic of an enterprise Second Brain knowledge graph. 10 glowing permissioned vaults radiating golden and fiery amber data particles into an analytical dashboard. Clean typography, ISO-9001 precision, zero cheesy AI artifacts, deep navy #050515 background.',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cnt-4',
    title: 'Video Storyboard: 60-Second Growth OS Teardown',
    type: 'VIDEO_STORYBOARD',
    channel: 'YouTube Shorts',
    status: 'READY_FOR_HITL',
    voiceAlignmentScore: 99.1,
    targetAudience: 'CEOs and Founders seeking modern marketing systems',
    generatedContent: 'High-velocity 60s vertical video breakdown explaining the transition from agency retainers to owned AI infrastructure.',
    videoStoryboard: [
      {
        sceneNumber: 1,
        visualDirection: 'Rapid zoom into a cluttered browser with 45 open tabs: HubSpot, Google Ads, Meta, Notion, and 12 agency invoices.',
        motionPrompt: 'Fast kinetic push-in with glitch transition to red warning alert icon.',
        voiceoverText: 'This is the typical growth stack in 2026: twelve disconnected tools, $20k in agency retainers, and zero unified memory.',
        durationSeconds: 10
      },
      {
        sceneNumber: 2,
        visualDirection: 'Transition to glowing 3D Second Brain orb with 10 permissioned vaults rotating synchronously.',
        motionPrompt: 'Smooth 3D orbital camera tilt around glowing neural data sphere in deep obsidian space.',
        voiceoverText: 'Now imagine unifying your customer ICPs, brand tone vectors, ad metrics, and SEO maps into one client-owned Second Brain.',
        durationSeconds: 15
      },
      {
        sceneNumber: 3,
        visualDirection: 'Split-screen displaying autonomous agents executing: Aurora building topic clusters, Vortex shifting ad spend, Nexus drafting copy.',
        motionPrompt: 'Multi-screen split view with high-speed holographic data streams and terminal logs.',
        voiceoverText: 'Guarded AI swarms diagnose leaks, re-allocate media spend under $1,000 safety gates, and publish high-signal content in minutes.',
        durationSeconds: 20
      },
      {
        sceneNumber: 4,
        visualDirection: 'Crisp executive dashboard showing +42% pipeline growth, ending on the Sigma Tactix Growth OS emblem.',
        motionPrompt: 'Slow zoom out with glowing amber rim-light and CTA button lockup.',
        voiceoverText: 'Stop renting headcount. Own your growth engine. Run the free Growth Diagnostic at sigmatactix.com.',
        durationSeconds: 15
      }
    ]
  }
];

export const SEED_PAID_CAMPAIGNS: PaidAdCampaign[] = [
  {
    id: 'camp-1',
    platform: 'Google Search',
    name: 'Search - High Intent Enterprise "AI Growth Architecture"',
    type: 'SEARCH_RSA',
    objective: 'High-Intent Pipeline',
    monthlyBudget: 8500,
    roas: 4.8,
    cpa: 68.40,
    targetCpa: 75.00,
    status: 'ACTIVE',
    adVariations: [
      {
        headline: 'AI Growth OS for Mid-Market | Sovereign Second Brain',
        primaryText: 'Replace fragmented agency retainers with a client-owned growth infrastructure. 10 permissioned vaults with pgvector RAG.',
        cta: 'Run Growth Diagnostic',
        ctr: '4.82%',
        score: 98
      },
      {
        headline: 'Stop Renting Marketing Agencies | Build Owned Growth Equity',
        primaryText: 'Automate content creation, topical authority, and paid media re-allocation under strict Human-in-the-Loop guardrails.',
        cta: 'Explore System Architecture',
        ctr: '4.15%',
        score: 94
      }
    ]
  },
  {
    id: 'camp-2',
    platform: 'Meta (FB/IG)',
    name: 'Meta - Founder Persona Feed & Reels "Agency Teardown"',
    type: 'META_FEED_REEL',
    objective: 'Lead Generation',
    monthlyBudget: 6200,
    roas: 3.9,
    cpa: 42.10,
    targetCpa: 50.00,
    status: 'SCALING',
    adVariations: [
      {
        headline: 'Why 82% of Series B marketing teams are dropping their agency of record in 2026',
        primaryText: 'When your agency leaves, they take your operational memory with them. Sigma Tactix installs a permanent Second Brain in your cloud.',
        cta: 'Get Free Diagnostic Report',
        ctr: '2.18%',
        score: 96
      },
      {
        headline: 'Your ad frequency hit 4.8x. Here is the exact mathematical fix.',
        primaryText: 'Discover how autonomous swarms detect ad fatigue in real time and refresh creative angles before your customer acquisition cost spikes.',
        cta: 'Inspect Case Study',
        ctr: '1.95%',
        score: 91
      }
    ]
  },
  {
    id: 'camp-3',
    platform: 'LinkedIn Ads',
    name: 'LinkedIn - B2B CMO & VP Growth "Second Brain Blueprint"',
    type: 'B2B_SPONSORED',
    objective: 'Product Demo',
    monthlyBudget: 5500,
    roas: 5.2,
    cpa: 94.00,
    targetCpa: 110.00,
    status: 'ACTIVE',
    adVariations: [
      {
        headline: 'The Technical Blueprint for an AI-Native Growth OS (Free Architecture PDF)',
        primaryText: 'Download the 42-page architectural whitepaper detailing 10 permissioned vaults, BullMQ orchestration, and pgvector semantic retrieval.',
        cta: 'Download Whitepaper',
        ctr: '1.45%',
        score: 97
      }
    ]
  }
];

export const SEED_SOCIAL_MENTIONS: SocialMention[] = [
  {
    id: 'men-1',
    platform: 'LinkedIn',
    channel: 'LinkedIn',
    author: 'Tariq Al-Mansoor',
    authorHandle: '@tariq-growth-cmo',
    followersCount: '48.2K',
    content: 'Just ran the Growth Diagnostic on our SaaS platform with @SigmaTactix. Uncovered 3 massive revenue leaks in our onboarding funnel and identified that Perplexity was citing our competitor 9x more. The 90-day roadmap generated is sharper than our previous agency’s 6-month deck.',
    contentSnippet: 'Just ran the Growth Diagnostic on our SaaS platform with @SigmaTactix. Uncovered 3 massive revenue leaks in our onboarding funnel...',
    sentiment: 'POSITIVE',
    timestamp: '18 mins ago',
    reach: 12400,
    reachEstimate: '12.4K Impressions',
    engagement: 418,
    suggestedAction: 'AMPLIFY',
    aiDraftReply: 'Appreciate the conviction, Tariq! Fixing that Perplexity citation gap with semantic schema and topical clusters will yield compounding pipeline. Our Authority agent is ready to dispatch the next sprint.',
    aiResponseDraft: 'Appreciate the conviction, Tariq! Fixing that Perplexity citation gap with semantic schema and topical clusters will yield compounding pipeline. Our Authority agent is ready to dispatch the next sprint.',
    requiresAttention: false
  },
  {
    id: 'men-2',
    platform: 'X / Twitter',
    channel: 'X (Twitter)',
    author: 'Elena Rostova',
    authorHandle: '@elena_dev_founder',
    followersCount: '19.5K',
    content: 'Can someone explain how @SigmaTactix Growth OS ensures AI agents don’t hallucinate or spend ad budget uncontrollably? Love the Second Brain concept, but who holds the keys?',
    contentSnippet: 'Can someone explain how @SigmaTactix Growth OS ensures AI agents don’t hallucinate or spend ad budget uncontrollably?',
    sentiment: 'NEUTRAL',
    timestamp: '1 hr ago',
    reach: 6800,
    reachEstimate: '6.8K Impressions',
    engagement: 92,
    suggestedAction: 'ENGAGE',
    aiDraftReply: 'Great architectural question Elena! Two non-negotiable guardrails: 1) Strict RBAC prompt scoping prevents agents from reading credentials or out-of-scope vaults. 2) Explicit Human-in-the-Loop state machines require admin approval for any budget change >$1,000 or public publish.',
    aiResponseDraft: 'Great architectural question Elena! Two non-negotiable guardrails: 1) Strict RBAC prompt scoping prevents agents from reading credentials or out-of-scope vaults. 2) Explicit Human-in-the-Loop state machines require admin approval for any budget change >$1,000 or public publish.',
    requiresAttention: true
  },
  {
    id: 'men-3',
    platform: 'Reddit',
    channel: 'Reddit',
    author: 'u/GrowthEngineer_99',
    authorHandle: 'r/SaaS',
    followersCount: 'Community (420k)',
    content: 'Has anyone migrated away from the standard Clay + Instantly spam stack to something with actual memory? Our domain reputation is tanking and prospect replies are getting furious.',
    contentSnippet: 'Has anyone migrated away from the standard Clay + Instantly spam stack to something with actual memory? Domain reputation is tanking...',
    sentiment: 'NEGATIVE',
    timestamp: '2 hrs ago',
    reach: 4500,
    reachEstimate: '4.5K Views',
    engagement: 64,
    suggestedAction: 'RESOLVE',
    aiDraftReply: 'Mass uncalibrated cold email is burning TAM across B2B tech. The solution is switching to an ICP-scored Second Brain that personalizes based on deep customer pain vectors rather than scraped superficial keywords.',
    aiResponseDraft: 'Mass uncalibrated cold email is burning TAM across B2B tech. The solution is switching to an ICP-scored Second Brain that personalizes based on deep customer pain vectors rather than scraped superficial keywords.',
    requiresAttention: true
  }
];

export const SEED_LEAD_PROSPECTS: LeadProspect[] = [
  {
    id: 'lead-1',
    name: 'Kareem Barakat',
    title: 'Chief Marketing Officer',
    company: 'FinApex Middle East',
    companyName: 'FinApex Middle East',
    industry: 'Fintech & WealthTech',
    companySize: '150-500 employees',
    employeeCount: '340 employees',
    estimatedArr: '$18.5M ARR',
    icpScore: 96,
    icpMatchScore: 96,
    buyingIntent: 'CRITICAL',
    email: 'k.barakat@finapex.ae',
    linkedinUrl: 'https://linkedin.com/in/kareem-barakat',
    status: 'SEQUENCE_ACTIVE',
    currentStep: 'Step 3: Bespoke Architectural Teardown Video',
    touchpointsCompleted: 3,
    triggerEvent: 'Just completed Growth Diagnostic Questionnaire with score 58/100 (High leak volume)',
    intentSignals: ['Growth Diagnostic: 58/100', 'Scaling in Saudi Arabia', 'Rising Meta CPA (+34%)'],
    personalizedHook: 'Noticed FinApex is scaling in KSA while your Meta CPA has risen 34% due to ad creative fatigue. We mapped a 90-day fix.',
    personalizedOutreachCopy: 'Noticed FinApex is scaling in KSA while your Meta CPA has risen 34% due to ad creative fatigue. We mapped a 90-day fix.'
  },
  {
    id: 'lead-2',
    name: 'Sarah Jenkins',
    title: 'VP of Growth & Acquisition',
    company: 'CloudLogix Software',
    companyName: 'CloudLogix Software',
    industry: 'Enterprise SaaS',
    companySize: '50-200 employees',
    employeeCount: '120 employees',
    estimatedArr: '$9.2M ARR',
    icpScore: 92,
    icpMatchScore: 92,
    buyingIntent: 'HIGH',
    email: 'sarah.jenkins@cloudlogix.io',
    linkedinUrl: 'https://linkedin.com/in/sarahjenkins-growth',
    status: 'MEETING_BOOKED',
    currentStep: 'Executive Demo Scheduled (Tomorrow 14:00 GST)',
    touchpointsCompleted: 4,
    triggerEvent: 'Cited on LinkedIn complaining about agency retainers and multi-touch attribution blindness',
    intentSignals: ['Agency Friction Post', 'Attribution Gap Flagged', 'Hiring Growth Lead'],
    personalizedHook: 'Your point about agency account turnover hitting team momentum resonated deeply. Here is how our Second Brain keeps permanent memory.',
    personalizedOutreachCopy: 'Your point about agency account turnover hitting team momentum resonated deeply. Here is how our Second Brain keeps permanent memory.'
  },
  {
    id: 'lead-3',
    name: 'Faisal Al-Otaibi',
    title: 'Chief Executive Officer',
    company: 'Dar Real Estate Technologies',
    companyName: 'Dar Real Estate Technologies',
    industry: 'PropTech / Real Estate',
    companySize: '200-1000 employees',
    employeeCount: '580 employees',
    estimatedArr: '$42M ARR',
    icpScore: 98,
    icpMatchScore: 98,
    buyingIntent: 'CRITICAL',
    email: 'faisal@darproptech.sa',
    linkedinUrl: 'https://linkedin.com/in/faisal-alotaibi',
    status: 'REPLIED',
    currentStep: 'Replied to Step 2: "Can you send the full Second Brain schema?"',
    touchpointsCompleted: 2,
    triggerEvent: 'Expanding aggressively into Riyadh; spending $80k/mo on Google Search with zero AEO visibility',
    intentSignals: ['High Ad Spend ($80k/mo)', 'Zero Perplexity Citations', 'Riyadh Expansion'],
    personalizedHook: 'Dar PropTech has zero citations in Perplexity when buyers search luxury real estate Riyadh. Our Authority agent fixes that in 45 days.',
    personalizedOutreachCopy: 'Dar PropTech has zero citations in Perplexity when buyers search luxury real estate Riyadh. Our Authority agent fixes that in 45 days.'
  }
];

export const SEED_MARKETING_LEARNINGS: MarketingLearningItem[] = [
  {
    id: 'learn-1',
    date: 'Today, 14:20',
    dateAdded: 'Today, 14:20',
    author: 'Zayd Hamdan (Head of Performance)',
    source: 'Paid Media Testing Loop',
    category: 'WINNING_HOOK',
    title: 'Stop Renting Agency Headcount vs. Own a Permanent Growth Asset',
    insight: 'Framing Growth OS around "Stop Renting Agency Headcount, Own a Permanent Growth Asset" delivers 2.8x higher qualified demo requests than generic "AI Marketing Automation" messaging.',
    finding: 'Framing Growth OS around "Stop Renting Agency Headcount, Own a Permanent Growth Asset" delivers 2.8x higher qualified demo requests than generic "AI Marketing Automation" messaging.',
    evidenceMetric: '+180% demo conversion lift across LinkedIn sponsored campaigns ($42 CPA vs $118 CPA baseline).',
    confidenceScore: 98,
    actionTaken: 'Synchronized Brand Vault positioning vector. Content Engine instructed to prioritize the "Permanent Asset vs. Rented Labor" mental model.',
    targetVault: 'Brand Vault',
    syncStatus: 'SYNCED_TO_BRAIN'
  },
  {
    id: 'learn-2',
    date: 'Yesterday, 11:05',
    dateAdded: 'Yesterday, 11:05',
    author: 'Amina Nour (Customer Research Lead)',
    source: 'CFO Discovery Calls',
    category: 'OBJECTION_OVERCOME',
    title: 'HITL Budget Guardrails Collapse Enterprise Sales Cycles',
    insight: 'Mid-market CFOs consistently worry about runaway AI spending on paid ads. Highlighting our strict $1,000 Human-in-the-Loop approval gate collapses sales cycle by 12 days.',
    finding: 'Mid-market CFOs consistently worry about runaway AI spending on paid ads. Highlighting our strict $1,000 Human-in-the-Loop approval gate collapses sales cycle by 12 days.',
    evidenceMetric: 'Closed 2 enterprise deals immediately after presenting the HITL transaction ledger architecture.',
    confidenceScore: 96,
    actionTaken: 'Updated Customer Vault objection matrix with concrete HITL ledger slides and verification screenshots.',
    targetVault: 'Customer Vault',
    syncStatus: 'SYNCED_TO_BRAIN'
  },
  {
    id: 'learn-3',
    date: '3 days ago',
    dateAdded: '3 days ago',
    author: 'Marcus Vance (Authority & SEO Lead)',
    source: 'AEO Reverse Engineering',
    category: 'AUDIENCE_DISCOVERY',
    title: 'Structured FAQPage Schema Boosts AI Engine Citations',
    insight: 'Perplexity AI heavily cites websites featuring structured FAQPage schema combined with empirical case-study benchmarks rather than generic informational definitions.',
    finding: 'Perplexity AI heavily cites websites featuring structured FAQPage schema combined with empirical case-study benchmarks rather than generic informational definitions.',
    evidenceMetric: 'Brand citation jumped from 42% to 88% in 14 days following technical schema injection.',
    confidenceScore: 94,
    actionTaken: 'Committed new JSON-LD automated generation script to Authority Vault and Website Vault.',
    targetVault: 'Authority Vault',
    syncStatus: 'SYNCED_TO_BRAIN'
  }
];

export const DIGITAL_INTEGRATIONS_CATALOG: DigitalIntegrationItem[] = [
  // Social Channels
  {
    id: 'int-social-1',
    name: 'LinkedIn Enterprise Marketing',
    category: 'SOCIAL_CHANNEL',
    iconName: 'Linkedin',
    description: 'Direct publishing to Company Pages, executive profiles, and Sponsored Content campaign sync.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Real-time Webhook',
    lastSync: '2 mins ago',
    targetVault: 'Marketing Vault',
    apiVersion: 'v2026.04',
    features: ['Carousel Publishing', 'Sponsored Campaign Analytics', 'Executive Ghostwriting Sync', 'Lead Gen Form Ingestion']
  },
  {
    id: 'int-social-2',
    name: 'X / Twitter API v2 (Pro)',
    category: 'SOCIAL_CHANNEL',
    iconName: 'Twitter',
    description: 'High-frequency brand mention listening, viral thread distribution, and real-time social sentiment streaming.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Every 5 mins',
    lastSync: '4 mins ago',
    targetVault: 'Marketing Vault',
    apiVersion: 'v2.8 Stream',
    features: ['Thread Auto-Scheduler', 'Sentiment Keyword Triggers', 'Viral Hook Ingestion', 'AI Auto-Reply Drafter']
  },
  {
    id: 'int-social-3',
    name: 'Meta Graph API (Instagram & Facebook)',
    category: 'SOCIAL_CHANNEL',
    iconName: 'Share2',
    description: 'Instagram Reels, carousel publishing, DM lead qualification, and Facebook Page synchronization.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Every 15 mins',
    lastSync: '12 mins ago',
    targetVault: 'Marketing Vault',
    apiVersion: 'v21.0',
    features: ['Reels Storyboard Publishing', 'Direct Message AI SDR', 'Ad Creative Asset Mirroring']
  },
  {
    id: 'int-social-4',
    name: 'YouTube Data & Shorts API',
    category: 'SOCIAL_CHANNEL',
    iconName: 'Video',
    description: 'Automated video publishing, YouTube Shorts scheduling, and community comment sentiment analysis.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Hourly',
    lastSync: '45 mins ago',
    targetVault: 'Marketing Vault',
    apiVersion: 'v3.0',
    features: ['Shorts Auto-Publishing', 'Transcripts Ingestion for RAG', 'CTR & Retention Telemetry']
  },
  {
    id: 'int-social-5',
    name: 'Reddit Enterprise API',
    category: 'SOCIAL_CHANNEL',
    iconName: 'MessageSquare',
    description: 'Subreddit social listening, brand perception monitoring, and high-intent buyer question discovery.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Every 30 mins',
    lastSync: '18 mins ago',
    targetVault: 'Customer Vault',
    apiVersion: 'v2.1',
    features: ['High-Intent Keyword Alert', 'Subreddit Pain Point Mining', 'Sentiment Telemetry']
  },

  // Ad Networks
  {
    id: 'int-ads-1',
    name: 'Google Ads Marketing Platform',
    category: 'AD_NETWORK',
    iconName: 'Target',
    description: 'Search, Performance Max, and Display ad bidding management, RSA creation, and negative keyword sync.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Every 15 mins',
    lastSync: '10 mins ago',
    targetVault: 'Marketing Vault',
    apiVersion: 'v18',
    features: ['Automated Bid Optimization', 'Negative Keyword Miner', 'RSA Asset Generation', 'CPA Drift Detection']
  },
  {
    id: 'int-ads-2',
    name: 'Meta Ads Manager API',
    category: 'AD_NETWORK',
    iconName: 'BarChart2',
    description: 'Full campaign lifecycle orchestration, dynamic creative testing, and Conversions API (CAPI) server sync.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Every 15 mins',
    lastSync: '7 mins ago',
    targetVault: 'Marketing Vault',
    apiVersion: 'v21.0',
    features: ['Creative Fatigue Sentinel', 'Conversions API (CAPI)', 'Lookalike Audience Builder', 'ROAS Budget Re-allocator']
  },
  {
    id: 'int-ads-3',
    name: 'LinkedIn Campaign Manager',
    category: 'AD_NETWORK',
    iconName: 'Users',
    description: 'B2B demographic targeting, Matched Audiences CRM sync, and Sponsored InMail delivery.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Every 30 mins',
    lastSync: '22 mins ago',
    targetVault: 'Marketing Vault',
    apiVersion: 'v2026.04',
    features: ['Job Title & Industry Targeting', 'Matched Audience CRM Ingestion', 'Lead Form Auto-Sync']
  },
  {
    id: 'int-ads-4',
    name: 'TikTok Ads API',
    category: 'AD_NETWORK',
    iconName: 'Sparkles',
    description: 'Short-form video ad performance, sound and hook trend discovery, and Spark Ads booster.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Hourly',
    lastSync: '35 mins ago',
    targetVault: 'Marketing Vault',
    apiVersion: 'v1.3',
    features: ['Trending Hook Detector', 'Spark Ads Management', 'ROAS Attribution']
  },

  // Marketing & CRM Tools
  {
    id: 'int-tool-1',
    name: 'HubSpot Enterprise CRM',
    category: 'MARKETING_TOOL',
    iconName: 'Database',
    description: 'Bi-directional contact lifecycle synchronization, deal stage progression, and marketing email telemetry.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Real-time Webhook',
    lastSync: 'Just now',
    targetVault: 'Customer Vault',
    apiVersion: 'v3',
    features: ['Deal Stage State Machine', 'Contact Vector Enrichment', 'Speed-to-Lead Acceleration', 'Closed-Won Feedback Loop']
  },
  {
    id: 'int-tool-2',
    name: 'Google Analytics 4 (GA4)',
    category: 'MARKETING_TOOL',
    iconName: 'TrendingUp',
    description: 'Real-time web traffic, event-level landing page dropoff telemetry, and conversion attribution modeling.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Real-time Stream',
    lastSync: '1 min ago',
    targetVault: 'Website Vault',
    apiVersion: 'Data API v1beta',
    features: ['Funnel Dropoff Calculator', 'Attribution Modeling', 'Page Engagement Velocity', 'Bounce Anomaly Alerts']
  },
  {
    id: 'int-tool-3',
    name: 'Google Search Console (GSC)',
    category: 'MARKETING_TOOL',
    iconName: 'Search',
    description: 'Organic search query impressions, CTR, position tracking, and sitemap indexation health.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Every 2 hours',
    lastSync: '1 hr ago',
    targetVault: 'Authority Vault',
    apiVersion: 'v1',
    features: ['Query Entity Extraction', 'Cannibalization Detection', 'Impression Velocity Tracker', 'AEO Gap Discoveries']
  },
  {
    id: 'int-tool-4',
    name: 'Salesforce Sales Cloud',
    category: 'MARKETING_TOOL',
    iconName: 'Cloud',
    description: 'Enterprise pipeline management, account-based marketing (ABM) intent scores, and contract values.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Every 30 mins',
    lastSync: '15 mins ago',
    targetVault: 'Customer Vault',
    apiVersion: 'REST v60.0',
    features: ['Account Intent Mapping', 'Opportunity Stage Sync', 'LTV Attribution Modeling']
  },

  // Model Context Protocols (MCPs)
  {
    id: 'int-mcp-1',
    name: 'PostgreSQL & pgvector MCP Server',
    category: 'MCP_PROTOCOL',
    iconName: 'Server',
    description: 'Direct Model Context Protocol server exposing relational Second Brain tables and 1,536-dim vector searches to LLM swarms.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Persistent RPC',
    lastSync: 'Real-time Active',
    targetVault: 'AI Workflow Vault',
    protocolDetails: 'mcp://localhost:5432/second_brain_vectors',
    apiVersion: 'MCP Spec 1.0',
    features: ['Semantic Vector Search', 'Tenancy RLS Enforcer', 'Table Schema Inspection', 'Audit Log Writer']
  },
  {
    id: 'int-mcp-2',
    name: 'Brave Search & Web Crawler MCP',
    category: 'MCP_PROTOCOL',
    iconName: 'Globe',
    description: 'Privacy-first search index and live website scraper feeding competitor research and topical maps.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'On-Demand Task',
    lastSync: '5 mins ago',
    targetVault: 'Authority Vault',
    protocolDetails: 'mcp://brave-search-api',
    apiVersion: 'MCP Spec 1.0',
    features: ['Live Competitor Scraping', 'SERP Answer Aggregator', 'Fresh Entity Retrieval', 'Anti-Bot Bypass']
  },
  {
    id: 'int-mcp-3',
    name: 'Filesystem & Document Intake MCP',
    category: 'MCP_PROTOCOL',
    iconName: 'FileText',
    description: 'Secure sandbox filesystem connector extracting text and tables from client onboarding PDFs, spreadsheets, and SOPs.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Persistent',
    lastSync: 'Active',
    targetVault: 'Operations Vault',
    protocolDetails: 'mcp://vault-filesystem/intake',
    apiVersion: 'MCP Spec 1.0',
    features: ['PDF Document Chunking', 'Excel / CSV Tabular Extraction', 'Markdown Normalizer', 'SHA-256 Hash Verification']
  },
  {
    id: 'int-mcp-4',
    name: 'Slack Notification & HITL MCP',
    category: 'MCP_PROTOCOL',
    iconName: 'MessageCircle',
    description: 'Model Context Protocol connecting agent execution streams to executive Slack channels for one-click approval buttons.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Persistent WebSocket',
    lastSync: 'Active',
    targetVault: 'Operations Vault',
    protocolDetails: 'mcp://slack-hitl-bridge',
    apiVersion: 'MCP Spec 1.0',
    features: ['One-Click HITL Approve/Reject', 'Emergency Pause Trigger', 'Daily Executive Growth Digest', 'Alert Escalation']
  },

  // Apps & Plugins
  {
    id: 'int-app-1',
    name: 'WordPress REST & Headless CMS',
    category: 'APP_PLUGIN',
    iconName: 'Cpu',
    description: 'Direct automated publishing of technical articles, case studies, and JSON-LD schema to WordPress engines.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'On-Demand Publish',
    lastSync: 'Yesterday',
    targetVault: 'Website Vault',
    apiVersion: 'WP REST v2',
    features: ['One-Click Article Publishing', 'Yoast / RankMath Schema Injection', 'Featured Image Attachment', 'Category Auto-Tagging']
  },
  {
    id: 'int-app-2',
    name: 'Notion Knowledge Sync',
    category: 'APP_PLUGIN',
    iconName: 'BookOpen',
    description: 'Two-way synchronization between client Notion workspaces and the Second Brain Operations Vault.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Hourly',
    lastSync: '28 mins ago',
    targetVault: 'Operations Vault',
    apiVersion: 'Notion API 2022-06-28',
    features: ['SOP Database Mirroring', 'Brand Guidelines Sync', 'Roadmap Milestone Tracking']
  },
  {
    id: 'int-app-3',
    name: 'Shopify Plus Connector',
    category: 'APP_PLUGIN',
    iconName: 'ShoppingBag',
    description: 'E-commerce product catalog, customer lifetime value (LTV), cart abandonment, and SKU performance ingestion.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Real-time Webhook',
    lastSync: '6 mins ago',
    targetVault: 'Customer Vault',
    apiVersion: 'Admin GraphQL 2026-04',
    features: ['Abandoned Cart AI SDR Trigger', 'LTV Customer Cohort Extraction', 'SKU Performance Sync']
  },
  {
    id: 'int-app-4',
    name: 'Stripe Billing & Revenue Telemetry',
    category: 'APP_PLUGIN',
    iconName: 'CreditCard',
    description: 'MRR/ARR growth rate, churn velocity, subscription upgrades, and verified customer transaction telemetry.',
    connectionStatus: 'CONNECTED',
    syncFrequency: 'Real-time Webhook',
    lastSync: '12 mins ago',
    targetVault: 'Executive Vault',
    apiVersion: 'Stripe 2025-01-15',
    features: ['Verified MRR Reporting', 'Churn Warning Signals', 'Unit Economics Synchronization', 'Enterprise Invoicing']
  }
];
