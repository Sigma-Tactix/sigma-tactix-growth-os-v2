import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, FolderSync, Sparkles, X, Lock } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/lib/utils';
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
  const [selectedVaultId, setSelectedVaultId] = useState<string>('all');
  const [result, setResult] = useState<{
    workspaceId: string;
    vaults: ReturnType<typeof hydrateSecondBrainVaults>;
    graph: ReturnType<typeof buildSecondBrainGraph>;
  } | null>(null);
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
        const vaults = hydrateSecondBrainVaults(documents);
        if (!cancelled) {
          setResult({
            workspaceId: currentWorkspace.id,
            vaults,
            graph: buildSecondBrainGraph(vaults, knowledgeGraph),
          });
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Document index unavailable');
      }
    })();
    return () => { cancelled = true; };
  }, [currentWorkspace.id, attempt]);

  const graph = result?.workspaceId === currentWorkspace.id ? result.graph : null;
  const vaults = result?.workspaceId === currentWorkspace.id ? result.vaults : [];
  const count = useMemo(() => graph?.nodes.filter(node => node.kind === 'memory').length ?? 0, [graph]);

  // Direct Vault Filtering: highlights the chosen Knowledge Vault while preserving Core topology
  const filteredGraph = useMemo(() => {
    if (!graph || selectedVaultId === 'all') return graph;
    const targetVault = vaults.find(v => v.id === selectedVaultId);
    const targetArea = targetVault?.name;

    const filteredNodes = graph.nodes.filter(node =>
      node.id === 'second-brain-core' ||
      node.id === selectedVaultId ||
      (targetArea && node.area === targetArea) ||
      node.sourceCategory === selectedVaultId
    );
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = graph.links.filter(link => {
      const sId = typeof link.source === 'string' ? link.source : (link.source as { id?: string })?.id;
      const tId = typeof link.target === 'string' ? link.target : (link.target as { id?: string })?.id;
      return sId && tId && nodeIds.has(sId) && nodeIds.has(tId);
    });

    return {
      ...graph,
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [graph, selectedVaultId, vaults]);

  return (
    <section className="space-y-4" aria-label="VANTA Second Brain workspace">
      {/* Header Deck: Semantic Tokens, Optical Balance, Zero Middle Dots */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] shadow-[var(--sigma-shadow-sm)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--sigma-text)]">
              VANTA Synaptic Knowledge Engine
            </h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--sigma-primary)]/10 text-[var(--sigma-primary)] border border-[var(--sigma-primary)]/20">
              Enclave Active
            </span>
          </div>
          <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5">
            Client Enclave: <span className="text-[var(--sigma-text-soft)] font-medium">{currentWorkspace.name || 'Default Enclave'}</span>
            {' — '}
            {graph ? `${count} indexed documents across ${vaults.length} Knowledge Vaults` : 'Connecting to workspace index'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={13} />}
            onClick={() => setAttempt(value => value + 1)}
          >
            Refresh
          </Button>
          <a
            href="/vaults"
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface)] hover:bg-[var(--sigma-surface-subtle)] text-xs font-medium text-[var(--sigma-text-soft)] hover:text-[var(--sigma-text)] transition-[background-color,border-color,color] duration-150"
          >
            <FolderSync size={13} />
            <span>Manage Vaults</span>
          </a>
          <Button
            variant={showChat ? 'primary' : 'secondary'}
            size="sm"
            leftIcon={<Sparkles size={13} />}
            onClick={() => setShowChat(value => !value)}
            aria-expanded={showChat}
          >
            {showChat ? 'Close Co-Pilot' : 'Ask VANTA'}
          </Button>
        </div>
      </div>

      {/* Simple & Operable Horizontal Knowledge Vault Filter Strip */}
      {vaults.length > 0 && (
        <nav aria-label="Knowledge Vault category filters" className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[var(--sigma-text-muted)] font-medium text-xs shrink-0 mr-1">Vault:</span>
          <button
            type="button"
            onClick={() => setSelectedVaultId('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium text-xs shrink-0 transition-[background-color,color,border-color] duration-150 cursor-pointer',
              selectedVaultId === 'all'
                ? 'bg-[var(--sigma-primary)] text-[var(--sigma-on-primary)] shadow-sm font-semibold'
                : 'bg-[var(--sigma-surface)] border border-[var(--sigma-border)] text-[var(--sigma-text-soft)] hover:bg-[var(--sigma-surface-subtle)] hover:text-[var(--sigma-text)]'
            )}
          >
            All Vaults ({count})
          </button>
          {vaults.map((vault) => {
            const isSelected = selectedVaultId === vault.id;
            const isSecret = vault.id === 'executive-vault' || vault.id === 'credentials-vault';
            return (
              <button
                key={vault.id}
                type="button"
                onClick={() => setSelectedVaultId(vault.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs shrink-0 transition-[background-color,color,border-color] duration-150 cursor-pointer',
                  isSelected
                    ? 'bg-[var(--sigma-surface-raised)] border border-[var(--sigma-primary)] text-[var(--sigma-primary)] shadow-sm ring-1 ring-[var(--sigma-primary)]/20'
                    : 'bg-[var(--sigma-surface)] border border-[var(--sigma-border)] text-[var(--sigma-text-soft)] hover:bg-[var(--sigma-surface-subtle)] hover:text-[var(--sigma-text)]'
                )}
              >
                {isSecret && <Lock size={11} className="text-amber-500 shrink-0" />}
                <span>{vault.name}</span>
                <span className={cn(
                  'text-[10px] font-mono px-1 rounded',
                  isSelected ? 'bg-[var(--sigma-primary)]/15 text-[var(--sigma-primary)] font-semibold' : 'bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)]'
                )}>
                  {vault.records.length}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Legend & Telemetry Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--sigma-text-muted)]">
        <p>
          {count === 0
            ? 'No stored documents returned for this enclave. Empty vault categories are shown.'
            : 'Circular nodes represent Knowledge Vault categories; diamonds represent verified documents. Drag to orbit in 3D; scroll to zoom.'}
        </p>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--sigma-accent-emerald)]" />
            RLS Scoped
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Secret Vaults Isolated
          </span>
        </div>
      </div>

      {/* Error & Loading States */}
      {error ? (
        <div role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-3">
          <div className="text-sm font-medium text-[var(--sigma-text)]">Document Index Notice</div>
          <p className="text-xs text-[var(--sigma-text-muted)] max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setAttempt(value => value + 1)}>
            Retry Connection
          </Button>
        </div>
      ) : !graph ? (
        <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-12 text-center space-y-3">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-[var(--sigma-primary)] border-t-transparent animate-spin" />
          <p className="text-xs text-[var(--sigma-text-muted)]">Hydrating synaptic graph from client enclave documents...</p>
        </div>
      ) : (
        /* Concentric Stage: Outer Radius (16px) = Inner Radius (12px) + Padding (12px optical balance) */
        <div className="concentric-outer rounded-2xl p-2.5 md:p-3 border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] shadow-[var(--sigma-shadow-sm)]">
          <div className="concentric-inner relative h-[680px] overflow-hidden rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-canvas)]">
            <MapsBrainOrbit graph={filteredGraph} />

            {/* Non-Disruptive Slide-Out VANTA Co-Pilot Inspector Drawer */}
            <AnimatePresence>
              {showChat && (
                <motion.aside
                  initial={{ x: 28, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 28, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-3 right-3 bottom-3 w-full max-w-sm sm:max-w-md rounded-xl border border-[var(--sigma-border-strong)] bg-[var(--sigma-surface)]/95 backdrop-blur-xl shadow-2xl z-20 flex flex-col overflow-hidden"
                  aria-label="VANTA Neural Co-Pilot Drawer"
                >
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/70">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--sigma-primary)] animate-pulse" />
                      <div>
                        <h3 className="text-xs font-semibold text-[var(--sigma-text)]">VANTA Synaptic Co-Pilot</h3>
                        <span className="text-[10px] text-[var(--sigma-text-muted)] font-mono uppercase tracking-wider">
                          Phase: {state.phase}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowChat(false)}
                      className="p-1.5 rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)] transition-[background-color,color] duration-150 cursor-pointer"
                      aria-label="Close VANTA Co-Pilot"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {retrieval && (
                      <div className="p-3 rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] text-xs text-[var(--sigma-text-soft)]">
                        <div className="font-medium text-[var(--sigma-text)] mb-0.5">Last Retrieval Context</div>
                        <div>{retrieval.count} documents retrieved via {retrieval.method}</div>
                      </div>
                    )}
                    {state.error && (
                      <div role="alert" className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-accent">
                        {state.error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <VantaCommandDock compact />
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </section>
  );
}
