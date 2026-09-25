import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Gauge, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import VantaOrb from '@/src/components/vanta/VantaOrb';
import VantaCommandDock from '@/src/components/vanta/VantaCommandDock';
import VantaTranscriptDrawer from '@/src/components/vanta/VantaTranscriptDrawer';
import VantaTopologyPanel from '@/src/components/vanta/VantaTopologyPanel';
import VantaProviderPanel from '@/src/components/vanta/VantaProviderPanel';
import { useVanta } from '@/src/contexts/VantaContext';
import { Button, Badge } from '@/src/components/ui';
import type { VantaPhase } from '@/src/lib/vanta';

const LAB_PHASES: VantaPhase[] = ['offline', 'idle', 'listening', 'transcribing', 'thinking', 'speaking', 'inspecting', 'proposing', 'awaiting_confirmation', 'success', 'warning', 'error'];

export default function LivingSystemPage() {
  const { state, topology, selectedNodeId, setSelectedNodeId, toggleInspect, transcriptOpen, setTranscriptOpen } = useVanta();
  const location = useLocation();
  const labEnabled = new URLSearchParams(location.search).has('vantaLab');
  const [labPhase, setLabPhase] = useState<VantaPhase>('idle');
  const displayPhase = labEnabled ? labPhase : state.phase;
  const selectedNode = useMemo(() => topology.nodes.find(node => node.id === selectedNodeId), [selectedNodeId, topology.nodes]);

  return (
    <main className="relative flex h-[calc(100vh-4rem)] min-h-[680px] flex-col overflow-hidden rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-bg)] shadow-2xl">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:32px_32px]" />

      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sigma-border)] bg-[var(--sigma-surface)]/80 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--sigma-vermilion)]/30 bg-[var(--sigma-vermilion)]/10 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--sigma-vermilion)] shadow-[0_0_8px_var(--sigma-vermilion)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-white uppercase">VANTA</h1>
              <Badge variant="vermilion" size="sm">Sigma Intelligence</Badge>
            </div>
            <p className="text-[11px] text-zinc-400">Inspects evidence, explains causality, and proposes work. Never executes silently.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state.provider.decisionRuntime && (
            <span
              className="hidden items-center gap-1.5 rounded-full border border-[var(--sigma-border)] bg-black/30 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 md:flex"
              title={state.provider.decisionRuntime.detail}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${state.provider.decisionRuntime.reachable ? 'bg-violet-400' : 'bg-zinc-600'}`} />
              Laya · {state.provider.decisionRuntime.state.replace('_', ' ')}
            </span>
          )}
          <span className="hidden items-center gap-1.5 rounded-full border border-[var(--sigma-border)] bg-black/30 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 sm:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${state.provider.verified ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            {state.provider.label}
          </span>
          <VantaProviderPanel />
          <button
            type="button"
            onClick={() => setTranscriptOpen(!transcriptOpen)}
            className={`rounded-xl border p-2 text-xs transition ${transcriptOpen ? 'border-[var(--sigma-vermilion)]/40 bg-[var(--sigma-vermilion)]/10 text-white' : 'border-[var(--sigma-border)] text-zinc-400 hover:text-white bg-[var(--sigma-surface)]'}`}
            aria-label="Toggle transcript"
          >
            <MessageSquareText size={16} />
          </button>
          <Button
            variant={state.inspectMode ? "secondary" : "outline"}
            size="sm"
            onClick={toggleInspect}
            leftIcon={state.inspectMode ? <EyeOff size={14} /> : <Eye size={14} />}
          >
            <span className="hidden sm:inline">{state.inspectMode ? 'Exit inspect' : 'Inspect system'}</span>
          </Button>
        </div>
      </header>

      {labEnabled && (
        <div className="relative z-20 flex flex-wrap items-center gap-2 border-b border-[var(--sigma-border)] bg-[var(--sigma-surface)] px-4 py-2" aria-label="VANTA visual fidelity lab">
          <span className="mr-2 flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[var(--sigma-vermilion)]"><Gauge size={12} /> Fidelity lab</span>
          <div className="sigma-segmented font-mono">
            {LAB_PHASES.map(phase => (
              <button
                key={phase}
                type="button"
                onClick={() => setLabPhase(phase)}
                className={`sigma-segment uppercase ${labPhase === phase ? 'sigma-segment-active' : ''}`}
              >
                {phase.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_310px]">
        <section className="relative min-h-[460px] overflow-hidden" aria-label="VANTA neural core">
          <VantaOrb phase={displayPhase} amplitude={state.audioAmplitude} inspectMode={state.inspectMode || displayPhase === 'inspecting'} topology={topology} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} className="h-full w-full" />
          <div className="pointer-events-none absolute left-5 top-5 z-10 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Current state</p>
            <p className="text-xs font-bold uppercase tracking-wider text-white">{displayPhase.replace('_', ' ')}</p>
          </div>
          {selectedNode && state.inspectMode && (
            <div className="absolute left-4 top-20 z-20 max-w-xs rounded-xl border border-[var(--sigma-border)] bg-black/85 p-3.5 backdrop-blur-xl shadow-xl">
              <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--sigma-vermilion)]">{selectedNode.kind} · {selectedNode.status.replace('_', ' ')}</div>
              <h2 className="mt-1 text-xs font-bold text-white">{selectedNode.label}</h2>
              {selectedNode.detail && <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{selectedNode.detail}</p>}
            </div>
          )}
          <div className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-3xl md:inset-x-8 md:bottom-6"><VantaCommandDock /></div>
          <div className="pointer-events-none absolute bottom-32 left-5 hidden items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 md:flex">
            <ShieldCheck size={12} className="text-emerald-400" /> Evidence before claims · approval before change
          </div>
        </section>
        <div className="hidden min-h-0 lg:block"><VantaTopologyPanel /></div>
      </div>
      <VantaTranscriptDrawer />
    </main>
  );
}
