export type TutorialPhase = 'setup' | 'phase1' | 'phase2' | 'phase3' | 'phase4';
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TutorialStep {
  id: string;
  index: number;
  phase: TutorialPhase;
  phaseLabel: string;
  phaseColor: string;
  title: string;
  body: string;
  targetId: string;
  route: string;
  position: TooltipPosition;
  /** Optional: a label for what the next button should say */
  nextLabel?: string;
  /** If true, the spotlight pulses to draw attention */
  pulse?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ─── SETUP ───────────────────────────────────────────────────────────────
  {
    id: 'tut-step-welcome',
    index: 0,
    phase: 'setup',
    phaseLabel: 'Welcome',
    phaseColor: '#6366f1',
    title: '🚀 Welcome to SigmaTactix Growth OS',
    body: 'You\'re now inside a sovereign AI-native growth operating system. This 16-step guided tour will take you from zero to your first live results — in under 15 minutes. Follow the amber spotlight on each screen.',
    targetId: 'tut-dashboard-hero',
    route: '/',
    position: 'bottom',
    nextLabel: 'Let\'s Start →',
    pulse: true,
  },
  {
    id: 'tut-step-workspace',
    index: 1,
    phase: 'setup',
    phaseLabel: 'Welcome',
    phaseColor: '#6366f1',
    title: '🏢 Your Active Client Workspace',
    body: 'This switcher shows your active Client Enclave. Every module, vault, and agent in the system is scoped to whichever client is active here. You can manage multiple clients simultaneously — each fully isolated.',
    targetId: 'tut-workspace-switcher',
    route: '/',
    position: 'bottom',
  },
  {
    id: 'tut-step-playbook',
    index: 2,
    phase: 'setup',
    phaseLabel: 'Welcome',
    phaseColor: '#6366f1',
    title: '🗺 The 4-Phase Growth Loop',
    body: 'This PLAYBOOK bar is your mission control. The system runs a perpetual loop: DIAGNOSE → CAPTURE & CRM → DEMAND SWARMS → REVENUE CORE. Every module in the sidebar belongs to one of these four phases.',
    targetId: 'tut-playbook-bar',
    route: '/',
    position: 'bottom',
    pulse: true,
  },

  // ─── PHASE 1: DIAGNOSE ───────────────────────────────────────────────────
  {
    id: 'tut-step-onboard',
    index: 3,
    phase: 'phase1',
    phaseLabel: '1 · Diagnose',
    phaseColor: '#f59e0b',
    title: '✨ Onboard Your First Client',
    body: 'Every engagement starts here. Click this button to launch the Client Onboarding Wizard — a 5-step setup that provisions an isolated data vault, ingests your brand positioning into the Second Brain, and connects your data sources.',
    targetId: 'tut-onboard-btn',
    route: '/',
    position: 'bottom',
    nextLabel: 'Go to Diagnostics →',
    pulse: true,
  },
  {
    id: 'tut-step-run-audit',
    index: 4,
    phase: 'phase1',
    phaseLabel: '1 · Diagnose',
    phaseColor: '#f59e0b',
    title: '🩺 Run Your First Growth Audit',
    body: 'This button triggers a live multi-agent diagnostic across 8 growth dimensions: Website, Social, SEO, AI Visibility, Offer Clarity, Positioning, Funnel, and Analytics. Takes ~10 seconds. Your Growth Score will appear instantly.',
    targetId: 'tut-run-audit-btn',
    route: '/diagnostics',
    position: 'bottom',
    pulse: true,
  },
  {
    id: 'tut-step-score',
    index: 5,
    phase: 'phase1',
    phaseLabel: '1 · Diagnose',
    phaseColor: '#f59e0b',
    title: '📊 Your Growth Readiness Score',
    body: 'This is your baseline. The score (0–100) measures growth infrastructure health across all 8 categories. Switch between tabs: Overview (radar chart), Report (AI prose), Checklist (fixes), and Roadmap (90-day plan).',
    targetId: 'tut-audit-score-card',
    route: '/diagnostics',
    position: 'right',
  },
  {
    id: 'tut-step-export',
    index: 6,
    phase: 'phase1',
    phaseLabel: '1 · Diagnose',
    phaseColor: '#f59e0b',
    title: '📄 Export a Client-Ready Report',
    body: 'Click Export PDF to instantly generate a branded executive deck from the audit results. This is the deliverable you can send to a client or stakeholder in the first 15 minutes of onboarding.',
    targetId: 'tut-export-pdf-btn',
    route: '/diagnostics',
    position: 'left',
    nextLabel: 'Build the Second Brain →',
  },
  {
    id: 'tut-step-vault',
    index: 7,
    phase: 'phase1',
    phaseLabel: '1 · Diagnose',
    phaseColor: '#f59e0b',
    title: '🧠 Populate the Second Brain',
    body: 'The Second Brain is the permanent memory that makes every AI output client-specific, not generic. Click the Brand Vault to see what\'s already loaded from onboarding — then add records for customer insights, SOPs, and competitive intelligence.',
    targetId: 'tut-brand-vault-card',
    route: '/vaults',
    position: 'right',
    pulse: true,
    nextLabel: 'Phase 2: Capture & CRM →',
  },

  // ─── PHASE 2: CAPTURE & CRM ──────────────────────────────────────────────
  {
    id: 'tut-step-intake',
    index: 8,
    phase: 'phase2',
    phaseLabel: '2 · Capture & CRM',
    phaseColor: '#10b981',
    title: '⚡ Submit Your First Inbound Lead',
    body: 'The Intake Engine is already pre-filled with your workspace data. Review the fields and click Submit to Second Brain. The system routes each data point to the correct vault and activates the relevant AI agents automatically.',
    targetId: 'tut-intake-submit-btn',
    route: '/intake',
    position: 'top',
    pulse: true,
  },
  {
    id: 'tut-step-pipeline',
    index: 9,
    phase: 'phase2',
    phaseLabel: '2 · Capture & CRM',
    phaseColor: '#10b981',
    title: '🗂 The Sovereign Lead Pipeline',
    body: 'This Kanban board is your 6-stage CRM: New → Enriched → Outreach Active → Warm → Diagnostic Booked → Won. The AI SDR agent can advance leads through stages autonomously. Click any lead card to see its ICP score and enrichment data.',
    targetId: 'tut-pipeline-kanban',
    route: '/outreach',
    position: 'top',
    nextLabel: 'Phase 3: Demand Swarms →',
  },

  // ─── PHASE 3: DEMAND SWARMS ──────────────────────────────────────────────
  {
    id: 'tut-step-seo-agent',
    index: 10,
    phase: 'phase3',
    phaseLabel: '3 · Demand Swarms',
    phaseColor: '#8b5cf6',
    title: '🌐 Deploy the SEO Authority Agent',
    body: 'This button deploys Aurora-01, the SEO & Authority agent. It audits your topical coverage, generates JSON-LD schemas, verifies AEO citation readiness in Perplexity and Claude, and logs every result below. One click, full audit.',
    targetId: 'tut-seo-deploy-agent',
    route: '/seo-aeo',
    position: 'bottom',
    pulse: true,
  },
  {
    id: 'tut-step-content',
    index: 11,
    phase: 'phase3',
    phaseLabel: '3 · Demand Swarms',
    phaseColor: '#8b5cf6',
    title: '✍️ Generate Your First Content Asset',
    body: 'Select a content type (LinkedIn Carousel, Blog, Tweet Thread, etc.), fill in the brief, and click Generate with AI. The agent pulls your brand voice from the Brand Vault and positioning from the Customer Vault — so output is always on-brand, never generic.',
    targetId: 'tut-content-generate-btn',
    route: '/content',
    position: 'top',
  },
  {
    id: 'tut-step-hitl',
    index: 12,
    phase: 'phase3',
    phaseLabel: '3 · Demand Swarms',
    phaseColor: '#8b5cf6',
    title: '🤖 Review the Agent HITL Queue',
    body: 'Any agent action with real-world consequences — like a budget reallocation or publishing content — lands here for Human-in-the-Loop review. Approve, reject, or modify before the agent executes. This is how you stay in control of autonomous operations.',
    targetId: 'tut-hitl-queue',
    route: '/agents',
    position: 'top',
    nextLabel: 'Phase 4: Revenue Core →',
  },

  // ─── PHASE 4: REVENUE CORE ───────────────────────────────────────────────
  {
    id: 'tut-step-living-system',
    index: 13,
    phase: 'phase4',
    phaseLabel: '4 · Revenue Core',
    phaseColor: '#f97316',
    title: '🔮 The Living System Neural Core',
    body: 'This is the most powerful view in the OS. Every vault, agent, connector, and file in the system is rendered as a live 3D holographic node graph. Click any node to see its upstream dependencies and downstream outputs. Click ⚡ Inject Energy Pulse to confirm all nodes are alive.',
    targetId: 'tut-living-system-canvas',
    route: '/living-system',
    position: 'right',
    pulse: true,
  },
  {
    id: 'tut-step-attribution',
    index: 14,
    phase: 'phase4',
    phaseLabel: '4 · Revenue Core',
    phaseColor: '#f97316',
    title: '📈 Attribution & Blended CAC',
    body: 'This is where revenue truth lives. The attribution dashboard shows exactly which channels generated which conversions — without last-click bias. Your Blended CAC is computed across all channels simultaneously, reconciled against Stripe revenue.',
    targetId: 'tut-attribution-dashboard',
    route: '/attribution',
    position: 'top',
  },
  {
    id: 'tut-step-scheduler',
    index: 15,
    phase: 'phase4',
    phaseLabel: '4 · Revenue Core',
    phaseColor: '#f97316',
    title: '🗓 Schedule Your First Executive Report',
    body: 'Set up a recurring report delivery so your team automatically receives performance updates without asking. Choose PDF/PPTX/XLSX format, set frequency (daily, weekly, monthly), and add recipients. The Growth Loop is now running on autopilot.',
    targetId: 'tut-new-schedule-btn',
    route: '/scheduler',
    position: 'bottom',
    nextLabel: '🎉 Complete Tutorial',
    pulse: true,
  },
];

export const TUTORIAL_PHASES = [
  { key: 'setup',  label: 'Welcome',           color: '#6366f1', steps: [0, 1, 2] },
  { key: 'phase1', label: '1 · Diagnose',       color: '#f59e0b', steps: [3, 4, 5, 6, 7] },
  { key: 'phase2', label: '2 · Capture & CRM',  color: '#10b981', steps: [8, 9] },
  { key: 'phase3', label: '3 · Demand Swarms',  color: '#8b5cf6', steps: [10, 11, 12] },
  { key: 'phase4', label: '4 · Revenue Core',   color: '#f97316', steps: [13, 14, 15] },
] as const;

export const TOTAL_TUTORIAL_STEPS = TUTORIAL_STEPS.length;
