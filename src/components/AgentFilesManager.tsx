import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  FileText, 
  Code, 
  Upload, 
  Download, 
  Plus, 
  Save, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Sparkles, 
  Terminal, 
  Layers, 
  Search,
  Eye,
  Check
} from 'lucide-react';
import { ScopedAgent, AgentConfigFile } from '@/src/data/agentCockpitData';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { 
  generateDefaultAgentFiles, 
  syncFileContentToAgent, 
  downloadAgentFile, 
  downloadAgentFileBundle 
} from '@/src/services/agentFilesService';

interface AgentFilesManagerProps {
  agent: ScopedAgent;
  onUpdateAgent: (updatedAgent: ScopedAgent, summaryLog?: string) => void;
}

export default function AgentFilesManager({ agent, onUpdateAgent }: AgentFilesManagerProps) {
  const { notifySuccess, notifyInfo, notifyError } = useToast();

  // Initialize files list
  const [files, setFiles] = useState<AgentConfigFile[]>(() => generateDefaultAgentFiles(agent));
  const [selectedFileId, setSelectedFileId] = useState<string>(() => files[0]?.id || '');
  const [editorContent, setEditorContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<AgentConfigFile | null>(null);

  // Upload modal state
  const [dragActive, setDragActive] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadTargetMode, setUploadTargetMode] = useState<'AUTO_MATCH' | 'NEW_CUSTOM'>('AUTO_MATCH');

  // New File modal state
  const [newFileName, setNewFileName] = useState('');
  const [newFileFormat, setNewFileFormat] = useState<AgentConfigFile['format']>('json');
  const [newFileDesc, setNewFileDesc] = useState('');
  const [newFileStarter, setNewFileStarter] = useState('');

  // Active file object
  const activeFile = files.find(f => f.id === selectedFileId) || files[0];

  // Keep editor content in sync when selected file changes
  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
      setHasUnsavedChanges(false);
    }
  }, [activeFile?.id]);

  // Regenerate system files if agent changes externally
  useEffect(() => {
    setFiles(prev => {
      const generated = generateDefaultAgentFiles(agent);
      // Keep any user-added custom files that are not system files
      const customOnes = prev.filter(f => !f.isSystemFile);
      const merged = [...generated];
      customOnes.forEach(cf => {
        if (!merged.some(m => m.id === cf.id)) {
          merged.push(cf);
        }
      });
      return merged;
    });
  }, [agent.id, agent.instructions.systemPrompt, agent.skills.length, agent.instructions.guardrails.length]);

  const filteredFiles = files.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.format.toLowerCase().includes(q);
  });

  const handleEditorChange = (newVal: string) => {
    setEditorContent(newVal);
    setHasUnsavedChanges(newVal !== activeFile?.content);
  };

  const handleSaveFile = () => {
    if (!activeFile) return;

    try {
      // Validate JSON if applicable
      if (activeFile.format === 'json') {
        JSON.parse(editorContent);
      }

      const updatedFile: AgentConfigFile = {
        ...activeFile,
        content: editorContent,
        lastModified: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sizeBytes: new Blob([editorContent]).size
      };

      // Update in local files list
      setFiles(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f));
      setHasUnsavedChanges(false);

      // Sync to live Agent
      const { updatedAgent, changeSummary } = syncFileContentToAgent(updatedFile, agent);
      onUpdateAgent(updatedAgent, changeSummary);

      notifySuccess('File Saved & Synchronized', `${activeFile.name} changes applied to ${agent.codename} live runtime state.`);
    } catch (err: any) {
      notifyError('Save Error', `Failed to save ${activeFile.name}: ${err.message}`);
    }
  };

  const handlePrettify = () => {
    if (!activeFile || activeFile.format !== 'json') return;
    try {
      const obj = JSON.parse(editorContent);
      const pretty = JSON.stringify(obj, null, 2);
      setEditorContent(pretty);
      setHasUnsavedChanges(pretty !== activeFile.content);
      notifyInfo('JSON Prettified', 'Indentation and formatting formatted cleanly.');
    } catch (e: any) {
      notifyError('Formatting Error', 'Invalid JSON syntax. Cannot format.');
    }
  };

  const handleResetToDefault = () => {
    if (!activeFile) return;
    const defaults = generateDefaultAgentFiles(agent);
    const def = defaults.find(d => d.name === activeFile.name);
    if (def) {
      setEditorContent(def.content);
      setHasUnsavedChanges(def.content !== activeFile.content);
      notifyInfo('Reset to Initial Default', `Reverted ${activeFile.name} in editor.`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    notifyInfo('Copied to Clipboard', `${activeFile?.name} copied.`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Upload handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = (file: File) => {
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setUploadContent(text);
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = () => {
    if (!uploadFileName.trim() || !uploadContent.trim()) return;

    let format: AgentConfigFile['format'] = 'text';
    const lower = uploadFileName.toLowerCase();
    if (lower.endsWith('.json')) format = 'json';
    else if (lower.endsWith('.md') || lower.endsWith('.markdown')) format = 'markdown';
    else if (lower.endsWith('.ts') || lower.endsWith('.js')) format = 'typescript';
    else if (lower.endsWith('.yaml') || lower.endsWith('.yml')) format = 'yaml';

    // Check if matches an existing file
    const existingIndex = files.findIndex(f => f.name.toLowerCase() === uploadFileName.toLowerCase());

    let targetFile: AgentConfigFile;

    if (existingIndex >= 0 && uploadTargetMode === 'AUTO_MATCH') {
      targetFile = {
        ...files[existingIndex],
        content: uploadContent,
        lastModified: 'Just now',
        sizeBytes: new Blob([uploadContent]).size
      };
      setFiles(prev => prev.map((f, i) => i === existingIndex ? targetFile : f));
    } else {
      // New custom file
      targetFile = {
        id: `file-${Date.now().toString().slice(-4)}`,
        name: uploadFileName,
        fileType: 'CUSTOM',
        format,
        description: `Custom uploaded file for ${agent.codename}.`,
        content: uploadContent,
        isSystemFile: false,
        lastModified: 'Just now',
        sizeBytes: new Blob([uploadContent]).size
      };
      setFiles(prev => [...prev, targetFile]);
    }

    try {
      const { updatedAgent, changeSummary } = syncFileContentToAgent(targetFile, agent);
      onUpdateAgent(updatedAgent, changeSummary);
      notifySuccess('File Uploaded & Synced', `${uploadFileName} applied to ${agent.codename}.`);
    } catch (err: any) {
      notifyError('Sync Warning', `File saved, but agent sync returned: ${err.message}`);
    }

    setSelectedFileId(targetFile.id);
    setIsUploadModalOpen(false);
    setUploadFileName('');
    setUploadContent('');
  };

  // Create new file
  const handleCreateNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let finalName = newFileName.trim();
    if (newFileFormat === 'json' && !finalName.endsWith('.json')) finalName += '.json';
    if (newFileFormat === 'markdown' && !finalName.endsWith('.md')) finalName += '.md';
    if (newFileFormat === 'typescript' && !finalName.endsWith('.ts')) finalName += '.ts';
    if (newFileFormat === 'yaml' && !finalName.endsWith('.yaml') && !finalName.endsWith('.yml')) finalName += '.yaml';

    const starterContent = newFileStarter.trim() || (
      newFileFormat === 'json' ? '{\n  "version": "1.0",\n  "description": "Agent configuration data"\n}' :
      newFileFormat === 'markdown' ? `# ${finalName}\n\nDocumentation and contextual knowledge for ${agent.codename}.\n` :
      newFileFormat === 'typescript' ? `// TypeScript module for ${agent.codename}\nexport function run() {\n  return true;\n}\n` :
      '# YAML Configuration\nversion: 1.0\n'
    );

    const newFile: AgentConfigFile = {
      id: `file-custom-${Date.now().toString().slice(-4)}`,
      name: finalName,
      fileType: 'CUSTOM',
      format: newFileFormat,
      description: newFileDesc.trim() || `Custom ${newFileFormat.toUpperCase()} file for ${agent.codename}.`,
      content: starterContent,
      isSystemFile: false,
      lastModified: 'Just now',
      sizeBytes: new Blob([starterContent]).size
    };

    setFiles(prev => [...prev, newFile]);
    setSelectedFileId(newFile.id);
    setIsNewFileModalOpen(false);
    setNewFileName('');
    setNewFileDesc('');
    setNewFileStarter('');

    // Save into agent customFiles
    const updatedAgent = {
      ...agent,
      customFiles: [...(agent.customFiles || []), newFile]
    };
    onUpdateAgent(updatedAgent, `Created file ${newFile.name}`);
    notifySuccess('File Created', `Added ${newFile.name} to agent repository.`);
  };

  const handleDeleteFile = (file: AgentConfigFile) => {
    if (file.isSystemFile) {
      notifyError('Action Denied', 'Core system files cannot be deleted. You can edit or reset them.');
      return;
    }

    const updatedFiles = files.filter(f => f.id !== file.id);
    setFiles(updatedFiles);
    if (selectedFileId === file.id && updatedFiles[0]) {
      setSelectedFileId(updatedFiles[0].id);
    }
    setFileToDelete(null);

    const updatedAgent = {
      ...agent,
      customFiles: (agent.customFiles || []).filter(f => f.id !== file.id)
    };
    onUpdateAgent(updatedAgent, `Deleted custom file ${file.name}`);
    notifyInfo('File Deleted', `Removed ${file.name} from agent repository.`);
  };

  // Stats calculation
  const totalSizeBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
  const approxTokens = Math.round(editorContent.length / 4);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h4 className="text-base font-bold silver-text flex items-center gap-2">
            <FileCode size={16} className="text-accent" />
            AI Agent Configuration & Knowledge Repository
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Edit system prompts, MCP tool definitions, guardrails, and upload custom files for {agent.codename}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsUploadModalOpen(true);
              setUploadFileName('');
              setUploadContent('');
            }}
            className="px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Upload size={13} /> Upload File
          </button>

          <button
            onClick={() => setIsNewFileModalOpen(true)}
            className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={13} /> New File
          </button>

          <button
            onClick={() => downloadAgentFileBundle(agent, files)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-mono transition-all flex items-center gap-1.5"
            title="Download all files as JSON bundle"
          >
            <Download size={13} /> Bundle ({files.length})
          </button>
        </div>
      </div>

      {/* Main Two-Column Repository Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: File Explorer (4 cols) */}
        <div className="lg:col-span-4 bg-surface/80 border border-white/10 rounded-2xl p-3.5 space-y-3 shadow-lg">
          {/* Search files */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search agent files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-accent font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1 border-b border-white/5 pb-2">
            <span>{filteredFiles.length} file(s) available</span>
            <span>{(totalSizeBytes / 1024).toFixed(1)} KB total</span>
          </div>

          {/* Files List */}
          <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
            {filteredFiles.map(file => {
              const isSelected = file.id === activeFile?.id;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (!confirm(`You have unsaved changes in ${activeFile?.name}. Discard and switch?`)) return;
                    }
                    setSelectedFileId(file.id);
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 group",
                    isSelected
                      ? "bg-accent/15 border-accent/40 text-white shadow-sm"
                      : "bg-black/20 hover:bg-white/5 border-transparent text-zinc-300"
                  )}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0 mt-0.5",
                      file.format === 'json' ? "bg-amber-500/10 text-amber-400" :
                      file.format === 'markdown' ? "bg-blue-500/10 text-blue-400" :
                      file.format === 'typescript' ? "bg-cyan-500/10 text-cyan-400" :
                      "bg-purple-500/10 text-purple-400"
                    )}>
                      {file.format === 'json' ? <Code size={13} /> :
                       file.format === 'markdown' ? <FileText size={13} /> :
                       file.format === 'typescript' ? <Terminal size={13} /> :
                       <FileCode size={13} />}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-xs font-mono font-bold truncate",
                          isSelected ? "text-accent" : "text-zinc-200 group-hover:text-white"
                        )}>
                          {file.name}
                        </span>
                        {file.isSystemFile ? (
                          <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/10 shrink-0">
                            SYSTEM
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-secondary/15 text-secondary border border-secondary/20 shrink-0">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-mono">{file.description}</p>
                    </div>
                  </div>

                  {/* Actions on file row */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadAgentFile(file);
                      }}
                      className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                      title="Download file"
                    >
                      <Download size={11} />
                    </button>
                    {!file.isSystemFile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileToDelete(file);
                        }}
                        className="p-1 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded"
                        title="Delete custom file"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code & File Editor (8 cols) */}
        <div className="lg:col-span-8 bg-surface/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Editor Header */}
          {activeFile ? (
            <>
              <div className="p-3.5 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <FileCode size={14} className="text-accent" />
                    {activeFile.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10 uppercase">
                    {activeFile.format}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                      • Unsaved Changes
                    </span>
                  )}
                </div>

                {/* Editor Action Toolbar */}
                <div className="flex items-center gap-1.5">
                  {activeFile.format === 'json' && (
                    <button
                      onClick={handlePrettify}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-mono transition-all flex items-center gap-1"
                      title="Format & Prettify JSON"
                    >
                      <Sparkles size={11} /> Prettify
                    </button>
                  )}

                  {activeFile.isSystemFile && (
                    <button
                      onClick={handleResetToDefault}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg text-xs font-mono transition-all flex items-center gap-1"
                      title="Revert to system default template"
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}

                  <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all"
                    title="Copy file contents"
                  >
                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </button>

                  <button
                    onClick={() => downloadAgentFile(activeFile)}
                    className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all"
                    title="Download file"
                  >
                    <Download size={13} />
                  </button>

                  <button
                    onClick={handleSaveFile}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md",
                      hasUnsavedChanges
                        ? "bg-accent text-background font-black hover:opacity-90"
                        : "bg-white/10 text-zinc-300 hover:text-white hover:bg-white/15"
                    )}
                  >
                    <Save size={13} /> Save & Sync
                  </button>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="relative">
                <textarea
                  rows={20}
                  value={editorContent}
                  onChange={e => handleEditorChange(e.target.value)}
                  className="w-full p-4 bg-black/70 font-mono text-xs text-zinc-200 focus:outline-none resize-y leading-relaxed selection:bg-accent/30 selection:text-white border-0"
                  spellCheck={false}
                />
              </div>

              {/* Editor Status Bar */}
              <div className="px-4 py-2 bg-black/60 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-3">
                  <span>Lines: {editorContent.split('\n').length}</span>
                  <span>Tokens: ~{approxTokens}</span>
                  <span>Size: {new Blob([editorContent]).size} B</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={11} /> Auto-Sync Ready
                  </span>
                  <span>•</span>
                  <span>Last Modified: {activeFile.lastModified}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-zinc-500 font-mono text-xs">
              Select a file to view and edit.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. UPLOAD FILE MODAL */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Upload size={16} className="text-secondary" />
                <h3 className="text-base font-bold silver-text">Upload Agent File</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('agent-file-upload-input')?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                dragActive ? "border-secondary bg-secondary/10" : "border-white/15 hover:border-white/30 bg-black/30"
              )}
            >
              <input
                id="agent-file-upload-input"
                type="file"
                accept=".json,.md,.markdown,.ts,.js,.yaml,.yml,.txt,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload size={24} className="mx-auto text-secondary mb-2" />
              <p className="text-xs font-mono font-bold text-white">
                Drag & drop agent file, or <span className="text-secondary underline">choose file</span>
              </p>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                Supports .json, .md, .yaml, .ts, .txt, .csv
              </p>
              {uploadFileName && (
                <div className="mt-2 inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-zinc-200">
                  Selected: {uploadFileName} ({new Blob([uploadContent]).size} bytes)
                </div>
              )}
            </div>

            {/* Target Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-muted block">Import Strategy</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUploadTargetMode('AUTO_MATCH')}
                  className={cn(
                    "p-2.5 rounded-xl border text-left font-mono text-xs transition-all",
                    uploadTargetMode === 'AUTO_MATCH'
                      ? "bg-accent/15 border-accent text-accent font-bold"
                      : "bg-white/5 border-white/10 text-zinc-400"
                  )}
                >
                  <div className="font-bold">Auto-Sync Existing</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Overwrites matching system file and updates live state</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTargetMode('NEW_CUSTOM')}
                  className={cn(
                    "p-2.5 rounded-xl border text-left font-mono text-xs transition-all",
                    uploadTargetMode === 'NEW_CUSTOM'
                      ? "bg-accent/15 border-accent text-accent font-bold"
                      : "bg-white/5 border-white/10 text-zinc-400"
                  )}
                >
                  <div className="font-bold">Custom Knowledge File</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Stores as supplementary agent context file</div>
                </button>
              </div>
            </div>

            {/* Text Preview / Edit */}
            <div>
              <label className="text-xs font-mono uppercase text-muted block mb-1">File Preview</label>
              <textarea
                rows={5}
                value={uploadContent}
                onChange={e => setUploadContent(e.target.value)}
                placeholder="File contents will display here..."
                className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!uploadFileName.trim() || !uploadContent.trim()}
                onClick={handleConfirmUpload}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all",
                  uploadFileName.trim() && uploadContent.trim()
                    ? "bg-secondary text-background hover:opacity-90 shadow-md"
                    : "bg-white/5 text-zinc-600 cursor-not-allowed"
                )}
              >
                Upload & Sync File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. NEW FILE MODAL */}
      {/* ========================================================================= */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-accent" />
                <h3 className="text-base font-bold silver-text">Create New Agent File</h3>
              </div>
              <button
                onClick={() => setIsNewFileModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewFile} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sales_objections.json or brand_lexicon.md"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono uppercase text-muted block mb-1">Format</label>
                  <select
                    value={newFileFormat}
                    onChange={e => setNewFileFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent"
                  >
                    <option value="json">JSON (.json)</option>
                    <option value="markdown">Markdown (.md)</option>
                    <option value="typescript">TypeScript (.ts)</option>
                    <option value="yaml">YAML (.yaml)</option>
                    <option value="text">Plain Text (.txt)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-muted block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Short summary of purpose"
                    value={newFileDesc}
                    onChange={e => setNewFileDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">Initial Content (Optional)</label>
                <textarea
                  rows={4}
                  value={newFileStarter}
                  onChange={e => setNewFileStarter(e.target.value)}
                  placeholder="Initial template code or knowledge text..."
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent text-background rounded-xl text-xs font-black font-mono uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE CUSTOM FILE MODAL */}
      {/* ========================================================================= */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 size={20} />
              <h3 className="text-base font-bold text-white">Delete File?</h3>
            </div>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{fileToDelete.name}"</strong> from {agent.codename}?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFile(fileToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
