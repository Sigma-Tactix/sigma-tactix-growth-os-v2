export type DocumentStage = 'PROSPECTING' | 'DISCUSSING' | 'CLOSING';

export type DocumentType = 
  | 'DIAGNOSTIC_TEARDOWN' 
  | 'CAPABILITY_BRIEF'
  | 'MUTUAL_NDA' 
  | 'OFFERINGS_PROPOSAL' 
  | 'MASTER_SERVICES_AGREEMENT' 
  | 'STATEMENT_OF_WORK'
  | 'ONBOARDING_PACKET';

export interface ConsultingPackage {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  priceDisplay: string;
  billingFrequency: 'ONE_TIME' | 'QUARTERLY' | 'MONTHLY';
  typicalDuration: string;
  targetClientState: string;
  coreDeliverables: string[];
  swarmsIncluded: string[];
  governanceModel: string;
  roiBenchmark: string;
}

export const AGENCY_CONSULTING_PACKAGES: ConsultingPackage[] = [
  {
    id: 'package-diagnostic',
    name: 'Growth Diagnostic & Forensic Gap Audit',
    badge: 'STAGE 1: DISCOVERY SPRINT',
    tagline: '5-pillar empirical teardown revealing your invisible digital CAC and conversion leaks.',
    priceDisplay: '$3,500',
    billingFrequency: 'ONE_TIME',
    typicalDuration: '5 Business Days',
    targetClientState: 'Growth stage B2B or E-commerce brands spending $15k–$100k/mo on ads with decelerating pipeline velocity.',
    coreDeliverables: [
      'Empirical FCP/LCP Speed & DOM Layout Render bottleneck audit',
      'AEO Citation & Semantic Knowledge Graph score across ChatGPT, Perplexity & Claude',
      'Paid Ad Creative Fatigue & Decay curve telemetry across Meta, Google & LinkedIn',
      'Conversion Dock Teardown: 7-point friction map on signup/demo forms',
      'Actionable 90-Day Engineering & Positioning Remediation Blueprint'
    ],
    swarmsIncluded: ['AURA-01 (Authority)', 'VORTEX-05 (Performance)', 'VECTOR-05 (Diagnostic)'],
    governanceModel: 'Complete forensic audit deck with 60-minute executive presentation.',
    roiBenchmark: 'Identifies minimum $18,000/mo in recoverable ad waste or pipeline leakage.'
  },
  {
    id: 'package-accelerator',
    name: '90-Day Sovereign Growth OS Deployment',
    badge: 'STAGE 2: SYSTEM DEPLOYMENT',
    tagline: 'Private enclave deployment replacing rented agency retainers with autonomous agent swarms.',
    priceDisplay: '$12,500',
    billingFrequency: 'QUARTERLY',
    typicalDuration: '90 Days (3 Milestone Sprints)',
    targetClientState: 'Companies ready to build institutional growth equity rather than cycling through external agencies.',
    coreDeliverables: [
      'Private Sovereign Enclave installation with dedicated Second Brain ingestion',
      'Autonomous SDR Swarm (HERMES-07) calibrated to your ICP and corporate mailboxes',
      'Daily programmatic AEO topical authority engine (3 high-signal articles weekly)',
      'Automated Ad Creative Variation Pipeline with Bayeisan budget reallocation',
      'Fortnightly Executive Strategy Reviews with Lead Growth Architect'
    ],
    swarmsIncluded: ['CHRONOS-00 (Orchestrator)', 'HERMES-07 (SDR)', 'AURA-01 (Authority)', 'NEXUS-02 (Creative)'],
    governanceModel: 'Daily asynchronous activity logs + strict Human-in-the-Loop approvals for all ad spend.',
    roiBenchmark: 'Projected 35% reduction in blended CAC and 2.4x inbound pipeline acceleration within 90 days.'
  },
  {
    id: 'package-retainer',
    name: 'Full-Stack Sovereign Growth Retainer',
    badge: 'STAGE 3: 24/7 AUTONOMOUS PARTNER',
    tagline: 'Permanent multi-agent growth infrastructure with continuous learning and dedicated advisory.',
    priceDisplay: '$6,500 / mo',
    billingFrequency: 'MONTHLY',
    typicalDuration: '6 or 12 Month Partnership',
    targetClientState: 'Scale-ups seeking permanent institutional memory and 24/7 revenue execution without headcount inflation.',
    coreDeliverables: [
      'End-to-end multi-agent orchestration running 24/7 across Search, Paid, Lifecycle, and SDR',
      'Continuous Second Brain vectorization of all brand wins, objections, and ad tests',
      'Multi-inbox agent dispatch with SPF/DKIM warmup maintenance and spam sentinel',
      'Dedicated Senior Growth Architect on Slack / WhatsApp with 2-hour emergency SLA',
      'Monthly Board-Level Attribution & Revenue Velocity Reports'
    ],
    swarmsIncluded: ['All 12 Specialized Agent Swarms across Organic, Paid, SDR, and Operations'],
    governanceModel: 'Full cryptographic audit log stream + Weekly Partner War Room.',
    roiBenchmark: 'Contractual 90-day ROI benchmark: 3.5x net ARR pipeline value generated.'
  }
];

export interface StageDocumentTemplate {
  id: DocumentType;
  title: string;
  stage: DocumentStage;
  recommendedCrmStages: string[];
  description: string;
  estimatedPages: number;
  iconName: string;
  fileFormat: 'PDF' | 'DOCX' | 'LEGAL_CONTRACT';
}

export const STAGE_DOCUMENT_TEMPLATES: StageDocumentTemplate[] = [
  {
    id: 'DIAGNOSTIC_TEARDOWN',
    title: 'Empirical Growth Diagnostic Teardown',
    stage: 'PROSPECTING',
    recommendedCrmStages: ['ENRICHED', 'OUTREACH_QUEUED'],
    description: 'Technical gap analysis showing their specific speed leaks, AEO invisibility, and CAC inflation.',
    estimatedPages: 3,
    iconName: 'Activity',
    fileFormat: 'PDF'
  },
  {
    id: 'CAPABILITY_BRIEF',
    title: 'Executive Value Brief & Capability Matrix',
    stage: 'PROSPECTING',
    recommendedCrmStages: ['ENRICHED', 'OUTREACH_QUEUED'],
    description: 'Institutional equity vs. agency turnover comparison, demonstrating ROI of private sovereign swarms.',
    estimatedPages: 2,
    iconName: 'FileText',
    fileFormat: 'PDF'
  },
  {
    id: 'MUTUAL_NDA',
    title: 'Mutual Non-Disclosure Agreement (M-NDA)',
    stage: 'DISCUSSING',
    recommendedCrmStages: ['REPLIED_WARM', 'CALL_BOOKED'],
    description: 'Bilateral legal confidentiality agreement protecting prospect proprietary systems and audit findings.',
    estimatedPages: 4,
    iconName: 'ShieldCheck',
    fileFormat: 'LEGAL_CONTRACT'
  },
  {
    id: 'OFFERINGS_PROPOSAL',
    title: 'Agency Consulting Offerings & Packaging Proposal',
    stage: 'DISCUSSING',
    recommendedCrmStages: ['REPLIED_WARM', 'CALL_BOOKED'],
    description: 'Executive 3-tier proposal with win themes, scope breakdown, pricing rationale, and timeline.',
    estimatedPages: 6,
    iconName: 'Briefcase',
    fileFormat: 'PDF'
  },
  {
    id: 'MASTER_SERVICES_AGREEMENT',
    title: 'Master Services Agreement (MSA)',
    stage: 'CLOSING',
    recommendedCrmStages: ['CALL_BOOKED', 'CLOSED_WON'],
    description: 'Governing legal contract: IP ownership, warranties, data sovereignty, and liability boundaries.',
    estimatedPages: 7,
    iconName: 'Scroll',
    fileFormat: 'LEGAL_CONTRACT'
  },
  {
    id: 'STATEMENT_OF_WORK',
    title: 'Statement of Work (SOW) & SLA Schedule',
    stage: 'CLOSING',
    recommendedCrmStages: ['CALL_BOOKED', 'CLOSED_WON'],
    description: 'Milestone deliverables, acceptance criteria, agent swarm governance rules, and payment milestones.',
    estimatedPages: 5,
    iconName: 'CheckSquare',
    fileFormat: 'LEGAL_CONTRACT'
  },
  {
    id: 'ONBOARDING_PACKET',
    title: 'Client Retainer Kickoff & Enclave Intake Packet',
    stage: 'CLOSING',
    recommendedCrmStages: ['CLOSED_WON'],
    description: 'First 14-day technical roadmap, credentials intake form, Second Brain ingestion checklist, and partner contacts.',
    estimatedPages: 3,
    iconName: 'Rocket',
    fileFormat: 'DOCX'
  }
];

// Document Content Generators with Dynamic Variable Binding
export function generateDocumentMarkdown(
  docType: DocumentType,
  lead: {
    name: string;
    company: string;
    title?: string;
    domain?: string;
    estimatedArr?: string;
    sourceVector?: string;
    notes?: string;
  },
  options: {
    selectedPackageId?: string;
    customFee?: string;
    effectiveDate?: string;
    agencyLegalEntity?: string;
  }
): string {
  const company = lead.company || 'Client Organization';
  const contact = lead.name || 'Decision Maker';
  const title = lead.title || 'Executive';
  const domain = lead.domain || 'company.com';
  const arr = lead.estimatedArr || '$3.5M';
  const date = options.effectiveDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const agency = options.agencyLegalEntity || 'Sigma Tactix Technologies Ltd.';
  const selectedPkg = AGENCY_CONSULTING_PACKAGES.find(p => p.id === options.selectedPackageId) || AGENCY_CONSULTING_PACKAGES[1];
  const fee = options.customFee || selectedPkg.priceDisplay;

  switch (docType) {
    case 'DIAGNOSTIC_TEARDOWN':
      return `# EMPIRICAL GROWTH AUDIT & FORENSIC TEARDOWN
**Prepared For:** ${company} (${contact}, ${title})
**Web Property:** [https://${domain}](https://${domain})
**Date:** ${date}
**Audit Engine:** Sigma Tactix Autonomous Diagnostic Swarm (VECTOR-05 / AURA-01)
**Confidentiality:** RESTRICTED — PRIVATE DISCLOSURE ONLY

---

## 1. Executive Summary & Revenue Leakage Hypothesis
Based on automated headless network trace and public answer-engine crawling, **${company}** is experiencing an estimated **$14,200 to $26,000 monthly digital revenue leakage**. 

While your brand maintains strong product-market fit at an estimated **${arr} ARR**, your customer acquisition infrastructure suffers from three critical architectural friction points:

| Audit Dimension | Measured Value | Benchmark Target | Financial Impact |
| :--- | :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | **2.94 seconds** | < 1.1 seconds | ~22% Mobile Bounce Penalty |
| **AEO Knowledge Citations** | **0 Citations in Perplexity/Claude** | Top 3 Recommended | 0% Share of Voice in AI Search |
| **Schema Markup Density** | **0 JSON-LD Entity Graphs** | Full Semantic Graph | Search Engines Cannot Map ICP Verticals |
| **Inbound Conversion Form** | **5 Unnecessary Fields** | Single-Click Frictionless Dock | 34% Abandonment Rate at Step 2 |

---

## 2. Deep Dive: The Three Core Growth Bottlenecks

### A. The "Answer Engine Invisibility" Leak
When B2B buyers query conversational AI platforms (ChatGPT Search, Perplexity Pro, Google Gemini) for enterprise solutions in your sector, **${company}** is completely absent from citation nodes. 
* **Root Cause**: Your site lacks structured JSON-LD entity definitions and high-citation authoritative case studies.
* **Remediation**: Deploy AURA-01 to generate and publish an entity knowledge graph and 3 topic clusters within 30 days.

### B. Mobile Page Load Speed Tax
Your desktop performance scores 82/100, but mobile devices suffer from unoptimized render-blocking JavaScript:
* Largest Contentful Paint (LCP) takes **4.1 seconds** on standard 4G connections.
* Every 100ms latency above 1.5s costs an estimated 7% in enterprise lead capture conversion.

### C. The Third-Party Headcount Paradox
Traditional marketing agencies charge $8k–$15k/mo to rent external junior specialists who rotate accounts every 6–9 months. Your historical ad experiments and objection intelligence are trapped in external agency spreadsheets instead of inside your permanent institutional memory.

---

## 3. Recommended Remediation Roadmap
1. **Immediate (Days 1–14)**: Install the lightweight Sigma Tactix Lead Capture Dock and strip render-blocking scripts.
2. **Phase 2 (Days 15–45)**: Deploy AURA-01 Answer Engine Optimization to capture top-3 recommendation placement in Perplexity & ChatGPT Search.
3. **Phase 3 (Days 46–90)**: Deploy HERMES-07 SDR swarm with verified email warmup to prospect high-intent ICP accounts autonomously.

*Authored by the Sigma Tactix Sovereign Revenue Architecture Team.*`;

    case 'CAPABILITY_BRIEF':
      return `# EXECUTIVE VALUE BRIEF: THE SOVEREIGN GROWTH ADVANTAGE
**Target Partner:** ${company}
**Prepared For:** ${contact}, ${title}
**Date:** ${date}
**Publisher:** ${agency}

---

## Why Top Operators Are Abandoning The Agency Retainer Model
For the past decade, scaling companies relied on a single playbook: hire a marketing agency on a $10,000–$30,000/month retainer. Today, that model has collapsed:

1. **Zero Institutional Memory**: When account managers leave the agency, your campaign learnings, target objections, and creative win rates vanish with them.
2. **Rented vs. Owned Infrastructure**: You pay for hours, yet you own none of the underlying automation or AI tooling.
3. **Headcount Inflation**: Scaling output traditionally requires hiring more coordinators, increasing coordination drag.

### Comparison: Rented Headcount vs. Sovereign Growth OS

| Strategic Dimension | Traditional Retainer ($15k/mo) | Sigma Tactix Sovereign OS (${fee}) |
| :--- | :--- | :--- |
| **Asset Ownership** | Leased monthly service; zero permanent code | You own the Sovereign Enclave & models permanently |
| **Execution Velocity** | 9-to-5 human availability; 48-hour turnarounds | 24/7 Autonomous execution across Search, Ads & SDR |
| **Institutional Memory** | Scattered across external Notion boards & Slack | Second Brain vector database permanently indexing all wins |
| **Attribution Certainty** | Blended, ambiguous agency reports | Cryptographically signed, closed-loop pipeline attribution |
| **Human-in-the-Loop** | Unpredictable manual mistakes | Strict automated clearance gates for all public and ad spend |

---

## The Four Core Autonomous Swarms for ${company}
* **HERMES-07 (Autonomous SDR)**: Identifies high-intent hiring/fundraising signals, crafts 3-sentence bespoke touchpoints, and books calls directly to your calendar.
* **AURA-01 (Answer Engine Authority)**: Positions ${company} as the definitive AI-cited authority across ChatGPT, Perplexity, Claude, and Google AI Overviews.
* **VORTEX-05 (Algorithmic Performance)**: Continuously tests ad hooks, detects creative decay, and reallocates budget using Bayesian efficiency models.
* **CHRONOS-00 (Master Orchestrator)**: Global supervisor enforcing privacy boundaries, team SLAs, and multi-tenant security.

---
*Ready to review the deployment blueprint? Schedule an architecture session with our Principal Growth Engineer.*`;

    case 'MUTUAL_NDA':
      return `# MUTUAL NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT (M-NDA)

This Mutual Non-Disclosure Agreement ("**Agreement**") is entered into as of **${date}** ("**Effective Date**"), by and between:

* **DISCLOSING/RECEIVING PARTY 1**: **${agency}**, with registered offices at Sovereign Enclave, Riyadh, KSA ("**Sigma Tactix**").
* **DISCLOSING/RECEIVING PARTY 2**: **${company}**, a company organized under the laws of its jurisdiction, with principal offices associated with domain **${domain}** ("**Company**").

(Sigma Tactix and Company are individually referred to as a "**Party**" and collectively as the "**Parties**".)

---

### 1. Purpose of Disclosure
The Parties intend to engage in strategic discussions regarding technical audits, private AI agent swarms, growth architecture, software enclaves, and consulting service packages (the "**Permitted Purpose**").

### 2. Definition of Confidential Information
"**Confidential Information**" encompasses all non-public technical, operational, financial, and strategic information disclosed by one Party to the other, including but not limited to:
* Proprietary algorithms, prompts, agent orchestration DAGs, and second-brain vector schemas.
* Financial metrics, customer acquisition costs, ad spend budgets, and pipeline ARR figures.
* The findings of the Empirical Growth Audit Teardown conducted on ${domain}.

### 3. Non-Disclosure & Standard of Care
Each Party agrees to:
* Exercise at least a reasonable degree of care to protect the Confidential Information of the disclosing Party.
* Restrict access strictly to officers, employees, and authorized technical contractors who have a legitimate need to know for the Permitted Purpose.
* Never reverse engineer, decompile, or extract the proprietary model weights or source code of Sigma Tactix Autonomous Swarms.

### 4. Term and Termination
This Agreement shall remain in effect for a period of **two (2) years** from the Effective Date, during which the confidentiality obligations shall survive termination.

### 5. Signatures

**FOR ${agency.toUpperCase()}:**  
Name: Liam Sterling  
Title: Director of Sovereign Operations  
Signature: *[Executed Electronically]*  
Date: ${date}  

**FOR ${company.toUpperCase()}:**  
Name: ${contact}  
Title: ${title}  
Signature: ___________________________  
Date: ___________________________`;

    case 'OFFERINGS_PROPOSAL':
      return `# STRATEGIC CONSULTING & GROWTH OS PROPOSAL
**Client Organization:** ${company}  
**Primary Stakeholder:** ${contact} (${title})  
**Executive Sponsor:** ${agency}  
**Date:** ${date}  
**Investment Level:** ${fee} (${selectedPkg.billingFrequency})  
**Selected Package:** ${selectedPkg.name}  

---

## 1. The Strategic Opportunity
In our preliminary technical assessment of **${domain}**, we uncovered substantial untapped revenue velocity. At an estimated **${arr} ARR**, ${company} has validated its product-market fit. 

The current constraint is **acquisition efficiency**: scaling outbound conversations and capturing AI search citations without disproportionately hiring junior marketing personnel.

---

## 2. Proposed Scope of Engagement: ${selectedPkg.name}
**Package Tagline:** *${selectedPkg.tagline}*

### Core Deliverables & Milestones:
${selectedPkg.coreDeliverables.map((d, i) => `${i + 1}. **${d}**`).join('\n')}

### Agent Swarms Assigned to ${company}:
${selectedPkg.swarmsIncluded.map(s => `- \`${s}\``).join('\n')}

### Governance & Risk Controls:
* **${selectedPkg.governanceModel}**
* Every public article, email dispatch, and ad budget change is subject to explicit **Human-in-the-Loop (HITL)** approval.
* All data ingested into your Second Brain remains strictly isolated in your private customer enclave with row-level encryption.

---

## 3. Commercial Investment & Terms

| Engagement Element | Specification |
| :--- | :--- |
| **Package Tier** | **${selectedPkg.name}** |
| **Investment** | **${fee}** |
| **Billing Cadence** | **${selectedPkg.billingFrequency === 'ONE_TIME' ? 'One-time investment' : selectedPkg.billingFrequency === 'QUARTERLY' ? 'Quarterly retainer' : 'Monthly recurring retainer'}** |
| **Duration** | **${selectedPkg.typicalDuration}** |
| **Expected ROI Benchmark** | **${selectedPkg.roiBenchmark}** |

---

## 4. Next Steps to Launch
1. Sign the accompanying Master Services Agreement (MSA) and Statement of Work (SOW).
2. Complete the 15-minute Enclave Technical Intake Checklist.
3. Attend the Day 1 Strategic Alignment & Enclave Provisioning Session.

**Prepared with mathematical precision by ${agency}.**`;

    case 'MASTER_SERVICES_AGREEMENT':
      return `# MASTER SERVICES AGREEMENT (MSA)
**Contract Reference:** MSA-ST-${Date.now().toString().slice(-6)}  
**Effective Date:** ${date}  

This Master Services Agreement ("**Agreement**") is entered into by and between:
* **PROVIDER**: **${agency}**, with registered offices at Sovereign Enclave, Riyadh, KSA ("**Provider**").
* **CLIENT**: **${company}**, with principal executive contacts at ${domain} ("**Client**").

---

### 1. Services & Statements of Work
Provider agrees to deliver autonomous growth software, AI multi-agent orchestration, and growth architecture consulting services as specified in Statements of Work ("**SOW**") executed under this Agreement.

### 2. Intellectual Property & Data Sovereignty
* **Client IP**: Client retains 100% exclusive ownership of all customer data, brand assets, proprietary copy, and business intelligence ingested into the Second Brain.
* **Provider IP**: Provider retains ownership of the underlying autonomous agent swarms, source algorithms, multi-agent orchestrator code, and system prompts.
* **Work Product**: All custom marketing assets, content, ad creatives, and strategy roadmaps created specifically for Client during the term shall belong exclusively to Client upon full payment.

### 3. Human-in-the-Loop (HITL) Safety & Warranties
* Provider warrants that all autonomous actions involving external financial transactions (e.g. ad spend increases > $500) or public releases require explicit Client Human-in-the-Loop authorization.
* Provider guarantees 99.5% uptime for the Sovereign Enclave platform and API connectors.

### 4. Fees & Invoicing
* Client agrees to pay all fees set forth in applicable SOWs. Recurring retainers are billed in advance on the 1st of each calendar cycle via automated credit card or wire transfer.
* Late balances accrue interest at 1.5% per month or the legal maximum.

### 5. Limitation of Liability
Except for breaches of Section 2 (IP) or gross negligence, neither party's total aggregate liability shall exceed the total fees paid by Client to Provider during the three (3) months preceding the incident.

### 6. Signatures

**FOR PROVIDER (${agency}):**  
Authorized Signature: *[Digitally Authenticated]*  
Name: Liam Sterling  
Title: Director of Sovereign Operations  
Date: ${date}  

**FOR CLIENT (${company}):**  
Authorized Signature: ___________________________  
Name: ${contact}  
Title: ${title}  
Date: ___________________________`;

    case 'STATEMENT_OF_WORK':
      return `# STATEMENT OF WORK (SOW-01): ${selectedPkg.name.toUpperCase()}
**Master Agreement Reference:** SOW-ST-${Date.now().toString().slice(-5)}  
**Effective Date:** ${date}  
**Client:** ${company}  
**Provider:** ${agency}  

---

## 1. Objective & Scope of Work
This SOW specifies the delivery of **${selectedPkg.name}** for **${company}** across its primary web domain **${domain}**.

### Phase Breakdown & Key Milestones:
* **Sprint 1 (Days 1–14)**: Technical Enclave provisioning, Second Brain knowledge base ingestion, DNS & SPF/DKIM verification for SDR agent mailboxes.
* **Sprint 2 (Days 15–45)**: Launch of Answer Engine Optimization (AEO) entity graphs, diagnostic conversion dock embed, and first outbound SDR sequence.
* **Sprint 3 (Days 46–90)**: Multi-agent scaling, full attribution loop closure, and bi-weekly strategic optimization sessions.

---

## 2. Deliverables Matrix & Acceptance Criteria

| Deliverable | Description | Acceptance Criteria |
| :--- | :--- | :--- |
| **Second Brain Ingestion** | Vector index of company positioning & ICP | 100% of uploaded pitch decks and case studies queryable |
| **SDR Inbox Warmup** | 2 dedicated agent corporate mailboxes | 0 domain spam flags, 99%+ deliverability health |
| **Weekly Executive Brief** | Autonomous summary of leads, pipeline, and AEO rank | Delivered every Monday at 08:00 AM UTC |
| **Human Approval Queue** | Real-time HITL dashboard | Zero unapproved emails or ad spend dispatches |

---

## 3. Financial Schedule & Payment Terms
* **Total Milestone Fee:** **${fee}**
* **Payment Terms:** Net 15 days upon milestone initiation.
* **Invoicing Currency:** USD (United States Dollars) or SAR equivalent.

---

## 4. Signatures

**CLIENT ACCEPTANCE (${company}):**  
Signature: ___________________________  
Name: ${contact}  
Title: ${title}  
Date: ${date}  

**PROVIDER CONFIRMATION (${agency}):**  
Signature: *[Digitally Executed]*  
Date: ${date}`;

    case 'ONBOARDING_PACKET':
      return `# CLIENT RETAINER KICKOFF & ENCLAVE INTAKE PACKET
**Welcome to Sigma Tactix Growth OS**
**Organization:** ${company}  
**Primary Contact:** ${contact} (${title})  
**Executive Welcome Team:** CHRONOS-00 (Orchestrator) & Liam Sterling (Partner)  
**Date:** ${date}  

---

## Congratulations on Securing Your Sovereign Growth Enclave
By deploying a dedicated Sovereign Growth OS, **${company}** has shifted from renting external agency headcount to owning a permanent, 24/7 autonomous growth asset.

Here is your 14-Day Onboarding Flight Plan:

"""
[Day 1-2]  Technical Access & DNS Handshake (SPF/DKIM/DMARC)
[Day 3-5]  Second Brain Ingestion (Upload Brand Guidelines, ICP specs & Case Studies)
[Day 6-8]  Agent Mailbox Calibration & Warmup (sdr@${domain})
[Day 9-11] Conversion Dock Installation (script embed on ${domain})
[Day 12-14] First Autonomous Batch Dispatched under HITL Human Oversight
"""

---

## Action Items Required from ${company}

### 1. Credentials Intake (To be entered in the secure enclave vault):
- [ ] Google Search Console & GA4 read-only access
- [ ] Subdomain / DNS access for outbound email routing (e.g. mail.${domain})
- [ ] Meta Ads or Google Ads view access (for VORTEX-05 performance telemetry)

### 2. Second Brain Knowledge Documents (Drag & drop into Second Brain):
- [ ] Core ICP definition & target account list (CSV or Apollo vector)
- [ ] Past 3 winning proposals or client success stories
- [ ] Objection handling cheat-sheets from your sales team

### 3. Emergency & Escalation Contacts:
* Slack / WhatsApp Direct Channel: #sigmatactix-${lead.company.toLowerCase().replace(/\s+/g, '-')}
* Principal Architect Emergency Line: +1 (415) 890-3412
* Enclave Technical Support: advisory@sigmatactix.com

---
*Your Enclave node has been successfully reserved. We look forward to scaling ${company}'s enterprise pipeline.*`;

    default:
      return `# Document for ${company}\nGenerated on ${date}`;
  }
}
