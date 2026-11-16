import React from 'react';
import { Expand, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVanta } from '@/src/contexts/VantaContext';
import VantaCommandDock from './VantaCommandDock';
import { isVantaReleaseEnabled, resolveVantaNavigationTarget } from '@/src/lib/vantaFeatureFlag';

// Resolve the same target the sidebar "Living System" link uses, so the dock's
// "Open full VANTA" button follows the same gate (release → /living-system,
// dev preview → ?vantaLab=1). When the release gate is off and there is no dev
// preview target, the dock stays closed rather than pointing at the gated lab.
const developmentEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;
const vantaNavigationTarget = resolveVantaNavigationTarget({
  releaseEnabled: isVantaReleaseEnabled(),
  development: developmentEnv?.DEV === true,
});

export default function VantaCompactDock() {
  const { dockOpen, setDockOpen, setTranscriptOpen, messages } = useVanta();
  const navigate = useNavigate();
  const location = useLocation();
  if (!dockOpen || location.pathname === '/living-system') return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(520px,calc(100vw-2rem))] rounded-3xl border border-orange-400/20 bg-[#080504]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-2xl" role="dialog" aria-label="VANTA compact command dock">
      <div className="mb-2 flex items-center justify-between px-1">
        <div><span className="text-xs font-black tracking-[0.22em] text-orange-100">VANTA</span><span className="ml-2 text-[11px] font-mono uppercase text-zinc-600">Strategic operator</span></div>
        <div className="flex items-center gap-1">
          {!!messages.length && <button type="button" onClick={() => setTranscriptOpen(true)} className="rounded-lg px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/5">Transcript</button>}
          {vantaNavigationTarget && <button type="button" onClick={() => navigate(vantaNavigationTarget.href)} title={vantaNavigationTarget.badge === 'Preview' ? 'Open full VANTA (dev preview)' : 'Open full VANTA'} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="Open full VANTA"><Expand size={15} /></button>}
          <button type="button" onClick={() => setDockOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="Close VANTA dock"><X size={15} /></button>
        </div>
      </div>
      <VantaCommandDock compact />
    </div>
  );
}
