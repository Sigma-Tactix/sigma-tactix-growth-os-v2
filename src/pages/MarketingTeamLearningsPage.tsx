import React, { useState } from 'react';
import { 
  Lightbulb, 
  Search, 
  Sparkles, 
  Bot, 
  Plus, 
  CheckCircle2, 
  Layers, 
  Send, 
  Database, 
  TrendingUp, 
  BookOpen, 
  ShieldCheck, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { 
  SEED_MARKETING_LEARNINGS, 
  MarketingTeamLearning 
} from '@/src/data/marketingModulesData';

export default function MarketingTeamLearningsPage() {
  const { notifySuccess, notifyInfo } = useToast();
  const [learnings, setLearnings] = useState<MarketingTeamLearning[]>(SEED_MARKETING_LEARNINGS);
  const [selectedLearning, setSelectedLearning] = useState<MarketingTeamLearning>(SEED_MARKETING_LEARNINGS[0]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // New Learning Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'COPYWRITING' | 'POSITIONING' | 'AUDIENCE_ICP' | 'PAID_ADS' | 'CONVERSION_CRO'>('COPYWRITING');
  const [newFinding, setNewFinding] = useState('');
  const [newActionTaken, setNewActionTaken] = useState('');
  const [targetVault, setTargetVault] = useState('Brand Vault');

  const handleSubmitLearning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newFinding) return;

    const item: MarketingTeamLearning = {
      id: `lrn-${Date.now()}`,
      category: newCategory,
      title: newTitle,
      source: 'Marketing Team Weekly Review',
      dateAdded: 'Just now',
      finding: newFinding,
      actionTaken: newActionTaken || 'Submitted to Second Brain ingestion queue.',
      targetVault: targetVault,
      confidenceScore: 95
    };

    setLearnings([item, ...learnings]);
    setSelectedLearning(item);
    setShowSubmitModal(false);
    setNewTitle('');
    setNewFinding('');
    setNewActionTaken('');

    notifySuccess(
      'Marketing Team Learning Ingested',
      `Vectorized and committed to Second Brain ${targetVault}. Scoped agents will integrate this rule into all future runs.`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-mono tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full font-bold">
              FEEDBACK & INSTITUTIONAL MEMORY
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-xs font-mono text-zinc-400">SECOND BRAIN SYNCHRONIZER</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Lightbulb className="w-7 h-7 text-amber-400" />
            Marketing Team Learnings & Feedback Hub
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Continuous feedback loop capturing qualitative insights, buyer objection patterns, and ad experiments from human marketing operators, automatically updating Second Brain memory vaults.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Submit Team Finding
        </button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Total Active Directives</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            {learnings.length} Directives
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Enforced across all 6 agent swarms</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Vault Synced Memory</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            100% Synced
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">pgvector RAG embeddings fresh</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Top Contributing Vault</div>
          <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            Brand Vault
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Anti-slop & tone vector guidelines</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-mono text-zinc-400 mb-1">Mean Confidence Score</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            95.5%
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Based on validated campaign outcomes</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learnings List */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider px-1">
            Institutional Memory Feed ({learnings.length})
          </div>

          {learnings.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedLearning(item)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2",
                selectedLearning.id === item.id
                  ? "bg-amber-400/10 border-amber-400/40 text-white shadow-lg shadow-amber-500/5"
                  : "bg-zinc-900/30 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/40"
              )}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2 py-0.5 bg-zinc-800 text-amber-400 rounded text-[10px] font-bold">
                  {item.category}
                </span>
                <span className="text-zinc-500">{item.dateAdded}</span>
              </div>

              <h4 className="font-semibold text-xs leading-snug">{item.title}</h4>
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {item.finding}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
                <span>Target: <strong className="text-zinc-300">{item.targetVault}</strong></span>
                <span className="text-emerald-400">{item.confidenceScore}% Confidence</span>
              </div>
            </div>
          ))}
        </div>

        {/* Learning Teardown */}
        <div className="lg:col-span-2 p-6 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-5">
          <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold rounded">
                  {selectedLearning.category}
                </span>
                <span className="text-xs text-zinc-500 font-mono">Source: {selectedLearning.source}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">{selectedLearning.title}</h3>
            </div>

            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-lg">
              {selectedLearning.confidenceScore}% Validated
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Core Finding & Empirical Evidence</div>
            <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 leading-relaxed font-sans">
              {selectedLearning.finding}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Systemic Action & Agent Directive</div>
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed font-mono">
              {selectedLearning.actionTaken}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Target Second Brain Partition: <strong className="text-white">{selectedLearning.targetVault}</strong></span>
            <button
              onClick={() => notifySuccess('Re-vectorized in Second Brain', 'Embeddings regenerated and synced to Chronos-00 master orchestrator.')}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Vectorize Now
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Submitting New Team Learning */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Submit Marketing Team Finding
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmitLearning} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Finding Title / Direct Rule</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Enterprise buyers reject 'all-in-one' messaging"
                  className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="COPYWRITING">Copywriting & Voice</option>
                    <option value="POSITIONING">Positioning Strategy</option>
                    <option value="AUDIENCE_ICP">Audience & ICP Signals</option>
                    <option value="PAID_ADS">Paid Ad Media Buying</option>
                    <option value="CONVERSION_CRO">Conversion & CRO</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target Vault</label>
                  <select
                    value={targetVault}
                    onChange={e => setTargetVault(e.target.value)}
                    className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="Brand Vault">Brand Vault</option>
                    <option value="Customer Vault">Customer Vault</option>
                    <option value="Marketing Vault">Marketing Vault</option>
                    <option value="Authority Vault">Authority Vault</option>
                    <option value="Operations Vault">Operations Vault</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Observation / Evidence</label>
                <textarea
                  required
                  rows={3}
                  value={newFinding}
                  onChange={e => setNewFinding(e.target.value)}
                  placeholder="What did the marketing team discover during calls or campaign tests?"
                  className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Agent Action / Systemic Rule to Enforce</label>
                <textarea
                  rows={2}
                  value={newActionTaken}
                  onChange={e => setNewActionTaken(e.target.value)}
                  placeholder="e.g., Update Brand Vault system prompt: never use the phrase 'all-in-one platform'."
                  className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-lg text-xs cursor-pointer shadow-md"
                >
                  Commit to Second Brain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
