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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { 
  SEED_SOCIAL_MENTIONS, 
  SocialMention 
} from '@/src/data/marketingModulesData';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

export default function SocialListeningPage() {
  const { notifySuccess, notifyInfo } = useToast();
  const [mentions, setMentions] = useState<SocialMention[]>(SEED_SOCIAL_MENTIONS);
  const [selectedMention, setSelectedMention] = useState<SocialMention>(SEED_SOCIAL_MENTIONS[0]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'POSITIVE' | 'NEUTRAL' | 'CRISIS'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [responseDraft, setResponseDraft] = useState(SEED_SOCIAL_MENTIONS[0].aiResponseDraft || '');
  const [isDeployingSentinel, setIsDeployingSentinel] = useState(false);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-mono tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full font-bold">
              MONITORING LAYER
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-xs font-mono text-zinc-400">SENTINEL-08 RADAR SWARM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Radio className="w-7 h-7 text-amber-400" />
            Social Listening & Brand Sentiment
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Real-time radar scanning LinkedIn, X (Twitter), Reddit, and YouTube comments for brand mentions, competitor complaints, and immediate response drafting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshMentions}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Scanning Feeds...' : 'Sync Social Feeds'}
          </button>

          <button
            onClick={handleDeploySentinel}
            disabled={isDeployingSentinel}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Bot className="w-3.5 h-3.5" />
            {isDeployingSentinel ? 'Deploying...' : 'Deploy Sentinel-08'}
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Brand Sentiment Ratio</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            92.4% Positive
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Based on 340 monthly mentions</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Average Response Latency</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            3.4 Minutes
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Via AI Response Drafter</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Competitor Complaints Intercepted</div>
          <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            18 Opportunities
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Passed directly to Lead SDR Swarm</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">PR Crisis Sentinel</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            Normal
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">No hostile campaigns detected</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {(['ALL', 'POSITIVE', 'NEUTRAL', 'CRISIS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
              activeFilter === tab
                ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            )}
          >
            {tab === 'CRISIS' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
            {tab === 'ALL' ? 'All Mentions' : tab === 'CRISIS' ? 'High Attention / Crisis Alerts' : `${tab.charAt(0) + tab.slice(1).toLowerCase()} Sentiment`}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentions List */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider px-1">
            Incoming Mentions Stream ({filteredMentions.length})
          </div>

          {filteredMentions.map(item => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedMention(item);
                setResponseDraft(item.aiResponseDraft || '');
              }}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2",
                selectedMention.id === item.id
                  ? "bg-amber-400/10 border-amber-400/40 text-white shadow-lg shadow-amber-500/5"
                  : "bg-zinc-900/30 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/40"
              )}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white">{item.authorHandle}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold",
                  item.sentiment === 'POSITIVE' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                  item.sentiment === 'NEUTRAL' && "bg-zinc-800 text-zinc-400 border border-zinc-700",
                  item.sentiment === 'NEGATIVE' && "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                )}>
                  {item.sentiment}
                </span>
              </div>

              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                "{item.contentSnippet}"
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
                <span>{item.channel} • {item.reachEstimate}</span>
                <span>{item.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mention Teardown & Response Studio */}
        <div className="lg:col-span-2 p-6 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-5">
          <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">{selectedMention.authorHandle}</span>
                <span className="text-xs text-zinc-500 font-mono">• {selectedMention.channel}</span>
                <span className="text-xs text-zinc-500 font-mono">• Reach: {selectedMention.reachEstimate}</span>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Detected: {selectedMention.timestamp}</div>
            </div>

            <span className={cn(
              "px-3 py-1 rounded-lg text-xs font-mono font-bold",
              selectedMention.sentiment === 'POSITIVE' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
              selectedMention.sentiment === 'NEUTRAL' && "bg-zinc-800 text-zinc-400 border border-zinc-700",
              selectedMention.sentiment === 'NEGATIVE' && "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            )}>
              {selectedMention.sentiment}
            </span>
          </div>

          <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl space-y-2">
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Original Public Post</div>
            <p className="text-xs text-zinc-200 leading-relaxed italic">
              "{selectedMention.contentSnippet}"
            </p>
          </div>

          {/* AI Response Drafter */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Response Drafter (Nexus-03 Aligned)
              </span>
              <span className="text-[11px] font-mono text-zinc-400">Enforces Brand Tone & Vault Rules</span>
            </div>

            <textarea
              value={responseDraft}
              onChange={e => setResponseDraft(e.target.value)}
              rows={4}
              className="w-full p-3 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400/60 leading-relaxed font-sans"
              placeholder="Draft response..."
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-500 font-mono">
                Requires Human-in-the-Loop review before live publishing
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateResponse}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  Regenerate
                </button>

                <button
                  onClick={handleSendResponse}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5 fill-black" />
                  Approve & Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}
