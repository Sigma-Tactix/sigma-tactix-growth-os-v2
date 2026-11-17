import React from 'react';
import { Cpu } from 'lucide-react';
import { useVanta } from '@/src/contexts/VantaContext';
import { cn } from '@/src/lib/utils';

export default function VantaHeaderIndicator() {
  const {
    state,
    transcriptOpen,
    setTranscriptOpen,
    dockOpen,
    setDockOpen,
    messages,
    pageContext,
  } = useVanta();

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

  const handleIndicatorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setDockOpen(!dockOpen);
  };

  const handleTranscriptClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTranscriptOpen(!transcriptOpen);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleIndicatorClick}
        className={cn(
          'group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer',
          dockOpen
            ? 'bg-amber-500/15 border-amber-400/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : 'bg-white/5 border-white/10 text-zinc-300 hover:border-amber-400/30 hover:bg-white/[0.08] hover:text-white'
        )}
        title={`VANTA Neural Core · Active on ${pageContext.objectName} · Click to toggle Command Dock`}
        aria-label="Toggle VANTA Command Dock"
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
      </button>

      {messages.length > 0 && (
        <button
          type="button"
          onClick={handleTranscriptClick}
          className={cn(
            'rounded-lg border px-2 py-1 text-[11px] font-mono transition-all',
            transcriptOpen
              ? 'border-amber-400/40 bg-amber-500/20 text-amber-200'
              : 'border-white/10 bg-black/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
          )}
          title="Open conversation transcript and evidence"
          aria-label="Open conversation transcript"
        >
          {messages.length} msg{messages.length === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
}
