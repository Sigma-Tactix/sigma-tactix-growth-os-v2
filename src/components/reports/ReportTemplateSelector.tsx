import React, { useState } from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  Users, 
  Globe, 
  Sparkles, 
  Check, 
  ChevronDown, 
  Bookmark, 
  FileText,
  Sliders,
  Calendar,
  Layers
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  EXECUTIVE_REPORT_TEMPLATES, 
  ReportTemplate 
} from '@/src/data/executiveReportsData';

interface ReportTemplateSelectorProps {
  currentTemplate: ReportTemplate;
  onSelectTemplate: (template: ReportTemplate) => void;
  layoutMode: 'grid' | 'executive';
  onChangeLayoutMode: (mode: 'grid' | 'executive') => void;
  activeViewSection: 'all' | 'charts' | 'attribution' | 'audience';
  onChangeViewSection: (section: 'all' | 'charts' | 'attribution' | 'audience') => void;
  onSaveAsCustomTemplate?: (name: string) => void;
}

export default function ReportTemplateSelector({
  currentTemplate,
  onSelectTemplate,
  layoutMode,
  onChangeLayoutMode,
  activeViewSection,
  onChangeViewSection,
  onSaveAsCustomTemplate
}: ReportTemplateSelectorProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'BarChart3': return <BarChart3 size={16} className="text-secondary" />;
      case 'Users': return <Users size={16} className="text-accent" />;
      case 'Globe': return <Globe size={16} className="text-emerald-400" />;
      default: return <LayoutGrid size={16} className="text-accent" />;
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTemplateName.trim()) {
      onSaveAsCustomTemplate?.(customTemplateName.trim());
      setShowSaveModal(false);
      setCustomTemplateName('');
    }
  };

  return (
    <div className="bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top Row: Template Switcher & Details */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Template Selector Button & Dropdown */}
        <div className="relative">
          <div className="text-[11px] font-mono uppercase text-[var(--sigma-muted)] tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles size={12} className="text-[var(--sigma-vermilion)]" />
            <span>Active Executive Template</span>
          </div>

          <button
            onClick={() => setIsOpenDropdown(!isOpenDropdown)}
            className="flex items-center gap-3 px-4 py-2.5 bg-[var(--sigma-bg)] hover:bg-[var(--sigma-surface-hover)] border border-[var(--sigma-border)] hover:border-[var(--sigma-vermilion)]/40 rounded-xl text-left transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-[var(--sigma-surface)] border border-[var(--sigma-border)] group-hover:border-[var(--sigma-vermilion)]/40">
              {getTemplateIcon(currentTemplate.iconName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--sigma-text)] text-sm font-sans group-hover:text-[var(--sigma-vermilion)] transition-colors">
                  {currentTemplate.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--sigma-vermilion)]/15 text-[var(--sigma-vermilion)] text-[10px] font-mono font-medium border border-[var(--sigma-vermilion)]/30">
                  {currentTemplate.badge}
                </span>
              </div>
              <div className="text-[11px] font-mono text-[var(--sigma-muted)]">
                {currentTemplate.category} • {currentTemplate.recommendedCadence}
              </div>
            </div>
            <ChevronDown size={14} className="text-[var(--sigma-muted)] ml-2 group-hover:text-[var(--sigma-text)] transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Templates Dropdown Menu */}
          {isOpenDropdown && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-2xl p-3 shadow-2xl z-50 backdrop-blur-xl space-y-2 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--sigma-muted)] border-b border-[var(--sigma-border)] flex items-center justify-between">
                <span>Select Pre-Built Executive Template</span>
                <span className="text-[var(--sigma-vermilion)]">{EXECUTIVE_REPORT_TEMPLATES.length} Available</span>
              </div>

              <div className="space-y-1 pt-1">
                {EXECUTIVE_REPORT_TEMPLATES.map((tpl) => {
                  const isSelected = tpl.id === currentTemplate.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        onSelectTemplate(tpl);
                        setIsOpenDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group border",
                        isSelected 
                          ? "bg-[var(--sigma-vermilion)]/10 border-[var(--sigma-vermilion)]/40 text-[var(--sigma-text)]" 
                          : "border-transparent hover:bg-[var(--sigma-surface-hover)] text-[var(--sigma-muted)] hover:text-[var(--sigma-text)]"
                      )}
                    >
                      <div className="p-2 rounded-lg bg-[var(--sigma-bg)] border border-[var(--sigma-border)] mt-0.5">
                        {getTemplateIcon(tpl.iconName)}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs font-sans group-hover:text-[var(--sigma-vermilion)]">
                            {tpl.name}
                          </span>
                          {isSelected && <Check size={14} className="text-[var(--sigma-vermilion)]" />}
                        </div>
                        <p className="text-[11px] text-[var(--sigma-muted)] font-sans line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[var(--sigma-muted)]">
                          <span>Audience: {tpl.targetAudience}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[var(--sigma-border)] flex justify-between items-center px-1">
                <button
                  onClick={() => {
                    setIsOpenDropdown(false);
                    setShowSaveModal(true);
                  }}
                  className="text-[11px] font-mono text-[var(--sigma-vermilion)] hover:underline flex items-center gap-1.5"
                >
                  <Bookmark size={12} />
                  <span>Save Current as Custom Template</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section View Filters & Layout Mode */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Section View Filters */}
          <div className="flex bg-[var(--sigma-bg)] p-1 rounded-xl border border-[var(--sigma-border)] text-xs font-mono">
            <button
              onClick={() => onChangeViewSection('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all font-medium",
                activeViewSection === 'all' ? "bg-[var(--sigma-surface)] text-[var(--sigma-text)] shadow-xs border border-[var(--sigma-border)]" : "text-[var(--sigma-muted)] hover:text-[var(--sigma-text)]"
              )}
            >
              All Sections
            </button>
            <button
              onClick={() => onChangeViewSection('charts')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all font-medium",
                activeViewSection === 'charts' ? "bg-[var(--sigma-surface)] text-[var(--sigma-text)] shadow-xs border border-[var(--sigma-border)]" : "text-[var(--sigma-muted)] hover:text-[var(--sigma-text)]"
              )}
            >
              Charts Only
            </button>
            <button
              onClick={() => onChangeViewSection('attribution')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all font-medium",
                activeViewSection === 'attribution' ? "bg-[var(--sigma-surface)] text-[var(--sigma-text)] shadow-xs border border-[var(--sigma-border)]" : "text-[var(--sigma-muted)] hover:text-[var(--sigma-text)]"
              )}
            >
              Attribution Table
            </button>
            <button
              onClick={() => onChangeViewSection('audience')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all font-medium",
                activeViewSection === 'audience' ? "bg-[var(--sigma-surface)] text-[var(--sigma-text)] shadow-xs border border-[var(--sigma-border)]" : "text-[var(--sigma-muted)] hover:text-[var(--sigma-text)]"
              )}
            >
              Audience Segments
            </button>
          </div>

          {/* Layout Mode Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeLayoutMode(layoutMode === 'grid' ? 'executive' : 'grid')}
              className="px-3 py-1.5 bg-[var(--sigma-bg)] hover:bg-[var(--sigma-surface-hover)] border border-[var(--sigma-border)] rounded-xl text-xs font-mono text-[var(--sigma-text)] flex items-center gap-1.5 transition-colors"
              title="Toggle Grid Alignment"
            >
              <Sliders size={13} className="text-[var(--sigma-vermilion)]" />
              <span>{layoutMode === 'grid' ? 'Aligned Grid' : 'Executive Stack'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Audience & Cadence Bar */}
      <div className="p-3 bg-[var(--sigma-bg)]/60 border border-[var(--sigma-border)] rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--sigma-muted)]">
        <div className="flex items-center gap-4">
          <div>
            <strong className="text-[var(--sigma-text)]">Audience:</strong> {currentTemplate.targetAudience}
          </div>
          <span className="text-[var(--sigma-border)]">•</span>
          <div>
            <strong className="text-[var(--sigma-text)]">Cadence:</strong> {currentTemplate.recommendedCadence}
          </div>
        </div>

        <div className="text-[11px] text-[var(--sigma-muted)]">
          Template ID: <span className="font-mono text-[var(--sigma-text)]">{currentTemplate.id}</span>
        </div>
      </div>

      {/* Save Custom Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-surface border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-base font-bold silver-text">Save as Custom Template</h4>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-muted hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Executive Board Briefing"
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                This will save your current widget configuration, aligned chart layouts, and campaign attribution filters for quick reuse.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-mono text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-background font-bold rounded-xl text-xs font-mono hover:opacity-90 transition-opacity"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
