import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { exportService } from '@/src/services/exportService';
import { ChannelCampaignRow, CHANNEL_CAMPAIGN_DATA } from '@/src/data/executiveReportsData';
import { tagRowsForDelivery, provenanceNote, type RowProvenance } from '@/src/lib/exportProvenance';

/**
 * Where this table's rows come from. `sample` until an ad provider is wired in;
 * flip to `measured` only when the rows are actually pulled from a connection.
 */
const TABLE_PROVENANCE: RowProvenance = 'sample';

interface ChannelAttributionTableProps {
  onRowClick?: (row: ChannelCampaignRow) => void;
  className?: string;
}

export default function ChannelAttributionTable({ onRowClick, className }: ChannelAttributionTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedMedium, setSelectedMedium] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ChannelCampaignRow>('spend');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  // Filter channels & mediums options
  const channelOptions = useMemo(() => {
    const channels = Array.from(new Set(CHANNEL_CAMPAIGN_DATA.map(r => r.channel)));
    return ['ALL', ...channels];
  }, []);

  const mediumOptions = useMemo(() => {
    const mediums = Array.from(new Set(CHANNEL_CAMPAIGN_DATA.map(r => r.medium)));
    return ['ALL', ...mediums];
  }, []);

  // Filter & Sort rows
  const filteredRows = useMemo(() => {
    return CHANNEL_CAMPAIGN_DATA.filter(row => {
      const matchesSearch = 
        row.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.medium.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesChannel = selectedChannel === 'ALL' || row.channel === selectedChannel;
      const matchesMedium = selectedMedium === 'ALL' || row.medium === selectedMedium;

      return matchesSearch && matchesChannel && matchesMedium;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
  }, [searchQuery, selectedChannel, selectedMedium, sortField, sortDirection]);

  // Aggregate totals
  const totals = useMemo(() => {
    const totalSpend = filteredRows.reduce((acc, r) => acc + r.spend, 0);
    const totalRevenue = filteredRows.reduce((acc, r) => acc + r.revenue, 0);
    const totalConversions = filteredRows.reduce((acc, r) => acc + r.conversions, 0);
    const totalClicks = filteredRows.reduce((acc, r) => acc + r.clicks, 0);
    const totalImpressions = filteredRows.reduce((acc, r) => acc + r.impressions, 0);
    const blendedRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00';
    const blendedCpa = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : '0.00';
    const blendedCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    return {
      totalSpend,
      totalRevenue,
      totalConversions,
      totalClicks,
      totalImpressions,
      blendedRoas,
      blendedCpa,
      blendedCtr
    };
  }, [filteredRows]);

  const handleSort = (field: keyof ChannelCampaignRow) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    const rows = filteredRows.map(r => ({
      'Channel': r.channel,
      'Source': r.source,
      'Medium': r.medium,
      'Campaign Name': r.campaignName,
      'Spend ($)': r.spend,
      'Impressions': r.impressions,
      'Clicks': r.clicks,
      'CTR (%)': `${r.ctr}%`,
      'Conversions': r.conversions,
      'CPA ($)': r.cpa,
      'Revenue ($)': r.revenue,
      'ROAS (x)': `${r.roas}x`,
      'Status': r.status,
      'Trend': r.trend
    }));

    // Same hardcoded fixture as the reports table: label it rather than imply it
    // is this workspace's measured performance.
    const exportData = tagRowsForDelivery(rows, { provenance: TABLE_PROVENANCE });

    exportService.toCSV(exportData, `sigmatactix-channel-campaigns-${new Date().getTime()}.csv`);
    setTimeout(() => setIsExporting(false), 800);
  };

  return (
    <div className={cn("bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl space-y-4", className)}>
      {/*
        This table renders a hardcoded fixture. The banner exists so the screen
        carries the same provenance statement as the exported file - previously
        the CSV admitted the data was sample while this header called it "live".
      */}
      <div
        role="status"
        className="flex items-start gap-2.5 px-4 py-3 border-b border-warning/25 bg-warning/10 text-xs"
      >
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold text-warning">{provenanceNote(TABLE_PROVENANCE)}</p>
          <p className="text-muted">
            No ad platform is connected to this workspace. Connect a provider to replace these rows with
            measured results.
          </p>
        </div>
      </div>
      {/* Table Header & Controls */}
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={18} className="text-accent" />
              <h3 className="text-lg font-bold silver-text tracking-tight">
                Channel, Source, Medium & Campaign Attribution
              </h3>
              <span className="px-2 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-mono font-bold border border-accent/30">
                Multi-Touch Relational
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Channel, source, medium and campaign attribution. Rows are labelled with where they came from.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-3.5 py-2 bg-black/40 hover:bg-white/10 border border-white/10 hover:border-accent/40 rounded-xl text-xs font-mono font-bold text-white transition-all flex items-center gap-2"
              title="Download CSV of filtered campaign attribution rows"
            >
              <Download size={14} className="text-accent" />
              <span>{isExporting ? 'Exporting...' : 'Export Table CSV'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search campaign name, source (google, fb), or medium (cpc, social)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>

          {/* Channel Dropdown */}
          <div className="sm:col-span-4 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-muted whitespace-nowrap">Channel:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-accent/60"
            >
              {channelOptions.map(c => (
                <option key={c} value={c} className="bg-zinc-950 text-white">
                  {c === 'ALL' ? 'All Channels (8)' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Medium Dropdown */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-muted whitespace-nowrap">Medium:</span>
            <select
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-accent/60"
            >
              {mediumOptions.map(m => (
                <option key={m} value={m} className="bg-zinc-950 text-white">
                  {m === 'ALL' ? 'All Mediums' : m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-black/40 border-b border-white/10 text-muted uppercase text-[10px] tracking-wider select-none">
            <tr>
              <th className="py-3 px-4 font-bold">
                <button onClick={() => handleSort('channel')} className="flex items-center gap-1.5 hover:text-white">
                  <span>Channel & Source</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 font-bold">
                <button onClick={() => handleSort('medium')} className="flex items-center gap-1.5 hover:text-white">
                  <span>Medium</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 font-bold">
                <button onClick={() => handleSort('campaignName')} className="flex items-center gap-1.5 hover:text-white">
                  <span>Campaign Name</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 font-bold text-right">
                <button onClick={() => handleSort('spend')} className="flex items-center gap-1.5 justify-end w-full hover:text-white">
                  <span>Spend</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 font-bold text-right">
                <button onClick={() => handleSort('impressions')} className="flex items-center gap-1.5 justify-end w-full hover:text-white">
                  <span>Impressions / CTR</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 font-bold text-right">
                <button onClick={() => handleSort('conversions')} className="flex items-center gap-1.5 justify-end w-full hover:text-white">
                  <span>Conv / CPA</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 font-bold text-right">
                <button onClick={() => handleSort('revenue')} className="flex items-center gap-1.5 justify-end w-full hover:text-white">
                  <span>Revenue</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 font-bold text-right">
                <button onClick={() => handleSort('roas')} className="flex items-center gap-1.5 justify-end w-full hover:text-white">
                  <span>ROAS</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-zinc-500 font-mono">
                  No campaign attribution records matched your search query or filter criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isPositiveTrend = row.trend.startsWith('+');
                return (
                  <tr 
                    key={row.id} 
                    onClick={() => onRowClick?.(row)}
                    className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  >
                    {/* Channel & Source */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          row.channel === 'Google Ads' ? "bg-amber-400" :
                          row.channel === 'Meta Ads' ? "bg-cyan-400" :
                          row.channel === 'LinkedIn Ads' ? "bg-blue-400" :
                          row.channel === 'Organic Search' ? "bg-emerald-400" : "bg-purple-400"
                        )} />
                        <div>
                          <span className="font-bold text-white font-sans text-xs group-hover:text-accent transition-colors block">
                            {row.channel}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            src: <span className="text-zinc-300">{row.source}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Medium */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-mono">
                        {row.medium}
                      </span>
                    </td>

                    {/* Campaign Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-zinc-200 text-xs font-semibold max-w-[240px] truncate" title={row.campaignName}>
                        {row.campaignName}
                      </div>
                    </td>

                    {/* Spend */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ${row.spend.toLocaleString()}
                    </td>

                    {/* Impressions / CTR */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="text-zinc-200">{(row.impressions / 1000).toFixed(0)}k</div>
                      <div className="text-[10px] text-zinc-400">{row.ctr.toFixed(1)}% CTR</div>
                    </td>

                    {/* Conversions / CPA */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="text-emerald-400 font-bold">{row.conversions.toLocaleString()}</div>
                      <div className="text-[10px] text-zinc-400">${row.cpa.toFixed(2)} CPA</div>
                    </td>

                    {/* Revenue */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ${row.revenue.toLocaleString()}
                    </td>

                    {/* ROAS */}
                    <td className="py-3.5 px-4 text-right">
                      <div className={cn(
                        "font-bold text-xs",
                        row.roas >= 5.0 ? "text-emerald-400" :
                        row.roas >= 4.0 ? "text-accent" : "text-amber-400"
                      )}>
                        {row.roas.toFixed(2)}x
                      </div>
                      <div className="flex items-center justify-end gap-0.5 text-[10px]">
                        {isPositiveTrend ? (
                          <span className="text-emerald-400 flex items-center">{row.trend}</span>
                        ) : (
                          <span className="text-rose-400 flex items-center">{row.trend}</span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border",
                        row.status === 'SCALING' 
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                          : row.status === 'OPTIMAL'
                          ? "bg-accent/15 text-accent border-accent/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      )}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          {filteredRows.length > 0 && (
            <tfoot className="bg-black/60 border-t-2 border-white/10 font-mono text-xs font-bold text-white">
              <tr>
                <td className="py-4 px-4 uppercase text-[10px] text-accent tracking-wider" colSpan={3}>
                  Summary Total ({filteredRows.length} Active Streams)
                </td>
                <td className="py-4 px-4 text-right text-accent font-black">
                  ${totals.totalSpend.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right text-zinc-300">
                  {(totals.totalImpressions / 1000).toFixed(0)}k <span className="text-[10px] text-muted block font-normal">{totals.blendedCtr}% CTR</span>
                </td>
                <td className="py-4 px-4 text-right text-emerald-400 font-black">
                  {totals.totalConversions.toLocaleString()} <span className="text-[10px] text-muted block font-normal">${totals.blendedCpa} CPA</span>
                </td>
                <td className="py-4 px-4 text-right text-white font-black">
                  ${totals.totalRevenue.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right text-accent font-black">
                  {totals.blendedRoas}x <span className="text-[10px] text-emerald-400 block font-normal">Blended</span>
                </td>
                <td className="py-4 px-4 text-center text-[10px] text-zinc-400">
                  Audited
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
