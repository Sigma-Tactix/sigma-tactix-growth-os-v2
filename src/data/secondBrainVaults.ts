export interface VaultRecord {
  id: string;
  vaultId: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  classification: 'RESTRICTED_C_LEVEL' | 'ENCRYPTED_SECRET' | 'STRATEGIC_CORE' | 'OPERATIONAL_PUBLIC' | 'AUDIT_DIAGNOSTIC' | 'UNCLASSIFIED';
  allowedRoles: string[];
  vectorIndexed: boolean;
  embeddingDimensions?: number;
  lastUpdated: string;
  author: string;
  tags: string[];
  meta?: Record<string, any>;
}

export interface SecondBrainVault {
  id: string;
  name: string;
  layer: 'Foundation' | 'Intelligence' | 'Creation' | 'Agent';
  description: string;
  iconName: string;
  securityZone: string;
  encryptionLevel: string;
  recordCount: number;
  allowedAgents: string[];
  restrictedFrom: string[];
  records: VaultRecord[];
}

export const EMPTY_SECOND_BRAIN_VAULTS: SecondBrainVault[] = [
  {
    id: 'executive-vault',
    name: 'Executive Vault',
    layer: 'Foundation',
    description: 'Master strategy docs, proprietary IP records, C-level financial benchmarks, and shareholder growth targets.',
    iconName: 'Crown',
    securityZone: 'ZONE_0_EXECUTIVE',
    encryptionLevel: 'AES-256-GCM Hardware Security Key',
    recordCount: 0,
    allowedAgents: ['Executive Oversight Agent (Read-Only)'],
    restrictedFrom: ['Content Agent', 'Media Buyer Agent', 'Social Agent', 'Public Connectors'],
    records: []
  },
  {
    id: 'credentials-vault',
    name: 'Credentials Vault',
    layer: 'Foundation',
    description: 'Zero-knowledge masked credentials, API tokens, OAuth refresh secrets, CMS tokens, and ad platform keys.',
    iconName: 'KeyRound',
    securityZone: 'ZONE_0_SECRETS',
    encryptionLevel: 'Envelope Encryption / KMS Vault',
    recordCount: 0,
    allowedAgents: ['Connector Sync Worker (Scoped)'],
    restrictedFrom: ['Content Agent', 'Creative Director', 'All Generative LLMs'],
    records: []
  },
  {
    id: 'brand-vault',
    name: 'Brand Vault',
    layer: 'Foundation',
    description: 'Core brand guidelines, authoritative voice definitions, positioning matrices, and approved narrative arcs.',
    iconName: 'Palette',
    securityZone: 'ZONE_1_BRAND_CORE',
    encryptionLevel: 'AES-256 Cloud Encrypted at Rest',
    recordCount: 0,
    allowedAgents: ['Content Creator Agent', 'SEO Authority Agent', 'Creative Director Agent', 'Social Strategist'],
    restrictedFrom: ['Financial Auditor Agent', 'Ad Account Connector API'],
    records: []
  },
  {
    id: 'customer-vault',
    name: 'Customer Vault',
    layer: 'Foundation',
    description: 'Enterprise ICP matrices, verified buyer journeys, objection counters, and pain-point vectors.',
    iconName: 'Users',
    securityZone: 'ZONE_2_CUSTOMER_INTEL',
    encryptionLevel: 'AES-256 Cloud Encrypted at Rest',
    recordCount: 0,
    allowedAgents: ['AI SDR Agent', 'Customer Success Agent', 'Marketing Strategist'],
    restrictedFrom: ['Technical Maintenance Agent'],
    records: []
  },
  {
    id: 'marketing-vault',
    name: 'Marketing Vault',
    layer: 'Creation',
    description: 'Historical performance benchmarks, verified ad creatives, winning copy hooks, and conversion telemetry.',
    iconName: 'Megaphone',
    securityZone: 'ZONE_2_CAMPAIGN_OPS',
    encryptionLevel: 'AES-256 Cloud Encrypted at Rest',
    recordCount: 0,
    allowedAgents: ['Media Buyer Agent', 'Creative Director Agent', 'Copywriting Swarm'],
    restrictedFrom: ['Core Security Auditor'],
    records: []
  },
  {
    id: 'website-vault',
    name: 'Website Vault',
    layer: 'Intelligence',
    description: 'DOM hierarchy scans, technical SEO architecture, conversion funnel bottlenecks, and Core Web Vitals telemetry.',
    iconName: 'Globe',
    securityZone: 'ZONE_3_PUBLIC_SURFACE',
    encryptionLevel: 'Standard Secure at Rest',
    recordCount: 0,
    allowedAgents: ['SEO Authority Agent', 'UI/UX Diagnostic Agent', 'Lighthouse Crawler'],
    restrictedFrom: ['Credentials Vault Reader'],
    records: []
  },
  {
    id: 'authority-vault',
    name: 'Authority Vault',
    layer: 'Intelligence',
    description: 'Entity authority graphs, search engine citation indices, LLM training footprint coverage, and backlink topology.',
    iconName: 'Award',
    securityZone: 'ZONE_3_AUTHORITY_INTEL',
    encryptionLevel: 'Standard Secure at Rest',
    recordCount: 0,
    allowedAgents: ['SEO Authority Agent', 'Entity Citation Synthesizer'],
    restrictedFrom: ['Billing Admin'],
    records: []
  },
  {
    id: 'operations-vault',
    name: 'Operations Vault',
    layer: 'Agent',
    description: 'Standard Operating Procedures (SOPs), human-in-the-loop review routing rules, and escalation pathways.',
    iconName: 'Workflow',
    securityZone: 'ZONE_1_INTERNAL_OPS',
    encryptionLevel: 'AES-256 Cloud Encrypted at Rest',
    recordCount: 0,
    allowedAgents: ['Operations Orchestrator', 'HITL Governance Supervisor'],
    restrictedFrom: ['Third-party Connector APIs'],
    records: []
  },
  {
    id: 'ai-workflow-vault',
    name: 'AI Workflow Vault',
    layer: 'Agent',
    description: 'Model hyperparameters, temperature baselines, system prompt versions, and multi-agent coordination DAGs.',
    iconName: 'Cpu',
    securityZone: 'ZONE_0_AGENT_CORE',
    encryptionLevel: 'KMS Key Encrypted',
    recordCount: 0,
    allowedAgents: ['Core Orchestrator Agent', 'Agent Self-Learning Critic'],
    restrictedFrom: ['External Webhooks', 'Public APIs'],
    records: []
  },
  {
    id: 'audit-vault',
    name: 'Audit Vault',
    layer: 'Intelligence',
    description: 'Point-in-time growth diagnostic audits, converted leak assessments, UI/UX audit captures, and 90-day roadmaps.',
    iconName: 'FileSearch',
    securityZone: 'ZONE_2_AUDIT_LOGS',
    encryptionLevel: 'AES-256 Cloud Encrypted at Rest',
    recordCount: 0,
    allowedAgents: ['Growth Diagnostic Synthesizer', 'Audit Review Agent'],
    restrictedFrom: ['Autonomous Ad Publisher'],
    records: []
  },
  {
    id: 'technical-vault',
    name: 'Technical Vault',
    layer: 'Foundation',
    description: 'Database schemas, webhook configurations, API platform specifications, and DNS TXT verification records.',
    iconName: 'Terminal',
    securityZone: 'ZONE_1_INFRASTRUCTURE',
    encryptionLevel: 'AES-256 Cloud Encrypted at Rest',
    recordCount: 0,
    allowedAgents: ['Platform Reliability Engineer Agent', 'Workspace Provisioner'],
    restrictedFrom: ['Copywriting Agent', 'Social Media Agent'],
    records: []
  }
];

// Sigma Tactix Authentic Second Brain Knowledge Base (Dogfooding)
export const SIGMA_TACTIX_SECOND_BRAIN_VAULTS: SecondBrainVault[] = EMPTY_SECOND_BRAIN_VAULTS.map(vault => {
  if (vault.id === 'brand-vault') {
    const records: VaultRecord[] = [
      {
        id: 'st-brand-01',
        vaultId: 'brand-vault',
        title: 'Sigma Tactix Brand Identity & Core Value Propositions',
        category: 'Brand Positioning',
        summary: 'Official positioning, voice guidelines, slogans, and closed-loop Growth OS delivery model.',
        content: `Company: Sigma Tactix
Primary Domain: sigmatactix.com
Headline: The AI-Native Growth Operating System for Modern Business.
Tagline: Your Business Brain. Your Growth Engine.
Core Philosophy:
1. Memory before automation (Second Brain is the source of truth).
2. Diagnosis before execution (Audit bottlenecks before publishing campaigns).
3. Guardrails before agents (RBAC vault filtering + HITL approval gates).
4. Client ownership before platform lock-in (Client owns Postgres & pgvector data).
5. Coordination before fragmentation (15 modules operating as one cohesive engine).
6. Compounding intelligence (Every run writes back into organizational memory).`,
        classification: 'STRATEGIC_CORE',
        allowedRoles: ['ADMIN', 'EDITOR'],
        vectorIndexed: true,
        embeddingDimensions: 768,
        lastUpdated: '2026-09-04',
        author: 'Nazim Khwaja',
        tags: ['Sigma Tactix', 'Brand', 'Positioning', 'Value Prop']
      }
    ];
    return { ...vault, recordCount: records.length, records };
  }

  if (vault.id === 'customer-vault') {
    const records: VaultRecord[] = [
      {
        id: 'st-cust-01',
        vaultId: 'customer-vault',
        title: 'Sigma Tactix ICP Matrix & Market Targeting (GCC & Global)',
        category: 'Ideal Customer Profile',
        summary: 'Target client profiles: Mid-market GCC enterprises and scaling tech businesses.',
        content: `Target Segments:
1. UAE & GCC Mid-Market Enterprises: Traditional companies looking to automate marketing, authority building, and customer acquisition while complying with PDPL data sovereignty.
2. High-Growth Tech Scaleups & Agencies: Teams needing autonomous multi-agent execution, continuous visual UI/UX audits, and compounding RAG intelligence without hiring bloated agency retainers.
Key Objections:
- Data Privacy & Residency: Solved by client-owned Supabase Postgres instances, pgvector RAG, and strict UAE PDPL compliance.
- AI Hallucinations / Rogue Agent Behavior: Solved by Human-in-the-Loop (HITL) approval gates on all external publishing and strict RBAC vault scoping.`,
        classification: 'STRATEGIC_CORE',
        allowedRoles: ['ADMIN', 'EDITOR'],
        vectorIndexed: true,
        embeddingDimensions: 768,
        lastUpdated: '2026-09-04',
        author: 'Nazim Khwaja',
        tags: ['ICP', 'GCC', 'UAE', 'Enterprise', 'Scaleups']
      }
    ];
    return { ...vault, recordCount: records.length, records };
  }

  if (vault.id === 'website-vault') {
    const records: VaultRecord[] = [
      {
        id: 'st-web-01',
        vaultId: 'website-vault',
        title: 'sigmatactix.com Web Architecture & Domain Configuration',
        category: 'Domain & Infrastructure',
        summary: 'Production domain configuration and diagnostic baseline for sigmatactix.com.',
        content: `Domain: sigmatactix.com
CMS: Custom React 19 / Modern Web Stack
Edge Routing: Cloudflare / Edge CDN
Tracking Readiness: Server-side pixel events, Google Analytics 4, Meta Conversions API.
Target Keywords: AI Growth OS, Second Brain for Business, AI-Native Marketing, GCC AI Transformation.`,
        classification: 'OPERATIONAL_PUBLIC',
        allowedRoles: ['ADMIN', 'EDITOR'],
        vectorIndexed: true,
        embeddingDimensions: 768,
        lastUpdated: '2026-09-04',
        author: 'Nazim Khwaja',
        tags: ['Website', 'Domain', 'sigmatactix.com', 'SEO']
      }
    ];
    return { ...vault, recordCount: records.length, records };
  }

  return vault;
});

// Default active vault set
export const SECOND_BRAIN_VAULTS: SecondBrainVault[] = SIGMA_TACTIX_SECOND_BRAIN_VAULTS;
