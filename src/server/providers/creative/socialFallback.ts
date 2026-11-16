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

export interface SocialFallbackParams {
  channel: 'LinkedIn' | 'X_Thread' | 'Instagram' | 'YouTube_Shorts';
  topic: string;
  targetAudience?: string;
  tone?: string;
}

export interface SocialFallbackResult {
  channel: 'LinkedIn' | 'X_Thread' | 'Instagram' | 'YouTube_Shorts';
  topic: string;
  hook: string;
  caption?: string;
  slides?: CarouselSlide[];
  threadTweets?: TweetItem[];
  shortsScenes?: ShortsScene[];
  loopCta?: string;
  hashtags?: string[];
  source: 'local-template';
}

export function generateFallbackSocialCampaignServer(params: SocialFallbackParams): SocialFallbackResult {
  const { channel, topic, targetAudience } = params;
  const audience = targetAudience || 'B2B Tech Founders & Revenue Leaders';

  if (channel === 'LinkedIn' || channel === 'Instagram') {
    const slides: CarouselSlide[] = [
      {
        slideNumber: 1,
        badge: 'EXECUTIVE PLAYBOOK',
        title: topic,
        subtitle: `Strategic teardown for ${audience}`,
        contentPoints: [
          'Why the legacy agency model breaks under pressure.',
          'The 3 structural errors costing founders 30%+ in pipeline velocity.',
          'The client-owned sovereign framework to dominate.'
        ],
        takeaway: 'Rented agency headcount evaporates. Owned infrastructure compounds.',
        visualCue: 'Obsidian glass card with glowing amber diagnostic vectors'
      },
      {
        slideNumber: 2,
        badge: 'THE HARD TRUTH',
        title: 'The Negative Compounding Trap',
        subtitle: 'Why retainers deliver diminishing returns',
        contentPoints: [
          'Junior agency account managers rotate every 9 months.',
          'Positioning nuance and customer objection history get wiped out.',
          'You pay $15k-$30k/mo to continuously retrain outside vendors.'
        ],
        takeaway: 'If you terminate the contract and your growth stops, you never owned an engine.',
        visualCue: 'Decay curve illustrating lost institutional knowledge vs retainer fees'
      },
      {
        slideNumber: 3,
        badge: 'THE ARCHITECTURE',
        title: 'The Sovereign Growth Alternative',
        subtitle: 'Deploying an AI-native Second Brain into your cloud',
        contentPoints: [
          'Permanent Brand & Customer Vaults storing all positioning vectors.',
          'Autonomous agent swarms executing CRO, SEO, and paid ad testing in parallel.',
          'Human-in-the-Loop approval queue guaranteeing 100% brand safety.'
        ],
        takeaway: 'Zero knowledge evaporation. Instant execution at code speed.',
        visualCue: 'Second Brain neural core diagram with 10 glowing permissioned vaults'
      },
      {
        slideNumber: 4,
        badge: 'TACTICAL STEP 1',
        title: 'Audit Digital Leaks First',
        subtitle: 'Stop pouring ad budget into a leaky bucket',
        contentPoints: [
          'Measure dark social & AI search attribution instead of last-click search.',
          'Audit inbound lead latency — any delay over 5 minutes cuts close rates by 10x.',
          'Reconcile multi-channel CAC against actual closed-won revenue.'
        ],
        takeaway: 'Diagnose before you prescribe. Measure true unit economics.',
        visualCue: 'Diagnostic radar chart flagging attribution blindness and latency drag'
      },
      {
        slideNumber: 5,
        badge: 'TACTICAL STEP 2',
        title: 'Topical Authority & AEO Mastery',
        subtitle: 'Own the generative answer engine recommendations',
        contentPoints: [
          'Perplexity & ChatGPT now answer 58%+ of executive software queries.',
          'Traditional keywords are dead; entity knowledge graphs win.',
          'Publish authoritative technical teardowns that AI citation engines cite.'
        ],
        takeaway: 'Be the primary source of category truth, not generic blog filler.',
        visualCue: 'Search generative experience card highlighting your brand as #1 citation'
      },
      {
        slideNumber: 6,
        badge: 'THE SOVEREIGN MOVE',
        title: 'Stop Renting. Start Owning.',
        subtitle: 'Build your client enclave today',
        contentPoints: [
          'Deploy your sovereign Growth OS on your AWS or Google Cloud infrastructure.',
          'Enforce strict Row-Level Security across all 10 knowledge vaults.',
          'Cut CAC by 40% and eliminate agency dependency permanently.'
        ],
        takeaway: 'The highest-leverage investment a founder can make is in sovereign intelligence equity.',
        visualCue: 'Minimalist terminal chrome showing active autonomous swarms with verified status'
      }
    ];

    return {
      channel,
      topic,
      hook: `Most ${audience} believe their CAC is rising because "ad platforms got harder."\n\nWrong. Your pipeline is leaking through structural friction. Here is the operational teardown:`,
      caption: `Most ${audience} believe their CAC is rising because "ad platforms got harder."\n\nWrong.\n\nYour pipeline is leaking through 3 invisible cracks:\n1. Attribution blindness\n2. Creative fatigue\n3. Inbound latency drag\n\nSwipe through for the empirical autopsy and sovereign architecture framework.`,
      slides,
      hashtags: ['#B2BGrowth', '#GrowthOS', '#AIAgents', '#SigmaTactix'],
      source: 'local-template'
    };
  }

  if (channel === 'YouTube_Shorts') {
    const shortsScenes: ShortsScene[] = [
      {
        timeCode: '0:00 - 0:03',
        visualDirection: 'Fast macro push-in on an alert banner: "CAC SPIKE +34%". Presenter looks directly into camera.',
        sfxCue: 'Deep digital bass drop + alert ping',
        voiceover: 'If your company is still paying a $20k monthly agency retainer, you are getting fleeced.',
        screenText: 'The $20K Agency Retainer Trap 🚨'
      },
      {
        timeCode: '0:03 - 0:15',
        visualDirection: 'Rapid cut to kinetic text: "Junior staff rotates every 9 months. Zero institutional memory stays."',
        sfxCue: 'Quick paper-tear whoosh + subtle heartbeat riser',
        voiceover: 'They assign junior account managers who rotate every nine months. When they leave, all your positioning learnings evaporate.',
        screenText: 'Context Evaporates Every 9 Months 📉'
      },
      {
        timeCode: '0:15 - 0:35',
        visualDirection: 'Fast 3D orbital push into glowing Second Brain core with 10 amber permissioned vaults rotating.',
        sfxCue: 'Futuristic digital power-up hum + whoosh transition',
        voiceover: 'Top tech founders are doing something radically different. They install an AI-native Growth OS directly into their own cloud. Permanent memory. Scoped agent swarms.',
        screenText: 'The Fix: Client-Owned Second Brain 🧠'
      },
      {
        timeCode: '0:35 - 0:50',
        visualDirection: 'Screen recording showing an agent diagnosing 5 conversion leaks, rewriting ad hooks, and scheduling a carousel in 8 seconds.',
        sfxCue: 'Keyboard typing click stream + success chime',
        voiceover: 'Content, AEO visibility, and ad creative optimization run at the speed of code under strict human guardrails. You cut your CAC by 40%.',
        screenText: 'Speed of Code: 40% CAC Reduction ⚡️'
      },
      {
        timeCode: '0:50 - 1:00',
        visualDirection: 'Loop transition: presenter points to link below with seamless loop back to opening line.',
        sfxCue: 'Clean rising synth swell',
        voiceover: 'Stop renting your intelligence. Own it. Run your free diagnostic at the link in bio, and subscribe for more empirical teardowns.',
        screenText: 'sigmatactix.com // Subscribe ➔'
      }
    ];

    return {
      channel: 'YouTube_Shorts',
      topic,
      hook: 'If your company is still paying a $20k monthly agency retainer, you are getting fleeced.',
      shortsScenes,
      loopCta: 'Stop renting your intelligence. Own it. Run your free diagnostic at sigmatactix.com',
      hashtags: ['#Shorts', '#GrowthHacking', '#AIAgents', '#BusinessGrowth', '#SigmaTactix'],
      source: 'local-template'
    };
  }

  // Channel: X_Thread
  const threadTweets: TweetItem[] = [
    {
      tweetNumber: 1,
      text: `Most ${audience} believe their CAC is rising because "ad platforms got harder."\n\nWrong.\n\nYour pipeline is leaking through 5 invisible structural cracks.\n\nHere is the empirical autopsy (and the sovereign system to fix it): 🧵👇`,
      charCount: 228
    },
    {
      tweetNumber: 2,
      text: `1/ Attribution Blindness\n\nTracking last-click conversions means 80%+ of dark social, podcast, and AI answer engine touchpoints get zero credit.\n\nYou keep cutting the brand channels that spark buying intent to fund brand search.\n\nFix: Blend platform CAC with sovereign telemetry.`,
      charCount: 279
    },
    {
      tweetNumber: 3,
      text: `2/ Creative Hook Decay\n\nWhen Meta or LinkedIn frequency passes 3.5x, your CTR plummets 28% while CPMs spike.\n\nAgencies take 3 weeks to design 2 fresh banners.\n\nFix: Scoped AI swarms synthesizing 20+ angle variations, hook teardowns, and visual assets weekly under HITL review.`,
      charCount: 276
    },
    {
      tweetNumber: 4,
      text: `3/ Zero Generative Engine (AEO) Visibility\n\n58% of software buyers now ask Perplexity, Gemini, or ChatGPT for category comparisons.\n\nIf your site lacks deep semantic graph indexing, AI engines cite your competitors 8x more.\n\nFix: Build entity schemas & authoritative nodes.`,
      charCount: 278
    },
    {
      tweetNumber: 5,
      text: `4/ Inbound Latency Drag\n\nIf your sales team takes 4+ hours to contact an inbound demo lead, your close rate drops by 10x.\n\nBuyers are looking for solutions NOW.\n\nFix: AI agent qualification that enriches the lead and books calendar slots in under 60 seconds.`,
      charCount: 254
    },
    {
      tweetNumber: 6,
      text: `5/ The Fragmented Tooling Tax\n\n12 disparate SaaS subscriptions. Zero shared memory. When agency staff turns over every 9 months, all your accumulated positioning nuance disappears.\n\nFix: Install an enterprise Second Brain directly into your cloud. Permanent equity.`,
      charCount: 269
    },
    {
      tweetNumber: 7,
      text: `Summary:\n\nRenting headcount guarantees negative compounding.\n\nInstalling an AI-native Growth OS guarantees permanent intelligence, lower CAC, and automated execution.\n\nBookmark this thread 🔖 and follow @SigmaTactix for empirical B2B teardowns.`,
      charCount: 247
    }
  ];

  return {
    channel: 'X_Thread',
    topic,
    hook: threadTweets[0].text,
    threadTweets,
    hashtags: ['#GrowthOS', '#B2BTech', '#AIAgents', '#SigmaTactix'],
    source: 'local-template'
  };
}
