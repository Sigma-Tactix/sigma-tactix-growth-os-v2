import React from 'react';
import { BookMarked, ExternalLink, Play, Plus, Route, Share2, ShieldCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVanta } from '@/src/contexts/VantaContext';

const SOURCE_LABELS = { workspace: 'Workspace', vault: 'Vault', document: 'Document', web: 'Web', local: 'Local session' } as const;

export default function VantaTranscriptDrawer({ embedded = false }: { embedded?: boolean }) {
  const { messages, conversations, conversationId, transcriptOpen, setTranscriptOpen, playMessage, approveMemory, dispatchProposal, newConversation, loadConversation, setConversationShared, deleteCurrentConversation, pageContext } = useVanta();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [dispatchedProposalIds, setDispatchedProposalIds] = React.useState<Set<string>>(new Set());
  const current = conversations.find(conversation => conversation.id === conversationId);
  if (!embedded && !transcriptOpen) return null;

  return (
    <aside className={`${embedded ? 'h-full border-l' : 'fixed bottom-5 right-5 top-20 z-50 w-[min(430px,calc(100vw-2rem))] rounded-3xl border'} flex flex-col border-white/10 bg-[#090706]/95 shadow-2xl backdrop-blur-2xl`} aria-label="VANTA transcript and evidence">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-black tracking-wide text-white">Transcript & evidence</h2>
          <p className="text-[10px] font-mono text-zinc-500">Private by default · 30-day conversation retention</p>
        </div>
        {!embedded && <button type="button" onClick={() => setTranscriptOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="Close transcript"><X size={17} /></button>}
      </header>
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-1.5 text-xs font-mono text-zinc-400">
        <span className="truncate">
          <strong className="text-amber-300">{pageContext.clientName}</strong> · {pageContext.objectName}
        </span>
        <span className="shrink-0 text-zinc-500">{pageContext.period}</span>
      </div>
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <label className="min-w-0 flex-1"><span className="sr-only">Conversation history</span><select value={conversationId || ''} onChange={event => { setConfirmDelete(false); if (event.target.value) void loadConversation(event.target.value); }} className="w-full truncate rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] text-zinc-300 outline-none"><option value="">New private conversation</option>{conversations.map(conversation => <option key={conversation.id} value={conversation.id}>{conversation.visibility === 'workspace' ? 'Shared · ' : ''}{conversation.title}</option>)}</select></label>
        <button type="button" onClick={() => { newConversation(); setConfirmDelete(false); }} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white" aria-label="New conversation"><Plus size={13} /></button>
        <button type="button" disabled={!current} onClick={() => void setConversationShared(current?.visibility !== 'workspace')} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-30" aria-label={current?.visibility === 'workspace' ? 'Make conversation private' : 'Share conversation with workspace'}><Share2 size={13} /></button>
        {confirmDelete ? <button type="button" onClick={() => { void deleteCurrentConversation(); setConfirmDelete(false); }} className="rounded-lg bg-red-500 px-2 py-1.5 text-[10px] font-bold text-white">Confirm delete</button> : <button type="button" disabled={!current} onClick={() => setConfirmDelete(true)} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-red-300 disabled:opacity-30" aria-label="Delete conversation"><Trash2 size={13} /></button>}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {!messages.length && (
          <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
            Ask VANTA a question. Answers will show their workspace, vault, document, web, or local provenance here.
          </div>
        )}
        {messages.map(message => (
          <article key={message.id} className={`rounded-2xl border p-3 ${message.role === 'user' ? 'ml-8 border-white/10 bg-white/[0.04]' : 'mr-2 border-orange-400/20 bg-orange-500/[0.055]'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-zinc-500">{message.role === 'assistant' ? 'VANTA' : 'You'}</span>
              {message.role === 'assistant' && <button type="button" onClick={() => void playMessage(message)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-orange-200" aria-label="Play this response"><Play size={13} /></button>}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{message.content}</p>
            {!!message.evidence.length && (
              <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                {message.evidence.map(evidence => (
                  <a key={evidence.id} href={evidence.href || undefined} target={evidence.href ? '_blank' : undefined} rel="noreferrer" className={`flex items-start justify-between gap-2 rounded-xl border border-white/5 bg-black/25 p-2 text-xs ${evidence.href ? 'hover:border-orange-400/30' : 'cursor-default'}`}>
                    <span><span className="mr-2 rounded bg-white/5 px-1.5 py-0.5 text-[11px] uppercase text-orange-200">{SOURCE_LABELS[evidence.sourceType]}</span><span className="text-zinc-300">{evidence.title}</span></span>
                    {evidence.href && <ExternalLink size={12} className="mt-0.5 shrink-0 text-zinc-500" />}
                  </a>
                ))}
              </div>
            )}
            {message.proposal && (
              <div className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-200"><Route size={14} /> Proposed action · {message.proposal.risk} risk</div>
                <h3 className="mt-2 text-sm font-bold text-white">{message.proposal.title}</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{message.proposal.objective}</p>
                <p className="mt-2 text-[11px] text-zinc-500">Expected: {message.proposal.expectedEffect}</p>
                <button type="button" onClick={() => navigate(message.proposal!.targetRoute)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:bg-amber-300">
                  Review in {message.proposal.targetModule} <ExternalLink size={12} />
                </button>
                {message.proposal.dispatchPlan ? (
                  <button
                    type="button"
                    disabled={dispatchedProposalIds.has(message.id)}
                    onClick={() => {
                      void dispatchProposal(message.proposal!).then(() => setDispatchedProposalIds(previous => new Set(previous).add(message.id)));
                    }}
                    className="mt-2 inline-flex items-center gap-2 rounded-xl border border-orange-300/40 px-3 py-2 text-xs font-bold text-orange-100 hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {dispatchedProposalIds.has(message.id) ? 'Queued · awaiting approval' : 'Queue governed mission'}
                  </button>
                ) : null}
                <p className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500"><ShieldCheck size={11} /> No action was executed here.</p>
              </div>
            )}
            {message.memorySuggestion && (
              <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-500/[0.06] p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-200"><BookMarked size={14} /> Suggested durable memory</div>
                <p className="mt-2 text-xs leading-5 text-zinc-300">{message.memorySuggestion}</p>
                <button type="button" onClick={() => void approveMemory(message.memorySuggestion!, message.id)} className="mt-2 rounded-lg border border-blue-300/30 px-2.5 py-1.5 text-xs text-blue-100 hover:bg-blue-400/10">Approve memory</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </aside>
  );
}
