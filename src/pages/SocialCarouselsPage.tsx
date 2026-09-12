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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import CarouselCardViewer from '@/src/components/CarouselCardViewer';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { 
  CarouselSlide, 
  TweetItem, 
  SocialCampaignData 
} from '@/src/data/marketingModulesData';

const INITIAL_LINKEDIN_SLIDES: CarouselSlide[] = [
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

const INITIAL_THREAD_TWEETS: TweetItem[] = [
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

  // Active Slides & Campaign Data
  const [slides, setSlides] = useState<CarouselSlide[]>(INITIAL_LINKEDIN_SLIDES);
  const [threadTweets, setThreadTweets] = useState<TweetItem[]>(INITIAL_THREAD_TWEETS);
  const [caption, setCaption] = useState<string>(`Stop renting your growth engine. 🛑

When you rely exclusively on outsourced agency retainers, you are leasing headcount that turns over every 9 months. With them goes your positioning nuance, ad test data, and competitive advantage.

Swipe through the carousel above to see how modern B2B operators install an AI-native Growth OS directly into their cloud.

Which slide hit closest to home? Drop a comment below 👇

#GrowthOS #B2BMarketing #AIAgents #SigmaTactix #SaaSGrowth`);

  // Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-carousel-01',
      agentName: 'Social Growth Swarm',
      agentRole: 'Viral Hook & Carousel Architect',
      timestamp: 'Today at 04:30 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Social & Carousel Studio',
      inputSummary: 'Topic: 5 Hidden Digital Revenue Leaks (LinkedIn Carousel)',
      outputSummary: 'Generated 7-slide high-density carousel and viral hook caption.',
      fullOutput: JSON.stringify({ slides: INITIAL_LINKEDIN_SLIDES, caption }, null, 2),
      metrics: [
        { label: 'Slides', value: '7' },
        { label: 'Format', value: 'LinkedIn 4:5' },
        { label: 'Hook Score', value: '94/100' },
        { label: 'Est. Impressions', value: '18k - 35k' }
      ]
    }
  ]);

  const handleGenerate = () => {
    if (!topic.trim()) {
      notifyError('Topic Required', 'Please enter a campaign topic.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);

      const newSlides: CarouselSlide[] = [
        {
          slideNumber: 1,
          badge: 'GROWTH BLUEPRINT',
          title: topic,
          subtitle: `Essential empirical breakdown for ${audience}`,
          contentPoints: [
            'Traditional playbooks are producing diminishing returns.',
            'First-principles analysis reveals the true leverage points.',
            'Swipe through the operational framework.'
          ],
          takeaway: 'Systematic infrastructure compounds over time.',
          visualCue: 'Deep obsidian backdrop with glowing gold accents'
        },
        {
          slideNumber: 2,
          badge: 'PILLAR 01',
          title: 'Establish Sovereign Data Vaults',
          subtitle: 'Own your intelligence instead of leasing it',
          contentPoints: [
            'Consolidate customer touchpoints into a unified Second Brain.',
            'Ensure zero context loss across marketing and sales.',
            'Eliminate dependency on third-party agencies.'
          ],
          takeaway: 'Data sovereignty is the ultimate competitive moat.',
          visualCue: 'Neural knowledge graph with connected gold nodes'
        },
        {
          slideNumber: 3,
          badge: 'PILLAR 02',
          title: 'Deploy Autonomous Execution',
          subtitle: 'Continuous optimization under human supervision',
          contentPoints: [
            'AI swarms operate 24/7 on creative hooks and ad copy.',
            'Deterministic guardrails protect brand reputation.',
            'Scale output by 10x with zero headcount increase.'
          ],
          takeaway: 'Autonomous agents eliminate operational bottlenecks.',
          visualCue: 'High-speed data streams routing into execution nodes'
        },
        {
          slideNumber: 4,
          badge: 'EXECUTION',
          title: 'The Next Steps',
          subtitle: 'Audit your current architecture today',
          contentPoints: [
            'Identify the 3 largest leaks in your current funnel.',
            'Replace manual spreadsheets with live telemetry.',
            'Visit sigmatactix.com to run your Growth OS diagnostic.'
          ],
          takeaway: 'Action beats analysis. Deploy your Growth OS.',
          visualCue: 'Golden Sigma Tactix badge with action vector'
        }
      ];

      setSlides(newSlides);

      const newRun: AgentRunRecord = {
        id: `run-carousel-${Date.now()}`,
        agentName: 'Social Growth Swarm',
        agentRole: 'Viral Hook & Carousel Architect',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Social & Carousel Studio',
        inputSummary: `${channel}: ${topic}`,
        outputSummary: `Generated ${newSlides.length}-slide carousel campaign with high-retention hook.`,
        fullOutput: JSON.stringify(newSlides, null, 2),
        metrics: [
          { label: 'Channel', value: channel },
          { label: 'Slides', value: `${newSlides.length}` },
          { label: 'Targeting', value: 'Enterprise' }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Social Campaign Synthesized', 'Generated multi-slide carousel and post copy.');
    }, 1300);
  };

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    notifySuccess('Copied', 'Slide text copied to clipboard.');
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Social & Carousel Studio</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  Digital Marketing
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Design multi-slide LinkedIn carousels, X/Twitter threads, and high-retention social campaigns.
              </p>
            </div>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0F0F12] border border-white/10">
          <button
            onClick={() => setChannel('LinkedIn')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
              channel === 'LinkedIn' 
                ? "bg-blue-600 text-white shadow" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn Carousel
          </button>
          <button
            onClick={() => setChannel('X_Thread')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
              channel === 'X_Thread' 
                ? "bg-sky-500 text-white shadow" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Twitter className="w-3.5 h-3.5" /> X Thread
          </button>
          <button
            onClick={() => setChannel('Instagram')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
              channel === 'Instagram' 
                ? "bg-pink-600 text-white shadow" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Instagram className="w-3.5 h-3.5" /> Instagram Swipe
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Campaign Parameters
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic / Hook Core</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                placeholder="e.g. 5 Hidden Digital Revenue Leaks Siphoning Your Pipeline..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. B2B Founders, CMOs, Growth Leads"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Multi-Slide Angles...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate {channel === 'X_Thread' ? 'Thread' : 'Carousel'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Accompanying Post Copy */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Accompanying Caption
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(caption);
                  notifySuccess('Copied', 'Post caption copied to clipboard.');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={8}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500/50 resize-none font-mono"
            />
          </div>
        </div>

        {/* Right Column: Visual Preview & Live Slides */}
        <div className="lg:col-span-8 space-y-6">
          {channel === 'X_Thread' ? (
            /* Twitter Thread View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-400" />
                  X / Twitter Thread ({threadTweets.length} Tweets)
                </h3>
                <button
                  onClick={() => {
                    const fullThread = threadTweets.map(t => t.text).join('\n\n---\n\n');
                    navigator.clipboard.writeText(fullThread);
                    notifySuccess('Thread Copied', 'All tweets copied in sequence.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Entire Thread
                </button>
              </div>

              <div className="space-y-3">
                {threadTweets.map((tweet, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-sky-400">Tweet {tweet.tweetNumber} of {threadTweets.length}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]">{tweet.charCount} / 280</span>
                        <button
                          onClick={() => handleCopyText(tweet.text, idx)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{tweet.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Visual Carousel Card Viewer */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Visual Slide Deck Preview</h3>
                  <span className="text-xs text-slate-400">({slides.length} slides • 4:5 Portrait)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'CARDS' ? 'RAW_TEXT' : 'CARDS')}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 flex items-center gap-1.5"
                  >
                    {viewMode === 'CARDS' ? 'View Slide Text' : 'View Visual Cards'}
                  </button>
                </div>
              </div>

              {viewMode === 'CARDS' ? (
                <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 flex justify-center">
                  <CarouselCardViewer slides={slides} />
                </div>
              ) : (
                <div className="space-y-3">
                  {slides.map((slide, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400">Slide {slide.slideNumber}: {slide.badge}</span>
                        <button
                          onClick={() => handleCopyText(`${slide.title}\n${slide.subtitle}\n\n${slide.contentPoints.join('\n')}\n\nTakeaway: ${slide.takeaway}`, idx)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="font-semibold text-sm text-white">{slide.title}</div>
                      <div className="text-xs text-slate-400">{slide.subtitle}</div>
                      <ul className="text-xs text-slate-300 list-disc list-inside space-y-1 pt-1">
                        {slide.contentPoints.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                      <div className="text-xs text-amber-300/90 font-medium pt-1">Key Takeaway: {slide.takeaway}</div>
                    </div>
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
    </div>
  );
}
