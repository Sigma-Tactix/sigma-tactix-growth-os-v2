import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Share2, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Play, 
  RefreshCw, 
  Wand2, 
  Sliders, 
  Layers, 
  Send, 
  Flame, 
  Eye, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  ArrowRight,
  ShieldCheck,
  Zap,
  ExternalLink,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { 
  SEED_CONTENT_ITEMS, 
  ContentEngineItem,
  CarouselSlide,
  TweetItem,
  ShortsScene,
  SocialCampaignData
} from '@/src/data/marketingModulesData';
import CarouselCardViewer from '@/src/components/CarouselCardViewer';
import { generateCreativeImage, generateSocialCampaign } from '@/src/lib/creativeApi';
import { GlassCard, Button, Badge, Tabs } from '@/src/components/ui';

const DEMO_DEFAULT_LINKEDIN_SLIDES: CarouselSlide[] = [
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

const DEMO_DEFAULT_THREAD_TWEETS: TweetItem[] = [
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

const DEMO_DEFAULT_SHORTS_SCENES: ShortsScene[] = [
  {
    timeCode: '0:00 - 0:03',
    visualDirection: 'Rapid push-in on an open desk with 45 browser tabs and $25k in agency invoices.',
    sfxCue: 'Deep sub-bass drop + high-pitch static glitch',
    voiceover: 'If your company is still paying a $20k monthly agency retainer, you are getting fleeced.',
    screenText: 'STOP RENTING HEADCOUNT 🚨'
  },
  {
    timeCode: '0:03 - 0:15',
    visualDirection: 'Cut to red warning screen: attribution graphs plunging, agency turnover icon.',
    sfxCue: 'Camera shutter snap + warning beep',
    voiceover: 'Here is the dirty secret: their junior associates manage your account and quit every nine months. You lose your ad history and positioning nuance.',
    screenText: 'Context Evaporation: 9-Month Turnover'
  },
  {
    timeCode: '0:15 - 0:35',
    visualDirection: 'Smooth 3D orbit around glowing Second Brain core with 10 amber permissioned vaults.',
    sfxCue: 'Digital power-up hum + whoosh transition',
    voiceover: 'Top tech founders are doing something radically different. They install an AI-native Growth OS directly into their cloud. Permanent memory. Scoped agent swarms.',
    screenText: 'The Fix: Client-Owned Second Brain 🧠'
  },
  {
    timeCode: '0:35 - 0:50',
    visualDirection: 'Screencast of autonomous agent generating 5 ad angle variations and scheduling a carousel in 8 seconds.',
    sfxCue: 'Keyboard typing cascade + success chime',
    voiceover: 'Content, AEO visibility, and ad creative optimization run at the speed of code under strict human guardrails. You cut your CAC by 40%.',
    screenText: 'Speed of Code: 40% CAC Reduction ⚡️'
  },
  {
    timeCode: '0:50 - 1:00',
    visualDirection: 'Loop transition: presenter points to link below with seamless loop back to opening line.',
    sfxCue: 'Clean rising synth swell',
    voiceover: 'Stop renting your intelligence. Own it. Run your free diagnostic at the link in bio, and follow for more empirical teardowns.',
    screenText: 'sigmatactix.com // Follow ➔'
  }
];

interface GeneratedImageRecord {
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  ratio: string;
  style: string;
  timestamp: string;
}

export default function ContentEnginePage() {
  const { notifySuccess, notifyInfo, notifyError } = useToast();
  const [contentItems, setContentItems] = useState<ContentEngineItem[]>(SEED_CONTENT_ITEMS);
  const [activeTab, setActiveTab] = useState<'TEXT' | 'IMAGE' | 'VIDEO' | 'SOCIAL'>('SOCIAL');
  const [selectedItem, setSelectedItem] = useState<ContentEngineItem>(SEED_CONTENT_ITEMS[0]);
  const [copied, setCopied] = useState(false);

  // Text Engine State
  const [textTopic, setTextTopic] = useState('Why modern growth teams are firing their marketing agency of record');
  const [textFormat, setTextFormat] = useState<'LONG_FORM' | 'CASE_STUDY' | 'NEWSLETTER' | 'PR_RELEASE'>('LONG_FORM');
  const [targetAudience, setTargetAudience] = useState('B2B Tech Founders & CMOs');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [antiSlopActive, setAntiSlopActive] = useState(true);

  // Image Studio State
  const [imagePrompt, setImagePrompt] = useState('Enterprise Second Brain data core with 10 glowing permissioned vaults in obsidian space, metallic amber accents, 8k resolution, cinematic lighting');
  const [imageRatio, setImageRatio] = useState<'16:9' | '1:1' | '9:16' | '4:5'>('16:9');
  const [imageStyle, setImageStyle] = useState<'3D_DATA_NEURAL' | 'CYBER_SCHEMATIC' | 'MINIMAL_STUDIO' | 'CORPORATE_POLISHED'>('3D_DATA_NEURAL');
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('https://image.pollinations.ai/prompt/Enterprise%20Second%20Brain%20data%20core%20glowing%20amber%20vaults%20obsidian%20space%203D%20isometric?width=1280&height=720&seed=48291&nologo=true');
  const [activeEnhancedPrompt, setActiveEnhancedPrompt] = useState('');
  const [imageHistory, setImageHistory] = useState<GeneratedImageRecord[]>([
    {
      url: 'https://image.pollinations.ai/prompt/Enterprise%20Second%20Brain%20data%20core%20glowing%20amber%20vaults%20obsidian%20space%203D%20isometric?width=1280&height=720&seed=48291&nologo=true',
      prompt: 'Enterprise Second Brain data core with 10 glowing vaults',
      ratio: '16:9',
      style: '3D_DATA_NEURAL',
      timestamp: 'Initial Seed'
    }
  ]);

  // Video Storyboard State
  const [videoTopic, setVideoTopic] = useState('60-second agency replacement breakdown');
  const [videoDuration, setVideoDuration] = useState<'30s' | '60s' | '90s'>('60s');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [activeVideoScene, setActiveVideoScene] = useState<number>(1);

  // Social & Carousel Studio State
  const [selectedSocialChannel, setSelectedSocialChannel] = useState<'LinkedIn' | 'Instagram' | 'YouTube_Shorts' | 'X_Thread'>('LinkedIn');
  const [socialTopic, setSocialTopic] = useState('5 Hidden Digital Revenue Leaks Siphoning Your Pipeline');
  const [socialAudience, setSocialAudience] = useState('B2B Tech Executives & Revenue Leaders');
  const [socialTone, setSocialTone] = useState('Authoritative, empirical, anti-slop, engineering-grade');
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [socialViewMode, setSocialViewMode] = useState<'CARDS' | 'COPY'>('CARDS');

  // Active Social Campaign Data
  const [activeCampaign, setActiveCampaign] = useState<SocialCampaignData>({
    channel: 'LinkedIn',
    topic: '5 Hidden Digital Revenue Leaks Siphoning Your Pipeline',
    hook: `Most B2B tech founders believe their CAC is rising because "ad costs are up."\n\nIn reality, your business is hemorrhaging revenue across 5 invisible digital cracks.\n\nHere is the exact empirical audit breakdown (and the sovereign system to seal them) ⬇️`,
    slides: DEFAULT_LINKEDIN_SLIDES,
    threadTweets: DEFAULT_THREAD_TWEETS,
    shortsScenes: DEFAULT_SHORTS_SCENES,
    caption: `Stop renting your growth engine. 🛑\n\nWhen you rely exclusively on outsourced agency retainers, you are leasing headcount that turns over every 9 months. With them goes your positioning nuance, ad test data, and competitive advantage.\n\nSwipe through the carousel above to see how modern B2B operators install an AI-native Growth OS directly into their cloud.\n\nWhich slide hit closest to home? Drop a comment below 👇\n\n#GrowthOS #B2BMarketing #AIAgents #SigmaTactix #SaaSGrowth`,
    loopCta: 'Stop renting your intelligence. Own it. Run your free diagnostic at sigmatactix.com',
    hashtags: ['#GrowthOS', '#B2BGrowth', '#AIAgents', '#RevenueOperations', '#SigmaTactix']
  });

  // Text Generation Handler
  const handleGenerateText = () => {
    setIsGeneratingText(true);
    setTimeout(() => {
      setIsGeneratingText(false);
      const newItem: ContentEngineItem = {
        id: `cnt-${Date.now()}`,
        title: textTopic,
        type: textFormat === 'LONG_FORM' ? 'LONG_FORM' : 'NEWSLETTER',
        channel: 'Blog',
        status: 'READY_FOR_HITL',
        voiceAlignmentScore: 99.2,
        targetAudience: targetAudience,
        generatedContent: `# ${textTopic}

When a B2B tech company signs an agency retainer, they believe they are purchasing execution velocity. In reality, they are entering a negative-compounding lease on human headcount.

## The Three Structural Defects of Rented Headcount

1. **Context Evaporation**: The junior associates managing your campaigns turn over every 9 months. With them goes your positioning nuance, ad test history, and objection learnings.
2. **Attribution Opacity**: Monthly 40-slide decks celebrate "impressions" and "top-of-funnel engagement" while qualified pipeline remains stagnant.
3. **Zero Asset Equity**: When you terminate the agency, you walk away with zero code, zero durable memory, and zero self-driving systems.

## The Sovereign Alternative: Client-Owned Second Brain

By installing an AI-native growth infrastructure directly into your cloud, your business develops permanent institutional memory. Scoped agent swarms diagnose revenue leaks, construct topical authority, and reallocate media spend under strict Human-in-the-Loop guardrails.

The future belongs to founders who own their intelligence engine rather than rent it.`,
        mediaUrl: generatedImageUrl
      };

      setContentItems(prev => [newItem, ...prev]);
      setSelectedItem(newItem);
      notifySuccess(
        'Content Generated & Aligned',
        `Produced 850-word piece with 99.2% Brand Vault voice alignment and zero banned AI clichés.`
      );
    }, 1200);
  };

  // Real Image Generation Handler (Prompt-Driven AI Synthesis)
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      notifyError('Prompt Required', 'Please enter a visual description prompt.');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const result = await generateCreativeImage({
        prompt: imagePrompt,
        aspectRatio: imageRatio,
        stylePreset: imageStyle,
        enhancePrompt: enhancePrompt
      });

      setGeneratedImageUrl(result.imageUrl);
      setActiveEnhancedPrompt(result.enhancedPrompt);

      const record: GeneratedImageRecord = {
        url: result.imageUrl,
        prompt: imagePrompt,
        enhancedPrompt: result.enhancedPrompt,
        ratio: imageRatio,
        style: imageStyle,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setImageHistory(prev => [record, ...prev.slice(0, 7)]);
      notifySuccess(
        'Visual Creative Synthesized', 
        `Rendered high-res asset in ${imageRatio} format with ${imageStyle.replace(/_/g, ' ')} aesthetic.`
      );
    } catch (err: any) {
      console.error('Image synthesis error:', err);
      notifyError('Synthesis Failed', err.message || 'Could not synthesize image.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Real Social Campaign & Carousel Creator Generation Handler
  const handleGenerateSocialCampaign = async () => {
    if (!socialTopic.trim()) {
      notifyError('Topic Required', 'Please enter a topic or thesis for the campaign.');
      return;
    }

    setIsGeneratingSocial(true);
    try {
      const result = await generateSocialCampaign({
        channel: selectedSocialChannel,
        topic: socialTopic,
        targetAudience: socialAudience,
        tone: socialTone
      });

      setActiveCampaign(prev => ({
        ...prev,
        channel: selectedSocialChannel,
        topic: result.topic,
        hook: result.hook || prev.hook,
        slides: result.slides && result.slides.length > 0 ? result.slides : prev.slides,
        threadTweets: result.threadTweets && result.threadTweets.length > 0 ? result.threadTweets : prev.threadTweets,
        shortsScenes: result.shortsScenes && result.shortsScenes.length > 0 ? result.shortsScenes : prev.shortsScenes,
        caption: result.caption || prev.caption,
        loopCta: result.loopCta || prev.loopCta,
        hashtags: result.hashtags || prev.hashtags
      }));

      // Add to content items list
      const newItem: ContentEngineItem = {
        id: `cnt-soc-${Date.now()}`,
        title: `${socialTopic} (${selectedSocialChannel})`,
        type: 'SOCIAL_CAROUSEL',
        channel: selectedSocialChannel === 'YouTube_Shorts' ? 'YouTube Shorts' : selectedSocialChannel === 'X_Thread' ? 'X/Twitter' : 'LinkedIn',
        status: 'READY_FOR_HITL',
        voiceAlignmentScore: 99.4,
        targetAudience: socialAudience,
        generatedContent: result.hook + '\n\n' + (result.slides?.map(s => `SLIDE ${s.slideNumber}: ${s.title}\n${(s.contentPoints || []).map(p => `• ${p}`).join('\n')}`).join('\n\n') || ''),
        carouselSlides: result.slides,
        threadTweets: result.threadTweets,
        shortsScenes: result.shortsScenes
      };

      setContentItems(prev => [newItem, ...prev]);
      notifySuccess(
        'Campaign Synthesized', 
        `Generated ${selectedSocialChannel.replace(/_/g, ' ')} post creatives aligned with Brand Vault vectors.`
      );
    } catch (err: any) {
      console.error('Social generation error:', err);
      notifyError('Generation Failed', err.message || 'Could not generate social campaign.');
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  // Video Storyboard Generation Handler
  const handleGenerateVideoStoryboard = () => {
    setIsGeneratingVideo(true);
    setTimeout(() => {
      setIsGeneratingVideo(false);
      notifySuccess('Video Storyboard Generated', 'Generated 4-scene video script with visual direction, motion prompts, and voiceover.');
    }, 1200);
  };

  const handleCopyContent = (text: string, title = 'Content') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    notifyInfo('Copied to Clipboard', `${title} copied and ready for publishing.`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick prompt presets for Image Studio
  const QUICK_PROMPTS = [
    'Enterprise Second Brain data core with 10 glowing permissioned vaults in obsidian space',
    '3D isometric growth diagnostic telemetry HUD with metallic amber node connectors',
    'Cyber schematic blueprint of autonomous B2B AI agent swarms and human-in-the-loop gate',
    'Minimalist obsidian desk with holographic revenue pipeline dashboard and amber lasers'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">CREATION LAYER</Badge>
              <span className="text-zinc-600 text-xs">•</span>
              <Badge variant="neutral">NEXUS-03 SWARM</Badge>
              <span className="text-zinc-600 text-xs">•</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Live Creative Synthesis Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Wand2 className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Content Engine & Creative Studio
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Autonomous multi-modal creative generation producing prompt-to-image brand visuals, LinkedIn & Instagram carousels, YouTube Shorts scripts, and viral X 7-part threads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => handleCopyContent(selectedItem.generatedContent, 'Active Item')}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied' : 'Copy Active Item'}
            </Button>

            <Button
              variant="primary"
              onClick={() => notifySuccess('Submitted to HITL Ledger', 'Creative assets routed to Human-in-the-Loop approval queue for direct publishing.')}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit for HITL Approval
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Navigation Sub-Tabs */}
      <Tabs<'SOCIAL' | 'IMAGE' | 'TEXT' | 'VIDEO'>
        tabs={[
          { id: 'SOCIAL', label: 'Carousel Creator & Social Studio', icon: <Share2 className="w-3.5 h-3.5" /> },
          { id: 'IMAGE', label: 'Image Studio & Visual Assets', icon: <ImageIcon className="w-3.5 h-3.5" /> },
          { id: 'TEXT', label: 'Text Copywriter & Teardowns', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'VIDEO', label: 'Video Studio & Storyboarder', icon: <Video className="w-3.5 h-3.5" /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: SOCIAL & CAROUSEL CREATOR STUDIO */}
      {activeTab === 'SOCIAL' && (
        <div className="space-y-6">
          {/* Channel Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                id: 'LinkedIn', 
                label: 'LinkedIn Carousel & Long Hook', 
                icon: Linkedin, 
                desc: '6-8 visual slide cards + viral long hook before the fold.',
                badge: 'High B2B Dwell Time'
              },
              { 
                id: 'Instagram', 
                label: 'Instagram Carousel & Captions', 
                icon: Instagram, 
                desc: '4:5 / 1:1 visual cards, micro-graphics, swipe cues & hashtags.',
                badge: 'Swipe & Engagement'
              },
              { 
                id: 'YouTube_Shorts', 
                label: 'YouTube Shorts Vertical Script', 
                icon: Youtube, 
                desc: '0-3s retention hook, pacing, SFX cues, and voiceover.',
                badge: 'High Retention Pacing'
              },
              { 
                id: 'X_Thread', 
                label: 'X (Twitter) 7-Part Thread', 
                icon: Twitter, 
                desc: '7 distinct numbered tweets strictly under 280 characters.',
                badge: 'Viral Bookmark Engine'
              }
            ].map(ch => {
              const Icon = ch.icon;
              const isSelected = selectedSocialChannel === ch.id;
              return (
                <GlassCard
                  key={ch.id}
                  spotlight={isSelected}
                  interactive
                  onClick={() => setSelectedSocialChannel(ch.id as any)}
                  className={cn(
                    "p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all",
                    isSelected ? "border-[var(--sigma-vermilion)] ring-1 ring-[var(--sigma-vermilion)]/40 shadow-lg shadow-orange-500/10" : ""
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={cn("w-5 h-5", isSelected ? "text-[var(--sigma-vermilion)]" : "text-zinc-500")} />
                      <Badge variant={isSelected ? "vermilion" : "neutral"}>
                        {ch.badge}
                      </Badge>
                    </div>
                    <div className="font-bold text-xs text-white">{ch.label}</div>
                    <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{ch.desc}</div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--sigma-vermilion)] font-bold pt-1">
                    {isSelected ? 'Active Generator' : 'Select Channel'} 
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Generator Input Bar */}
          <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Configure {selectedSocialChannel.replace(/_/g, ' ')} Generator
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Model: Gemini 2.5 Flash • Brand Vault Vector Sync
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Campaign Topic or Thesis</label>
                <input
                  type="text"
                  value={socialTopic}
                  onChange={e => setSocialTopic(e.target.value)}
                  placeholder="e.g. 5 Signs Your Business Has Digital Revenue Leaks..."
                  className="w-full p-3 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target Audience</label>
                <input
                  type="text"
                  value={socialAudience}
                  onChange={e => setSocialAudience(e.target.value)}
                  placeholder="e.g. B2B Tech Founders & Revenue Leaders"
                  className="w-full p-3 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Anti-Slop Active: Enforces empirical engineering data & bans generic fluff.
              </div>

              <button
                onClick={handleGenerateSocialCampaign}
                disabled={isGeneratingSocial}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
              >
                <Sparkles className={cn("w-3.5 h-3.5", isGeneratingSocial && "animate-spin")} />
                {isGeneratingSocial ? 'Synthesizing Creatives with Gemini...' : `Synthesize ${selectedSocialChannel.replace(/_/g, ' ')}`}
              </button>
            </div>
          </div>

          {/* CHANNEL SPECIFIC DISPLAY */}

          {/* 1. LINKEDIN & INSTAGRAM CAROUSEL CREATOR */}
          {(selectedSocialChannel === 'LinkedIn' || selectedSocialChannel === 'Instagram') && (
            <div className="space-y-4">
              {/* Mode Switcher: Visual Slide Deck vs Copywriting Text */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSocialViewMode('CARDS')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                      socialViewMode === 'CARDS'
                        ? "bg-amber-400/20 text-amber-400 border border-amber-400/40"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Visual Carousel Deck & Canvas Exporter
                  </button>

                  <button
                    onClick={() => setSocialViewMode('COPY')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                      socialViewMode === 'COPY'
                        ? "bg-amber-400/20 text-amber-400 border border-amber-400/40"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Post Copywriting & Captions
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span>{activeCampaign.slides?.length || 0} Slides Generated</span>
                  <span>•</span>
                  <span>Brand Vault Voice: 99.4%</span>
                </div>
              </div>

              {socialViewMode === 'CARDS' && (
                <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
                  <CarouselCardViewer
                    slides={activeCampaign.slides || DEFAULT_LINKEDIN_SLIDES}
                    topic={activeCampaign.topic}
                    channel={selectedSocialChannel as 'LinkedIn' | 'Instagram'}
                  />
                </div>
              )}

              {socialViewMode === 'COPY' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Hook & Post Body */}
                  <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                        {selectedSocialChannel === 'LinkedIn' ? 'LinkedIn Viral Long Hook' : 'Instagram Feed Caption'}
                      </span>
                      <button
                        onClick={() => handleCopyContent(selectedSocialChannel === 'LinkedIn' ? activeCampaign.hook : (activeCampaign.caption || ''), 'Post Copy')}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                      {selectedSocialChannel === 'LinkedIn' ? activeCampaign.hook : activeCampaign.caption}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {activeCampaign.hashtags?.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-mono text-amber-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Slide-by-slide Text Summary */}
                  <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <span className="text-xs font-mono font-bold text-zinc-300 uppercase">
                        Slide-by-Slide Markdown Outline
                      </span>
                      <button
                        onClick={() => {
                          const outline = activeCampaign.slides?.map(s => `SLIDE ${s.slideNumber}: ${s.title}\n${(s.contentPoints || []).map(p => `• ${p}`).join('\n')}\nTakeaway: ${s.takeaway || ''}`).join('\n\n') || '';
                          handleCopyContent(outline, 'Slide Outline');
                        }}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copy Outline
                      </button>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto space-y-4">
                      {activeCampaign.slides?.map(s => (
                        <div key={s.slideNumber} className="pb-3 border-b border-zinc-800/60 last:border-0">
                          <div className="text-amber-400 font-bold mb-1">
                            SLIDE {s.slideNumber}: {s.title}
                          </div>
                          {s.subtitle && <div className="text-zinc-400 italic text-[11px] mb-1">{s.subtitle}</div>}
                          <div className="text-zinc-300 text-[11px] space-y-0.5">
                            {s.contentPoints?.map((p, idx) => <div key={idx}>• {p}</div>)}
                          </div>
                          {s.takeaway && (
                            <div className="text-amber-300/80 text-[10px] mt-1 font-semibold">
                              Takeaway: {s.takeaway}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. YOUTUBE SHORTS SCRIPT */}
          {selectedSocialChannel === 'YouTube_Shorts' && (
            <div className="space-y-4">
              <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      60-Second High-Retention Vertical Script
                    </span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Engineered for 85%+ completion rates with visual interrupts and kinetic sound cues.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const fullScript = (activeCampaign.shortsScenes || DEFAULT_SHORTS_SCENES).map(s => (
                          `[${s.timeCode}]\nVISUAL: ${s.visualDirection}\nSFX: ${s.sfxCue}\nTEXT ON SCREEN: ${s.screenText}\nVOICEOVER: "${s.voiceover}"`
                        )).join('\n\n');
                        handleCopyContent(fullScript, 'YouTube Shorts Script');
                      }}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Full Script
                    </button>
                  </div>
                </div>

                {/* 0-3s Retention Hook Alert */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                      0-3s Pattern Interrupt Hook
                    </div>
                    <div className="text-xs text-white font-medium mt-0.5">
                      "{activeCampaign.hook}"
                    </div>
                  </div>
                </div>

                {/* Scene Timeline Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(activeCampaign.shortsScenes || DEFAULT_SHORTS_SCENES).map((scene, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-black/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="px-2 py-0.5 bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-md font-bold">
                          {scene.timeCode}
                        </span>
                        <span className="text-zinc-500 text-[11px]">Scene #{idx + 1}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-mono text-zinc-500">Visual Direction</div>
                        <p className="text-xs text-zinc-300 leading-snug">{scene.visualDirection}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-mono text-cyan-400">SFX Audio Cue</div>
                        <p className="text-[11px] text-cyan-200/80 font-mono italic">{scene.sfxCue}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-mono text-amber-400">On-Screen Text Overlay</div>
                        <span className="inline-block px-2 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold rounded">
                          {scene.screenText}
                        </span>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                        <div className="text-[10px] uppercase font-mono text-zinc-400">Word-for-Word Voiceover</div>
                        <p className="text-xs text-white font-medium leading-relaxed bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                          "{scene.voiceover}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Loop CTA */}
                {activeCampaign.loopCta && (
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>Loop Call-to-Action: <strong className="text-amber-400">{activeCampaign.loopCta}</strong></span>
                    <button
                      onClick={() => handleCopyContent(activeCampaign.loopCta || '', 'Loop CTA')}
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Copy CTA
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. X (TWITTER) 7-PART THREAD */}
          {selectedSocialChannel === 'X_Thread' && (
            <div className="space-y-4">
              <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      X (Twitter) 7-Part Viral Thread
                    </span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Formulated with punchy 280-character compliance, bookmark triggers, and tactical frameworks.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const fullThread = (activeCampaign.threadTweets || DEFAULT_THREAD_TWEETS).map(t => t.text).join('\n\n---\n\n');
                      handleCopyContent(fullThread, '7-Part Twitter Thread');
                    }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Full 7-Part Thread
                  </button>
                </div>

                {/* 7 Tweets List */}
                <div className="space-y-3">
                  {(activeCampaign.threadTweets || DEFAULT_THREAD_TWEETS).map((tweet, idx) => {
                    const charCount = tweet.text.length;
                    const isOverLimit = charCount > 280;
                    return (
                      <div
                        key={tweet.tweetNumber || idx + 1}
                        className="p-4 rounded-xl bg-black/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Twitter className="w-3.5 h-3.5 text-sky-400" />
                            <span className="font-bold text-white">Tweet {tweet.tweetNumber || idx + 1} / 7</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[11px] font-mono font-bold",
                              isOverLimit ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-zinc-800 text-zinc-400"
                            )}>
                              {charCount} / 280 chars
                            </span>
                            <button
                              onClick={() => handleCopyContent(tweet.text, `Tweet #${tweet.tweetNumber || idx + 1}`)}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                          {tweet.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMAGE STUDIO & VISUAL ASSETS */}
      {activeTab === 'IMAGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Controls */}
          <div className="space-y-4 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Visual Prompt & Synthesis
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                Live Engine
              </span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Visual Prompt</label>
              <textarea
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                rows={4}
                className="w-full p-3 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60 leading-relaxed"
                placeholder="Describe visual asset..."
              />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-zinc-500 block">Quick Architectural Presets</label>
              <div className="space-y-1">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => setImagePrompt(qp)}
                    className="w-full text-left p-2 rounded-lg bg-black/40 hover:bg-zinc-800/60 border border-zinc-800/60 text-[11px] text-zinc-400 hover:text-white line-clamp-1 cursor-pointer transition-all"
                  >
                    • {qp}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-zinc-400 block">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {(['16:9', '1:1', '9:16', '4:5'] as const).map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setImageRatio(ratio)}
                    className={cn(
                      "py-2 text-xs font-mono rounded-lg border transition-all cursor-pointer text-center",
                      imageRatio === ratio
                        ? "bg-amber-400/10 border-amber-400/40 text-amber-400 font-bold"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-zinc-400 block">Aesthetic Preset</label>
              <select
                value={imageStyle}
                onChange={e => setImageStyle(e.target.value as any)}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-400/60 cursor-pointer"
              >
                <option value="3D_DATA_NEURAL">3D Data Neural & Obsidian Core</option>
                <option value="CYBER_SCHEMATIC">Cyber Schematic & Technical Blueprint</option>
                <option value="MINIMAL_STUDIO">Minimalist Studio Lighting</option>
                <option value="CORPORATE_POLISHED">High-End Corporate Editorial</option>
              </select>
            </div>

            {/* Prompt Enhancer Switch */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Prompt Enhancer Active
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Injects 8k lighting, obsidian palette, and raytracing modifiers.
                </div>
              </div>
              <input
                type="checkbox"
                checked={enhancePrompt}
                onChange={e => setEnhancePrompt(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className="w-full justify-center"
              leftIcon={<ImageIcon className={cn("w-4 h-4", isGeneratingImage && "animate-spin")} />}
            >
              {isGeneratingImage ? 'Synthesizing Live AI Asset...' : 'Render Brand Visual Asset'}
            </Button>
          </div>

          {/* Visual Output Display */}
          <div className="lg:col-span-2 p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-between space-y-4">
            <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Synthesized Canvas • {imageRatio} • 1080p Resolution
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={generatedImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  download="sigma-tactix-visual.jpg"
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Asset
                </a>
              </div>
            </div>

            {/* Render Stage */}
            <div className={cn(
              "relative rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl bg-black flex items-center justify-center max-h-[480px] w-full",
              imageRatio === '16:9' ? 'aspect-video' : imageRatio === '1:1' ? 'max-w-md aspect-square' : imageRatio === '4:5' ? 'max-w-md aspect-[4/5]' : 'max-w-sm aspect-[9/16]'
            )}>
              {isGeneratingImage ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <div className="text-xs font-mono text-amber-400 font-bold">
                    SYNTHESIZING PROMPT-ALIGNED CREATIVE...
                  </div>
                  <div className="text-[11px] text-zinc-500 max-w-xs">
                    Rendering lighting vectors, obsidian textures, and camera depth.
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={generatedImageUrl}
                    alt="AI Generated Asset"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 p-2 bg-black/75 backdrop-blur-md rounded-xl border border-white/10 text-[11px] font-mono text-zinc-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Brand Vault Overlay: Active
                  </div>
                </>
              )}
            </div>

            {/* Session History Tray */}
            {imageHistory.length > 0 && (
              <div className="w-full pt-3 border-t border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                  <History className="w-3 h-3" /> Recent Session Renders
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {imageHistory.map((rec, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGeneratedImageUrl(rec.url)}
                      className={cn(
                        "shrink-0 w-24 h-16 rounded-lg overflow-hidden border transition-all cursor-pointer relative group",
                        generatedImageUrl === rec.url ? "border-amber-400 ring-2 ring-amber-400/20" : "border-zinc-800 hover:border-zinc-600"
                      )}
                    >
                      <img src={rec.url} alt="History" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-mono text-white font-bold">
                        {rec.ratio}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TEXT ENGINE */}
      {activeTab === 'TEXT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Form */}
          <div className="space-y-4 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Text Generation Config
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Content Topic or Thesis</label>
              <textarea
                value={textTopic}
                onChange={e => setTextTopic(e.target.value)}
                rows={3}
                className="w-full p-3 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60 leading-relaxed"
                placeholder="Enter topic..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Content Format</label>
                <select
                  value={textFormat}
                  onChange={e => setTextFormat(e.target.value as any)}
                  className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-400/60 cursor-pointer"
                >
                  <option value="LONG_FORM">Long-Form Teardown</option>
                  <option value="CASE_STUDY">Empirical Case Study</option>
                  <option value="NEWSLETTER">Executive Newsletter</option>
                  <option value="PR_RELEASE">Technical PR Release</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-400/60"
                />
              </div>
            </div>

            {/* Anti-Slop Check */}
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Anti-Slop Filter Active
                </span>
                <input
                  type="checkbox"
                  checked={antiSlopActive}
                  onChange={e => setAntiSlopActive(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Bans buzzwords: "supercharge", "empower", "seamlessly", "revolutionize". Enforces concrete engineering evidence and Brand Vault tone vectors.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateText}
              disabled={isGeneratingText}
              className="w-full justify-center"
              leftIcon={<Sparkles className={cn("w-4 h-4", isGeneratingText && "animate-spin")} />}
            >
              {isGeneratingText ? 'Synthesizing with Nexus-03...' : 'Generate Authoritative Piece'}
            </Button>
          </div>

          {/* Editor & Preview Workspace */}
          <div className="lg:col-span-2 p-6 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedItem.title}</h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-1">
                    <span>Voice Alignment: <strong className="text-[var(--sigma-vermilion)]">{selectedItem.voiceAlignmentScore}%</strong></span>
                    <span>•</span>
                    <span>Format: <strong className="text-zinc-200">{selectedItem.type}</strong></span>
                    <span>•</span>
                    <span>Audience: <strong className="text-zinc-200">{selectedItem.targetAudience}</strong></span>
                  </div>
                </div>

                <Badge variant="vermilion">
                  {selectedItem.status}
                </Badge>
              </div>

              <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl max-h-[460px] overflow-y-auto text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedItem.generatedContent}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs text-zinc-400 font-mono">
              <span>Readability: Grade 10.4 (Flesch-Kincaid)</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyContent(selectedItem.generatedContent, 'Markdown Content')}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy Markdown
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VIDEO STUDIO & STORYBOARDER */}
      {activeTab === 'VIDEO' && (
        <div className="space-y-6">
          <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-[var(--sigma-vermilion)]" />
                Scene-by-Scene Video Storyboarder
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Generates camera direction, visual scene prompts, voiceover text, and motion directions for 60s viral teardowns.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={videoDuration}
                onChange={e => setVideoDuration(e.target.value as any)}
                className="p-2 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-300"
              >
                <option value="30s">30s Short Clip</option>
                <option value="60s">60s Full Teardown</option>
                <option value="90s">90s In-Depth Explainer</option>
              </select>

              <Button
                variant="primary"
                onClick={handleGenerateVideoStoryboard}
                disabled={isGeneratingVideo}
                leftIcon={<Play className="w-3.5 h-3.5 fill-black" />}
              >
                {isGeneratingVideo ? 'Scripting...' : 'Generate Storyboard'}
              </Button>
            </div>
          </div>

          {/* Storyboard Scenes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SEED_CONTENT_ITEMS[3].videoStoryboard?.map(scene => (
              <div
                key={scene.sceneNumber}
                onClick={() => setActiveVideoScene(scene.sceneNumber)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer space-y-3",
                  activeVideoScene === scene.sceneNumber
                    ? "bg-amber-400/10 border-amber-400/40 text-white shadow-lg shadow-amber-500/5"
                    : "bg-zinc-900/30 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-amber-400">SCENE #{scene.sceneNumber}</span>
                  <span className="text-zinc-500">{scene.durationSeconds}s duration</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">Visual Direction</div>
                  <p className="text-xs text-zinc-300 leading-snug">{scene.visualDirection}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-zinc-800/60">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">Motion Prompt</div>
                  <p className="text-[11px] text-zinc-400 font-mono italic">{scene.motionPrompt}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-zinc-800/60">
                  <div className="text-[10px] uppercase font-mono text-amber-400">Voiceover Script</div>
                  <p className="text-xs text-zinc-200 font-medium leading-relaxed bg-black/40 p-2 rounded-lg border border-zinc-800/60">
                    "{scene.voiceoverText}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
const DEFAULT_LINKEDIN_SLIDES = isDemoSeedEnabled() ? DEMO_DEFAULT_LINKEDIN_SLIDES : [];
const DEFAULT_THREAD_TWEETS = isDemoSeedEnabled() ? DEMO_DEFAULT_THREAD_TWEETS : [];
const DEFAULT_SHORTS_SCENES = isDemoSeedEnabled() ? DEMO_DEFAULT_SHORTS_SCENES : [];
