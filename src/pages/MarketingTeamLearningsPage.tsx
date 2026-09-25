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
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { GlassCard, Button, Badge, MetricWidget, Input } from '@/src/components/ui';
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
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="vermilion" size="sm">
                <Lightbulb size={12} className="mr-1 inline" /> Feedback & Institutional Memory
              </Badge>
              <Badge variant="outline" size="sm">
                Second Brain Synchronizer
              </Badge>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              Marketing Team Learnings Hub
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Continuous feedback loop capturing qualitative insights, buyer objection patterns, and ad experiments from human marketing operators, automatically updating Second Brain memory vaults.
            </p>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setShowSubmitModal(true)}
          >
            Submit Team Finding
          </Button>
        </div>
      </GlassCard>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          label="Total Active Directives"
          value={`${learnings.length} Directives`}
          subtext="Enforced across all 6 agent swarms"
          icon={<Lightbulb size={18} />}
        />
        <MetricWidget
          label="Vault Synced Memory"
          value="100%"
          delta={{ value: 'Synced', trend: 'up' }}
          subtext="pgvector RAG embeddings fresh"
          icon={<CheckCircle2 size={18} />}
        />
        <MetricWidget
          label="Top Contributing Vault"
          value="Brand Vault"
          subtext="Anti-slop & tone vector guidelines"
          icon={<BookOpen size={18} />}
        />
        <MetricWidget
          label="Mean Confidence Score"
          value="95.5%"
          delta={{ value: '+1.2%', trend: 'up' }}
          subtext="Validated campaign outcomes"
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learnings List */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider px-1">
            Institutional Memory Feed ({learnings.length})
          </div>

          <div className="space-y-2.5">
            {learnings.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedLearning(item)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2",
                  selectedLearning.id === item.id
                    ? "bg-[var(--sigma-surface-raised)] border-[var(--sigma-vermilion)]/50 text-white shadow-md ring-1 ring-[var(--sigma-vermilion)]/25"
                    : "bg-[var(--sigma-surface)] border-[var(--sigma-border)] text-zinc-300 hover:border-white/20 hover:bg-[var(--sigma-surface-raised)]"
                )}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <Badge variant="outline" size="sm">
                    {item.category}
                  </Badge>
                  <span className="text-zinc-500 text-[11px]">{item.dateAdded}</span>
                </div>

                <h4 className="font-semibold text-xs leading-snug text-white">{item.title}</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.finding}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-[var(--sigma-border)]">
                  <span>Target: <strong className="text-zinc-300">{item.targetVault}</strong></span>
                  <span className="text-emerald-400">{item.confidenceScore}% Confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Teardown */}
        <div className="lg:col-span-2">
          <GlassCard elevation="raised" className="p-6 border border-[var(--sigma-border)] space-y-5">
            <div className="flex items-start justify-between border-b border-[var(--sigma-border)] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="vermilion" size="sm">
                    {selectedLearning.category}
                  </Badge>
                  <span className="text-xs text-zinc-500 font-mono">Source: {selectedLearning.source}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedLearning.title}</h3>
              </div>

              <Badge variant="success" size="sm">
                {selectedLearning.confidenceScore}% Validated
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-zinc-400 font-semibold">Core Finding & Empirical Evidence</div>
              <div className="p-4 bg-black/40 border border-[var(--sigma-border)] rounded-xl text-xs text-zinc-200 leading-relaxed font-sans">
                {selectedLearning.finding}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-[var(--sigma-vermilion)] font-semibold">Systemic Action & Agent Directive</div>
              <div className="p-4 bg-[var(--sigma-vermilion)]/5 border border-[var(--sigma-vermilion)]/20 rounded-xl text-xs text-zinc-200 leading-relaxed font-mono">
                {selectedLearning.actionTaken}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--sigma-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
              <span>Target Partition: <strong className="text-white">{selectedLearning.targetVault}</strong></span>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw size={13} />}
                onClick={() => notifySuccess('Re-vectorized in Second Brain', 'Embeddings regenerated and synced to Chronos-00 master orchestrator.')}
              >
                Re-Vectorize Now
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Modal for Submitting New Team Learning */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <GlassCard elevation="raised" className="p-6 border border-[var(--sigma-border)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[var(--sigma-vermilion)]" />
                    Submit Marketing Team Finding
                  </h3>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmitLearning} className="space-y-4">
                  <Input
                    label="Finding Title / Direct Rule"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g., Enterprise buyers reject 'all-in-one' messaging"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-zinc-400">Category</label>
                      <select
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value as any)}
                        className="w-full bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[var(--sigma-vermilion)]"
                      >
                        <option value="COPYWRITING">Copywriting & Voice</option>
                        <option value="POSITIONING">Positioning Strategy</option>
                        <option value="AUDIENCE_ICP">Audience & ICP Signals</option>
                        <option value="PAID_ADS">Paid Ad Media Buying</option>
                        <option value="CONVERSION_CRO">Conversion & CRO</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-zinc-400">Target Vault</label>
                      <select
                        value={targetVault}
                        onChange={e => setTargetVault(e.target.value)}
                        className="w-full bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[var(--sigma-vermilion)]"
                      >
                        <option value="Brand Vault">Brand Vault</option>
                        <option value="Customer Vault">Customer Vault</option>
                        <option value="Marketing Vault">Marketing Vault</option>
                        <option value="Authority Vault">Authority Vault</option>
                        <option value="Operations Vault">Operations Vault</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-zinc-400">Observation / Evidence</label>
                    <textarea
                      required
                      rows={3}
                      value={newFinding}
                      onChange={e => setNewFinding(e.target.value)}
                      placeholder="What did the marketing team discover during calls or campaign tests?"
                      className="w-full bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[var(--sigma-vermilion)] leading-relaxed font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-zinc-400">Agent Action / Systemic Rule to Enforce</label>
                    <textarea
                      rows={2}
                      value={newActionTaken}
                      onChange={e => setNewActionTaken(e.target.value)}
                      placeholder="e.g., Update Brand Vault system prompt: never use the phrase 'all-in-one platform'."
                      className="w-full bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[var(--sigma-vermilion)] leading-relaxed font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-[var(--sigma-border)]">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                    >
                      Commit to Second Brain
                    </Button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
