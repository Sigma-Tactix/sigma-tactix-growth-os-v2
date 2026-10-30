import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Presentation, 
  Calendar, 
  Clock, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Activity,
  Cpu,
  Mail,
  FileDown,
  X,
  RefreshCw,
  Server
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard, Button, Badge, MetricWidget, Input } from '@/src/components/ui';

import { useToast } from '@/src/contexts/ToastContext';
import { isDemoSeedEnabled } from '@/src/lib/demoSeed';

interface ScheduleItem {
  id: string;
  name: string;
  category: string;
  format: string;
  frequency: string;
  recipients: string[];
  lastRun: string;
}

// DEMO SEED — fixtures only. A fresh tenant renders none of these: the rows
// below describe delivery history and last-run times that workspace never had.
// Gated by VITE_SEED_DEMO_WORKSPACE (src/lib/demoSeed.ts), the client-side twin
// of the server's SEED_DEMO_WORKSPACE.
const demoSchedules: ScheduleItem[] = [
  { id: '1', name: 'Q3 Executive Performance', category: 'Global Marketing Overview', format: 'PDF', frequency: 'Weekly (Mon)', recipients: ['JD', 'AL', '+4'], lastRun: 'Oct 12, 08:00' },
  { id: '2', name: 'Daily Lead Gen Deep Dive', category: 'Sales Enablement Hub', format: 'PPTX', frequency: 'Daily (07:00)', recipients: ['TK'], lastRun: 'Today, 07:01' },
  { id: '3', name: 'Monthly ROI Reconciliation', category: 'Finance Department', format: 'PDF', frequency: 'Monthly (1st)', recipients: ['CN', 'RB'], lastRun: 'Oct 01, 00:05' },
];

type SchedulerHistoryStatus = 'queued' | 'running' | 'completed' | 'failed';

const demoHistory: Array<{ id: string; title: string; desc: string; time: string; status: SchedulerHistoryStatus }> = [
  { id: 'h1', title: 'Daily Lead Gen Deep Dive - Local Export', desc: 'Rendered PPTX locally. External dispatch requires SMTP/Slack credentials.', time: '2h ago', status: 'completed' },
  { id: 'h2', title: 'Social Media Audit - Local Sync', desc: 'Copied to local Brand & Marketing Vaults only. No remote sync occurred.', time: '4h ago', status: 'completed' },
  { id: 'h3', title: 'Weekly Ad Spend Report - Local Export', desc: 'Rendered PDF locally. Cloud sync requires connected storage connector.', time: 'Yesterday', status: 'completed' },
];

export default function Scheduler() {
  const { notifySuccess, notifyInfo } = useToast();
  const isDemo = isDemoSeedEnabled();
  const [schedules, setSchedules] = useState<ScheduleItem[]>(isDemo ? demoSchedules : []);
  const [history, setHistory] = useState<typeof demoHistory>(isDemo ? demoHistory : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);

  const stats = React.useMemo(() => {
    const activeCount = schedules.length;
    const completedCount = history.filter(h => h.status === 'completed').length;
    const successRate = history.length > 0
      ? `${Math.round((completedCount / history.length) * 100)}%`
      : 'N/A (no recorded runs)';
    return [
      { label: 'ACTIVE SCHEDULES', value: activeCount.toString(), delta: { value: 'Configured', trend: 'neutral' as const }, icon: Activity },
      { label: 'RECORDED DELIVERIES', value: completedCount.toString(), delta: { value: 'In-app log', trend: 'neutral' as const }, icon: Mail },
      { label: 'SUCCESS RATE', value: successRate, delta: { value: 'Logged runs', trend: 'neutral' as const }, icon: CheckCircle2 },
      { label: 'TRIGGER CADENCE', value: activeCount > 0 ? 'Managed' : 'None', subtext: 'Based on active schedules', icon: Clock },
    ];
  }, [schedules, history]);

  // New schedule form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Marketing Overview');
  const [newFormat, setNewFormat] = useState('PDF');
  const [newFrequency, setNewFrequency] = useState('Weekly (Mon)');
  const [newRecipients, setNewRecipients] = useState('JD, AL');

  const filteredSchedules = schedules.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleRunNow = (schedule: ScheduleItem) => {
    if (runningScheduleId) return; // one in-flight local render only
    setRunningScheduleId(schedule.id);
    // Phase 0 truthful state: local render only. The entry is QUEUED and stays
    // queued until a verified local export completes — no setTimeout fabricates
    // success. Remote distribution stays pending until provider credentials exist.
    setHistory(prev => [
      {
        id: `h-${Date.now()}`,
        title: `${schedule.name} - Manual Trigger`,
        desc: `Queued local ${schedule.format} render. Awaiting verified local export; remote distribution pending provider credentials.`,
        time: 'Just now',
        status: 'queued' as SchedulerHistoryStatus
      },
      ...prev
    ]);
    setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, lastRun: 'Queued (awaiting verified export)' } : s));
    notifyInfo('Manual Run Queued', `Queued local ${schedule.format} render for "${schedule.name}". Complete the verified export to record delivery.`);
    setRunningScheduleId(current => (current === schedule.id ? null : current));
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newSchedule: ScheduleItem = {
      id: Date.now().toString(),
      name: newName,
      category: newCategory,
      format: newFormat,
      frequency: newFrequency,
      recipients: newRecipients.split(',').map(r => r.trim()).filter(Boolean),
      lastRun: 'Pending initial trigger'
    };

    setSchedules([newSchedule, ...schedules]);
    setIsNewModalOpen(false);
    setNewName('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="vermilion" size="sm">
                <Clock size={12} className="mr-1 inline" /> Automation Layer
              </Badge>
              <Badge variant="outline" size="sm">
                Distribution Hub
              </Badge>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Reporting Scheduler
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Automate recurring intelligence delivery. Generate multi-format executive exports (PDF, PPTX) synchronized with Second Brain metrics.
            </p>
          </div>

          <Button 
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsNewModalOpen(true)}
          >
            New Schedule
          </Button>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <MetricWidget
              key={i}
              label={stat.label}
              value={stat.value}
              delta={stat.delta}
              subtext={stat.subtext}
              icon={<Icon size={18} />}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Schedules Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="text-[var(--sigma-vermilion)]" size={18} />
              <h2 className="text-base font-bold text-white">Active Schedules ({schedules.length})</h2>
            </div>
          </div>
          
          <GlassCard elevation="raised" className="overflow-hidden border border-[var(--sigma-border)]">
            <div className="p-4 bg-[var(--sigma-surface)]/80 border-b border-[var(--sigma-border)] flex items-center justify-between px-6">
              <div className="flex items-center gap-3 flex-1 max-w-sm">
                <Search size={14} className="text-zinc-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter schedules by name or category..." 
                  className="bg-transparent border-none focus:outline-none text-xs w-full text-white placeholder:text-zinc-500 font-mono" 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/30 text-[11px] uppercase font-mono tracking-widest text-zinc-500 border-b border-[var(--sigma-border)]">
                  <tr>
                    <th className="px-6 py-4">Report Name</th>
                    <th className="px-6 py-4 text-center">Format</th>
                    <th className="px-6 py-4">Frequency</th>
                    <th className="px-6 py-4">Last Run</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sigma-border)]">
                  {filteredSchedules.map((s) => (
                    <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-white">{s.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{s.category}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" size="sm">
                          {s.format}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-zinc-500" /> {s.frequency}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-400">{s.lastRun}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleRunNow(s)}
                            disabled={runningScheduleId === s.id}
                            title="Run Now"
                            className="p-2 hover:bg-[var(--sigma-vermilion)]/15 hover:text-[var(--sigma-vermilion)] rounded-lg text-zinc-400 transition-colors disabled:opacity-50"
                          >
                            {runningScheduleId === s.id ? <RefreshCw size={14} className="animate-spin text-[var(--sigma-vermilion)]" /> : <Play size={14} />}
                          </button>
                          <button 
                            onClick={() => handleDeleteSchedule(s.id)}
                            title="Delete Schedule"
                            className="p-2 hover:bg-rose-500/20 hover:text-rose-accent rounded-lg text-zinc-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Recent History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="text-zinc-500" size={16} />
              <h3 className="text-sm font-bold text-white">Recent Execution History</h3>
            </div>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="p-3.5 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between group hover:border-white/15 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <div className="font-medium text-xs text-white">{h.title}</div>
                      <div className="text-[11px] text-zinc-500">{h.desc}</div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">{h.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Engine Status */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard elevation="raised" className="p-6 border border-[var(--sigma-border)] space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-[var(--sigma-vermilion)]" />
                <h3 className="text-sm font-bold text-white">Cron Engine Status</h3>
              </div>
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Scheduler Engine:</span>
                <span className="text-zinc-200">In-app queue (no worker daemon)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Worker Node:</span>
                <span className="text-amber-400">Not provisioned</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Queue Backend:</span>
                <span className="text-amber-400">Local state only</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Remote Dispatch:</span>
                <span className="text-amber-400">Requires SMTP/Slack credentials</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Next Scheduled Run:</span>
                <span className="text-zinc-400">Pending scheduler activation</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--sigma-border)]">
              <div className="flex justify-between items-end mb-2 text-[11px] font-mono text-zinc-500 uppercase">
                <span>Recorded Queue Depth</span>
                <span className="text-zinc-300">{history.filter(h => h.status === 'queued').length} Queued</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-[var(--sigma-vermilion)]" style={{ width: history.length > 0 ? `${Math.round((history.filter(h => h.status === 'completed').length / history.length) * 100)}%` : '0%' }} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* New Schedule Modal */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <GlassCard elevation="raised" className="p-6 border border-[var(--sigma-border)] space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={18} className="text-[var(--sigma-vermilion)]" />
                    <h3 className="text-base font-bold text-white">Create Automated Schedule</h3>
                  </div>
                  <button
                    onClick={() => setIsNewModalOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateSchedule} className="space-y-4">
                  <Input
                    label="Schedule Name"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Weekly C-Level Growth Brief"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-zinc-400">Format</label>
                      <select
                        value={newFormat}
                        onChange={(e) => setNewFormat(e.target.value)}
                        className="w-full bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[var(--sigma-vermilion)]"
                      >
                        <option value="PDF">PDF Executive Document</option>
                        <option value="PPTX">PPTX Board Deck</option>
                        <option value="CSV">Raw CSV Data Dump</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-zinc-400">Cadence / Frequency</label>
                      <select
                        value={newFrequency}
                        onChange={(e) => setNewFrequency(e.target.value)}
                        className="w-full bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[var(--sigma-vermilion)]"
                      >
                        <option value="Daily (07:00)">Daily (07:00 AM)</option>
                        <option value="Weekly (Mon)">Weekly (Every Monday)</option>
                        <option value="Monthly (1st)">Monthly (1st of month)</option>
                        <option value="Bi-Weekly">Bi-Weekly</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Stakeholder Recipient Emails"
                    required
                    value={newRecipients}
                    onChange={(e) => setNewRecipients(e.target.value)}
                    placeholder="JD, AL, ceo@company.com"
                  />

                  <div className="pt-3 flex justify-end gap-3">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setIsNewModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                    >
                      Save & Activate
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

