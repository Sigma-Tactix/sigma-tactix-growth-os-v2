export interface DiagnosticCategory {
  id: string;
  name: string;
  score: number;
  weight: string;
  status: 'OPTIMAL' | 'MODERATE' | 'LEAK_DETECTED';
  keyMetric: string;
  summary: string;
  leakEstimate: string;
}

export interface UIChecklistItem {
  id: string;
  category: 'Conversion & Hero' | 'Mobile & Speed' | 'Social Proof & Trust' | 'Checkout & Intake';
  checkpoint: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PASSED' | 'FAILED' | 'REMEDIATED';
  remediationAction: string;
  autoFixableByAgent: boolean;
  assignedAgent?: string;
}

export interface RoadmapMilestone {
  id: string;
  phase: 'Phase 1: Foundation (Days 1-30)' | 'Phase 2: Acceleration (Days 31-60)' | 'Phase 3: Autonomy (Days 61-90)';
  dayRange: string;
  title: string;
  objective: string;
  deliverable: string;
  ownerAgent: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  impactMetric: string;
}

export const DIAGNOSTIC_CATEGORIES: DiagnosticCategory[] = [
  {
    id: 'cat-acq',
    name: 'Acquisition & Ad Efficiency',
    score: 84,
    weight: '25%',
    status: 'OPTIMAL',
    keyMetric: 'Blended CPA $48.20',
    summary: 'Strong Meta Lookalike performance and search attribution. Moderate CPC inflation on broad search.',
    leakEstimate: '$4,800/mo potential saving via negative keyword clustering'
  },
  {
    id: 'cat-cro',
    name: 'Conversion Rate Architecture (CRO)',
    score: 68,
    weight: '30%',
    status: 'LEAK_DETECTED',
    keyMetric: 'Visitor-to-Lead 4.8%',
    summary: 'Mobile friction on intake form causing 22% drop-off. Hero lacks prominent statistical proof metrics.',
    leakEstimate: '$18,500/mo lost in dropped mobile prospects'
  },
  {
    id: 'cat-ret',
    name: 'Retention & Expansion LTV',
    score: 72,
    weight: '20%',
    status: 'MODERATE',
    keyMetric: 'Net LTV $1,840 (38.1x CAC)',
    summary: 'Healthy 90-day retention; expansion drip sequences lack automated trigger based on product usage milestones.',
    leakEstimate: '$9,200/mo in deferred expansion upsells'
  },
  {
    id: 'cat-auth',
    name: 'Authority & AI Search Penetration',
    score: 88,
    weight: '15%',
    status: 'OPTIMAL',
    keyMetric: '74% LLM Query Mention Share',
    summary: 'Dominant position in Perplexity and ChatGPT search citations for "AI Growth OS". Top-tier backlink profile.',
    leakEstimate: '$0 (High organic pipeline velocity)'
  },
  {
    id: 'cat-ops',
    name: 'Operations & Data Synchronization',
    score: 81,
    weight: '10%',
    status: 'OPTIMAL',
    keyMetric: '0.4s Query Latency',
    summary: '10 Second Brain Vaults synchronized. Real-time webhook connectors streaming into PostgreSQL.',
    leakEstimate: '$9,500/mo in recovered manual analyst labor'
  }
];

export const INITIAL_UI_CHECKLIST: UIChecklistItem[] = [
  {
    id: 'chk-01',
    category: 'Conversion & Hero',
    checkpoint: 'Quantified Value Proposition in H1',
    description: 'Hero headline must feature specific mechanism and verified business metric rather than generic hype words.',
    severity: 'HIGH',
    status: 'PASSED',
    remediationAction: 'Brand Vault tone vectors applied: "Client-Owned AI Growth OS & Second Brain Infrastructure".',
    autoFixableByAgent: true,
    assignedAgent: 'Content & Creative Engine'
  },
  {
    id: 'chk-02',
    category: 'Conversion & Hero',
    checkpoint: 'Primary CTA Above the Fold with Instant Reward',
    description: 'Primary action should trigger the interactive Diagnostic Calculator or Questionnaire immediately.',
    severity: 'CRITICAL',
    status: 'PASSED',
    remediationAction: 'Interactive Onboarding questionnaire embedded directly on viewport.',
    autoFixableByAgent: false
  },
  {
    id: 'chk-03',
    category: 'Mobile & Speed',
    checkpoint: 'Mobile Touch Target Minimum 44px',
    description: 'All tap surfaces and buttons must conform to mobile accessibility guidelines with zero mis-clicks.',
    severity: 'MEDIUM',
    status: 'FAILED',
    remediationAction: 'Increase padding on mobile filter tabs from 8px to 14px.',
    autoFixableByAgent: true,
    assignedAgent: 'Operations & SOP Specialist'
  },
  {
    id: 'chk-04',
    category: 'Mobile & Speed',
    checkpoint: 'Core Web Vitals Largest Contentful Paint < 1.2s',
    description: 'Hero rendering LCP must occur under 1.2 seconds on 4G cellular simulation.',
    severity: 'HIGH',
    status: 'PASSED',
    remediationAction: 'LCP optimized to 0.9s via edge caching and preloaded fonts.',
    autoFixableByAgent: false
  },
  {
    id: 'chk-05',
    category: 'Social Proof & Trust',
    checkpoint: 'Verified Customer Results with Real Metrics',
    description: 'Display specific customer case studies with validated LTV:CAC metrics and attribution logs.',
    severity: 'HIGH',
    status: 'PASSED',
    remediationAction: 'Real-time telemetry widgets connected to live reporting engine.',
    autoFixableByAgent: false
  },
  {
    id: 'chk-06',
    category: 'Social Proof & Trust',
    checkpoint: 'Security Zone Badge & Zero-Knowledge Encryption Notice',
    description: 'Clearly display encryption standards (AES-256 / Second Brain Tenant Isolation) near data intake.',
    severity: 'MEDIUM',
    status: 'FAILED',
    remediationAction: 'Add Security Zone indicator badge to the Onboarding Questionnaire form.',
    autoFixableByAgent: true,
    assignedAgent: 'Operations & SOP Specialist'
  },
  {
    id: 'chk-07',
    category: 'Checkout & Intake',
    checkpoint: 'Single-Step Progressive Intake Questionnaire',
    description: 'Form fields should auto-save on change and dynamically map into Second Brain Vaults.',
    severity: 'CRITICAL',
    status: 'PASSED',
    remediationAction: 'Dynamic Intake Engine active with live vault mapping pipeline.',
    autoFixableByAgent: false
  },
  {
    id: 'chk-08',
    category: 'Checkout & Intake',
    checkpoint: 'Zero-Lag Form Validation with Clear Inline Alerts',
    description: 'Eliminate blocking page refreshes; validate inputs asynchronously via schema constraints.',
    severity: 'HIGH',
    status: 'PASSED',
    remediationAction: 'Client-side schema validation with instant visual feedback.',
    autoFixableByAgent: true,
    assignedAgent: 'Content & Creative Engine'
  }
];

export const INITIAL_ROADMAP: RoadmapMilestone[] = [
  {
    id: 'ms-01',
    phase: 'Phase 1: Foundation (Days 1-30)',
    dayRange: 'Days 1-10',
    title: 'Second Brain Knowledge Ingestion & Vault Isolation',
    objective: 'Ingest all brand docs, competitor analyses, and credentials into the 10 partitioned PostgreSQL vaults.',
    deliverable: '10 Initialized Vaults + pgvector semantic embedding index with 100% test coverage.',
    ownerAgent: 'Operations Specialist (HELIOS-04)',
    status: 'COMPLETED',
    impactMetric: 'Unified Data Core Established'
  },
  {
    id: 'ms-02',
    phase: 'Phase 1: Foundation (Days 1-30)',
    dayRange: 'Days 11-20',
    title: 'Ad Platform & CRM Webhook Connectors Activation',
    objective: 'Establish bidirectional event streaming for Google Ads, Meta Ads, and HubSpot CRM.',
    deliverable: '3 Active Connectors with sub-second Kafka event transit and DLQ quarantine.',
    ownerAgent: 'Operations Specialist (HELIOS-04)',
    status: 'COMPLETED',
    impactMetric: '100% Attribution Visibility'
  },
  {
    id: 'ms-03',
    phase: 'Phase 1: Foundation (Days 1-30)',
    dayRange: 'Days 21-30',
    title: 'Mobile CRO Leak Remediation & Heuristic Fixes',
    objective: 'Eliminate mobile intake form friction and deploy high-converting interactive questionnaire.',
    deliverable: 'Mobile conversion rate uplift from 3.8% to 4.8%.',
    ownerAgent: 'Growth Diagnostic Specialist (ORACLE-05)',
    status: 'COMPLETED',
    impactMetric: '+$18.5k/mo Revenue Leak Sealed'
  },
  {
    id: 'ms-04',
    phase: 'Phase 2: Acceleration (Days 31-60)',
    dayRange: 'Days 31-45',
    title: 'Authority Pillar & Semantic Topic Cluster Deployment',
    objective: 'Publish 12 high-conviction architectural case studies targeting Tier-1 AI Growth keywords.',
    deliverable: 'Topical map expansion + 40% growth in organic impressions.',
    ownerAgent: 'Authority Builder Agent (AURORA-01)',
    status: 'IN_PROGRESS',
    impactMetric: '+450 Organic Inbound Leads'
  },
  {
    id: 'ms-05',
    phase: 'Phase 2: Acceleration (Days 31-60)',
    dayRange: 'Days 46-60',
    title: 'Performance Media Re-allocation & Fatigue Automation',
    objective: 'Scale high-ROAS Meta lookalike campaigns while pruning inefficient Google broad terms.',
    deliverable: 'Target Blended CAC reduction from $48.20 down to $36.00.',
    ownerAgent: 'Performance Re-allocator (VORTEX-02)',
    status: 'SCHEDULED',
    impactMetric: '+$34k/mo Profit Expansion'
  },
  {
    id: 'ms-06',
    phase: 'Phase 3: Autonomy (Days 61-90)',
    dayRange: 'Days 61-75',
    title: 'Autonomous HITL Bidding & Content Release Loop',
    objective: 'Empower Scoped Agents to execute daily campaign re-balancing with single-click Admin sign-offs.',
    deliverable: 'Zero human agency dependency; 100% client-owned execution velocity.',
    ownerAgent: 'Growth Diagnostic Specialist (ORACLE-05)',
    status: 'SCHEDULED',
    impactMetric: '90% Operating Efficiency'
  },
  {
    id: 'ms-07',
    phase: 'Phase 3: Autonomy (Days 61-90)',
    dayRange: 'Days 76-90',
    title: 'Cross-Tenant Benchmarking & Predictive Growth Model',
    objective: 'Train private Gemini ranking model on anonymized multi-tenant conversion velocity benchmarks.',
    deliverable: 'Predictive CAC forecasting with 94% accuracy.',
    ownerAgent: 'Executive Oversight Agent',
    status: 'SCHEDULED',
    impactMetric: 'Predictive Scale Guaranteed'
  }
];
