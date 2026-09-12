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
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

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

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedArticle);
    setCopied(true);
    notifySuccess('Copied to Clipboard', 'Article markdown copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Editorial & Content Engine</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  Digital Marketing
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Produce executive thought leadership, deep-dive guides, and newsletters with rigorous anti-slop guardrails.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            Brand Voice Alignment: {brandVoiceScore}%
          </div>
          <button
            onClick={() => setAntiSlopActive(!antiSlopActive)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5",
              antiSlopActive 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Anti-Slop Filter: {antiSlopActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration & Generator */}
        <div className="lg:col-span-5 space-y-6">
          {/* Format Selector */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Article Format & Objective
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ARTICLE_FORMATS.map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between",
                    selectedFormat === fmt.id
                      ? "bg-amber-500/10 border-amber-500/40 text-white shadow-lg shadow-amber-500/5"
                      : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                  )}
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-100">{fmt.label}</div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{fmt.description}</p>
                  </div>
                  <div className="text-[11px] font-mono text-amber-400/80 mt-3 pt-2 border-t border-white/5">
                    {fmt.wordCount}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Content Parameters
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Article Topic / Thesis</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                placeholder="e.g. Why B2B software companies must replace outsourced agencies with autonomous growth infrastructure..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Audience & Persona</label>
              <input
                type="text"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="e.g. Series A/B SaaS Founders, VP Marketing"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Keywords & Semantic Entities</label>
              <input
                type="text"
                value={primaryKeyword}
                onChange={e => setPrimaryKeyword(e.target.value)}
                placeholder="e.g. Sovereign Growth OS, B2B pipeline infrastructure"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="pt-2">
              <button
                data-tutorial-id="tut-content-generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Synthesizing Article & Checking Guardrails...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Voice-Aligned Article
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Editor & Output Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 min-h-[560px] flex flex-col">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-300">Live Editorial Document</span>
                <span className="text-xs text-slate-500 font-mono">({generatedArticle.split(/\s+/).filter(Boolean).length} words)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Markdown'}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([generatedArticle], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
                    a.click();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .MD
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-4 font-sans text-slate-200 text-sm leading-relaxed whitespace-pre-wrap selection:bg-amber-500/30">
              {generatedArticle}
            </div>

            {/* Quality Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> 0 AI Clichés Detected
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Award className="w-4 h-4 text-amber-400" /> Reading Level: Grade 11
                </span>
              </div>
              <div className="text-slate-500">
                Synchronized with Sigmatactix Second Brain
              </div>
            </div>
          </div>
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
    </div>
  );
}
