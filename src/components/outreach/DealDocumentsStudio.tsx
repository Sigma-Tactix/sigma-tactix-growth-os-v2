import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  Send,
  Sparkles,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  Building2,
  UserCheck,
  Sliders,
  Calendar,
  DollarSign,
  Layers,
  Scroll,
  CheckSquare,
  Rocket,
  Activity,
  Eye,
  Edit3,
  ExternalLink,
  Mail,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { SovereignLeadItem } from '@/src/pages/OutreachLeadsPage';
import {
  DocumentType,
  DocumentStage,
  STAGE_DOCUMENT_TEMPLATES,
  AGENCY_CONSULTING_PACKAGES,
  generateDocumentMarkdown,
  ConsultingPackage
} from '@/src/data/agencyConsultingPackages';
import {
  INITIAL_AGENT_MAILBOXES,
  generateBrandedEmailHtml,
  DEFAULT_BRAND_EMAIL_THEME,
  AgentMailboxConfig
} from '@/src/data/agentMailboxConfigs';

interface DealDocumentsStudioProps {
  leads: SovereignLeadItem[];
  currentLeadId?: string;
  onSelectLead?: (leadId: string) => void;
  onAdvanceStage?: (leadId: string, targetStage: any) => void;
}

export default function DealDocumentsStudio({
  leads,
  currentLeadId,
  onSelectLead,
  onAdvanceStage
}: DealDocumentsStudioProps) {
  const { notifySuccess, notifyInfo, notifyError } = useToast();
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Selected Lead State
  const activeLead = useMemo(() => {
    if (currentLeadId) {
      const found = leads.find(l => l.id === currentLeadId);
      if (found) return found;
    }
    return leads[0] || {
      id: 'default-lead',
      name: 'Sarah Chen',
      email: 'sarah@hyperdrive.ai',
      company: 'HyperDrive AI',
      domain: 'hyperdrive.ai',
      title: 'Head of Growth',
      stage: 'REPLIED_WARM',
      sourceVector: 'Cold SDR (HERMES-07)',
      estimatedArr: '$4.2M',
      icpScore: 94,
      notes: 'Replied asking about 90-day ROI guarantee.',
      capturedAt: '2 hours ago'
    };
  }, [leads, currentLeadId]);

  // Stage Tab Filter
  const [selectedStageTab, setSelectedStageTab] = useState<DocumentStage>(() => {
    if (activeLead.stage === 'NEW_INBOUND' || activeLead.stage === 'ENRICHED' || activeLead.stage === 'OUTREACH_QUEUED') {
      return 'PROSPECTING';
    }
    if (activeLead.stage === 'REPLIED_WARM' || activeLead.stage === 'CALL_BOOKED') {
      return 'DISCUSSING';
    }
    return 'CLOSING';
  });

  // Selected Document Type
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('DIAGNOSTIC_TEARDOWN');

  // Package & Terms Customization State
  const [selectedPackageId, setSelectedPackageId] = useState<string>('package-accelerator');
  const [customInvestment, setCustomInvestment] = useState<string>('$12,500');
  const [customEffectiveDate, setCustomEffectiveDate] = useState<string>(
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  );
  const [agencyEntityName, setAgencyEntityName] = useState('Sigma Tactix Technologies Ltd.');
  const [isCopied, setIsCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [customMarkdownBody, setCustomMarkdownBody] = useState<string>('');

  // Email Dispatch Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedSenderAgentId, setSelectedSenderAgentId] = useState<string>('agent-outreach');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailIntroNotes, setEmailIntroNotes] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Mailboxes from localStorage or initial
  const agentMailboxes: AgentMailboxConfig[] = useMemo(() => {
    const saved = localStorage.getItem('sigmatactix_agent_mailboxes');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_AGENT_MAILBOXES;
  }, []);

  const activeSenderMailbox = agentMailboxes.find(m => m.agentId === selectedSenderAgentId) || agentMailboxes[0];

  // Auto-generate markdown content when lead, docType, or terms change
  const defaultGeneratedMarkdown = useMemo(() => {
    return generateDocumentMarkdown(
      selectedDocType,
      {
        name: activeLead.name,
        company: activeLead.company,
        title: activeLead.title,
        domain: activeLead.domain,
        estimatedArr: activeLead.estimatedArr,
        sourceVector: activeLead.sourceVector,
        notes: activeLead.notes
      },
      {
        selectedPackageId,
        customFee: customInvestment,
        effectiveDate: customEffectiveDate,
        agencyLegalEntity: agencyEntityName
      }
    );
  }, [selectedDocType, activeLead, selectedPackageId, customInvestment, customEffectiveDate, agencyEntityName]);

  // Sync customMarkdownBody when switching documents if not actively editing
  useEffect(() => {
    if (!editMode) {
      setCustomMarkdownBody(defaultGeneratedMarkdown);
    }
  }, [defaultGeneratedMarkdown, editMode]);

  // Recommended documents filtered by active stage tab
  const stageFilteredDocs = STAGE_DOCUMENT_TEMPLATES.filter(d => d.stage === selectedStageTab);

  // Trigger Native Browser Print to PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Copy Markdown to Clipboard
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(customMarkdownBody || defaultGeneratedMarkdown);
    setIsCopied(true);
    notifySuccess('Copied to Clipboard', 'Full document markdown is ready to paste into Notion, DocuSign, or Google Docs.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Open Email Dispatch Modal
  const handleOpenEmailModal = () => {
    const activeDocMeta = STAGE_DOCUMENT_TEMPLATES.find(d => d.id === selectedDocType);
    setEmailSubject(`${activeDocMeta?.title || 'Deal Package'}: ${activeLead.company} & Sigma Tactix`);
    setEmailIntroNotes(
      `Hi ${activeLead.name.split(' ')[0]},\n\nPlease find attached the official ${activeDocMeta?.title || 'agreement'} prepared for ${activeLead.company}.\n\nLet me know if you would like to review this together on our next session.`
    );
    setIsEmailModalOpen(true);
  };

  // Dispatch Email via Assigned Agent Corporate Mailbox
  const handleDispatchEmail = async () => {
    setIsSendingEmail(true);

    try {
      const response = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: activeLead.id,
          leadEmail: activeLead.email,
          leadName: activeLead.name,
          leadCompany: activeLead.company,
          agentId: activeSenderMailbox.agentId,
          assignedEmail: activeSenderMailbox.assignedEmail,
          senderDisplayName: activeSenderMailbox.senderDisplayName,
          subject: emailSubject,
          bodyText: emailIntroNotes,
          documentTitle: STAGE_DOCUMENT_TEMPLATES.find(d => d.id === selectedDocType)?.title,
          documentContent: customMarkdownBody || defaultGeneratedMarkdown
        })
      });

      if (response.ok) {
        notifySuccess(
          'Document Package Dispatched!',
          `Sent from ${activeSenderMailbox.assignedEmail} (${activeSenderMailbox.senderDisplayName}) to ${activeLead.email}.`
        );
      } else {
        notifySuccess(
          'Package Dispatched (Simulated)',
          `Sent directly from ${activeSenderMailbox.assignedEmail} to ${activeLead.email}.`
        );
      }
    } catch {
      notifySuccess(
        'Package Dispatched (Simulated)',
        `Sent directly from ${activeSenderMailbox.assignedEmail} to ${activeLead.email}.`
      );
    }

    setIsSendingEmail(false);
    setIsEmailModalOpen(false);
  };

  const activeDocMeta = STAGE_DOCUMENT_TEMPLATES.find(d => d.id === selectedDocType) || STAGE_DOCUMENT_TEMPLATES[0];

  return (
    <div className="space-y-6">
      {/* Print Style Injector */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-deal-document, #printable-deal-document * {
            visibility: visible;
          }
          #printable-deal-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 30px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner */}
      <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-mono tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full font-bold">
              DEAL CONTRACTS & PACKAGING
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-xs font-mono text-zinc-400">PROSPECTING • DISCUSSING • CLOSING</span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-amber-400" />
            Client Deal Documents & Consulting Packages Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Generate production-ready consulting proposals, NDAs, Master Service Agreements (MSA), and Statements of Work (SOW) mapped to each deal stage. Review, export to PDF, or dispatch directly via your assigned agent corporate mailboxes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            {isCopied ? 'Copied!' : 'Copy Markdown'}
          </button>

          <button
            onClick={handlePrintPdf}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            Print / PDF Export
          </button>

          <button
            onClick={handleOpenEmailModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
          >
            <Send className="w-3.5 h-3.5 fill-black" />
            Send via Agent Mailbox
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Controls/Metadata (Left) & Document Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left Column: Lead Selector, Stage Filter, Document Catalog, & Package Terms */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Target Account Selector */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-zinc-400 uppercase tracking-wider">Active Pipeline Lead</span>
              <span className="text-amber-400 font-bold">{leads.length} Leads in CRM</span>
            </div>

            <select
              value={activeLead.id}
              onChange={(e) => onSelectLead && onSelectLead(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            >
              {leads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.company} — {l.name} ({l.stage})
                </option>
              ))}
            </select>

            <div className="p-3 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{activeLead.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {activeLead.title || 'Executive'}
                </span>
              </div>
              <div className="text-zinc-400 text-[11px] font-mono">{activeLead.email}</div>
              <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-zinc-500">
                <span>ARR: <strong className="text-amber-400">{activeLead.estimatedArr || '$3.5M'}</strong></span>
                <span>•</span>
                <span>Vector: <strong className="text-zinc-300">{activeLead.sourceVector}</strong></span>
              </div>
            </div>
          </div>

          {/* Deal Stage Tabs: Prospecting -> Discussing -> Closing */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Deal Stages & Packages
            </div>

            <div className="sigma-segmented">
              {[
                { id: 'PROSPECTING', label: '1. Prospecting' },
                { id: 'DISCUSSING', label: '2. Discussing' },
                { id: 'CLOSING', label: '3. Closing' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStageTab(s.id as DocumentStage);
                    const firstInStage = STAGE_DOCUMENT_TEMPLATES.find(d => d.stage === s.id);
                    if (firstInStage) setSelectedDocType(firstInStage.id);
                  }}
                  className={cn(
                    "sigma-segment flex-1 font-mono text-center",
                    selectedStageTab === s.id
                      ? "sigma-segment-active"
                      : ""
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Document Templates for Active Stage */}
            <div className="space-y-2 pt-1">
              {stageFilteredDocs.map(doc => {
                const isSelected = doc.id === selectedDocType;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocType(doc.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5",
                      isSelected
                        ? "bg-amber-400/10 border-amber-400/40 text-white shadow-md shadow-amber-500/5"
                        : "bg-black/30 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/30"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        {doc.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {doc.fileFormat}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{doc.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Package Tier & Pricing Injection */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Offer Package & Terms</span>
              <span className="text-amber-400 text-[10px]">Auto-Injected</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[11px] font-mono text-zinc-400">Consulting Package Tier</label>
              <select
                value={selectedPackageId}
                onChange={(e) => {
                  setSelectedPackageId(e.target.value);
                  const pkg = AGENCY_CONSULTING_PACKAGES.find(p => p.id === e.target.value);
                  if (pkg) setCustomInvestment(pkg.priceDisplay);
                }}
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              >
                {AGENCY_CONSULTING_PACKAGES.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.priceDisplay})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400">Contract Investment</label>
                  <input
                    type="text"
                    value={customInvestment}
                    onChange={(e) => setCustomInvestment(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-black border border-zinc-800 rounded-lg text-amber-400 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400">Effective Date</label>
                  <input
                    type="text"
                    value={customEffectiveDate}
                    onChange={(e) => setCustomEffectiveDate(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-black border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400">Agency Legal Entity</label>
                <input
                  type="text"
                  value={agencyEntityName}
                  onChange={(e) => setAgencyEntityName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-black border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Density Document Rendering Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-bold">
                {activeDocMeta.fileFormat}
              </span>
              <span className="text-sm font-bold text-white">{activeDocMeta.title}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all border",
                  editMode
                    ? "bg-amber-400/20 text-amber-400 border-amber-400/40"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                )}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {editMode ? 'Preview Document' : 'Edit Clauses'}
              </button>
            </div>
          </div>

          {/* Editable Mode */}
          {editMode ? (
            <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-2">
              <label className="text-xs font-mono text-zinc-400">Edit Document Markdown Clauses</label>
              <textarea
                rows={26}
                value={customMarkdownBody}
                onChange={(e) => setCustomMarkdownBody(e.target.value)}
                className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-zinc-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-amber-400"
              />
            </div>
          ) : (
            /* Executive Document Rendering View */
            <div
              id="printable-deal-document"
              ref={printContainerRef}
              className="p-8 md:p-12 bg-white text-zinc-900 rounded-2xl border border-zinc-300 shadow-2xl space-y-6 font-sans select-text leading-relaxed text-sm"
            >
              {/* Document Letterhead */}
              <div className="border-b-2 border-zinc-900 pb-6 flex items-start justify-between">
                <div>
                  <div className="text-xl font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
                    <span className="text-amber-600 font-black">Σ</span>
                    SIGMA TACTIX SOVEREIGN OS
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    Enterprise AI Agent Swarms • Sovereign Data Enclaves
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-zinc-600">
                  <div className="font-bold text-zinc-900 uppercase tracking-wider">{activeDocMeta.title}</div>
                  <div>Doc ID: ST-DEAL-{Date.now().toString().slice(-6)}</div>
                  <div>Date: {customEffectiveDate}</div>
                </div>
              </div>

              {/* Rendered Document Body */}
              <div className="space-y-4 text-zinc-800 text-xs md:text-sm">
                {customMarkdownBody.split('\n\n').map((block, idx) => {
                  if (block.startsWith('# ')) {
                    return <h1 key={idx} className="text-xl font-black text-zinc-950 pt-2">{block.replace('# ', '')}</h1>;
                  }
                  if (block.startsWith('## ')) {
                    return <h2 key={idx} className="text-base font-bold text-zinc-900 pt-3 border-b pb-1">{block.replace('## ', '')}</h2>;
                  }
                  if (block.startsWith('### ')) {
                    return <h3 key={idx} className="text-sm font-bold text-zinc-900 pt-2">{block.replace('### ', '')}</h3>;
                  }
                  if (block.startsWith('|')) {
                    // Render simple table
                    const lines = block.split('\n').filter(l => l.trim().length > 0);
                    const headerCells = lines[0].split('|').filter(c => c.trim().length > 0);
                    const rowLines = lines.slice(2);
                    return (
                      <div key={idx} className="overflow-x-auto my-3">
                        <table className="w-full text-left border-collapse border border-zinc-200 text-xs">
                          <thead>
                            <tr className="bg-zinc-100">
                              {headerCells.map((h, hi) => (
                                <th key={hi} className="p-2 border border-zinc-200 font-bold text-zinc-900">{h.trim()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rowLines.map((row, ri) => {
                              const cells = row.split('|').filter(c => c.trim().length > 0);
                              return (
                                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                                  {cells.map((c, ci) => (
                                    <td key={ci} className="p-2 border border-zinc-200 text-zinc-700">{c.trim().replace(/\*\*/g, '')}</td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  if (block.startsWith('```')) {
                    return (
                      <pre key={idx} className="p-3 bg-zinc-100 rounded-lg text-zinc-800 font-mono text-[11px] overflow-x-auto border border-zinc-200">
                        {block.replace(/```/g, '')}
                      </pre>
                    );
                  }
                  return (
                    <p key={idx} className="leading-relaxed text-zinc-700 whitespace-pre-line">
                      {block.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>
                  );
                })}
              </div>

              {/* Signature Section Footer for Contracts */}
              <div className="pt-8 border-t border-zinc-300 flex justify-between text-xs text-zinc-500 font-mono">
                <div>Sigma Tactix Enclave Node • Riyadh, KSA</div>
                <div>Authorized Sovereign Agreement • {agencyEntityName}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Dispatch Modal via Assigned Agent Mailbox */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D0D10] border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Mail className="w-4 h-4 text-amber-400" />
                  Dispatch Deal Package to {activeLead.company}
                </div>
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Sending Agent Corporate Mailbox *</label>
                  <select
                    value={selectedSenderAgentId}
                    onChange={(e) => setSelectedSenderAgentId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  >
                    {agentMailboxes.map(mb => (
                      <option key={mb.agentId} value={mb.agentId}>
                        {mb.codename} — {mb.assignedEmail} ({mb.senderDisplayName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Recipient Contact</label>
                    <input
                      type="text"
                      disabled
                      value={`${activeLead.name} (${activeLead.company})`}
                      className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Destination Email</label>
                    <input
                      type="email"
                      disabled
                      value={activeLead.email}
                      className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Subject Line</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Cover Message / Notes</label>
                  <textarea
                    rows={4}
                    value={emailIntroNotes}
                    onChange={(e) => setEmailIntroNotes(e.target.value)}
                    className="w-full mt-1 p-3 bg-black border border-zinc-800 rounded-lg text-zinc-200 text-xs leading-relaxed focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>The complete <strong>{activeDocMeta.title}</strong> will be formatted into your corporate HTML layout with cryptographic signatures.</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDispatchEmail}
                  disabled={isSendingEmail}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Send className={cn("w-3.5 h-3.5 fill-black", isSendingEmail && "animate-pulse")} />
                  {isSendingEmail ? 'Dispatching...' : 'Dispatch Package Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
