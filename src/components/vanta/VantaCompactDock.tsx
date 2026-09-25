import React from 'react';
import { Expand, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVanta } from '@/src/contexts/VantaContext';
import VantaCommandDock from './VantaCommandDock';
import VantaTranscriptDrawer from './VantaTranscriptDrawer';

export default function VantaCompactDock() {
  const { dockOpen, setDockOpen, setTranscriptOpen, messages } = useVanta();
  const navigate = useNavigate();
  const location = useLocation();
  if (!dockOpen || location.pathname === '/living-system') return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(520px,calc(100vw-2rem))] rounded-3xl border border-orange-400/20 bg-[#080504]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-2xl" role="dialog" aria-label="VANTA compact command dock">
      <div className="mb-2 flex items-center justify-between px-1">
        <div><span className="text-xs font-black tracking-[0.22em] text-orange-100">VANTA</span><span className="ml-2 text-[9px] font-mono uppercase text-zinc-600">Strategic operator</span></div>
        <div className="flex items-center gap-1">
          {!!messages.length && <button type="button" onClick={() => setTranscriptOpen(true)} className="rounded-lg px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/5">Transcript</button>}
          <button type="button" onClick={() => navigate('/living-system')} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="Open full VANTA"><Expand size={15} /></button>
          <button type="button" onClick={() => setDockOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="Close VANTA dock"><X size={15} /></button>
        </div>
      </div>
      <VantaCommandDock compact />
      <VantaTranscriptDrawer />
    </div>
  );
}
