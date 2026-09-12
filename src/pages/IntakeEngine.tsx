import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Database, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Layers, 
  AlertCircle,
  RefreshCw,
  Send,
  HelpCircle,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { SECOND_BRAIN_VAULTS } from '@/src/data/secondBrainVaults';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

interface FormState {
  companyName: string;
  websiteUrl: string;
  monthlyRevenue: string;
  primaryICP: string;
  primaryChannel: string;
  monthlyAdSpend: string;
  primaryBottleneck: string;
  brandVoiceTone: string;
  competitorDifferentiator: string;
}

export default function IntakeEngine() {
  const { currentWorkspace } = useWorkspace();
  const [formData, setFormData] = useState<FormState>({
    companyName: currentWorkspace?.name || 'Sigma Tactix Growth Corp',
    websiteUrl: currentWorkspace?.domain ? (currentWorkspace.domain.startsWith('http') ? currentWorkspace.domain : `https://${currentWorkspace.domain}`) : 'https://sigmatactix.com',
    monthlyRevenue: '$150k - $500k',
    primaryICP: currentWorkspace?.icp || 'B2B SaaS Founders & Growth Directors',
    primaryChannel: 'Google Search & Meta Ads',
    monthlyAdSpend: '$45,000/mo',
    primaryBottleneck: 'SEO gaps & high mobile conversion bounce rate',
    brandVoiceTone: currentWorkspace?.brandVault?.voiceAndTone || 'Authoritative, technical, transparent, zero fluff',
    competitorDifferentiator: currentWorkspace?.brandVault?.corePositioning || 'Proprietary client-owned Second Brain instead of agency black boxes'
  });

  useEffect(() => {
    if (currentWorkspace) {
      setFormData(prev => ({
        ...prev,
        companyName: currentWorkspace.name,
        websiteUrl: currentWorkspace.domain.startsWith('http') ? currentWorkspace.domain : `https://${currentWorkspace.domain}`,
        primaryICP: currentWorkspace.icp || prev.primaryICP,
        brandVoiceTone: currentWorkspace.brandVault?.voiceAndTone || prev.brandVoiceTone,
        competitorDifferentiator: currentWorkspace.brandVault?.corePositioning || prev.competitorDifferentiator
      }));
    }
  }, [currentWorkspace]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  // Dynamic Routing mapping preview based on form fields
  const dynamicRoutes = [
    {
      sourceField: 'Brand Voice & Differentiator',
      targetVault: 'Brand Vault (ZONE_1_BRAND)',
      actionTriggered: 'Voice vectors normalized & stored in pgvector index',
      activeModule: 'Content & Creative Engine (NEXUS-03)'
    },
    {
      sourceField: 'Primary ICP & Revenue Band',
      targetVault: 'Customer Vault (ZONE_1_CUSTOMER)',
      actionTriggered: 'Persona vector cluster synthesized & TAM mapped',
      activeModule: 'Lead Gen & Diagnostic Specialist'
    },
    {
      sourceField: 'Ad Spend & Channel Data',
      targetVault: 'Marketing Vault (ZONE_2_MARKETING)',
      actionTriggered: 'CAC baseline benchmark set to $48.20',
      activeModule: 'Performance Re-allocator (VORTEX-02)'
    },
    {
      sourceField: 'Primary Bottlenecks ("SEO gaps")',
      targetVault: 'Audit Vault (ZONE_1_AUDIT)',
      actionTriggered: 'Auto-flagged "SEO Gaps" -> Activates Authority Builder',
      activeModule: 'Authority Builder Agent (AURORA-01)'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActivePipelineStep(1);

    setTimeout(() => setActivePipelineStep(2), 800);
    setTimeout(() => setActivePipelineStep(3), 1600);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2400);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setActivePipelineStep(0);
  };

  // Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-intake-01',
      agentName: 'Intake Ingestion Swarm',
      agentRole: 'Schema Validator & Second Brain Vectorizer',
      timestamp: 'Today at 04:10 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Inbound Leads & Intake Engine',
      inputSummary: 'Ingested Sigma Tactix Company Profile & ICP parameters',
      outputSummary: 'Mapped 10 fields to Brand, Marketing, and Audit vaults. Armed AURORA-01 & VORTEX-02.',
      fullOutput: 'Schema verification passed. Generated embeddings in pgvector Second Brain namespace.',
      metrics: [
        { label: 'Fields Mapped', value: '10 / 10' },
        { label: 'Vault Status', value: 'Synced' },
        { label: 'Latency', value: '240ms' },
        { label: 'Security Level', value: 'RBAC Enforced' }
      ]
    }
  ]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="text-[10px] text-muted font-mono uppercase tracking-[0.4em] font-black mb-3 flex items-center gap-2">
            <Zap size={14} className="text-accent" /> Foundation • Automated Onboarding Engine
          </div>
          <h1 className="text-4xl lg:text-6xl font-heading font-black amber-text tracking-tighter">
            Dynamic Intake & Config
          </h1>
          <p className="text-zinc-400 text-lg max-w-3xl mt-3 leading-relaxed font-sans">
            Client onboarding questionnaire with real-time "Audit-to-Configuration" data routing. Parsed fields populate the 10 Second Brain Vaults and automatically activate corresponding execution modules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-400 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Audit Routing Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Questionnaire Form */}
        <div className="lg:col-span-7 bg-surface border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet size={20} className="text-accent" />
              <h3 className="text-lg font-bold silver-text">Client Onboarding Questionnaire</h3>
            </div>
            <span className="text-[10px] font-mono text-muted uppercase">Interactive Schema v3.2</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Primary Domain / URL</label>
                <input
                  type="text"
                  required
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Monthly Revenue Scale</label>
                <select
                  value={formData.monthlyRevenue}
                  onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="< $50k">&lt; $50k ARR</option>
                  <option value="$50k - $150k">$50k - $150k ARR</option>
                  <option value="$150k - $500k">$150k - $500k ARR (Scaling)</option>
                  <option value="$500k+">$500k+ ARR (Enterprise)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Monthly Media / Ad Spend</label>
                <input
                  type="text"
                  value={formData.monthlyAdSpend}
                  onChange={(e) => setFormData({ ...formData, monthlyAdSpend: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-muted">Target ICP (Ideal Customer Profile)</label>
              <input
                type="text"
                required
                value={formData.primaryICP}
                onChange={(e) => setFormData({ ...formData, primaryICP: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-muted">Core Competitive Differentiator</label>
              <input
                type="text"
                value={formData.competitorDifferentiator}
                onChange={(e) => setFormData({ ...formData, competitorDifferentiator: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-muted">Brand Voice & Editorial Mandates</label>
              <input
                type="text"
                value={formData.brandVoiceTone}
                onChange={(e) => setFormData({ ...formData, brandVoiceTone: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-muted">Primary Digital Growth Bottleneck</label>
              <textarea
                rows={2}
                value={formData.primaryBottleneck}
                onChange={(e) => setFormData({ ...formData, primaryBottleneck: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                <ShieldCheck size={14} className="text-secondary" />
                <span>Zero-Knowledge AES-256 Vault Encryption</span>
              </div>

              <button
                data-tutorial-id="tut-intake-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-accent text-background font-black uppercase text-xs tracking-widest rounded-xl hover:opacity-90 transition-all amber-glow shadow-xl flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Ingesting & Routing...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Ingest & Execute Route
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Dynamic Routing Pipeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real-time routing diagram */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-secondary" />
                <h3 className="text-sm font-bold silver-text uppercase tracking-tight">Audit-to-Configuration Pipeline</h3>
              </div>
              <span className="text-[10px] font-mono text-accent">Auto-Router Active</span>
            </div>

            <p className="text-xs text-zinc-400">
              When an onboarding audit is parsed, the engine automatically populates Second Brain vaults and arms the scoped execution agents:
            </p>

            {/* Step-by-step route cards */}
            <div className="space-y-3 pt-2">
              {dynamicRoutes.map((route, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all",
                    isSubmitting && activePipelineStep === i + 1 
                      ? "bg-accent/15 border-accent shadow-md ring-1 ring-accent"
                      : "bg-black/40 border-white/5 hover:border-white/15"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono text-muted uppercase font-bold">{route.sourceField}</span>
                    <ArrowRight size={12} className="text-muted" />
                    <span className="text-[9px] font-mono text-secondary font-bold">{route.targetVault.split(' ')[0]}</span>
                  </div>

                  <div className="text-xs font-bold text-white mb-1">
                    {route.actionTriggered}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/5">
                    <span className="text-muted">Arming Agent:</span>
                    <span className="text-accent font-bold">{route.activeModule}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Submission Status Confirmation */}
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span>Onboarding Ingested & Second Brain Synchronized</span>
                </div>
                <p className="text-[11px] text-green-200/80 leading-relaxed font-sans">
                  The 10 Vaults have been updated. Authority Builder (AURORA-01) and Performance Re-allocator (VORTEX-02) have received context vectors.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-[10px] font-mono uppercase tracking-wider text-green-300 transition-colors"
                  >
                    Reset Questionnaire
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="p-5 rounded-2xl bg-surface/40 border border-white/5 space-y-2 text-xs text-zinc-400">
            <h4 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-secondary" /> Strict Vault Boundary Guarantee
            </h4>
            <p className="leading-relaxed">
              Data ingested via this form is tagged with security classifications and isolated to your tenant schema. External agents cannot query outside their scoped RBAC permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Inbound Agent Run Results */}
      <div className="mt-10">
        <AgentRunResults
          records={runHistory}
          title="Intake & Lead Capture Run Results"
          description="Log of inbound lead webhooks, questionnaire ingestion events, and automated Second Brain sync runs."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}
