import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  Download, 
  Maximize2, 
  ArrowUpRight, 
  CheckCircle2, 
  BrainCircuit,
  Lightbulb,
  Zap,
  Lock,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { cn, formatCurrency } from '@/src/lib/utils';
import { useUser } from '@/src/contexts/UserContext';
import { useToast } from '@/src/contexts/ToastContext';
import { exportService } from '@/src/services/exportService';
import { GlassCard, Button, Badge } from '@/src/components/ui';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfMonth, isWithinInterval } from 'date-fns';

const rawChartData = [
  // Q3 2023 (Last Quarter)
  { timestamp: new Date(2023, 6, 15).getTime(), name: 'Social', cac: 45.20, spend: 25000, leads: 553, color: '#3A3A40' },
  { timestamp: new Date(2023, 7, 10).getTime(), name: 'Social', cac: 41.80, spend: 30000, leads: 717, color: '#3A3A40' },
  { timestamp: new Date(2023, 8, 1).getTime(), name: 'Social', cac: 42.50, spend: 30000, leads: 705, color: '#3A3A40' },
  
  { timestamp: new Date(2023, 6, 20).getTime(), name: 'Search', cac: 82.10, spend: 40000, leads: 487, color: '#FCD34D' },
  { timestamp: new Date(2023, 7, 15).getTime(), name: 'Search', cac: 75.40, spend: 50000, leads: 663, color: '#FCD34D' },
  { timestamp: new Date(2023, 8, 10).getTime(), name: 'Search', cac: 78.10, spend: 52500, leads: 672, color: '#FCD34D' },

  { timestamp: new Date(2023, 6, 5).getTime(), name: 'Display', cac: 32.50, spend: 20000, leads: 615, color: '#312E81' },
  { timestamp: new Date(2023, 8, 20).getTime(), name: 'Display', cac: 34.00, spend: 25000, leads: 735, color: '#312E81' },
  { timestamp: new Date(2023, 7, 25).getTime(), name: 'Influencer', cac: 52.00, spend: 35000, leads: 673, color: '#3A3A40' },
  { timestamp: new Date(2023, 8, 15).getTime(), name: 'Referral', cac: 42.00, spend: 12000, leads: 285, color: '#06B6D4' },

  // Q4 2023 (This Quarter)
  { timestamp: new Date(2023, 9, 5).getTime(), name: 'Social', cac: 39.50, spend: 38000, leads: 962, color: '#3A3A40' },
  { timestamp: new Date(2023, 10, 10).getTime(), name: 'Social', cac: 37.20, spend: 42000, leads: 1129, color: '#3A3A40' },
  { timestamp: new Date(2023, 9, 12).getTime(), name: 'Search', cac: 74.00, spend: 62000, leads: 837, color: '#FCD34D' },
  { timestamp: new Date(2023, 10, 18).getTime(), name: 'Search', cac: 71.50, spend: 68000, leads: 951, color: '#FCD34D' },
  { timestamp: new Date(2023, 10, 1).getTime(), name: 'Display', cac: 30.00, spend: 92400, leads: 3080, color: '#312E81' },
  { timestamp: new Date(2023, 11, 1).getTime(), name: 'Influencer', cac: 50.00, spend: 75000, leads: 1500, color: '#3A3A40' },
  { timestamp: new Date(2023, 11, 15).getTime(), name: 'Referral', cac: 45.00, spend: 18000, leads: 400, color: '#06B6D4' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1C1C1E] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl no-export">
        <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-3 font-mono">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-8">
            <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Total Spend</span>
            <span className="text-xs font-black silver-text">{formatCurrency(data.spend)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">New Leads</span>
            <span className="text-xs font-black silver-text">{data.leads.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-8 pt-2 border-t border-white/5">
            <span className="text-[11px] text-accent font-black uppercase tracking-wider">Avg CAC</span>
            <span className="text-xs font-black amber-text">${data.cac.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const rawSourceData = [
  // Q3 Data
  { timestamp: new Date(2023, 6, 1).getTime(), name: 'Google Search Ads (Old)', spend: 45000, leads: 500, cac: 90.00, status: 'WATCH', confidence: 85 },
  { timestamp: new Date(2023, 7, 15).getTime(), name: 'Meta Social Legacy', spend: 45000, leads: 900, cac: 50.00, status: 'STABLE', confidence: 91 },
  { timestamp: new Date(2023, 8, 1).getTime(), name: 'Google Search Ads', spend: 142500, leads: 1824, cac: 78.10, status: 'SCALING', confidence: 98 },
  { timestamp: new Date(2023, 8, 15).getTime(), name: 'Meta Social', spend: 85000, leads: 2005, cac: 42.50, status: 'OPTIMIZED', confidence: 94 },
  { timestamp: new Date(2023, 8, 25).getTime(), name: 'Programmatic Display', spend: 32000, leads: 940, cac: 34.04, status: 'OPTIMIZED', confidence: 89 },

  // Q4 Data
  { timestamp: new Date(2023, 9, 1).getTime(), name: 'YouTube Video', spend: 62000, leads: 1130, cac: 54.90, status: 'WATCH', confidence: 87 },
  { timestamp: new Date(2023, 9, 20).getTime(), name: 'Google Performance Max', spend: 89000, leads: 1420, cac: 62.67, status: 'SCALING', confidence: 96 },
  { timestamp: new Date(2023, 10, 1).getTime(), name: 'LinkedIn Ads', spend: 45000, leads: 600, cac: 75.00, status: 'STABLE', confidence: 92 },
  { timestamp: new Date(2023, 11, 5).getTime(), name: 'TikTok Trend Scaling', spend: 12000, leads: 800, cac: 15.00, status: 'SCALING', confidence: 95 },
  { timestamp: new Date(2023, 11, 15).getTime(), name: 'Affiliate & Referral Engine', spend: 18000, leads: 400, cac: 45.00, status: 'OPTIMIZED', confidence: 93 },
];

export default function AIExplorer() {
  const { role } = useUser();
  const { notifySuccess, notifyInfo } = useToast();
  const [query, setQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('H2 2023');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date(2023, 6, 1)), // July 1st
    end: new Date(2023, 11, 31) // Dec 31
  });
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const isAdmin = role === 'ADMIN' || role === 'SUB_ADMIN';

  const datePresets = [
    { label: 'This Quarter (Q4)', get: () => ({ start: new Date(2023, 9, 1), end: new Date(2023, 11, 31) }) },
    { label: 'Last Quarter (Q3)', get: () => ({ start: new Date(2023, 6, 1), end: new Date(2023, 8, 30) }) },
    { label: 'H2 2023', get: () => ({ start: new Date(2023, 6, 1), end: new Date(2023, 11, 31) }) },
    { label: 'Full Year 2023', get: () => ({ start: new Date(2023, 0, 1), end: new Date(2023, 11, 31) }) },
  ];

  const handleExecuteQuery = () => {
    if (!query.trim()) {
      notifyInfo('Query Required', 'Please enter a natural language question or select a suggestion below.');
      return;
    }
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setExecutionResult(`Synthesized Analysis for "${query}": Blended CAC across paid search and social decreased by 14.2% in this period, generating $340,000 in pipeline velocity with 4.2x LTV ratio.`);
      notifySuccess('Analysis Complete', `Processed query across active intelligence vaults.`);
    }, 700);
  };

  const handleExportData = () => {
    exportService.toXLSX(filteredChartData, `sigmatactix-ai-explorer-${selectedPreset.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
    notifySuccess('Data Exported', 'Downloaded channel performance dataset (.xlsx).');
  };

  const filteredChartData = useMemo(() => {
    const filtered = rawChartData.filter(d => isWithinInterval(d.timestamp, { start: dateRange.start, end: dateRange.end }));
    
    // Group and aggregate
    const grouped: Record<string, any> = {};
    filtered.forEach(d => {
      if (!grouped[d.name]) {
        grouped[d.name] = { ...d, count: 0, totalCac: 0 };
      }
      grouped[d.name].spend += d.spend;
      grouped[d.name].leads += d.leads;
      grouped[d.name].totalCac += d.cac;
      grouped[d.name].count += 1;
    });

    return Object.values(grouped).map(g => ({
      ...g,
      cac: g.leads > 0 ? g.spend / g.leads : 0
    }));
  }, [dateRange]);

  const filteredSourceData = useMemo(() => {
    return rawSourceData.filter(d => isWithinInterval(d.timestamp, { start: dateRange.start, end: dateRange.end }));
  }, [dateRange]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">INTELLIGENCE LAYER</Badge>
              <span className="text-zinc-600 text-xs">•</span>
              <Badge variant="neutral">NATURAL LANGUAGE SQL & TELEMETRY</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <BrainCircuit className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              AI Insight Explorer
            </h1>
            <p className="text-[var(--sigma-text-muted)] text-sm mt-1 max-w-2xl leading-relaxed">
              {isAdmin 
                ? "Query your enterprise data in natural language to reveal hidden patterns, attribution leaks, and growth opportunities."
                : "Explore campaign insights and performance metrics across all channels."}
            </p>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowDateOptions(!showDateOptions)}
              className="px-4 py-2 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl hover:bg-[var(--sigma-surface-muted)] transition-all text-xs font-mono text-[var(--sigma-text-muted)] flex items-center gap-2.5 cursor-pointer shadow-sm"
            >
              <Calendar size={14} className="text-[var(--sigma-vermilion)]" />
              <span className="px-2 py-0.5 rounded bg-[var(--sigma-vermilion)]/15 text-[var(--sigma-vermilion)] font-bold text-[10px] font-mono border border-[var(--sigma-vermilion)]/30">
                {selectedPreset}
              </span>
              <span className="text-[var(--sigma-text)] font-medium">
                {format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd, yyyy')}
              </span>
            </button>
            <AnimatePresence>
              {showDateOptions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl p-2 shadow-2xl z-50 backdrop-blur-xl"
                >
                  <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500 border-b border-[var(--sigma-border)] mb-1">
                    Filter Period
                  </div>
                  {datePresets.map((p) => {
                    const isActive = selectedPreset === p.label;
                    return (
                      <button 
                        key={p.label}
                        onClick={() => { 
                          setSelectedPreset(p.label);
                          setDateRange(p.get()); 
                          setShowDateOptions(false); 
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer",
                          isActive ? "bg-[var(--sigma-vermilion)]/15 text-[var(--sigma-vermilion)] border border-[var(--sigma-vermilion)]/30" : "hover:bg-white/5 text-zinc-300"
                        )}
                      >
                        <span>{p.label}</span>
                        {isActive && <CheckCircle2 size={14} className="text-[var(--sigma-vermilion)]" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>

      {/* Query Engine */}
      <GlassCard spotlight elevation="raised" className="p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4 text-[var(--sigma-vermilion)]">
          {isAdmin ? <BrainCircuit size={18} /> : <Sparkles size={18} />}
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            {isAdmin ? "Technical Query Engine" : "Insight Search"}
          </span>
        </div>
        
        <div className="relative">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleExecuteQuery();
              }
            }}
            placeholder={isAdmin ? "What is our CAC by acquisition channel for Q3?" : "Search for trends..."}
            className="w-full bg-black/60 border border-[var(--sigma-border)] rounded-xl p-5 text-base focus:outline-none focus:border-[var(--sigma-vermilion)]/60 transition-all min-h-[140px] resize-none font-sans text-zinc-200 placeholder:text-zinc-600"
          />
          <div className="absolute bottom-4 right-4">
            <Button 
              variant="primary"
              onClick={handleExecuteQuery}
              disabled={isExecuting}
              leftIcon={<Send size={14} />}
            >
              {isExecuting ? 'Analyzing...' : 'Execute Query'}
            </Button>
          </div>
        </div>

        {executionResult && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--sigma-vermilion)]/10 border border-[var(--sigma-vermilion)]/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[var(--sigma-vermilion)] shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-200 leading-relaxed font-sans">{executionResult}</div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-[var(--sigma-text-muted)] font-mono uppercase tracking-wider mr-1">Suggestions:</span>
          {['Lifetime Value Trend', 'Churn Prediction', 'Revenue Attribution'].map((s) => (
            <button 
              key={s} 
              onClick={() => setQuery(s)}
              className="px-3 py-1 rounded-full border border-[var(--sigma-border)] text-xs text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:border-accent/40 hover:bg-[var(--sigma-surface-subtle)] transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Main Analysis Area */}
      <div className="grid grid-cols-12 gap-8">
        {/* Chart Card */}
        <div className={cn(
          "bg-surface border border-white/5 rounded-2xl p-6 transition-all",
          isMaximized ? "col-span-12" : "col-span-12 lg:col-span-8"
        )}>
           <div className="flex justify-between items-start mb-8">
              <div>
                 <h2 className="text-xl font-bold">CAC by Channel</h2>
                 <p className="text-sm text-muted">
                    Intel for period: {format(dateRange.start, 'MMM yyyy')} - {format(dateRange.end, 'MMM yyyy')}
                 </p>
              </div>
              <div className="flex gap-2 no-export">
                 {isAdmin ? (
                   <button 
                     onClick={handleExportData}
                     className="p-2 hover:bg-[var(--sigma-surface-subtle)] rounded-lg text-[var(--sigma-text-muted)] transition-colors cursor-pointer hover:text-[var(--sigma-text)]" 
                     title="Export dataset (.xlsx)"
                   >
                     <Download size={18} />
                   </button>
                 ) : (
                   <div className="p-2 text-zinc-700 opacity-50 cursor-not-allowed" title="Admin access required"><Lock size={16} /></div>
                 )}
                 <button 
                   onClick={() => setIsMaximized(!isMaximized)}
                   className={cn(
                     "p-2 hover:bg-[var(--sigma-surface-subtle)] rounded-lg transition-colors cursor-pointer",
                     isMaximized ? "text-accent bg-accent/10" : "text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                   )}
                   title={isMaximized ? "Restore view" : "Maximize chart"}
                 >
                   <Maximize2 size={18} />
                 </button>
              </div>
           </div>

           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={filteredChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#A1A1AA', fontSize: 13, fontWeight: 'bold' }} 
                       dy={15}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="cac" radius={[6, 6, 0, 0]}>
                       {filteredChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Insights Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           {/* Performance Insight */}
           <div className="bg-surface border border-white/5 rounded-2xl p-7 relative group overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-6">
                 <span className="text-[10px] text-muted font-mono uppercase tracking-[0.3em] font-black">Performance Insight</span>
                 <ArrowUpRight size={24} className="text-secondary group-hover:scale-125 transition-transform" />
              </div>
              <div className="text-5xl font-black silver-text mb-4 tracking-tighter">12.4% <span className="text-sm font-black text-secondary ml-2 tracking-widest uppercase">+2.3% YoY</span></div>
              <p className="font-sans text-sm text-zinc-400 leading-relaxed">
                 Search remains your highest cost channel, but provides the best lead-to-close ratio (4.2%). Display yields high volume but 60% lower LTV.
              </p>
           </div>

           {/* AI Recommendation - Restricted to Admin/Sub-Admin */}
           {isAdmin ? (
             <div className="sigma-panel-raised border border-[var(--sigma-border-strong)] rounded-2xl p-7 relative space-y-4">
                <div className="flex items-center gap-2.5 text-[var(--sigma-primary)]">
                   <Zap size={20} className="fill-[var(--sigma-primary)]" />
                   <span className="text-xs font-mono uppercase tracking-wider font-semibold">AI Recommendation</span>
                </div>
                <p className="italic font-serif text-lg silver-text leading-relaxed font-medium">
                   "Shift 15% of Display budget to Referral programs. Data suggests a potential 8% decrease in overall blended CAC while maintaining volume."
                </p>
             </div>
           ) : (
             <div className="bg-surface/30 border border-white/5 rounded-2xl p-7 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted">
                   <Lock size={20} />
                </div>
                <div>
                   <h3 className="text-xs font-bold uppercase tracking-widest silver-text mb-1">Strategic AI Access</h3>
                   <p className="text-xs text-muted font-sans max-w-[200px]">Strategic recommendations are restricted to Administrative intelligence levels.</p>
                </div>
             </div>
           )}
        </div>

        {/* Breakdown Table */}
        <div className="col-span-12 bg-surface border border-white/5 rounded-2xl overflow-hidden">
           <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-bold">Source Breakdown</h2>
                 <p className="text-[10px] text-muted font-mono uppercase tracking-widest mt-1">
                    Details for <span className="text-secondary font-bold font-sans">{selectedPreset}</span> ({format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd, yyyy')}) • {filteredSourceData.length} Channels
                 </p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-[10px] font-mono text-muted uppercase">Actual</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#fcd34d]" />
                    <span className="text-[10px] font-mono text-muted uppercase">Predicted</span>
                 </div>
              </div>
           </div>
           <table className="w-full text-left border-collapse">
              <thead className="bg-background/20 text-[10px] uppercase font-mono tracking-widest text-muted/60">
                 <tr>
                    <th className="px-6 py-4">Channel Name</th>
                    <th className="px-6 py-4">Total Spend</th>
                    <th className="px-6 py-4">New Leads</th>
                    <th className="px-6 py-4">CAC</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Confidence</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 <AnimatePresence mode="popLayout">
                    {filteredSourceData.map((s, i) => (
                      <motion.tr 
                        key={s.name + i} 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                         <td className="px-6 py-5 font-medium text-sm">{s.name}</td>
                         <td className="px-6 py-5 font-mono text-sm">{formatCurrency(s.spend)}</td>
                         <td className="px-6 py-5 font-mono text-sm">{s.leads.toLocaleString()}</td>
                         <td className="px-6 py-5 font-mono text-sm">${s.cac.toFixed(2)}</td>
                         <td className="px-6 py-5">
                            <span className={cn(
                              "px-2 py-1 rounded text-[11px] font-bold border",
                              s.status === 'SCALING' ? "bg-secondary/10 text-secondary border-secondary/20" :
                              s.status === 'OPTIMIZED' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                              "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}>
                               {s.status}
                            </span>
                         </td>
                         <td className="px-6 py-5 text-right font-mono font-bold silver-text">{s.confidence}%</td>
                      </motion.tr>
                    ))}
                 </AnimatePresence>
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

