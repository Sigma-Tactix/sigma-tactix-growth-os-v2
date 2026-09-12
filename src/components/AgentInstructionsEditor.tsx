import React, { useState } from 'react';
import { 
  FileCode, 
  Save, 
  RotateCcw, 
  Check, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Cpu, 
  Sparkles,
  Info,
  Sliders
} from 'lucide-react';
import { AgentInstructions, ScopedAgent } from '@/src/data/agentCockpitData';
import { useToast } from '@/src/contexts/ToastContext';

interface AgentInstructionsEditorProps {
  agent: ScopedAgent;
  onSaveInstructions: (updatedInstructions: AgentInstructions) => void;
  onTestInSimulation?: (draftInstructions: AgentInstructions) => void;
}

export default function AgentInstructionsEditor({ agent, onSaveInstructions, onTestInSimulation }: AgentInstructionsEditorProps) {
  const { notifySuccess, notifyInfo } = useToast();
  
  const [instructions, setInstructions] = useState<AgentInstructions>({
    ...agent.instructions
  });

  const [newDirective, setNewDirective] = useState('');
  const [newConstraint, setNewConstraint] = useState('');
  const [newGuardrail, setNewGuardrail] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Compute stats
  const totalWords = instructions.systemPrompt.trim().split(/\s+/).filter(Boolean).length +
    instructions.operationalDirectives.join(' ').split(/\s+/).filter(Boolean).length +
    instructions.behavioralConstraints.join(' ').split(/\s+/).filter(Boolean).length +
    instructions.guardrails.join(' ').split(/\s+/).filter(Boolean).length;

  const estimatedTokens = Math.round(totalWords * 1.35);

  const handleSave = () => {
    onSaveInstructions(instructions);
    setIsSaved(true);
    notifySuccess(
      'Agent Instructions Saved',
      `Updated system prompt & directives for ${agent.name} (${agent.codename}).`
    );
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAddDirective = () => {
    if (!newDirective.trim()) return;
    setInstructions(prev => ({
      ...prev,
      operationalDirectives: [...prev.operationalDirectives, newDirective.trim()]
    }));
    setNewDirective('');
  };

  const handleRemoveDirective = (index: number) => {
    setInstructions(prev => ({
      ...prev,
      operationalDirectives: prev.operationalDirectives.filter((_, i) => i !== index)
    }));
  };

  const handleAddConstraint = () => {
    if (!newConstraint.trim()) return;
    setInstructions(prev => ({
      ...prev,
      behavioralConstraints: [...prev.behavioralConstraints, newConstraint.trim()]
    }));
    setNewConstraint('');
  };

  const handleRemoveConstraint = (index: number) => {
    setInstructions(prev => ({
      ...prev,
      behavioralConstraints: prev.behavioralConstraints.filter((_, i) => i !== index)
    }));
  };

  const handleAddGuardrail = () => {
    if (!newGuardrail.trim()) return;
    setInstructions(prev => ({
      ...prev,
      guardrails: [...prev.guardrails, newGuardrail.trim()]
    }));
    setNewGuardrail('');
  };

  const handleRemoveGuardrail = (index: number) => {
    setInstructions(prev => ({
      ...prev,
      guardrails: prev.guardrails.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header & Token Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h4 className="text-base font-bold silver-text flex items-center gap-2">
            <FileCode size={16} className="text-accent" />
            System Instructions & Behavioral Directives
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Governs reasoning, tone, constraints, and execution boundaries for {agent.codename}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 text-[11px] font-mono text-zinc-400">
            <span>Words: <strong className="text-white">{totalWords}</strong></span>
            <span className="text-zinc-600">|</span>
            <span>Est. Tokens: <strong className="text-secondary">{estimatedTokens}</strong></span>
          </div>

          {onTestInSimulation && (
            <button
              onClick={() => onTestInSimulation(instructions)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-500/20 to-amber-500/20 hover:from-purple-500/30 hover:to-amber-500/30 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-lg"
              title="Test these drafted instructions in virtual DAG Simulation Mode"
            >
              <Sliders size={13} className="text-amber-400" />
              <span>Test in DAG Simulator</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-accent text-background rounded-xl text-xs font-black font-mono uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1.5 amber-glow"
          >
            {isSaved ? <Check size={14} /> : <Save size={14} />}
            {isSaved ? 'Saved' : 'Save Directives'}
          </button>
        </div>
      </div>

      {/* Primary System Prompt Box */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
          <Cpu size={12} className="text-accent" /> Core System Prompt (Meta Persona & Goal)
        </label>
        <textarea
          rows={5}
          value={instructions.systemPrompt}
          onChange={e => setInstructions({ ...instructions, systemPrompt: e.target.value })}
          className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-accent leading-relaxed resize-y"
          placeholder="Enter core system prompt..."
        />
      </div>

      {/* Operational Directives Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} className="text-green-400" /> Operational Directives ({instructions.operationalDirectives.length})
          </label>
        </div>

        <div className="space-y-2">
          {instructions.operationalDirectives.map((directive, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-surface/60 p-2.5 rounded-xl border border-white/5 text-xs text-zinc-300">
              <span className="text-[10px] font-mono text-green-400 font-bold shrink-0">#{idx + 1}</span>
              <span className="flex-1 leading-snug">{directive}</span>
              <button
                onClick={() => handleRemoveDirective(idx)}
                className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                title="Remove directive"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add new operational directive..."
              value={newDirective}
              onChange={e => setNewDirective(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDirective(); } }}
              className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleAddDirective}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono flex items-center gap-1 shrink-0"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Behavioral Constraints & Guardrails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Behavioral Constraints */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
            <Info size={12} className="text-secondary" /> Behavioral Constraints
          </label>
          <div className="space-y-2">
            {instructions.behavioralConstraints.map((constraint, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-surface/60 p-2.5 rounded-xl border border-white/5 text-xs text-zinc-300">
                <span className="text-secondary shrink-0">•</span>
                <span className="flex-1 leading-snug">{constraint}</span>
                <button
                  onClick={() => handleRemoveConstraint(idx)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add constraint..."
                value={newConstraint}
                onChange={e => setNewConstraint(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddConstraint(); } }}
                className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleAddConstraint}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Guardrails */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-amber-400" /> Guardrails & Safety Limits
          </label>
          <div className="space-y-2">
            {instructions.guardrails.map((guardrail, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-surface/60 p-2.5 rounded-xl border border-white/5 text-xs text-zinc-300">
                <span className="text-amber-400 shrink-0">⚠</span>
                <span className="flex-1 leading-snug">{guardrail}</span>
                <button
                  onClick={() => handleRemoveGuardrail(idx)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add guardrail..."
                value={newGuardrail}
                onChange={e => setNewGuardrail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGuardrail(); } }}
                className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleAddGuardrail}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Output Specification */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase text-muted tracking-wider">
          Expected Output Schema & Format
        </label>
        <textarea
          rows={3}
          value={instructions.outputFormat}
          onChange={e => setInstructions({ ...instructions, outputFormat: e.target.value })}
          className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-accent"
          placeholder="e.g., Structured JSON with keys..."
        />
      </div>
    </div>
  );
}
