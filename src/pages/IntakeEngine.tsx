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
import { GlassCard, Button, Badge, Input } from '@/src/components/ui';
import { SECOND_BRAIN_VAULTS } from '@/src/data/secondBrainVaults';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useToast } from '@/src/contexts/ToastContext';
import { apiFetch } from '@/src/lib/api';
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
  const { notifyError } = useToast();
  // Pre-fill ONLY from this tenant's own workspace record. Fields the tenant
  // has not filled start blank — invented default numbers read as their data.
  const [formData, setFormData] = useState<FormState>({
    companyName: currentWorkspace?.name || '',
    websiteUrl: currentWorkspace?.domain ? (currentWorkspace.domain.startsWith('http') ? currentWorkspace.domain : `https://${currentWorkspace.domain}`) : '',
    monthlyRevenue: '',
    primaryICP: currentWorkspace?.icp || '',
    primaryChannel: '',
    monthlyAdSpend: '',
    primaryBottleneck: '',
    brandVoiceTone: currentWorkspace?.brandVault?.voiceAndTone || '',
    competitorDifferentiator: currentWorkspace?.brandVault?.corePositioning || ''
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

  // Dynamic Routing mapping preview based on form fields. The "will be
  // written" text is a plan, not a claim: fields only land when the
  // questionnaire is submitted and the route confirms success.
  const dynamicRoutes = [
    {
      sourceField: 'Brand Voice & Differentiator',
      targetVault: 'Brand Vault (ZONE_1_BRAND)',
      actionTriggered: 'Voice tone & positioning recorded in Brand Vault on submit',
      activeModule: 'Content & Creative Engine (NEXUS-03)'
    },
    {
      sourceField: 'Primary ICP & Revenue Band',
      targetVault: 'Customer Vault (ZONE_1_CUSTOMER)',
      actionTriggered: 'ICP recorded in Customer Vault; revenue band filed with Executive Vault',
      activeModule: 'Lead Gen & Diagnostic Specialist'
    },
    {
      sourceField: 'Ad Spend & Channel Data',
      targetVault: 'Marketing Vault (ZONE_2_MARKETING)',
      actionTriggered: 'Channel recorded; spend filed with Executive Vault — no CAC derived',
      activeModule: 'Performance Re-allocator (VORTEX-02)'
    },
    {
      sourceField: 'Primary Bottleneck',
      targetVault: 'Audit Vault (ZONE_1_AUDIT)',
      actionTriggered: 'Reported bottleneck flagged in Audit Vault funnel findings',
      activeModule: 'Authority Builder Agent (AURORA-01)'
    }
  ];

  const [previousWritten, setPreviousWritten] = useState<string[]>([]);

  // Run history starts empty: a fresh workspace has no prior ingestion.
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActivePipelineStep(1);
    try {
      const res = await apiFetch('/api/workspace/intake/questionnaire', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Intake service responded ${res.status}.`);
      }
      const written: string[] = (data.written || []).map(
        (w: { vault: string; field: string }) => `${w.vault} → ${w.field}`
      );
      setPreviousWritten(written);
      setIsSubmitted(true);
      setActivePipelineStep(2);
      setRunHistory(prev => [
        {
          id: `run-intake-${Date.now()}`,
          agentName: 'Intake Ingestion',
          agentRole: 'Second Brain Questionnaire Router',
          timestamp: 'Just now',
          status: 'SUCCESS',
          moduleOrigin: 'Inbound Leads & Intake Engine',
          inputSummary: `Onboarding questionnaire for ${formData.companyName || 'workspace'}`,
          outputSummary: written.length
            ? `${written.length} field(s) persisted: ${written.join(', ')}.`
            : 'Required fields verified; optional fields were left blank.',
          fullOutput: JSON.stringify(data, null, 2),
          metrics: [
            { label: 'Fields Written', value: String(written.length) },
            { label: 'Store', value: 'Second Brain (Supabase)' },
            { label: 'Vaults Touched', value: String(new Set((data.written || []).map((w: any) => w.vault)).size) }
          ]
        },
        ...prev
      ]);
    } catch (err: any) {
      setIsSubmitted(false);
      setActivePipelineStep(0);
      notifyError('Intake Failed', err?.message || 'Could not persist the questionnaire.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setActivePipelineStep(0);
    setPreviousWritten([]);
  };

  return (
    <div className="space-y-8 lg:space-y-10 pb-20">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="vermilion" size="sm">
                <Zap size={12} className="mr-1 inline" /> Automated Onboarding
              </Badge>
              <Badge variant="success" size="sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent inline-block mr-1.5 animate-pulse" />
                Audit Routing Active
              </Badge>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--sigma-text)]">
              Dynamic Intake & Configuration Engine
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Client onboarding questionnaire with "Audit-to-Configuration" data routing. On submit, each answered field is persisted into the Second Brain vaults listed at right — and only answered fields are written.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Questionnaire Form */}
        <div className="lg:col-span-7">
          <GlassCard elevation="raised" className="p-6 lg:p-8 border border-[var(--sigma-border)] space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={18} className="text-[var(--sigma-vermilion)]" />
                <h3 className="text-base font-bold text-[var(--sigma-text)]">Client Onboarding Questionnaire</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Interactive Schema v3.2</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />

                <Input
                  label="Primary Domain / URL"
                  required
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">Monthly Revenue Scale</label>
                  <select
                    value={formData.monthlyRevenue}
                    onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                    className="w-full bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-3 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-vermilion)]"
                  >
                    <option value="">Not specified</option>
                    <option value="< $50k">&lt; $50k ARR</option>
                    <option value="$50k - $150k">$50k - $150k ARR</option>
                    <option value="$150k - $500k">$150k - $500k ARR (Scaling)</option>
                    <option value="$500k+">$500k+ ARR (Enterprise)</option>
                  </select>
                </div>

                <Input
                  label="Monthly Media / Ad Spend"
                  value={formData.monthlyAdSpend}
                  onChange={(e) => setFormData({ ...formData, monthlyAdSpend: e.target.value })}
                />
              </div>

              <Input
                label="Target ICP (Ideal Customer Profile)"
                required
                value={formData.primaryICP}
                onChange={(e) => setFormData({ ...formData, primaryICP: e.target.value })}
              />

              <Input
                label="Core Competitive Differentiator"
                value={formData.competitorDifferentiator}
                onChange={(e) => setFormData({ ...formData, competitorDifferentiator: e.target.value })}
              />

              <Input
                label="Brand Voice & Editorial Mandates"
                value={formData.brandVoiceTone}
                onChange={(e) => setFormData({ ...formData, brandVoiceTone: e.target.value })}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-zinc-400">Primary Digital Growth Bottleneck</label>
                <textarea
                  rows={2}
                  value={formData.primaryBottleneck}
                  onChange={(e) => setFormData({ ...formData, primaryBottleneck: e.target.value })}
                  className="w-full bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-3 text-xs text-[var(--sigma-text)] font-mono focus:outline-none focus:border-[var(--sigma-vermilion)]"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[var(--sigma-border)]">
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                  <ShieldCheck size={14} className="text-emerald-accent" />
                  <span>Persisted to your tenant's Second Brain (RLS-scoped)</span>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  leftIcon={<Send size={14} />}
                >
                  {isSubmitting ? "Persisting..." : "Save to Second Brain"}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Right: Live Dynamic Routing Pipeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real-time routing diagram */}
          <GlassCard elevation="raised" className="p-6 border border-[var(--sigma-border)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-[var(--sigma-vermilion)]" />
                <h3 className="text-xs font-bold text-[var(--sigma-text)] uppercase tracking-wider">Audit-to-Configuration Pipeline</h3>
              </div>
              <Badge variant="outline" size="sm">Auto-Router Active</Badge>
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
                      ? "bg-[var(--sigma-surface-raised)] border-[var(--sigma-vermilion)]/60 shadow-md ring-1 ring-[var(--sigma-vermilion)]/30" 
                      : "bg-[var(--sigma-surface)] border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">{route.sourceField}</span>
                    <ArrowRight size={12} className="text-zinc-500" />
                    <span className="text-[10px] font-mono text-[var(--sigma-vermilion)] font-semibold">{route.targetVault.split(' ')[0]}</span>
                  </div>

                  <div className="text-xs font-semibold text-[var(--sigma-text)] mb-1">
                    {route.actionTriggered}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[var(--sigma-border)]">
                    <span className="text-zinc-500">Arming Agent:</span>
                    <span className="text-[var(--sigma-text)] font-medium">{route.activeModule}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Submission Status Confirmation */}
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-accent space-y-2"
              >
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <CheckCircle2 size={15} className="text-emerald-accent" />
                  <span>Questionnaire Persisted to the Second Brain</span>
                </div>
                <p className="text-[11px] text-emerald-accent/80 leading-relaxed font-sans">
                  {previousWritten.length > 0
                    ? `Written: ${previousWritten.join(' · ')}`
                    : 'All optional fields were left blank; required fields were verified.'}
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    Reset Questionnaire
                  </Button>
                </div>
              </motion.div>
            )}
          </GlassCard>

          {/* Quick Info Box */}
          <GlassCard elevation="flat" className="p-5 border border-[var(--sigma-border)] space-y-2 text-xs text-zinc-400">
            <h4 className="font-semibold text-[var(--sigma-text)] flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-accent" /> Strict Vault Boundary Guarantee
            </h4>
            <p className="leading-relaxed text-zinc-400">
              Data ingested via this form is tagged with security classifications and isolated to your tenant schema. External agents cannot query outside their scoped RBAC permissions.
            </p>
          </GlassCard>
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

