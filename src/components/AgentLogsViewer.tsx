import React, { useState, useMemo } from 'react';
import { 
  Terminal, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Cpu,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { CockpitLogItem, ScopedAgent } from '@/src/data/agentCockpitData';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';

interface AgentLogsViewerProps {
  logs: CockpitLogItem[];
  agents: ScopedAgent[];
  activeAgentId?: string;
  onClearLogs?: () => void;
}

export default function AgentLogsViewer({
  logs,
  agents,
  activeAgentId,
  onClearLogs
}: AgentLogsViewerProps) {
  const { notifySuccess, notifyInfo } = useToast();
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>(activeAgentId || 'ALL');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const levels = ['ALL', 'INFO', 'WARN', 'ERROR', 'GATE', 'TOOL', 'REFLECTION'];

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Agent filter
      if (selectedAgentFilter !== 'ALL' && log.agentId !== selectedAgentFilter) {
        return false;
      }
      // Level filter
      if (selectedLevelFilter !== 'ALL' && log.level !== selectedLevelFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = log.message.toLowerCase().includes(q);
        const matchesAgent = log.agentCodename.toLowerCase().includes(q);
        const matchesCategory = log.category.toLowerCase().includes(q);
        return matchesMsg || matchesAgent || matchesCategory;
      }
      return true;
    });
  }, [logs, selectedAgentFilter, selectedLevelFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-telemetry-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess('Logs Exported', `Saved ${filteredLogs.length} log records to JSON.`);
  };

  const handleExportCSV = () => {
    const headers = ['id', 'timestamp', 'agentCodename', 'level', 'category', 'message', 'durationMs'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      l.agentCodename,
      l.level,
      l.category,
      `"${l.message.replace(/"/g, '""')}"`,
      l.durationMs || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-telemetry-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess('Logs Exported', `Saved ${filteredLogs.length} log records to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h4 className="text-base font-bold silver-text flex items-center gap-2">
            <Terminal size={18} className="text-accent" />
            Agent Telemetry & Execution Log Stream
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time audit trails, tool calls, RBAC gate verifications, and self-learning cycles across all agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
          >
            <Download size={13} /> JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
          >
            <Download size={13} /> CSV
          </button>
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search logs by keyword, codename, or tool..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
          />
        </div>

        {/* Agent Filter */}
        <div className="md:col-span-4">
          <select
            value={selectedAgentFilter}
            onChange={e => setSelectedAgentFilter(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent font-mono"
          >
            <option value="ALL">All Agents (Global Stream)</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.codename} — {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedLevelFilter}
            onChange={e => setSelectedLevelFilter(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent font-mono"
          >
            {levels.map(lvl => (
              <option key={lvl} value={lvl}>Level: {lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-2 font-mono text-xs max-h-[500px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 text-muted">
            No telemetry records match current filters.
          </div>
        ) : (
          filteredLogs.map(log => {
            const isExpanded = expandedLogIds.has(log.id);
            return (
              <div
                key={log.id}
                className={cn(
                  "p-3 rounded-xl border transition-all space-y-1.5",
                  log.level === 'GATE' ? "bg-amber-950/15 border-amber-500/30" :
                  log.level === 'WARN' ? "bg-rose-950/15 border-rose-500/30" :
                  log.level === 'REFLECTION' ? "bg-purple-950/20 border-purple-500/30" :
                  log.level === 'TOOL' ? "bg-blue-950/15 border-blue-500/30" :
                  "bg-black/40 border-white/5 hover:border-white/15"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[10px]">{log.timestamp}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-accent text-[10px] font-bold">
                      {log.agentCodename}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] uppercase font-bold",
                      log.level === 'GATE' ? "bg-amber-500/20 text-amber-300" :
                      log.level === 'WARN' ? "bg-rose-500/20 text-rose-300" :
                      log.level === 'REFLECTION' ? "bg-purple-500/20 text-purple-300" :
                      log.level === 'TOOL' ? "bg-blue-500/20 text-blue-300" :
                      "bg-green-500/20 text-green-300"
                    )}>
                      {log.level}
                    </span>
                    <span className="text-[10px] text-zinc-400">[{log.category}]</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    {log.durationMs && <span>{log.durationMs}ms</span>}
                    {log.details && (
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="hover:text-white flex items-center gap-0.5 text-[10px]"
                      >
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span>Payload</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-zinc-200 text-xs leading-relaxed font-mono">
                  {log.message}
                </div>

                {log.details && isExpanded && (
                  <div className="mt-2 p-2.5 bg-black/70 rounded-lg border border-white/10 text-[11px] text-secondary overflow-x-auto">
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
