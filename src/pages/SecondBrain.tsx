import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Database, 
  Shield, 
  Lock, 
  Search, 
  Plus, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Key, 
  Tag, 
  Layers, 
  Clock, 
  Cpu, 
  UserCheck, 
  X, 
  ChevronRight,
  Filter,
  Check,
  Download,
  HardDriveDownload,
  RefreshCw,
  UploadCloud,
  FileCheck,
  FileType,
  CopyCheck,
  Trash2,
  FolderSync
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { EMPTY_SECOND_BRAIN_VAULTS, SecondBrainVault, VaultRecord } from '@/src/data/secondBrainVaults';
import { hydrateSecondBrainVaults, type PersistedVaultDocument } from '@/src/lib/secondBrainDocuments';
import { useToast } from '@/src/contexts/ToastContext';
import { analyzeVaultDocument, apiFetch } from '@/src/lib/api';
import { Button, GlassCard, Badge, Input } from '@/src/components/ui';

export const VAULT_TAG_STYLES: Record<string, { label: string; badge: string }> = {
  'executive-vault': { label: 'Executive Strategy', badge: 'bg-amber-500/10 text-amber-accent border-amber-500/30' },
  'credentials-vault': { label: 'Credentials & Auth', badge: 'bg-rose-500/10 text-rose-accent border-rose-500/30' },
  'brand-vault': { label: 'Brand Voice', badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
  'customer-vault': { label: 'Customer & ICP', badge: 'bg-sky-500/10 text-sky-accent border-sky-500/30' },
  'marketing-vault': { label: 'Paid Marketing', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
  'website-vault': { label: 'Website & CRO', badge: 'bg-cyan-500/10 text-cyan-accent border-cyan-500/30' },
  'authority-vault': { label: 'Authority & SEO', badge: 'bg-emerald-500/10 text-emerald-accent border-emerald-500/30' },
  'operations-vault': { label: 'Operations & SOP', badge: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
  'ai-workflow-vault': { label: 'AI Workflow', badge: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30' },
  'audit-vault': { label: 'Growth Audit', badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30' },
  'technical-vault': { label: 'Technical Spec', badge: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30' }
};

export const getVaultTagInfo = (vaultId: string) => {
  return VAULT_TAG_STYLES[vaultId] || { label: vaultId.replace('-vault', ''), badge: 'bg-white/10 text-zinc-300 border-white/20' };
};

export const identifyDestinationVault = (
  fileName: string, 
  content: string, 
  title?: string, 
  tags?: string[]
): { vaultId: string; confidence: number; reasoning: string } => {
  const combined = `${fileName} ${title || ''} ${(tags || []).join(' ')} ${content.slice(0, 2000)}`.toLowerCase();

  const rules: { vaultId: string; keywords: string[]; label: string }[] = [
    {
      vaultId: 'authority-vault',
      keywords: ['seo', 'aeo', 'schema markup', 'structured data', 'backlink', 'serp', 'ranking', 'sitemap', 'crawler', 'citation', 'entity', 'google search console', 'gsc', 'json-ld'],
      label: 'Authority Vault (SEO & AEO Intelligence)'
    },
    {
      vaultId: 'marketing-vault',
      keywords: ['ad', 'cpc', 'cpa', 'roas', 'media plan', 'google ads', 'meta ads', 'linkedin ads', 'campaign', 'creative', 'ad spend', 'retargeting', 'demand gen', 'budget', 'impressions', 'ctr', 'ad copy'],
      label: 'Marketing Vault (Paid Media & Growth Campaigns)'
    },
    {
      vaultId: 'customer-vault',
      keywords: ['icp', 'customer', 'buyer persona', 'firmographic', 'tam', 'prospect', 'pain point', 'objection', 'account-based', 'abm', 'target account', 'customer segment', 'buyer journey'],
      label: 'Customer Vault (ICP & Buyer Personas)'
    },
    {
      vaultId: 'website-vault',
      keywords: ['website', 'cro', 'landing page', 'conversion rate', 'funnel', 'dom', 'lighthouse', 'lcp', 'page speed', 'bounce rate', 'a/b test', 'heatmap'],
      label: 'Website Vault (Conversion & Web Performance)'
    },
    {
      vaultId: 'brand-vault',
      keywords: ['brand', 'voice', 'tone', 'guidelines', 'narrative', 'typography', 'palette', 'mission', 'storytelling', 'tagline', 'logo', 'visual identity', 'brand book'],
      label: 'Brand Vault (Brand Voice & Assets)'
    },
    {
      vaultId: 'credentials-vault',
      keywords: ['api key', 'secret', 'token', 'oauth', 'credential', 'password', 'bearer', 'private key', 'env variable', '.env'],
      label: 'Credentials Vault (Secrets & Keys)'
    },
    {
      vaultId: 'audit-vault',
      keywords: ['audit', 'diagnostic', 'gap analysis', 'leak', 'scorecard', 'benchmark report', '90-day plan', 'evaluation', 'assessment'],
      label: 'Audit Vault (Diagnostics & Evaluations)'
    },
    {
      vaultId: 'operations-vault',
      keywords: ['sop', 'operations', 'workflow', 'escalation', 'protocol', 'governance', 'human review', 'handbook', 'procedure', 'checklist', 'runbook'],
      label: 'Operations Vault (SOPs & Procedures)'
    },
    {
      vaultId: 'ai-workflow-vault',
      keywords: ['prompt', 'llm', 'hyperparameter', 'temperature', 'dag', 'gemini', 'anthropic', 'openai', 'system prompt', 'fine-tune', 'embedding'],
      label: 'AI Workflow Vault (Agent Configurations)'
    },
    {
      vaultId: 'technical-vault',
      keywords: ['technical', 'schema', 'webhook', 'database', 'sql', 'postgres', 'docker', 'kubernetes', 'dns', 'git', 'endpoint', 'api', 'migration', 'deployment'],
      label: 'Technical Vault (Infrastructure & Code Specs)'
    }
  ];

  // File extension heuristics for binary or non-readable files
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const extensionHints: Record<string, { vaultId: string; label: string }> = {
    'pptx': { vaultId: 'executive-vault', label: 'Executive Vault (Presentations)' },
    'ppt': { vaultId: 'executive-vault', label: 'Executive Vault (Presentations)' },
    'png': { vaultId: 'brand-vault', label: 'Brand Vault (Visual Assets)' },
    'jpg': { vaultId: 'brand-vault', label: 'Brand Vault (Visual Assets)' },
    'jpeg': { vaultId: 'brand-vault', label: 'Brand Vault (Visual Assets)' },
    'svg': { vaultId: 'brand-vault', label: 'Brand Vault (Visual Assets)' },
    'gif': { vaultId: 'brand-vault', label: 'Brand Vault (Visual Assets)' },
    'webp': { vaultId: 'brand-vault', label: 'Brand Vault (Visual Assets)' },
    'figma': { vaultId: 'brand-vault', label: 'Brand Vault (Design Assets)' },
    'ai': { vaultId: 'brand-vault', label: 'Brand Vault (Design Assets)' },
    'psd': { vaultId: 'brand-vault', label: 'Brand Vault (Design Assets)' },
    'sql': { vaultId: 'technical-vault', label: 'Technical Vault (Database Scripts)' },
    'json': { vaultId: 'technical-vault', label: 'Technical Vault (Configuration)' },
    'yaml': { vaultId: 'technical-vault', label: 'Technical Vault (Configuration)' },
    'yml': { vaultId: 'technical-vault', label: 'Technical Vault (Configuration)' },
    'env': { vaultId: 'credentials-vault', label: 'Credentials Vault (Environment Files)' },
    'key': { vaultId: 'credentials-vault', label: 'Credentials Vault (Key Files)' },
    'pem': { vaultId: 'credentials-vault', label: 'Credentials Vault (Certificate Files)' },
    'mp4': { vaultId: 'brand-vault', label: 'Brand Vault (Video Assets)' },
    'mov': { vaultId: 'brand-vault', label: 'Brand Vault (Video Assets)' },
  };

  let bestMatch = { vaultId: '', confidence: 0, reasoning: 'No strong classification signal detected. Choose a destination vault before ingesting.' };
  let highestScore = 0;

  const keywordMatches = (text: string, keyword: string) => {
    const escaped = keyword.trim().split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
  };

  for (const rule of rules) {
    let score = 0;
    const matched: string[] = [];
    for (const kw of rule.keywords) {
      if (keywordMatches(combined, kw)) {
        // Multi-word keywords are stronger signals
        score += kw.includes(' ') ? 2 : 1;
        matched.push(kw);
      }
    }
    if (score > highestScore) {
      highestScore = score;
      const confidence = Math.min(98, 72 + score * 5);
      bestMatch = {
        vaultId: rule.vaultId,
        confidence,
        reasoning: `Matched keywords: ${matched.slice(0, 4).join(', ')}`
      };
    }
  }

  // If keyword scoring was too weak, fall back to extension heuristics
  if (highestScore <= 1 && extensionHints[ext]) {
    bestMatch = {
      vaultId: extensionHints[ext].vaultId,
      confidence: 68,
      reasoning: `Routed by file type (.${ext}) — ${extensionHints[ext].label}`
    };
  }

  return bestMatch;
};

export default function SecondBrain() {
  const { notifySuccess, notifyInfo, notifyError } = useToast();
  // Support 'all' for All Vaults View
  const [selectedVaultId, setSelectedVaultId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<VaultRecord | null>(null);
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string>('Not exported');
  const [rbacTestRole, setRbacTestRole] = useState<string>('ADMIN');
  const [vectorSearchPrompt, setVectorSearchPrompt] = useState('');
  const [vectorSearchResults, setVectorSearchResults] = useState<Array<{ record: VaultRecord; similarity: number }> | null>(null);
  const [vaults, setVaults] = useState<SecondBrainVault[]>(EMPTY_SECOND_BRAIN_VAULTS);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentLoadError, setDocumentLoadError] = useState<string | null>(null);

  // New Record Form State
  const [targetVaultId, setTargetVaultId] = useState<string>('executive-vault');
  const [autoVaultMeta, setAutoVaultMeta] = useState<{ vaultId: string; confidence: number; reasoning: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newClassification, setNewClassification] = useState<VaultRecord['classification']>('STRATEGIC_CORE');
  const [newTags, setNewTags] = useState('Strategy, AI, Ingest');

  // File Upload & AI Auto-fill State
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);

  const refreshPersistedDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    setDocumentLoadError(null);
    try {
      const response = await apiFetch('/api/workspace/vault/documents');
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !Array.isArray(result.documents)) {
        throw new Error(result.error || 'The workspace document index could not be loaded.');
      }
      setVaults(hydrateSecondBrainVaults(result.documents as PersistedVaultDocument[]));
    } catch (error) {
      setDocumentLoadError(error instanceof Error ? error.message : 'The workspace document index could not be loaded.');
      setVaults(EMPTY_SECOND_BRAIN_VAULTS);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    void refreshPersistedDocuments();
  }, [refreshPersistedDocuments]);

  // Auto-deduplication checker
  const checkForDuplicate = (title: string, content: string): { isDup: boolean; matchedRecord?: VaultRecord; matchedVault?: SecondBrainVault } => {
    const normTitle = title.trim().toLowerCase();
    const sampleContent = content.trim().slice(0, 250).toLowerCase();

    for (const v of vaults) {
      for (const rec of v.records) {
        const recTitle = rec.title.trim().toLowerCase();
        const recSample = (rec.content || '').trim().slice(0, 250).toLowerCase();

        if (normTitle && recTitle === normTitle) {
          return { isDup: true, matchedRecord: rec, matchedVault: v };
        }
        if (sampleContent.length > 50 && recSample.length > 50 && sampleContent === recSample) {
          return { isDup: true, matchedRecord: rec, matchedVault: v };
        }
      }
    }
    return { isDup: false };
  };

  // 1-Click Deduplication Tool
  const handleDeduplicateVaults = () => {
    notifyInfo(
      'Duplicate cleanup is not available yet',
      'No records were changed. Durable deduplication needs a server-side review and an explicit delete/tombstone workflow.'
    );
  };

  const processDocumentFile = async (file: File) => {
    setIsAnalyzingFile(true);
    setIsNewRecordModalOpen(true);
    setPendingUploadFile(file);

    try {
      const res = await analyzeVaultDocument(file);
      if (res.success && res.analysis) {
        const title = res.analysis.title || file.name.replace(/\.[^/.]+$/, '');
        const content = res.analysis.content || '';
        const tags = res.analysis.tags || ['Knowledge', 'Strategy'];

        // Check for exact duplicate
        const dupCheck = checkForDuplicate(title, content);
        if (dupCheck.isDup) {
          notifyInfo(
            'Exact Duplicate Detected',
            `"${title}" is already stored in ${dupCheck.matchedVault?.name}. Auto-deduplication bypassed re-upload.`
          );
          setSelectedRecord(dupCheck.matchedRecord || null);
          setIsNewRecordModalOpen(false);
          setIsAnalyzingFile(false);
          return;
        }

        // Auto-identify best vault
        const routing = identifyDestinationVault(file.name, content, title, tags);
        setTargetVaultId(routing.vaultId);
        setAutoVaultMeta(routing);

        setNewTitle(title);
        setNewCategory(res.analysis.category || 'Strategic Ingest');
        setNewClassification(res.analysis.classification || 'STRATEGIC_CORE');
        setNewSummary(res.analysis.summary || '');
        setNewContent(content);
        setNewTags(tags.join(', '));
        setUploadedFileMeta({
          name: res.fileName || file.name,
          size: res.fileSize || `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || 'Document'
        });

        const vaultName = vaults.find(v => v.id === routing.vaultId)?.name || 'Manual classification required';
        notifySuccess(
          'Document Analyzed & Auto-Routed',
          `Parsed "${file.name}" and auto-identified destination as ${vaultName} (${routing.confidence}% confidence).`,
          { category: 'SYSTEM' }
        );
      }
    } catch (err: any) {
      console.warn('Backend document analysis fallback to local reader:', err);
      // Fallback: Read client-side
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');

        // Check duplicate
        const dupCheck = checkForDuplicate(cleanName, text);
        if (dupCheck.isDup) {
          notifyInfo(
            'Duplicate Skipped',
            `"${cleanName}" already exists in ${dupCheck.matchedVault?.name}. Duplicate upload cancelled.`
          );
          setSelectedRecord(dupCheck.matchedRecord || null);
          setIsNewRecordModalOpen(false);
          setIsAnalyzingFile(false);
          return;
        }

        const routing = identifyDestinationVault(file.name, text, cleanName, ['Document', 'Ingest']);
        setTargetVaultId(routing.vaultId);
        setAutoVaultMeta(routing);

        setNewTitle(cleanName);
        setNewCategory('Document Ingest');
        setNewClassification('STRATEGIC_CORE');
        setNewSummary(`Extracted content from ${file.name} for corporate knowledge retrieval.`);
        setNewContent(text.slice(0, 100000));
        setNewTags('Document, Ingest, Vault');
        setUploadedFileMeta({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || 'Document'
        });

        const vName = vaults.find(v => v.id === routing.vaultId)?.name || 'Manual classification required';
        notifySuccess(
          'File Auto-Routed to Vault',
          `Parsed "${file.name}" locally. Destination set to ${vName}. Review and adjust before saving.`,
          { category: 'SYSTEM' }
        );
      };
      reader.onerror = () => {
        notifyInfo('Upload Notice', 'Could not parse file directly. Please fill details manually.');
      };
      if (file.type.includes('text') || file.name.match(/\.(txt|md|json|csv|html|xml|yaml|yml)$/i)) {
        reader.readAsText(file);
      } else {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const routing = identifyDestinationVault(file.name, '', cleanName, ['Binary', 'Asset']);
        setTargetVaultId(routing.vaultId);
        setAutoVaultMeta(routing);

        setNewTitle(cleanName);
        setNewCategory('Binary Asset Ingest');
        setNewSummary(`Binary asset (${file.name}, ${(file.size / 1024).toFixed(1)} KB) staged for vault indexing.`);
        setNewContent(`[Binary File Payload: ${file.name} (${file.size} bytes)]`);
        setNewTags('Binary, Upload, File');
        setUploadedFileMeta({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || 'Document'
        });
      }
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const activeVault = useMemo(() => {
    return vaults.find(v => v.id === selectedVaultId) || vaults[0];
  }, [vaults, selectedVaultId]);

  const totalAllRecordsCount = useMemo(() => {
    return vaults.reduce((sum, v) => sum + v.records.length, 0);
  }, [vaults]);

  // Filter records: if 'all', aggregates across all configured vaults.
  const filteredRecords = useMemo(() => {
    const baseList: VaultRecord[] = selectedVaultId === 'all'
      ? vaults.flatMap(v => v.records)
      : activeVault.records;

    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.toLowerCase();
    return baseList.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [selectedVaultId, vaults, activeVault, searchQuery]);

  // RBAC permission check for current test role
  const isAccessAllowedForRole = (record: VaultRecord, role: string) => {
    if (role === 'ADMIN') return true;
    if (record.classification === 'RESTRICTED_C_LEVEL' || record.classification === 'ENCRYPTED_SECRET') {
      return false;
    }
    return record.allowedRoles.includes(role);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    if (!targetVaultId) {
      notifyInfo('Classification Required', 'No reliable vault signal was found. Select the correct destination vault before ingesting.');
      return;
    }

    // Check duplicate
    const dup = checkForDuplicate(newTitle, newContent);
    if (dup.isDup) {
      notifyInfo(
        'Duplicate Document Detected',
        `A record matching "${newTitle}" already exists in ${dup.matchedVault?.name}. Creation skipped to prevent duplicate records.`
      );
      return;
    }

    const destinationVaultId = targetVaultId || (selectedVaultId === 'all' ? 'executive-vault' : selectedVaultId);

    const generatedFile = new File(
      [[
        `# ${newTitle}`,
        newCategory ? `Category (unverified): ${newCategory}` : '',
        `Proposed classification (not access control): ${newClassification}`,
        newTags ? `Tags (unverified): ${newTags}` : '',
        newSummary ? `Summary: ${newSummary}` : '',
        '',
        newContent,
      ].filter(Boolean).join('\n\n')],
      `${newTitle.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'vault-record'}.md`,
      { type: 'text/markdown' },
    );
    const formData = new FormData();
    formData.append('file', pendingUploadFile || generatedFile);
    formData.append('vaultId', destinationVaultId);
    try {
      const response = await apiFetch('/api/workspace/vault/upload', { method: 'POST', body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || 'The document could not be persisted.');
      await refreshPersistedDocuments();
      const indexState = result.file?.status === 'Indexed' ? 'Semantic index verified.' : 'Stored; semantic index is not verified.';
      notifySuccess('Document persisted', `Saved "${newTitle}" to the workspace document store. ${indexState}`, { category: 'SYSTEM' });
    } catch (error) {
      notifyError('Document not persisted', error instanceof Error ? error.message : 'No vault record was created.');
      return;
    }

    setIsNewRecordModalOpen(false);
    setNewTitle('');
    setNewCategory('');
    setNewSummary('');
    setNewContent('');
    setNewTags('Strategy, AI, Ingest');
    setUploadedFileMeta(null);
    setPendingUploadFile(null);
    setAutoVaultMeta(null);

  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    const totalRecords = vaults.reduce((acc, v) => acc + v.records.length, 0);
    try {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const manifest = {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportType: 'browser-generated document metadata manifest',
          totalVaults: vaults.length,
          totalRecords,
          contentIncluded: false,
          note: 'This export is not an encrypted backup, restore verification, or server-side snapshot.',
        },
        vaults: vaults.map(v => ({
          id: v.id,
          name: v.name,
          layer: v.layer,
          securityZone: v.securityZone,
          description: v.description,
          recordCount: v.records.length,
          records: v.records.map(({ content, ...record }) => record),
        }))
      };
      const manifestJson = JSON.stringify(manifest, null, 2);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(manifestJson));
      const checksum = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
      const backupPayload = JSON.stringify({ ...manifest, integrity: { algorithm: 'SHA-256', checksum } }, null, 2);
      const blob = new Blob([backupPayload], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `sigmatactix-second-brain-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      setLastBackupTime(`Manifest exported (${nowTime})`);
      notifySuccess('Document manifest downloaded', `${totalRecords} document metadata records exported. SHA-256: ${checksum.slice(0, 12)}… Content is not included.`, { category: 'SYSTEM' });
    } catch (error) {
      notifyError('Manifest export failed', error instanceof Error ? error.message : 'The document metadata manifest could not be created.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleVectorSearch = async () => {
    if (!vectorSearchPrompt.trim()) {
      setVectorSearchResults(null);
      return;
    }

    try {
      const response = await apiFetch('/api/workspace/vault/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: vectorSearchPrompt }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || 'Semantic search could not be completed.');
      const recordsById = new Map(vaults.flatMap((vault) => vault.records).map((record) => [record.id, record]));
      const matches = (result.matches || [])
        .map((match: { id: string; similarity: number }) => ({ record: recordsById.get(match.id), similarity: match.similarity }))
        .filter((match: { record?: VaultRecord; similarity: number }): match is { record: VaultRecord; similarity: number } => Boolean(match.record));
      setVectorSearchResults(matches);
      if (!matches.length) notifyInfo('No semantic result returned', 'There may be no matching indexed documents, or semantic search is currently unavailable.');
    } catch (error) {
      setVectorSearchResults(null);
      notifyError('Semantic search unavailable', error instanceof Error ? error.message : 'The server could not complete this query.');
    }
  };

  return (
    <div className="space-y-10 lg:space-y-12 pb-20">
      {/* Top Banner Header Surface */}
      <div className="sigma-page-header p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Badge variant="vermilion" size="sm">
                <Database size={13} className="mr-1" /> Foundation Layer
              </Badge>
              <span className="text-xs font-mono text-[var(--sigma-text-muted)]">Relational Knowledge Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.015em] text-[var(--sigma-text)]">
              Second Brain Knowledge Vaults
            </h1>
            <p className="text-[var(--sigma-text-muted)] text-sm max-w-3xl leading-relaxed">
              Workspace-scoped document records with server-reported extraction and indexing status. Verified vector embeddings and sovereign enclave isolation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a href="/?view=second-brain" className="text-xs font-medium text-[var(--sigma-primary)] hover:underline mr-1">
              Open 2D / 3D map
            </a>
            <Badge variant={documentLoadError ? 'danger' : 'neutral'} size="sm" dot>
              {isLoadingDocuments ? 'Loading document index' : documentLoadError ? 'Document index unavailable' : 'Document index loaded'}
            </Badge>
            <Badge variant="neutral" size="sm" dot>
              Snapshot: <strong className="text-[var(--sigma-text)] ml-1 font-mono">{lastBackupTime}</strong>
            </Badge>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleTriggerBackup}
              disabled={isBackingUp}
              isLoading={isBackingUp}
              icon={!isBackingUp ? <HardDriveDownload size={14} className="text-[var(--sigma-primary)]" /> : undefined}
              title="Download a browser-generated metadata manifest and calculate its SHA-256 checksum"
            >
              {isBackingUp ? 'Exporting...' : 'Export Manifest'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDeduplicateVaults}
              icon={<CopyCheck size={14} className="text-amber-accent" />}
              title="Explain the current durable deduplication limitation"
            >
              Clean Duplicates
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => headerFileInputRef.current?.click()}
              icon={<UploadCloud size={14} />}
              title="Upload document file to auto-populate vault record via AI"
            >
              Upload Files
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewRecordModalOpen(true)}
              icon={<Plus size={14} />}
            >
              New Vault Record
            </Button>
          </div>

          <input
            ref={headerFileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.markdown,.json,.csv,.docx,.html"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processDocumentFile(file);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
      {documentLoadError && (
        <div role="alert" className="text-xs text-rose-accent border border-rose-500/30 bg-rose-500/10 rounded-xl px-4 py-3">
          Durable document records could not be loaded: {documentLoadError}
        </div>
      )}

      {/* RBAC Role Simulator & Vector Search Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vector Semantic Search Widget */}
        <GlassCard className="lg:col-span-8 p-6 space-y-4" spotlight>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--sigma-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--sigma-text)] tracking-tight">pgvector Semantic Search</h3>
            </div>
            <Badge variant="neutral" size="xs">
              Server query · 768-dim when indexed
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--sigma-text-muted)]" size={15} />
              <input
                type="text"
                value={vectorSearchPrompt}
                onChange={(e) => setVectorSearchPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVectorSearch()}
                placeholder="Ask your Second Brain: e.g. 'What is our Q3 CAC benchmark and mobile CRO leak?'"
                className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-[var(--sigma-text)] placeholder:text-[var(--sigma-text-muted)] focus:outline-none focus:border-[var(--sigma-primary)] transition-colors"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleVectorSearch}
            >
              Query
            </Button>
          </div>

          {/* Vector Results Preview */}
          {vectorSearchResults && (
            <div className="space-y-2 pt-2 border-t border-[var(--sigma-border)]">
              <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] uppercase">
                Server semantic matches ({vectorSearchResults.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {vectorSearchResults.map(({ record, similarity }, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setSelectedVaultId(record.vaultId);
                      setSelectedRecord(record);
                    }}
                    className="p-3 bg-[var(--sigma-surface-subtle)] hover:bg-[var(--sigma-border)]/20 border border-[var(--sigma-border)] rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-[var(--sigma-primary)] font-semibold">Similarity: {Number(similarity).toFixed(3)}</span>
                      <span className="text-[10px] font-mono text-[var(--sigma-text-muted)]">{record.vaultId.replace('-vault', '')}</span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--sigma-text)] line-clamp-1">{record.title}</div>
                    <div className="text-[11px] text-[var(--sigma-text-muted)] line-clamp-2 mt-1">{record.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Live RBAC Permission Filter Widget */}
        <GlassCard className="lg:col-span-4 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-[var(--sigma-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--sigma-text)] tracking-tight">Visibility Preview</h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--sigma-text-muted)]">UI-only</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[var(--sigma-muted)]">Simulate Access Perspective:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ADMIN', label: 'Admin' },
                { id: 'SUB_ADMIN', label: 'Sub-Admin' },
                { id: 'USER', label: 'Client User' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setRbacTestRole(r.id)}
                  className={cn(
                    "p-2 rounded-lg text-xs font-mono font-medium transition-all border cursor-pointer",
                    rbacTestRole === r.id
                      ? "bg-[var(--sigma-primary)] text-white border-[var(--sigma-primary)] font-semibold shadow-sm"
                      : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] text-[var(--sigma-muted)] hover:text-[var(--sigma-text)]"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] text-[11px] font-mono text-[var(--sigma-text-muted)]">
            Perspective: <strong className="text-[var(--sigma-text)]">{rbacTestRole}</strong>. This is a client-side preview only; it does not validate server authorization or grant access.
          </div>
        </GlassCard>
      </div>

      {/* Vault Grid Selector */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase text-[var(--sigma-text-muted)] flex items-center justify-between">
          <span>Select Vault Category ({vaults.length} configured)</span>
          <Badge variant="neutral" size="xs" dot>
            Document index state shown per record
          </Badge>
        </div>

        <div data-tutorial-id="tut-brand-vault-card" className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {/* All Vaults View Option */}
          <button
            onClick={() => {
              setSelectedVaultId('all');
              setSelectedRecord(null);
            }}
            className={cn(
              "p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer",
              selectedVaultId === 'all' 
                ? "bg-[var(--sigma-primary)]/10 border-[var(--sigma-primary)] shadow-sm ring-1 ring-[var(--sigma-primary)]/30" 
                : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] hover:border-[var(--sigma-text-muted)]/30 hover:bg-[var(--sigma-border)]/10"
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-semibold tabular-nums text-[var(--sigma-primary)]">{totalAllRecordsCount} docs</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--sigma-primary)]" />
            </div>
            <div className={cn(
              "font-semibold text-xs tracking-tight truncate flex items-center gap-1.5",
              selectedVaultId === 'all' ? "text-[var(--sigma-text)] font-bold" : "text-[var(--sigma-muted)] group-hover:text-[var(--sigma-text)]"
            )}>
              <Layers size={13} className="text-[var(--sigma-primary)]" />
              <span>All Vaults View</span>
            </div>
            <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] mt-1 truncate">
              Unified Catalog
            </div>
          </button>

          {vaults.map((v) => {
            const isSelected = v.id === selectedVaultId;
            const isRestrictedForRole = (rbacTestRole !== 'ADMIN' && (v.id === 'executive-vault' || v.id === 'credentials-vault' || v.id === 'ai-workflow-vault'));

            return (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVaultId(v.id);
                  setSelectedRecord(null);
                }}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer",
                  isSelected 
                    ? "bg-[var(--sigma-primary)]/10 border-[var(--sigma-primary)] shadow-sm ring-1 ring-[var(--sigma-primary)]/30" 
                    : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] hover:border-[var(--sigma-text-muted)]/30 hover:bg-[var(--sigma-border)]/10",
                  isRestrictedForRole && "opacity-40"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold tabular-nums text-[var(--sigma-text-muted)]">{v.records.length} docs</span>
                  {isRestrictedForRole ? (
                    <Lock size={12} className="text-rose-accent" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </div>
                <div className={cn(
                  "font-semibold text-xs tracking-tight truncate",
                  isSelected ? "text-[var(--sigma-text)] font-bold" : "text-[var(--sigma-muted)] group-hover:text-[var(--sigma-text)]"
                )}>
                  {v.name}
                </div>
                <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] mt-1 truncate">
                  {v.securityZone}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Vault Records Section */}
      <GlassCard className="overflow-hidden">
        {/* Vault Header Banner */}
        <div className="p-5 bg-[var(--sigma-surface-subtle)] border-b border-[var(--sigma-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-semibold text-[var(--sigma-text)] tracking-tight">
                {selectedVaultId === 'all' ? 'All Vaults View (Unified Catalog)' : activeVault.name}
              </h2>
              <Badge variant="vermilion" size="xs">
                {selectedVaultId === 'all' ? `${vaults.length} CATEGORIES` : activeVault.securityZone}
              </Badge>
              <Badge variant="neutral" size="xs">
                {selectedVaultId === 'all' ? `${totalAllRecordsCount} Documents` : activeVault.encryptionLevel}
              </Badge>
            </div>
            <p className="text-xs text-[var(--sigma-text-muted)] mt-1 max-w-2xl">
              {selectedVaultId === 'all'
                ? 'Unified view of durable workspace document records. Visibility preview is not an authorization control.'
                : activeVault.description
              }
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sigma-text-muted)]" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={selectedVaultId === 'all' ? "Search across all vaults..." : "Search active vault records..."}
              className="w-full bg-[var(--sigma-bg)] border border-[var(--sigma-border)] rounded-xl py-2 pl-9 pr-3 text-xs text-[var(--sigma-text)] placeholder:text-[var(--sigma-text-muted)] focus:outline-none focus:border-[var(--sigma-primary)] transition-colors font-mono"
            />
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--sigma-surface-subtle)] border-b border-[var(--sigma-border)] text-[10px] font-mono uppercase text-[var(--sigma-text-muted)]">
                <th className="px-5 py-3">Title & Classification</th>
                <th className="px-5 py-3">Vault Tag</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Vector Status</th>
                <th className="px-5 py-3">Clearance</th>
                <th className="px-5 py-3">Last Updated</th>
                <th className="px-5 py-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sigma-border)]">
              {isLoadingDocuments && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-xs font-mono text-[var(--sigma-text-muted)]">
                    Loading document index…
                  </td>
                </tr>
              )}
              {!isLoadingDocuments && !documentLoadError && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-[var(--sigma-text-muted)] space-y-1">
                    <span className="block text-xs font-mono">{searchQuery ? `No records match "${searchQuery}".` : 'No documents in this vault category yet.'}</span>
                    <span className="block text-[11px]">Upload a file or create a new vault record to populate the catalog.</span>
                  </td>
                </tr>
              )}
              {filteredRecords.map((rec) => {
                const isAllowed = isAccessAllowedForRole(rec, rbacTestRole);
                const tagInfo = getVaultTagInfo(rec.vaultId);

                return (
                  <tr 
                    key={rec.id}
                    onClick={() => isAllowed && setSelectedRecord(rec)}
                    className={cn(
                      "transition-colors",
                      isAllowed ? "hover:bg-[var(--sigma-border)]/10 cursor-pointer" : "opacity-40 bg-red-950/5 cursor-not-allowed"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 border",
                          rec.classification === 'RESTRICTED_C_LEVEL' ? "bg-amber-500/10 text-amber-accent border-amber-500/20" :
                          rec.classification === 'ENCRYPTED_SECRET' ? "bg-rose-500/10 text-rose-accent border-rose-500/20" :
                          "bg-[var(--sigma-primary)]/10 text-[var(--sigma-primary)] border-[var(--sigma-primary)]/20"
                        )}>
                          {rec.classification === 'ENCRYPTED_SECRET' ? <Key size={14} /> : <FileText size={14} />}
                        </div>
                        <div>
                          <div className="font-medium text-xs text-[var(--sigma-text)]">{rec.title}</div>
                          <div className="text-[11px] text-[var(--sigma-text-muted)] line-clamp-1 mt-0.5">{rec.summary}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-semibold border", tagInfo.badge)}>
                        {tagInfo.label}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] text-[11px] text-[var(--sigma-muted)] font-mono">
                        {rec.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      {rec.vectorIndexed ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-accent font-mono">
                          <CheckCircle2 size={12} />
                          <span>{rec.embeddingDimensions || 'Unknown'}-dim</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--sigma-text-muted)] font-mono">Not indexed</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isAllowed ? (
                        <span className="text-xs text-emerald-accent font-mono flex items-center gap-1">
                          <Check size={12} /> Granted
                        </span>
                      ) : (
                        <span className="text-xs text-rose-accent font-mono flex items-center gap-1">
                          <Lock size={12} /> Blocked
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono tabular-nums text-[var(--sigma-text-muted)]">
                      {rec.lastUpdated}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <button 
                        disabled={!isAllowed}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAllowed) setSelectedRecord(rec);
                        }}
                        className="p-1.5 hover:bg-[var(--sigma-surface-subtle)] rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--sigma-bg)] border border-[var(--sigma-border)] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 bg-[var(--sigma-surface-subtle)] border-b border-[var(--sigma-border)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="vermilion" size="xs">
                      {selectedRecord.classification}
                    </Badge>
                    <span className="text-[11px] font-mono text-[var(--sigma-text-muted)]">
                      ID: {selectedRecord.id}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--sigma-text)]">{selectedRecord.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 hover:bg-[var(--sigma-bg)] rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-mono uppercase text-[var(--sigma-text-muted)] mb-2">Summary</h4>
                  <p className="text-xs text-[var(--sigma-muted)] leading-relaxed bg-[var(--sigma-surface-subtle)] p-3.5 rounded-xl border border-[var(--sigma-border)]">
                    {selectedRecord.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-[var(--sigma-text-muted)] mb-2">Vault Payload Content</h4>
                  <pre className="text-xs text-[var(--sigma-text)] font-mono bg-[var(--sigma-surface-subtle)] p-4 rounded-xl border border-[var(--sigma-border)] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {selectedRecord.content}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-[var(--sigma-text-muted)] pt-3 border-t border-[var(--sigma-border)]">
                  <div>Author: <strong className="text-[var(--sigma-text)]">{selectedRecord.author}</strong></div>
                  <div>Category: <strong className="text-[var(--sigma-text)]">{selectedRecord.category}</strong></div>
                  <div>Vector Index: <strong className="text-emerald-accent">{selectedRecord.vectorIndexed ? `${selectedRecord.embeddingDimensions || 'Unknown'}-dim active` : 'Not indexed'}</strong></div>
                  <div>Last Synced: <strong className="text-[var(--sigma-text)]">{selectedRecord.lastUpdated}</strong></div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-[var(--sigma-text-muted)] mb-2">Semantic Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecord.tags.map((t, i) => (
                      <Badge key={i} variant="neutral" size="xs">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[var(--sigma-surface-subtle)] border-t border-[var(--sigma-border)] flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close Document
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Vault Record Modal */}
      <AnimatePresence>
        {isNewRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--sigma-bg)] border border-[var(--sigma-border)] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-5 bg-[var(--sigma-surface-subtle)] border-b border-[var(--sigma-border)] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--sigma-text)]">Ingest New Vault Record</h3>
                  <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5">Target: {activeVault.name}</p>
                </div>
                <button
                  onClick={() => setIsNewRecordModalOpen(false)}
                  className="p-1.5 hover:bg-[var(--sigma-bg)] rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRecord} className="p-6 space-y-4 overflow-y-auto">
                {/* File Upload Dropzone for Auto-Filling Vault Record */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)] flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[var(--sigma-primary)]" /> Auto-Fill Via File Upload
                    </label>
                    <span className="text-[10px] font-mono text-[var(--sigma-text-muted)]">
                      Gemini 2.5 Flash Synthesis
                    </span>
                  </div>

                  {isAnalyzingFile ? (
                    <div className="border-2 border-dashed border-[var(--sigma-primary)]/40 bg-[var(--sigma-primary)]/5 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={22} className="animate-spin text-[var(--sigma-primary)]" />
                      <div className="text-xs font-semibold text-[var(--sigma-text)]">
                        Synthesizing Document with Gemini AI...
                      </div>
                      <p className="text-[10px] font-mono text-[var(--sigma-text-muted)]">
                        Extracting Title, Category, Classification, Summary, and Payload
                      </p>
                    </div>
                  ) : uploadedFileMeta ? (
                    <div className="p-3 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[var(--sigma-primary)]/10 border border-[var(--sigma-primary)]/20 text-[var(--sigma-primary)] shrink-0">
                          <FileCheck size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--sigma-text)] truncate">{uploadedFileMeta.name}</span>
                            <Badge variant="success" size="xs">AI POPULATED</Badge>
                          </div>
                          <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] mt-0.5">
                            {uploadedFileMeta.size} • Verify extracted details below
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processDocumentFile(file);
                      }}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all group",
                        isDragOver 
                          ? "border-[var(--sigma-primary)] bg-[var(--sigma-primary)]/5" 
                          : "border-[var(--sigma-border)] hover:border-[var(--sigma-primary)]/50 bg-[var(--sigma-surface-subtle)]"
                      )}
                    >
                      <UploadCloud size={22} className="mx-auto text-[var(--sigma-primary)] mb-1 group-hover:scale-105 transition-transform" />
                      <div className="text-xs font-semibold text-[var(--sigma-text)]">
                        Upload Document to Auto-Fill
                      </div>
                      <p className="text-[10px] text-[var(--sigma-text-muted)] font-mono mt-0.5">
                        PDF, Markdown, TXT, JSON, CSV, or DOCX • spreadsheet uploads are temporarily quarantined
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.md,.markdown,.json,.csv,.docx,.html"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processDocumentFile(file);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>

                {/* Auto-Identified Destination Vault Selector */}
                <div className="p-3 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-[var(--sigma-primary)] shrink-0" />
                      <span className="text-xs font-medium text-[var(--sigma-text)] truncate">
                        Destination: <span className="text-[var(--sigma-primary)] font-semibold">{vaults.find(v => v.id === targetVaultId)?.name || 'Select a vault'}</span>
                      </span>
                      {autoVaultMeta && (
                        <Badge variant="success" size="xs">AUTO-ROUTED ({autoVaultMeta.confidence}%)</Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-[var(--sigma-text-muted)] mt-0.5 line-clamp-1">
                      {autoVaultMeta?.reasoning || 'Partitioned vault zone for document storage, embeddings & access clearance.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)]">Change:</label>
                    <select
                      value={targetVaultId}
                      onChange={(e) => setTargetVaultId(e.target.value)}
                      className="bg-[var(--sigma-bg)] border border-[var(--sigma-border)] rounded-lg px-2 py-1 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] font-mono"
                    >
                      {vaults.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Document Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q4 Target CAC & Audience Expansion Specs"
                    className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Category</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g. Performance Strategy"
                      className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Proposed Classification</label>
                    <select
                      value={newClassification}
                      onChange={(e) => setNewClassification(e.target.value as any)}
                      className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] transition-colors"
                    >
                      <option value="STRATEGIC_CORE">STRATEGIC_CORE</option>
                      <option value="OPERATIONAL_PUBLIC">OPERATIONAL_PUBLIC</option>
                      <option value="RESTRICTED_C_LEVEL">RESTRICTED_C_LEVEL</option>
                      <option value="AUDIT_DIAGNOSTIC">AUDIT_DIAGNOSTIC</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Executive Summary</label>
                  <input
                    type="text"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="High level overview for AI context retrieval"
                    className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] transition-colors"
                  />
                </div>

                <p className="text-[10px] text-[var(--sigma-text-muted)] font-mono">
                  Category, proposed classification, summary, and tags are retained as document text only. They are not access controls or structured metadata yet.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Content / Raw Payload</label>
                  <textarea
                    rows={4}
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Detailed corporate knowledge, operational rules, or metrics..."
                    className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] font-mono focus:outline-none focus:border-[var(--sigma-primary)] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Semantic Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Growth, Ingest, Strategy"
                    className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] transition-colors"
                  />
                </div>

                <div className="p-4 bg-[var(--sigma-surface-subtle)] border-t border-[var(--sigma-border)] flex justify-end gap-2.5 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNewRecordModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                  >
                    Persist Document
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
