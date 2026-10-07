import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
import React, { useState } from 'react';
import {
  Share2,
  Linkedin,
  Twitter,
  Instagram,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Layers,
  Maximize2,
  Send,
  Flame,
  ChevronRight,
  Eye,
  Sliders,
  FileText,
  Youtube,
  Globe,
  X,
  ExternalLink,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import CarouselCardViewer from '@/src/components/CarouselCardViewer';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { GlassCard, Button, Badge, Tabs } from '@/src/components/ui';
import {
  CarouselSlide,
  TweetItem,
  SocialCampaignData
} from '@/src/data/marketingModulesData';
import { repurposeCarouselWithAgentReach } from '@/src/lib/api';
import { generateSocialCampaign } from '@/src/lib/creativeApi';
import { RepurposedCarouselAndThread } from '@/src/types';

const DEMO_INITIAL_LINKEDIN_SLIDES: CarouselSlide[] = [
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
];

const DEMO_INITIAL_THREAD_TWEETS: TweetItem[] = [
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
];

export default function SocialCarouselsPage() {
  const { notifySuccess, notifyError } = useToast();
  const [channel, setChannel] = useState<'LinkedIn' | 'X_Thread' | 'Instagram'>('LinkedIn');
  const [topic, setTopic] = useState('5 Hidden Digital Revenue Leaks Siphoning Your Pipeline');
  const [audience, setAudience] = useState('B2B Tech Executives & Revenue Leaders');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'CARDS' | 'RAW_TEXT'>('CARDS');

  // Agent Reach Carousel Repurposing State
  const [isRepurposeModalOpen, setIsRepurposeModalOpen] = useState(false);
  const [repurposeUrl, setRepurposeUrl] = useState('');
  const [repurposeTopicAngle, setRepurposeTopicAngle] = useState('');
  const [isRepurposing, setIsRepurposing] = useState(false);
  const [repurposedMeta, setRepurposedMeta] = useState<RepurposedCarouselAndThread | null>(null);

  // Active Slides & Campaign Data
  const [slides, setSlides] = useState<CarouselSlide[]>(INITIAL_LINKEDIN_SLIDES);
  const [threadTweets, setThreadTweets] = useState<TweetItem[]>(INITIAL_THREAD_TWEETS);
  const [caption, setCaption] = useState<string>('');

  // Run History — starts empty. Verified runs appear only after local render
  // completion or a provider receipt; the seeded verbose copy lives only in
  // INITIAL_LINKEDIN_SLIDES as an editable local draft, not as a run.
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  const handleRepurposeCarousel = async () => {
    if (!repurposeUrl.trim()) {
      notifyError('Source URL Required', 'Please enter a valid YouTube video URL or article link.');
      return;
    }

    setIsRepurposing(true);
    try {
      const result = await repurposeCarouselWithAgentReach({
        sourceUrl: repurposeUrl.trim(),
        topic: repurposeTopicAngle.trim() || undefined
      });

      if (result.slides && result.slides.length > 0) {
        setSlides(result.slides);
      }
      if (result.tweetThread && result.tweetThread.length > 0) {
        setThreadTweets(result.tweetThread.map(t => ({
          tweetNumber: t.tweetNumber,
          text: t.text,
          charCount: t.characterCount
        })));
      }

      if (result.sourceTitle) {
        setTopic(result.sourceTitle);
        setCaption(`Stop guessing your social distribution strategy. 🛑\n\nWe extracted the core frameworks from "${result.sourceTitle}":\n\nSwipe through the carousel above to see the actionable breakdown.\n\nSource: ${result.sourceUrl}\n\n#GrowthOS #B2BMarketing #AIAgents #SigmaTactix #ContentRepurposing`);
      }

      setRepurposedMeta(result);

      const newRun: AgentRunRecord = {
        id: `run-repurpose-carousel-${Date.now()}`,
        agentName: 'Agent Reach Social & Carousel Swarm',
        agentRole: 'Cross-Platform Social Architect',
        timestamp: 'Just now',
        status: 'PARTIAL',
        moduleOrigin: 'Agent Reach Studio',
        inputSummary: `Source: ${result.sourceTitle || result.sourceUrl}`,
        outputSummary: `Synthesized ${result.slides?.length || 0}-slide local draft & ${result.tweetThread?.length || 0}-tweet thread draft. Not published. Distribution requires an approved distribution run and provider credentials.`,
        fullOutput: JSON.stringify(result, null, 2),
        metrics: [
          { label: 'Source', value: result.sourceUrl.includes('youtube') ? 'YouTube' : 'Web' },
          { label: 'Slides', value: `${result.slides?.length || 0}` },
          { label: 'Tweets', value: `${result.tweetThread?.length || 0}` },
          { label: 'Publication', value: 'Not published (local draft)' }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Local Draft Synthesized', `Assembled ${result.slides?.length || 0} carousel slides and ${result.tweetThread?.length || 0} tweets locally. Nothing was published.`);
      setIsRepurposeModalOpen(false);
    } catch (err: any) {
      console.error('Repurpose carousel error:', err);
      notifyError('Repurposing Failed', err.message || 'Failed to extract and repurpose carousel.');
    } finally {
      setIsRepurposing(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      notifyError('Topic Required', 'Please enter a campaign topic.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateSocialCampaign({ channel, topic: topic.trim(), targetAudience: audience });
      const nextSlides = result.slides || [];
      const nextTweets = (result.threadTweets || []).map((tweet, index) => ({
        tweetNumber: Number(tweet.tweetNumber) || index + 1,
        text: tweet.text,
        charCount: tweet.charCount || tweet.text.length,
      }));
      if (channel === 'X_Thread' && nextTweets.length === 0) throw new Error('The provider returned no thread posts.');
      if (channel !== 'X_Thread' && nextSlides.length === 0) throw new Error('The provider returned no carousel slides.');
      if (nextSlides.length) setSlides(nextSlides);
      if (nextTweets.length) setThreadTweets(nextTweets);
      setCaption(result.caption || [result.hook, result.hashtags?.join(' ')].filter(Boolean).join('\n\n'));
      setRunHistory(prev => [{
        id: `run-carousel-${Date.now()}`,
        agentName: 'Social Growth Swarm',
        agentRole: 'Provider-backed campaign generation',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Social & Carousel Studio',
        inputSummary: `${channel}: ${topic}`,
        outputSummary: `Gemini returned ${channel === 'X_Thread' ? `${nextTweets.length} thread posts` : `${nextSlides.length} carousel slides`}. Nothing was published.`,
        fullOutput: JSON.stringify(result, null, 2),
        metrics: [
          { label: 'Channel', value: channel },
          { label: channel === 'X_Thread' ? 'Posts' : 'Slides', value: `${channel === 'X_Thread' ? nextTweets.length : nextSlides.length}` },
          { label: 'Publication', value: 'Not published' },
          { label: 'Source', value: result.source || 'gemini' },
        ],
      }, ...prev]);
      notifySuccess('Campaign generated', 'Gemini returned a provider-backed draft. Nothing was published.');
    } catch (error: any) {
      notifyError('Campaign generation failed', error?.message || 'The provider did not return a campaign.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    notifySuccess('Copied', 'Slide text copied to clipboard.');
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="sigma-page-header p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">EXECUTION LAYER</Badge>
              <span className="h-3 w-px bg-[var(--sigma-border-strong)]" aria-hidden="true" />
              <Badge variant="neutral">VIRAL CAROUSEL ENGINE</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <Share2 className="w-7 h-7 text-[var(--sigma-primary)]" />
              Social & Carousel Studio
            </h1>
            <p className="text-[var(--sigma-text-muted)] text-sm mt-1 max-w-2xl leading-relaxed">
              Design multi-slide LinkedIn carousels, X/Twitter threads, and high-retention social campaigns.
            </p>
          </div>

          {/* Actions & Channel Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="secondary"
              onClick={() => setIsRepurposeModalOpen(true)}
              leftIcon={<Youtube className="w-3.5 h-3.5 text-red-400" />}
            >
              Repurpose via Agent Reach
            </Button>

            {/* Channel Selector Tabs */}
            <Tabs<'LinkedIn' | 'X_Thread' | 'Instagram'>
              tabs={[
                { id: 'LinkedIn', label: 'LinkedIn Carousel', icon: <Linkedin className="w-3.5 h-3.5" /> },
                { id: 'X_Thread', label: 'X Thread', icon: <Twitter className="w-3.5 h-3.5" /> },
                { id: 'Instagram', label: 'Instagram Swipe', icon: <Instagram className="w-3.5 h-3.5" /> }
              ]}
              activeTab={channel}
              onChange={setChannel}
            />
          </div>
        </div>
      </GlassCard>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator Controls */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard elevation="raised" className="p-5 space-y-4">
            <h3 className="text-xs font-semibold text-[var(--sigma-text)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--sigma-primary)]" />
              Campaign Parameters
            </h3>

            <div>
              <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1.5">Topic / Hook Core</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                placeholder="e.g. 5 Hidden Digital Revenue Leaks Siphoning Your Pipeline..."
                className="sigma-input w-full px-3.5 py-2.5 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1.5">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. B2B Founders, CMOs, Growth Leads"
                className="sigma-input w-full px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isGenerating}
                leftIcon={!isGenerating ? <Sparkles className="w-4 h-4" /> : undefined}
              >
                {isGenerating ? 'Generating campaign...' : `Generate ${channel === 'X_Thread' ? 'Thread' : 'Carousel'}`}
              </Button>
            </div>
          </GlassCard>

          {/* Accompanying Post Copy */}
          <GlassCard elevation="flat" className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--sigma-text)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--sigma-primary)]" />
                Accompanying Caption
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(caption);
                  notifySuccess('Copied', 'Post caption copied to clipboard.');
                }}
                className="text-xs text-[var(--sigma-primary)] hover:brightness-90 flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={8}
              className="sigma-input w-full px-3.5 py-2.5 text-xs leading-relaxed resize-none font-mono"
            />
          </GlassCard>
        </div>

        {/* Right Column: Visual Preview & Live Slides */}
        <div className="lg:col-span-8 space-y-6">
          {/* Agent Reach Source Grounding Banner */}
          {repurposedMeta && (
            <div className="sigma-panel p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {repurposedMeta.sourceThumbnail ? (
                  <img
                    src={repurposedMeta.sourceThumbnail}
                    alt="Source Thumbnail"
                    className="w-14 h-9 object-cover rounded-lg border border-[var(--sigma-border-strong)] shrink-0"
                  />
                ) : (
                  <div className="p-2 rounded-lg bg-[var(--sigma-primary-subtle)] text-[var(--sigma-primary)] shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--sigma-text)] text-xs line-clamp-1">{repurposedMeta.sourceTitle || 'External Source'}</span>
                    <Badge variant="info" size="xs">
                      {repurposedMeta.sourceUrl.includes('youtube') ? 'YouTube Ingestion' : 'Web Ingestion'}
                    </Badge>
                  </div>
                  <a
                    href={repurposedMeta.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-primary)] hover:underline flex items-center gap-1 mt-0.5 font-mono"
                  >
                    {repurposedMeta.sourceUrl} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {repurposedMeta.slides?.length || 0} Slides
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400">
                  {repurposedMeta.tweetThread?.length || 0} Tweets
                </span>
              </div>
            </div>
          )}

          {channel === 'X_Thread' ? (
            /* Twitter Thread View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--sigma-text)] flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-500" />
                  X / Twitter Thread ({threadTweets.length} Tweets)
                </h3>
                <button
                  onClick={() => {
                    const fullThread = threadTweets.map(t => t.text).join('\n\n---\n\n');
                    navigator.clipboard.writeText(fullThread);
                    notifySuccess('Thread Copied', 'All tweets copied in sequence.');
                  }}
                  className="sigma-button-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Entire Thread
                </button>
              </div>

              <div className="space-y-3">
                {threadTweets.length === 0 ? (
                  <GlassCard elevation="flat" className="p-8 text-center text-sm text-[var(--sigma-text-muted)]">Generate a provider-backed X thread to see it here.</GlassCard>
                ) : threadTweets.map((tweet, idx) => (
                  <GlassCard key={idx} elevation="flat" className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[var(--sigma-text-muted)]">
                      <span className="font-semibold text-sky-600 dark:text-sky-400">Tweet {tweet.tweetNumber} of {threadTweets.length}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]">{tweet.charCount} / 280</span>
                        <button
                          onClick={() => handleCopyText(tweet.text, idx)}
                          className="sigma-icon-button !min-h-8 !min-w-8"
                          aria-label={`Copy tweet ${tweet.tweetNumber}`}
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--sigma-text-soft)] whitespace-pre-wrap leading-relaxed">{tweet.text}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          ) : (
            /* Visual Carousel Card Viewer */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--sigma-text)]">Visual Slide Deck Preview</h3>
                  <span className="text-xs text-[var(--sigma-text-muted)]">{slides.length} slides, 4:5 portrait</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'CARDS' ? 'RAW_TEXT' : 'CARDS')}
                    className="sigma-button-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    {viewMode === 'CARDS' ? 'View Slide Text' : 'View Visual Cards'}
                  </button>
                </div>
              </div>

              {slides.length === 0 ? (
                <GlassCard elevation="flat" className="p-10 text-center text-sm text-[var(--sigma-text-muted)]">Generate a provider-backed carousel to see its slides here.</GlassCard>
              ) : viewMode === 'CARDS' ? (
                <div className="sigma-panel-raised p-4 sm:p-6 flex justify-center overflow-hidden">
                  <CarouselCardViewer slides={slides} />
                </div>
              ) : (
                <div className="space-y-3">
                  {slides.map((slide, idx) => (
                    <GlassCard key={idx} elevation="flat" className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400">Slide {slide.slideNumber}: {slide.badge}</span>
                        <button
                          onClick={() => handleCopyText(`${slide.title}\n${slide.subtitle}\n\n${slide.contentPoints.join('\n')}\n\nTakeaway: ${slide.takeaway}`, idx)}
                          className="sigma-icon-button !min-h-8 !min-w-8"
                          aria-label={`Copy slide ${slide.slideNumber}`}
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="font-semibold text-sm text-[var(--sigma-text)]">{slide.title}</div>
                      <div className="text-xs text-[var(--sigma-text-muted)]">{slide.subtitle}</div>
                      <ul className="text-xs text-[var(--sigma-text-soft)] list-disc list-inside space-y-1 pt-1">
                        {slide.contentPoints.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                      <div className="text-xs text-[var(--sigma-primary)] font-medium pt-1">Key Takeaway: {slide.takeaway}</div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results History */}
      <div className="mt-10">
        <AgentRunResults
          records={runHistory}
          title="Social & Carousel Run Results"
          description="Log of generated carousels, slide decks, and accompanying copy ready for multi-platform distribution."
          onClear={() => setRunHistory([])}
        />
      </div>

      {/* Agent Reach Carousel Repurposing Modal */}
      <AnimatePresence>
        {isRepurposeModalOpen && (
          <div className="sigma-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="sigma-modal w-full max-w-2xl p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[var(--sigma-primary-subtle)] border border-[var(--sigma-primary)]/25 text-[var(--sigma-primary)]">
                    <Youtube className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--sigma-text)] flex items-center gap-2 flex-wrap">
                      Video & Article to Carousel Pipeline
                      <Badge variant="info" size="xs">Agent Reach</Badge>
                    </h3>
                    <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5 leading-relaxed">
                      Extract high-retention frameworks from any YouTube video or web article to produce an interactive LinkedIn carousel and viral X thread.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRepurposeModalOpen(false)}
                  className="sigma-icon-button"
                  aria-label="Close repurpose dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Source URL Field & Presets */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[var(--sigma-text-soft)] flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[var(--sigma-primary)]" />
                  Source URL (YouTube Video or Web Article)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={repurposeUrl}
                    onChange={e => setRepurposeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://..."
                    className="sigma-input w-full px-4 py-3 text-sm font-mono"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-[var(--sigma-text-muted)]">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRepurposeUrl('https://www.youtube.com/watch?v=jNQXAC9IVRw');
                      setRepurposeTopicAngle('History and First Principles of Video Platforms');
                    }}
                    className="sigma-button-secondary px-2.5 py-1 text-[11px] flex items-center gap-1"
                  >
                    <Youtube className="w-3 h-3 text-red-400" /> YouTube Demo Video
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepurposeUrl('https://paulgraham.com/foundermode.html');
                      setRepurposeTopicAngle('Founder Mode vs Manager Mode');
                    }}
                    className="sigma-button-secondary px-2.5 py-1 text-[11px] flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3 text-[var(--sigma-primary)]" /> Paul Graham: Founder Mode
                  </button>
                </div>
              </div>

              {/* Custom Topic / Angle Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--sigma-text-soft)]">
                  Custom Angle or Hook Focus (Optional)
                </label>
                <input
                  type="text"
                  value={repurposeTopicAngle}
                  onChange={e => setRepurposeTopicAngle(e.target.value)}
                  placeholder="e.g. Focus on executive leverage and sovereign infrastructure"
                  className="sigma-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRepurposeModalOpen(false)}
                  className="sigma-button-secondary px-4 py-2.5 text-xs font-medium"
                >
                  Cancel
                </button>
                <Button
                  type="button"
                  onClick={handleRepurposeCarousel}
                  disabled={isRepurposing || !repurposeUrl.trim()}
                  variant="primary"
                  isLoading={isRepurposing}
                  leftIcon={!isRepurposing ? <Sparkles className="w-3.5 h-3.5" /> : undefined}
                >
                  {isRepurposing ? 'Extracting and repurposing...' : 'Generate Carousel and Thread'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
const INITIAL_LINKEDIN_SLIDES = isDemoSeedEnabled() ? DEMO_INITIAL_LINKEDIN_SLIDES : [];
const INITIAL_THREAD_TWEETS = isDemoSeedEnabled() ? DEMO_INITIAL_THREAD_TWEETS : [];
