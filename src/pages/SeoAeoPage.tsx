import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  Bot, 
  CheckCircle2, 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Play, 
  RefreshCw,
  BarChart3,
  Code2,
  FileText,
  AlertCircle,
  Download,
  Database,
  Link2,
  X,
  Building,
  Briefcase,
  HelpCircle,
  BookOpen,
  ShoppingBag,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { 
  SEED_KEYWORD_CLUSTERS, 
  SEED_AEO_BENCHMARKS, 
  KeywordCluster, 
  AeoCitationBenchmark 
} from '@/src/data/marketingModulesData';
import SearchConsoleTrends from '@/src/components/SearchConsoleTrends';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

export type SchemaType = 'FAQ' | 'ORGANIZATION' | 'TECH_ARTICLE' | 'PRODUCT' | 'LOCAL_BUSINESS' | 'HOW_TO';

export const SCHEMA_DEFINITIONS: Record<SchemaType, {
  name: string;
  badge: string;
  description: string;
  citationLift: string;
  schemaData: any;
}> = {
  FAQ: {
    name: 'FAQPage Schema (AI Citation Priority)',
    badge: 'High AI Citation Lift',
    description: 'Structured Q&A entities extracted directly by Perplexity, ChatGPT Search, and Google AI Overviews.',
    citationLift: '+74% Answer Inclusion Probability',
    schemaData: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is an AI-Native Growth OS?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "An AI-Native Growth OS installs a sovereign Second Brain and autonomous multi-agent execution pipeline directly inside a company's cloud infrastructure, replacing manual retainers with 24/7 telemetry-governed execution."
          }
        },
        {
          "@type": "Question",
          "name": "How does Generative Engine Optimization (AEO/GEO) differ from traditional SEO?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Traditional SEO optimizes for keyword rank positions on search engine result pages. Generative Engine Optimization (AEO/GEO) structures authoritative semantic entities, technical schemas, and primary source citations so LLMs (ChatGPT, Claude, Perplexity, Gemini) synthesize your brand as the canonical answer."
          }
        },
        {
          "@type": "Question",
          "name": "How does Sigma Tactix prevent AI hallucination in marketing workflows?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sigma Tactix enforces deterministic grounding via 10 partitioned Second Brain Vaults, zero-drift brand voice vectors, and human-in-the-loop (HITL) approval gates for financial spend or public publication."
          }
        }
      ]
    }
  },
  ORGANIZATION: {
    name: 'Organization & Knowledge Graph Entity',
    badge: 'Entity Authority',
    description: 'Establishes unambiguous brand authority in Google Knowledge Graph and commercial AI entity databases.',
    citationLift: '+82% Knowledge Graph Inclusion',
    schemaData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://sigma-tactix.com/#organization",
      "name": "Sigma Tactix",
      "legalName": "Sigma Tactix Growth OS Technologies Inc.",
      "url": "https://sigma-tactix.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://sigma-tactix.com/assets/sigmatactix-logo.png",
        "caption": "Sigma Tactix Corporate Logo"
      },
      "description": "Enterprise AI-Native Growth Operating System delivering autonomous marketing intelligence, Second Brain vault infrastructure, and multi-agent demand generation.",
      "foundingDate": "2024-01-15",
      "sameAs": [
        "https://www.linkedin.com/company/sigmatactix",
        "https://x.com/sigmatactix",
        "https://github.com/sigmatactix",
        "https://www.crunchbase.com/organization/sigma-tactix"
      ],
      "knowsAbout": [
        "Autonomous AI Marketing",
        "Generative Engine Optimization",
        "Role-Based Access Control Vaults",
        "Paid Ad Infrastructure",
        "Enterprise Attribution Telemetry"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Enterprise Sales & Technical Ingest",
        "email": "enterprise@sigma-tactix.com",
        "availableLanguage": ["English", "Arabic", "German"]
      }
    }
  },
  TECH_ARTICLE: {
    name: 'TechArticle & Engineering Teardown',
    badge: 'Deep Technical Authority',
    description: 'Signals verifiable engineering depth, empirical benchmarks, and system architecture to AI model crawlers.',
    citationLift: '+91% Research Citation Rate',
    schemaData: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": "Engineering an Autonomous Growth OS: Multi-Agent Coordination and Second Brain Architecture",
      "description": "An empirical analysis of deploying multi-agent swarms with pgvector 1536-dimensional embeddings for zero-drift enterprise marketing.",
      "inLanguage": "en-US",
      "datePublished": "2026-03-01T08:00:00Z",
      "dateModified": "2026-09-12T12:00:00Z",
      "author": {
        "@type": "Person",
        "name": "Principal AI Systems Architect",
        "jobTitle": "Head of Agent Systems",
        "worksFor": {
          "@type": "Organization",
          "name": "Sigma Tactix"
        }
      },
      "publisher": {
        "@type": "Organization",
        "name": "Sigma Tactix",
        "logo": {
          "@type": "ImageObject",
          "url": "https://sigma-tactix.com/assets/sigmatactix-logo.png"
        }
      },
      "dependencies": "PostgreSQL 16, pgvector, AES-256-GCM Vaults, Gemini API, Claude API",
      "proficiencyLevel": "Expert"
    }
  },
  PRODUCT: {
    name: 'SoftwareApplication / Product Schema',
    badge: 'Commercial Intent',
    description: 'Structured software pricing, feature matrix, and capability schema for buyers comparing solutions in AI.',
    citationLift: '+68% Product Comparison Lift',
    schemaData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Sigma Tactix Growth OS",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Cloud-native (AWS, GCP, Azure, Self-hosted)",
      "offers": [
        {
          "@type": "Offer",
          "name": "Growth Tier",
          "price": "4900",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "description": "5 Autonomous Agents, 10 Second Brain Vaults, GSC & Paid Ad telemetry pipeline."
        },
        {
          "@type": "Offer",
          "name": "Enterprise Sovereign",
          "price": "14500",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "description": "Dedicated single-tenant cloud deployment, custom model fine-tuning, unlimited agent allocation."
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "84",
        "bestRating": "5"
      }
    }
  },
  LOCAL_BUSINESS: {
    name: 'ProfessionalService / Regional Hub',
    badge: 'Geotargeted Authority',
    description: 'Geocoded regional headquarters entity schema for localized search and enterprise regional buyers.',
    citationLift: '+58% Local Pack & Regional Query Lift',
    schemaData: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Sigma Tactix Regional Hub",
      "image": "https://sigma-tactix.com/assets/office.png",
      "@id": "https://sigma-tactix.com/#regional-office",
      "url": "https://sigma-tactix.com",
      "telephone": "+971-4-800-TACTIX",
      "priceRange": "$$$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Sheikh Zayed Road, DIFC Gate Tower 4",
        "addressLocality": "Dubai",
        "postalCode": "00000",
        "addressCountry": "AE"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 25.2048,
        "longitude": 55.2708
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    }
  },
  HOW_TO: {
    name: 'HowTo Implementation Guide',
    badge: 'Actionable Snippet',
    description: 'Step-by-step technical implementation guide schema recognized by search engines and synthesized in answers.',
    citationLift: '+79% Step-by-Step Snippet Win Rate',
    schemaData: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Deploy an Autonomous Marketing Swarm with Second Brain Grounding",
      "description": "A 4-step guide to installing a Second Brain vault, connecting marketing pipelines, and activating autonomous agents.",
      "totalTime": "PT45M",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Initialize Second Brain Vaults",
          "text": "Partition knowledge into 10 relational vaults with 1,536-dimensional embeddings and RBAC clearance."
        },
        {
          "@type": "HowToStep",
          "name": "Connect Data Pipelines",
          "text": "Link Google Search Console, Google Ads, and Meta Ads through OAuth connectors to stream live figures."
        },
        {
          "@type": "HowToStep",
          "name": "Configure Agent Governance",
          "text": "Set strict Human-in-the-Loop budget caps and brand voice vectors."
        },
        {
          "@type": "HowToStep",
          "name": "Activate Autonomous Execution",
          "text": "Deploy Aurora-01 and media buyer agents to autonomously monitor and optimize growth channels."
        }
      ]
    }
  }
};

export default function SeoAeoPage() {
  const navigate = useNavigate();
  const { notifySuccess, notifyInfo } = useToast();
  const [clusters, setClusters] = useState<KeywordCluster[]>(SEED_KEYWORD_CLUSTERS);
  const [aeoBenchmarks, setAeoBenchmarks] = useState<AeoCitationBenchmark[]>(SEED_AEO_BENCHMARKS);
  const [selectedCluster, setSelectedCluster] = useState<KeywordCluster>(SEED_KEYWORD_CLUSTERS[0]);
  const [activeTab, setActiveTab] = useState<'CLUSTERS' | 'SEARCH_CONSOLE' | 'AEO_SIMULATOR' | 'SCHEMA_ARCHITECT' | 'AGENTS'>('SEARCH_CONSOLE');
  
  // AEO Live Query Test State
  const [testQuery, setTestQuery] = useState('What is the best AI-native growth infrastructure for enterprise B2B?');
  const [isTestingAeo, setIsTestingAeo] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [selectedSchemaType, setSelectedSchemaType] = useState<SchemaType>('FAQ');

  // GSC Connection Modal State
  const [isGscModalOpen, setIsGscModalOpen] = useState(false);
  const [gscPropertyUrl, setGscPropertyUrl] = useState('https://sigmatactix.com');
  const [isGscConnected, setIsGscConnected] = useState(true);
  const [isConnectingGsc, setIsConnectingGsc] = useState(false);

  // Agent trigger state
  const [isDeployingAgent, setIsDeployingAgent] = useState(false);

  // Agent Run Records
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-seo-01',
      agentName: 'Aurora-01 Authority Agent',
      agentRole: 'Topical Graph & Schema Enforcer',
      timestamp: 'Today at 04:00 AM',
      status: 'SUCCESS',
      moduleOrigin: 'SEO & AEO Authority',
      inputSummary: 'Target Entity: AI-Native Growth OS (Pillar 1)',
      outputSummary: 'Generated JSON-LD TechArticle schema and verified citation indexing in Perplexity and Claude.',
      fullOutput: 'Indexed 4 spoke nodes. Citation rate increased to 83.4%. Verified against Google Search Console sitemap.',
      metrics: [
        { label: 'AEO Citation Rate', value: '83.4%' },
        { label: 'Schema Health', value: '98.5%' },
        { label: 'Organic Clicks', value: '+24.8%' },
        { label: 'Indexed Pages', value: '142' }
      ]
    }
  ]);

  const handleRunAeoTest = () => {
    setIsTestingAeo(true);
    setTimeout(() => {
      setIsTestingAeo(false);
      setAeoBenchmarks(prev => prev.map(b => ({
        ...b,
        brandCitationRate: Math.min(100, b.brandCitationRate + Math.floor(Math.random() * 4)),
        lastTested: 'Just now'
      })));
      notifySuccess(
        'AEO Citation Audit Complete',
        'Queried ChatGPT Search, Perplexity AI, Claude 3.7, and Google Gemini. Brand cited in 88% of generated answers.'
      );
    }, 1800);
  };

  const handleDeployAuthorityAgent = () => {
    setIsDeployingAgent(true);
    setTimeout(() => {
      setIsDeployingAgent(false);
      notifySuccess(
        'Aurora-01 Authority Agent Dispatched',
        'Constructed 4 new spoke articles and committed JSON-LD semantic entities to Second Brain Authority Vault.'
      );
    }, 1500);
  };

  const activeSchemaObj = SCHEMA_DEFINITIONS[selectedSchemaType]?.schemaData || SCHEMA_DEFINITIONS.FAQ.schemaData;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(activeSchemaObj, null, 2));
    setCopiedSchema(true);
    notifyInfo('Schema Copied', 'JSON-LD copied to clipboard. Ready to inject into your CMS or Next.js <head>.');
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleDownloadSchema = () => {
    const blob = new Blob([JSON.stringify(activeSchemaObj, null, 2)], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSchemaType.toLowerCase()}-schema.jsonld`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notifySuccess('Schema Downloaded', `Exported ${selectedSchemaType.toLowerCase()}-schema.jsonld successfully.`);
  };

  const handleCommitToAuthorityVault = () => {
    notifySuccess(
      'Committed to Authority Vault',
      `Saved ${SCHEMA_DEFINITIONS[selectedSchemaType].name} to Second Brain Authority Vault with 1,536-dim vector indexing.`,
      { category: 'SYSTEM' }
    );
  };

  const handleConnectGsc = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingGsc(true);
    setTimeout(() => {
      setIsConnectingGsc(false);
      setIsGscConnected(true);
      setIsGscModalOpen(false);
      notifySuccess(
        'Google Search Console Linked',
        `Successfully authenticated & verified property ${gscPropertyUrl}. Search query & impression telemetry is live.`,
        { category: 'SYNC' }
      );
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-mono tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full font-bold">
              INTELLIGENCE LAYER
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-xs font-mono text-zinc-400">AURORA-01 SWARM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Search className="w-7 h-7 text-amber-400" />
            SEO & AEO Intelligence
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Dominate traditional search engine rankings and Generative Engine Optimization (GEO) citations across ChatGPT, Perplexity, Claude, and Google AI Overviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGscModalOpen(true)}
            className={cn(
              "px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border shadow-sm",
              isGscConnected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700/80"
            )}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            {isGscConnected ? 'GSC Linked' : 'Connect GSC'}
          </button>

          <button
            onClick={handleRunAeoTest}
            disabled={isTestingAeo}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", isTestingAeo && "animate-spin")} />
            {isTestingAeo ? 'Auditing AI Engines...' : 'Run Live AEO Audit'}
          </button>

          <button
            data-tutorial-id="tut-seo-deploy-agent"
            onClick={handleDeployAuthorityAgent}
            disabled={isDeployingAgent}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            {isDeployingAgent ? 'Deploying Swarm...' : 'Deploy Authority Agent'}
          </button>
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Blended AEO Citation Rate</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            83.4%
            <span className="text-xs font-mono text-emerald-400 font-normal">+18.2% vs last mo</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Cited in 4 of 5 major LLMs</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Tracked Keyword Clusters</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            3 Pillars / 11 Spokes
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Total search volume: 39.2k/mo</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Top Citation Engine</div>
          <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            Perplexity AI
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Rank #1.4 average position</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Structured Schema Health</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            98.5%
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">JSON-LD valid & indexed</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('SEARCH_CONSOLE')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'SEARCH_CONSOLE'
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Google Search Console Trends
        </button>

        <button
          onClick={() => setActiveTab('CLUSTERS')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'CLUSTERS'
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Topical Clusters & Search Intent
        </button>

        <button
          onClick={() => setActiveTab('AEO_SIMULATOR')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'AEO_SIMULATOR'
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AEO Citation Index (ChatGPT / Perplexity / Claude)
        </button>

        <button
          onClick={() => setActiveTab('SCHEMA_ARCHITECT')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'SCHEMA_ARCHITECT'
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <Code2 className="w-3.5 h-3.5" />
          Semantic Schema Architect (JSON-LD)
        </button>

        <button
          onClick={() => setActiveTab('AGENTS')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'AGENTS'
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          Autonomous SEO Agents & Sub-Agents
        </button>
      </div>

      {/* TAB 1: KEYWORD CLUSTERS */}
      {activeTab === 'CLUSTERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pillar List */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider px-1">
              Topical Pillar Clusters ({clusters.length})
            </div>

            {clusters.map(cluster => (
              <div
                key={cluster.id}
                onClick={() => setSelectedCluster(cluster)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer text-left",
                  selectedCluster.id === cluster.id
                    ? "bg-amber-500/10 border-amber-500/40 text-white shadow-lg shadow-amber-500/5"
                    : "bg-zinc-900/30 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/40"
                )}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-amber-400 font-semibold">
                    {cluster.intent}
                  </span>
                  <span className="text-zinc-400">Vol: {cluster.monthlyVolume.toLocaleString()}/mo</span>
                </div>
                <h4 className="font-semibold text-sm leading-snug">{cluster.pillar}</h4>
                
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60 font-mono">
                  <span>KD: <strong className="text-zinc-200">{cluster.difficulty}%</strong></span>
                  <span>CPC: <strong className="text-emerald-400">${cluster.cpc.toFixed(2)}</strong></span>
                  <span>AEO: <strong className="text-amber-400">{cluster.aeoCitationScore}%</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Spokes Deep Dive */}
          <div className="lg:col-span-2 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase font-semibold">Cluster Breakdown</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedCluster.pillar}</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Pillar authority structure driving topical entities directly into the Second Brain Authority Vault.
                </p>
              </div>

              <button
                onClick={handleDeployAuthorityAgent}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                Generate Spokes
              </button>
            </div>

            {/* SERP Features in this cluster */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/60">
              <span className="text-xs text-zinc-400 self-center">Captured SERP Features:</span>
              {selectedCluster.serpFeatures.map((feature, i) => (
                <span key={i} className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-[11px] rounded-md font-mono">
                  {feature}
                </span>
              ))}
            </div>

            {/* Supporting Spokes Table */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Supporting Spoke Keywords & AEO Visibility ({selectedCluster.spokes.length})
              </div>

              <div className="space-y-2">
                {selectedCluster.spokes.map((spoke, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{spoke.keyword}</span>
                        <span className="px-1.5 py-0.2 bg-zinc-800 text-[10px] text-zinc-400 rounded font-mono">
                          {spoke.intent}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500">
                        Target Slug: <span className="text-amber-400/80">{spoke.urlSlug}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-zinc-400 font-mono self-end sm:self-center">
                      <div>Vol: <strong className="text-zinc-200">{spoke.volume.toLocaleString()}</strong></div>
                      <div className="px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded text-[11px] font-semibold">
                        {spoke.aiEngineVisibility}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AEO SIMULATOR */}
      {activeTab === 'AEO_SIMULATOR' && (
        <div className="space-y-6">
          {/* Query Testing Box */}
          <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-400" />
                  Live Generative Engine Citation Tester
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Test whether AI models cite your domain, case studies, and positioning when buyers ask high-intent questions.
                </p>
              </div>

              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-lg">
                Active Corpus: 182 Query Vectors
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  placeholder="Enter buyer search question (e.g., best AI marketing OS for UAE companies)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <button
                onClick={handleRunAeoTest}
                disabled={isTestingAeo}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-md disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isTestingAeo && "animate-spin")} />
                {isTestingAeo ? 'Simulating...' : 'Test AI Visibility'}
              </button>
            </div>
          </div>

          {/* AI Engine Benchmark Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aeoBenchmarks.map((bench, i) => (
              <div key={i} className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {bench.engine}
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold",
                    bench.status === 'OPTIMAL' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}>
                    {bench.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60 font-mono">
                  <div>
                    <div className="text-[10px] text-zinc-500">Citation Rate</div>
                    <div className="text-xl font-bold text-white">{bench.brandCitationRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Avg Citation Rank</div>
                    <div className="text-xl font-bold text-amber-400">#{bench.rankPosition}</div>
                  </div>
                </div>

                <div className="space-y-1 text-xs pt-2 border-t border-zinc-800/60">
                  <div className="text-zinc-500 text-[11px] font-mono">Top Cited Source:</div>
                  <div className="text-zinc-300 font-mono text-[11px] truncate bg-black/40 p-1.5 rounded border border-zinc-800/60">
                    {bench.primarySourceCited}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between pt-1">
                  <span>Sentiment: <strong className="text-emerald-400">{bench.sentimentScore}% Positive</strong></span>
                  <span>Tested: {bench.lastTested}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA ARCHITECT */}
      {activeTab === 'SCHEMA_ARCHITECT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Semantic Schemas ({Object.keys(SCHEMA_DEFINITIONS).length})
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono">
                AEO Optimized
              </span>
            </div>

            <div className="space-y-2">
              {Object.entries(SCHEMA_DEFINITIONS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSchemaType(key as any)}
                  className={cn(
                    "w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                    selectedSchemaType === key
                      ? "bg-amber-400/10 border-amber-400/40 text-white shadow-md shadow-amber-500/5"
                      : "bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-white">{item.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700/60 whitespace-nowrap">
                      {item.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {item.citationLift}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2 text-xs">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Why Structured Schema Matters for AEO
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Generative AI agents parse raw HTML with high computational cost. Providing pre-digested JSON-LD schemas gives crawler bots immediate entity certainty, boosting answer citation probabilities by over +62%.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-sm">{SCHEMA_DEFINITIONS[selectedSchemaType]?.name}</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded font-mono">
                  Valid Schema.org
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCommitToAuthorityVault}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-400/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Store in Second Brain Authority Vault for LLM agents to reference"
                >
                  <Database className="w-3.5 h-3.5" />
                  Save to Vault
                </button>

                <button
                  onClick={handleDownloadSchema}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  .jsonld
                </button>

                <button
                  onClick={handleCopySchema}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSchema ? 'Copied' : 'Copy JSON-LD'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
              <span>Target: &lt;script type="application/ld+json"&gt;</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Syntax Verified (0 errors)
              </span>
            </div>

            <pre className="p-4 bg-black/80 border border-zinc-800 rounded-xl text-[12px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[480px]">
              {JSON.stringify(activeSchemaObj, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: AUTONOMOUS AGENTS */}
      {activeTab === 'AGENTS' && (
        <div className="space-y-4">
          <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Aurora-01 (Authority Builder Agent)</h3>
                  <p className="text-xs text-zinc-400 font-mono">Codename: AURORA-01 • Autonomous Clearance: Restricted HITL</p>
                </div>
              </div>

              <button
                onClick={handleDeployAuthorityAgent}
                disabled={isDeployingAgent}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isDeployingAgent ? 'Executing...' : 'Trigger Full SEO Run'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs space-y-1">
                <div className="font-bold text-white">Sub-Agent 1: AURORA-SUB-1</div>
                <div className="text-zinc-400 text-[11px]">SERP Topic Extractor & Entity Mapper</div>
                <div className="text-emerald-400 font-mono text-[10px]">Status: IDLE (78 tasks completed)</div>
              </div>

              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs space-y-1">
                <div className="font-bold text-white">Sub-Agent 2: AURORA-SUB-2</div>
                <div className="text-zinc-400 text-[11px]">LLM Visibility & Citation Auditor</div>
                <div className="text-emerald-400 font-mono text-[10px]">Status: IDLE (42 tasks completed)</div>
              </div>

              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs space-y-1">
                <div className="font-bold text-white">Sub-Agent 3: AURORA-SUB-3</div>
                <div className="text-zinc-400 text-[11px]">Backlink Quality & Entity Hunter</div>
                <div className="text-emerald-400 font-mono text-[10px]">Status: IDLE (22 tasks completed)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Search Console Trends Tab */}
      {activeTab === 'SEARCH_CONSOLE' && (
        <div className="space-y-6">
          <SearchConsoleTrends />
        </div>
      )}

      {/* Real-time Agent Run Results View */}
      <div className="mt-8">
        <AgentRunResults
          records={runHistory}
          title="SEO & AEO Authority Run Results"
          description="Log of topical authority indexing runs, citation audits, and Google Search Console performance sweeps."
          onClear={() => setRunHistory([])}
        />
      </div>

      {/* Google Search Console Connection Modal */}
      <AnimatePresence>
        {isGscModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Google Search Console Connection</h3>
                    <p className="text-xs text-zinc-400">Sync impressions, clicks, keyword rankings & AEO indexing</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGscModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConnectGsc} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Verified GSC Property URL or Domain</label>
                  <input
                    type="text"
                    value={gscPropertyUrl}
                    onChange={(e) => setGscPropertyUrl(e.target.value)}
                    placeholder="sc-domain:sigmatactix.com or https://..."
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400/50"
                  />
                  <p className="text-[11px] text-zinc-500">Domain properties require DNS verification; URL prefix properties accept HTML tag or Google Analytics verification.</p>
                </div>

                <div className="p-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl space-y-2 text-xs">
                  <div className="font-medium text-zinc-200">Permissions Requested:</div>
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Read Search Analytics API (queries, clicks, CTR, position)
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Read URL Inspection API (indexing status & schema validation)
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Read Sitemaps API (crawled page telemetry)
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGscModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConnectingGsc}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {isConnectingGsc ? 'Verifying Credentials...' : 'Authenticate & Sync GSC'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
