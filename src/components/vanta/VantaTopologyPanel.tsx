import React, { useMemo, useState } from 'react';
import { ChevronRight, Search, UnfoldVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { filterVantaTopology } from '@/src/lib/vanta';
import { useVanta } from '@/src/contexts/VantaContext';

export default function VantaTopologyPanel() {
  const { fullTopology, selectedNodeId, setSelectedNodeId, topologyExpanded, setTopologyExpanded } = useVanta();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const visible = useMemo(() => filterVantaTopology(fullTopology, query, topologyExpanded), [fullTopology, query, topologyExpanded]);

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-white/10 bg-black/35" aria-label="Inspectable workspace topology">
      <div className="border-b border-white/10 p-3">
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Filter workspace topology</span>
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Focus modules or work…" className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-8 pr-3 text-xs text-white outline-none focus:border-orange-400/40" />
          </label>
          <button type="button" onClick={() => setTopologyExpanded(!topologyExpanded)} className={`rounded-xl border p-2 ${topologyExpanded ? 'border-orange-400/40 bg-orange-400/10 text-orange-200' : 'border-white/10 text-zinc-500'}`} aria-pressed={topologyExpanded} title="Expand all workspace entities"><UnfoldVertical size={15} /></button>
        </div>
        <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-zinc-600">{visible.nodes.length} real workspace entit{visible.nodes.length === 1 ? 'y' : 'ies'}</p>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {visible.nodes.map(node => (
          <button key={node.id} type="button" onClick={() => setSelectedNodeId(node.id)} onDoubleClick={() => node.route && navigate(node.route)} className={`w-full rounded-xl border p-3 text-left transition ${selectedNodeId === node.id ? 'border-orange-400/45 bg-orange-400/10' : 'border-white/5 bg-white/[0.025] hover:border-white/15'}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${node.status === 'verified' || node.status === 'active' ? 'bg-emerald-400' : node.status === 'approval_required' ? 'bg-amber-400' : node.status === 'unavailable' ? 'bg-red-400' : 'bg-zinc-500'}`} />
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-200">{node.label}</span>
              <ChevronRight size={13} className="text-zinc-600" />
            </div>
            <div className="mt-1.5 flex gap-2 pl-4 text-[9px] font-mono uppercase tracking-wider text-zinc-500"><span>{node.kind}</span><span>·</span><span>{node.status.replace('_', ' ')}</span></div>
            {selectedNodeId === node.id && node.detail && <p className="mt-2 pl-4 text-[11px] leading-4 text-zinc-400">{node.detail}</p>}
          </button>
        ))}
      </div>
    </aside>
  );
}
