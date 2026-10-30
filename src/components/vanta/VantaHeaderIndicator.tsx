import React from 'react';
import { Cpu } from 'lucide-react';
import { useVanta } from '@/src/contexts/VantaContext';
import { cn } from '@/src/lib/utils';

export default function VantaHeaderIndicator() {
  const { state, transcriptOpen, setTranscriptOpen, messages } = useVanta();

  const statusConfig = {
    idle: {
      color: 'bg-amber-400',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      text: 'text-amber-400',
      label: 'VANTA',
      ping: false,
    },
    thinking: {
      color: 'bg-purple-400',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.7)]',
      text: 'text-purple-300',
      label: 'THINKING',
      ping: true,
    },
    listening: {
      color: 'bg-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.7)]',
      text: 'text-emerald-300',
      label: 'LISTENING',
      ping: true,
    },
    speaking: {
      color: 'bg-cyan-400',
      glow: 'shadow-[0_0_12px_rgba(34,211,238,0.7)]',
      text: 'text-cyan-300',
      label: 'SPEAKING',
      ping: true,
    },
    error: {
      color: 'bg-rose-400',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.7)]',
      text: 'text-rose-300',
      label: 'ALERT',
      ping: false,
    },
  }[state.phase] || {
    color: 'bg-amber-400',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    text: 'text-amber-400',
    label: 'VANTA',
    ping: false,
  };

  return (
    <button
      type="button"
      onClick={() => setTranscriptOpen(!transcriptOpen)}
      className={cn(
        'group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer',
        transcriptOpen
          ? 'bg-amber-500/15 border-amber-400/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          : 'bg-white/5 border-white/10 text-zinc-300 hover:border-amber-400/30 hover:bg-white/[0.08] hover:text-white'
      )}
      title="VANTA Neural Core · Click to open Intelligence Drawer & Provenance"
      aria-label="Toggle VANTA Neural Core Drawer"
    >
      {/* Micro Neural Core Orb */}
      <div className="relative flex items-center justify-center">
        <span
          className={cn(
            'h-2 w-2 rounded-full transition-all duration-300',
            statusConfig.color,
            statusConfig.glow
          )}
        />
        {statusConfig.ping && (
          <span
            className={cn(
              'absolute h-3 w-3 rounded-full animate-ping opacity-75',
              statusConfig.color
            )}
          />
        )}
      </div>

      <Cpu size={12} className={cn('transition-colors', statusConfig.text)} />
      
      <span className="hidden sm:inline font-black tracking-widest">
        {statusConfig.label}
      </span>

      {messages.length > 0 && (
        <span className="rounded bg-black/40 px-1 py-0.2 text-[11px] text-zinc-400 font-normal">
          {messages.length}
        </span>
      )}
    </button>
  );
}
