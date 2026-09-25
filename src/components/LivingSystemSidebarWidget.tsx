import React from 'react';
import { Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VantaOrb from './vanta/VantaOrb';
import { useVanta } from '@/src/contexts/VantaContext';
import { isVantaReleaseEnabled } from '@/src/lib/vantaFeatureFlag';

export default function LivingSystemSidebarWidget({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const { state, setDockOpen, topology } = useVanta();
  const navigate = useNavigate();

  if (!isVantaReleaseEnabled()) return null;

  if (!isSidebarOpen) {
    return (
      <button type="button" onClick={() => setDockOpen(true)} className="relative mx-auto mb-3 h-11 w-11 overflow-hidden rounded-2xl border border-orange-400/30 bg-black shadow-lg shadow-orange-950/40 focus-visible:outline-2 focus-visible:outline-orange-400" title="Open VANTA">
        <VantaOrb phase={state.phase} amplitude={state.audioAmplitude} compact className="h-full w-full" />
        <span className="sr-only">Open VANTA</span>
      </button>
    );
  }

  return (
    <section className="relative mx-3 mb-3 overflow-hidden rounded-2xl border border-orange-500/25 bg-[#080402] shadow-xl shadow-orange-950/25" aria-label="VANTA mini orb">
      <button type="button" onClick={() => setDockOpen(true)} className="relative block h-28 w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-orange-400">
        <VantaOrb phase={state.phase} amplitude={state.audioAmplitude} compact className="h-full w-full" />
        <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/70 px-2 py-1 text-[8px] font-mono font-bold uppercase tracking-[0.18em] text-orange-100 backdrop-blur">VANTA · {state.phase.replace('_', ' ')}</span>
      </button>
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] px-3 py-2.5">
        <button type="button" onClick={() => setDockOpen(true)} className="min-w-0 text-left">
          <span className="block text-xs font-bold text-white">Ask the Sigma brain</span>
          <span className="block truncate text-[9px] font-mono text-zinc-500">{state.provider.label} · {topology.nodes.length} visible entit{topology.nodes.length === 1 ? 'y' : 'ies'}</span>
        </button>
        <button type="button" onClick={() => navigate('/living-system')} className="rounded-lg border border-white/10 p-2 text-zinc-500 hover:border-orange-400/30 hover:text-orange-200" aria-label="Open full VANTA experience"><Maximize2 size={13} /></button>
      </div>
    </section>
  );
}
