import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  BarChart3,
  Target,
  RefreshCw,
  ExternalLink,
  Search,
  Globe,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Link2,
  CheckCircle2,
  X,
  ShieldCheck,
  Key,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import {
  GSCAnalyticsResponse,
  GSCTimeSeriesPoint,
  GSCConnectionStatus,
  fetchGSCAnalytics,
  fetchGSCDiagnostics,
  getGSCConnectionStatus,
  generateDemoGSCData,
  connectGSC,
  exchangeGSCCode,
  disconnectGSC,
  describeGscOAuthError
} from '@/src/lib/searchConsoleApi';

interface SearchConsoleTrendsProps {
  onResultPush?: (type: string, title: string, summary: string, metadata?: Record<string, string>) => void;
}

// Sparkline mini chart component
function Sparkline({ data, color, width = 120, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Trend chart with area fill
function TrendChart({ timeSeries, metric, color, label }: {
  timeSeries: GSCTimeSeriesPoint[];
  metric: 'clicks' | 'impressions';
  color: string;
  label: string;
}) {
  const width = 600;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 24, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = timeSeries.map(p => p[metric]);
  if (!values.length) return null;
  const max = Math.max(...values) * 1.1;
  const min = 0;
  const range = max - min || 1;

  const points = values.map((v, i) => {
    // Math.max guard: a live payload can legitimately contain a single day,
    // and dividing by (length - 1) would produce NaN coordinates.
    const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((v - min) / range) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    value: Math.round(min + pct * range),
    y: padding.top + chartH - pct * chartH
  }));

  return (
    <div className="w-full">
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={padding.left} y1={l.y} x2={width - padding.right} y2={l.y} stroke="var(--sigma-border-strong)" strokeWidth="0.5" />
            <text x={padding.left - 6} y={l.y + 3} textAnchor="end" fill="var(--sigma-text-muted)" fontSize="9" fontFamily="monospace">
              {l.value >= 1000 ? `${(l.value / 1000).toFixed(1)}k` : l.value}
            </text>
          </g>
        ))}
        {/* Area fill */}
        <path d={areaPath} fill={color} opacity="0.08" />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Date labels */}
        {timeSeries.length > 4 && [0, Math.floor(timeSeries.length / 2), timeSeries.length - 1].map(idx => (
          <text
            key={idx}
            x={points[idx].x}
            y={height - 4}
            textAnchor="middle"
            fill="var(--sigma-text-muted)"
            fontSize="8"
            fontFamily="monospace"
          >
            {timeSeries[idx].date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function SearchConsoleTrends({ onResultPush }: SearchConsoleTrendsProps) {
  const { notifySuccess, notifyInfo, notifyError, notifyWarning } = useToast();
  const [connection, setConnection] = useState<GSCConnectionStatus>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '28d' | '90d' | '16m'>('28d');
  const [data, setData] = useState<GSCAnalyticsResponse | null>(null);
  // Connected-but-not-live explainer: 'awaiting' (OAuth grant / first sync
  // pending) or 'error' (fetch failed). Null for the LIVE and DEMO states.
  const [dataNote, setDataNote] = useState<{ kind: 'awaiting' | 'error'; message: string } | null>(null);
  const [queryView, setQueryView] = useState<'queries' | 'pages'>('queries');

  // GSC Connection Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [gscSiteUrl, setGscSiteUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  // Exact redirect URI the server will send to Google — displayed with a copy
  // button so the user can whitelist it verbatim and avoid Error 400
  // redirect_uri_mismatch. Refreshed when the dialog opens and after connect.
  const [dialogRedirectUri, setDialogRedirectUri] = useState<string | null>(null);
  const [redirectUriCopied, setRedirectUriCopied] = useState(false);

  const isConnected = connection.connected;
  const paramsHandledRef = useRef(false);
  const initialLoadRef = useRef(true);

  // One-time: complete the OAuth round-trip the callback bounced back with
  // (gsc_code/gsc_state/gsc_error), clean the URL, then load authoritative
  // state from the server. Success/failure toasts come from the exchange
  // itself — never from URL params alone (the old code trusted
  // ?gsc_connected=true and toasted success for a connection that never
  // persisted).
  useEffect(() => {
    if (paramsHandledRef.current) return;
    paramsHandledRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('gsc_code');
    const state = params.get('gsc_state');
    const oauthError = params.get('gsc_error');
    const legacyConnected = params.get('gsc_connected');

    // Clean the URL BEFORE the async exchange so a re-run (StrictMode / HMR)
    // cannot replay a single-use authorization code.
    if (code || oauthError || legacyConnected) {
      params.delete('gsc_code');
      params.delete('gsc_state');
      params.delete('gsc_error');
      params.delete('gsc_connected');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    }

    (async () => {
      if (code && state) {
        const result = await exchangeGSCCode(code, state);
        if (result.success) {
          notifySuccess(
            'Google Search Console Verified',
            result.propertyAccessible === false
              ? `OAuth completed, but ${result.siteUrl || gscSiteUrl || 'the property'} is not readable by this Google account. ${result.verificationMessage || ''}`.trim()
              : `Property ${result.siteUrl || gscSiteUrl || 'the property'} now has live Search Console access.`
          );
        } else {
          notifyError('GSC Verification Failed', result.error || 'The OAuth grant could not be verified.');
        }
      } else if (oauthError) {
        notifyError('Google Search Console', describeGscOAuthError(oauthError));
      } else if (legacyConnected === 'true') {
        // Legacy links claim success — defer to the server's actual state.
        notifyInfo('Connection Return Detected', 'Confirming Search Console connection state with the server…');
      }
      await loadData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when the date range changes (the mount load happens above).
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const refreshDialogRedirectUri = async () => {
    try {
      const diagnostics = await fetchGSCDiagnostics();
      if (diagnostics?.redirectUri) {
        setDialogRedirectUri(diagnostics.redirectUri);
        return;
      }
    } catch {
      // Fall through to the connection status below.
    }
    const status = await getGSCConnectionStatus();
    setDialogRedirectUri(status.redirectUri || null);
  };

  const handleConnectDirect = async () => {
    const siteUrl = gscSiteUrl.trim();
    if (!siteUrl) {
      notifyError('Property Required', 'Enter the verified Search Console property, e.g. sc-domain:example.com or https://example.com/.');
      return;
    }
    setIsConnecting(true);
    try {
      const result = await connectGSC({
        siteUrl,
        clientId: clientId.trim() || undefined,
        clientSecret: clientSecret.trim() || undefined,
      });
      if (!result.success) {
        // Honest failure: the old handler toasted success on ANY outcome,
        // including a 500, which is exactly why "connected" showed demo data.
        notifyError('Connection Failed', result.error || 'The server rejected the Search Console connection.');
        return;
      }
      setConnection(prev => ({
        ...prev,
        connected: true,
        siteUrl: result.siteUrl || siteUrl,
        verificationState: result.verificationState,
        hasGrant: result.hasGrant,
        oauthConfigured: result.oauthConfigured,
        redirectUri: result.redirectUri || prev.redirectUri,
      }));
      if (result.redirectUri) setDialogRedirectUri(result.redirectUri);
      if (result.authUrl) {
        notifyInfo('Continue in Google', 'Redirecting to Google for the OAuth grant — approve Search Console access to finish.');
        window.location.href = result.authUrl;
        return;
      }
      setIsConnectModalOpen(false);
      if (result.hasGrant) {
        notifySuccess('Google Search Console Connected', `Property ${result.siteUrl || siteUrl} is connected with live access.`);
      } else {
        notifyWarning(
          'Property Saved — OAuth Required',
          result.error || 'No OAuth client is configured yet, so live data cannot be fetched. Enter a Google OAuth Client ID/Secret and connect again.'
        );
      }
      await loadData();
    } catch (err) {
      notifyError('Connection Failed', err instanceof Error ? err.message : 'Network error while connecting to the server.');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyRedirectUri = async () => {
    const uri = dialogRedirectUri || connection.redirectUri;
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setRedirectUriCopied(true);
      notifySuccess('Redirect URI Copied', 'Paste it verbatim into Google Cloud → Authorized redirect URIs.');
    } catch {
      notifyError('Copy Failed', 'Select the URI text and copy it manually.');
    }
  };

  const handleDisconnect = async () => {
    await disconnectGSC();
    setConnection({ connected: false });
    setData(generateDemoGSCData(dateRange));
    setDataNote(null);
    notifyInfo('GSC Disconnected', 'Switched to demonstration mode.');
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const status = await getGSCConnectionStatus();
      setConnection(status);

      if (!status.connected) {
        // Genuinely disconnected → demo numbers under the DEMO DATA badge.
        setData(generateDemoGSCData(dateRange));
        setDataNote(null);
        return;
      }

      const result = await fetchGSCAnalytics(dateRange);
      if (result.kind === 'live') {
        setData(result.data);
        setDataNote(null);
        return;
      }
      if (result.kind === 'disconnected') {
        setConnection({ connected: false });
        setData(generateDemoGSCData(dateRange));
        setDataNote(null);
        return;
      }
      // Connected but not live ('awaiting' grant/first sync, or 'error'):
      // render the explicit panel — NEVER demo numbers under a LIVE badge.
      setData(null);
      setDataNote({ kind: result.kind, message: result.message });
    } catch {
      setData(generateDemoGSCData(dateRange));
      setDataNote(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    notifyInfo('Refreshing GSC Data', 'Fetching latest Search Console metrics...');
    onResultPush?.('GSC_FETCH', 'Search Console Data Refresh', `Fetched ${dateRange} data for sigmatactix.com`, { range: dateRange });
  };

  // Compute period-over-period change
  const periodChange = useMemo(() => {
    if (!data || data.timeSeries.length < 4) return null;
    const half = Math.floor(data.timeSeries.length / 2);
    const firstHalf = data.timeSeries.slice(0, half);
    const secondHalf = data.timeSeries.slice(half);
    const avgFirst = firstHalf.reduce((s, p) => s + p.clicks, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, p) => s + p.clicks, 0) / secondHalf.length;
    const clickChange = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    const avgFirstImp = firstHalf.reduce((s, p) => s + p.impressions, 0) / firstHalf.length;
    const avgSecondImp = secondHalf.reduce((s, p) => s + p.impressions, 0) / secondHalf.length;
    const impChange = avgFirstImp > 0 ? ((avgSecondImp - avgFirstImp) / avgFirstImp) * 100 : 0;

    const avgFirstPos = firstHalf.reduce((s, p) => s + p.position, 0) / firstHalf.length;
    const avgSecondPos = secondHalf.reduce((s, p) => s + p.position, 0) / secondHalf.length;
    const posChange = avgSecondPos - avgFirstPos; // negative is improvement

    return { clickChange, impChange, posChange };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        <div className="text-xs font-mono text-amber-400 font-bold">LOADING SEARCH CONSOLE DATA...</div>
      </div>
    );
  }

  if (!data) {
    // Connected but not live: awaiting the OAuth grant / first sync, or an
    // honest fetch error. Explicit states — no fabricated numbers, and no
    // LIVE badge over demo data.
    if (isConnected && dataNote) {
      const isError = dataNote.kind === 'error';
      return (
        <div className="p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl text-center space-y-4">
          {isError ? (
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          ) : (
            <ShieldCheck className="w-12 h-12 text-blue-400 mx-auto" />
          )}
          <h3 className="text-lg font-bold text-white">
            {isError ? 'Search Console Fetch Failed' : 'Connected — Awaiting OAuth Grant'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">{dataNote.message}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => loadData()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-200 font-semibold rounded-xl text-sm border border-white/10 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Retry Fetch
            </button>
            <button
              onClick={() => { setRedirectUriCopied(false); setIsConnectModalOpen(true); void refreshDialogRedirectUri(); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl text-sm cursor-pointer shadow-md hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              <Link2 className="w-4 h-4" /> Open Connect Dialog
            </button>
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-medium rounded-xl text-sm border border-white/10 cursor-pointer transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl text-center space-y-4">
        <Globe className="w-12 h-12 text-zinc-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">Connect Google Search Console</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Link your Google Search Console account to see real-time click, impression, CTR, and ranking data for your verified property.
        </p>
        <button
          onClick={() => { setRedirectUriCopied(false); setIsConnectModalOpen(true); void refreshDialogRedirectUri(); }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl text-sm cursor-pointer shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          <Link2 className="w-4 h-4" /> Connect Search Console
        </button>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Clicks',
      value: data.totals.clicks.toLocaleString(),
      icon: MousePointerClick,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      change: periodChange ? periodChange.clickChange : null,
      sparkData: data.timeSeries.map(p => p.clicks),
      sparkColor: '#60a5fa'
    },
    {
      label: 'Total Impressions',
      value: data.totals.impressions.toLocaleString(),
      icon: Eye,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/20',
      change: periodChange ? periodChange.impChange : null,
      sparkData: data.timeSeries.map(p => p.impressions),
      sparkColor: '#c084fc'
    },
    {
      label: 'Avg. CTR',
      value: `${(data.totals.ctr * 100).toFixed(2)}%`,
      icon: Target,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/20',
      change: null,
      sparkData: data.timeSeries.map(p => p.ctr),
      sparkColor: '#34d399'
    },
    {
      label: 'Avg. Position',
      value: data.totals.position.toFixed(1),
      icon: BarChart3,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
      change: periodChange ? periodChange.posChange : null,
      invertChange: true,
      sparkData: data.timeSeries.map(p => p.position),
      sparkColor: '#fbbf24'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Google Search Console Trends
              {!isConnected && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                  DEMO DATA
                </span>
              )}
              {isConnected && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-bold">
                  LIVE
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono">
              {data.siteUrl} • {data.dateRange.start} → {data.dateRange.end}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
            {(['7d', '28d', '90d', '16m'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-2 text-[11px] font-mono cursor-pointer transition-all",
                  dateRange === range
                    ? "bg-amber-400/10 text-amber-400 font-bold"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl border border-zinc-700/50 cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {!isConnected ? (
            <button
              onClick={() => { setRedirectUriCopied(false); setIsConnectModalOpen(true); void refreshDialogRedirectUri(); }}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              <Link2 className="w-3.5 h-3.5" /> Connect GSC
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] rounded-xl flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> GSC: {gscSiteUrl}
              </span>
              <button
                onClick={handleDisconnect}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-[10px] font-mono border border-white/10 transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          const changeVal = m.change;
          const isPositive = m.invertChange ? (changeVal !== null && changeVal < 0) : (changeVal !== null && changeVal > 0);

          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("p-4 rounded-2xl border backdrop-blur-sm", m.bgColor, m.borderColor)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", m.color)} />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">{m.label}</span>
                </div>
                {changeVal !== null && (
                  <span className={cn("text-[10px] font-mono font-bold flex items-center gap-0.5", isPositive ? "text-emerald-400" : "text-red-400")}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(changeVal).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-2">{m.value}</div>
              <Sparkline data={m.sparkData} color={m.sparkColor} />
            </motion.div>
          );
        })}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
          <TrendChart timeSeries={data.timeSeries} metric="clicks" color="#60a5fa" label="Clicks Over Time" />
        </div>
        <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
          <TrendChart timeSeries={data.timeSeries} metric="impressions" color="#c084fc" label="Impressions Over Time" />
        </div>
      </div>

      {/* Queries / Pages Table */}
      <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['queries', 'pages'] as const).map(view => (
              <button
                key={view}
                onClick={() => setQueryView(view)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all",
                  queryView === view
                    ? "bg-amber-400/10 text-amber-400 font-bold border border-amber-400/20"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/50 border border-transparent"
                )}
              >
                {view === 'queries' ? 'Top Queries' : 'Top Pages'}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {queryView === 'queries' ? data.topQueries.length : data.topPages.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="py-2 text-[10px] font-mono text-zinc-500 uppercase w-[40%]">
                  {queryView === 'queries' ? 'Query' : 'Page'}
                </th>
                <th className="py-2 text-[10px] font-mono text-zinc-500 uppercase text-right">Clicks</th>
                <th className="py-2 text-[10px] font-mono text-zinc-500 uppercase text-right">Impressions</th>
                <th className="py-2 text-[10px] font-mono text-zinc-500 uppercase text-right">CTR</th>
                <th className="py-2 text-[10px] font-mono text-zinc-500 uppercase text-right">Position</th>
              </tr>
            </thead>
            <tbody>
              {(queryView === 'queries' ? data.topQueries : data.topPages).map((row, i) => (
                <tr key={i} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                  <td className="py-2.5 text-xs text-white font-medium truncate max-w-[300px]">
                    {'query' in row ? (row as any).query : (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="truncate">{(row as any).page.replace('https://sigmatactix.com', '')}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-xs text-blue-400 font-mono text-right font-bold">{row.clicks.toLocaleString()}</td>
                  <td className="py-2.5 text-xs text-purple-400 font-mono text-right">{row.impressions.toLocaleString()}</td>
                  <td className="py-2.5 text-xs text-emerald-400 font-mono text-right">{(row.ctr * 100).toFixed(1)}%</td>
                  <td className="py-2.5 text-xs text-amber-400 font-mono text-right">{row.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connect GSC Modal */}
      <AnimatePresence>
        {isConnectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Connect Google Search Console</h3>
                    <p className="text-[11px] text-zinc-400">Store a property + OAuth client, then complete the read-only Google grant</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConnectModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Verified Search Property
                  </label>
                  <input
                    type="text"
                    value={gscSiteUrl}
                    onChange={e => setGscSiteUrl(e.target.value)}
                    placeholder="e.g. sc-domain:example.com or https://example.com/"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500/50"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Domain properties require DNS verification. URL-prefix properties require meta tag.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Save Property &amp; Continue to Google
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Stores your property and OAuth client <strong className="text-white">AES-256-GCM encrypted</strong> in this workspace's vault, then redirects you to Google to grant read-only Search Console access. The connection is only marked live after Google confirms the grant.
                  </p>
                  <button
                    onClick={handleConnectDirect}
                    disabled={isConnecting || !gscSiteUrl.trim()}
                    className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving Property...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connect &amp; Grant Search Console Access
                      </>
                    )}
                  </button>
                </div>

                {/* Optional OAuth 2.0 Credentials */}
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" /> Custom Google Cloud OAuth (Optional)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      placeholder="OAuth Client ID"
                      className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={e => setClientSecret(e.target.value)}
                      placeholder="OAuth Client Secret"
                      className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Redirect URI whitelist helper — the #1 cause of Google's
                    Error 400 redirect_uri_mismatch is a URI that differs by a
                    single character (port, trailing slash, http vs https). */}
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="text-[11px] font-semibold text-amber-300">
                    Step 0 — Whitelist this Redirect URI in Google Cloud
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Google Cloud → APIs &amp; Services → Credentials → your OAuth client → <strong className="text-zinc-200">Authorized redirect URIs</strong> → add the URI below <strong className="text-zinc-200">exactly</strong> (scheme, host, port and path must match byte-for-byte).
                  </p>
                  {(dialogRedirectUri || connection.redirectUri) ? (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 min-w-0 truncate px-2.5 py-2 bg-black/50 border border-white/10 rounded-lg text-[11px] font-mono text-emerald-300">
                        {dialogRedirectUri || connection.redirectUri}
                      </code>
                      <button
                        onClick={copyRedirectUri}
                        className="shrink-0 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-semibold text-zinc-200 cursor-pointer transition-colors"
                      >
                        {redirectUriCopied ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500">Loading the exact redirect URI from the server…</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Stay in SEO & AEO Authority Studio</span>
                <button
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
