import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  FileText,
  Share2,
  Video,
  Search,
  Bot,
  Sparkles,
  Trash2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export interface RunResult {
  id: string;
  timestamp: string;
  type: 'TEXT' | 'IMAGE' | 'SOCIAL_CAMPAIGN' | 'AUDIT_REPORT' | 'AGENT_LOG' | 'VIDEO_STORYBOARD' | 'GSC_FETCH';
  title: string;
  summary: string;
  model?: string;
  durationMs?: number;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  output?: string;
  imageUrl?: string;
  metadata?: Record<string, string>;
}

const TYPE_CONFIG: Record<RunResult['type'], { icon: React.ElementType; label: string; color: string }> = {
  TEXT: { icon: FileText, label: 'Text Generation', color: 'text-blue-400' },
  IMAGE: { icon: ImageIcon, label: 'Image Synthesis', color: 'text-amber-400' },
  SOCIAL_CAMPAIGN: { icon: Share2, label: 'Social Campaign', color: 'text-purple-400' },
  AUDIT_REPORT: { icon: Search, label: 'Audit Report', color: 'text-emerald-400' },
  AGENT_LOG: { icon: Bot, label: 'Agent Dispatch', color: 'text-cyan-400' },
  VIDEO_STORYBOARD: { icon: Video, label: 'Video Storyboard', color: 'text-rose-400' },
  GSC_FETCH: { icon: Search, label: 'Search Console Fetch', color: 'text-teal-400' }
};

const STATUS_BADGE: Record<RunResult['status'], { label: string; classes: string }> = {
  SUCCESS: { label: 'Complete', classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  PARTIAL: { label: 'Partial', classes: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  ERROR: { label: 'Error', classes: 'bg-red-400/10 text-red-400 border-red-400/20' }
};

export interface AgentRunRecord {
  id: string;
  agentName?: string;
  agentRole?: string;
  timestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  moduleOrigin?: string;
  inputSummary?: string;
  outputSummary?: string;
  fullOutput?: string;
  imageUrl?: string;
  metrics?: { label: string; value: string }[];
}

interface AgentRunResultsProps {
  results?: RunResult[];
  records?: AgentRunRecord[];
  title?: string;
  description?: string;
  onClear?: () => void;
  maxVisible?: number;
  className?: string;
}

export default function AgentRunResults({ 
  results, 
  records, 
  title, 
  description, 
  onClear, 
  maxVisible = 20, 
  className 
}: AgentRunResultsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Normalize results or records into unified RunResult array
  const normalizedResults: RunResult[] = React.useMemo(() => {
    if (results && results.length > 0) return results;
    if (records && records.length > 0) {
      return records.map(r => {
        const metadata: Record<string, string> = {};
        if (r.agentName) metadata['Agent'] = r.agentName;
        if (r.agentRole) metadata['Role'] = r.agentRole;
        if (r.moduleOrigin) metadata['Origin'] = r.moduleOrigin;
        if (r.metrics) {
          r.metrics.forEach(m => {
            metadata[m.label] = m.value;
          });
        }

        return {
          id: r.id,
          timestamp: r.timestamp,
          type: r.imageUrl ? 'IMAGE' : (r.moduleOrigin?.includes('Video') ? 'VIDEO_STORYBOARD' : r.moduleOrigin?.includes('Social') ? 'SOCIAL_CAMPAIGN' : 'TEXT'),
          title: r.inputSummary || r.agentName || 'Agent Execution',
          summary: r.outputSummary || 'Execution completed.',
          model: r.agentRole || 'Autonomous Agent Swarm',
          status: r.status,
          output: r.fullOutput,
          imageUrl: r.imageUrl,
          metadata
        };
      });
    }
    return [];
  }, [results, records]);

  if (normalizedResults.length === 0) return null;

  const toggleItem = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const visibleResults = normalizedResults.slice(0, maxVisible);

  return (
    <div className={cn("mt-8", className)}>
      {/* Section Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
        className="w-full flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl cursor-pointer hover:bg-zinc-900/80 transition-all group select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {title || "Run Results"}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                {normalizedResults.length} {normalizedResults.length === 1 ? 'RUN' : 'RUNS'}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              {description || "AI Agent & Swarm execution outputs"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClear && normalizedResults.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all border border-zinc-700/50"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </div>

      {/* Results List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 mt-2 max-h-[600px] overflow-y-auto pr-1">
              {visibleResults.map((result) => {
                const config = TYPE_CONFIG[result.type];
                const statusBadge = STATUS_BADGE[result.status];
                const Icon = config.icon as any;
                const isOpen = expandedIds.has(result.id);

                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-zinc-800/80 rounded-xl bg-zinc-900/30 backdrop-blur-sm overflow-hidden"
                  >
                    {/* Result Header */}
                    <button
                      onClick={() => toggleItem(result.id)}
                      className="w-full flex items-center justify-between p-3.5 cursor-pointer hover:bg-zinc-800/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", `${config.color.replace('text-', 'bg-').replace('-400', '-400/10')}`)}>
                          <Icon className={cn("w-3.5 h-3.5", config.color)} />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{result.title}</div>
                          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                            <span className={config.color}>{config.label}</span>
                            {result.model && (
                              <>
                                <span className="text-zinc-700">•</span>
                                <span>{result.model}</span>
                              </>
                            )}
                            {result.durationMs && (
                              <>
                                <span className="text-zinc-700">•</span>
                                <Clock className="w-2.5 h-2.5 inline" />
                                <span>{(result.durationMs / 1000).toFixed(1)}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500">{result.timestamp}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border", statusBadge.classes)}>
                          {statusBadge.label}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3.5 pb-3.5 space-y-3 border-t border-zinc-800/60 pt-3">
                            {/* Summary */}
                            <p className="text-xs text-zinc-300 leading-relaxed">{result.summary}</p>

                            {/* Image Preview */}
                            {result.imageUrl && (
                              <div className="rounded-xl overflow-hidden border border-zinc-800/80 max-h-60">
                                <img src={result.imageUrl} alt={result.title} className="w-full h-full object-cover" />
                              </div>
                            )}

                            {/* Output Text */}
                            {result.output && (
                              <div className="p-3 bg-black/50 rounded-xl border border-zinc-800/60 max-h-48 overflow-y-auto">
                                <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">{result.output}</pre>
                              </div>
                            )}

                            {/* Metadata Tags */}
                            {result.metadata && Object.keys(result.metadata).length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(result.metadata).map(([key, value]) => (
                                  <span key={key} className="px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/40 text-[10px] font-mono text-zinc-400">
                                    {key}: <span className="text-zinc-200">{value}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                              {(result.output || result.summary) && (
                                <button
                                  onClick={() => handleCopy(result.output || result.summary, result.id)}
                                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all border border-zinc-700/50"
                                >
                                  {copiedId === result.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  {copiedId === result.id ? 'Copied' : 'Copy Output'}
                                </button>
                              )}
                              {result.imageUrl && (
                                <a
                                  href={result.imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all border border-zinc-700/50"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </a>
                              )}
                              <button
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all border border-zinc-700/50"
                                onClick={() => {
                                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `run-result-${result.id}.json`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <Download className="w-3 h-3" /> Export JSON
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Helper to create a RunResult entry */
export function createRunResult(
  type: RunResult['type'],
  title: string,
  summary: string,
  opts?: Partial<RunResult>
): RunResult {
  return {
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type,
    title,
    summary,
    status: 'SUCCESS',
    ...opts
  };
}
