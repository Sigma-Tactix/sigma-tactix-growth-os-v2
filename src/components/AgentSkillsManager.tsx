import React, { useState } from 'react';
import {
  Zap,
  Check,
  X,
  Plus,
  Terminal,
  Search,
  Copy,
  Edit3,
  Trash2,
  Upload,
  Download,
  FileCode,
  Code,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';
import { AgentSkill, ScopedAgent } from '@/src/data/agentCockpitData';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import {
  parseSkillFile,
  exportSkillToJSON,
  exportSkillToMarkdown
} from '@/src/services/agentFilesService';

interface AgentSkillsManagerProps {
  agent: ScopedAgent;
  onUpdateSkills: (updatedSkills: AgentSkill[]) => void;
}

export default function AgentSkillsManager({ agent, onUpdateSkills }: AgentSkillsManagerProps) {
  const { notifySuccess, notifyInfo, notifyError } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSkillId, setCopiedSkillId] = useState<string | null>(null);

  // Modals state
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<AgentSkill | null>(null);

  // New Skill Form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newCategory, setNewCategory] = useState<AgentSkill['category']>('RESEARCH');
  const [newDescription, setNewDescription] = useState('');
  const [newToolSignature, setNewToolSignature] = useState('');
  const [newClearance, setNewClearance] = useState<AgentSkill['clearanceLevel']>('AUTONOMOUS');
  const [newParametersSchema, setNewParametersSchema] = useState('{\n  "type": "object",\n  "properties": {}\n}');
  const [newExecutionCode, setNewExecutionCode] = useState('// Tool execution handler\nexport async function execute(params) {\n  return { success: true };\n}');

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedUploadSkills, setParsedUploadSkills] = useState<AgentSkill[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit Modal Active Tab
  const [editTab, setEditTab] = useState<'general' | 'schema' | 'code' | 'doc'>('general');

  const categories = ['ALL', 'RESEARCH', 'OPTIMIZATION', 'EXECUTION', 'VERIFICATION', 'GOVERNANCE'];

  const filteredSkills = agent.skills.filter(s => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.toolSignature.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleSkill = (skillId: string) => {
    const updated = agent.skills.map(s => {
      if (s.id === skillId) {
        const nextState = !s.isActive;
        notifyInfo(
          `Skill ${nextState ? 'Activated' : 'Suspended'}`,
          `"${s.name}" is now ${nextState ? 'available' : 'restricted'} for ${agent.codename}.`
        );
        return { ...s, isActive: nextState };
      }
      return s;
    });
    onUpdateSkills(updated);
  };

  const handleCopySignature = (skill: AgentSkill) => {
    navigator.clipboard.writeText(skill.toolSignature);
    setCopiedSkillId(skill.id);
    notifyInfo('Tool Signature Copied', skill.toolSignature);
    setTimeout(() => setCopiedSkillId(null), 2000);
  };

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newToolSignature.trim()) return;

    const newSkill: AgentSkill = {
      id: `skill-${Date.now().toString().slice(-4)}`,
      name: newSkillName.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Custom runtime skill deployed to agent.',
      toolSignature: newToolSignature.trim(),
      clearanceLevel: newClearance,
      isActive: true,
      successRate: '100%',
      invocationCount: 0,
      parametersSchema: newParametersSchema.trim() || undefined,
      executionCode: newExecutionCode.trim() || undefined,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...agent.skills, newSkill];
    onUpdateSkills(updated);
    setIsAddSkillModalOpen(false);
    resetNewSkillForm();
    notifySuccess(
      'New Skill Added',
      `"${newSkill.name}" registered to ${agent.name} (${agent.codename}).`
    );
  };

  const resetNewSkillForm = () => {
    setNewSkillName('');
    setNewDescription('');
    setNewToolSignature('');
    setNewCategory('RESEARCH');
    setNewClearance('AUTONOMOUS');
    setNewParametersSchema('{\n  "type": "object",\n  "properties": {}\n}');
    setNewExecutionCode('// Tool execution handler\nexport async function execute(params) {\n  return { success: true };\n}');
  };

  const handleOpenEdit = (skill: AgentSkill) => {
    setEditingSkill({
      ...skill,
      parametersSchema: skill.parametersSchema || '{\n  "type": "object",\n  "properties": {}\n}',
      executionCode: skill.executionCode || `// MCP execution handler for ${skill.name}\nexport async function execute(params) {\n  return { status: "success", timestamp: new Date().toISOString() };\n}`,
      markdownDoc: skill.markdownDoc || `# ${skill.name}\n\n${skill.description}\n\nSignature: \`${skill.toolSignature}\``
    });
    setEditTab('general');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;

    const updated = agent.skills.map(s => {
      if (s.id === editingSkill.id) {
        return {
          ...editingSkill,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return s;
    });

    onUpdateSkills(updated);
    notifySuccess('Skill Updated', `Changes to "${editingSkill.name}" saved successfully.`);
    setEditingSkill(null);
  };

  const handleDuplicateSkill = (skill: AgentSkill) => {
    const clone: AgentSkill = {
      ...skill,
      id: `skill-${Date.now().toString().slice(-4)}`,
      name: `${skill.name} (Copy)`,
      toolSignature: skill.toolSignature.replace(/\((.*)\)/, '_v2($1)'),
      invocationCount: 0,
      successRate: '100%',
      lastUpdated: 'Just now'
    };

    onUpdateSkills([...agent.skills, clone]);
    notifySuccess('Skill Duplicated', `Created clone: "${clone.name}".`);
  };

  const handleDeleteSkill = (skill: AgentSkill) => {
    const updated = agent.skills.filter(s => s.id !== skill.id);
    onUpdateSkills(updated);
    setSkillToDelete(null);
    notifyInfo('Skill Deleted', `"${skill.name}" removed from ${agent.codename}.`);
  };

  const handleExportSkill = (skill: AgentSkill, format: 'json' | 'md') => {
    let content = '';
    let filename = '';
    let mime = 'text/plain';

    if (format === 'json') {
      content = exportSkillToJSON(skill);
      filename = `${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_skill.json`;
      mime = 'application/json';
    } else {
      content = exportSkillToMarkdown(skill);
      filename = `${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_SKILL.md`;
      mime = 'text/markdown';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess('Skill Exported', `Saved ${filename} to your downloads.`);
  };

  const handleExportAllSkills = () => {
    const json = JSON.stringify(agent.skills, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agent.codename.toLowerCase()}-skills-catalog.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess('All Skills Exported', `Exported ${agent.skills.length} skills to JSON.`);
  };

  // Upload handling
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSkillFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSkillFile(e.target.files[0]);
    }
  };

  const processSkillFile = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setUploadText(text);
      try {
        const skills = parseSkillFile(text, file.name);
        setParsedUploadSkills(skills);
        setUploadError(null);
      } catch (err: any) {
        setUploadError(`Failed to parse skill file: ${err.message}`);
        setParsedUploadSkills([]);
      }
    };
    reader.readAsText(file);
  };

  const handleManualUploadTextChange = (text: string) => {
    setUploadText(text);
    if (!text.trim()) {
      setParsedUploadSkills([]);
      setUploadError(null);
      return;
    }
    try {
      const skills = parseSkillFile(text, uploadedFileName || 'uploaded_skill.json');
      setParsedUploadSkills(skills);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(`Parse error: ${err.message}`);
      setParsedUploadSkills([]);
    }
  };

  const handleConfirmUpload = () => {
    if (parsedUploadSkills.length === 0) return;

    // Merge: update matching or append new
    const updatedSkills = [...agent.skills];
    let addedCount = 0;
    let updatedCount = 0;

    parsedUploadSkills.forEach(newSkill => {
      const existingIdx = updatedSkills.findIndex(s => s.id === newSkill.id || s.name === newSkill.name);
      if (existingIdx >= 0) {
        updatedSkills[existingIdx] = { ...updatedSkills[existingIdx], ...newSkill };
        updatedCount++;
      } else {
        updatedSkills.push(newSkill);
        addedCount++;
      }
    });

    onUpdateSkills(updatedSkills);
    notifySuccess(
      'Skills Uploaded & Registered',
      `Imported ${parsedUploadSkills.length} skill(s) (${addedCount} new, ${updatedCount} updated) for ${agent.codename}.`
    );
    setIsUploadModalOpen(false);
    setUploadText('');
    setUploadedFileName('');
    setParsedUploadSkills([]);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h4 className="text-base font-bold silver-text flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            Specialized Skills Matrix ({agent.skills.length})
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Editable MCP tools, programmatic capabilities, and uploadable skill files for {agent.codename}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Upload Skill button */}
          <button
            onClick={() => {
              setIsUploadModalOpen(true);
              setUploadText('');
              setUploadedFileName('');
              setParsedUploadSkills([]);
              setUploadError(null);
            }}
            className="px-3.5 py-1.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Upload .json, .md (SKILL.md), or .ts skill definition"
          >
            <Upload size={14} /> Upload Skill
          </button>

          {/* Add Skill button */}
          <button
            onClick={() => setIsAddSkillModalOpen(true)}
            className="px-3.5 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} /> Add Skill
          </button>

          {/* Export All Skills */}
          <button
            onClick={handleExportAllSkills}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-mono transition-all flex items-center gap-1.5"
            title="Download all skills as JSON"
          >
            <Download size={13} /> Export All ({agent.skills.length})
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category filters */}
        <div className="sigma-segmented font-mono">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "sigma-segment !min-h-8 !py-1 text-[11px]",
                selectedCategory === cat
                  ? "sigma-segment-active"
                  : ""
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search skills, signatures..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-accent font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="p-8 text-center bg-surface/30 border border-white/5 rounded-2xl space-y-2">
          <Zap size={24} className="mx-auto text-zinc-600" />
          <p className="text-sm font-mono text-zinc-400">No skills found matching filter.</p>
          <button
            onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
            className="text-xs font-mono text-accent underline hover:opacity-80"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map(skill => (
            <div
              key={skill.id}
              className={cn(
                "p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 group relative",
                skill.isActive
                  ? "bg-surface/80 border-white/10 hover:border-accent/40 shadow-sm"
                  : "bg-surface/30 border-white/5 opacity-65 hover:opacity-80"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white group-hover:text-accent transition-colors">
                        {skill.name}
                      </span>
                      <span className={cn(
                        "text-[11px] font-mono uppercase px-1.5 py-0.5 rounded font-bold",
                        skill.clearanceLevel === 'AUTONOMOUS' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        skill.clearanceLevel === 'RESTRICTED_HITL' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      )}>
                        {skill.clearanceLevel}
                      </span>
                      {skill.parametersSchema && (
                        <span className="text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded flex items-center gap-0.5" title="Has Parameter Schema">
                          <Code size={10} /> Schema
                        </span>
                      )}
                      {skill.executionCode && (
                        <span className="text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 rounded flex items-center gap-0.5" title="Has Execution Code">
                          <FileCode size={10} /> Code
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-accent">{skill.category}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400">ID: {skill.id}</span>
                      {skill.lastUpdated && (
                        <>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-500 text-[11px]">Upd: {skill.lastUpdated}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Toggle Active Button */}
                  <button
                    onClick={() => handleToggleSkill(skill.id)}
                    title={skill.isActive ? "Disable Skill" : "Enable Skill"}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all border shrink-0",
                      skill.isActive
                        ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700"
                    )}
                  >
                    {skill.isActive ? <Check size={14} /> : <X size={14} />}
                  </button>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed mt-1.5">{skill.description}</p>
              </div>

              {/* Signature & Controls */}
              <div className="pt-2 border-t border-white/5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/5 font-mono text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Terminal size={12} className="text-secondary shrink-0" />
                    <span className="truncate text-zinc-300 select-all">{skill.toolSignature}</span>
                  </div>
                  <button
                    onClick={() => handleCopySignature(skill)}
                    className="hover:text-accent transition-colors shrink-0 p-1"
                    title="Copy signature"
                  >
                    {copiedSkillId === skill.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                  <div className="flex items-center gap-3">
                    <span>Success: <strong className="text-white">{skill.successRate}</strong></span>
                    <span>Invocations: <strong className="text-secondary">{skill.invocationCount}</strong></span>
                  </div>

                  {/* Action Buttons: Edit, Duplicate, Export, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(skill)}
                      className="px-2 py-1 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-md border border-white/5 hover:border-accent/30 text-zinc-300 transition-all flex items-center gap-1"
                      title="Edit skill properties, schema and code"
                    >
                      <Edit3 size={11} /> Edit
                    </button>

                    <button
                      onClick={() => handleDuplicateSkill(skill)}
                      className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-all"
                      title="Duplicate skill"
                    >
                      <Layers size={12} />
                    </button>

                    <button
                      onClick={() => handleExportSkill(skill, 'json')}
                      className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-all"
                      title="Export skill as JSON"
                    >
                      <Download size={12} />
                    </button>

                    <button
                      onClick={() => setSkillToDelete(skill)}
                      className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded-md text-zinc-500 transition-all"
                      title="Delete skill"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. EDIT SKILL MODAL */}
      {/* ========================================================================= */}
      {editingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold silver-text">
                    Edit Skill: {editingSkill.name}
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Agent: {agent.codename} • ID: {editingSkill.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSkill(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs in Edit Modal */}
            <div className="sigma-segmented mx-5 mt-3">
              <button
                type="button"
                onClick={() => setEditTab('general')}
                className={cn(
                  "sigma-segment font-mono",
                  editTab === 'general'
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                General Settings
              </button>
              <button
                type="button"
                onClick={() => setEditTab('schema')}
                className={cn(
                  "sigma-segment font-mono flex items-center gap-1.5",
                  editTab === 'schema'
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                <Code size={12} /> Parameters Schema (JSON)
              </button>
              <button
                type="button"
                onClick={() => setEditTab('code')}
                className={cn(
                  "sigma-segment font-mono flex items-center gap-1.5",
                  editTab === 'code'
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                <FileCode size={12} /> Execution Handler (TS/JS)
              </button>
              <button
                type="button"
                onClick={() => setEditTab('doc')}
                className={cn(
                  "sigma-segment font-mono flex items-center gap-1.5",
                  editTab === 'doc'
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                <FileText size={12} /> SKILL.md Doc
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {editTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-muted block mb-1">Skill Name</label>
                    <input
                      type="text"
                      required
                      value={editingSkill.name}
                      onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono uppercase text-muted block mb-1">Category</label>
                      <select
                        value={editingSkill.category}
                        onChange={e => setEditingSkill({ ...editingSkill, category: e.target.value as any })}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent font-mono"
                      >
                        <option value="RESEARCH">RESEARCH</option>
                        <option value="OPTIMIZATION">OPTIMIZATION</option>
                        <option value="EXECUTION">EXECUTION</option>
                        <option value="VERIFICATION">VERIFICATION</option>
                        <option value="GOVERNANCE">GOVERNANCE</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-mono uppercase text-muted block mb-1">Clearance Level</label>
                      <select
                        value={editingSkill.clearanceLevel}
                        onChange={e => setEditingSkill({ ...editingSkill, clearanceLevel: e.target.value as any })}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent font-mono"
                      >
                        <option value="AUTONOMOUS">AUTONOMOUS</option>
                        <option value="RESTRICTED_HITL">RESTRICTED_HITL</option>
                        <option value="HIGH_SECURITY">HIGH_SECURITY</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase text-muted block mb-1">Tool Signature / Function Call</label>
                    <input
                      type="text"
                      required
                      value={editingSkill.toolSignature}
                      onChange={e => setEditingSkill({ ...editingSkill, toolSignature: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-accent focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase text-muted block mb-1">Description & Operational Role</label>
                    <textarea
                      rows={3}
                      value={editingSkill.description}
                      onChange={e => setEditingSkill({ ...editingSkill, description: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-mono uppercase text-muted block mb-1">Success Rate</label>
                      <input
                        type="text"
                        value={editingSkill.successRate}
                        onChange={e => setEditingSkill({ ...editingSkill, successRate: e.target.value })}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase text-muted block mb-1">Invocation Count</label>
                      <input
                        type="number"
                        value={editingSkill.invocationCount}
                        onChange={e => setEditingSkill({ ...editingSkill, invocationCount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="skill-active-toggle"
                      checked={editingSkill.isActive}
                      onChange={e => setEditingSkill({ ...editingSkill, isActive: e.target.checked })}
                      className="rounded border-white/20 bg-black/40 text-accent focus:ring-accent"
                    />
                    <label htmlFor="skill-active-toggle" className="text-xs font-mono text-zinc-300">
                      Skill is active and available for execution
                    </label>
                  </div>
                </div>
              )}

              {editTab === 'schema' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-muted">MCP Tool JSON Schema</label>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const formatted = JSON.stringify(JSON.parse(editingSkill.parametersSchema || '{}'), null, 2);
                          setEditingSkill({ ...editingSkill, parametersSchema: formatted });
                        } catch {}
                      }}
                      className="text-[10px] font-mono text-accent hover:underline"
                    >
                      Prettify JSON
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={editingSkill.parametersSchema}
                    onChange={e => setEditingSkill({ ...editingSkill, parametersSchema: e.target.value })}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-accent leading-normal"
                    placeholder='{\n  "type": "object",\n  "properties": {\n    "param1": { "type": "string" }\n  }\n}'
                  />
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Defines the input parameters and validation constraints accepted by this skill.
                  </p>
                </div>
              )}

              {editTab === 'code' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-muted">Execution Script / Handler</label>
                    <span className="text-[10px] font-mono text-zinc-400">TypeScript / ES Module</span>
                  </div>
                  <textarea
                    rows={12}
                    value={editingSkill.executionCode}
                    onChange={e => setEditingSkill({ ...editingSkill, executionCode: e.target.value })}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-accent leading-normal"
                    placeholder="// Tool execution logic\nexport async function execute(params) {\n  // Implementation\n}"
                  />
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Programmatic implementation body invoked when the model triggers this tool signature.
                  </p>
                </div>
              )}

              {editTab === 'doc' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-muted">Markdown Documentation (SKILL.md)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const md = exportSkillToMarkdown(editingSkill);
                        setEditingSkill({ ...editingSkill, markdownDoc: md });
                      }}
                      className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={10} /> Auto-Generate from Attributes
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={editingSkill.markdownDoc}
                    onChange={e => setEditingSkill({ ...editingSkill, markdownDoc: e.target.value })}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-accent leading-relaxed"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportSkill(editingSkill, 'json')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-mono flex items-center gap-1"
                  >
                    <Download size={12} /> JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportSkill(editingSkill, 'md')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-mono flex items-center gap-1"
                  >
                    <FileText size={12} /> SKILL.md
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSkill(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-accent text-background rounded-xl text-xs font-black font-mono uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. UPLOAD SKILL MODAL */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                  <Upload size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold silver-text">
                    Upload Skill to {agent.codename}
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Supports .json, .md (SKILL.md), .ts, or .js tool definitions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                  dragActive
                    ? "border-secondary bg-secondary/10"
                    : "border-white/15 hover:border-white/30 bg-black/20"
                )}
                onClick={() => document.getElementById('skill-file-input')?.click()}
              >
                <input
                  id="skill-file-input"
                  type="file"
                  accept=".json,.md,.markdown,.ts,.js,.yaml,.yml"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Upload size={24} className="mx-auto text-secondary mb-2" />
                <p className="text-xs font-mono font-bold text-white">
                  Drop skill file here, or <span className="text-secondary underline">browse files</span>
                </p>
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  Accepts JSON schemas, SKILL.md docs with frontmatter, or TypeScript tool functions
                </p>
                {uploadedFileName && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-zinc-200">
                    <FileCode size={12} className="text-secondary" />
                    <span>{uploadedFileName}</span>
                  </div>
                )}
              </div>

              {/* Paste or Edit raw file text */}
              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">
                  Or Paste Skill Definition Content
                </label>
                <textarea
                  rows={6}
                  value={uploadText}
                  onChange={e => handleManualUploadTextChange(e.target.value)}
                  placeholder='Paste JSON, SKILL.md markdown, or TypeScript tool snippet here...'
                  className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Parsing Feedback */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {parsedUploadSkills.length > 0 && (
                <div className="space-y-2 border border-secondary/20 bg-secondary/5 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-secondary">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Detected {parsedUploadSkills.length} Valid Skill(s):
                    </span>
                    <span className="text-[10px] text-zinc-400">Ready to Register</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parsedUploadSkills.map((sk, idx) => (
                      <div key={idx} className="p-2.5 bg-black/40 border border-white/5 rounded-lg space-y-1 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{sk.name}</span>
                          <span className="text-[10px] text-accent px-1.5 py-0.5 rounded bg-accent/10">
                            {sk.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-300 truncate">{sk.description}</div>
                        <div className="text-[10px] text-secondary truncate">{sk.toolSignature}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedUploadSkills.length === 0}
                onClick={handleConfirmUpload}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-black font-mono uppercase tracking-wider transition-all flex items-center gap-1.5",
                  parsedUploadSkills.length > 0
                    ? "bg-secondary text-background hover:opacity-90 shadow-md"
                    : "bg-white/5 text-zinc-600 cursor-not-allowed"
                )}
              >
                <Upload size={13} /> Import & Register ({parsedUploadSkills.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADD SKILL MODAL */}
      {/* ========================================================================= */}
      {isAddSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold silver-text flex items-center gap-2">
                <Plus size={18} className="text-accent" />
                Register Skill to {agent.codename}
              </h3>
              <button
                onClick={() => setIsAddSkillModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Semantic Vector Cluster Extractor"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono uppercase text-muted block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent font-mono"
                  >
                    <option value="RESEARCH">RESEARCH</option>
                    <option value="OPTIMIZATION">OPTIMIZATION</option>
                    <option value="EXECUTION">EXECUTION</option>
                    <option value="VERIFICATION">VERIFICATION</option>
                    <option value="GOVERNANCE">GOVERNANCE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-muted block mb-1">Clearance Level</label>
                  <select
                    value={newClearance}
                    onChange={e => setNewClearance(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent font-mono"
                  >
                    <option value="AUTONOMOUS">AUTONOMOUS</option>
                    <option value="RESTRICTED_HITL">RESTRICTED_HITL</option>
                    <option value="HIGH_SECURITY">HIGH_SECURITY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">Tool Signature / Function Call</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., extract_semantic_clusters(seed: string, depth: number)"
                  value={newToolSignature}
                  onChange={e => setNewToolSignature(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted block mb-1">Description & Operational Role</label>
                <textarea
                  rows={3}
                  placeholder="Describe the operational purpose and expected output..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddSkillModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent text-background rounded-xl text-xs font-black font-mono uppercase tracking-wider hover:opacity-90 transition-all"
                >
                  Register Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {skillToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Skill?</h3>
                <p className="text-xs font-mono text-zinc-400">{skillToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-mono leading-relaxed">
              Are you sure you want to remove <strong className="text-white">"{skillToDelete.name}"</strong> ({skillToDelete.toolSignature}) from {agent.codename}? Agents will no longer be able to invoke this tool.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setSkillToDelete(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSkill(skillToDelete)}
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
