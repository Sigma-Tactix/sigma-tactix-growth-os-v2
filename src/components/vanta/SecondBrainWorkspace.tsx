import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/src/lib/api';
import { hydrateSecondBrainVaults } from '@/src/lib/secondBrainDocuments';
import { buildSecondBrainGraph } from '@/src/lib/secondBrainGraph';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useVanta } from '@/src/contexts/VantaContext';
import VantaCommandDock from './VantaCommandDock';
import MapsBrainOrbit from './MapsBrainOrbit';

export default function SecondBrainWorkspace() {
  const { currentWorkspace } = useWorkspace();
  const { state, retrieval } = useVanta();
  const [showChat, setShowChat] = useState(false);
  const [result, setResult] = useState<{ workspaceId: string; graph: ReturnType<typeof buildSecondBrainGraph> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(null);
    void (async () => {
      try {
        const [docRes, graphRes] = await Promise.all([
          apiFetch('/api/workspace/vault/documents').then((r) => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/workspace/brain/graph').then((r) => r.json()).catch(() => ({ success: false })),
        ]);
        const documents = docRes.success && Array.isArray(docRes.documents) ? docRes.documents : [];
        const knowledgeGraph = graphRes.success ? { entities: graphRes.entities, relationships: graphRes.relationships } : undefined;
        if (!cancelled) {
          setResult({
            workspaceId: currentWorkspace.id,
            graph: buildSecondBrainGraph(hydrateSecondBrainVaults(documents), knowledgeGraph),
          });
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Document index unavailable');
      }
    })();
    return () => { cancelled = true; };
  }, [currentWorkspace.id, attempt]);
  const graph = result?.workspaceId === currentWorkspace.id ? result.graph : null;
  const count = useMemo(() => graph?.nodes.filter(node => node.kind === 'memory').length ?? 0, [graph]);
  return (
    <section className="space-y-3" aria-label="VANTA Second Brain workspace">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">VANTA · Second Brain</h2><p className="text-sm text-[var(--sigma-text-muted)]">{graph ? `${count} stored documents · categorized by vault` : 'Workspace document index'} · VANTA: {state.phase}</p></div>
        <div className="flex gap-3 text-sm"><button type="button" onClick={() => setAttempt(value => value + 1)}>Refresh</button><a href="/vaults">Manage files</a><button type="button" onClick={() => setShowChat(value => !value)} aria-expanded={showChat}>Ask VANTA</button></div>
      </div>
      {showChat && <div className="space-y-2"><VantaCommandDock compact />{state.error && <p role="alert" className="text-sm text-amber-accent">{state.error}</p>}</div>}
      {retrieval && <p role="status" className="text-xs text-[var(--sigma-text-muted)]">Last chat retrieval: {retrieval.count} documents · {retrieval.method}</p>}
      {error ? <div role="alert" className="rounded-xl border border-amber-500/30 p-6">{error}. <button type="button" onClick={() => setAttempt(value => value + 1)} className="underline">Retry</button></div>
        : !graph ? <p role="status">Loading workspace documents…</p>
        : <><p className="text-xs text-[var(--sigma-text-muted)]">{count === 0 ? 'No stored documents returned. Empty vault categories are shown.' : 'Circle = vault · diamond = document. Select a node for details.'} Drag to orbit in 3D; scroll to zoom.</p><div className="relative h-[700px] overflow-hidden rounded-2xl border border-[var(--sigma-border)]"><MapsBrainOrbit graph={graph} /></div></>}
    </section>
  );
}

