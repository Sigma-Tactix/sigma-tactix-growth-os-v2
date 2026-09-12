import React, { useState } from 'react';
import { 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Upload, 
  X, 
  FileText, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ScopedAgent } from '@/src/data/agentCockpitData';
import { exportAgentToMarkdown, downloadAgentMarkdown, importAgentFromMarkdown } from '@/src/services/agentMarkdownService';
import { useToast } from '@/src/contexts/ToastContext';
import { cn } from '@/src/lib/utils';

interface AgentMarkdownModalProps {
  mode: 'export' | 'import';
  agent: ScopedAgent;
  isOpen: boolean;
  onClose: () => void;
  onApplyImport: (importedData: Partial<ScopedAgent>) => void;
}

export default function AgentMarkdownModal({
  mode,
  agent,
  isOpen,
  onClose,
  onApplyImport
}: AgentMarkdownModalProps) {
  const { notifySuccess, notifyInfo, notifyError } = useToast();
  const [activeTab, setActiveTab] = useState<'preview' | 'import'>(mode === 'export' ? 'preview' : 'import');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const markdownContent = exportAgentToMarkdown(agent);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    notifySuccess('Markdown Copied', `${agent.codename} configuration copied to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadAgentMarkdown(agent);
    notifySuccess('Markdown Downloaded', `Saved ${agent.codename.toLowerCase()}-agent-definition.md to disk.`);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportText(text);
        validateAndPreviewImport(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportText(text);
        validateAndPreviewImport(text);
      };
      reader.readAsText(file);
    }
  };

  const validateAndPreviewImport = (text: string) => {
    try {
      const parsed = importAgentFromMarkdown(text, agent);
      if (!parsed.instructions?.systemPrompt && !parsed.name) {
        setParseError('Warning: No frontmatter or system prompt detected. Verify .md format.');
      } else {
        setParseError(null);
      }
    } catch (err: any) {
      setParseError(`Parse error: ${err.message}`);
    }
  };

  const handleConfirmImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = importAgentFromMarkdown(importText, agent);
      onApplyImport(parsed);
      notifySuccess(
        'Agent Configuration Imported',
        `Successfully updated ${parsed.name || agent.name} from .md file.`
      );
      onClose();
    } catch (err: any) {
      notifyError('Import Failed', err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FileCode size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold silver-text">
                {activeTab === 'preview' ? `Export ${agent.codename} (.md)` : `Import Agent Definition (.md)`}
              </h3>
              <p className="text-xs text-zinc-400">
                Interchangeable Markdown format with YAML frontmatter, skills, directives, and guardrails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mr-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono transition-all",
                  activeTab === 'preview' ? "bg-accent text-background font-black" : "text-zinc-400 hover:text-white"
                )}
              >
                Export .md
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono transition-all",
                  activeTab === 'import' ? "bg-accent text-background font-black" : "text-zinc-400 hover:text-white"
                )}
              >
                Import .md
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'preview' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Format: Markdown with YAML Frontmatter (.md)</span>
                <span>Size: ~{(markdownContent.length / 1024).toFixed(1)} KB</span>
              </div>

              <div className="bg-black/70 p-4 rounded-xl border border-white/10 font-mono text-xs text-zinc-300 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                {markdownContent}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                className={cn(
                  "p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer",
                  dragActive ? "border-accent bg-accent/5" : "border-white/10 hover:border-white/20 bg-black/20"
                )}
                onClick={() => document.getElementById('md-file-input')?.click()}
              >
                <Upload size={24} className="mx-auto text-accent mb-2" />
                <div className="text-sm font-bold text-white mb-1">
                  Drag & Drop .md file here, or click to browse
                </div>
                <div className="text-xs text-zinc-400">
                  Accepts markdown agent files with YAML frontmatter and instruction headers.
                </div>
                <input
                  id="md-file-input"
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Paste Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted block">Or Paste Markdown Content Directly</label>
                <textarea
                  rows={8}
                  placeholder="Paste agent .md content starting with ---..."
                  value={importText}
                  onChange={e => {
                    setImportText(e.target.value);
                    validateAndPreviewImport(e.target.value);
                  }}
                  className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-accent"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-mono text-amber-300 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between">
          <div className="text-xs font-mono text-muted">
            Target Agent: <strong className="text-white">{agent.name} ({agent.codename})</strong>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'preview' ? (
              <>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2 bg-accent text-background rounded-xl text-xs font-black font-mono uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 amber-glow"
                >
                  <Download size={14} /> Download .md
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!importText.trim()}
                  className="px-5 py-2 bg-accent text-background rounded-xl text-xs font-black font-mono uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 amber-glow disabled:opacity-50"
                >
                  <Upload size={14} /> Apply Configuration
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
