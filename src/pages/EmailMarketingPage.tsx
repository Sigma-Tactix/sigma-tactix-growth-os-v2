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

// These are default sequence TEMPLATES, not live campaigns. They start DRAFT
// (no email delivery backend is wired in this studio), and a fresh tenant
// only sees them as editable starting points — never as "ACTIVE" sends.
const DEFAULT_SEQUENCES: DripSequence[] = [
  {
    id: 'seq-01',
    name: 'Enterprise Demo Request Instant Nurture',
    targetAudience: 'Inbound high-intent B2B demo requesters',
    status: isDemoSeedEnabled() ? 'ACTIVE' : 'DRAFT',
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
    status: isDemoSeedEnabled() ? 'ACTIVE' : 'DRAFT',
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
  const { notifySuccess, notifyError, notifyInfo, notifyWarning } = useToast();
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
  // No audit has run until the user clicks "Run Compliance Checklist Review".
  const [complianceScore, setComplianceScore] = useState<number | null>(null);

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

  // Run History — empty by default. No email campaign has been synthesized
  // in a fresh workspace; entries are only added after a user action here.
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  // No live email-generation or spam-scoring backend is wired yet: this
  // drafts the copy locally in-session and records exactly that — it never
  // claims a scored subject line, a spam index, or verified SPF/DKIM.
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);

      const newRun: AgentRunRecord = {
        id: `run-email-${Date.now()}`,
        agentName: 'Lifecycle Email Architect',
        agentRole: 'B2B Nurture & Deliverability Optimizer',
        timestamp: 'Just now',
        status: 'PARTIAL',
        moduleOrigin: 'Email & Lifecycle Marketing',
        inputSummary: 'Broadcast draft for enterprise segment',
        outputSummary: 'Drafted locally in this session. No send, spam-score or DNS check was performed — no email backend is connected yet.',
        fullOutput: `Subject A: ${subjectLineA}\nSubject B: ${subjectLineB}\n\n${emailBody}`,
        metrics: [
          { label: 'Stage', value: 'Local draft' },
          { label: 'Spam Check', value: 'Not run' },
          { label: 'Dispatch', value: 'Not sent' }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifyInfo('Broadcast Drafted Locally', 'Copy staged in this session. Connect an email provider to synthesize, score and send for real.');
    }, 600);
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

  // This "scan" is a static checklist review of the configuration shown on
  // this page — it does not verify DNS, mailer or legal state anywhere. It
  // records a PASS/REVIEW result over the checklist only, and says so.
  const handleRunComplianceScan = () => {
    setIsScanningCompliance(true);
    setTimeout(() => {
      setIsScanningCompliance(false);
      const seq = currentSequence;
      const allGood =
        !!seq?.compliance.canSpamAddress.trim() &&
        seq?.compliance.rfc8058OneClickUnsubscribe === true;

      const scanRun: AgentRunRecord = {
        id: `run-comp-${Date.now()}`,
        agentName: 'Growth OS Compliance Sentinel',
        agentRole: 'Cross-Module Regulatory Verifier',
        timestamp: 'Just now',
        status: allGood ? 'SUCCESS' : 'PARTIAL',
        moduleOrigin: 'Email & Lifecycle Marketing',
        inputSummary: 'Static checklist review: CAN-SPAM address, RFC 8058 config, consent windows',
        outputSummary: allGood
          ? 'Checklist items configured on this page: CAN-SPAM address present, RFC 8058 1-click unsubscribe enabled. No live mailer/DNS verification was performed.'
          : 'One or more checklist items are missing on this page (CAN-SPAM address or RFC 8058). No live verification was performed.',
        fullOutput: `CAN-SPAM Address: ${seq?.compliance.canSpamAddress || '(missing)'}\nRFC 8058 1-Click Unsubscribe: ${seq?.compliance.rfc8058OneClickUnsubscribe ? 'enabled' : 'disabled'}\nCASL Consent Window: ${seq?.compliance.caslConsentWindowDays} days\nDaily Send Cap: ${seq?.compliance.dailySendCap}\nNote: static config review only — no DNS or mailer checks were run.`,
        metrics: [
          { label: 'Checklist', value: allGood ? 'All configured' : 'Items missing' },
          { label: 'Scope', value: 'Page config only' },
          { label: 'Live Verification', value: 'Not performed' }
        ]
      };
      setComplianceScore(allGood ? 100 : 0);
      setRunHistory(prev => [scanRun, ...prev]);
      if (allGood) {
        notifyInfo('Compliance Checklist Reviewed', 'On-page items configured. This is a checklist review — no DNS, mailer or legal verification was performed.');
      } else {
        notifyWarning('Compliance Checklist Needs Items', 'CAN-SPAM address or RFC 8058 is missing on the active sequence. Checklist only — no live verification was performed.');
      }
    }, 800);
  };

  return (
    <div className="space-y-8 lg:space-y-10 pb-16">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8 lg:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">EXECUTION LAYER</Badge>
              <span className="text-[var(--sigma-text-soft)] text-xs">•</span>
              <Badge variant="neutral">LIFECYCLE &amp; COMPLIANCE</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <Mail className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Email &amp; Lifecycle Marketing
            </h1>
            <p className="text-muted text-sm mt-1 max-w-2xl leading-relaxed">
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
            <div className="p-5 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-accent" />
                Subject Line A/B Optimization
              </h3>

              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium text-[var(--sigma-text-soft)]">Variant A (Problem Agitation)</span>
                  <span className="text-cyan-accent font-mono">Model est. open — not measured</span>
                </div>
                <input
                  type="text"
                  value={subjectLineA}
                  onChange={e => setSubjectLineA(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-sm text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)]/60"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium text-[var(--sigma-text-soft)]">Variant B (Empirical Curiosity)</span>
                  <span className="text-emerald-accent font-mono">Model est. open — not measured</span>
                </div>
                <input
                  type="text"
                  value={subjectLineB}
                  onChange={e => setSubjectLineB(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-sm text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)]/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1.5">Email Body Editor</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={10}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-xs text-[var(--sigma-text-soft)] font-mono leading-relaxed focus:outline-none focus:border-[var(--sigma-primary)]/60 resize-none"
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

            {/* Spam posture — no spam engine is wired yet: state it plainly. */}
            <div className="p-4 rounded-xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--sigma-accent-amber)]/10 text-amber-accent">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--sigma-text)]">Spam Trigger Audit</div>
                  <div className="text-[11px] text-muted">No spam-checking engine is connected to this studio yet.</div>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-accent px-2.5 py-1 rounded-full bg-[var(--sigma-accent-amber)]/10 border border-[var(--sigma-accent-amber)]/20">
                NOT VERIFIED
              </span>
            </div>
          </div>

          {/* Right Column: Live Email Client Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
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
                  <span className="text-xs text-muted">Live Client Rendering ({previewDevice})</span>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(emailBody);
                    setCopied(true);
                    notifySuccess('Copied', 'Email body copied to clipboard.');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text-soft)] hover:bg-[var(--sigma-surface-subtle)] flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy HTML / Text
                </button>
              </div>

              {/* Email Envelope Header */}
              <div className={cn(
                "mx-auto rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-canvas)]/50 overflow-hidden transition-all shadow-xl",
                previewDevice === 'MOBILE' ? "max-w-[360px]" : "w-full"
              )}>
                <div className="p-4 bg-[var(--sigma-surface-subtle)] border-b border-[var(--sigma-border)]/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted">
                    <span>From: <strong className="text-[var(--sigma-text)]">Sigma Tactix Intelligence &lt;intel@sigmatactix.com&gt;</strong></span>
                    <span className="font-mono text-[10px]">Today at 09:00 AM</span>
                  </div>
                  <div className="text-[var(--sigma-text-soft)]">
                    Subject: <strong className="text-cyan-accent">{subjectLineA}</strong>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-6 text-sm text-[var(--sigma-text-soft)] leading-relaxed whitespace-pre-wrap font-sans">
                  {emailBody}
                </div>

                {/* Verified Compliance Footer */}
                <div className="p-4 bg-[var(--sigma-surface-subtle)] border-t border-[var(--sigma-border)]/60 text-[11px] text-muted space-y-1">
                  <p>Sigma Tactix Inc., 100 Montgomery St, Suite 1800, San Francisco, CA 94104</p>
                  <p>
                    You received this message based on verified enterprise inquiries. <a href="#unsubscribe" className="text-muted underline">Unsubscribe instantly with 1-click</a>.
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
          <div className="p-5 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold uppercase text-muted">Active Sequence:</label>
              <select
                value={selectedSequenceId}
                onChange={e => {
                  setSelectedSequenceId(e.target.value);
                  setSelectedStepIndex(0);
                }}
                className="px-3.5 py-2 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-sm font-semibold text-[var(--sigma-text)] focus:border-[var(--sigma-primary)]/60 outline-none"
              >
                {sequences.map(seq => (
                  <option key={seq.id} value={seq.id}>
                    {seq.name} ({seq.steps.length} Touchpoints)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-mono font-bold border",
                  currentSequence.status === 'ACTIVE'
                    ? "bg-emerald-500/10 text-emerald-accent border-emerald-500/20"
                    : "bg-[var(--sigma-surface-subtle)] text-muted border-[var(--sigma-border)]"
                )}
              >
                STATUS: {currentSequence.status}
                {currentSequence.status === 'DRAFT' && ' (not sending)'}
              </span>
              <button
                onClick={handleAddStep}
                className="px-3 py-1.5 rounded-lg bg-[var(--sigma-primary)] hover:bg-[var(--sigma-primary-hover)] text-xs font-semibold text-[var(--sigma-text)] flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Touchpoint Step
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Interactive Steps Timeline */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center justify-between">
                <span>Drip Steps Timeline ({currentSequence.steps.length})</span>
                <span className="text-cyan-accent font-mono text-[11px]">Interval Governed</span>
              </h3>

              <div className="space-y-2">
                {currentSequence.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStepIndex(idx)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left cursor-pointer transition-all",
                      selectedStepIndex === idx
                        ? "bg-teal-500/10 border-teal-500/50 text-[var(--sigma-text)] shadow-md shadow-teal-500/5"
                        : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)]/60 text-muted hover:border-[var(--sigma-border-strong)] hover:text-[var(--sigma-text-soft)]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--sigma-surface-subtle)] text-cyan-accent font-mono">
                        STEP {step.stepNumber} • DAY {step.delayDays}
                      </span>
                      <span className="text-[10px] text-muted font-mono">est. {step.openRateEstimate} open</span>
                    </div>
                    <h4 className="text-xs font-semibold text-[var(--sigma-text-soft)] mt-2 line-clamp-1">{step.title}</h4>
                    <p className="text-[11px] text-muted mt-1 line-clamp-1">{step.subjectVariantA}</p>
                  </div>
                ))}
              </div>

              {/* Compliance Controls Box — settings configured for this
                  sequence; nothing is enforced until a send pipeline exists. */}
              <div className="p-4 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] space-y-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-emerald-accent">
                  <ShieldCheck className="w-4 h-4" /> Regulatory Settings
                </div>
                <div className="space-y-2 text-[11px] text-muted">
                  <div className="flex items-center justify-between">
                    <span>CAN-SPAM Address Footer</span>
                    <Badge variant="neutral">{currentSequence?.compliance.canSpamAddress ? 'Configured' : 'Missing'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>RFC 8058 1-Click Unsubscribe</span>
                    <Badge variant="neutral">{currentSequence?.compliance.rfc8058OneClickUnsubscribe ? 'Configured' : 'Disabled'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quiet Hours (No Night/Weekend Sends)</span>
                    <Badge variant="neutral">Per step</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Suppression Circuit Breaker</span>
                    <Badge variant="neutral">{currentSequence?.compliance.suppressionCircuitBreaker ? 'On' : 'Off'}</Badge>
                  </div>
                </div>
                <p className="text-[10px] text-muted leading-relaxed pt-1 border-t border-[var(--sigma-border)]">
                  These are settings on the sequence. No mailer or enforcement engine is connected, so they are not applied anywhere yet.
                </p>
              </div>
            </div>

            {/* Right Column: Step Inspector & Editor */}
            <div className="lg:col-span-8 space-y-5">
              {currentStep && (
                <div className="p-6 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-accent font-mono">
                        Editing Touchpoint #{currentStep.stepNumber}
                      </span>
                      <h3 className="text-lg font-bold text-[var(--sigma-text)] mt-0.5">{currentStep.title}</h3>
                    </div>
                    <button
                      onClick={() => handleRemoveStep(selectedStepIndex)}
                      className="text-rose-accent hover:text-rose-accent p-2 rounded-lg hover:bg-rose-500/10 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Step
                    </button>
                  </div>

                  {/* Step Delay & Schedule Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1">Send Delay (Days)</label>
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={currentStep.delayDays}
                        onChange={e => updateCurrentStep({ delayDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] outline-none focus:border-[var(--sigma-primary)]/60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1">Sending Window</label>
                      <input
                        type="text"
                        value={currentStep.sendWindow}
                        onChange={e => updateCurrentStep({ sendWindow: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] outline-none focus:border-[var(--sigma-primary)]/60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1">Weekend Suppression</label>
                      <button
                        type="button"
                        onClick={() => updateCurrentStep({ skipWeekends: !currentStep.skipWeekends })}
                        className={cn(
                          "w-full py-2 px-3 rounded-xl border text-xs font-medium transition-colors text-left flex items-center justify-between",
                          currentStep.skipWeekends
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-accent"
                            : "bg-[var(--sigma-canvas)]/50 border-[var(--sigma-border)] text-muted"
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
                        <span className="font-medium text-[var(--sigma-text-soft)]">Subject Variant A (Primary)</span>
                        <span className="text-cyan-accent font-mono">Model est. open: {currentStep.openRateEstimate}</span>
                      </div>
                      <input
                        type="text"
                        value={currentStep.subjectVariantA}
                        onChange={e => updateCurrentStep({ subjectVariantA: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] outline-none focus:border-[var(--sigma-primary)]/60"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-medium text-[var(--sigma-text-soft)]">Subject Variant B (Alternative)</span>
                        <span className="text-emerald-accent font-mono">Model est. CTR: {currentStep.ctrEstimate}</span>
                      </div>
                      <input
                        type="text"
                        value={currentStep.subjectVariantB}
                        onChange={e => updateCurrentStep({ subjectVariantB: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] outline-none focus:border-[var(--sigma-primary)]/60"
                      />
                    </div>
                  </div>

                  {/* Body Text */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1.5">
                      Touchpoint Copy &amp; Personalization
                    </label>
                    <textarea
                      value={currentStep.bodyText}
                      onChange={e => updateCurrentStep({ bodyText: e.target.value })}
                      rows={7}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] text-xs text-[var(--sigma-text-soft)] font-mono leading-relaxed outline-none focus:border-[var(--sigma-primary)]/60 resize-none"
                    />
                  </div>

                  {/* Save — sequences live in this page's state only; a
                      workspace persistence endpoint is not wired yet. */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-muted">
                      Edits apply to this session. Sequence persistence to the workspace is not wired yet.
                    </span>
                    <button
                      onClick={() => notifyInfo('Configuration Updated', 'Sequence updated in this session only. No workspace write was made — persistence is not wired yet.')}
                      className="px-4 py-2 rounded-xl bg-[var(--sigma-primary)] hover:bg-[var(--sigma-primary-hover)] text-xs font-bold text-[var(--sigma-text)] shadow"
                    >
                      Apply to Session
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
          <div className="p-6 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-accent" />
                <h3 className="text-lg font-bold text-[var(--sigma-text)]">Growth OS App-Wide Regulatory Compliance Matrix</h3>
              </div>
              <p className="text-xs text-muted max-w-2xl leading-relaxed">
                A static regulatory checklist for the configuration on this page. Running the review checks the on-page settings only — it does not verify DNS, mailer or legal state, so treat results as a review, not a certification.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted">Checklist Status</span>
                {complianceScore === null ? (
                  <div className="text-xl font-mono font-extrabold text-muted">Not reviewed</div>
                ) : complianceScore > 0 ? (
                  <div className="text-xl font-mono font-extrabold text-emerald-accent">All items configured</div>
                ) : (
                  <div className="text-xl font-mono font-extrabold text-amber-accent">Items missing</div>
                )}
              </div>
              <Button
                variant="primary"
                onClick={handleRunComplianceScan}
                disabled={isScanningCompliance}
                leftIcon={isScanningCompliance ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              >
                {isScanningCompliance ? 'Reviewing Checklist...' : 'Run Compliance Checklist Review'}
              </Button>
            </div>
          </div>

          {/* Module-by-Module Compliance Analysis & Strongest Workarounds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Email & Lifecycle Outbound */}
            <div className="p-5 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-accent" />
                  <h4 className="text-sm font-semibold text-[var(--sigma-text)]">Email &amp; Outbound Lifecycle</h4>
                </div>
                <Badge variant="neutral">REFERENCE</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)]/60 space-y-1">
                  <div className="font-semibold text-[var(--sigma-text-soft)]">CAN-SPAM &amp; RFC 8058 Mandates</div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    <strong>Regulations:</strong> 15 U.S.C. 7701 requires a verified physical address; Google/Yahoo 2024+ sender guidelines mandate RFC 8058 1-click unsubscribe headers. Non-compliance risks $50,120 per violation and domain blacklisting.
                  </p>
                  <p className="text-[11px] text-cyan-accent font-medium pt-1">
                    <strong>Intended guardrail:</strong> Design the send pipeline so pre-flight checks block broadcasts without a verified address or RFC 8058 headers. No mailer is wired to this studio yet, so these are requirements, not active enforcement.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Social & Carousel Automation */}
            <div className="p-5 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-accent" />
                  <h4 className="text-sm font-semibold text-[var(--sigma-text)]">Social &amp; Carousel Automation</h4>
                </div>
                <Badge variant="neutral">REFERENCE</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)]/60 space-y-1">
                  <div className="font-semibold text-[var(--sigma-text-soft)]">FTC AI Endorsement &amp; Copyright (16 CFR Part 255)</div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    <strong>Regulations:</strong> Unclear AI attribution in commercial promotions violates truth-in-advertising guidelines. Third-party brand mark infringement poses trademark liability.
                  </p>
                  <p className="text-[11px] text-blue-accent font-medium pt-1">
                    <strong>Intended guardrail:</strong> Keep AI provenance metadata on promotions and restrict logos to Brand Vault assets. Human sign-off lives in Agent Cockpit for anything that reaches a channel API — social posting is not wired from this studio.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. CRO & Landing Pages */}
            <div className="p-5 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-accent" />
                  <h4 className="text-sm font-semibold text-[var(--sigma-text)]">CRO &amp; Landing Pages</h4>
                </div>
                <Badge variant="neutral">REFERENCE</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)]/60 space-y-1">
                  <div className="font-semibold text-[var(--sigma-text-soft)]">GDPR Cookie Consent &amp; Deceptive Claims</div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    <strong>Regulations:</strong> EU/UK GDPR Article 83 fines up to €20M for non-consented analytics scripts; FTC Act Section 5 prohibits deceptive claims and unsubstantiated ROI metrics.
                  </p>
                  <p className="text-[11px] text-amber-300 font-medium pt-1">
                    <strong>Intended guardrail:</strong> Proposals for generated pages should carry cookie consent controls and verifiable proof points. The CRO studio is where those artifacts are built and approved — this card is reference, not an enforcement log.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. SEO & AEO Programmatic Content */}
            <div className="p-5 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-accent" />
                  <h4 className="text-sm font-semibold text-[var(--sigma-text)]">SEO &amp; AEO Authority Content</h4>
                </div>
                <Badge variant="neutral">REFERENCE</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)]/60 space-y-1">
                  <div className="font-semibold text-[var(--sigma-text-soft)]">Google March 2024 Scaled Content Abuse Policy</div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    <strong>Regulations:</strong> Google penalizes mass-generated, low-information-gain content with sitewide algorithmic demotions or complete manual index removal.
                  </p>
                  <p className="text-[11px] text-emerald-300 font-medium pt-1">
                    <strong>Intended guardrail:</strong> The SEO module emits Schema.org JSON-LD and requires citation support; the SEO & AEO studio owns that workflow and its approval gates. This card documents the requirement, not live enforcement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 4: Deliverability — no DNS/mailer checks are wired yet, so
          this reports what is NOT known rather than inventing records. */}
      {activeTab === 'DELIVERABILITY' && (
        <div className="p-6 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-6">
          <div>
            <h3 className="text-base font-semibold text-[var(--sigma-text)]">DNS &amp; Domain Authentication Health</h3>
            <p className="text-xs text-muted mt-1">
              No DNS lookup or mailer test is connected to this studio, so nothing below has been measured. Records appear here once a check is wired.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'SPF Record', status: 'NOT CHECKED', value: 'No lookup performed' },
              { label: 'DKIM Signature', status: 'NOT CHECKED', value: 'No lookup performed' },
              { label: 'DMARC Policy', status: 'NOT CHECKED', value: 'No lookup performed' },
              { label: 'Sender Score', status: 'NO DATA', value: 'No mailer connected' }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-[var(--sigma-canvas)]/50 border border-[var(--sigma-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{item.label}</span>
                  <span className="text-[10px] font-bold text-muted px-2 py-0.5 rounded bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
                    {item.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-muted truncate">{item.value}</div>
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
