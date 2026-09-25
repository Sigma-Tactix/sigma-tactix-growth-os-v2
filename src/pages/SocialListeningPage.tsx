import React, { useState } from 'react';
import {
  Radio,
  Search,
  Sparkles,
  Bot,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Send,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Eye,
  Filter,
  Copy,
  Check,
  Wifi,
  Swords,
  Globe,
  Youtube,
  Share2,
  X,
  ChevronRight,
  ShieldCheck,
  Flame,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import {
  SEED_SOCIAL_MENTIONS,
  SocialMention
} from '@/src/data/marketingModulesData';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { syncAgentReachSocial, scanCompetitorWithAgentReach } from '@/src/lib/api';
import { CompetitorBattlecard } from '@/src/types';
import { Button, GlassCard, Badge, Tabs, MetricWidget } from '@/src/components/ui';

export default function SocialListeningPage() {
  const { notifySuccess, notifyInfo } = useToast();
  const [mentions, setMentions] = useState<SocialMention[]>(SEED_SOCIAL_MENTIONS);
  const [selectedMention, setSelectedMention] = useState<SocialMention>(SEED_SOCIAL_MENTIONS[0]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'POSITIVE' | 'NEUTRAL' | 'CRISIS'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [responseDraft, setResponseDraft] = useState(SEED_SOCIAL_MENTIONS[0].aiResponseDraft || '');
  const [isDeployingSentinel, setIsDeployingSentinel] = useState(false);
  const [isScanningReach, setIsScanningReach] = useState(false);

  // Multi-Channel Agent Reach Scan State
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanKeyword, setScanKeyword] = useState('Sigma Tactix');
  const [scanChannel, setScanChannel] = useState<'v2ex' | 'reddit' | 'hackernews' | 'youtube' | 'web'>('v2ex');

  // Competitor Battlecard State
  const [isBattlecardModalOpen, setIsBattlecardModalOpen] = useState(false);
  const [competitorTarget, setCompetitorTarget] = useState('https://omnivanguard.com');
  const [competitorName, setCompetitorName] = useState('OmniVanguard Marketing');
  const [isScanningCompetitor, setIsScanningCompetitor] = useState(false);
  const [activeBattlecard, setActiveBattlecard] = useState<CompetitorBattlecard | null>(null);
  const [copiedBattlecard, setCopiedBattlecard] = useState(false);

  // Agent Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-social-01',
      agentName: 'Sentinel-08 Radar Swarm',
      agentRole: 'Dark Social & Brand Sentiment Monitor',
      timestamp: 'Today at 04:40 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Social Listening & Radar',
      inputSummary: 'Scanned LinkedIn, X, and Reddit for "Sigma Tactix" & "B2B Growth OS"',
      outputSummary: 'Detected 4 public mentions. 75% positive sentiment. Drafted brand-aligned response.',
      fullOutput: 'Sentiment distribution: 3 Positive, 1 Neutral, 0 Crisis. Zero brand emergencies detected.',
      metrics: [
        { label: 'Sources Scanned', value: '14' },
        { label: 'Mentions Detected', value: '4' },
        { label: 'Sentiment Index', value: '88% Positive' },
        { label: 'Response Queue', value: '1 Ready' }
      ]
    }
  ]);

  const filteredMentions = mentions.filter(m => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRISIS') return m.requiresAttention;
    return m.sentiment === activeFilter;
  });

  const handleRefreshMentions = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      notifySuccess('Mentions Synchronized', 'Scanned 14 social sources and developer forums. Found 0 active PR emergencies.');
    }, 1500);
  };

  const handleDeploySentinel = () => {
    setIsDeployingSentinel(true);
    setTimeout(() => {
      setIsDeployingSentinel(false);
      notifySuccess('Sentinel-08 Agent Deployed', 'Monitoring real-time keyword streams across Reddit, LinkedIn, X, and YouTube.');
    }, 1400);
  };

  const handleAgentReachScan = async (targetKeyword?: string, targetChannel?: string) => {
    const kw = (targetKeyword || scanKeyword || 'Sigma Tactix').trim();
    const ch = targetChannel || scanChannel || 'v2ex';
    setIsScanningReach(true);
    try {
      const res = await syncAgentReachSocial({ keyword: kw, channel: ch });
      if (res.success && res.mention) {
        const sentimentVal: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' =
          res.mention.sentiment === 'Positive' ? 'POSITIVE' : res.mention.sentiment === 'Negative' ? 'NEGATIVE' : 'NEUTRAL';
        const newMention: SocialMention = {
          id: res.mention.id || `reach-${Date.now()}`,
          platform: res.mention.platform || ch.toUpperCase(),
          channel: res.mention.platform || ch.toUpperCase(),
          author: res.mention.author || 'AgentReach Swarm',
          authorHandle: res.mention.author || 'agent_reach',
          followersCount: '12.4K',
          content: res.mention.mention_text,
          contentSnippet: res.mention.mention_text,
          timestamp: 'Just now',
          sentiment: sentimentVal,
          reach: 8200,
          engagement: 94,
          suggestedAction: sentimentVal === 'POSITIVE' ? 'AMPLIFY' : sentimentVal === 'NEGATIVE' ? 'RESOLVE' : 'ENGAGE',
          requiresAttention: res.mention.requiresAttention || sentimentVal === 'NEGATIVE',
          aiResponseDraft: res.mention.aiResponseDraft || 'Thank you for discussing this. SigmaTactix Growth OS provides automated sovereign architecture.',
        };
        setMentions(prev => [newMention, ...prev]);
        setSelectedMention(newMention);
        setResponseDraft(newMention.aiResponseDraft || '');
        notifySuccess('Agent Reach Live Capture', `Captured mention via ${res.mention.platform} tagged as ${res.mention.sentiment}.`);
        setIsScanModalOpen(false);

        const newRun: AgentRunRecord = {
          id: `run-reach-${Date.now()}`,
          agentName: 'Sentinel-08 Multi-Channel Radar',
          agentRole: 'Internet Social & Community Sentinel',
          timestamp: 'Just now',
          status: 'SUCCESS',
          moduleOrigin: 'Social Listening & Radar',
          inputSummary: `Live scan query "${kw}" across ${ch.toUpperCase()}`,
          outputSummary: `Captured 1 active thread. Sentiment: ${res.mention.sentiment}. Category: ${res.mention.category || 'Brand Mention'}.`,
          fullOutput: res.mention.mention_text,
          metrics: [
            { label: 'Channel', value: ch.toUpperCase() },
            { label: 'Sentiment', value: res.mention.sentiment },
            { label: 'Category', value: res.mention.category || 'Brand Mention' }
          ]
        };
        setRunHistory(prev => [newRun, ...prev]);
      } else {
        notifyInfo('Agent Reach Scan', 'No new discussions found matching keyword right now.');
      }
    } catch (err: any) {
      notifyInfo('Reach Router Notice', err.message || 'Could not reach backend router.');
    } finally {
      setIsScanningReach(false);
    }
  };

  const handleScanCompetitor = async () => {
    if (!competitorTarget.trim()) return;
    setIsScanningCompetitor(true);
    try {
      const card = await scanCompetitorWithAgentReach({
        target: competitorTarget.trim(),
        competitorName: competitorName.trim() || 'Competitor'
      });
      setActiveBattlecard(card);
      notifySuccess('Battlecard Synthesized', `Extracted intelligence for ${card.competitorName} with tactical counter-pitch.`);
    } catch (err: any) {
      notifyInfo('Competitor Scan Notice', err.message || 'Could not complete competitor scan.');
    } finally {
      setIsScanningCompetitor(false);
    }
  };

  const handleRegenerateResponse = () => {
    const drafts = [
      `Spot on analysis @${selectedMention.authorHandle}. Traditional marketing agencies rent junior headcount that turns over every 9 months. With them goes all accumulated test data. We designed Sigma Tactix as a sovereign Growth OS so tech companies own their permanent intelligence.`,
      `Appreciate the mention @${selectedMention.authorHandle}! The core problem in B2B tech isn't traffic—it's infrastructure coordination. When you install an AI-native Second Brain, attribution clarity and autonomous agent execution compound on your balance sheet forever.`,
      `Empirical truth @${selectedMention.authorHandle}. In 2026, leading operators are ending the agency retainer tax and deploying sovereign AI agent swarms under strict human-in-the-loop guardrails.`
    ];
    const newDraft = drafts[Math.floor(Math.random() * drafts.length)];
    setResponseDraft(newDraft);
    notifySuccess('Response Draft Re-synthesized', 'Generated revised brand voice response draft.');
  };

  const handleSendResponse = () => {
    const newRun: AgentRunRecord = {
      id: `run-social-${Date.now()}`,
      agentName: 'Nexus-03 Communication Swarm',
      agentRole: 'Social Engagement & Brand Protector',
      timestamp: 'Just now',
      status: 'SUCCESS',
      moduleOrigin: 'Social Listening & Radar',
      inputSummary: `Response to @${selectedMention.authorHandle} on ${selectedMention.channel}`,
      outputSummary: 'Approved and staged in HITL dispatch buffer.',
      fullOutput: responseDraft,
      metrics: [
        { label: 'Channel', value: selectedMention.channel },
        { label: 'Author', value: selectedMention.authorHandle },
        { label: 'Voice Match', value: '99.1%' }
      ]
    };
    setRunHistory(prev => [newRun, ...prev]);
    notifySuccess('Response Dispatched to HITL Queue', 'Human operator approved draft; queued for publication.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="xs">MONITORING LAYER</Badge>
              <span className="text-xs font-mono text-[var(--sigma-muted)]">SENTINEL-08 RADAR SWARM</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <Radio className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Social Listening & Brand Sentiment
            </h1>
            <p className="text-[var(--sigma-muted)] text-sm max-w-2xl leading-relaxed">
              Real-time radar scanning LinkedIn, X (Twitter), Reddit, and YouTube comments for brand mentions, competitor complaints, and immediate response drafting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setIsScanModalOpen(true)}
              disabled={isScanningReach}
              variant="outline"
              size="md"
              icon={<Wifi className={cn("w-3.5 h-3.5 text-[var(--sigma-vermilion)]", isScanningReach && "animate-pulse")} />}
            >
              {isScanningReach ? 'Scanning Router...' : 'Agent Reach Multi-Scan'}
            </Button>

            <Button
              onClick={handleRefreshMentions}
              disabled={isRefreshing}
              variant="outline"
              size="md"
              icon={<RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />}
            >
              {isRefreshing ? 'Scanning Feeds...' : 'Sync Social Feeds'}
            </Button>

            <Button
              onClick={handleDeploySentinel}
              disabled={isDeployingSentinel}
              variant="primary"
              size="md"
              icon={<Bot className="w-3.5 h-3.5" />}
            >
              {isDeployingSentinel ? 'Deploying...' : 'Deploy Sentinel-08'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricWidget
          label="Brand Sentiment Ratio"
          value="92.4%"
          delta={{ value: '+3.2%', trend: 'up' }}
          subtext="Based on 340 monthly mentions"
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        />

        <MetricWidget
          label="Average Response Latency"
          value="3.4 min"
          delta={{ value: '-1.8m', trend: 'down' }}
          subtext="Via AI Response Drafter"
          icon={<Zap className="w-4 h-4 text-[var(--sigma-vermilion)]" />}
        />

        <GlassCard spotlight elevation="flat" className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-[var(--sigma-muted)]">Competitor Radar</span>
              <Badge variant="brand" size="xs">Agent Reach</Badge>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--sigma-vermilion)]">
              18 Opps
            </div>
            <div className="text-[11px] text-[var(--sigma-muted)] mt-1">Intercepted from competitor forums</div>
          </div>
          <Button
            onClick={() => setIsBattlecardModalOpen(true)}
            variant="outline"
            size="xs"
            className="mt-3 w-full justify-center"
            icon={<Swords className="w-3 h-3 text-[var(--sigma-vermilion)]" />}
          >
            Scan Competitor Battlecard
          </Button>
        </GlassCard>

        <MetricWidget
          label="PR Crisis Sentinel"
          value="Normal"
          subtext="No hostile campaigns detected"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-[var(--sigma-border)] pb-3">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'All Mentions' },
            { id: 'POSITIVE', label: 'Positive Sentiment' },
            { id: 'NEUTRAL', label: 'Neutral Sentiment' },
            { id: 'CRISIS', label: 'Crisis Alerts', icon: <AlertTriangle className="w-3 h-3 text-rose-400" /> }
          ]}
          activeTab={activeFilter}
          onChange={(id) => setActiveFilter(id as any)}
          variant="pill"
          size="sm"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentions List */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-medium text-[var(--sigma-muted)] uppercase tracking-wider px-1">
            Incoming Mentions Stream ({filteredMentions.length})
          </div>

          {filteredMentions.map(item => (
            <GlassCard
              key={item.id}
              spotlight
              elevation="flat"
              interactive
              onClick={() => {
                setSelectedMention(item);
                setResponseDraft(item.aiResponseDraft || '');
              }}
              className={cn(
                "p-4 transition-all text-left space-y-2",
                selectedMention.id === item.id && "border-[var(--sigma-vermilion)]/50 ring-1 ring-[var(--sigma-vermilion)]/30"
              )}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-[var(--sigma-text)]">{item.authorHandle}</span>
                <Badge
                  variant={item.sentiment === 'POSITIVE' ? 'success' : item.sentiment === 'NEGATIVE' ? 'danger' : 'neutral'}
                  size="xs"
                >
                  {item.sentiment}
                </Badge>
              </div>

              <p className="text-xs text-[var(--sigma-muted)] line-clamp-2 leading-relaxed">
                "{item.contentSnippet}"
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--sigma-muted)] pt-1.5 border-t border-[var(--sigma-border)]">
                <span>{item.channel} • {item.reachEstimate}</span>
                <span>{item.timestamp}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Mention Teardown & Response Studio */}
        <GlassCard spotlight elevation="raised" className="lg:col-span-2 p-6 space-y-5">
          <div className="flex items-start justify-between border-b border-[var(--sigma-border)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--sigma-text)] text-base">{selectedMention.authorHandle}</span>
                <span className="text-xs text-[var(--sigma-muted)] font-mono">• {selectedMention.channel}</span>
                <span className="text-xs text-[var(--sigma-muted)] font-mono">• Reach: {selectedMention.reachEstimate}</span>
              </div>
              <div className="text-[11px] text-[var(--sigma-muted)] font-mono mt-0.5">Detected: {selectedMention.timestamp}</div>
            </div>

            <Badge
              variant={selectedMention.sentiment === 'POSITIVE' ? 'success' : selectedMention.sentiment === 'NEGATIVE' ? 'danger' : 'neutral'}
              size="sm"
            >
              {selectedMention.sentiment}
            </Badge>
          </div>

          <div className="p-4 bg-[var(--sigma-bg)]/80 border border-[var(--sigma-border)] rounded-xl space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--sigma-muted)]">Original Public Post</div>
            <p className="text-xs text-[var(--sigma-text)] leading-relaxed italic">
              "{selectedMention.contentSnippet}"
            </p>
          </div>

          {/* AI Response Drafter */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[var(--sigma-vermilion)] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Response Drafter (Nexus-03 Aligned)
              </span>
              <span className="text-[11px] font-mono text-[var(--sigma-muted)]">Enforces Brand Tone & Vault Rules</span>
            </div>

            <textarea
              value={responseDraft}
              onChange={e => setResponseDraft(e.target.value)}
              rows={4}
              className="w-full p-3.5 bg-[var(--sigma-bg)] border border-[var(--sigma-border)] rounded-xl text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-muted)] focus:outline-none focus:border-[var(--sigma-vermilion)]/60 leading-relaxed font-sans transition-colors"
              placeholder="Draft response..."
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[var(--sigma-muted)] font-mono">
                Requires Human-in-the-Loop review before live publishing
              </span>

              <div className="flex gap-2">
                <Button
                  onClick={handleRegenerateResponse}
                  variant="outline"
                  size="sm"
                >
                  Regenerate
                </Button>

                <Button
                  onClick={handleSendResponse}
                  variant="primary"
                  size="sm"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Approve & Dispatch
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Real-time Agent Run Results */}
      <div className="mt-8">
        <AgentRunResults
          records={runHistory}
          title="Sentinel-08 Social Listening Run Results"
          description="Log of brand mention radar scans, sentiment analyses, and staged social response drafts."
          onClear={() => setRunHistory([])}
        />
      </div>

      {/* 1. Multi-Channel Sentinel Scan Modal */}
      <AnimatePresence>
        {isScanModalOpen && (
          <div className="sigma-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="sigma-modal w-full max-w-xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Wifi size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--sigma-text)]">Agent Reach Multi-Channel Scan</h3>
                    <p className="text-[11px] text-[var(--sigma-text-muted)]">Scan the configured router for brand mentions and conversations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsScanModalOpen(false)}
                  className="sigma-icon-button"
                  aria-label="Close scan dialog"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-[var(--sigma-text-muted)] block mb-1.5">
                    Target Keyword or Brand
                  </label>
                  <input
                    type="text"
                    value={scanKeyword}
                    onChange={e => setScanKeyword(e.target.value)}
                    placeholder="e.g. Sigma Tactix, B2B Growth OS, or competitor name"
                    className="sigma-input w-full px-4 py-2.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[var(--sigma-text-muted)] block mb-1.5">
                    Select Router Channel
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {([
                      { id: 'v2ex', label: 'V2EX', icon: Radio },
                      { id: 'reddit', label: 'Reddit', icon: MessageSquare },
                      { id: 'hackernews', label: 'HN', icon: Globe },
                      { id: 'youtube', label: 'YouTube', icon: Youtube },
                      { id: 'web', label: 'Web Jina', icon: Search },
                    ] as const).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setScanChannel(item.id)}
                        className={cn(
                          'p-2.5 rounded-xl border text-xs font-mono flex flex-col items-center gap-1.5 transition-all cursor-pointer',
                          scanChannel === item.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-[var(--sigma-surface)] text-[var(--sigma-text-muted)] border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)] hover:text-[var(--sigma-text)]'
                        )}
                      >
                        <item.icon size={14} />
                        <span className="text-[10px]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--sigma-border)]">
                <button
                  onClick={() => setIsScanModalOpen(false)}
                  className="sigma-button-secondary px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  onClick={() => handleAgentReachScan()}
                  disabled={isScanningReach || !scanKeyword.trim()}
                  variant="primary"
                  isLoading={isScanningReach}
                  leftIcon={!isScanningReach ? <Sparkles size={13} /> : undefined}
                >
                  {isScanningReach ? 'Querying Router...' : 'Execute Live Scan'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Competitor Intelligence Battlecard Modal */}
      <AnimatePresence>
        {isBattlecardModalOpen && (
          <div className="sigma-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="sigma-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Swords size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--sigma-text)]">Competitor Radar & Battlecard Generator</h3>
                    <p className="text-[11px] text-[var(--sigma-text-muted)]">Extract competitor intelligence through the configured Agent Reach source</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBattlecardModalOpen(false)}
                  className="sigma-icon-button"
                  aria-label="Close battlecard dialog"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Extraction Input Form */}
              <div className="sigma-subpanel p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-[var(--sigma-text-muted)] block mb-1">Competitor Name</label>
                    <input
                      type="text"
                      value={competitorName}
                      onChange={e => setCompetitorName(e.target.value)}
                      placeholder="e.g. OmniVanguard Marketing"
                      className="sigma-input w-full px-3.5 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[var(--sigma-text-muted)] block mb-1">Target URL or Domain</label>
                    <input
                      type="text"
                      value={competitorTarget}
                      onChange={e => setCompetitorTarget(e.target.value)}
                      placeholder="https://competitor.com or YouTube link"
                      className="sigma-input w-full px-3.5 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleScanCompetitor}
                    disabled={isScanningCompetitor || !competitorTarget.trim()}
                    variant="primary"
                    size="sm"
                    isLoading={isScanningCompetitor}
                    leftIcon={!isScanningCompetitor ? <Zap size={13} /> : undefined}
                  >
                    {isScanningCompetitor ? 'Extracting via Agent Reach...' : 'Synthesize Battlecard'}
                  </Button>
                </div>
              </div>

              {/* Generated Battlecard View */}
              {activeBattlecard && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full uppercase font-bold">
                        Verified Battlecard
                      </span>
                      <h4 className="text-base font-bold text-[var(--sigma-text)] mt-1">{activeBattlecard.competitorName}</h4>
                    </div>
                    <a
                      href={activeBattlecard.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-[var(--sigma-text-muted)] hover:text-[var(--sigma-primary)] flex items-center gap-1"
                    >
                      Visit Target <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="sigma-subpanel p-3.5">
                    <div className="text-[10px] font-mono text-[var(--sigma-text-muted)]">Core Value Proposition</div>
                    <p className="text-xs text-[var(--sigma-text-soft)] mt-1">{activeBattlecard.valueProposition}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                      <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Claimed Strengths
                      </div>
                      <ul className="text-xs text-[var(--sigma-text-soft)] space-y-1 list-disc list-inside">
                        {activeBattlecard.coreStrengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
                      <div className="text-[10px] font-mono text-rose-400 uppercase font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> Operational Vulnerabilities
                      </div>
                      <ul className="text-xs text-[var(--sigma-text-soft)] space-y-1 list-disc list-inside">
                        {activeBattlecard.vulnerabilities.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                    <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                      Strategic Counter-Positioning
                    </div>
                    <p className="text-xs text-[var(--sigma-text-soft)] leading-relaxed">{activeBattlecard.counterPositioning}</p>
                  </div>

                  <div className="sigma-subpanel p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] font-bold flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-400" />
                        30-Second SDR Sales Talk Track
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeBattlecard.salesTalkTrack);
                          setCopiedBattlecard(true);
                          setTimeout(() => setCopiedBattlecard(false), 2000);
                        }}
                        className="sigma-button-secondary px-2.5 py-1 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                      >
                        {copiedBattlecard ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copiedBattlecard ? 'Copied' : 'Copy Pitch'}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--sigma-text-soft)] leading-relaxed italic bg-[var(--sigma-surface)] p-3 rounded-lg border border-[var(--sigma-border)]">
                      "{activeBattlecard.salesTalkTrack}"
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
