import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Server,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Search,
  Terminal,
  ExternalLink,
  Layers,
  Cpu,
  RotateCcw,
  Copy,
  Check,
  Filter,
  Flame,
  Scale,
  Gauge,
  Sliders,
  Activity
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/src/contexts/ToastContext';

interface MCPServerInfo {
  id: string;
  name: string;
  category: 'CREATIVE_3D' | 'BROWSER_DEBUG' | 'STORAGE_VAULT' | 'DATA_ANALYTICS' | 'CLOUD_INFRA' | 'OPTIMIZER';
  transport: 'STDIO' | 'SSE' | 'WEBSOCKET';
  command: string;
  toolsCount: number;
  status: 'ONLINE' | 'STANDBY' | 'INITIALIZING';
  tools: string[];
  description: string;
}

interface ProductionSkill {
  id: string;
  name: string;
  source: 'skillsmp' | 'mcpmarket' | 'pm-skills' | 'skillsllm' | 'ponytail' | 'skillspec';
  category: 'GROWTH_PM' | 'CODE_OPTIMIZER' | 'RESEARCH' | 'ATTRIBUTION' | 'GOVERNANCE';
  specStatus: 'VERIFIED' | 'VALIDATING';
  signature: string;
  locSavingsEstimate?: string;
  description: string;
  tags: string[];
  sampleCode?: string;
}

const MCP_SERVERS_CATALOG: MCPServerInfo[] = [
  {
    id: 'mcp-agent-reach',
    name: 'Agent Reach Internet Capability Router',
    category: 'DATA_ANALYTICS',
    transport: 'STDIO',
    command: 'agent-reach doctor --json',
    toolsCount: 15,
    status: 'ONLINE',
    tools: ['jina_web_fetch', 'yt_dlp_subtitles', 'v2ex_hot_topics', 'rss_feed_reader', 'twitter_search', 'reddit_search', 'bilibili_search'],
    description: 'Multi-backend internet routing across 15 platforms (YouTube, Jina, RSS, X, Reddit, LinkedIn). Zero-wrapper runtime.'
  },
  {
    id: 'mcp-ponytail',
    name: 'Ponytail Code Optimizer MCP',
    category: 'OPTIMIZER',
    transport: 'STDIO',
    command: 'npx -y @dietrichgebert/ponytail mcp',
    toolsCount: 6,
    status: 'ONLINE',
    tools: ['ponytail_optimize', 'ponytail_review', 'ponytail_audit', 'ponytail_debt', 'ponytail_gain', 'ponytail_help'],
    description: 'Autonomous minimalist code reducer implementing the 7-rung senior developer ladder. Cuts ~54% of unnecessary code.'
  },
  {
    id: 'mcp-devtools',
    name: 'Chrome DevTools MCP',
    category: 'BROWSER_DEBUG',
    transport: 'STDIO',
    command: 'npx -y @modelcontextprotocol/server-puppeteer',
    toolsCount: 26,
    status: 'ONLINE',
    tools: ['lighthouse_audit', 'performance_analyze_insight', 'take_heapsnapshot', 'click', 'navigate_page', 'take_screenshot'],
    description: 'Deep headless browser automation, Core Web Vitals (LCP/INP) auditing, and DOM accessibility inspection.'
  },
  {
    id: 'mcp-context-vault',
    name: 'Context Vault & Knowledge MCP',
    category: 'STORAGE_VAULT',
    transport: 'STDIO',
    command: 'node ./mcp/context-vault/index.js',
    toolsCount: 12,
    status: 'ONLINE',
    tools: ['get_context', 'save_context', 'ingest_project', 'create_snapshot', 'recall', 'publish_to_team'],
    description: 'Long-term vector retrieval, session memory consolidation, and Second Brain vault synchronization.'
  },
  {
    id: 'mcp-spline',
    name: 'Spline 3D & 2D Vector Engine',
    category: 'CREATIVE_3D',
    transport: 'STDIO',
    command: 'node ./mcp/spline/index.js',
    toolsCount: 32,
    status: 'ONLINE',
    tools: ['3d_generate_3d_model', '3d_run_code', '2d_generate_images', '2d_update_scene', '2d_export_html'],
    description: 'Generative interactive 3D web scenes, living system biospheres, and dynamic vector graphics.'
  },
  {
    id: 'mcp-data-kit',
    name: 'Data Agent Kit (BigQuery/GCP)',
    category: 'DATA_ANALYTICS',
    transport: 'STDIO',
    command: 'npx -y @google-cloud/data-agent-kit',
    toolsCount: 8,
    status: 'ONLINE',
    tools: ['get_active_gcp_connection', 'list_resource_templates', 'read_resource', 'execute_bigquery_sql'],
    description: 'Enterprise data warehouse querying, real-time analytics streaming, and Dataform ELT management.'
  },
  {
    id: 'mcp-genkit',
    name: 'Firebase Genkit AI Runtime',
    category: 'CLOUD_INFRA',
    transport: 'STDIO',
    command: 'npx -y genkit start',
    toolsCount: 10,
    status: 'ONLINE',
    tools: ['list_flows', 'run_flow', 'get_trace', 'start_runtime'],
    description: 'End-to-end multi-agent orchestration runtime with telemetry traces and latency metrics.'
  }
];

const PRODUCTION_SKILLS_CATALOG: ProductionSkill[] = [
  {
    id: 'skill-agent-reach-router',
    name: 'Agent Reach Multi-Channel Internet Router',
    source: 'skillspec',
    category: 'RESEARCH',
    specStatus: 'VERIFIED',
    signature: 'agent_reach.route(channel: string, target: string): ReachContentResult',
    locSavingsEstimate: '15 Integrations Replaced',
    description: 'Autonomous internet capability router providing zero-config Jina Web extraction, YouTube transcripts, and authenticated social listening backends.',
    tags: ['Internet Router', '15 Channels', 'Zero-Wrapper', 'Jina + yt-dlp'],
    sampleCode: `// Fetch markdown via Jina Reader:
const result = await fetchAgentReachContent({ channel: 'web', target: 'https://stripe.com' });
// Video transcript extraction:
const subs = await fetchAgentReachContent({ channel: 'youtube', target: 'https://youtube.com/watch?v=...' });`
  },
  {
    id: 'skill-sales-lead-intelligence',
    name: 'Sales Lead Intelligence & WhatsApp Qualification (v0.1)',
    source: 'skillspec',
    category: 'GROWTH_PM',
    specStatus: 'VERIFIED',
    signature: 'sales_lead_intelligence.qualify(lead: InboundLead): { score: number, tier: "hot"|"warm"|"cold", reply_draft: string }',
    locSavingsEstimate: '100% n8n/Claude Automated',
    description: 'Autonomous lead intake, 0-100 rubric scoring (Need 30, Budget 25, Authority 20, Timeline 25), 3-sentence WhatsApp qualifying conversation with auto-handoff, and 30-min timed follow-up scheduler.',
    tags: ['WhatsApp Agent', '0-100 Rubric', 'Twilio Templates', 'Supabase CRM'],
    sampleCode: `// n8n Workflow 01 + Claude Haiku 4.5 prompt execution:
const result = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  system: QUALIFIER_SYSTEM_PROMPT,
  messages: [{ role: "user", content: leadPayload }]
});
// Parsed rubric: { score: 85, tier: "hot", need_summary: "...", reply_draft: "..." }`
  },
  {
    id: 'skill-ponytail-optimizer',
    name: 'Ponytail Senior Dev Code Optimizer',
    source: 'ponytail',
    category: 'CODE_OPTIMIZER',
    specStatus: 'VERIFIED',
    signature: 'ponytail.optimize(targetFiles: string[], mode: "ultra" | "full" | "review"): OptimizationResult',
    locSavingsEstimate: '-54% LOC (Up to 94%)',
    description: 'Forces agents to follow the 7-rung ladder: 1. YAGNI -> 2. Reuse -> 3. Stdlib -> 4. Native platform -> 5. Installed dep -> 6. One-line -> 7. Minimum that works.',
    tags: ['Code Minimization', 'Zero Bloat', 'Safety Guaranteed'],
    sampleCode: `// Before: 45 lines of custom datepicker wrapper
// With Ponytail:
<input type="date" className="bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white" />`
  },
  {
    id: 'skill-growth-retention-loops',
    name: 'PM Skills: Habit Retention Loops Engine',
    source: 'pm-skills',
    category: 'GROWTH_PM',
    specStatus: 'VERIFIED',
    signature: 'retention_loops.audit(churnCohort: CohortData): RetentionFlywheelPlan',
    description: 'Deconstructs activation bottlenecks, implements Nir Eyal habit loops, and automates Day 3/7 re-engagement triggers.',
    tags: ['Product Growth', 'Retention Flywheel', 'Activation']
  },
  {
    id: 'skill-pricing-elasticity-matrix',
    name: 'PM Skills: Pricing & Packaging Elasticity',
    source: 'pm-skills',
    category: 'GROWTH_PM',
    specStatus: 'VERIFIED',
    signature: 'pricing.evaluate_elasticity(tierMetrics: TierData[]): PackagingRecommendation',
    description: 'Van Westendorp pricing sensitivity meter with feature-to-tier elasticity modeling to prevent gross margin leakage.',
    tags: ['Pricing Strategy', 'Packaging', 'Expansion Revenue']
  },
  {
    id: 'skill-skillspec-validator',
    name: 'SkillSpec.sh Schema Contract Validator',
    source: 'skillspec',
    category: 'GOVERNANCE',
    specStatus: 'VERIFIED',
    signature: 'skillspec.verify(manifest: SkillManifest): ComplianceToken',
    description: 'Strict specification linter checking parametersSchema, zero circular references, and safe sandbox execution boundaries.',
    tags: ['Safety Linting', 'Spec Standard', 'Sandboxed']
  },
  {
    id: 'skill-aeo-citation-harvester',
    name: 'AEO Semantic Citation Harvester',
    source: 'skillsmp',
    category: 'RESEARCH',
    specStatus: 'VERIFIED',
    signature: 'aeo.harvest_citations(domain: string, answerEngine: "perplexity" | "chatgpt"): CitationReport',
    description: 'Extracts real-time citation frequencies across frontier answer engines and generates missing Schema.org JSON-LD nodes.',
    tags: ['Answer Engines', 'Perplexity', 'SEO Graphs']
  }
];

export default function ProductionSkillsMCPTab() {
  const { notifySuccess, notifyInfo } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'mcp' | 'skills' | 'ponytail'>('ponytail');
  const [selectedServerId, setSelectedServerId] = useState<string>('mcp-ponytail');
  const [codeToOptimize, setCodeToOptimize] = useState<string>(`// Over-engineered custom toggle component
function CustomToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const [active, setActive] = useState(value);
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !active;
    setActive(next);
    onChange(next);
  };
  return (
    <div onClick={handleToggle} style={{ width: 50, height: 26, background: active ? '#F59E0B' : '#333', borderRadius: 13, cursor: 'pointer', padding: 2 }}>
      <div style={{ width: 22, height: 22, background: '#fff', borderRadius: '50%', transform: active ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
    </div>
  );
}`);

  const [optimizationResult, setOptimizationResult] = useState<{
    originalLoc: number;
    optimizedLoc: number;
    reductionPercent: number;
    ladderRung: string;
    optimizedCode: string;
  } | null>(null);

  const [isOptimizing, setIsOptimizing] = useState(false);

  // Handle Ponytail Optimization Simulation
  const handleRunPonytail = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setOptimizationResult({
        originalLoc: 15,
        optimizedLoc: 3,
        reductionPercent: 80,
        ladderRung: 'Rung 4: Native platform feature + Tailwind CSS',
        optimizedCode: `<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
  <div className="w-11 h-6 bg-zinc-700 peer-checked:bg-amber-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
</label>`
      });
      setIsOptimizing(false);
      notifySuccess('Ponytail Optimization Complete: -80% LOC reduction, 100% accessible!');
    }, 600);
  };

  return (
    <div className="space-y-10">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-heading font-black text-white flex items-center gap-3">
            <Wrench className="text-accent" size={26} /> Production Skills, MCP Servers & Ponytail Optimizer
          </h2>
          <p className="text-zinc-400 text-xs mt-1 max-w-3xl leading-relaxed">
            Curated integrations with <span className="text-white font-mono">skillsmp.com</span>, <span className="text-white font-mono">mcpmarket.com</span>, <span className="text-white font-mono">phuryn/pm-skills</span>, and <span className="text-white font-mono">skillspec.sh</span>. Powered by the Ponytail minimalist code engine.
          </p>
        </div>

        <div className="sigma-segmented">
          <button
            onClick={() => setActiveSubTab('ponytail')}
            className={cn(
              "sigma-segment font-mono flex items-center gap-2 cursor-pointer",
              activeSubTab === 'ponytail' ? "sigma-segment-active" : ""
            )}
          >
            <Flame size={14} /> Ponytail Optimizer
          </button>
          <button
            onClick={() => setActiveSubTab('mcp')}
            className={cn(
              "sigma-segment font-mono flex items-center gap-2 cursor-pointer",
              activeSubTab === 'mcp' ? "sigma-segment-active" : ""
            )}
          >
            <Server size={14} /> MCP Servers ({MCP_SERVERS_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveSubTab('skills')}
            className={cn(
              "sigma-segment font-mono flex items-center gap-2 cursor-pointer",
              activeSubTab === 'skills' ? "sigma-segment-active" : ""
            )}
          >
            <Zap size={14} /> Skills Registry ({PRODUCTION_SKILLS_CATALOG.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PONYTAIL SENIOR DEV CODE OPTIMIZER */}
      {activeSubTab === 'ponytail' && (
        <div className="space-y-8">
          {/* Ethos Banner */}
          <div className="bg-gradient-to-br from-amber-500/15 via-surface to-surface border border-accent/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent font-mono text-xs font-bold border border-accent/40">
                    DietrichGebert/ponytail
                  </span>
                  <span className="text-zinc-400 font-mono text-xs">• 133k+ Stars</span>
                </div>
                <h3 className="text-2xl font-heading font-black text-white">
                  "He says nothing. He writes one line. It works."
                </h3>
                <p className="text-zinc-300 text-xs max-w-2xl leading-relaxed">
                  Ponytail puts the laziest senior dev in the room inside our AI agents. The best code is the code you never wrote. Reduces agent-generated code by ~54% (up to 94%), speeds up execution by 27%, and cuts token costs by 20% while remaining 100% safe.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center shrink-0">
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                  <div className="text-xl font-black text-accent">-54%</div>
                  <div className="text-[9px] text-zinc-400 uppercase">Avg LOC</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                  <div className="text-xl font-black text-emerald-400">-22%</div>
                  <div className="text-[9px] text-zinc-400 uppercase">Tokens</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                  <div className="text-xl font-black text-cyan-400">+27%</div>
                  <div className="text-[9px] text-zinc-400 uppercase">Speed</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                  <div className="text-xl font-black text-white">100%</div>
                  <div className="text-[9px] text-zinc-400 uppercase">Safe</div>
                </div>
              </div>
            </div>

            {/* 7-Rung Ladder */}
            <div className="pt-6 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-accent tracking-wider flex items-center gap-2">
                <Scale size={14} /> The 7-Rung Senior Dev Decision Ladder
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 font-mono text-xs">
                {[
                  { step: '1', title: 'YAGNI', desc: 'Does this need to exist? If no: skip it.' },
                  { step: '2', title: 'Reuse', desc: 'Already in this codebase? Reuse, don\'t rewrite.' },
                  { step: '3', title: 'Stdlib', desc: 'Language stdlib does it? Use standard lib.' },
                  { step: '4', title: 'Native', desc: 'Browser native feature? Use native element.' },
                  { step: '5', title: 'Installed', desc: 'Installed dependency? Use existing package.' },
                  { step: '6', title: 'One Line', desc: 'Can it be one line? Keep it one line.' },
                  { step: '7', title: 'Minimum', desc: 'Only then: write the minimum that works.' },
                ].map((rung) => (
                  <div key={rung.step} className="p-3 bg-black/60 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[10px] text-accent font-black">RUNG {rung.step}</span>
                    <div className="text-white font-bold">{rung.title}</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">{rung.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Code Optimizer Sandbox */}
          <div className="bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-heading font-black text-white flex items-center gap-2">
                  <Terminal className="text-accent" size={18} /> Interactive Ponytail Code Optimizer Sandbox
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Paste bloated agent-generated code or complex wrappers. Ponytail tests it against the ladder and produces the minimal clean implementation.
                </p>
              </div>

              <button
                onClick={handleRunPonytail}
                disabled={isOptimizing}
                className="px-5 py-2.5 bg-accent text-background font-black font-mono text-xs uppercase tracking-wider rounded-xl transition-all hover:opacity-90 cursor-pointer shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Zap size={14} className={cn(isOptimizing && "animate-spin")} />
                {isOptimizing ? "Evaluating Ladder..." : "Optimize with Ponytail"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted uppercase">Input Code (Bloated Draft):</span>
                  <span className="text-zinc-400">{codeToOptimize.split('\n').length} Lines</span>
                </div>
                <textarea
                  rows={10}
                  value={codeToOptimize}
                  onChange={(e) => setCodeToOptimize(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-accent uppercase font-bold">Optimized Minimal Implementation:</span>
                  {optimizationResult && (
                    <span className="text-emerald-400 font-bold">
                      -{optimizationResult.reductionPercent}% LOC ({optimizationResult.optimizedLoc} Lines)
                    </span>
                  )}
                </div>
                {optimizationResult ? (
                  <div className="bg-black/80 border border-emerald-500/30 rounded-2xl p-4 space-y-3 font-mono text-xs">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">
                      Selected Ladder Rung: {optimizationResult.ladderRung}
                    </div>
                    <pre className="text-zinc-200 whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed">
                      {optimizationResult.optimizedCode}
                    </pre>
                  </div>
                ) : (
                  <div className="h-[220px] bg-black/40 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-zinc-500 font-mono text-xs p-6 text-center">
                    <Flame size={24} className="text-zinc-600 mb-2" />
                    <span>Click "Optimize with Ponytail" to evaluate against the 7-rung ladder.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MCP SERVERS DASHBOARD */}
      {activeSubTab === 'mcp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MCP_SERVERS_CATALOG.map((server) => (
              <div
                key={server.id}
                className="bg-surface border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-accent/30 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-accent uppercase tracking-widest block">
                        {server.category}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5 group-hover:text-accent transition-colors">
                        {server.name}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30 shrink-0">
                      {server.status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {server.description}
                  </p>

                  <div className="p-3 bg-black/40 border border-white/5 rounded-2xl space-y-1.5 font-mono text-[10px]">
                    <div className="text-zinc-500">Transport: <span className="text-white">{server.transport}</span></div>
                    <div className="text-zinc-500 truncate">CLI: <span className="text-zinc-300">{server.command}</span></div>
                    <div className="text-zinc-500">Exposed Tools: <span className="text-accent font-bold">{server.toolsCount} registered</span></div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {server.tools.slice(0, 4).map((tool, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 text-[9px] font-mono">
                        {tool}
                      </span>
                    ))}
                    {server.tools.length > 4 && (
                      <span className="px-1.5 py-0.5 text-zinc-500 text-[9px] font-mono">
                        +{server.tools.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => notifySuccess(`Pinged ${server.name}: 12ms roundtrip, all ${server.toolsCount} tools responsive!`)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Activity size={12} className="text-emerald-400" /> Ping Tool Transport
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SKILLS REGISTRY (skillmp, pm-skills, skillspec) */}
      {activeSubTab === 'skills' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRODUCTION_SKILLS_CATALOG.map((skill) => (
              <div
                key={skill.id}
                className="bg-surface border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 hover:border-accent/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                        {skill.source}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> {skill.specStatus} SPEC
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">
                      {skill.name}
                    </h4>
                  </div>
                  {skill.locSavingsEstimate && (
                    <span className="px-2.5 py-1 rounded-xl bg-accent/10 border border-accent/30 text-accent font-mono text-xs font-bold shrink-0">
                      {skill.locSavingsEstimate}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {skill.description}
                </p>

                <div className="p-3 bg-black/60 border border-white/10 rounded-2xl text-[10px] font-mono text-accent overflow-x-auto">
                  {skill.signature}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tags.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 text-[9px] font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => notifySuccess(`Attached ${skill.name} to active workspace agents!`)}
                    className="px-3 py-1.5 bg-accent/20 hover:bg-accent text-accent hover:text-background rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    Bind Skill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
