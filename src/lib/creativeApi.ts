import { apiFetch } from './api';
import { CarouselSlide, TweetItem, ShortsScene, SocialCampaignData } from '@/src/data/marketingModulesData';

export interface GenerateImageParams {
  prompt: string;
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:5';
  stylePreset?: string;
  negativePrompt?: string;
  enhancePrompt?: boolean;
  promptEnhancer?: 'none' | 'gemini' | 'ollama' | 'lmstudio';
  enhancerModel?: string;
  preferredProvider?: string;
  modelId?: string;
}

export interface GenerateImageResult {
  imageUrl: string;
  enhancedPrompt: string;
  aspectRatio: string;
  seed: number;
  provider: string;
  modelName?: string;
  source?: string;
  promptEnhancer?: string;
}

export interface GenerateVideoParams {
  prompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  durationSeconds?: number;
  sourceImageUrl?: string;
  stylePreset?: string;
  motionIntensity?: 'subtle' | 'dynamic' | 'cinematic';
  preferredProvider?: string;
  modelId?: string;
}

export interface GenerateVideoResult {
  videoUrl: string;
  thumbnailUrl: string;
  prompt: string;
  aspectRatio: string;
  durationSeconds: number;
  provider: string;
  modelName?: string;
  source?: string;
}

export interface CreativeProviderStatus {
  provider: string;
  name: string;
  configured: boolean;
  active: boolean;
  tier: string;
  supportedModals: string[];
  description: string;
}

export interface GenerateSocialParams {
  channel: 'LinkedIn' | 'X_Thread' | 'Instagram' | 'YouTube_Shorts';
  topic: string;
  targetAudience?: string;
  tone?: string;
}

export interface GenerateSocialResult {
  channel: 'LinkedIn' | 'X_Thread' | 'Instagram' | 'YouTube_Shorts';
  topic: string;
  hook: string;
  caption?: string;
  slides?: CarouselSlide[];
  threadTweets?: TweetItem[];
  shortsScenes?: ShortsScene[];
  loopCta?: string;
  hashtags?: string[];
  rawMarkdown?: string;
  source?: 'gemini';
}

export interface BrandCreativeStylePreset {
  id: string;
  label: string;
  desc: string;
  source: 'brand_vault' | 'sigma_default';
}

export async function getCreativeProvidersStatus(): Promise<CreativeProviderStatus[]> {
  try {
    const res = await apiFetch('/api/creative/providers/status');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.providers)) {
        return data.providers;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch creative providers status:', err);
  }
  return [];
}

export async function generateCreativeImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const res = await apiFetch('/api/creative/generate-image', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.imageUrl) throw new Error(data.error || 'Image generation is unavailable. Configure a verified provider and try again.');
  return data;
}

export async function generateCreativeVideo(params: GenerateVideoParams): Promise<GenerateVideoResult> {
  const res = await apiFetch('/api/creative/generate-video', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.videoUrl) throw new Error(data.error || 'Generative video is unavailable. Use an approved HyperFrames render or configure a verified video provider.');
  return data;
}

export async function queueDeterministicRender(params: { title: string; subtitle?: string; cta?: string; aspectRatio?: '16:9' | '9:16' | '1:1'; durationSeconds?: number }) {
  const res = await apiFetch('/api/workspace/creative/renders', { method: 'POST', body: JSON.stringify(params) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not queue deterministic render.');
  return data as { success: true; task: { id: string; status: string } };
}

export interface GenerateTextParams {
  topic: string;
  format?: string;
  targetAudience?: string;
  antiSlop?: boolean;
}

export interface GenerateTextResult {
  content: string;
  title: string;
  format: string;
  audience: string;
  /** 'gemini' = model output; 'local-template' = deterministic local template. */
  engine: 'gemini' | 'local-template';
}

export async function generateTextContent(params: GenerateTextParams): Promise<GenerateTextResult> {
  const res = await apiFetch('/api/creative/generate-text', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.content !== 'string') {
    throw new Error(data.error || 'Text generation did not return content.');
  }
  return {
    content: data.content,
    title: data.title || params.topic,
    format: data.format || params.format || 'LONG_FORM',
    audience: data.audience || params.targetAudience || '',
    engine: data.engine === 'gemini' ? 'gemini' : 'local-template',
  };
}

export async function generateSocialCampaign(params: GenerateSocialParams): Promise<GenerateSocialResult> {
  const res = await apiFetch('/api/creative/generate-social', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.result) throw new Error(data.error || 'Social generation did not return a provider-backed result.');
  return { ...data.result, source: data.source };
}

export async function getBrandCreativeStylePresets(): Promise<BrandCreativeStylePreset[]> {
  const res = await apiFetch('/api/creative/brand-style-presets');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.presets)) throw new Error(data.error || 'Could not load Brand Vault style presets.');
  return data.presets;
}

export function generateFallbackSocialCampaign(params: GenerateSocialParams): GenerateSocialResult {
  const { channel, topic, targetAudience } = params;
  const audience = targetAudience || 'B2B Tech Founders & Revenue Leaders';

  if (channel === 'LinkedIn') {
    const slides: CarouselSlide[] = [
      {
        slideNumber: 1,
        badge: 'EXECUTIVE PLAYBOOK',
        title: topic,
        subtitle: `Strategic teardown for ${audience}`,
        contentPoints: [
          'Why the legacy playbook fails in 2026.',
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
        badge: 'TACTICAL STEP 3',
        title: 'Continuous Creative Velocity',
        subtitle: 'Synthesize 20+ angle tests every 72 hours',
        contentPoints: [
          'Meta & LinkedIn creative fatigue sets in at 3.5x frequency.',
          'Use scoped AI creative agents to formulate counter-intuitive hooks.',
          'Test pain points, empirical data, and case proof simultaneously.'
        ],
        takeaway: 'Creative velocity is the single largest lever in paid media ROAS.',
        visualCue: 'Split-testing matrix showing CTR lift from rapid hook variations'
      },
      {
        slideNumber: 7,
        badge: 'SOVEREIGN EXECUTION',
        title: 'The Takeaway for Operators',
        subtitle: 'Build systems you own forever',
        contentPoints: [
          'Stop leasing your business velocity to human agencies.',
          'Install permanent intelligence directly into your stack.',
          'Let agents handle repetitive tasks while humans steer high-level strategy.'
        ],
        takeaway: 'The future belongs to founders who own their intelligence engine.',
        visualCue: 'Sigma Tactix Growth OS badge radiating active production telemetry'
      }
    ];

    const hook = `Most ${audience} believe their growth bottlenecks are caused by "market headwinds."

In reality, they are trapped in a negative-compounding cycle of rented headcount.

Here is the exact framework to install an owned growth infrastructure (and reclaim 40% of your CAC): ⬇️`;

    return {
      channel: 'LinkedIn',
      topic,
      hook,
      slides,
      hashtags: ['#B2BGrowth', '#GrowthOS', '#AIAgents', '#RevenueOperations', '#SigmaTactix']
    };
  }

  if (channel === 'Instagram') {
    const slides: CarouselSlide[] = [
      {
        slideNumber: 1,
        badge: 'GROWTH BLUEPRINT',
        title: topic,
        subtitle: 'Swipe for the step-by-step breakdown ➔',
        contentPoints: [
          'Stop burning budget on outdated marketing models.',
          'Here is the exact playbook top operators use.',
          'Save this post for your next quarterly review 📌'
        ],
        takeaway: 'Swipe to see the full architecture.',
        visualCue: 'High-contrast dark obsidian cover with bold amber typography'
      },
      {
        slideNumber: 2,
        badge: 'STEP 01',
        title: 'The Hidden CAC Trap',
        subtitle: 'Why your cost per acquisition is quietly climbing',
        contentPoints: [
          'Fragmented tools that do not share memory.',
          'Agency retainers that produce zero durable IP.',
          'Last-click attribution masking actual buyer intent.'
        ],
        takeaway: 'Identify the leak before spending another dollar.',
        visualCue: 'Graph showing CAC climbing while conversion drops'
      },
      {
        slideNumber: 3,
        badge: 'STEP 02',
        title: 'The AI Growth OS',
        subtitle: 'What client-owned infrastructure looks like',
        contentPoints: [
          'A centralized Second Brain with brand & ICP vaults.',
          'Autonomous agent swarms executing daily audits.',
          '100% Human-in-the-Loop review before publishing.'
        ],
        takeaway: 'Permanent intelligence that gets smarter every day.',
        visualCue: 'Holographic glowing vault core'
      },
      {
        slideNumber: 4,
        badge: 'STEP 03',
        title: 'Execution Velocity',
        subtitle: 'From 3 weeks to 3 minutes',
        contentPoints: [
          'Multi-channel creative variations generated in seconds.',
          'AEO entity schemas published directly to CMS.',
          'Inbound leads enriched and scheduled instantly.'
        ],
        takeaway: 'Speed of execution wins every modern market.',
        visualCue: 'Velocity stopwatch showing 99% reduction in turnaround time'
      },
      {
        slideNumber: 5,
        badge: 'SAVE & APPLY',
        title: 'Ready to Own Your Growth?',
        subtitle: 'Follow @sigmatactix for daily engineering breakdowns',
        contentPoints: [
          'Drop a comment below: What is your biggest growth bottleneck?',
          'Share this with a founder who needs to see this.',
          'Link in bio to run your instant Growth OS diagnostic.'
        ],
        takeaway: 'Build assets you own, not retainers you rent.',
        visualCue: 'Sigma Tactix brand emblem with call-to-action arrow'
      }
    ];

    const caption = `Stop renting your growth engine. 🛑

When you rely exclusively on outsourced agency retainers, you are leasing headcount that turns over every 9 months. With them goes your positioning nuance, ad test data, and competitive advantage.

Swipe through the carousel above to see how modern B2B operators install an AI-native Growth OS directly into their cloud. 

Which slide hit closest to home? Drop a comment below 👇

#B2BMarketing #GrowthHacking #AIAgents #SigmaTactix #SaaSGrowth #FounderTips`;

    return {
      channel: 'Instagram',
      topic,
      hook: 'Stop renting your growth engine.',
      caption,
      slides,
      hashtags: ['#GrowthOS', '#B2BMarketing', '#AIAgents', '#SigmaTactix', '#Founder']
    };
  }

  if (channel === 'YouTube_Shorts') {
    const shortsScenes: ShortsScene[] = [
      {
        timeCode: '0:00 - 0:03',
        visualDirection: 'Rapid zoom onto a desk overflowing with $25k agency invoices and 40 open browser tabs.',
        sfxCue: 'Deep sub-bass drop + high-frequency glitch static',
        voiceover: 'If your company is still paying a $20k monthly agency retainer, you are getting fleeced.',
        screenText: 'STOP RENTING HEADCOUNT 🚨'
      },
      {
        timeCode: '0:03 - 0:15',
        visualDirection: 'Hard cut to red warning screen: attribution graphs plummeting, junior associate resigning.',
        sfxCue: 'Camera shutter click + warning alert sound',
        voiceover: 'Here is the dirty secret: their junior associates manage your account and quit every nine months. You lose your ad history and your positioning.',
        screenText: 'Context Evaporation: 9-Month Turnover'
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
      hashtags: ['#Shorts', '#GrowthHacking', '#AIAgents', '#BusinessGrowth', '#SigmaTactix']
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
    hashtags: ['#GrowthOS', '#B2BTech', '#AIAgents', '#SigmaTactix']
  };
}

/**
 * Export a generated creative social result (carousel or thread) to an interactive Lecture Deck
 * Powered by RinDig/lecture-deck-skill with Sigma Tactix theme.
 */
export async function exportCreativeLectureDeck(
  result: GenerateSocialResult,
  options: { mode?: 'view' | 'download' | 'both'; filename?: string; theme?: string } = {}
): Promise<{ success: boolean; viewUrl?: string; downloadUrl?: string; deckId?: string }> {
  try {
    const mode = options.mode || 'both';
    const res = await fetch('/api/reports/deck/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportData: {
          topic: result.topic,
          channel: result.channel,
          hook: result.hook,
          slides: result.slides,
          threadTweets: result.threadTweets,
          loopCta: result.loopCta || 'Bookmark this presentation and implement today.',
        },
        type: 'creative',
        theme: options.theme || 'sigmatactix',
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate creative lecture deck');
    }

    if (mode === 'view' || mode === 'both') {
      window.open(data.viewUrl, '_blank');
    }

    if (mode === 'download' || mode === 'both') {
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = options.filename || data.filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return {
      success: true,
      viewUrl: data.viewUrl,
      downloadUrl: data.downloadUrl,
      deckId: data.deckId,
    };
  } catch (err) {
    console.error('Error exporting creative lecture deck:', err);
    return { success: false };
  }
}
