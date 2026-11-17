import React, { useRef, useState } from 'react';
import {
  ArrowUp,
  FilePlus2,
  FileText,
  Mic,
  Paperclip,
  Square,
  Volume2,
  X,
  Eye,
  Building,
  Compass,
  Calendar,
  Scissors,
} from 'lucide-react';
import { VoiceBeam } from 'voice-glow';
import { useVanta } from '@/src/contexts/VantaContext';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VantaCommandDock({ compact = false }: { compact?: boolean }) {
  const {
    state,
    send,
    startListening,
    stopListening,
    stop,
    attachFiles,
    localContexts,
    pageContext,
    setPageSelection,
    removeLocalContext,
    inspectLocalContext,
  } = useVanta();

  const [prompt, setPrompt] = useState('');
  const [inspectedFile, setInspectedFile] = useState<{
    id: string;
    name: string;
    size: number;
    snippet: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const busy = ['thinking', 'transcribing', 'speaking'].includes(state.phase);
  const isListening = state.phase === 'listening';
  const isProcessing = ['thinking', 'transcribing'].includes(state.phase);

  const submit = () => {
    const value = prompt.trim();
    if (!value || busy) return;
    setPrompt('');
    void send(value, false);
  };

  const handleCaptureSelection = () => {
    const selected = typeof window !== 'undefined' ? window.getSelection()?.toString().trim() : '';
    if (selected) {
      setPageSelection(selected.slice(0, 1500));
    }
  };

  const handleInspect = async (id: string, name: string, size: number) => {
    try {
      const details = await inspectLocalContext(id);
      setInspectedFile(details);
    } catch {
      setInspectedFile({
        id,
        name,
        size,
        snippet: 'Preview unavailable or attachment expired.',
      });
    }
  };

  return (
    <VoiceBeam
      level={isListening ? state.audioAmplitude : 0}
      processing={isProcessing}
      colorVariant="colorful"
      theme="dark"
      strength={isListening ? 0.9 : isProcessing ? 0.5 : 0.1}
    >
        <section
          className={`rounded-2xl border border-orange-400/20 bg-black/85 p-3 shadow-2xl shadow-orange-950/30 backdrop-blur-xl ${compact ? '' : 'w-full'}`}
          aria-label="VANTA command dock"
        >
          {/* Active Context Chips */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
            {/* Client Enclave Chip */}
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 font-mono text-amber-200"
              title={`Client Enclave: ${pageContext.clientName} (${pageContext.workspaceId})`}
            >
              <Building size={12} className="text-amber-400" />
              <span className="font-semibold">{pageContext.clientName}</span>
            </span>

            {/* Current Object / Module Chip */}
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1 text-zinc-300"
              title={`Current Object: ${pageContext.objectName} (${pageContext.routePath})`}
            >
              <Compass size={12} className="text-zinc-400" />
              <span className="truncate max-w-[180px]">{pageContext.objectName}</span>
            </span>

            {/* Filter / Period Chip */}
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1 text-zinc-300"
              title={`Active Window: ${pageContext.period} · ${pageContext.filterSummary}`}
            >
              <Calendar size={12} className="text-zinc-400" />
              <span>{pageContext.period}</span>
            </span>

            {/* User Page Selection Chip */}
            {pageContext.selection && (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-orange-200"
                title={`Page Selection: "${pageContext.selection}"`}
              >
                <Scissors size={12} className="text-orange-400" />
                <span className="max-w-[140px] truncate">
                  &ldquo;{pageContext.selection}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setPageSelection(undefined)}
                  className="ml-1 rounded p-0.5 text-orange-300 hover:bg-orange-500/20 hover:text-white"
                  aria-label="Remove page selection context"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          {/* Attached Files Chips */}
          {localContexts.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2 text-xs">
              <span className="font-mono text-zinc-500">Attachments:</span>
              {localContexts.map(file => (
                <span
                  key={file.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-cyan-200"
                >
                  <FileText size={12} className="text-cyan-400" />
                  <span className="max-w-[130px] truncate font-mono">{file.name}</span>
                  <span className="font-mono text-cyan-400/80">({formatBytes(file.size)})</span>
                  <button
                    type="button"
                    onClick={() => void handleInspect(file.id, file.name, file.size)}
                    className="rounded p-0.5 text-cyan-300 hover:bg-cyan-500/20 hover:text-white"
                    title="Inspect attachment snippet"
                    aria-label={`Inspect ${file.name}`}
                  >
                    <Eye size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeLocalContext(file.id)}
                    className="rounded p-0.5 text-cyan-300 hover:bg-rose-500/20 hover:text-rose-200"
                    title="Remove attachment from session"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Attachment Inspection Popover */}
          {inspectedFile && (
            <div className="mb-2 rounded-xl border border-cyan-500/40 bg-zinc-950 p-3 text-xs shadow-lg">
              <div className="mb-1.5 flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-mono font-bold text-cyan-300">
                  {inspectedFile.name} · {formatBytes(inspectedFile.size)}
                </span>
                <button
                  type="button"
                  onClick={() => setInspectedFile(null)}
                  className="rounded p-1 text-zinc-400 hover:text-white"
                  aria-label="Close attachment preview"
                >
                  <X size={13} />
                </button>
              </div>
              <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap font-mono text-zinc-300">
                {inspectedFile.snippet || 'No text extracted.'}
              </pre>
            </div>
          )}

          {/* Input Bar */}
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
            <button
              type="button"
              onClick={handleCaptureSelection}
              className="mb-0.5 rounded-xl p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-orange-200 focus-visible:outline-2 focus-visible:outline-orange-400"
              aria-label="Capture highlighted page text as context"
              title="Capture highlighted text on current page"
            >
              <Scissors size={compact ? 16 : 17} />
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
                placeholder={
                  state.provider.verified
                    ? `Ask VANTA regarding ${pageContext.objectName}…`
                    : 'VANTA requires a verified provider…'
                }
                disabled={!state.provider.verified}
                className="max-h-32 min-h-11 w-full resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
              />
            </label>
            {busy ? (
                <button
                  type="button"
                  onClick={stop}
                  className="mb-0.5 rounded-xl bg-white/10 p-2.5 text-white hover:bg-white/15"
                  aria-label="Stop VANTA"
                >
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
                  onClick={() =>
                    state.phase === 'listening' ? stopListening() : void startListening()
                  }
                  disabled={!state.provider.voiceAvailable || busy}
                  className={`mb-0.5 rounded-xl p-2.5 transition focus-visible:outline-2 focus-visible:outline-orange-400 ${state.phase === 'listening' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-zinc-300 hover:bg-white/10'} disabled:cursor-not-allowed disabled:opacity-30`}
                  aria-label={
                    state.phase === 'listening'
                      ? 'Stop recording and send to VANTA'
                      : 'Start recording for VANTA'
                  }
                  aria-pressed={state.phase === 'listening'}
                  title={
                    state.provider.voiceAvailable
                      ? state.phase === 'listening'
                        ? 'Stop and send'
                        : 'Start voice capture'
                      : 'Voice provider not verified'
                  }
                >
                  <Mic size={18} />
                </button>
              </div>

        {!compact && (
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${state.provider.verified ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                    />
                    {state.provider.label}
                  </span>
                  <span>
                    {localContexts.length
                      ? `${localContexts.length} session file${localContexts.length === 1 ? '' : 's'}`
                      : 'No session attachments'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Volume2 size={12} /> Voice replies for voice queries
                  </span>
                </div>
        )}
              </section>
    </VoiceBeam>
          );
}
