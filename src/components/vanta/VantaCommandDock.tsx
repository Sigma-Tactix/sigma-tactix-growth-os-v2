import React, { useRef, useState } from 'react';
import { ArrowUp, FilePlus2, Mic, Paperclip, Square, Volume2 } from 'lucide-react';
import { useVanta } from '@/src/contexts/VantaContext';

export default function VantaCommandDock({ compact = false }: { compact?: boolean }) {
  const { state, send, startListening, stopListening, stop, attachFiles, localContexts } = useVanta();
  const [prompt, setPrompt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = ['thinking', 'transcribing', 'speaking'].includes(state.phase);

  const submit = () => {
    const value = prompt.trim();
    if (!value || busy) return;
    setPrompt('');
    void send(value, false);
  };

  return (
    <section className={`rounded-2xl border border-orange-400/20 bg-black/75 p-2.5 shadow-2xl shadow-orange-950/30 backdrop-blur-xl ${compact ? '' : 'w-full'}`} aria-label="VANTA command dock">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-0.5 rounded-xl p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-orange-200 focus-visible:outline-2 focus-visible:outline-orange-400"
          aria-label="Attach local files for this session"
          title="Attach files for this session"
        >
          {compact ? <Paperclip size={17} /> : <FilePlus2 size={18} />}
        </button>
        <input
          ref={fileRef}
          className="hidden"
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.xml,.html,.pdf,.xls,.xlsx,text/*,application/pdf"
          onChange={event => {
            void attachFiles(Array.from(event.target.files || []));
            event.target.value = '';
          }}
        />
        <label className="min-w-0 flex-1">
          <span className="sr-only">Ask VANTA</span>
          <textarea
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={compact ? 1 : 2}
            placeholder={state.provider.verified ? 'Ask VANTA to inspect, explain, or propose…' : 'VANTA needs a verified provider…'}
            disabled={!state.provider.verified}
            className="max-h-32 min-h-11 w-full resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
          />
        </label>
        {busy ? (
          <button type="button" onClick={stop} className="mb-0.5 rounded-xl bg-white/10 p-2.5 text-white hover:bg-white/15" aria-label="Stop VANTA">
            <Square size={17} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!prompt.trim() || !state.provider.verified}
            className="mb-0.5 rounded-xl bg-orange-500 p-2.5 text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Send to VANTA"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        )}
        <button
          type="button"
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); void startListening(); }}
          onPointerUp={stopListening}
          onPointerCancel={stopListening}
          onKeyDown={event => { if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); void startListening(); } }}
          onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); stopListening(); } }}
          disabled={!state.provider.voiceAvailable}
          className={`mb-0.5 rounded-xl p-2.5 transition focus-visible:outline-2 focus-visible:outline-orange-400 ${state.phase === 'listening' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-zinc-300 hover:bg-white/10'} disabled:cursor-not-allowed disabled:opacity-30`}
          aria-label="Hold to talk to VANTA"
          aria-pressed={state.phase === 'listening'}
          title={state.provider.voiceAvailable ? 'Hold to talk' : 'Voice provider not verified'}
        >
          <Mic size={18} />
        </button>
      </div>
      {!compact && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-2 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500">
          <span className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${state.provider.verified ? 'bg-emerald-400' : 'bg-zinc-600'}`} />{state.provider.label}</span>
          <span>{localContexts.length ? `${localContexts.length} session file${localContexts.length === 1 ? '' : 's'}` : 'No local files attached'}</span>
          <span className="flex items-center gap-1"><Volume2 size={11} /> Voice replies only for voice requests</span>
        </div>
      )}
    </section>
  );
}
