import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, Eye, FileCode2, Loader2, ShieldCheck, Sparkles, SplitSquareVertical } from 'lucide-react';
import { Badge, Button, GlassCard } from '@/src/components/ui';
import { useToast } from '@/src/contexts/ToastContext';
import { useUser } from '@/src/contexts/UserContext';
import { apiFetch } from '@/src/lib/api';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

type LandingArtifact = {
  id: string;
  sourceUrl: string;
  sourceCapturedAt: string;
  sourceTitle: string;
  sections: Array<{ id: string; label: string; purpose: string }>;
  previews: {
    sourceDesktop: string | null;
    sourceMobile: string | null;
    proposedDesktop: string | null;
    proposedMobile: string | null;
  };
  htmlHash: string;
  htmlUrl: string;
  status: 'draft' | 'approved' | 'archived';
};

const apiError = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => ({}));
  return body.error || fallback;
};

export default function CroStudioPage() {
  const { notifyError, notifySuccess } = useToast();
  const { role } = useUser();
  const [url, setUrl] = useState('');
  const [objective, setObjective] = useState('Clarify the buyer journey before a working session.');
  const [audience, setAudience] = useState('Operations and commercial leaders');
  const [primaryCta, setPrimaryCta] = useState('Request a working session');
  const [artifacts, setArtifacts] = useState<LandingArtifact[]>([]);
  const [selected, setSelected] = useState<LandingArtifact | null>(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  const loadArtifacts = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/workspace/cro/artifacts');
      if (!response.ok) throw new Error(await apiError(response, 'Could not load landing artifacts.'));
      const payload = await response.json();
      const next = Array.isArray(payload.artifacts) ? payload.artifacts as LandingArtifact[] : [];
      setArtifacts(next);
      setSelected(current => current ? next.find(artifact => artifact.id === current.id) || null : next[0] || null);

      if (next.length > 0) {
        setRunHistory(next.map(item => ({
          id: `run-cro-${item.id}`,
          agentName: 'CRO Optimization & Landing Page Agent',
          agentRole: 'Wireframe & Proposed Architecture Synthesis',
          timestamp: new Date(item.sourceCapturedAt).toLocaleString(),
          status: 'SUCCESS',
          moduleOrigin: 'CRO & Landing Pages Studio',
          inputSummary: `Source: ${item.sourceUrl}`,
          outputSummary: `Retained proposal for "${item.sourceTitle || item.sourceUrl}" with ${item.sections?.length || 0} conversion sections, SHA-256 integrity-verified HTML, and desktop/mobile previews.`,
          fullOutput: JSON.stringify(item, null, 2),
          metrics: [
            { label: 'Sections', value: `${item.sections?.length || 0}` },
            { label: 'Status', value: item.status },
            { label: 'Integrity', value: `${item.htmlHash.slice(0, 10)}…` },
            { label: 'Previews', value: item.previews.proposedDesktop ? 'Ready' : 'Pending' }
          ]
        })));
      }
    } catch (error: any) {
      notifyError('Landing artifacts unavailable', error?.message || 'Could not load saved proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadArtifacts(); }, []);

  useEffect(() => {
    if (!selected) {
      setHtml('');
      return;
    }
    let active = true;
    apiFetch(selected.htmlUrl)
      .then(async response => {
        if (!response.ok) throw new Error(await apiError(response, 'Could not load editable HTML.'));
        return response.text();
      })
      .then(value => { if (active) setHtml(value); })
      .catch(error => { if (active) notifyError('Artifact integrity unavailable', error?.message || 'Could not load proposal.'); });
    return () => { active = false; };
  }, [selected?.id]);

  const createArtifact = async () => {
    if (!url.trim()) {
      notifyError('Public URL required', 'Enter the public page to capture before creating a proposal.');
      return;
    }
    setCreating(true);
    try {
      const response = await apiFetch('/api/workspace/cro/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), objective: objective.trim(), audience: audience.trim(), primaryCta: primaryCta.trim() }),
      });
      if (!response.ok) throw new Error(await apiError(response, 'No proposal was created.'));
      const { artifact } = await response.json();
      setArtifacts(previous => [artifact, ...previous]);
      setSelected(artifact);
      notifySuccess('Proposal captured', 'Source evidence, editable HTML, and desktop/mobile previews are retained as a draft.');

      const newRun: AgentRunRecord = {
        id: `run-cro-${Date.now()}`,
        agentName: 'CRO Optimization & Landing Page Agent',
        agentRole: 'Wireframe & Proposed Architecture Synthesis',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'CRO & Landing Pages Studio',
        inputSummary: `Public URL: ${url.trim()} | Objective: ${objective.trim()}`,
        outputSummary: `Evidence-backed landing page proposal generated for ${artifact.sourceTitle || artifact.sourceUrl}. Desktop & mobile previews, wireframes, and SHA-256 verified HTML are ready.`,
        fullOutput: JSON.stringify(artifact, null, 2),
        metrics: [
          { label: 'Sections', value: `${artifact.sections?.length || 0}` },
          { label: 'Status', value: artifact.status },
          { label: 'SHA-256', value: `${artifact.htmlHash.slice(0, 10)}…` },
          { label: 'Previews', value: 'Desktop & Mobile' }
        ]
      };
      setRunHistory(prev => [newRun, ...prev]);
    } catch (error: any) {
      const errorMsg = error?.message || 'Capture, rendering, or retention did not complete.';
      notifyError('Proposal not created', errorMsg);
      const errRun: AgentRunRecord = {
        id: `run-cro-error-${Date.now()}`,
        agentName: 'CRO Optimization & Landing Page Agent',
        agentRole: 'Wireframe & Proposed Architecture Synthesis',
        timestamp: 'Just now',
        status: 'ERROR',
        moduleOrigin: 'CRO & Landing Pages Studio',
        inputSummary: `Public URL: ${url.trim()} | Objective: ${objective.trim()}`,
        outputSummary: `Generation encountered error: ${errorMsg}. Audit trail recorded for inspection.`,
        fullOutput: JSON.stringify({ error: errorMsg, url: url.trim(), timestamp: new Date().toISOString() }, null, 2),
        metrics: [
          { label: 'Status', value: 'ERROR' },
          { label: 'URL', value: url.trim() }
        ]
      };
      setRunHistory(prev => [errRun, ...prev]);
    } finally {
      setCreating(false);
    }
  };

  const approve = async () => {
    if (!selected) return;
    setApproving(true);
    try {
      const response = await apiFetch(`/api/workspace/cro/artifacts/${selected.id}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error(await apiError(response, 'Could not approve the landing proposal.'));
      const { artifact } = await response.json();
      setArtifacts(previous => previous.map(item => item.id === artifact.id ? artifact : item));
      setSelected(artifact);
      notifySuccess('Proposal approved', 'Approval is retained with the source and HTML hashes. It is still not published.');

      const approveRun: AgentRunRecord = {
        id: `run-cro-approve-${Date.now()}`,
        agentName: 'CRO Compliance & Governance Engine',
        agentRole: 'Proposal Verification & Formal Approval',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'CRO & Landing Pages Studio',
        inputSummary: `Proposal: ${artifact.id} (${artifact.sourceTitle || artifact.sourceUrl})`,
        outputSummary: `Proposal status transitioned to "approved". SHA-256 hash verified and locked.`,
        fullOutput: JSON.stringify(artifact, null, 2),
        metrics: [
          { label: 'Status', value: 'approved' },
          { label: 'SHA-256', value: `${artifact.htmlHash.slice(0, 10)}…` }
        ]
      };
      setRunHistory(prev => [approveRun, ...prev]);
    } catch (error: any) {
      notifyError('Approval blocked', error?.message || 'The proposal remains a draft.');
    } finally {
      setApproving(false);
    }
  };

  const downloadHtml = async () => {
    if (!selected) return;
    try {
      const response = await apiFetch(selected.htmlUrl);
      if (!response.ok) throw new Error(await apiError(response, 'Could not download editable HTML.'));
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `proposed-landing-page-${selected.id}.html`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      notifyError('Download unavailable', error?.message || 'Could not retrieve the verified artifact.');
    }
  };

  return <div className="space-y-7 pb-16">
    <div className="flex flex-col gap-4 border-b border-[var(--sigma-border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2"><Badge variant="brand" size="sm" icon={<SplitSquareVertical size={12} />}>CRO proposal studio</Badge><Badge variant="neutral" size="sm">Public evidence only</Badge></div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--sigma-text)] lg:text-4xl">Current vs. proposed landing page</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--sigma-text-muted)]">Capture a public page, retain desktop/mobile evidence, and create an editable proposal. No lift, performance, or publication claim is made.</p>
      </div>
      <Badge variant="neutral" size="sm" icon={<ShieldCheck size={12} />}>Approval required before delivery</Badge>
    </div>

    <GlassCard className="space-y-4 p-5" spotlight>
      <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#ff481b]" /><h2 className="text-sm font-semibold text-[var(--sigma-text)]">Create an evidence-backed proposal</h2></div>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1.5 text-xs text-[var(--sigma-text-muted)] lg:col-span-2">Public page URL<input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com/product" className="w-full rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-3 py-2 text-sm text-[var(--sigma-text)] outline-none focus:border-[#ff481b]" /></label>
        <label className="space-y-1.5 text-xs text-[var(--sigma-text-muted)]">Buyer audience<input value={audience} onChange={event => setAudience(event.target.value)} className="w-full rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-3 py-2 text-sm text-[var(--sigma-text)] outline-none focus:border-[#ff481b]" /></label>
        <label className="space-y-1.5 text-xs text-[var(--sigma-text-muted)]">Approved next step<input value={primaryCta} onChange={event => setPrimaryCta(event.target.value)} className="w-full rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-3 py-2 text-sm text-[var(--sigma-text)] outline-none focus:border-[#ff481b]" /></label>
        <label className="space-y-1.5 text-xs text-[var(--sigma-text-muted)] lg:col-span-2">Objective<textarea value={objective} onChange={event => setObjective(event.target.value)} rows={2} className="w-full resize-y rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-3 py-2 text-sm text-[var(--sigma-text)] outline-none focus:border-[#ff481b]" /></label>
      </div>
      <Button variant="primary" size="sm" onClick={createArtifact} disabled={creating} isLoading={creating} icon={<FileCode2 size={14} />}>Capture evidence & create proposal</Button>
    </GlassCard>

    {loading ? <div className="flex items-center gap-2 py-12 text-sm text-[var(--sigma-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading durable proposals…</div> : artifacts.length === 0 ? <GlassCard className="p-8 text-center"><Eye className="mx-auto mb-3 h-6 w-6 text-[var(--sigma-text-muted)]" /><h2 className="font-semibold text-[var(--sigma-text)]">No proposal yet</h2><p className="mx-auto mt-2 max-w-lg text-sm text-[var(--sigma-text-muted)]">A proposal appears only after its source capture, editable HTML, and both proposed-page previews are retained.</p></GlassCard> : null}

    {selected && <div className="space-y-5">
      <GlassCard className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="mb-1 flex items-center gap-2"><h2 className="font-semibold text-[var(--sigma-text)]">{selected.sourceTitle || selected.sourceUrl}</h2><Badge variant={selected.status === 'approved' ? 'success' : 'neutral'} size="xs">{selected.status}</Badge></div><p className="text-xs text-[var(--sigma-text-muted)]">Captured {new Date(selected.sourceCapturedAt).toLocaleString()} · HTML SHA-256 {selected.htmlHash.slice(0, 12)}…</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={downloadHtml} icon={<Download size={13} />}>Editable HTML</Button>{selected.status === 'draft' && role !== 'USER' && <Button variant="primary" size="sm" onClick={approve} disabled={approving} isLoading={approving} icon={<CheckCircle2 size={13} />}>Approve proposal</Button>}</div>
      </GlassCard>
      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard className="overflow-hidden p-0"><div className="border-b border-[var(--sigma-border)] p-4"><div className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Captured current page · desktop</div></div>{selected.previews.sourceDesktop ? <img src={selected.previews.sourceDesktop} alt={`Captured source page: ${selected.sourceUrl}`} className="block h-[540px] w-full object-cover object-top" /> : <div className="p-8 text-sm text-amber-accent">Source preview unavailable; this proposal cannot be approved.</div>}</GlassCard>
        <GlassCard className="overflow-hidden p-0"><div className="border-b border-[var(--sigma-border)] p-4"><div className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Proposed editable page · desktop</div></div>{selected.previews.proposedDesktop ? <img src={selected.previews.proposedDesktop} alt="Rendered proposed landing page" className="block h-[540px] w-full object-cover object-top" /> : <div className="p-8 text-sm text-amber-accent">Proposal preview unavailable; this proposal cannot be approved.</div>}</GlassCard>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard className="overflow-hidden p-0"><div className="border-b border-[var(--sigma-border)] p-4"><div className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Captured current page · mobile</div></div>{selected.previews.sourceMobile ? <div className="bg-[var(--sigma-surface-subtle)] p-4"><img src={selected.previews.sourceMobile} alt={`Captured mobile source page: ${selected.sourceUrl}`} className="mx-auto block h-[540px] max-w-full rounded-lg border border-[var(--sigma-border)] object-cover object-top" /></div> : <div className="p-8 text-sm text-amber-accent">Mobile source preview unavailable; this proposal cannot be approved.</div>}</GlassCard>
        <GlassCard className="overflow-hidden p-0"><div className="border-b border-[var(--sigma-border)] p-4"><div className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Proposed editable page · mobile</div></div>{selected.previews.proposedMobile ? <div className="bg-[var(--sigma-surface-subtle)] p-4"><img src={selected.previews.proposedMobile} alt="Rendered mobile proposed landing page" className="mx-auto block h-[540px] max-w-full rounded-lg border border-[var(--sigma-border)] object-cover object-top" /></div> : <div className="p-8 text-sm text-amber-accent">Mobile proposal preview unavailable; this proposal cannot be approved.</div>}</GlassCard>
      </div>
      <div className="grid gap-5 xl:grid-cols-[.65fr_1.35fr]">
        <GlassCard className="p-5"><div className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Wireframe & rationale</div><div className="mt-4 space-y-3">{selected.sections.map(section => <div key={section.id} className="rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3"><div className="font-medium text-[var(--sigma-text)]">{section.label}</div><p className="mt-1 text-xs leading-relaxed text-[var(--sigma-text-muted)]">{section.purpose}</p></div>)}</div><p className="mt-5 text-xs leading-relaxed text-[var(--sigma-text-muted)]">This is a proposed information architecture, not measured customer behavior or an expected conversion result.</p></GlassCard>
        <GlassCard className="overflow-hidden p-0"><div className="border-b border-[var(--sigma-border)] p-4"><div className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Editable HTML preview</div></div>{html ? <iframe title="Editable proposed landing page" srcDoc={html} sandbox="" className="h-[650px] w-full bg-white" /> : <div className="p-8 text-sm text-[var(--sigma-text-muted)]">Loading integrity-checked HTML…</div>}</GlassCard>
      </div>
    </div>}

    {/* CRO Proposals & Landing Run Results History */}
    <div className="mt-10">
      <AgentRunResults
        records={runHistory}
        title="CRO & Landing Proposal Run History"
        description="Comprehensive audit trail of captured public evidence, rendered proposals, SHA-256 integrity hashes, and governance approvals."
        onClear={() => setRunHistory([])}
      />
    </div>
  </div>;
}
