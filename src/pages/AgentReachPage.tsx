import React, { useState, useEffect } from 'react';
import {
  Globe,
  Wifi,
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Play,
  FileText,
  Sparkles,
  Database,
  Layers,
  Cpu,
  ShieldCheck,
  Share2,
  Youtube,
  Twitter,
  Linkedin,
  MessageSquare,
  Github,
  Rss,
  TrendingUp,
  Sliders,
  Flame,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { GlassCard, Button, Badge, MetricWidget } from '@/src/components/ui';
import {
  getAgentReachDoctor,
  fetchAgentReachContent,
  syncAgentReachSocial
} from '@/src/lib/api';
import {
  AgentReachDoctorSummary,
  AgentReachChannelStatus,
  AgentReachFetchResult
} from '@/src/types';

const FALLBACK_DOCTOR_SUMMARY: AgentReachDoctorSummary = {
  timestamp: new Date().toISOString(),
  cliAvailable: true,
  cliVersion: '1.5.0',
  totalChannels: 15,
  readyCount: 6,
  warningCount: 9,
  offlineCount: 0,
  channels: {
    web: { id: 'web', name: 'Web & Documentation', tier: 0, status: 'ok', message: 'Zero-config via r.jina.ai parser', backends: ['jina_reader', 'curl'], activeBackend: 'jina_reader' },
    youtube: { id: 'youtube', name: 'YouTube Video & Audio', tier: 0, status: 'ok', message: 'Zero-config transcript extraction', backends: ['yt-dlp', 'jina_transcripts'], activeBackend: 'yt-dlp' },
    v2ex: { id: 'v2ex', name: 'V2EX Tech Community', tier: 0, status: 'ok', message: 'Zero-config JSON API', backends: ['public_api', 'rss'], activeBackend: 'public_api' },
    rss: { id: 'rss', name: 'Global RSS / Atom Feeds', tier: 0, status: 'ok', message: 'Zero-config standard XML parser', backends: ['xml_parser'], activeBackend: 'xml_parser' },
    bilibili: { id: 'bilibili', name: 'Bilibili Tech & Media', tier: 0, status: 'ok', message: 'Public video metadata available', backends: ['jina_reader', 'opencli'], activeBackend: 'jina_reader' },
    github: { id: 'github', name: 'GitHub Code & Trends', tier: 0, status: 'ok', message: 'Unauthenticated public rate limit 60/hr', backends: ['github_api', 'gh_cli'], activeBackend: 'github_api' },
    hackernews: { id: 'hackernews', name: 'Hacker News (Y Combinator)', tier: 0, status: 'ok', message: 'Zero-config open REST API', backends: ['firebase_api', 'algolia'], activeBackend: 'firebase_api' },
    yahoo_finance: { id: 'yahoo_finance', name: 'Yahoo Finance Market Data', tier: 0, status: 'ok', message: 'Delayed public market data', backends: ['query_api', 'jina'], activeBackend: 'query_api' },
    twitter: { id: 'twitter', name: 'X / Twitter Pulse', tier: 1, status: 'warn', message: 'Requires TWITTER_BEARER_TOKEN or cookie session', backends: ['twitter_api_v2', 'cookie_session'], activeBackend: null },
    reddit: { id: 'reddit', name: 'Reddit Discussions', tier: 1, status: 'warn', message: 'Requires REDDIT_CLIENT_ID / SECRET for high volume', backends: ['reddit_api', 'json_feed'], activeBackend: null },
    linkedin: { id: 'linkedin', name: 'LinkedIn Professional & Jobs', tier: 1, status: 'warn', message: 'Requires LI_AT cookie or browser profile', backends: ['cookie_session', 'jina'], activeBackend: null },
    threads: { id: 'threads', name: 'Meta Threads', tier: 1, status: 'warn', message: 'Requires Meta Graph access token', backends: ['threads_api'], activeBackend: null },
    bluesky: { id: 'bluesky', name: 'Bluesky (AT Protocol)', tier: 1, status: 'ok', message: 'Public ATProto endpoint active', backends: ['atproto_api'], activeBackend: 'atproto_api' },
    xiaohongshu: { id: 'xiaohongshu', name: 'XiaoHongShu (RED)', tier: 2, status: 'warn', message: 'Requires QR login session in agent-reach CLI', backends: ['browser_cookie', 'playwright'], activeBackend: null },
    weibo: { id: 'weibo', name: 'Weibo Hot Trends', tier: 2, status: 'warn', message: 'Requires Weibo session credentials', backends: ['cookie_session', 'opencli'], activeBackend: null },
  }
};

export default function AgentReachPage() {
  const { notifySuccess, notifyInfo, notifyError } = useToast();
  const [summary, setSummary] = useState<AgentReachDoctorSummary>(FALLBACK_DOCTOR_SUMMARY);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);
  const [backendNeedsRestart, setBackendNeedsRestart] = useState(false);
  const [filterTier, setFilterTier] = useState<'ALL' | 'READY' | 'TIER_0' | 'TIER_1' | 'TIER_2'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  // Live Sandbox state
  const [sandboxChannel, setSandboxChannel] = useState<'web' | 'youtube' | 'v2ex' | 'rss'>('web');
  const [sandboxTarget, setSandboxTarget] = useState('https://news.ycombinator.com');
  const [isExtracting, setIsExtracting] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<AgentReachFetchResult | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);

  // Social Sync Quick Trigger
  const [syncKeyword, setSyncKeyword] = useState('Sigma Tactix');
  const [isSyncingSocial, setIsSyncingSocial] = useState(false);

  const [scanDuration, setScanDuration] = useState<string | null>(null);
  const [lastScannedTime, setLastScannedTime] = useState<string | null>(null);

  const loadDoctorData = async () => {
    setIsLoadingDoctor(true);
    const start = performance.now();
    try {
      const data = await getAgentReachDoctor();
      setSummary(data);
      setBackendNeedsRestart(false);
      const elapsed = ((performance.now() - start) / 1000).toFixed(1);
      setScanDuration(`${elapsed}s`);
      setLastScannedTime(new Date().toLocaleTimeString());
      notifySuccess(
        'Doctor Diagnostics Complete',
        `Scanned ${data.totalChannels} channels in ${elapsed}s: ${data.readyCount} active, ${data.warningCount} pending auth.`
      );
    } catch (err: any) {
      console.warn('Agent Reach doctor notice:', err.message);
      if (err.message.includes('restart the backend server') || err.message.includes('not registered') || err.message.includes('Unexpected token')) {
        setBackendNeedsRestart(true);
      }
      notifyInfo('Doctor Diagnostic Info', err.message || 'Could not query router status.');
    } finally {
      setIsLoadingDoctor(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  const handleRunSandbox = async () => {
    if (!sandboxTarget.trim()) return;
    setIsExtracting(true);
    setSandboxResult(null);
    try {
      const result = await fetchAgentReachContent({
        channel: sandboxChannel,
        target: sandboxTarget.trim(),
      });
      setSandboxResult(result);
      if (result.success) {
        notifySuccess('Content Extracted', `Retrieved ${result.byteCount} bytes via Agent Reach (${result.channel.toUpperCase()})`);
      } else {
        notifyInfo('Extraction Notice', result.error || 'Check channel authentication state.');
      }
    } catch (err: any) {
      setSandboxResult({
        success: false,
        channel: sandboxChannel,
        target: sandboxTarget,
        content: '',
        byteCount: 0,
        error: err.message,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleQuickSyncSocial = async () => {
    if (!syncKeyword.trim()) return;
    setIsSyncingSocial(true);
    try {
      const res = await syncAgentReachSocial({ keyword: syncKeyword.trim(), channel: 'v2ex' });
      if (res.success) {
        notifySuccess('Social Mention Ingested', `Captured from ${res.mention.platform} with ${res.mention.sentiment} sentiment.`);
      }
    } catch (err: any) {
      notifyInfo('Sync Note', err.message || 'Could not complete social scan.');
    } finally {
      setIsSyncingSocial(false);
    }
  };

  const channelList: AgentReachChannelStatus[] = summary ? Object.values(summary.channels) : [];

  const filteredChannels = channelList.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchTerm.toLowerCase()) || ch.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterTier === 'READY') return ch.status === 'ok';
    if (filterTier === 'TIER_0') return ch.tier === 0;
    if (filterTier === 'TIER_1') return ch.tier === 1;
    if (filterTier === 'TIER_2') return ch.tier === 2;
    return true;
  });

  const getChannelIcon = (id: string) => {
    switch (id) {
      case 'youtube': return <Youtube size={18} className="text-red-400" />;
      case 'twitter': return <Twitter size={18} className="text-sky-400" />;
      case 'github': return <Github size={18} className="text-white" />;
      case 'reddit': return <MessageSquare size={18} className="text-orange-400" />;
      case 'linkedin': return <Linkedin size={18} className="text-blue-400" />;
      case 'rss': return <Rss size={18} className="text-amber-400" />;
      case 'v2ex': return <Radio size={18} className="text-emerald-400" />;
      default: return <Globe size={18} className="text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="vermilion">AGENT CAPABILITY</Badge>
              <span className="text-zinc-600 text-xs">•</span>
              <Badge variant="neutral">ROUTER v1.5.0</Badge>
              <span className="text-xs text-zinc-500 font-mono ml-1">
                /Users/mac/.local/bin/agent-reach
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Radio className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Internet Capability Router
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Give your SigmaTactix AI swarms real-world eyes. Zero-wrapper routing across 15 platforms with automated fallback to Jina Reader, yt-dlp, and authenticated CLI adapters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={loadDoctorData}
              disabled={isLoadingDoctor}
              leftIcon={<RefreshCw size={14} className={cn(isLoadingDoctor && 'animate-spin text-[var(--sigma-vermilion)]')} />}
            >
              Run Doctor
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowJsonRaw(!showJsonRaw)}
              leftIcon={<Terminal size={14} />}
            >
              {showJsonRaw ? 'Visual View' : 'Raw JSON'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* 2. Top Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          label="Total Platforms"
          value={summary?.totalChannels || 15}
          subtext="15 Standard Router Channels"
          icon={<Globe size={16} className="text-zinc-400" />}
        />

        <MetricWidget
          label="Instant Zero-Config"
          value={`${summary?.readyCount || 5} Active`}
          delta={{ value: "Online", trend: "up" }}
          subtext="YouTube, Jina, RSS, V2EX, Bilibili"
          icon={<CheckCircle2 size={16} className="text-emerald-400" />}
        />

        <MetricWidget
          label="Login / Cookie Channels"
          value={`${summary?.warningCount || 1} Pending`}
          delta={{ value: "Config Req", trend: "neutral" }}
          subtext="Twitter, Reddit, Meta, XHS, Xueqiu"
          icon={<AlertTriangle size={16} className="text-amber-400" />}
        />

        <MetricWidget
          label="Runtime Engine"
          value="Python 3.14.7"
          delta={{ value: "Pipx", trend: "up" }}
          subtext="CLI Online in System PATH"
          icon={<Cpu size={16} className="text-sky-400" />}
        />
      </div>

      {/* Raw JSON Modal / Section if active */}
      {showJsonRaw && (
        <div className="p-6 rounded-2xl bg-black border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto max-h-96">
          <pre>{JSON.stringify(summary, null, 2)}</pre>
        </div>
      )}

      {/* Backend Stale Notice if Node.js server needs a restart */}
      {backendNeedsRestart && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-amber-200 shadow-xl backdrop-blur-xl">
          <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
              <span>Backend Dev Server Restart Required</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-amber-500/20 rounded border border-amber-500/40">Pending Mount</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              The Node server process running on <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">http://localhost:3000</code> was started before the new <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">/api/workspace/agent-reach/*</code> endpoints were added. Vite has hot-reloaded the frontend UI, but Node.js requires a restart to execute live CLI commands.
            </p>
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-zinc-300 flex items-center justify-between mt-2">
              <span>In your terminal running <strong className="text-white">npm run dev</strong>:</span>
              <span className="text-emerald-400 font-bold">Press Ctrl+C &rarr; npm run dev</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive Live Extraction Sandbox */}
      <div className="p-8 rounded-3xl bg-zinc-950/70 border border-white/10 backdrop-blur-2xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold mb-1">
              Live Router Sandbox
            </div>
            <h2 className="text-xl font-heading font-bold text-white">
              Test Real-Time Internet Extraction
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Execute live queries through Agent Reach backends and review the structured markdown output before agent dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['web', 'youtube', 'v2ex', 'rss'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => {
                  setSandboxChannel(ch);
                  if (ch === 'web') setSandboxTarget('https://news.ycombinator.com');
                  if (ch === 'youtube') setSandboxTarget('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                  if (ch === 'v2ex') setSandboxTarget('hot');
                  if (ch === 'rss') setSandboxTarget('https://hnrss.org/frontpage');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-mono uppercase transition-all cursor-pointer border',
                  sandboxChannel === ch
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                )}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={sandboxTarget}
              onChange={e => setSandboxTarget(e.target.value)}
              placeholder={sandboxChannel === 'web' ? 'Enter any website URL (e.g. https://stripe.com)' : 'Enter URL or target'}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <button
            onClick={handleRunSandbox}
            disabled={isExtracting || !sandboxTarget.trim()}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Play size={14} />
                Run Extraction
              </>
            )}
          </button>
        </div>

        {/* Sandbox Output Results */}
        {sandboxResult && (
          <div className="p-6 rounded-2xl bg-black/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <span className={cn(
                  'px-2.5 py-0.5 text-[10px] font-mono uppercase rounded-full font-bold',
                  sandboxResult.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'
                )}>
                  {sandboxResult.success ? 'EXTRACTION SUCCESS' : 'FAILED'}
                </span>
                <span className="text-xs font-bold text-white font-mono">{sandboxResult.title || sandboxResult.target}</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {sandboxResult.byteCount ? `${sandboxResult.byteCount.toLocaleString()} bytes` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sandboxResult.content);
                    setCopiedResult(true);
                    setTimeout(() => setCopiedResult(false), 2000);
                  }}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedResult ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedResult ? 'Copied' : 'Copy Dossier'}
                </button>
              </div>
            </div>

            {/* Rich Video Preview Card if YouTube metadata exists */}
            {sandboxResult.metadata?.thumbnailUrl && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-zinc-900/90 border border-white/10 items-center">
                <div className="relative rounded-lg overflow-hidden shrink-0 w-full sm:w-48 aspect-video bg-black border border-white/10 shadow-lg">
                  <img
                    src={sandboxResult.metadata.thumbnailUrl}
                    alt={sandboxResult.title || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-xl">
                      <Play size={16} className="ml-0.5 fill-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-red-400 uppercase font-bold flex items-center gap-1.5">
                    <Youtube size={13} />
                    Verified Video Stream · Video ID: {sandboxResult.metadata.videoId}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{sandboxResult.title?.replace('YouTube: ', '')}</h4>
                  <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                    <span>Creator: <strong className="text-zinc-200">{sandboxResult.metadata.author}</strong></span>
                    <span>•</span>
                    <span className="text-[11px] font-mono text-emerald-400">Engine: {sandboxResult.metadata.engine || 'oEmbed + Jina'}</span>
                    <span>•</span>
                    <a
                      href={sandboxResult.target}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      Watch <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {sandboxResult.error ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-300">
                {sandboxResult.error}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto font-mono text-xs text-zinc-300 whitespace-pre-wrap bg-zinc-950 p-4 rounded-xl border border-white/5 selection:bg-accent/40 selection:text-white">
                {sandboxResult.content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-surface/60 border border-white/10 rounded-2xl backdrop-blur-xl">
          {(['ALL', 'READY', 'TIER_0', 'TIER_1', 'TIER_2'] as const).map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-mono uppercase transition-all cursor-pointer',
                filterTier === tier
                  ? 'bg-amber-500 text-black font-bold shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {tier === 'ALL' ? 'All (15)' : tier === 'READY' ? 'Ready (5)' : tier.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search 15 platforms..."
            className="w-full bg-surface/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* 5. Channel Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredChannels.map(ch => {
          const isOk = ch.status === 'ok';
          const isWarn = ch.status === 'warn';

          return (
            <div
              key={ch.id}
              className={cn(
                'p-6 rounded-2xl bg-surface/50 border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xl',
                isOk
                  ? 'border-emerald-500/20 hover:border-emerald-500/40'
                  : isWarn
                  ? 'border-amber-500/20 hover:border-amber-500/40'
                  : 'border-white/5 hover:border-white/15'
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      {getChannelIcon(ch.id)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{ch.name}</h3>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">
                        Tier {ch.tier} • {ch.id}
                      </div>
                    </div>
                  </div>

                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider',
                    isOk
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : isWarn
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-white/5'
                  )}>
                    {isOk ? 'READY' : isWarn ? 'CONFIG' : 'OFFLINE'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {ch.message || 'Platform capability managed via Agent Reach CLI router.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Backend:</span>
                  <span className="text-white font-bold">{ch.activeBackend || ch.backends[0] || 'OpenCLI'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isOk ? (
                    <button
                      onClick={() => {
                        setSandboxChannel(ch.id === 'youtube' ? 'youtube' : ch.id === 'v2ex' ? 'v2ex' : 'web');
                        if (ch.id === 'youtube') setSandboxTarget('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play size={12} />
                      Test Live
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const cmd = ch.fixCommand || `agent-reach configure --platform ${ch.id}`;
                        navigator.clipboard.writeText(cmd);
                        notifySuccess('Command Copied', cmd);
                      }}
                      className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate px-2"
                      title={ch.fixCommand || `agent-reach configure --platform ${ch.id}`}
                    >
                      <Terminal size={12} className="shrink-0" />
                      <span className="truncate">Fix: {ch.fixCommand || `configure ${ch.id}`}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const cmd = ch.fixCommand || `agent-reach configure --platform ${ch.id}`;
                      navigator.clipboard.writeText(cmd);
                      notifySuccess('Command Copied', cmd);
                    }}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded-xl text-xs font-mono flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title={`Copy: ${ch.fixCommand || `agent-reach configure --platform ${ch.id}`}`}
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Quick Ingestion to Social Listening Bridge */}
      <div className="p-8 rounded-3xl bg-surface/50 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            Cross-Module Integration
          </div>
          <h3 className="text-lg font-heading font-bold text-white">
            Sync Live Internet Mentions into Social Listening
          </h3>
          <p className="text-xs text-zinc-400 max-w-xl">
            Trigger a live scan for your brand keywords across available Agent Reach backends. Each captured post automatically receives Gemini sentiment classification.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            value={syncKeyword}
            onChange={e => setSyncKeyword(e.target.value)}
            placeholder="Brand keyword..."
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={handleQuickSyncSocial}
            disabled={isSyncingSocial || !syncKeyword.trim()}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-background font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-lg disabled:opacity-50"
          >
            {isSyncingSocial ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Sync Radar
          </button>
        </div>
      </div>
    </div>
  );
}
