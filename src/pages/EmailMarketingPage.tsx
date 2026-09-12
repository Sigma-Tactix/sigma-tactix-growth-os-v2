import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  BarChart3, 
  Users, 
  Inbox, 
  Clock, 
  Smartphone, 
  Monitor,
  Flame,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

interface DripSequence {
  id: string;
  name: string;
  targetAudience: string;
  stepsCount: number;
  openRate: string;
  ctr: string;
  status: 'ACTIVE' | 'DRAFT';
}

const SAMPLE_SEQUENCES: DripSequence[] = [
  {
    id: 'seq-01',
    name: 'Enterprise Demo Request Instant Nurture',
    targetAudience: 'Inbound high-intent B2B demo requesters',
    stepsCount: 4,
    openRate: '68.4%',
    ctr: '24.1%',
    status: 'ACTIVE'
  },
  {
    id: 'seq-02',
    name: 'Growth Diagnostic Scorecard Follow-up',
    targetAudience: 'Companies completing the Growth OS audit',
    stepsCount: 5,
    openRate: '59.2%',
    ctr: '18.7%',
    status: 'ACTIVE'
  },
  {
    id: 'seq-03',
    name: 'Agency Disillusionment Re-activation',
    targetAudience: 'Executives dissatisfied with traditional agency retainers',
    stepsCount: 3,
    openRate: '47.8%',
    ctr: '12.4%',
    status: 'ACTIVE'
  }
];

export default function EmailMarketingPage() {
  const { notifySuccess, notifyError } = useToast();
  const [activeTab, setActiveTab] = useState<'BROADCAST' | 'SEQUENCES' | 'DELIVERABILITY'>('BROADCAST');
  const [subjectLineA, setSubjectLineA] = useState('Why your $30k/mo agency retainer is leaking B2B pipeline');
  const [subjectLineB, setSubjectLineB] = useState('The 5 hidden digital cracks doubling your enterprise CAC');
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Email Content
  const [emailBody, setEmailBody] = useState<string>(`Hi {{firstName}},

If your leadership team is reviewing marketing spend this week, here is an uncomfortable number to look at:

The average B2B tech company spends $30,000 monthly on agency retainers, yet their customer acquisition cost has increased by 38% year-over-year.

Why?

Because third-party retainers lease external headcount that turns over every nine months. When junior coordinators rotate off your account, your ad history, positioning experiments, and customer objection patterns vanish.

Top operators in 2026 are deploying an AI-native Growth OS directly inside their private cloud.

Here is what happens when you own your growth infrastructure instead of renting it:
1. Permanent Institutional Memory across all marketing touchpoints
2. Autonomous Agent Swarms executing SEO, ad creative, and lead qualification 24/7
3. Strict Human-in-the-Loop oversight with zero headcount inflation

We put together an interactive teardown of the 5 hidden digital revenue leaks siphoning B2B pipelines.

👉 [Run Your Free Growth OS Diagnostic (Takes 3 Minutes)](https://sigmatactix.com/diagnostics)

Best,
The Sigma Tactix Revenue Architecture Team`);

  // Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-email-01',
      agentName: 'Lifecycle Email Architect',
      agentRole: 'B2B Nurture & Deliverability Optimizer',
      timestamp: 'Today at 05:00 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Email & Lifecycle Marketing',
      inputSummary: 'Broadcast: Agency Retainer Replacement Angle',
      outputSummary: 'Subject A/B scored. Spam index: 0/10 (Clean). Est Open: 64%.',
      fullOutput: `Subject A: ${subjectLineA}\nSubject B: ${subjectLineB}\n\n${emailBody}`,
      metrics: [
        { label: 'Spam Score', value: '0.0 (Clean)' },
        { label: 'Predicted Open Rate', value: '64.2%' },
        { label: 'Reading Grade', value: '8.2' },
        { label: 'Deliverability Health', value: '99.8%' }
      ]
    }
  ]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);

      const newRun: AgentRunRecord = {
        id: `run-email-${Date.now()}`,
        agentName: 'Lifecycle Email Architect',
        agentRole: 'B2B Nurture & Deliverability Optimizer',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Email & Lifecycle Marketing',
        inputSummary: `Optimized Broadcast for Enterprise Segment`,
        outputSummary: 'Synthesized high-converting lifecycle copy with sub-second spam check.',
        fullOutput: emailBody,
        metrics: [
          { label: 'Subject', value: 'Optimized' },
          { label: 'SPF / DKIM', value: 'Valid' },
          { label: 'Spam Risk', value: 'Ultra-Low' }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Email Campaign Synthesized', 'Subject line variants and high-signal body generated.');
    }, 1200);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Email & Lifecycle Marketing</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                  Digital Marketing
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Automate high-converting B2B nurture sequences, executive broadcasts, and domain deliverability monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0F0F12] border border-white/10">
          <button
            onClick={() => setActiveTab('BROADCAST')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === 'BROADCAST' ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
            )}
          >
            Campaign Broadcast
          </button>
          <button
            onClick={() => setActiveTab('SEQUENCES')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === 'SEQUENCES' ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
            )}
          >
            Automated Drip Sequences
          </button>
          <button
            onClick={() => setActiveTab('DELIVERABILITY')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === 'DELIVERABILITY' ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
            )}
          >
            Deliverability & DNS Health
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'BROADCAST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Subject Lines & Options */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                Subject Line A/B Optimization
              </h3>

              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium text-slate-300">Variant A (Problem Agitation)</span>
                  <span className="text-teal-400 font-mono">Predicted Open: 68.2%</span>
                </div>
                <input
                  type="text"
                  value={subjectLineA}
                  onChange={e => setSubjectLineA(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium text-slate-300">Variant B (Empirical Curiosity)</span>
                  <span className="text-emerald-400 font-mono">Predicted Open: 64.9%</span>
                </div>
                <input
                  type="text"
                  value={subjectLineB}
                  onChange={e => setSubjectLineB(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Body Editor</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={10}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-teal-500/50 resize-none"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Optimizing Email Copy & Deliverability...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Synthesize Optimized Email
                  </>
                )}
              </button>
            </div>

            {/* Spam Filter Audit */}
            <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Spam Trigger Audit</div>
                  <div className="text-[11px] text-slate-400">Zero blacklisted promotional phrases detected.</div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                100% INBOX READY
              </span>
            </div>
          </div>

          {/* Right Column: Live Email Client Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                    <button
                      onClick={() => setPreviewDevice('DESKTOP')}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        previewDevice === 'DESKTOP' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('MOBILE')}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        previewDevice === 'MOBILE' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">Live Client Rendering ({previewDevice})</span>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(emailBody);
                    setCopied(true);
                    notifySuccess('Copied', 'Email body copied to clipboard.');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy HTML / Text
                </button>
              </div>

              {/* Email Envelope Header */}
              <div className={cn(
                "mx-auto rounded-xl border border-white/10 bg-black/40 overflow-hidden transition-all shadow-xl",
                previewDevice === 'MOBILE' ? "max-w-[360px]" : "w-full"
              )}>
                <div className="p-4 bg-white/[0.02] border-b border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>From: <strong className="text-white">Sigma Tactix Intelligence &lt;intel@sigmatactix.com&gt;</strong></span>
                    <span className="font-mono text-[10px]">Today at 09:00 AM</span>
                  </div>
                  <div className="text-slate-300">
                    Subject: <strong className="text-teal-300">{subjectLineA}</strong>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-6 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {emailBody}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sequences Tab */}
      {activeTab === 'SEQUENCES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Active Automated Lifecycle Drips</h3>
            <span className="text-xs text-slate-400">{SAMPLE_SEQUENCES.length} Sequences Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_SEQUENCES.map(seq => (
              <div key={seq.id} className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {seq.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{seq.stepsCount} Touchpoints</span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{seq.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{seq.targetAudience}</p>
                </div>

                <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Avg Open Rate</span>
                    <div className="font-bold text-teal-400 font-mono text-sm">{seq.openRate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Click-Through</span>
                    <div className="font-bold text-emerald-400 font-mono text-sm">{seq.ctr}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverability Tab */}
      {activeTab === 'DELIVERABILITY' && (
        <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-6">
          <h3 className="text-base font-semibold text-white">DNS & Domain Authentication Health</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'SPF Record', status: 'VALID', value: 'v=spf1 include:_spf.google.com ~all' },
              { label: 'DKIM Signature', status: 'PASS', value: '2048-bit RSA active' },
              { label: 'DMARC Policy', status: 'ENFORCED', value: 'p=reject; rua=mailto:dmarc@sigmatactix.com' },
              { label: 'Sender Score', status: '99 / 100', value: 'Ultra-low bounce (<0.1%)' }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {item.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-200 truncate">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Run Results */}
      <div className="mt-10">
        <AgentRunResults
          records={runHistory}
          title="Email Agent Execution History"
          description="Log of synthesized email campaigns, deliverability audits, and subject line tests."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}
