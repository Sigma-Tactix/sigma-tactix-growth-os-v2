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
import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { syncAgentReachSocial, scanCompetitorWithAgentReach } from '@/src/lib/api';
import { CompetitorBattlecard } from '@/src/types';
import { Button, GlassCard, Badge, Tabs, MetricWidget } from '@/src/components/ui';

export default function SocialListeningPage() {
  const { notifySuccess, notifyInfo } = useToast();
  // Mentions start from the demo sample ONLY behind VITE_SEED_DEMO_WORKSPACE;
  // a fresh tenant begins empty and sees verified captures from live scans.
  const seedMentions = isDemoSeedEnabled() ? SEED_SOCIAL_MENTIONS : [];
  const [mentions, setMentions] = useState<SocialMention[]>(seedMentions);
  const [selectedMention, setSelectedMention] = useState<SocialMention | null>(seedMentions[0] || null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'POSITIVE' | 'NEUTRAL' | 'CRISIS'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [responseDraft, setResponseDraft] = useState(seedMentions[0]?.aiResponseDraft || '');
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

  // Agent Run History — starts empty. Entries are appended only after a
  // real provider fetch, live scan response, or HITL queue acknowledgement.
  // No seeded "successful scan" is shown on first load.
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  const filteredMentions = mentions.filter(m => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRISIS') return m.requiresAttention;
    return m.sentiment === activeFilter;
  });

  const handleRefreshMentions = async () => {
    setIsRefreshing(true);
    try {
      const res = await syncAgentReachSocial({ keyword: scanKeyword || 'Sigma Tactix', channel: scanChannel || 'web' });
      if (res.success && res.mention) {
        notifySuccess('Social Feeds Synchronized', `Scanned channel ${res.mention.platform || 'web'}. Found 1 mention.`);
      } else {
        notifyInfo('Feeds Synchronized', 'No new critical mentions found across active configured channels.');
      }
    } catch (err: any) {
      notifyInfo('Feed Synchronization Notice', err.message || 'Agent Reach provider unavailable. Connect channel credentials in Connector Hub to enable live stream synchronization.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeploySentinel = () => {
    // Phase 0 truthful state: no deployment occurs here and no run is
    // recorded. Authenticated connectors are the only activation path.
    notifyInfo('Sentinel Deployment Notice', 'Sentinel streaming is not deployed from this panel. Background keyword streaming requires authenticated provider connectors (Reddit, LinkedIn, X). Configure API credentials in Connector Hub to activate automated triggers.');
  };

  const handleAgentReachScan = async (targetKeyword?: string, targetChannel?: string) => {
    const kw = (targetKeyword || scanKeyword || 'Sigma Tactix').trim();
    const ch = targetChannel || scanChannel || 'v2ex';
    setIsScanningReach(true);
    try {
      const res = await syncAgentReachSocial({ keyword: kw, channel: ch });
      if (res.success && res.mention) {
        // Phase 0: an unclassified mention is NOT "Neutral". The server now
        // leaves sentiment null when classification did not run, and this maps
        // that to a real value instead of inventing one.
        const sentimentVal: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | null =
          res.mention.sentiment === 'Positive' ? 'POSITIVE' :
          res.mention.sentiment === 'Negative' ? 'NEGATIVE' :
          res.mention.sentiment === 'Neutral' ? 'NEUTRAL' :
          null;
        const newMention: SocialMention = {
          id: res.mention.id || `reach-${Date.now()}`,
          platform: res.mention.platform || ch.toUpperCase(),
          channel: res.mention.platform || ch.toUpperCase(),
          // The author is whoever posted. If none was captured it stays
          // unknown rather than being attributed to the capture tool.
          author: res.mention.author || 'Unknown author',
          authorHandle: res.mention.author || 'unknown',
          // Phase 0: no invented audience numbers. follower count, reach and
          // engagement are left absent unless the capture channel actually
          // reported them — a real mention must not be padded with plausible
          // figures that later read as measured performance.
          followersCount: res.mention.followers_count ?? undefined,
          content: res.mention.mention_text,
          contentSnippet: res.mention.mention_text,
          timestamp: 'Just now',
          sentiment: sentimentVal,
          reach: res.mention.reach ?? undefined,
          engagement: res.mention.engagement ?? undefined,
          suggestedAction: sentimentVal === 'POSITIVE' ? 'AMPLIFY' : sentimentVal === 'NEGATIVE' ? 'RESOLVE' : 'ENGAGE',
          requiresAttention: res.mention.requiresAttention || sentimentVal === 'NEGATIVE',
          aiResponseDraft: res.mention.aiResponseDraft || '',
          sourceUrl: res.mention.source_url || undefined,
        };
        setMentions(prev => [newMention, ...prev]);
        setSelectedMention(newMention);
        setResponseDraft(newMention.aiResponseDraft || '');
        notifySuccess(
          'Agent Reach Capture',
          `Captured ${res.resultCount ?? 1} matching discussion(s) on ${res.mention.platform}` +
          (sentimentVal ? ` tagged ${sentimentVal.toLowerCase()}.` : ' — sentiment not classified.')
        );
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
    if (!selectedMention) return;
    const drafts = [
      `Spot on analysis @${selectedMention.authorHandle}. Traditional marketing agencies rent junior headcount that turns over every 9 months. With them goes all accumulated test data. We designed Sigma Tactix as a sovereign Growth OS so tech companies own their permanent intelligence.`,
      `Appreciate the mention @${selectedMention.authorHandle}! The core problem in B2B tech isn't traffic—it's infrastructure coordination. When you install an AI-native Second Brain, attribution clarity and autonomous agent execution compound on your balance sheet forever.`,
      `Empirical truth @${selectedMention.authorHandle}. In 2026, leading operators are ending the agency retainer tax and deploying sovereign AI agent swarms under strict human-in-the-loop guardrails.`
    ];
    const newDraft = drafts[Math.floor(Math.random() * drafts.length)];
    setResponseDraft(newDraft);
    // Honest label: this swaps in an alternate canned template — it does not
    // call a model, so it must not read as a fresh synthesis.
    notifySuccess('Alternate Template Applied', 'Swapped in a different brand-voice template. No model call was made.');
  };

  const handleSendResponse = () => {
    if (!selectedMention || !responseDraft.trim()) {
      notifyInfo('Nothing to Stage', 'Select a mention and write a response draft first.');
      return;
    }
    // Phase 0 truthful state: staging a local response draft is queued work,
    // never a completed dispatch. No post is published from this panel.
    const newRun: AgentRunRecord = {
      id: `run-social-${Date.now()}`,
      agentName: 'Nexus-03 Communication Swarm',
      agentRole: 'Social Engagement & Brand Protector',
      timestamp: 'Just now',
      status: 'PARTIAL',
      moduleOrigin: 'Social Listening & Radar',
      inputSummary: `Response draft for @${selectedMention.authorHandle} on ${selectedMention.channel || 'unknown channel'}`,
      outputSummary: 'Draft staged locally. Not dispatched. HITL publication requires an approved distribution run.',
      fullOutput: responseDraft,
      metrics: [
        { label: 'Channel', value: selectedMention.channel || '—' },
        { label: 'Author', value: selectedMention.authorHandle },
        { label: 'Dispatch', value: 'Not sent (local draft)' }
      ]
    };
    setRunHistory(prev => [newRun, ...prev]);
    notifySuccess('Response Draft Staged', 'Saved as a local draft. No post was published.');
  };

  return (
    <div className="space-y-8 lg:space-y-10 pb-16">
      {/* Top Banner */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8 lg:p-10">
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
              variant="primary"
              size="md"
              icon={<Bot className="w-3.5 h-3.5" />}
            >
              Deploy Sentinel-08
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Metric Highlights — operational state, not provider outcomes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricWidget
          label="Tracked Mentions (local sample)"
          value={mentions.length.toString()}
          subtext="Seeded sample. Verified counts require connected providers."
          icon={<TrendingUp className="w-4 h-4 text-emerald-accent" />}
        />

        <MetricWidget
          label="Response Draft State"
          value="Local only"
          subtext="Drafts stage locally. No post dispatched from this panel."
          icon={<Zap className="w-4 h-4 text-[var(--sigma-vermilion)]" />}
        />

        <GlassCard spotlight elevation="flat" className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-[var(--sigma-muted)]">Competitor Radar</span>
              <Badge variant="brand" size="xs">Agent Reach</Badge>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--sigma-vermilion)]">
              No verified opps
            </div>
            <div className="text-[11px] text-[var(--sigma-muted)] mt-1">Run a scan to populate verified competitor intelligence</div>
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
          value="Not monitoring"
          subtext="Provider streaming not deployed from this panel"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-accent" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-[var(--sigma-border)] pb-3">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'All Mentions' },
            { id: 'POSITIVE', label: 'Positive Sentiment' },
            { id: 'NEUTRAL', label: 'Neutral Sentiment' },
            { id: 'CRISIS', label: 'Crisis Alerts', icon: <AlertTriangle className="w-3 h-3 text-rose-accent" /> }
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
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-mono font-medium text-[var(--sigma-muted)] uppercase tracking-wider">
              Incoming Mentions Stream ({filteredMentions.length})
            </div>
            {seedMentions.length > 0 && (
              <span className="text-[10px] font-mono text-amber-accent">
                includes seeded sample — not live captures
              </span>
            )}
          </div>

          {filteredMentions.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-[var(--sigma-border)] text-[11px] font-mono text-[var(--sigma-muted)] leading-relaxed">
              No mentions yet. Run an Agent Reach scan to capture real discussions, or sync social feeds once channel connectors are configured.
            </div>
          ) : (
            filteredMentions.map(item => (
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
                  selectedMention?.id === item.id && "border-[var(--sigma-vermilion)]/50 ring-1 ring-[var(--sigma-vermilion)]/30"
                )}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[var(--sigma-text)]">
                    {item.authorHandle}
                    {item.isSeeded && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-accent/10 text-amber-accent border border-amber-accent/25 text-[9px] uppercase tracking-wide">
                        Seeded sample
                      </span>
                    )}
                  </span>
                  <Badge
                    variant={item.sentiment === 'POSITIVE' ? 'success' : item.sentiment === 'NEGATIVE' ? 'danger' : 'neutral'}
                    size="xs"
                  >
                    {item.sentiment ?? 'Unclassified'}
                  </Badge>
                </div>

                <p className="text-xs text-[var(--sigma-muted)] line-clamp-2 leading-relaxed">
                  "{item.contentSnippet}"
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--sigma-muted)] pt-1.5 border-t border-[var(--sigma-border)]">
                  <span>{item.channel}{item.reachEstimate ? ` • ${item.reachEstimate}` : ''}</span>
                  <span>{item.timestamp}</span>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Mention Teardown & Response Studio */}
        <GlassCard spotlight elevation="raised" className="lg:col-span-2 p-6 space-y-5">
          {!selectedMention ? (
            <div className="text-xs font-mono text-[var(--sigma-muted)] leading-relaxed">
              No mention selected. Pick one from the stream (or run a scan to capture a live mention) to review its context and draft a response.
            </div>
          ) : (
            <>
          <div className="flex items-start justify-between border-b border-[var(--sigma-border)] pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[var(--sigma-text)] text-base">{selectedMention.authorHandle}</span>
                <span className="text-xs text-[var(--sigma-muted)] font-mono">• {selectedMention.channel || 'channel n/a'}</span>
                {selectedMention.isSeeded ? (
                  <Badge variant="warning" size="xs">Seeded sample</Badge>
                ) : (
                  <span className="text-xs text-[var(--sigma-muted)] font-mono">
                    {selectedMention.reachEstimate ? `• Reach: ${selectedMention.reachEstimate}` : '• Reach: not measured'}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--sigma-muted)] font-mono mt-0.5">
                {selectedMention.isSeeded ? 'Sample item — not a live capture' : `Detected: ${selectedMention.timestamp}`}
              </div>
            </div>

            <Badge
              variant={selectedMention.sentiment === 'POSITIVE' ? 'success' : selectedMention.sentiment === 'NEGATIVE' ? 'danger' : 'neutral'}
              size="sm"
            >
              {selectedMention.sentiment ?? 'Unclassified'}
            </Badge>
          </div>

          <div className="p-4 bg-[var(--sigma-bg)]/80 border border-[var(--sigma-border)] rounded-xl space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--sigma-muted)]">
              {selectedMention.isSeeded ? 'Sample Post (Seeded Demo Data)' : 'Original Public Post'}
            </div>
            <p className="text-xs text-[var(--sigma-text)] leading-relaxed italic">
              "{selectedMention.contentSnippet}"
            </p>
          </div>

          {/* Response Drafter */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[var(--sigma-vermilion)] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Response Drafter (Brand-Voice Templates)
              </span>
              <span className="text-[11px] font-mono text-[var(--sigma-muted)]">Canned templates — editable before dispatch</span>
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
                Stages a local draft — nothing is published until a distribution run is approved
              </span>

              <div className="flex gap-2">
                <Button
                  onClick={handleRegenerateResponse}
                  variant="outline"
                  size="sm"
                >
                  Swap Template
                </Button>

                <Button
                  onClick={handleSendResponse}
                  variant="primary"
                  size="sm"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Stage for Review
                </Button>
              </div>
            </div>
          </div>
            </>
          )}
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
                  <div className="w-8 h-8 rounded-xl bg-amber-accent/10 border border-amber-accent/30 flex items-center justify-center text-amber-accent">
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
                            ? 'bg-amber-accent/15 text-amber-accent border-amber-accent/40 font-bold'
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
                  <div className="w-8 h-8 rounded-xl bg-rose-accent/10 border border-rose-accent/30 flex items-center justify-center text-rose-accent">
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
                      <span className="px-2.5 py-0.5 text-[10px] font-mono bg-amber-accent/10 text-amber-accent border border-amber-accent/30 rounded-full uppercase font-bold">
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
                    <div className="p-3.5 rounded-xl bg-emerald-accent/5 border border-emerald-accent/20 space-y-1.5">
                      <div className="text-[10px] font-mono text-emerald-accent uppercase font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Claimed Strengths
                      </div>
                      <ul className="text-xs text-[var(--sigma-text-soft)] space-y-1 list-disc list-inside">
                        {activeBattlecard.coreStrengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-accent/5 border border-rose-accent/20 space-y-1.5">
                      <div className="text-[10px] font-mono text-rose-accent uppercase font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> Operational Vulnerabilities
                      </div>
                      <ul className="text-xs text-[var(--sigma-text-soft)] space-y-1 list-disc list-inside">
                        {activeBattlecard.vulnerabilities.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-accent/5 border border-amber-accent/20 space-y-1">
                    <div className="text-[10px] font-mono text-amber-accent uppercase font-bold">
                      Strategic Counter-Positioning
                    </div>
                    <p className="text-xs text-[var(--sigma-text-soft)] leading-relaxed">{activeBattlecard.counterPositioning}</p>
                  </div>

                  <div className="sigma-subpanel p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] font-bold flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-accent" />
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
                        {copiedBattlecard ? <Check size={11} className="text-emerald-accent" /> : <Copy size={11} />}
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
