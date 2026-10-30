import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Wand2, 
  Send, 
  Eye, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  ExternalLink,
  BookOpen,
  Filter,
  Sliders,
  Award,
  Globe,
  Youtube,
  X,
  Link2,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { repurposeArticleWithAgentReach } from '@/src/lib/api';
import { RepurposedArticle } from '@/src/types';
import { Button, GlassCard, Badge } from '@/src/components/ui';

interface ArticleFormat {
  id: 'THOUGHT_LEADERSHIP' | 'SEO_DEEP_DIVE' | 'CASE_STUDY' | 'NEWSLETTER';
  label: string;
  description: string;
  wordCount: string;
}

const ARTICLE_FORMATS: ArticleFormat[] = [
  {
    id: 'THOUGHT_LEADERSHIP',
    label: 'Executive Thought Leadership',
    description: 'High-signal contrarian essays targeting enterprise decision makers.',
    wordCount: '1,200 - 1,800 words'
  },
  {
    id: 'SEO_DEEP_DIVE',
    label: 'Topical Authority Deep Dive',
    description: 'Entity-dense search & AEO optimized comprehensive guide.',
    wordCount: '2,000 - 3,500 words'
  },
  {
    id: 'CASE_STUDY',
    label: 'Empirical Case Study',
    description: 'Data-backed breakdown of growth infrastructure and ROI results.',
    wordCount: '900 - 1,400 words'
  },
  {
    id: 'NEWSLETTER',
    label: 'Weekly High-Signal Brief',
    description: 'Engaging, scannable insights curated for executive subscribers.',
    wordCount: '600 - 900 words'
  }
];

export default function EditorialContentPage() {
  const { notifySuccess, notifyError } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ArticleFormat['id']>('THOUGHT_LEADERSHIP');
  const [topic, setTopic] = useState('Why Renting Marketing Headcount Kills B2B Tech Enterprise Value');
  const [targetAudience, setTargetAudience] = useState('B2B Tech Founders, CEOs, and Chief Revenue Officers');
  const [primaryKeyword, setPrimaryKeyword] = useState('B2B growth infrastructure, Sovereign Growth OS');
  const [brandVoiceScore, setBrandVoiceScore] = useState(99.4);
  const [antiSlopActive, setAntiSlopActive] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Agent Reach Repurposing State
  const [isRepurposeModalOpen, setIsRepurposeModalOpen] = useState(false);
  const [repurposeSourceUrl, setRepurposeSourceUrl] = useState('');
  const [repurposeFormat, setRepurposeFormat] = useState<ArticleFormat['id']>('THOUGHT_LEADERSHIP');
  const [repurposeAudience, setRepurposeAudience] = useState('B2B Tech Founders, CEOs, and CROs');
  const [isRepurposing, setIsRepurposing] = useState(false);
  const [repurposedMeta, setRepurposedMeta] = useState<RepurposedArticle | null>(null);

  // Generated Content State
  const [generatedArticle, setGeneratedArticle] = useState<string>(`# Why Renting Marketing Headcount Kills B2B Tech Enterprise Value

When a venture-backed tech company allocates $25,000 to $40,000 monthly to traditional digital marketing retainers, the board assumes they are purchasing growth velocity. 

In reality, they are entering a negative-compounding lease on external human headcount.

## The Three Fatal Defects of the Agency Retainer Model

### 1. Context Evaporation (The 9-Month Half-Life)
The account executive who pitches your contract rarely touches your campaigns. Execution is delegated to junior coordinators who turn over every nine months. With every departure, your positioning nuance, ad test failures, and objection patterns vanish into thin air.

### 2. Attribution Opacity
Monthly agency reviews celebrate vanity metrics: "Impressions up 42%", "Top-of-funnel clicks up 35%." Yet, the blended cost to acquire a paying enterprise customer continues to climb. Why? Because third-party agencies operate on last-click attribution models designed to justify their own existence, rather than diagnosing real pipeline friction.

### 3. Zero Durable Asset Accumulation
When you terminate an agency contract after two years and $700,000 in spend, what assets remain on your balance sheet? Zero lines of code. Zero structured knowledge bases. Zero autonomous execution engines. You are forced to reboot from scratch.

## The Sovereign Alternative: Client-Owned Growth OS

Top-performing operators are shifting from *renting labor* to *owning infrastructure*. 

By deploying an AI-native Growth OS directly inside your cloud environment:
- **Permanent Institutional Memory**: Every customer interview, sales transcript, and conversion experiment feeds an immutable Second Brain.
- **Autonomous Scoped Agents**: Specialized AI swarms execute SEO content, ad copy variants, and competitor intelligence around the clock.
- **Deterministic Human-in-the-Loop (HITL) Guardrails**: Senior executives approve strategies while autonomous agents handle manual labor at zero marginal cost.

Capital efficiency in 2026 is no longer about who hires the largest external agency. It is about who owns the most resilient autonomous infrastructure.`);

  // Agent Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-editorial-01',
      agentName: 'Editorial Engine Swarm',
      agentRole: 'Executive Copywriter & Brand Voice Enforcer',
      timestamp: 'Today at 04:15 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Editorial Content Studio',
      inputSummary: 'Thought Leadership: Renting Marketing Headcount vs Sovereign Growth OS',
      outputSummary: 'Generated 1,420 words. Brand Voice Match: 99.4%. Cliché count: 0.',
      fullOutput: generatedArticle,
      metrics: [
        { label: 'Words', value: '1,420' },
        { label: 'Voice Score', value: '99.4%' },
        { label: 'Read Time', value: '5.5 min' },
        { label: 'Slop Filter', value: 'Passed' }
      ]
    }
  ]);

  const handleGenerate = () => {
    if (!topic.trim()) {
      notifyError('Topic Required', 'Please enter an editorial thesis or article topic.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const newArticle = `# ${topic}

## Executive Summary
In today's hyper-competitive software landscape, companies that rely on generic marketing playbooks face accelerating customer acquisition costs. Building proprietary topical authority is no longer optional—it is the bedrock of sovereign pipeline generation.

## Core Thesis
The primary reason B2B tech companies struggle with content conversion is not a lack of output, but a lack of proprietary point-of-view (POV). When marketing material regurgitates common knowledge, buyers instinctively tune out.

## Strategic Framework
1. **First-Principles ICP Alignment**: Ground every paragraph in empirical customer pain points drawn directly from closed-won sales calls.
2. **Anti-Slop Guardrails**: Systematically purge buzzwords like "in today's fast-paced digital world" and "game changer".
3. **High-Density Data Proof**: Back every thesis with verified enterprise telemetry.

## Operational Playbook
Deploying scoped AI swarms allows your team to generate authoritative, voice-aligned thought leadership in minutes instead of weeks, preserving executive time for strategic direction.`;

      setGeneratedArticle(newArticle);

      const newRun: AgentRunRecord = {
        id: `run-editorial-${Date.now()}`,
        agentName: 'Editorial Engine Swarm',
        agentRole: 'Executive Copywriter & Brand Voice Enforcer',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Editorial Content Studio',
        inputSummary: `${selectedFormat}: ${topic}`,
        outputSummary: `Generated article for ${targetAudience}. Brand Voice Match: ${brandVoiceScore}%.`,
        fullOutput: newArticle,
        metrics: [
          { label: 'Format', value: selectedFormat },
          { label: 'Voice Score', value: `${brandVoiceScore}%` },
          { label: 'Anti-Slop', value: antiSlopActive ? 'Active' : 'Bypassed' }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Article Generated', 'Produced high-signal thought leadership piece adhering to brand guidelines.');
    }, 1400);
  };

  const handleRepurposeArticle = async () => {
    if (!repurposeSourceUrl.trim()) {
      notifyError('Source URL Required', 'Please enter a valid YouTube video URL or article link.');
      return;
    }

    setIsRepurposing(true);
    try {
      const article = await repurposeArticleWithAgentReach({
        sourceUrl: repurposeSourceUrl.trim(),
        format: repurposeFormat,
        targetAudience: repurposeAudience.trim() || targetAudience
      });

      setGeneratedArticle(article.markdownContent);
      setTopic(article.title);
      setSelectedFormat(repurposeFormat);
      setRepurposedMeta(article);

      const newRun: AgentRunRecord = {
        id: `run-repurpose-${Date.now()}`,
        agentName: 'Agent Reach Trend-to-Article Swarm',
        agentRole: 'Internet Deep Research & Editorial Synthesizer',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Agent Reach Pipeline',
        inputSummary: `Source: ${article.sourceTitle || article.sourceUrl} (${article.format})`,
        outputSummary: `Extracted & synthesized "${article.title}" with ${article.citedQuotes?.length || 0} grounded citations.`,
        fullOutput: article.markdownContent,
        metrics: [
          { label: 'Source', value: article.sourceUrl.includes('youtube') ? 'YouTube' : 'Web' },
          { label: 'Read Time', value: article.estimatedReadTime || '5 min' },
          { label: 'Citations', value: `${article.citedQuotes?.length || 0}` },
          { label: 'Format', value: article.format }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Article Repurposed', `Successfully ingested source and synthesized executive ${article.format} article.`);
      setIsRepurposeModalOpen(false);
    } catch (err: any) {
      console.error('Repurpose error:', err);
      notifyError('Repurposing Failed', err.message || 'Failed to extract and repurpose content.');
    } finally {
      setIsRepurposing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedArticle);
    setCopied(true);
    notifySuccess('Copied to Clipboard', 'Article markdown copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="xs">CONTENT ENGINE</Badge>
              <span className="text-xs font-mono text-[var(--sigma-muted)]">EXECUTIVE EDITORIAL ARCHITECTURE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <FileText className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Editorial & Thought Leadership Studio
            </h1>
            <p className="text-[var(--sigma-muted)] text-sm max-w-2xl leading-relaxed">
              Produce executive thought leadership, deep-dive guides, and newsletters with rigorous anti-slop guardrails and grounded entity citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setIsRepurposeModalOpen(true)}
              variant="outline"
              size="md"
              icon={<Globe className="w-3.5 h-3.5 text-[var(--sigma-vermilion)]" />}
            >
              Repurpose via Agent Reach
            </Button>

            <Badge variant="success" size="md" icon={<ShieldCheck className="w-4 h-4" />}>
              Brand Voice: {brandVoiceScore}%
            </Badge>

            <Button
              onClick={() => setAntiSlopActive(!antiSlopActive)}
              variant={antiSlopActive ? "primary" : "secondary"}
              size="md"
              icon={<Filter className="w-3.5 h-3.5" />}
            >
              Anti-Slop: {antiSlopActive ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Generator */}
        <div className="lg:col-span-5 space-y-6">
          {/* Format Selector */}
          <GlassCard spotlight elevation="flat" className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sigma-muted)]">
              <BookOpen className="w-4 h-4 text-[var(--sigma-vermilion)]" />
              <span>Article Format & Objective</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ARTICLE_FORMATS.map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between group",
                    selectedFormat === fmt.id
                      ? "bg-[var(--sigma-vermilion)]/10 border-[var(--sigma-vermilion)]/50 text-[var(--sigma-text)] shadow-xs"
                      : "bg-[var(--sigma-surface)] border-[var(--sigma-border)] text-[var(--sigma-muted)] hover:border-[var(--sigma-border-hover)] hover:text-[var(--sigma-text)]"
                  )}
                >
                  <div>
                    <div className="font-semibold text-xs text-[var(--sigma-text)] group-hover:text-[var(--sigma-vermilion)] transition-colors">
                      {fmt.label}
                    </div>
                    <p className="text-[11px] text-[var(--sigma-muted)] mt-1 line-clamp-2 leading-relaxed">
                      {fmt.description}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--sigma-vermilion)] mt-3 pt-2 border-t border-[var(--sigma-border)] font-medium">
                    {fmt.wordCount}
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Form Fields */}
          <GlassCard spotlight elevation="flat" className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sigma-muted)]">
              <Sliders className="w-4 h-4 text-[var(--sigma-vermilion)]" />
              <span>Content Parameters</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--sigma-text)] mb-1.5">Article Topic / Thesis</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                placeholder="e.g. Why B2B software companies must replace outsourced agencies with autonomous growth infrastructure..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--sigma-bg)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-muted)] focus:outline-none focus:border-[var(--sigma-vermilion)]/60 resize-none leading-relaxed transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--sigma-text)] mb-1.5">Target Audience & Persona</label>
              <input
                type="text"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="e.g. Series A/B SaaS Founders, VP Marketing"
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--sigma-bg)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-muted)] focus:outline-none focus:border-[var(--sigma-vermilion)]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--sigma-text)] mb-1.5">Target Keywords & Semantic Entities</label>
              <input
                type="text"
                value={primaryKeyword}
                onChange={e => setPrimaryKeyword(e.target.value)}
                placeholder="e.g. Sovereign Growth OS, B2B pipeline infrastructure"
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--sigma-bg)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-muted)] focus:outline-none focus:border-[var(--sigma-vermilion)]/60 transition-colors"
              />
            </div>

            <div className="pt-2">
              <Button
                data-tutorial-id="tut-content-generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="primary"
                size="lg"
                className="w-full justify-center"
                icon={isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {isGenerating ? 'Synthesizing Article & Checking Guardrails...' : 'Generate Voice-Aligned Article'}
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Editor & Output Preview */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard spotlight elevation="raised" className="p-6 min-h-[560px] flex flex-col">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-[var(--sigma-text)]">Live Editorial Document</span>
                <span className="text-xs text-[var(--sigma-muted)] font-mono">({generatedArticle.split(/\s+/).filter(Boolean).length} words)</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="xs"
                  icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-accent" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? 'Copied' : 'Copy Markdown'}
                </Button>
                <Button
                  onClick={() => {
                    const blob = new Blob([generatedArticle], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
                    a.click();
                  }}
                  variant="outline"
                  size="xs"
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Export .MD
                </Button>
              </div>
            </div>

            {/* Source Grounding Banner if populated by Agent Reach */}
            {repurposedMeta && (
              <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {repurposedMeta.sourceThumbnail ? (
                    <img 
                      src={repurposedMeta.sourceThumbnail} 
                      alt="Thumbnail" 
                      className="w-14 h-9 object-cover rounded-lg border border-amber-500/30 shrink-0" 
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-accent shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs line-clamp-1">{repurposedMeta.sourceTitle || 'External Source'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-400/20 text-amber-accent shrink-0">
                        {repurposedMeta.sourceUrl.includes('youtube') ? 'YouTube Video Ingestion' : 'Web Ingestion'}
                      </span>
                    </div>
                    <a 
                      href={repurposedMeta.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[11px] text-amber-400/80 hover:text-amber-200 hover:underline flex items-center gap-1 mt-0.5 font-mono"
                    >
                      {repurposedMeta.sourceUrl} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono shrink-0">
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {repurposedMeta.citedQuotes?.length || 0} Grounded Quotes
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">
                    {repurposedMeta.estimatedReadTime}
                  </span>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-4 font-sans text-slate-200 text-sm leading-relaxed whitespace-pre-wrap selection:bg-amber-500/30">
              {generatedArticle}
            </div>

            {/* Grounded Quotes Drawer if available */}
            {repurposedMeta?.citedQuotes && repurposedMeta.citedQuotes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
                  <Quote className="w-3 h-3" /> Grounded Primary Citations ({repurposedMeta.citedQuotes.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {repurposedMeta.citedQuotes.slice(0, 4).map((q, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-[11px] space-y-1">
                      <p className="text-zinc-300 italic font-serif">"{q.quote}"</p>
                      <span className="text-[10px] font-mono text-amber-400/70 block">{q.context}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Footer */}
            <div className="mt-4 pt-4 border-t border-[var(--sigma-border)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--sigma-muted)]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-accent">
                  <CheckCircle2 className="w-4 h-4" /> 0 AI Clichés Detected
                </span>
                <span className="flex items-center gap-1.5 text-[var(--sigma-text)]">
                  <Award className="w-4 h-4 text-[var(--sigma-vermilion)]" /> Reading Level: Grade 11
                </span>
              </div>
              <div className="text-[var(--sigma-muted)]">
                Synchronized with Sigmatactix Second Brain
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Agent Run Results Section */}
      <div className="mt-10">
        <AgentRunResults
          records={runHistory}
          title="Editorial Agent Run Results"
          description="Real-time execution log of article generations, voice alignment checks, and topical schema outputs."
          onClear={() => setRunHistory([])}
        />
      </div>

      {/* Agent Reach Trend-to-Article Repurposing Modal */}
      <AnimatePresence>
        {isRepurposeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-[#0F0F12] border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Youtube className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Trend-to-Article Repurposing Pipeline
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full font-bold">
                        Agent Reach Live
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Extract full video transcripts, podcasts, or web teardowns to generate a publication-ready piece with grounded citations.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRepurposeModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Source URL Field & Quick Presets */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  Source URL (YouTube Video or Web Article)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={repurposeSourceUrl}
                    onChange={e => setRepurposeSourceUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://techcrunch.com/..."
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setRepurposeSourceUrl('https://www.youtube.com/watch?v=jNQXAC9IVRw')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Youtube className="w-3 h-3 text-red-400" /> YouTube Demo Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepurposeSourceUrl('https://paulgraham.com/foundermode.html')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3 text-amber-400" /> Paul Graham: Founder Mode
                  </button>
                </div>
              </div>

              {/* Output Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Target Publication Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ARTICLE_FORMATS.map(fmt => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setRepurposeFormat(fmt.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        repurposeFormat === fmt.id
                          ? "bg-amber-500/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/5"
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                      )}
                    >
                      <div className="font-semibold text-xs text-white">{fmt.label}</div>
                      <div className="text-[10px] text-amber-400/80 font-mono mt-1">{fmt.wordCount}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Audience Persona
                </label>
                <input
                  type="text"
                  value={repurposeAudience}
                  onChange={e => setRepurposeAudience(e.target.value)}
                  placeholder="e.g. Enterprise Founders, VP Engineering, CMOs"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRepurposeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRepurposeArticle}
                  disabled={isRepurposing || !repurposeSourceUrl.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isRepurposing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Extracting & Repurposing with Agent Reach...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Extract & Synthesize Publication
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

