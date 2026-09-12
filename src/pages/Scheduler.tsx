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
  RefreshCw
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ScheduleItem {
  id: string;
  name: string;
  category: string;
  format: string;
  frequency: string;
  recipients: string[];
  lastRun: string;
}

const initialStats = [
  { label: 'ACTIVE SCHEDULES', value: '12', change: '+2', icon: Activity },
  { label: 'DELIVERIES (24H)', value: '158', change: '-4%', icon: Mail },
  { label: 'SUCCESS RATE', value: '99.4%', status: 'Stable', icon: CheckCircle2 },
  { label: 'NEXT RUN', value: '14:00', status: 'Today', icon: Clock },
];

const initialSchedules: ScheduleItem[] = [
  { id: '1', name: 'Q3 Executive Performance', category: 'Global Marketing Overview', format: 'PDF', frequency: 'Weekly (Mon)', recipients: ['JD', 'AL', '+4'], lastRun: 'Oct 12, 08:00' },
  { id: '2', name: 'Daily Lead Gen Deep Dive', category: 'Sales Enablement Hub', format: 'PPTX', frequency: 'Daily (07:00)', recipients: ['TK'], lastRun: 'Today, 07:01' },
  { id: '3', name: 'Monthly ROI Reconciliation', category: 'Finance Department', format: 'PDF', frequency: 'Monthly (1st)', recipients: ['CN', 'RB'], lastRun: 'Oct 01, 00:05' },
];

const initialHistory = [
  { id: 'h1', title: 'Daily Lead Gen Deep Dive - Successful', desc: 'Sent to 1 recipient via Email & Slack', time: '2h ago', status: 'success' },
  { id: 'h2', title: 'Social Media Audit - Dispatched', desc: 'Auto-synchronized with Brand & Marketing Vaults', time: '4h ago', status: 'success' },
  { id: 'h3', title: 'Weekly Ad Spend Report - Successful', desc: 'Sent to 8 recipients via Google Drive', time: 'Yesterday', status: 'success' },
];

export default function Scheduler() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [history, setHistory] = useState(initialHistory);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);

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
    setRunningScheduleId(schedule.id);
    setTimeout(() => {
      setRunningScheduleId(null);
      setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, lastRun: 'Just now' } : s));
      setHistory(prev => [
        {
          id: `h-${Date.now()}`,
          title: `${schedule.name} - Dispatched Manually`,
          desc: `Exported ${schedule.format} and sent to ${schedule.recipients.join(', ')}`,
          time: 'Just now',
          status: 'success'
        },
        ...prev
      ]);
    }, 1200);
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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="max-w-3xl">
          <div className="text-[10px] text-muted font-mono uppercase tracking-[0.4em] font-black mb-3 flex items-center gap-2">
            <Clock size={14} className="text-accent" /> Automation Layer • Scheduled Distribution
          </div>
          <h1 className="text-4xl lg:text-6xl font-heading font-black amber-text tracking-tighter">Reporting Scheduler</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mt-3 leading-relaxed font-sans">
            Automate recurring intelligence delivery. Generate multi-format executive exports (PDF, PPTX) synchronized with Second Brain metrics.
          </p>
        </div>

        <button 
          data-tutorial-id="tut-new-schedule-btn"
          onClick={() => setIsNewModalOpen(true)}
          className="px-6 py-3.5 bg-accent text-background rounded-xl hover:opacity-90 transition-all font-black uppercase text-xs tracking-widest flex items-center gap-2.5 amber-glow shadow-2xl w-fit"
        >
          <Plus size={18} /> New Schedule
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {initialStats.map((stat, i) => (
          <div key={i} className="bg-surface border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-accent/30 transition-all shadow-xl">
            <div className="text-[10px] text-muted font-mono uppercase tracking-widest font-bold mb-4">{stat.label}</div>
            <div className="flex items-end justify-between relative z-10">
              <div className="text-3xl font-heading font-black silver-text tracking-tight">{stat.value}</div>
              {stat.change && (
                <div className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded border", stat.change.startsWith('+') ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                  {stat.change}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Schedules Table */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Calendar className="text-accent" size={18} />
                 <h2 className="text-lg font-bold silver-text">Active Schedules ({schedules.length})</h2>
              </div>
           </div>
           
           <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-background/50 border-b border-white/10 flex items-center justify-between px-6">
                 <div className="flex items-center gap-3 flex-1 max-w-sm">
                    <Search size={14} className="text-muted" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter schedules by name or category..." 
                      className="bg-transparent border-none focus:outline-none text-xs w-full text-white placeholder:text-zinc-600 font-mono" 
                    />
                 </div>
              </div>

              <table className="w-full text-left">
                <thead className="bg-black/30 text-[10px] uppercase font-mono tracking-widest text-muted border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Report Name</th>
                    <th className="px-6 py-4 text-center">Format</th>
                    <th className="px-6 py-4">Frequency</th>
                    <th className="px-6 py-4">Last Run</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSchedules.map((s) => (
                    <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                         <div className="font-bold text-sm text-white">{s.name}</div>
                         <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{s.category}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-secondary">
                            {s.format}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted flex items-center gap-1.5 pt-5">
                         <Clock size={12} /> {s.frequency}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-400">{s.lastRun}</td>
                      <td className="px-6 py-4">
                         <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleRunNow(s)}
                              disabled={runningScheduleId === s.id}
                              title="Run Now"
                              className="p-1.5 hover:bg-accent/20 hover:text-accent rounded-lg text-muted transition-colors disabled:opacity-50"
                            >
                              {runningScheduleId === s.id ? <RefreshCw size={14} className="animate-spin text-accent" /> : <Play size={14} />}
                            </button>
                            <button 
                              onClick={() => handleDeleteSchedule(s.id)}
                              title="Delete Schedule"
                              className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-muted transition-colors"
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

           {/* Recent History */}
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <Clock className="text-muted" size={16} />
                 <h3 className="text-base font-bold silver-text">Recent Execution History</h3>
              </div>
              <div className="space-y-2">
                 {history.map((h) => (
                   <div key={h.id} className="p-3.5 bg-surface border border-white/5 rounded-xl flex items-center justify-between group hover:border-white/15 transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-green-500/10 border-green-500/20 text-green-400">
                            <CheckCircle2 size={16} />
                         </div>
                         <div>
                            <div className="font-bold text-xs text-white">{h.title}</div>
                            <div className="text-[11px] text-muted">{h.desc}</div>
                         </div>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">{h.time}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Sidebar: Engine Status */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <div className="flex items-center gap-2">
                    <Cpu size={18} className="text-accent" />
                    <h3 className="text-base font-bold silver-text">Cron Engine Status</h3>
                 </div>
                 <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
              </div>

              <div className="space-y-4 text-xs font-mono">
                 <div className="flex items-center justify-between">
                   <span className="text-zinc-400">Worker Node:</span>
                   <span className="text-white">BullMQ Scheduler (Active)</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-zinc-400">Redis Connection:</span>
                   <span className="text-green-400">Connected (0.4ms)</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-zinc-400">PDF Generator:</span>
                   <span className="text-secondary">Chromium Headless v122</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-zinc-400">Next Scheduled Run:</span>
                   <span className="text-accent">14:00 (Today)</span>
                 </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                 <div className="flex justify-between items-end mb-2 text-[10px] font-mono text-muted uppercase">
                    <span>Task Throughput</span>
                    <span>42% Load</span>
                 </div>
                 <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[42%]" />
                 </div>
              </div>
           </div>
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
              className="bg-surface border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <Calendar size={20} className="text-accent" />
                  <h3 className="text-lg font-bold silver-text">Create Automated Report Schedule</h3>
                </div>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-muted">Schedule Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Weekly C-Level Growth Brief"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-muted">Format</label>
                    <select
                      value={newFormat}
                      onChange={(e) => setNewFormat(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="PDF">PDF Executive Document</option>
                      <option value="PPTX">PPTX Board Deck</option>
                      <option value="CSV">Raw CSV Data Dump</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-muted">Cadence / Frequency</label>
                    <select
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="Daily (07:00)">Daily (07:00 AM)</option>
                      <option value="Weekly (Mon)">Weekly (Every Monday)</option>
                      <option value="Monthly (1st)">Monthly (1st of month)</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-muted">Stakeholder Recipient Initials / Emails</label>
                  <input
                    type="text"
                    required
                    value={newRecipients}
                    onChange={(e) => setNewRecipients(e.target.value)}
                    placeholder="JD, AL, ceo@company.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-muted hover:text-white rounded-xl text-xs font-mono font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-accent text-background font-black uppercase text-xs tracking-wider rounded-xl hover:opacity-90 amber-glow"
                  >
                    Save & Activate
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
