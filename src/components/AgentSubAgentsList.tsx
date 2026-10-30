import React, { useState } from 'react';
import { 
  Bot, 
  Layers, 
  Play, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Plus, 
  X, 
  Terminal, 
  RefreshCw,
  Sparkles,
  Wrench
} from 'lucide-react';
import { SubAgent, ScopedAgent } from '@/src/data/agentCockpitData';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import QuickFixAssistant from './QuickFixAssistant';

interface AgentSubAgentsListProps {
  agent: ScopedAgent;
  onUpdateSubAgents: (updatedSubAgents: SubAgent[]) => void;
  onSubAgentDispatched?: (subAgent: SubAgent, taskTitle: string) => void;
}

export default function AgentSubAgentsList({ 
  agent, 
  onUpdateSubAgents,
  onSubAgentDispatched 
}: AgentSubAgentsListProps) {
  const { notifySuccess, notifyInfo } = useToast();
  const [runningSubAgentId, setRunningSubAgentId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New sub-agent form
  const [newName, setNewName] = useState('');
  const [newCodename, setNewCodename] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTool, setNewTool] = useState('');

  const handleDispatchSubAgent = (sub: SubAgent) => {
    setRunningSubAgentId(sub.id);
    notifyInfo(
      `Dispatched Sub-Agent: ${sub.codename}`,
      `Executing designated task: "${sub.designatedTask}" using tool ${sub.specializedTool}`
    );

    setTimeout(() => {
      setRunningSubAgentId(null);
      const updated = agent.subAgents.map(s => {
        if (s.id === sub.id) {
          return {
            ...s,
            tasksCompleted: s.tasksCompleted + 1,
            lastRunAt: 'Just now',
            status: 'COMPLETED' as const
          };
        }
        return s;
      });
      onUpdateSubAgents(updated);

      notifySuccess(
        `Sub-Agent ${sub.codename} Succeeded`,
        `Completed designated task with 100% telemetry verification.`,
        { category: 'AGENT' }
      );

      if (onSubAgentDispatched) {
        onSubAgentDispatched(sub, `Sub-Task: ${sub.designatedTask}`);
      }
    }, 1800);
  };

  const handleCreateSubAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTask.trim()) return;

    const codename = newCodename.trim() || `${agent.codename}-SUB-${agent.subAgents.length + 1}`;
    const newSub: SubAgent = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      codename,
      designatedTask: newTask.trim(),
      status: 'IDLE',
      specializedTool: newTool.trim() || 'execute_task()',
      tasksCompleted: 0,
      lastRunAt: 'Never',
      accuracy: '100%'
    };

    const updated = [...agent.subAgents, newSub];
    onUpdateSubAgents(updated);
    setIsNewModalOpen(false);
    setNewName('');
    setNewCodename('');
    setNewTask('');
    setNewTool('');

    notifySuccess(
      'Designated Sub-Agent Assigned',
      `${newSub.name} (${newSub.codename}) is now delegated to ${agent.name}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h4 className="text-base font-bold silver-text flex items-center gap-2">
            <Layers size={16} className="text-secondary" />
            Designated Task Sub-Agents ({agent.subAgents.length})
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Granular autonomous workers assigned to isolated, deterministic sub-tasks under {agent.codename}.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-3.5 py-1.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
        >
          <Plus size={14} /> Assign Sub-Agent
        </button>
      </div>

      {/* Sub-agents Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agent.subAgents.map(sub => {
          const isRunning = runningSubAgentId === sub.id;
          return (
            <div
              key={sub.id}
              className="bg-surface/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-secondary/40 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-secondary">{sub.codename}</span>
                  {sub.status === 'IDLE' ? (
                    <QuickFixAssistant
                      side="top"
                      data={{
                        id: sub.id,
                        name: sub.name,
                        codename: sub.codename,
                        severity: 'WARNING',
                        issueSummary: `Sub-agent ${sub.codename} is currently in IDLE standby.`,
                        rootCause: `Awaiting upstream directive dispatch from parent agent ${agent.codename}.`,
                        actionableSteps: [
                          `Verify parent agent clearance in ${agent.codename}`,
                          `Test isolated execution of designated tool: ${sub.specializedTool}`,
                          'Dispatch task directly with 1-click mitigation below'
                        ],
                        quickFixLabel: 'Dispatch Sub-Agent Now',
                        onApplyFix: () => handleDispatchSubAgent(sub)
                      }}
                    >
                      <button
                        type="button"
                        className="text-[11px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-white/5 text-muted hover:text-white hover:bg-white/10 border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Hover for Quick Fix Assistant"
                      >
                        <span>IDLE</span>
                        <Wrench size={9} />
                      </button>
                    </QuickFixAssistant>
                  ) : (
                    <span className={cn(
                      "text-[11px] font-mono uppercase px-2 py-0.5 rounded font-bold",
                      isRunning ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                      sub.status === 'COMPLETED' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      "bg-white/5 text-muted border border-white/10"
                    )}>
                      {isRunning ? 'EXECUTING' : sub.status}
                    </span>
                  )}
                </div>

                <h5 className="text-sm font-bold text-white">{sub.name}</h5>

                <p className="text-xs text-zinc-300 mt-2 bg-black/40 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                  <strong className="text-zinc-400 block text-[10px] uppercase font-mono mb-0.5">Designated Task:</strong>
                  {sub.designatedTask}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="bg-black/60 px-2 py-1.5 rounded-lg border border-white/5 font-mono text-[10px] text-zinc-400 truncate flex items-center gap-1.5">
                  <Terminal size={11} className="text-accent shrink-0" />
                  <span className="truncate text-zinc-300">{sub.specializedTool}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                  <span>Done: <strong className="text-white">{sub.tasksCompleted}</strong></span>
                  <span>Accuracy: <strong className="text-secondary">{sub.accuracy}</strong></span>
                  <span>{sub.lastRunAt}</span>
                </div>

                <button
                  onClick={() => handleDispatchSubAgent(sub)}
                  disabled={isRunning}
                  className="w-full py-2 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isRunning ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                  {isRunning ? 'Running Task...' : 'Dispatch Sub-Agent'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Sub-Agent Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold silver-text flex items-center gap-2">
                <Bot size={18} className="text-secondary" />
                Assign Designated Sub-Agent to {agent.codename}
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubAgent} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">Sub-Agent Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., SERP Snippet & Knowledge Graph Scraper"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">Codename (Optional)</label>
                <input
                  type="text"
                  placeholder={`e.g., ${agent.codename}-SUB-4`}
                  value={newCodename}
                  onChange={e => setNewCodename(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">Designated Task Definition</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the exact atomic task this sub-agent is authorized to perform..."
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">Specialized Tool Call</label>
                <input
                  type="text"
                  placeholder="e.g., scrape_knowledge_graph(entity: string)"
                  value={newTool}
                  onChange={e => setNewTool(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-secondary text-background rounded-xl text-xs font-black font-mono uppercase tracking-wider hover:opacity-90 transition-all"
                >
                  Assign Sub-Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
