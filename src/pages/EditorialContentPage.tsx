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
import { generateTextContent, type GenerateTextResult } from '@/src/lib/creativeApi';
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
  // No pre-filled marketing thesis: a fresh tenant writes their own topic.
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
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

  // Generated Content State — starts empty: a fresh tenant has not generated
  // an article yet, so no fabricated "sample" document is shown on load.
  const [generatedArticle, setGeneratedArticle] = useState<string>('');
  // Which engine last produced the document: a model run, the local template
  // fallback, or nothing yet. No "voice match %" — no scorer is implemented.
  const [lastEngine, setLastEngine] = useState<'gemini' | 'local-template' | null>(null);

  // Agent Run History — starts empty; only real generations land here.
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  // Generate via the real creative endpoint (Gemini when configured,
  // otherwise an honest local template — the engine field says which).
  const handleGenerate = async () => {
    if (!topic.trim()) {
      notifyError('Topic Required', 'Please enter an editorial thesis or article topic.');
      return;
    }

    setIsGenerating(true);
    try {
      const result: GenerateTextResult = await generateTextContent({
        topic: topic.trim(),
        format: selectedFormat,
        targetAudience: targetAudience.trim() || undefined,
        antiSlop: antiSlopActive
      });

      setGeneratedArticle(result.content);
      setLastEngine(result.engine);

      const wordCount = result.content.split(/\s+/).filter(Boolean).length;
      const newRun: AgentRunRecord = {
        id: `run-editorial-${Date.now()}`,
        agentName: 'Editorial Engine Swarm',
        agentRole: 'Executive Copywriter & Brand Voice Enforcer',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Editorial Content Studio',
        inputSummary: `${selectedFormat}: ${topic.trim()}`,
        outputSummary:
          result.engine === 'gemini'
            ? `Model-generated ${wordCount}-word article for ${result.audience}.`
            : `Local template draft (${wordCount} words) — no model key configured; not model output.`,
        fullOutput: result.content,
        metrics: [
          { label: 'Format', value: selectedFormat },
          { label: 'Engine', value: result.engine === 'gemini' ? 'Gemini' : 'Local template' },
          { label: 'Words', value: String(wordCount) },
          { label: 'Anti-Slop', value: antiSlopActive ? 'Active' : 'Bypassed' }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      if (result.engine === 'local-template') {
        notifySuccess(
          'Draft Generated (Local Template)',
          'No AI key is configured, so this is a deterministic local template, not model output. Configure a provider key for real generation.'
        );
      } else {
        notifySuccess('Article Generated', `Produced a ${wordCount}-word article via the configured model.`);
      }
    } catch (err: any) {
      notifyError('Generation Failed', err?.message || 'Could not generate the article.');
    } finally {
      setIsGenerating(false);
    }
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
    <div className="space-y-8 lg:space-y-10 pb-16">
      {/* Top Banner */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8 lg:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="brand" size="xs">CONTENT ENGINE</Badge>
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
              {lastEngine === 'gemini'
                ? 'Last draft: model-generated'
                : lastEngine === 'local-template'
                  ? 'Last draft: local template (no key)'
                  : 'No draft yet — generate to start'}
            </Badge>

            <button
              onClick={() => setAntiSlopActive(!antiSlopActive)}
              aria-pressed={antiSlopActive}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer",
                antiSlopActive
                  ? "bg-[var(--sigma-primary-subtle)] border-[var(--sigma-primary)]/40 text-[var(--sigma-text)]"
                  : "border-[var(--sigma-border-strong)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Anti-Slop: {antiSlopActive ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Generator */}
        <div className="lg:col-span-5 space-y-6">
          {/* Format Selector */}
          <GlassCard spotlight elevation="flat" className="p-6 md:p-7 space-y-5">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-[var(--sigma-border)]/60 text-xs font-semibold uppercase tracking-wider text-[var(--sigma-muted)]">
              <BookOpen className="w-4 h-4 text-[var(--sigma-vermilion)]" />
              <span>Article Format &amp; Objective</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {ARTICLE_FORMATS.map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all flex flex-col justify-between group",
                    selectedFormat === fmt.id
                      ? "bg-[var(--sigma-vermilion)]/10 border-[var(--sigma-vermilion)]/50 text-[var(--sigma-text)] shadow-xs"
                      : "bg-[var(--sigma-surface)] border-[var(--sigma-border)] text-[var(--sigma-muted)] hover:border-[var(--sigma-border-hover)] hover:text-[var(--sigma-text)]"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="font-semibold text-xs text-[var(--sigma-text)] group-hover:text-[var(--sigma-vermilion)] transition-colors">
                      {fmt.label}
                    </div>
                    <p className="text-xs text-[var(--sigma-muted)] line-clamp-2 leading-relaxed">
                      {fmt.description}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-[var(--sigma-vermilion)] mt-3 pt-2.5 border-t border-[var(--sigma-border)] font-medium">
                    {fmt.wordCount}
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Form Fields */}
          <GlassCard spotlight elevation="flat" className="p-6 md:p-7 space-y-6">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-[var(--sigma-border)]/60 text-xs font-semibold uppercase tracking-wider text-[var(--sigma-muted)]">
              <Sliders className="w-4 h-4 text-[var(--sigma-vermilion)]" />
              <span>Content Parameters</span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--sigma-text)] mb-2">Article Topic / Thesis</label>
                <textarea
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  rows={3}
                  placeholder="e.g. Why B2B software companies must replace outsourced agencies with autonomous growth infrastructure..."
                  className="w-full px-4 py-3 rounded-xl bg-[var(--sigma-bg)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-muted)] focus:outline-none focus:border-[var(--sigma-vermilion)]/60 resize-none leading-relaxed transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--sigma-text)] mb-2">Target Audience &amp; Persona</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  placeholder="e.g. Series A/B SaaS Founders, VP Marketing"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--sigma-bg)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-muted)] focus:outline-none focus:border-[var(--sigma-vermilion)]/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--sigma-text)] mb-2">Target Keywords &amp; Semantic Entities</label>
                <input
                  type="text"
                  value={primaryKeyword}
                  onChange={e => setPrimaryKeyword(e.target.value)}
                  placeholder="e.g. Sovereign Growth OS, B2B pipeline infrastructure"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--sigma-bg)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-muted)] focus:outline-none focus:border-[var(--sigma-vermilion)]/60 transition-colors"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--sigma-border)]/40">
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
              <div className="mb-4 p-4 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border-strong)] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {repurposedMeta.sourceThumbnail ? (
                    <img
                      src={repurposedMeta.sourceThumbnail}
                      alt="Thumbnail"
                      className="w-14 h-9 object-cover rounded-lg border border-[var(--sigma-border)] shrink-0"
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-[var(--sigma-primary-subtle)] text-[var(--sigma-primary)] shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--sigma-text)] text-xs line-clamp-1">{repurposedMeta.sourceTitle || 'External Source'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-accent/10 text-amber-accent border border-amber-accent/25 shrink-0">
                        {repurposedMeta.sourceUrl.includes('youtube') ? 'YouTube Video Ingestion' : 'Web Ingestion'}
                      </span>
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
                <div className="flex items-center gap-2 text-[11px] text-[var(--sigma-text-muted)] font-mono shrink-0">
                  <span className="px-2 py-0.5 rounded bg-emerald-accent/10 border border-emerald-accent/25 text-emerald-accent flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {repurposedMeta.citedQuotes?.length || 0} Grounded Quotes
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[var(--sigma-surface)] border border-[var(--sigma-border)] text-[var(--sigma-text-muted)]">
                    {repurposedMeta.estimatedReadTime}
                  </span>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-4 font-sans text-[var(--sigma-text-soft)] text-sm leading-relaxed whitespace-pre-wrap selection:bg-amber-accent/30">
              {generatedArticle ? generatedArticle : (
                <div className="text-xs text-[var(--sigma-muted)] font-mono leading-relaxed">
                  No article yet. Set a topic on the left and run "Generate Voice-Aligned Article", or repurpose a source via Agent Reach. Nothing shown here is a pre-seeded sample.
                </div>
              )}
            </div>

            {/* Grounded Quotes Drawer if available */}
            {repurposedMeta?.citedQuotes && repurposedMeta.citedQuotes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--sigma-border)] space-y-2">
                <div className="text-[10px] font-mono text-amber-accent uppercase font-bold flex items-center gap-1.5">
                  <Quote className="w-3 h-3" /> Grounded Primary Citations ({repurposedMeta.citedQuotes.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {repurposedMeta.citedQuotes.slice(0, 4).map((q, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] text-[11px] space-y-1">
                      <p className="text-[var(--sigma-text-soft)] italic font-serif">"{q.quote}"</p>
                      <span className="text-[10px] font-mono text-[var(--sigma-text-muted)] block">{q.context}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Footer — honest: says which engine produced the draft.
                No fabricated "cliché count" or "reading level" (no such scorer
                is implemented). */}
            <div className="mt-4 pt-4 border-t border-[var(--sigma-border)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--sigma-muted)]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[var(--sigma-text)]">
                  <Award className="w-4 h-4 text-[var(--sigma-vermilion)]" />
                  {lastEngine === 'gemini'
                    ? 'Source: configured model'
                    : lastEngine === 'local-template'
                      ? 'Source: deterministic local template'
                      : 'No draft generated yet'}
                </span>
              </div>
              <div className="text-[var(--sigma-muted)]">
                {generatedArticle
                  ? `${generatedArticle.split(/\s+/).filter(Boolean).length} words in this document`
                  : 'Ready to generate'}
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
                    <Youtube className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--sigma-text)] flex items-center gap-2 flex-wrap">
                      Trend-to-Article Repurposing Pipeline
                      <Badge variant="info" size="xs">Agent Reach</Badge>
                    </h3>
                    <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5 leading-relaxed">
                      Extract full video transcripts, podcasts, or web teardowns to generate a publication-ready piece with grounded citations.
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

              {/* Source URL Field & Quick Presets */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[var(--sigma-text-soft)] flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[var(--sigma-primary)]" />
                  Source URL (YouTube Video or Web Article)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={repurposeSourceUrl}
                    onChange={e => setRepurposeSourceUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://techcrunch.com/..."
                    className="sigma-input w-full px-4 py-3 text-sm font-mono"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-[var(--sigma-text-muted)]">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setRepurposeSourceUrl('https://www.youtube.com/watch?v=jNQXAC9IVRw')}
                    className="sigma-button-secondary px-2.5 py-1 text-[11px] flex items-center gap-1"
                  >
                    <Youtube className="w-3 h-3 text-red-400" /> YouTube Demo Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepurposeSourceUrl('https://paulgraham.com/foundermode.html')}
                    className="sigma-button-secondary px-2.5 py-1 text-[11px] flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3 text-[var(--sigma-primary)]" /> Paul Graham: Founder Mode
                  </button>
                </div>
              </div>

              {/* Output Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--sigma-text-soft)]">
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
                          ? "bg-[var(--sigma-primary-subtle)] border-[var(--sigma-primary)]/50 text-[var(--sigma-text)] shadow-md"
                          : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:border-[var(--sigma-border-strong)] hover:text-[var(--sigma-text)]"
                      )}
                    >
                      <div className="font-semibold text-xs text-[var(--sigma-text)]">{fmt.label}</div>
                      <div className="text-[10px] text-[var(--sigma-text-muted)] font-mono mt-1">{fmt.wordCount}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--sigma-text-soft)]">
                  Target Audience Persona
                </label>
                <input
                  type="text"
                  value={repurposeAudience}
                  onChange={e => setRepurposeAudience(e.target.value)}
                  placeholder="e.g. Enterprise Founders, VP Engineering, CMOs"
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
                  onClick={handleRepurposeArticle}
                  disabled={isRepurposing || !repurposeSourceUrl.trim()}
                  variant="primary"
                  isLoading={isRepurposing}
                  leftIcon={!isRepurposing ? <Sparkles className="w-3.5 h-3.5" /> : undefined}
                >
                  {isRepurposing ? 'Extracting & Repurposing...' : 'Extract & Synthesize Publication'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

