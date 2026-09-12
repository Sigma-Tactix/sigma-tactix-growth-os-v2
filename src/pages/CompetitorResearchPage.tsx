import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { 
  SEED_COMPETITORS, 
  SEED_CREATIVE_COMPARISONS, 
  CompetitorProfile, 
  CreativeComparisonItem 
} from '@/src/data/marketingModulesData';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

export default function CompetitorResearchPage() {
  const { notifySuccess, notifyInfo } = useToast();
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>(SEED_COMPETITORS);
  const [creativeComparisons, setCreativeComparisons] = useState<CreativeComparisonItem[]>(SEED_CREATIVE_COMPARISONS);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorProfile>(SEED_COMPETITORS[0]);
  const [selectedCreativeComparison, setSelectedCreativeComparison] = useState<CreativeComparisonItem>(SEED_CREATIVE_COMPARISONS[0]);
  const [activeTab, setActiveTab] = useState<'CREATIVE_MATRIX' | 'PROFILES' | 'COUNTER_ATTACK' | 'SPY_AGENT'>('CREATIVE_MATRIX');

  // Scanner State
  const [scanDomain, setScanDomain] = useState('omnivanguard.io');
  const [isScanning, setIsScanning] = useState(false);
  const [isDeployingSpy, setIsDeployingSpy] = useState(false);

  // Agent Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-comp-01',
      agentName: 'Spectre-06 Ad Spy Swarm',
      agentRole: 'Rival Funnel & Creative Spy Specialist',
      timestamp: 'Today at 04:20 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Competitor Intelligence',
      inputSummary: 'Target: omnivanguard.io (Meta Ad Library & Google Ads Transparency)',
      outputSummary: 'Scraped 42 ad creatives. Flagged creative fatigue on 3 core angles.',
      fullOutput: 'Identified $45k/mo estimated spend. Positioned counter-hooks into Second Brain Customer Vault.',
      metrics: [
        { label: 'Rival Tracked', value: 'OmniVanguard' },
        { label: 'Ads Extracted', value: '42' },
        { label: 'Vulnerabilities', value: '4 High Impact' },
        { label: 'Counter-Playbook', value: 'Generated' }
      ]
    }
  ]);

  const handleScanCompetitor = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const newRun: AgentRunRecord = {
        id: `run-comp-${Date.now()}`,
        agentName: 'Spectre-06 Ad Spy Swarm',
        agentRole: 'Rival Funnel & Creative Spy Specialist',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Competitor Intelligence',
        inputSummary: `Scanned ${scanDomain}`,
        outputSummary: 'Extracted 42 active ad creatives and 4 critical positioning gaps.',
        fullOutput: `Domain: ${scanDomain}\nEstimated Ad Spend: $45,000/mo\nKey Weakness: 9-month employee turnover & last-click bias`,
        metrics: [
          { label: 'Domain', value: scanDomain },
          { label: 'Est. Spend', value: '$45k/mo' },
          { label: 'Weakness', value: 'Context Loss' }
        ]
      };
      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess(
        'Competitor Funnel Scanned',
        `Extracted 42 active ad creatives, estimated $45k/mo spend, and detected 4 critical positioning vulnerabilities.`
      );
    }, 1400);
  };

  const handleDeploySpyAgent = () => {
    setIsDeployingSpy(true);
    setTimeout(() => {
      setIsDeployingSpy(false);
      const newRun: AgentRunRecord = {
        id: `run-spy-${Date.now()}`,
        agentName: 'Spectre-06 Ad Spy Swarm',
        agentRole: 'Rival Funnel & Creative Spy Specialist',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Competitor Intelligence',
        inputSummary: 'Dispatched full counter-attack playbook against tracked rivals',
        outputSummary: 'Synthesized 12 rival counter-hooks directly into Second Brain vaults.',
        fullOutput: 'Committed 12 new hooks to ZONE_2_MARKETING. Counter-messaging active.',
        metrics: [
          { label: 'Counter-Hooks', value: '12 Active' },
          { label: 'Channels', value: 'Meta, Google, X' },
          { label: 'Status', value: 'Synchronized' }
        ]
      };
      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess(
        'Spectre-06 Ad Spy Swarm Dispatched',
        'Scraped Meta Ad Library & Google Ads Transparency Center. Committed 12 new rival hooks to Second Brain Customer Vault.'
      );
    }, 1400);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-mono tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full font-bold">
              INTELLIGENCE LAYER
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-xs font-mono text-zinc-400">SPECTRE-06 AD SPY SWARM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            Competitor Intelligence & Creative Comparisons
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Side-by-side rival ad creative teardowns, offer comparisons, funnel positioning analysis, and automated counter-attack playbooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScanCompetitor}
            disabled={isScanning}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", isScanning && "animate-spin")} />
            {isScanning ? 'Scraping Funnel...' : 'Scan Competitor'}
          </button>

          <button
            onClick={handleDeploySpyAgent}
            disabled={isDeployingSpy}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Swords className="w-3.5 h-3.5" />
            {isDeployingSpy ? 'Deploying Swarm...' : 'Deploy Counter-Attack Swarm'}
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Tracked Rivals</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            {competitors.length} Competitors
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">107 active ad creatives tracked</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Estimated Combined Ad Spend</div>
          <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            $108,000 / mo
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Across Google, Meta, & LinkedIn</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Primary Vulnerability</div>
          <div className="text-2xl font-bold text-rose-400 flex items-center gap-2">
            Rented Headcount
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">High retainers, zero client memory</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Counter-Ad Win Rate</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            3.4x Higher CTR
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Verified on LinkedIn & Meta</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('CREATIVE_MATRIX')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'CREATIVE_MATRIX'
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <Swords className="w-3.5 h-3.5" />
          Creative Comparisons Matrix (Rival vs. Sigma Counter-Ad)
        </button>

        <button
          onClick={() => setActiveTab('PROFILES')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'PROFILES'
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Competitor Profiles & Tech Stacks
        </button>

        <button
          onClick={() => setActiveTab('COUNTER_ATTACK')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'COUNTER_ATTACK'
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <Target className="w-3.5 h-3.5" />
          Counter-Attack Strategy Playbook
        </button>
      </div>

      {/* TAB 1: CREATIVE COMPARISONS MATRIX */}
      {activeTab === 'CREATIVE_MATRIX' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {creativeComparisons.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedCreativeComparison(item)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all cursor-pointer",
                  selectedCreativeComparison.id === item.id
                    ? "bg-amber-400/10 border-amber-400/40 text-white shadow-lg shadow-amber-500/5"
                    : "bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-amber-400 font-bold">{item.channel}</span>
                  <span className="text-zinc-500">{item.creativeType}</span>
                </div>
                <div className="font-semibold text-xs text-white truncate">{item.competitorName}</div>
                <div className="text-[11px] text-zinc-500 mt-1 line-clamp-2">"{item.adHeadline}"</div>
              </button>
            ))}
          </div>

          {/* Side-by-Side Comparison Box */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
            {/* Left: Competitor Ad */}
            <div className="space-y-4 p-5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs rounded-full font-bold">
                    COMPETITOR AD CREATIVE
                  </span>
                  <span className="text-xs font-mono text-zinc-400">Est. CTR: {selectedCreativeComparison.estimatedCtr}</span>
                </div>

                <div className="text-sm font-bold text-white">
                  {selectedCreativeComparison.competitorName}
                </div>

                <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-rose-300">
                    "{selectedCreativeComparison.adHeadline}"
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {selectedCreativeComparison.adCopy}
                  </p>
                </div>

                <div className="space-y-1 text-xs font-mono pt-2 border-t border-zinc-800">
                  <div className="text-zinc-500">Hook Angle: <strong className="text-zinc-300">{selectedCreativeComparison.hookAngle}</strong></div>
                  <div className="text-zinc-500">Call to Action Offer: <strong className="text-zinc-300">{selectedCreativeComparison.offer}</strong></div>
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 rounded-lg text-rose-300 text-[11px] font-mono">
                Analysis: Relies on generic promises and manual human account management. Highly vulnerable to speed and asset ownership objections.
              </div>
            </div>

            {/* Right: Sigma Tactix Counter-Ad */}
            <div className="space-y-4 p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs rounded-full font-bold">
                    SIGMA TACTIX COUNTER-ATTACK
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">+3.4x Expected CTR</span>
                </div>

                <div className="text-sm font-bold text-white">
                  Sigma Tactix Growth OS
                </div>

                <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-amber-300">
                    "{selectedCreativeComparison.sigmaTactixCounterAd.headline}"
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    {selectedCreativeComparison.sigmaTactixCounterAd.copy}
                  </p>
                </div>

                <div className="space-y-1 text-xs font-mono pt-2 border-t border-zinc-800">
                  <div className="text-zinc-500">Counter-Hook Angle: <strong className="text-amber-400">{selectedCreativeComparison.sigmaTactixCounterAd.counterHookAngle}</strong></div>
                  <div className="text-zinc-500">Strategic Advantage: <strong className="text-emerald-400">{selectedCreativeComparison.sigmaTactixCounterAd.strategicAdvantage}</strong></div>
                </div>
              </div>

              <button
                onClick={() => notifySuccess('Counter-Ad Deployed to Paid Media Swarm', 'Vortex-02 agent will launch this counter-creative across LinkedIn and Meta.')}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                Launch Counter-Creative Swarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILES */}
      {activeTab === 'PROFILES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Competitor Directory ({competitors.length})
            </div>

            {competitors.map(comp => (
              <div
                key={comp.id}
                onClick={() => setSelectedCompetitor(comp)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer text-left",
                  selectedCompetitor.id === comp.id
                    ? "bg-amber-400/10 border-amber-400/40 text-white"
                    : "bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-white">{comp.name}</span>
                  <span className="text-amber-400">{comp.marketShare}</span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">{comp.domain}</div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedCompetitor.name}</h3>
                <div className="text-xs font-mono text-zinc-400 mt-0.5">
                  Domain: {selectedCompetitor.domain} • Traffic: {selectedCompetitor.monthlyTraffic} • Spend: {selectedCompetitor.estimatedAdSpend}
                </div>
              </div>

              <span className="px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-mono rounded-lg">
                {selectedCompetitor.adCreativesCount} Tracked Creatives
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Current Market Positioning</div>
              <p className="text-xs text-zinc-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-zinc-800">
                {selectedCompetitor.positioning}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Perceived Strengths
                </div>
                <ul className="text-xs text-zinc-400 space-y-1 pl-4 list-disc">
                  {selectedCompetitor.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-2">
                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Critical Vulnerabilities to Exploit
                </div>
                <ul className="text-xs text-zinc-300 space-y-1 pl-4 list-disc">
                  {selectedCompetitor.vulnerabilities.map((vuln, i) => (
                    <li key={i}>{vuln}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Detected Tech Stack</div>
              <div className="flex flex-wrap gap-2">
                {selectedCompetitor.techStack.map((tech, i) => (
                  <span key={i} className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COUNTER-ATTACK PLAYBOOK */}
      {activeTab === 'COUNTER_ATTACK' && (
        <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Strategic Counter-Attack Playbook
          </h3>
          <p className="text-xs text-zinc-400">
            Systematic rules executed by Nexus-03 (Content) and Vortex-02 (Paid Ads) to capture market share from incumbent agencies.
          </p>

          <div className="space-y-3 pt-2">
            {[
              {
                rule: 'Pillory the Rented Headcount Model',
                detail: 'Whenever a competitor advertises team size ("our 50-person agency"), deploy counter-ads highlighting permanent client asset ownership and zero context loss.',
                status: 'ACTIVE IN VORTEX-02'
              },
              {
                rule: 'Target Competitor Brand Search with Comparison Teardowns',
                detail: 'Bid on "[Competitor Name] alternatives" and "[Competitor Name] review" with deep architectural teardowns hosted on high-speed static landing pages.',
                status: 'ACTIVE IN GOOGLE ADS'
              },
              {
                rule: 'Exploit Slow Iteration Cycles',
                detail: 'When a competitor launches a new messaging angle, spin up 10 counter-hooks in Content Engine within 4 hours, beating their 2-week client revision cycle.',
                status: 'READY FOR DISPATCH'
              }
            ].map((play, idx) => (
              <div key={idx} className="p-4 bg-black/60 border border-zinc-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-white">{play.rule}</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{play.detail}</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 font-mono text-[11px] rounded-lg self-end md:self-center whitespace-nowrap">
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
          title="Spectre-06 Competitor Intelligence Run Results"
          description="Log of rival ad transparency scrapers, positioning teardowns, and counter-attack hook dispatches."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}
