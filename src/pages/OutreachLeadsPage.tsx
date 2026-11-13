import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Sparkles, 
  Bot, 
  Mail, 
  Send, 
  CheckCircle2, 
  Filter, 
  Play, 
  RefreshCw, 
  Share2, 
  Sliders, 
  TrendingUp, 
  ExternalLink,
  Target,
  Copy,
  Check,
  Building2,
  Briefcase,
  Plus,
  Kanban,
  Code2,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  X,
  Phone,
  Calendar,
  AlertCircle,
  MessageSquare,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { apiFetch } from '@/src/lib/api';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import WhatsAppLeadIntelligenceStudio from '@/src/components/outreach/WhatsAppLeadIntelligenceStudio';
import DealDocumentsStudio from '@/src/components/outreach/DealDocumentsStudio';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { Button, GlassCard, Badge, Tabs, MetricWidget } from '@/src/components/ui';
import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
import { SEED_LEAD_PROSPECTS, type LeadProspect } from '@/src/data/marketingModulesData';

export type LeadStage = 'NEW_INBOUND' | 'ENRICHED' | 'OUTREACH_QUEUED' | 'REPLIED_WARM' | 'CALL_BOOKED' | 'CLOSED_WON';

export interface SovereignLeadItem {
  id: string;
  name: string;
  email: string;
  company: string;
  domain?: string;
  title?: string;
  linkedinUrl?: string;
  stage: LeadStage;
  sourceVector: string;
  estimatedArr?: string;
  /** Present only when a real scoring/enrichment source produced it. */
  icpScore?: number;
  notes?: string;
  capturedAt: string;
}

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bg: string; border: string }> = {
  NEW_INBOUND: { label: 'New / Inbound', color: 'text-sky-accent', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  ENRICHED: { label: 'ICP Enriched', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  OUTREACH_QUEUED: { label: 'Outreach Active', color: 'text-amber-accent', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  REPLIED_WARM: { label: 'Replied / Warm', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  CALL_BOOKED: { label: 'Diagnostic Booked', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  CLOSED_WON: { label: 'Won / Retainer Signed', color: 'text-emerald-accent', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
};

const STAGES: LeadStage[] = ['NEW_INBOUND', 'ENRICHED', 'OUTREACH_QUEUED', 'REPLIED_WARM', 'CALL_BOOKED', 'CLOSED_WON'];

export default function OutreachLeadsPage() {
  const { notifySuccess, notifyInfo, notifyWarning } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'DEAL_DOCUMENTS' | 'WHATSAPP_INTELLIGENCE' | 'CAPTURE_DOCK' | 'PROSPECTS' | 'SEQUENCES' | 'SDR_AGENT'>('PIPELINE');
  // Which pipeline lead the Deal Documents studio opens on — set from the
  // real pipeline (the "Docs" button); undefined until a lead exists.
  const [selectedLeadForDocsId, setSelectedLeadForDocsId] = useState<string | undefined>(undefined);

  // Leads & Pipeline State
  const [pipelineLeads, setPipelineLeads] = useState<SovereignLeadItem[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  // Prospect selection starts empty: the seed list is demo-only, and an
  // invented prospect rendered as "your top target" is a fabricated claim.
  const [selectedLead, setSelectedLead] = useState<LeadProspect | null>(
    isDemoSeedEnabled() ? SEED_LEAD_PROSPECTS[0] : null
  );
  // The tab's data source: the demo list only when the demo flag is on,
  // otherwise an honest empty state (never invented accounts).
  const prospects = isDemoSeedEnabled() ? SEED_LEAD_PROSPECTS : [];
  const [isEnriching, setIsEnriching] = useState(false);
  const [isDeployingSdr, setIsDeployingSdr] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // New Lead Modal Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');

  // Agent Run Results — starts empty: a fresh workspace has no SDR runs yet.
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadDomain, setNewLeadDomain] = useState('');
  const [newLeadTitle, setNewLeadTitle] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('Direct Inbound');
  const [newLeadArr, setNewLeadArr] = useState('');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  // Live Conversion Dock Test Form State
  const [testDockName, setTestDockName] = useState('');
  const [testDockEmail, setTestDockEmail] = useState('');
  const [testDockCompany, setTestDockCompany] = useState('');
  const [testDockNeeds, setTestDockNeeds] = useState('Growth Diagnostic Audit');
  const [isSubmittingDock, setIsSubmittingDock] = useState(false);

  // Email Sequence Editor — seeded from the selected prospect only when one
  // is actually selected; never from an invented default.
  const [emailSubject, setEmailSubject] = useState(
    selectedLead ? `Why ${selectedLead.companyName}'s growth stalled on rented headcount` : ''
  );
  const [emailBody, setEmailBody] = useState(selectedLead?.personalizedOutreachCopy ?? '');

  // Fetch leads on mount. The pipeline is whatever the server store holds —
  // empty for a fresh workspace (the demo leads only exist when the server
  // runs with SEED_DEMO_WORKSPACE=true). No client-side fallback seeds:
  // invented prospects must not read as live pipeline.
  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const res = await apiFetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setPipelineLeads(data.leads && Array.isArray(data.leads) ? data.leads : []);
      } else {
        setPipelineLeads([]);
      }
    } catch {
      // Failed/offline: the honest state is "no leads", not invented ones.
      setPipelineLeads([]);
    }
    setIsLoadingLeads(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Save pipeline changes locally and remotely
  const updatePipelineLeads = (newLeads: SovereignLeadItem[]) => {
    setPipelineLeads(newLeads);
    localStorage.setItem('sigmatactix_sovereign_leads', JSON.stringify(newLeads));
  };

  // Move a lead forward or backward across Kanban stages
  const handleMoveStage = async (leadId: string, direction: 'forward' | 'backward') => {
    const lead = pipelineLeads.find(l => l.id === leadId);
    if (!lead) return;

    const currentIndex = STAGES.indexOf(lead.stage);
    const targetIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;

    const targetStage = STAGES[targetIndex];
    const updated = pipelineLeads.map(l => l.id === leadId ? { ...l, stage: targetStage } : l);
    updatePipelineLeads(updated);

    try {
      await apiFetch('/api/leads/update-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, stage: targetStage })
      });
    } catch {}

    notifySuccess('Pipeline Stage Updated', `${lead.company} moved to "${STAGE_CONFIG[targetStage].label}".`);
  };

  // Add new lead manually
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadEmail.trim() || !newLeadCompany.trim()) return;

    const newLead: SovereignLeadItem = {
      id: `lead-${Date.now()}`,
      name: newLeadName.trim(),
      email: newLeadEmail.trim().toLowerCase(),
      company: newLeadCompany.trim(),
      domain: newLeadDomain.trim() || undefined,
      title: newLeadTitle.trim(),
      stage: 'NEW_INBOUND',
      sourceVector: newLeadSource,
      // Manual entry does not produce an ICP score — a fabricated random
      // number would badge as fact. Scored only when a real source sets it.
      estimatedArr: newLeadArr || undefined,
      icpScore: undefined,
      notes: newLeadNotes.trim() || 'Manually entered into Sovereign Pipeline.',
      capturedAt: 'Just now'
    };

    const updated = [newLead, ...pipelineLeads];
    updatePipelineLeads(updated);
    setIsAddLeadModalOpen(false);

    // Reset Form
    setNewLeadName('');
    setNewLeadEmail('');
    setNewLeadCompany('');
    setNewLeadDomain('');
    setNewLeadNotes('');

    try {
      await apiFetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
    } catch {}

    notifySuccess('Lead Added to Sovereign CRM', `${newLead.name} (${newLead.company}) is now live in the pipeline.`);
  };

  // Live Test of Conversion Dock Submission
  const handleTestDockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testDockName.trim() || !testDockEmail.trim()) return;

    setIsSubmittingDock(true);
    // We don't fabricate a domain/ARR/ICP for a test capture: the captured lead
    // is unscored and the domain is only derived from the company the user typed.
    const typedDomain = testDockCompany.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const newCapturedLead: SovereignLeadItem = {
      id: `dock-${Date.now()}`,
      name: testDockName.trim(),
      email: testDockEmail.trim().toLowerCase(),
      company: (testDockCompany.trim() || 'Unspecified Company'),
      domain: typedDomain ? `${typedDomain}.com` : undefined,
      title: '',
      stage: 'NEW_INBOUND',
      sourceVector: 'Conversion Dock (Embed)',
      estimatedArr: undefined,
      icpScore: undefined,
      notes: `Captured via embed dock: "${testDockNeeds}". Zero 3rd-party CRM needed.`,
      capturedAt: 'Just now'
    };

    updatePipelineLeads([newCapturedLead, ...pipelineLeads]);

    try {
      await apiFetch('/api/public/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testDockName,
          email: testDockEmail,
          company: testDockCompany || 'Unspecified Company',
          sourceVector: 'Conversion Dock (Embed)',
          needs: testDockNeeds
        })
      });
    } catch {}

    setIsSubmittingDock(false);
    setTestDockName('');
    setTestDockEmail('');
    setTestDockCompany('');
    setActiveTab('PIPELINE');
    notifySuccess('Inbound Lead Captured!', `${newCapturedLead.name} (${newCapturedLead.company}) instantly entered the Sovereign CRM under "New / Inbound".`);
  };

  // No enrichment/SDR execution engine is wired end-to-end yet: these must not
  // fake a "Success" with invented counts. They surface the honest state and
  // point at what's required to run for real.
  const handleEnrichLeads = () => {
    if (pipelineLeads.length === 0) {
      notifyWarning('Nothing to Enrich', 'The pipeline is empty. Add a prospect or capture a lead first.');
      return;
    }
    notifyWarning(
      'Enrichment Not Wired',
      `${pipelineLeads.length} lead(s) in pipeline, but no enrichment source (e.g. a connected ICP/scraping connector) is configured. Connect one to enrich for real — no signals were changed.`
    );
  };

  const handleDeploySdr = () => {
    if (pipelineLeads.length === 0) {
      notifyWarning('Nothing to Deploy', 'The pipeline is empty, so the SDR has no accounts to run against.');
      return;
    }
    notifyWarning(
      'SDR Not Dispatched',
      'No outbound sequence engine is connected, so nothing was enqueued. Add a dispatch backend (or a configured connector) to run Mercury-07 for real.'
    );
  };

  // Pipeline Metrics Calculation
  const totalPipelineValue = pipelineLeads.reduce((acc, l) => {
    const val = parseFloat((l.estimatedArr || '0').replace(/[^0-9.]/g, ''));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const wonARR = pipelineLeads
    .filter(l => l.stage === 'CLOSED_WON')
    .reduce((acc, l) => {
      const val = parseFloat((l.estimatedArr || '0').replace(/[^0-9.]/g, ''));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

  const activeDomain = currentWorkspace?.domain?.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase().trim() || 'sigmatactix.com';

  const embedSnippet = `<!-- Sigma Tactix Autonomous Lead Capture Dock -->
<div id="sigmatactix-capture-dock" data-domain="${activeDomain}" data-theme="dark"></div>
<script src="https://${activeDomain}/api/embed/dock.js" async></script>`;

  const outreachTabs = [
    { id: 'PIPELINE', label: `CRM Pipeline (${pipelineLeads.length})`, icon: <Kanban className="w-3.5 h-3.5" /> },
    { id: 'DEAL_DOCUMENTS', label: 'Deal Documents', icon: <Briefcase className="w-3.5 h-3.5" />, badge: 'Agreements' },
    { id: 'WHATSAPP_INTELLIGENCE', label: 'WhatsApp Intel', icon: <MessageSquare className="w-3.5 h-3.5" />, badge: 'v0.1' },
    { id: 'CAPTURE_DOCK', label: 'Capture Dock', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'PROSPECTS', label: 'Enriched Accounts', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'SEQUENCES', label: 'Sequence Builder', icon: <Mail className="w-3.5 h-3.5" /> },
    { id: 'SDR_AGENT', label: 'Mercury-07 SDR', icon: <Bot className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="xs">SOVEREIGN REVENUE ENGINE</Badge>
              <span className="text-xs font-mono text-[var(--sigma-muted)]">MERCURY-07 SDR + NATIVE CRM</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <Kanban className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Lead Engine & Sovereign CRM Pipeline
            </h1>
            <p className="text-[var(--sigma-muted)] text-sm max-w-2xl leading-relaxed">
              Autonomous buyer prospecting, embeddable lead capture dock, native CRM pipeline stages, and closed-loop revenue attribution without requiring third-party subscriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setIsAddLeadModalOpen(true)}
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Prospect
            </Button>

            <Button
              onClick={handleEnrichLeads}
              disabled={isEnriching}
              variant="outline"
              size="md"
              icon={<RefreshCw className={cn("w-3.5 h-3.5 text-[var(--sigma-vermilion)]", isEnriching && "animate-spin")} />}
            >
              {isEnriching ? 'Enriching...' : 'Enrich Signals'}
            </Button>

            <Button
              onClick={handleDeploySdr}
              disabled={isDeployingSdr}
              variant="secondary"
              size="md"
              icon={<Play className="w-3.5 h-3.5" />}
            >
              {isDeployingSdr ? 'Executing...' : 'Deploy AI SDR'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricWidget
          label="Active Pipeline Accounts"
          value={`${pipelineLeads.length} Leads`}
          subtext="Native Sovereign Pipeline"
          icon={<Users className="w-4 h-4 text-[var(--sigma-muted)]" />}
        />

        <MetricWidget
          label="Total Pipeline ARR"
          value={totalPipelineValue > 0 ? `$${totalPipelineValue.toFixed(1)}M` : '—'}
          subtext={totalPipelineValue > 0 ? 'Sum of estimated ARR bands recorded on pipeline leads' : 'No ARR recorded yet — estimated ARR is only counted when a lead carries one'}
          icon={<DollarSign className="w-4 h-4 text-[var(--sigma-vermilion)]" />}
        />

        <MetricWidget
          label="Won / Contracted ARR"
          value={wonARR > 0 ? `$${wonARR.toFixed(1)}M` : '—'}
          subtext={wonARR > 0 ? `${pipelineLeads.filter(l => l.stage === 'CLOSED_WON').length} closed retainers in pipeline` : 'No won ARR recorded yet — move a lead to "Won / Retainer Signed"'}
          icon={<TrendingUp className="w-4 h-4 text-emerald-accent" />}
        />

        <MetricWidget
          label="Cold Reply Rate"
          value="No data"
          subtext="Replies aren't tracked yet — a real rate appears once sequences run with reply logging"
          icon={<CheckCircle2 className="w-4 h-4 text-sky-accent" />}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--sigma-border)] pb-3">
        <Tabs
          tabs={outreachTabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          variant="pill"
          size="sm"
        />
      </div>

      {/* TAB 1: KANBAN PIPELINE (SOVEREIGN MINI-CRM) */}
      {activeTab === 'PIPELINE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--sigma-muted)]">
            <span>Sovereign Native Pipeline • Real-time closed-loop progression</span>
            <span>Click arrows to advance leads across stages</span>
          </div>

          <div data-tutorial-id="tut-pipeline-kanban" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
            {STAGES.map((stageKey) => {
              const config = STAGE_CONFIG[stageKey];
              const stageLeads = pipelineLeads.filter(l => l.stage === stageKey);

              return (
                <div key={stageKey} className="flex flex-col min-w-[220px] bg-[var(--sigma-surface)]/60 border border-[var(--sigma-border)] rounded-2xl p-3 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--sigma-border)]">
                    <Badge variant={stageKey === 'CLOSED_WON' ? 'success' : stageKey === 'REPLIED_WARM' ? 'brand' : 'neutral'} size="xs">
                      {config.label}
                    </Badge>
                    <span className="text-xs font-mono text-[var(--sigma-muted)] font-semibold">{stageLeads.length}</span>
                  </div>

                  <div className="space-y-2 flex-1 min-h-[140px]">
                    {stageLeads.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] font-mono text-[var(--sigma-muted)] p-4 text-center">
                        No leads in this stage
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div key={lead.id} className="p-3 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl space-y-2 hover:border-[var(--sigma-border-hover)] transition-all shadow-xs group">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="text-xs font-semibold text-[var(--sigma-text)] leading-tight">{lead.company}</div>
                              <div className="text-[11px] text-[var(--sigma-muted)]">{lead.name}</div>
                            </div>
                            <Badge variant="success" size="xs">
                              {lead.icpScore != null ? `${lead.icpScore}%` : 'Unscored'}
                            </Badge>
                          </div>

                          <div className="text-[10px] font-mono text-[var(--sigma-muted)] flex items-center justify-between">
                            <span>{lead.sourceVector}</span>
                            <span className="text-[var(--sigma-vermilion)] font-semibold">{lead.estimatedArr}</span>
                          </div>

                          {lead.notes && (
                            <p className="text-[10px] text-[var(--sigma-muted)] line-clamp-2 italic bg-[var(--sigma-bg)] p-1.5 rounded-lg border border-[var(--sigma-border)]">
                              "{lead.notes}"
                            </p>
                          )}

                          {/* Stage Transition Controls */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-[var(--sigma-border)]">
                            <button
                              onClick={() => handleMoveStage(lead.id, 'backward')}
                              disabled={STAGES.indexOf(lead.stage) === 0}
                              className="p-1 rounded-md text-[var(--sigma-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-hover)] disabled:opacity-20 cursor-pointer transition-colors"
                              title="Move back"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedLeadForDocsId(lead.id);
                                setActiveTab('DEAL_DOCUMENTS');
                              }}
                              className="px-2 py-0.5 rounded bg-[var(--sigma-vermilion)]/10 hover:bg-[var(--sigma-vermilion)]/20 text-[var(--sigma-vermilion)] border border-[var(--sigma-vermilion)]/25 text-[11px] font-mono font-medium flex items-center gap-1 cursor-pointer transition-all"
                              title="Create Deal Documents & Agreements"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              Docs
                            </button>

                            <span className="text-[11px] font-mono text-[var(--sigma-muted)]">
                              {lead.capturedAt}
                            </span>

                            <button
                              onClick={() => handleMoveStage(lead.id, 'forward')}
                              disabled={STAGES.indexOf(lead.stage) === STAGES.length - 1}
                              className="p-1 rounded-md text-[var(--sigma-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-hover)] disabled:opacity-20 cursor-pointer transition-colors"
                              title="Advance lead"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: DEAL DOCUMENTS & CONSULTING PACKAGES STUDIO */}
      {activeTab === 'DEAL_DOCUMENTS' && (
        <DealDocumentsStudio 
          leads={pipelineLeads} 
          currentLeadId={selectedLeadForDocsId}
          onSelectLead={(id) => setSelectedLeadForDocsId(id)}
        />
      )}

      {/* TAB: WHATSAPP LEAD INTELLIGENCE AGENT (v0.1 LEAN MVP) */}
      {activeTab === 'WHATSAPP_INTELLIGENCE' && (
        <WhatsAppLeadIntelligenceStudio />
      )}

      {/* TAB 2: EMBEDDABLE CONVERSION DOCK (SOLVES "NO CRM" SCENARIO) */}
      {activeTab === 'CAPTURE_DOCK' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Embed Snippet & Webhook Configuration */}
          <div className="space-y-4 p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
              <Code2 className="w-4 h-4" /> ZERO-DEPENDENCY INBOUND CAPTURE DOCK
            </div>
            <h3 className="text-lg font-bold text-white">Embed Lead Capture on Any Web Property</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If you or a client have <strong>zero existing CRM or lead capture tools</strong>, copy this snippet onto any website (WordPress, Webflow, React, HTML). Inbound submissions automatically post to your local Growth OS database with verified HMAC attribution.
            </p>

            <div className="p-3 bg-black/80 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>HTML / JavaScript Embed Snippet</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedSnippet);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-amber-300/90 overflow-x-auto p-2 bg-zinc-950 rounded">
                {embedSnippet}
              </pre>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs font-mono">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Native Lead Pipeline Features:
              </div>
              <ul className="list-disc list-inside text-zinc-400 space-y-1 text-[11px]">
                <li>Automatic domain extraction & ICP score calculation</li>
                <li>Direct attribution to origin vector (SEO, Ads, Outreach, Referral)</li>
                <li>Instant webhook commitment into Second Brain RAG memory</li>
                <li>Zero ongoing Zapier, HubSpot, or Salesforce subscription required</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live Interactive Test Form */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                <Send className="w-4 h-4" /> LIVE CAPTURE TEST CONSOLE
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Fires POST /api/public/capture-lead</span>
            </div>

            <p className="text-xs text-zinc-400">
              Test submitting a lead as if an executive visited your landing page dock. The record will instantly land in your Sovereign Pipeline.
            </p>

            <form onSubmit={handleTestDockSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={testDockName}
                  onChange={(e) => setTestDockName(e.target.value)}
                  placeholder="e.g. Alexander Cross"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400">Work Email</label>
                <input
                  type="email"
                  required
                  value={testDockEmail}
                  onChange={(e) => setTestDockEmail(e.target.value)}
                  placeholder="alexander@cloudvector.io"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400">Company Name</label>
                <input
                  type="text"
                  value={testDockCompany}
                  onChange={(e) => setTestDockCompany(e.target.value)}
                  placeholder="CloudVector Technologies"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400">Primary Growth Need</label>
                <select
                  value={testDockNeeds}
                  onChange={(e) => setTestDockNeeds(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option>Autonomous Growth Diagnostic Audit</option>
                  <option>SEO / AEO Citation Recovery</option>
                  <option>Performance Ad ROAS Optimization</option>
                  <option>AI SDR Outbound Pipeline Installation</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingDock || !testDockName.trim() || !testDockEmail.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSubmittingDock ? 'Capturing Lead...' : 'Submit Test Lead to Native Pipeline'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: PROSPECTS & ICP SCORING — demo research list. Invented
          accounts are shown ONLY behind VITE_SEED_DEMO_WORKSPACE, and then
          with a visible demo badge so they never read as the tenant's targets. */}
      {activeTab === 'PROSPECTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prospect List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                {isDemoSeedEnabled() ? 'Demo Target Accounts' : 'Target Accounts'} ({prospects.length})
              </div>
              {isDemoSeedEnabled() && (
                <Badge variant="warning" size="xs">Demo data — replace with real accounts</Badge>
              )}
            </div>

            {!isDemoSeedEnabled() && (
              <div className="p-4 rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/30 text-[11px] font-mono text-zinc-500 leading-relaxed">
                No target accounts yet. Inbound and manually added pipeline leads show in the CRM Pipeline tab; connect a research/enrichment source to build an ICP-scored target list.
              </div>
            )}

            {prospects.map(lead => (
              <div
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  setEmailSubject(`Why ${lead.companyName}'s growth stalled on rented headcount`);
                  setEmailBody(lead.personalizedOutreachCopy);
                }}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2",
                  selectedLead?.id === lead.id
                    ? "bg-amber-400/10 border-amber-400/40 text-white shadow-lg shadow-amber-500/5"
                    : "bg-zinc-900/30 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/40"
                )}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">{lead.name}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
                    {lead.icpMatchScore}% ICP Match
                  </span>
                </div>

                <div className="text-xs text-zinc-400">
                  {lead.title} at <strong className="text-zinc-200">{lead.companyName}</strong>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-zinc-500">
                  <span>{lead.industry}</span>
                  <span>•</span>
                  <span className="text-amber-400/80">{lead.estimatedArr || '$3.5M'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Lead Detail & Enrichment Profile */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedLead && (
              <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl text-xs font-mono text-zinc-500 leading-relaxed">
                Select a target account on the left to inspect its enrichment profile and AI-synthesized outreach draft.
              </div>
            )}
            {selectedLead && (
            <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedLead.companyName}</h2>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Tier 1 Target
                    </span>
                  </div>
                  <div className="text-xs font-mono text-zinc-400 mt-1">
                    Decision Maker: {selectedLead.name} ({selectedLead.title})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedLead.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    LinkedIn
                  </a>
                </div>
              </div>

              {/* Enrichment Signals */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Enriched Behavioral Signals
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedLead.intentSignals || [selectedLead.triggerEvent]).map((sig, i) => (
                    <span key={i} className="px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-xs font-mono text-amber-300 flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-amber-400" />
                      {sig}
                    </span>
                  ))}
                </div>
              </div>

              {/* Personalized Outreach Draft */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    AI-Synthesized First Touchpoint Draft
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Generated via Mercury-07 SDR</span>
                </div>

                <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl space-y-2">
                  <div className="text-xs font-mono text-amber-400/90 font-bold">
                    Subject: {emailSubject}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {emailBody}
                  </p>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EMPIRICAL SEQUENCE BUILDER */}
      {activeTab === 'SEQUENCES' && (
        <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Multi-Touch Autonomous Diagnostic Sequence</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                4-touch cadence engineered to convert cold enterprise prospects by demonstrating empirical proof of their revenue leakage.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 font-bold">
              Reply rate: no data yet
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {[
              { step: 'TOUCH 1 (Day 1)', channel: 'Cold Email', desc: 'Deliver empirical diagnostic teardown highlighting their FCP speed leak and 0 AEO citations.' },
              { step: 'TOUCH 2 (Day 3)', channel: 'LinkedIn Connection', desc: 'Custom connection note referencing their recent marketing leadership hire or ad blitz.' },
              { step: 'TOUCH 3 (Day 6)', channel: 'Email Teardown', desc: 'Deliver 3-point growth gap preview generated by Sigma Tactix diagnostic engine.' },
              { step: 'TOUCH 4 (Day 9)', channel: 'InMail / Loom Audit', desc: 'Video walkthrough of their Second Brain architecture and 90-day ROI guarantee.' }
            ].map((touch, i) => (
              <div key={i} className="p-4 bg-black/60 border border-zinc-800 rounded-xl space-y-2 text-xs">
                <div className="font-mono text-amber-400 font-bold text-[11px]">{touch.step}</div>
                <div className="font-bold text-white">{touch.channel}</div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">{touch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SDR AGENT ARCHITECTURE */}
      {activeTab === 'SDR_AGENT' && (
        <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Mercury-07 (Autonomous SDR Swarm)</h3>
                <p className="text-xs text-zinc-400 font-mono">Codename: MERCURY-07 • Clearance: HITL Governed</p>
              </div>
            </div>

            <button
              onClick={handleDeploySdr}
              disabled={isDeployingSdr}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              {isDeployingSdr ? 'Executing...' : `Dispatch Batch (${pipelineLeads.length} leads)`}
            </button>
          </div>

          {/* The swarm components exist by design; without a dispatch backend
              none of them have run, so no counters are shown as fact. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs space-y-1">
              <div className="font-bold text-white">Sub-Agent 1: MERCURY-SUB-1</div>
              <div className="text-zinc-400 text-[11px]">ICP Intent & Signal Scraper</div>
              <div className="text-zinc-500 font-mono text-[10px]">Status: Not running (0 enriched)</div>
            </div>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs space-y-1">
              <div className="font-bold text-white">Sub-Agent 2: MERCURY-SUB-2</div>
              <div className="text-zinc-400 text-[11px]">Objection Prediction & Copywriter</div>
              <div className="text-zinc-500 font-mono text-[10px]">Status: Not running (0 drafts synthesized)</div>
            </div>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs space-y-1">
              <div className="font-bold text-white">Sub-Agent 3: MERCURY-SUB-3</div>
              <div className="text-zinc-400 text-[11px]">Deliverability & Spam Sentinel</div>
              <div className="text-zinc-500 font-mono text-[10px]">Status: Not connected</div>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      <AnimatePresence>
        {isAddLeadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#09090B] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Add New Prospect to Sovereign Pipeline
                </h3>
                <button
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddLead} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={newLeadName}
                      onChange={(e) => setNewLeadName(e.target.value)}
                      placeholder="e.g. Liam Sterling"
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={newLeadEmail}
                      onChange={(e) => setNewLeadEmail(e.target.value)}
                      placeholder="liam@vortexdata.io"
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={newLeadCompany}
                      onChange={(e) => setNewLeadCompany(e.target.value)}
                      placeholder="Vortex Data Inc"
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Target Web Domain</label>
                    <input
                      type="text"
                      value={newLeadDomain}
                      onChange={(e) => setNewLeadDomain(e.target.value)}
                      placeholder="vortexdata.io"
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Job Title</label>
                    <input
                      type="text"
                      value={newLeadTitle}
                      onChange={(e) => setNewLeadTitle(e.target.value)}
                      placeholder="Founder / CEO"
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Estimated ARR</label>
                    <input
                      type="text"
                      value={newLeadArr}
                      onChange={(e) => setNewLeadArr(e.target.value)}
                      placeholder="$3.5M"
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Origin Vector</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    <option>Direct Inbound (Conversion Dock)</option>
                    <option>Cold SDR (Mercury-07)</option>
                    <option>SEO & AEO Authority (Aurora-01)</option>
                    <option>Performance Ads (Google RSA / Meta)</option>
                    <option>Referral / High-Intent Intro</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Lead Context & Notes</label>
                  <textarea
                    rows={2}
                    value={newLeadNotes}
                    onChange={(e) => setNewLeadNotes(e.target.value)}
                    placeholder="Specific growth pain points, current tech stack, or qualification details..."
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddLeadModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-accent text-background font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-md amber-glow"
                  >
                    Add to Pipeline
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Agent Run Results */}
      <div className="mt-12">
        <AgentRunResults
          records={runHistory}
          title="Outreach & SDR Swarm Run Results"
          description="Log of lead enrichment runs, automated email dispatches, and WhatsApp SDR qualification events."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}

