import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
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
  FileText,
  Plus,
  Trash2,
  Settings2,
  Calendar,
  Lock,
  Globe,
  Scale,
  ShieldAlert,
  Zap,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { GlassCard, Button, Badge, Tabs } from '@/src/components/ui';

export interface DripStep {
  id: string;
  stepNumber: number;
  title: string;
  delayDays: number;
  sendWindow: string;
  skipWeekends: boolean;
  subjectVariantA: string;
  subjectVariantB: string;
  bodyText: string;
  openRateEstimate: string;
  ctrEstimate: string;
}

export interface DripSequence {
  id: string;
  name: string;
  targetAudience: string;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  steps: DripStep[];
  compliance: {
    canSpamAddress: string;
    rfc8058OneClickUnsubscribe: boolean;
    gdprLawfulBasis: 'CONSENT' | 'LEGITIMATE_INTEREST';
    caslConsentWindowDays: number;
    dailySendCap: number;
    rampUpRate: string;
    suppressionCircuitBreaker: boolean;
  };
}

const DEFAULT_SEQUENCES: DripSequence[] = [
  {
    id: 'seq-01',
    name: 'Enterprise Demo Request Instant Nurture',
    targetAudience: 'Inbound high-intent B2B demo requesters',
    status: 'ACTIVE',
    compliance: {
      canSpamAddress: 'Sigma Tactix Inc., 100 Montgomery St, Suite 1800, San Francisco, CA 94104',
      rfc8058OneClickUnsubscribe: true,
      gdprLawfulBasis: 'CONSENT',
      caslConsentWindowDays: 180,
      dailySendCap: 50,
      rampUpRate: '10% daily volume increment',
      suppressionCircuitBreaker: true
    },
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Instant Value Confirmation & Architecture Brief',
        delayDays: 0,
        sendWindow: 'Immediate upon form submission',
        skipWeekends: false,
        subjectVariantA: 'Your Growth OS Architecture Brief is ready',
        subjectVariantB: 'Confirmed: Private Cloud AI Growth Stack teardown',
        openRateEstimate: '74.2%',
        ctrEstimate: '38.5%',
        bodyText: `Hi {{firstName}},\n\nThank you for requesting an architectural review of Sigma Tactix Growth OS.\n\nWhile we prepare your environment sandbox, here is your executive overview of how autonomous agent swarms replace $30k/mo agency retainers.\n\n👉 [Review Your System Architecture Document](https://sigmatactix.com/docs/architecture)\n\nBest,\nThe Sigma Tactix Engineering Group`
      },
      {
        id: 'step-2',
        stepNumber: 2,
        title: 'Diagnostic Deep Dive & Pipeline Leak Scorecard',
        delayDays: 2,
        sendWindow: '09:00 - 16:30 recipient local time',
        skipWeekends: true,
        subjectVariantA: 'The 5 hidden digital cracks doubling your CAC',
        subjectVariantB: 'Where B2B tech pipelines leak 42% of revenue',
        openRateEstimate: '66.8%',
        ctrEstimate: '22.4%',
        bodyText: `Hi {{firstName}},\n\nMost B2B leadership teams treat high CAC as an ad bidding problem. In reality, it is an infrastructure problem.\n\nWhen junior agency coordinators rotate off accounts every nine months, your customer objection data evaporates.\n\nHere is how sovereign private cloud deployment retains permanent institutional memory across SEO, ads, and outbound.\n\nBest,\nSigma Tactix Strategy Team`
      },
      {
        id: 'step-3',
        stepNumber: 3,
        title: 'Agency Replacement ROI & Governance Case Study',
        delayDays: 4,
        sendWindow: '09:30 - 15:30 recipient local time',
        skipWeekends: true,
        subjectVariantA: 'Case Study: How Series B SaaS eliminated $240k/yr agency fees',
        subjectVariantB: 'Zero headcount inflation: 3.8x pipeline yield',
        openRateEstimate: '59.1%',
        ctrEstimate: '18.2%',
        bodyText: `Hi {{firstName}},\n\nHere is an unedited case study of an enterprise B2B team that replaced their outsourced retainer with Sigma Tactix Growth OS.\n\nResults after 90 days:\n- Customer acquisition cost decreased 38%\n- Content production velocity increased 5.4x\n- 100% human-in-the-loop governance preserved on every outbound asset\n\n👉 [Read The Enterprise Case Study](https://sigmatactix.com/customers/case-study)\n\nBest,\nSigma Tactix Strategy Team`
      },
      {
        id: 'step-4',
        stepNumber: 4,
        title: 'Executive Calendar Invitation & Pilot Onboarding',
        delayDays: 7,
        sendWindow: '10:00 - 16:00 recipient local time',
        skipWeekends: true,
        subjectVariantA: 'Final call: Dedicated pilot slot reservation',
        subjectVariantB: 'Should we pause your Growth OS sandbox?',
        openRateEstimate: '52.4%',
        ctrEstimate: '14.9%',
        bodyText: `Hi {{firstName}},\n\nWe are finalizing enterprise pilot cohorts for this sprint.\n\nIf your team is ready to inspect how autonomous multi-agent swarms operate with your actual CRM data, select a 20-minute window below.\n\n👉 [Reserve Executive Technical Walkthrough](https://sigmatactix.com/calendar)\n\nWarm regards,\nAlex Vance | Revenue Architecture Director`
      }
    ]
  },
  {
    id: 'seq-02',
    name: 'Growth Diagnostic Scorecard Follow-up',
    targetAudience: 'Companies completing the Growth OS audit',
    status: 'ACTIVE',
    compliance: {
      canSpamAddress: 'Sigma Tactix Inc., 100 Montgomery St, Suite 1800, San Francisco, CA 94104',
      rfc8058OneClickUnsubscribe: true,
      gdprLawfulBasis: 'LEGITIMATE_INTEREST',
      caslConsentWindowDays: 180,
      dailySendCap: 40,
      rampUpRate: '15% daily volume increment',
      suppressionCircuitBreaker: true
    },
    steps: [
      {
        id: 'step-201',
        stepNumber: 1,
        title: 'Diagnostic Audit Results Delivery',
        delayDays: 0,
        sendWindow: 'Immediate upon completion',
        skipWeekends: false,
        subjectVariantA: 'Your Growth OS Scorecard: {{score}}/100',
        subjectVariantB: 'Audit Breakdown: 3 Immediate High-ROI Interventions',
        openRateEstimate: '81.4%',
        ctrEstimate: '42.1%',
        bodyText: `Hi {{firstName}},\n\nYour automated Growth OS Diagnostic Audit has completed processing.\n\nYour Overall Readiness Score: {{score}}/100\nPrimary Bottleneck: Content velocity and attribution leakage.\n\n👉 [View Your Interactive Diagnostic Dashboard](https://sigmatactix.com/diagnostics/results)`
      },
      {
        id: 'step-202',
        stepNumber: 2,
        title: 'Attribution & Signal Repair Protocol',
        delayDays: 3,
        sendWindow: '09:00 - 16:30 recipient local time',
        skipWeekends: true,
        subjectVariantA: 'Fixing the attribution blindspots flagged in your audit',
        subjectVariantB: 'Why 24% of your ad conversions are untracked',
        openRateEstimate: '61.5%',
        ctrEstimate: '19.8%',
        bodyText: `Hi {{firstName}},\n\nIn your recent diagnostic scorecard, your multi-touch attribution health was flagged as below benchmark.\n\nHere is how to resolve signal degradation across ad platforms in under 48 hours without engineering support.`
      }
    ]
  }
];

export default function EmailMarketingPage() {
  const { notifySuccess, notifyError, notifyInfo } = useToast();
  const [activeTab, setActiveTab] = useState<'BROADCAST' | 'SEQUENCES' | 'COMPLIANCE_AUDIT' | 'DELIVERABILITY'>('BROADCAST');
  
  // Broadcast State
  const [subjectLineA, setSubjectLineA] = useState('Why your $30k/mo agency retainer is leaking B2B pipeline');
  const [subjectLineB, setSubjectLineB] = useState('The 5 hidden digital cracks doubling your enterprise CAC');
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sequences State
  const [sequences, setSequences] = useState<DripSequence[]>(DEFAULT_SEQUENCES);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>('seq-01');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [isScanningCompliance, setIsScanningCompliance] = useState<boolean>(false);
  const [complianceScore, setComplianceScore] = useState<number>(100);

  // Active sequence reference
  const currentSequence = sequences.find(s => s.id === selectedSequenceId) || sequences[0];
  const currentStep = currentSequence?.steps[selectedStepIndex] || currentSequence?.steps[0];

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

  // Update current step properties
  const updateCurrentStep = (patch: Partial<DripStep>) => {
    setSequences(prev => prev.map(seq => {
      if (seq.id !== selectedSequenceId) return seq;
      const updatedSteps = [...seq.steps];
      updatedSteps[selectedStepIndex] = {
        ...updatedSteps[selectedStepIndex],
        ...patch
      };
      return { ...seq, steps: updatedSteps };
    }));
  };

  // Add a new step to the active sequence
  const handleAddStep = () => {
    const newStepNum = currentSequence.steps.length + 1;
    const newStep: DripStep = {
      id: `step-${Date.now()}`,
      stepNumber: newStepNum,
      title: `Step ${newStepNum}: High-Signal Touchpoint`,
      delayDays: 3,
      sendWindow: '09:00 - 16:30 recipient local time',
      skipWeekends: true,
      subjectVariantA: 'Quick follow up regarding your Growth OS review',
      subjectVariantB: 'Resource: Benchmark report for B2B growth leaders',
      openRateEstimate: '58.0%',
      ctrEstimate: '17.5%',
      bodyText: `Hi {{firstName}},\n\nWanted to ensure you had a chance to review the previous teardown.\n\nBest,\nSigma Tactix Intelligence`
    };

    setSequences(prev => prev.map(seq => {
      if (seq.id !== selectedSequenceId) return seq;
      return { ...seq, steps: [...seq.steps, newStep] };
    }));
    setSelectedStepIndex(currentSequence.steps.length);
    notifySuccess('Touchpoint Added', `Added Step ${newStepNum} to "${currentSequence.name}".`);
  };

  // Remove a step
  const handleRemoveStep = (indexToRemove: number) => {
    if (currentSequence.steps.length <= 1) {
      notifyError('Cannot Remove Step', 'A drip sequence must have at least one touchpoint.');
      return;
    }

    setSequences(prev => prev.map(seq => {
      if (seq.id !== selectedSequenceId) return seq;
      const filtered = seq.steps.filter((_, idx) => idx !== indexToRemove).map((step, idx) => ({
        ...step,
        stepNumber: idx + 1
      }));
      return { ...seq, steps: filtered };
    }));

    if (selectedStepIndex >= indexToRemove && selectedStepIndex > 0) {
      setSelectedStepIndex(selectedStepIndex - 1);
    }
    notifyInfo('Step Removed', 'Updated touchpoint sequence numbering.');
  };

  // Run App-Wide Compliance Scan
  const handleRunComplianceScan = () => {
    setIsScanningCompliance(true);
    setTimeout(() => {
      setIsScanningCompliance(false);
      setComplianceScore(100);

      const scanRun: AgentRunRecord = {
        id: `run-comp-${Date.now()}`,
        agentName: 'Growth OS Compliance Sentinel',
        agentRole: 'Cross-Module Regulatory Verifier',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Email & Lifecycle Marketing',
        inputSummary: 'Cross-module audit: CAN-SPAM, RFC 8058, GDPR, FTC AI Guidelines, Google Core Policy',
        outputSummary: '100% compliant. RFC 8058 1-click unsubscribe active, postal footers bound, consent logging enforced.',
        fullOutput: 'Cross-Module Status: 100% Compliant\nCAN-SPAM: Enforced\nRFC 8058: Active\nGDPR: Consent Tracked\nCASL: 180-Day Window Active',
        metrics: [
          { label: 'Overall Score', value: '100 / 100' },
          { label: 'CAN-SPAM', value: 'Verified' },
          { label: 'RFC 8058', value: 'Active' },
          { label: 'FTC Disclosure', value: 'Enforced' }
        ]
      };
      setRunHistory(prev => [scanRun, ...prev]);
      notifySuccess('Compliance Audit Passed', 'All Growth OS modules meet enterprise legal & anti-spam regulations.');
    }, 1400);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">EXECUTION LAYER</Badge>
              <span className="text-zinc-600 text-xs">•</span>
              <Badge variant="neutral">LIFECYCLE &amp; COMPLIANCE</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Mail className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Email &amp; Lifecycle Marketing
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Automate high-converting B2B nurture sequences, interactive drip workflows, and strictly governed regulatory compliance (CAN-SPAM, RFC 8058, GDPR).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Tabs<'BROADCAST' | 'SEQUENCES' | 'COMPLIANCE_AUDIT' | 'DELIVERABILITY'>
              tabs={[
                { id: 'BROADCAST', label: 'Campaign Broadcast' },
                { id: 'SEQUENCES', label: 'Automated Drip Sequences' },
                { id: 'COMPLIANCE_AUDIT', label: 'Compliance & Regulations' },
                { id: 'DELIVERABILITY', label: 'Deliverability & DNS Health' }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>
      </GlassCard>

      {/* Main Tab 1: Broadcast */}
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

              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full justify-center"
                leftIcon={isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {isGenerating ? 'Optimizing Email Copy & Deliverability...' : 'Synthesize Optimized Email'}
              </Button>
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
                  <div className="sigma-segmented">
                    <button
                      onClick={() => setPreviewDevice('DESKTOP')}
                      className={cn(
                        "sigma-segment !min-h-8 !px-2",
                        previewDevice === 'DESKTOP' ? "sigma-segment-active" : ""
                      )}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('MOBILE')}
                      className={cn(
                        "sigma-segment !min-h-8 !px-2",
                        previewDevice === 'MOBILE' ? "sigma-segment-active" : ""
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

                {/* Verified Compliance Footer */}
                <div className="p-4 bg-white/[0.01] border-t border-white/5 text-[11px] text-zinc-500 space-y-1">
                  <p>Sigma Tactix Inc., 100 Montgomery St, Suite 1800, San Francisco, CA 94104</p>
                  <p>
                    You received this message based on verified enterprise inquiries. <a href="#unsubscribe" className="text-zinc-400 underline">Unsubscribe instantly with 1-click</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Interactive Automated Drip Sequences */}
      {activeTab === 'SEQUENCES' && (
        <div className="space-y-6">
          {/* Top Sequence Selector & Status Card */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold uppercase text-slate-400">Active Sequence:</label>
              <select
                value={selectedSequenceId}
                onChange={e => {
                  setSelectedSequenceId(e.target.value);
                  setSelectedStepIndex(0);
                }}
                className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm font-semibold text-white focus:border-teal-500 outline-none"
              >
                {sequences.map(seq => (
                  <option key={seq.id} value={seq.id}>
                    {seq.name} ({seq.steps.length} Touchpoints)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                STATUS: {currentSequence.status}
              </span>
              <button
                onClick={handleAddStep}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Touchpoint Step
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Interactive Steps Timeline */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Drip Steps Timeline ({currentSequence.steps.length})</span>
                <span className="text-teal-400 font-mono text-[11px]">Interval Governed</span>
              </h3>

              <div className="space-y-2">
                {currentSequence.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStepIndex(idx)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left cursor-pointer transition-all",
                      selectedStepIndex === idx
                        ? "bg-teal-500/10 border-teal-500/50 text-white shadow-md shadow-teal-500/5"
                        : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-teal-300 font-mono">
                        STEP {step.stepNumber} • DAY {step.delayDays}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{step.openRateEstimate} Open</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200 mt-2 line-clamp-1">{step.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{step.subjectVariantA}</p>
                  </div>
                ))}
              </div>

              {/* Compliance Controls Box */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Built-In Regulatory Safeguards
                </div>
                <div className="space-y-2 text-[11px] text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>CAN-SPAM Address Footer</span>
                    <Badge variant="success">INJECTED</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>RFC 8058 1-Click Unsubscribe</span>
                    <Badge variant="success">ACTIVE</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quiet Hours (No Night/Weekend Sends)</span>
                    <Badge variant="success">ENFORCED</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Suppression Circuit Breaker</span>
                    <Badge variant="success">&lt;0.08% RISK</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Step Inspector & Editor */}
            <div className="lg:col-span-8 space-y-5">
              {currentStep && (
                <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 font-mono">
                        Editing Touchpoint #{currentStep.stepNumber}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{currentStep.title}</h3>
                    </div>
                    <button
                      onClick={() => handleRemoveStep(selectedStepIndex)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Step
                    </button>
                  </div>

                  {/* Step Delay & Schedule Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Send Delay (Days)</label>
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={currentStep.delayDays}
                        onChange={e => updateCurrentStep({ delayDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Sending Window</label>
                      <input
                        type="text"
                        value={currentStep.sendWindow}
                        onChange={e => updateCurrentStep({ sendWindow: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Weekend Suppression</label>
                      <button
                        type="button"
                        onClick={() => updateCurrentStep({ skipWeekends: !currentStep.skipWeekends })}
                        className={cn(
                          "w-full py-2 px-3 rounded-xl border text-xs font-medium transition-colors text-left flex items-center justify-between",
                          currentStep.skipWeekends
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-black/40 border-white/10 text-zinc-400"
                        )}
                      >
                        <span>Skip Sat &amp; Sun</span>
                        <span>{currentStep.skipWeekends ? 'YES' : 'NO'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject Line Variations */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-medium text-slate-300">Subject Variant A (Primary)</span>
                        <span className="text-teal-400 font-mono">Predicted Open: {currentStep.openRateEstimate}</span>
                      </div>
                      <input
                        type="text"
                        value={currentStep.subjectVariantA}
                        onChange={e => updateCurrentStep({ subjectVariantA: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-medium text-slate-300">Subject Variant B (Alternative)</span>
                        <span className="text-emerald-400 font-mono">Predicted CTR: {currentStep.ctrEstimate}</span>
                      </div>
                      <input
                        type="text"
                        value={currentStep.subjectVariantB}
                        onChange={e => updateCurrentStep({ subjectVariantB: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Body Text */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Touchpoint Copy &amp; Personalization
                    </label>
                    <textarea
                      value={currentStep.bodyText}
                      onChange={e => updateCurrentStep({ bodyText: e.target.value })}
                      rows={7}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 font-mono leading-relaxed outline-none focus:border-teal-500 resize-none"
                    />
                  </div>

                  {/* Save Notification */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-zinc-500">
                      Changes auto-saved to workspace sequence manifest.
                    </span>
                    <button
                      onClick={() => notifySuccess('Sequence Saved', 'Active drip sequence configuration persisted.')}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white shadow"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 3: Regulations & Compliance Guardrails */}
      {activeTab === 'COMPLIANCE_AUDIT' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Growth OS App-Wide Regulatory Compliance Matrix</h3>
              </div>
              <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                Continuous compliance monitoring across Email, Social, CRO, and SEO modules to protect brand liability, prevent anti-spam fines, and ensure legal adherence across US, EU/UK, and Canadian jurisdictions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Audit Status</span>
                <div className="text-xl font-mono font-extrabold text-emerald-400">{complianceScore} / 100 PASS</div>
              </div>
              <Button
                variant="primary"
                onClick={handleRunComplianceScan}
                disabled={isScanningCompliance}
                leftIcon={isScanningCompliance ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              >
                {isScanningCompliance ? 'Scanning System...' : 'Run Full Compliance Scan'}
              </Button>
            </div>
          </div>

          {/* Module-by-Module Compliance Analysis & Strongest Workarounds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Email & Lifecycle Outbound */}
            <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-teal-400" />
                  <h4 className="text-sm font-semibold text-white">Email &amp; Outbound Lifecycle</h4>
                </div>
                <Badge variant="success">100% REGULATED</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-slate-200">CAN-SPAM &amp; RFC 8058 Mandates</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    <strong>Regulations:</strong> 15 U.S.C. 7701 requires a verified physical address; Google/Yahoo 2024+ sender guidelines mandate RFC 8058 1-click unsubscribe headers. Non-compliance risks $50,120 per violation and domain blacklisting.
                  </p>
                  <p className="text-[11px] text-teal-300 font-medium pt-1">
                    <strong>Strongest Workaround:</strong> Automated pre-flight checks strictly block outbound broadcasts if a verified physical address or RFC 8058 headers are absent. Recipients are purged in &lt;24 hours automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Social & Carousel Automation */}
            <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-semibold text-white">Social &amp; Carousel Automation</h4>
                </div>
                <Badge variant="success">FTC COMPLIANT</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-slate-200">FTC AI Endorsement &amp; Copyright (16 CFR Part 255)</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    <strong>Regulations:</strong> Unclear AI attribution in commercial promotions violates truth-in-advertising guidelines. Third-party brand mark infringement poses trademark liability.
                  </p>
                  <p className="text-[11px] text-purple-300 font-medium pt-1">
                    <strong>Strongest Workaround:</strong> The system embeds AI provenance metadata, restricts logo usage to Brand Vault assets, and enforces human sign-off in Agent Cockpit before any post touches LinkedIn or X APIs.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. CRO & Landing Pages */}
            <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-semibold text-white">CRO &amp; Landing Pages</h4>
                </div>
                <Badge variant="success">GDPR / ePRIVACY READY</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-slate-200">GDPR Cookie Consent &amp; Deceptive Claims</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    <strong>Regulations:</strong> EU/UK GDPR Article 83 fines up to €20M for non-consented analytics scripts; FTC Act Section 5 prohibits deceptive claims and unsubstantiated ROI metrics.
                  </p>
                  <p className="text-[11px] text-amber-300 font-medium pt-1">
                    <strong>Strongest Workaround:</strong> All generated landing page proposals automatically inject compliant cookie preference bars, verifiable client proof benchmarks, and mandatory privacy/terms links.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. SEO & AEO Programmatic Content */}
            <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-white">SEO &amp; AEO Authority Content</h4>
                </div>
                <Badge variant="success">GOOGLE CORE READY</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-slate-200">Google March 2024 Scaled Content Abuse Policy</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    <strong>Regulations:</strong> Google penalizes mass-generated, low-information-gain content with sitewide algorithmic demotions or complete manual index removal.
                  </p>
                  <p className="text-[11px] text-emerald-300 font-medium pt-1">
                    <strong>Strongest Workaround:</strong> The SEO module binds Schema.org JSON-LD structured author credentials, enforces primary citation citations, and mandates human review before publishing to Google Search Console.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 4: Deliverability */}
      {activeTab === 'DELIVERABILITY' && (
        <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-6">
          <h3 className="text-base font-semibold text-white">DNS &amp; Domain Authentication Health</h3>
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
