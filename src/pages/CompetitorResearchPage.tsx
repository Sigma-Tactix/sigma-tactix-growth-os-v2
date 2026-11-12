import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  Sparkles, 
  Bot, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Eye, 
  Target, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  Layers, 
  ArrowRight, 
  Swords, 
  BarChart3, 
  Copy, 
  Check,
  Globe,
  Database,
  ArrowUpRight,
  Lock,
  FileText,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { 
  SEED_COMPETITORS, 
  SEED_CREATIVE_COMPARISONS, 
  CompetitorProfile, 
  CreativeComparisonItem 
} from '@/src/data/marketingModulesData';
import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { GlassCard, Button, Badge, MetricWidget, Tabs } from '@/src/components/ui';
import {
  searchWebIntelligence,
  fetchWebIntelligence,
  getWebIntelligenceCapabilities,
  apiFetch,
} from '@/src/lib/api';

export default function CompetitorResearchPage() {
  const { notifySuccess, notifyInfo, notifyWarning, notifyError } = useToast();
  const navigate = useNavigate();

  // Demo seeds are gated like every other module: a fresh tenant opens with an
  // empty tracker. Seeded profiles/creative comparisons only show behind
  // VITE_SEED_DEMO_WORKSPACE, and even then they are labelled as sample data.
  const seededCompetitors = isDemoSeedEnabled() ? SEED_COMPETITORS : [];
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>(seededCompetitors);
  const seededComparisons = isDemoSeedEnabled() ? SEED_CREATIVE_COMPARISONS : [];
  const [creativeComparisons, setCreativeComparisons] = useState<CreativeComparisonItem[]>(seededComparisons);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorProfile | null>(seededCompetitors[0] ?? null);
  const [selectedCreativeComparison, setSelectedCreativeComparison] = useState<CreativeComparisonItem | null>(seededComparisons[0] ?? null);
  const showSampleBanner = isDemoSeedEnabled();
  
  type TabType = 'WEB_INTELLIGENCE' | 'CREATIVE_MATRIX' | 'PROFILES' | 'COUNTER_ATTACK';
  const [activeTab, setActiveTab] = useState<TabType>('WEB_INTELLIGENCE');

  // Scanner State
  const [scanDomain, setScanDomain] = useState('omnivanguard.io');
  const [isScanning, setIsScanning] = useState(false);
  const [isDeployingSpy, setIsDeployingSpy] = useState(false);

  // Live TinyFish Web Intelligence State
  const [tinyFishState, setTinyFishState] = useState<'checking' | 'verified' | 'unconfigured' | 'fixture'>('checking');
  const [tinyFishDetail, setTinyFishDetail] = useState('');
  const [searchQuery, setSearchQuery] = useState('omnivanguard.io pricing and features');
  const [fetchUrl, setFetchUrl] = useState('https://omnivanguard.io/pricing');
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [fetchedContent, setFetchedContent] = useState<any | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const [committedVaultUrl, setCommittedVaultUrl] = useState<string | null>(null);

  // Check TinyFish capabilities on mount
  useEffect(() => {
    let active = true;
    const checkCaps = async () => {
      try {
        const res = await getWebIntelligenceCapabilities();
        if (!active) return;
        const caps = res?.capabilities;
        if (caps?.verified) {
          setTinyFishState(caps.detail?.includes('Fixture') ? 'fixture' : 'verified');
          setTinyFishDetail(caps.detail || 'Verified and operational');
        } else {
          setTinyFishState('unconfigured');
          setTinyFishDetail(caps?.detail || 'TinyFish API key required');
        }
      } catch (err: any) {
        if (!active) return;
        setTinyFishState('unconfigured');
        setTinyFishDetail(err?.message || 'Web Intelligence endpoint unavailable');
      }
    };
    checkCaps();
    return () => { active = false; };
  }, []);

  // Agent Run History — starts empty. Entries are only added after a real
  // TinyFish search/fetch succeeds. A fresh workspace must not show a
  // fabricated "completed ad-spy run".
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  const handleSearchWeb = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await searchWebIntelligence(searchQuery.trim(), 5);
      const results = res?.results || [];
      setSearchResults(results);
      notifySuccess('Web Intelligence Found', `Discovered ${results.length} competitor sources via TinyFish.`);
      
      const newRun: AgentRunRecord = {
        id: `run-tf-search-${Date.now()}`,
        agentName: 'TinyFish Web Intelligence',
        agentRole: 'Public Web Discovery & Source Search',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Competitor Intelligence',
        inputSummary: `Query: "${searchQuery}"`,
        outputSummary: `Retrieved ${results.length} competitor evidence items from the web-intelligence gateway.`,
        fullOutput: JSON.stringify(results, null, 2),
        metrics: [
          { label: 'Results', value: `${results.length}` },
          { label: 'Provider', value: 'TinyFish' },
          ...(results[0]?.latencyMs != null ? [{ label: 'Latency', value: `${results[0].latencyMs}ms` }] : [])
        ]
      };
      setRunHistory(prev => [newRun, ...prev]);
    } catch (err: any) {
      notifyError('Search Error', err?.message || 'TinyFish search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetchWeb = async (urlToFetch?: string) => {
    const target = urlToFetch || fetchUrl;
    if (!target.trim()) return;

    setIsFetching(true);
    try {
      const res = await fetchWebIntelligence([target.trim()], 'markdown');
      const doc = res?.results?.[0] || null;
      setFetchedContent(doc);
      notifySuccess('Markdown Snapshot Extracted', `Retrieved full page content for ${target}.`);

      const newRun: AgentRunRecord = {
        id: `run-tf-fetch-${Date.now()}`,
        agentName: 'TinyFish Web Intelligence',
        agentRole: 'Headless Page Fetch & Markdown Extraction',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Competitor Intelligence',
        inputSummary: `Target URL: ${target}`,
        outputSummary: `Extracted ${doc?.content?.length || 0} characters of markdown from the fetched page.`,
        fullOutput: doc?.content || '',
        metrics: [
          { label: 'Source', value: doc?.sourceUrl || target },
          { label: 'Format', value: 'Markdown' }
        ]
      };
      setRunHistory(prev => [newRun, ...prev]);
    } catch (err: any) {
      notifyError('Fetch Error', err?.message || 'TinyFish fetch failed');
    } finally {
      setIsFetching(false);
    }
  };

    // No vault-commit endpoint exists for arbitrary text yet, so this stages the
  // snapshot locally in-session and says exactly that — it does not claim an
  // immutable SHA-256 write to Zone 2 (no API call is made).
  const handleCommitToMarketingVault = (doc: any) => {
    setCommittedVaultUrl(doc.sourceUrl);
    notifyInfo(
      'Snapshot Staged',
      `"${doc.title || doc.sourceUrl}" marked for Marketing Vault in this session. No vault write was made — commit persistence is not wired yet.`
    );
  };

  // Honest "planned action": no ad-library scraping backend exists yet. This
  // records a queued plan and never claims a completed scrape or a vault write.
  const handleDeploySpyAgent = () => {
    setIsDeployingSpy(true);
    setTimeout(() => {
      setIsDeployingSpy(false);
      const newRun: AgentRunRecord = {
        id: `run-spy-${Date.now()}`,
        agentName: 'Spectre-06 Ad Spy Swarm',
        agentRole: 'Rival Funnel & Creative Spy Specialist',
        timestamp: 'Just now',
        status: 'PARTIAL',
        moduleOrigin: 'Competitor Intelligence',
        inputSummary: 'Counter-attack plan requested against tracked rivals',
        outputSummary: 'Plan queued. No ad-library scraping backend is configured, so nothing was scraped and nothing was committed to vaults.',
        fullOutput: 'PLANNED ACTION — counter-attack plan only. Wire Spectre-06 to a real ad-transparency source to execute.',
        metrics: [
          { label: 'Plan Items', value: '3' },
          { label: 'Channels', value: 'Meta, Google, X (planned)' },
          { label: 'Status', value: 'Queued — not executed' }
        ]
      };
      setRunHistory(prev => [newRun, ...prev]);
      notifyWarning(
        'Counter-Attack Plan Queued',
        'The playbook is staged as a plan. No ad libraries were scraped and no hooks were committed — connect a scraping source to execute for real.'
      );
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">INTELLIGENCE LAYER</Badge>
              <span className="text-[var(--sigma-text-soft)] text-xs">•</span>
              <Badge variant={tinyFishState === 'unconfigured' ? 'warning' : 'success'}>
                {tinyFishState === 'fixture'
                  ? 'TINYFISH FIXTURE (ACTIVE)'
                  : tinyFishState === 'verified'
                  ? 'TINYFISH LIVE (VERIFIED)'
                  : 'SETUP REQUIRED'}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <Trophy className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Competitor Intelligence & Live Web Discovery
            </h1>
            <p className="text-muted text-sm mt-1 max-w-2xl leading-relaxed">
              Track rival pricing changes, positioning pivots, and ad funnels with live web intelligence and market simulation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/market-simulator">
              <Button
                variant="outline"
                size="sm"
                icon={<Swords className="w-4 h-4 text-amber-accent" />}
              >
                Open Market Simulator (MiroFish) <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDeploySpyAgent}
              isLoading={isDeployingSpy}
              icon={<Bot className="w-4 h-4" />}
            >
              {isDeployingSpy ? 'Staging Plan...' : 'Stage Counter-Attack Plan'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricWidget
          label="Tracked Rivals"
          value={`${competitors.length} Competitors`}
          subtext={competitors.length > 0 ? (showSampleBanner ? "Sample profiles — no live tracking yet" : "In tracker") : "No rivals tracked yet"}
        />

        <MetricWidget
          label="Web Intelligence"
          value={tinyFishState === 'verified' ? 'TinyFish Live' : tinyFishState === 'fixture' ? 'TinyFish Fixture' : 'Setup Required'}
          delta={tinyFishState === 'verified' ? { value: "Live", trend: "up" } : undefined}
          subtext="Server-side search & markdown extraction"
        />

        <MetricWidget
          label="Counter-Positioning"
          value="Playbook Ready"
          subtext="Modeled counter-angles — not a measured CTR result"
        />

        <MetricWidget
          label="Verified Claims"
          value="None Yet"
          subtext="No ad-platform or lift data is connected; win rates are modeled estimates only"
        />
      </div>

      {/* Tabs */}
      <Tabs<TabType>
        tabs={[
          { id: 'WEB_INTELLIGENCE', label: 'Live Web Intelligence (TinyFish)', icon: <Globe className="w-3.5 h-3.5 text-sky-accent" /> },
          { id: 'CREATIVE_MATRIX', label: 'Creative Comparisons Matrix', icon: <Swords className="w-3.5 h-3.5" /> },
          { id: 'PROFILES', label: 'Competitor Profiles & Tech Stacks', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'COUNTER_ATTACK', label: 'Counter-Attack Strategy Playbook', icon: <Target className="w-3.5 h-3.5" /> }
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabType)}
      />

      {/* TAB 1: LIVE WEB INTELLIGENCE (TINYFISH) */}
      {activeTab === 'WEB_INTELLIGENCE' && (
        <div className="space-y-6">
          <GlassCard elevation="raised" className="p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--sigma-border)] pb-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--sigma-text)] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-accent" />
                  Live Web Intelligence Search & Snapshot Engine
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Discover public competitor changes, pricing adjustments, and product updates via server-side TinyFish.
                </p>
              </div>
              <Badge variant="info" size="sm">
                Provider: {tinyFishState === 'fixture' ? 'TinyFish Fixture' : 'TinyFish API'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tool A: Search Sources */}
              <div className="p-4 rounded-xl bg-[var(--sigma-surface-subtle)]/60 border border-[var(--sigma-border)] space-y-3">
                <div className="text-xs font-semibold text-[var(--sigma-text)] uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-sky-accent" /> Search Competitor Web Sources
                </div>
                <form onSubmit={handleSearchWeb} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search competitor positioning, pricing..."
                    className="flex-1 bg-[var(--sigma-input)] border border-[var(--sigma-border)] rounded-lg px-3 py-2 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-sky-accent/50"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSearching}
                    icon={<Search className="w-3.5 h-3.5" />}
                  >
                    Search
                  </Button>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-2 pt-2 max-h-60 overflow-y-auto pr-1">
                    {searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[var(--sigma-surface-subtle)]/60 border border-[var(--sigma-border)] rounded-lg text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--sigma-text)] truncate max-w-[240px]">{item.title}</span>
                          <span className="text-[10px] font-mono text-muted">{item.latencyMs}ms</span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed">{item.excerpt}</p>
                        <div className="flex items-center justify-between pt-1">
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-sky-accent hover:underline flex items-center gap-1 truncate max-w-[180px]"
                          >
                            {item.sourceUrl} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              setFetchUrl(item.sourceUrl);
                              handleFetchWeb(item.sourceUrl);
                            }}
                          >
                            Fetch Page
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tool B: Fetch Snapshot */}
              <div className="p-4 rounded-xl bg-[var(--sigma-surface-subtle)]/60 border border-[var(--sigma-border)] space-y-3">
                <div className="text-xs font-semibold text-[var(--sigma-text)] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-accent" /> Fetch Full Page Markdown Snapshot
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={fetchUrl}
                    onChange={e => setFetchUrl(e.target.value)}
                    placeholder="https://competitor.com/pricing"
                    className="flex-1 bg-[var(--sigma-input)] border border-[var(--sigma-border)] rounded-lg px-3 py-2 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-amber-accent/50"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isFetching}
                    onClick={() => handleFetchWeb()}
                    icon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Fetch
                  </Button>
                </div>

                {fetchedContent ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-[var(--sigma-input)]/80 border border-[var(--sigma-border)] rounded-lg max-h-52 overflow-y-auto font-mono text-[11px] text-[var(--sigma-text-soft)] whitespace-pre-wrap leading-relaxed">
                      {fetchedContent.content}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <Button
                        variant={committedVaultUrl === fetchedContent.sourceUrl ? "secondary" : "primary"}
                        size="xs"
                        disabled={committedVaultUrl === fetchedContent.sourceUrl}
                        onClick={() => handleCommitToMarketingVault(fetchedContent)}
                        icon={committedVaultUrl === fetchedContent.sourceUrl ? <Check className="w-3 h-3 text-emerald-accent" /> : <Database className="w-3 h-3" />}
                      >
                        {committedVaultUrl === fetchedContent.sourceUrl ? 'Committed to Vault' : 'Commit to Marketing Vault'}
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          navigate('/market-simulator');
                        }}
                        icon={<Swords className="w-3 h-3 text-amber-accent" />}
                      >
                        Rehearse with MiroFish
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-muted border border-dashed border-[var(--sigma-border)] rounded-lg">
                    Enter a URL above to extract structured markdown evidence with TinyFish.
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: CREATIVE COMPARISONS MATRIX */}
      {activeTab === 'CREATIVE_MATRIX' && (
        <div className="space-y-6">
          {showSampleBanner && (
            <div className="rounded-xl border border-[var(--sigma-accent-amber)]/30 bg-[var(--sigma-accent-amber)]/10 px-4 py-2.5 text-xs text-amber-accent">
              Sample creative comparisons from a demo seed — not scraped ad data. Connect a live ad-library source to replace them with tracked creatives.
            </div>
          )}
          {creativeComparisons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--sigma-border)] p-8 text-center text-xs text-muted">
              No creative comparisons yet. Run a Live Web Intelligence search and fetch a rival ad page to build the matrix, or enable the demo seed.
            </div>
          ) : (
            <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {creativeComparisons.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedCreativeComparison(item)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all cursor-pointer",
                  selectedCreativeComparison?.id === item.id
                    ? "bg-[var(--sigma-accent-amber)]/10 border-[var(--sigma-accent-amber)]/40 text-[var(--sigma-text)] shadow-lg "
                    : "bg-[var(--sigma-surface-subtle)]/40 border-[var(--sigma-border)] text-muted hover:border-[var(--sigma-border-strong)] hover:text-[var(--sigma-text-soft)]"
                )}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-amber-accent font-bold">{item.channel}</span>
                  <span className="text-muted">{item.creativeType}</span>
                </div>
                <div className="font-semibold text-xs text-[var(--sigma-text)] truncate">{item.competitorName}</div>
                <div className="text-[11px] text-muted mt-1 line-clamp-2">"{item.adHeadline}"</div>
              </button>
            ))}
          </div>

          {/* Detailed Side-by-Side Comparison */}
          {selectedCreativeComparison ? (
          <GlassCard elevation="raised" className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
              <div>
                <span className="text-xs font-mono text-muted uppercase tracking-wider">Side-by-Side Analysis</span>
                <h2 className="text-lg font-bold text-[var(--sigma-text)] mt-1">
                  {selectedCreativeComparison.competitorName} vs. Sigma Counter-Positioning
                </h2>
              </div>
              <Badge variant="vermilion">EST. CTR: {selectedCreativeComparison.estimatedCtr}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rival Ad */}
              <div className="p-5 rounded-xl bg-[var(--sigma-surface-subtle)]/60 border border-[var(--sigma-border)] space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="neutral">RIVAL AD ({selectedCreativeComparison.channel})</Badge>
                  <span className="text-rose-accent font-mono text-[11px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Vulnerable Angle
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono text-muted">Headline</div>
                  <div className="text-sm font-semibold text-[var(--sigma-text-soft)]">"{selectedCreativeComparison.adHeadline}"</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono text-muted">Body Copy</div>
                  <p className="text-xs text-muted leading-relaxed italic">"{selectedCreativeComparison.adCopy}"</p>
                </div>
                <div className="pt-2 border-t border-[var(--sigma-border)] space-y-1">
                  <div className="text-[11px] font-mono text-rose-accent font-semibold">Flagged Hook Angle</div>
                  <p className="text-xs text-[var(--sigma-text-soft)]">{selectedCreativeComparison.hookAngle}</p>
                </div>
              </div>

              {/* Sigma Counter-Ad */}
              <div className="p-5 rounded-xl bg-[var(--sigma-accent-amber)]/5 border border-[var(--sigma-accent-amber)]/30 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="vermilion">SIGMA COUNTER-ATTACK</Badge>
                  <span className="text-emerald-accent font-mono text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Proposed Counter-Angle
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono text-amber-accent/80">Counter-Headline</div>
                  <div className="text-sm font-semibold text-[var(--sigma-text)]">"{selectedCreativeComparison.sigmaTactixCounterAd.headline}"</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono text-amber-accent/80">Counter-Body</div>
                  <p className="text-xs text-[var(--sigma-text-soft)] leading-relaxed">"{selectedCreativeComparison.sigmaTactixCounterAd.copy}"</p>
                </div>
                <div className="pt-2 border-t border-[var(--sigma-accent-amber)]/20 space-y-1">
                  <div className="text-[11px] font-mono text-emerald-accent font-semibold">Strategic Advantage</div>
                  <p className="text-xs text-[var(--sigma-text-soft)]">{selectedCreativeComparison.sigmaTactixCounterAd.strategicAdvantage}</p>
                </div>
              </div>
            </div>
          </GlassCard>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--sigma-border)] p-6 text-center text-xs text-muted">
              Select a comparison on the left to see the side-by-side analysis.
            </div>
          )}
          </>
          )}
        </div>
      )}

      {/* TAB 3: PROFILES */}
      {activeTab === 'PROFILES' && (
        <div className="space-y-4">
          {showSampleBanner && (
            <div className="rounded-xl border border-[var(--sigma-accent-amber)]/30 bg-[var(--sigma-accent-amber)]/10 px-4 py-2.5 text-xs text-amber-accent">
              Sample competitor profiles from a demo seed — spend, ad counts and traffic are estimates, not live intelligence.
            </div>
          )}
          {competitors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--sigma-border)] p-8 text-center text-xs text-muted">
              No competitor profiles in the tracker yet. Add rivals via Live Web Intelligence, or enable the demo seed to browse sample profiles.
            </div>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <span className="text-xs font-mono text-muted uppercase tracking-wider block mb-2">Tracked Competitors</span>
            {competitors.map(comp => (
              <button
                key={comp.id}
                type="button"
                onClick={() => setSelectedCompetitor(comp)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all cursor-pointer",
                  selectedCompetitor?.id === comp.id
                    ? "bg-[var(--sigma-accent-amber)]/10 border-[var(--sigma-accent-amber)]/40 text-[var(--sigma-text)]"
                    : "bg-[var(--sigma-surface-subtle)]/40 border-[var(--sigma-border)] text-muted hover:border-[var(--sigma-border-strong)] hover:text-[var(--sigma-text-soft)]"
                )}
              >
                <div className="font-semibold text-sm text-[var(--sigma-text)]">{comp.name}</div>
                <div className="text-xs text-muted mt-0.5">{comp.domain}</div>
                <div className="flex items-center gap-2 mt-3 text-[11px] font-mono">
                  <span className="text-muted">{comp.adCreativesCount} Active Ads</span>
                  <span className="text-[var(--sigma-text-soft)]">•</span>
                  <span className="text-amber-accent font-bold">{comp.estimatedAdSpend}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedCompetitor ? (
          <div className="md:col-span-2 p-6 bg-[var(--sigma-surface-subtle)]/50 border border-[var(--sigma-border)] rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[var(--sigma-text)]">{selectedCompetitor.name}</h3>
                <a
                  href={`https://${selectedCompetitor.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-accent hover:underline flex items-center gap-1 mt-0.5"
                >
                  {selectedCompetitor.domain} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <Badge variant="neutral">POSITIONING: {selectedCompetitor.positioning}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] rounded-xl space-y-1">
                <span className="text-xs font-mono text-muted">Estimated Monthly Ad Spend</span>
                <div className="text-lg font-bold text-[var(--sigma-text)] font-mono">{selectedCompetitor.estimatedAdSpend}</div>
              </div>
              <div className="p-4 bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] rounded-xl space-y-1">
                <span className="text-xs font-mono text-muted">Active Ad Creatives</span>
                <div className="text-lg font-bold text-[var(--sigma-text)] font-mono">{selectedCompetitor.adCreativesCount}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-rose-accent uppercase">Primary Vulnerabilities</div>
              <p className="text-xs text-[var(--sigma-text-soft)] leading-relaxed p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                {selectedCompetitor.vulnerabilities.join(', ')}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--sigma-border)]">
              <div className="text-xs font-mono font-bold text-muted uppercase">Detected Tech Stack</div>
              <div className="flex flex-wrap gap-2">
                {selectedCompetitor.techStack.map((tech, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border-strong)] text-[var(--sigma-text-soft)] text-xs rounded-lg font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
          ) : (
            <div className="md:col-span-2 rounded-xl border border-dashed border-[var(--sigma-border)] p-6 text-center text-xs text-muted">
              Select a competitor on the left to see its profile.
            </div>
          )}
        </div>
          )}
        </div>
      )}

      {/* TAB 4: COUNTER-ATTACK PLAYBOOK */}
      {activeTab === 'COUNTER_ATTACK' && (
        <div className="p-6 bg-[var(--sigma-surface-subtle)]/50 border border-[var(--sigma-border)] rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-[var(--sigma-text)] flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-accent" />
            Strategic Counter-Attack Playbook
          </h3>
          <p className="text-xs text-muted">
            Systematic rules executed by Nexus-03 (Content) and Vortex-02 (Paid Ads) to capture market share from incumbent agencies.
          </p>

          <div className="space-y-3 pt-2">
            {[
              {
                rule: 'Pillory the Rented Headcount Model',
                detail: 'Whenever a competitor advertises team size ("our 50-person agency"), deploy counter-ads highlighting permanent client asset ownership and zero context loss.',
                status: 'PLANNED — VORTEX-02'
              },
              {
                rule: 'Target Competitor Brand Search with Comparison Teardowns',
                detail: 'Bid on "[Competitor Name] alternatives" and "[Competitor Name] review" with deep architectural teardowns hosted on high-speed static landing pages.',
                status: 'PLANNED — GOOGLE ADS'
              },
              {
                rule: 'Exploit Slow Iteration Cycles',
                detail: 'When a competitor launches a new messaging angle, spin up 10 counter-hooks in Content Engine within 4 hours, beating their 2-week client revision cycle.',
                status: 'READY FOR DISPATCH'
              }
            ].map((play, idx) => (
              <div key={idx} className="p-4 bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-[var(--sigma-text)]">{play.rule}</div>
                  <p className="text-muted text-[11px] leading-relaxed">{play.detail}</p>
                </div>
                <span className="px-2.5 py-1 bg-[var(--sigma-accent-amber)]/10 border border-[var(--sigma-accent-amber)]/20 text-amber-accent font-mono text-[11px] rounded-lg self-end md:self-center whitespace-nowrap">
                  {play.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-Time Agent Run Results */}
      <div className="mt-8">
        <AgentRunResults
          records={runHistory}
          title="Spectre-06 & TinyFish Intelligence Run Results"
          description="Log of rival ad transparency scrapers, TinyFish web intelligence queries, and counter-attack hook dispatches."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}

