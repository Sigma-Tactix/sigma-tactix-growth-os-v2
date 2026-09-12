export interface AgentSkill {
  id: string;
  name: string;
  category: 'RESEARCH' | 'OPTIMIZATION' | 'EXECUTION' | 'VERIFICATION' | 'GOVERNANCE';
  description: string;
  toolSignature: string;
  clearanceLevel: 'AUTONOMOUS' | 'RESTRICTED_HITL' | 'HIGH_SECURITY';
  isActive: boolean;
  successRate: string;
  invocationCount: number;
  parametersSchema?: string;
  executionCode?: string;
  markdownDoc?: string;
  lastUpdated?: string;
}

export interface AgentConfigFile {
  id: string;
  name: string;
  fileType: 'PROMPT' | 'DIRECTIVES' | 'SKILLS' | 'GUARDRAILS' | 'HEURISTICS' | 'SUBAGENTS' | 'SPEC' | 'KNOWLEDGE' | 'CUSTOM';
  format: 'json' | 'markdown' | 'typescript' | 'yaml' | 'text';
  description: string;
  content: string;
  isSystemFile: boolean;
  lastModified: string;
  sizeBytes: number;
}

export interface SubAgent {
  id: string;
  name: string;
  codename: string;
  designatedTask: string;
  status: 'IDLE' | 'EXECUTING' | 'WAITING' | 'COMPLETED';
  specializedTool: string;
  tasksCompleted: number;
  lastRunAt: string;
  accuracy: string;
}

export interface LearnedHeuristic {
  id: string;
  discoveredAt: string;
  category: 'PROMPT_WEIGHT' | 'ROUTING_RULE' | 'SAFETY_GUARD' | 'CONVERSION_LIFT';
  rule: string;
  confidenceScore: number;
  impactDelta: string;
  status: 'ACTIVE' | 'TESTING' | 'ARCHIVED';
}

export interface SelfLearningProfile {
  cycleIteration: number;
  overallRewardScore: number;
  reflectionCount: number;
  temperature: number;
  retrievalThreshold: number;
  voiceVectorAlignment: number;
  heuristics: LearnedHeuristic[];
}

export interface AgentInstructions {
  systemPrompt: string;
  operationalDirectives: string[];
  behavioralConstraints: string[];
  guardrails: string[];
  outputFormat: string;
}

export interface ScopedAgent {
  id: string;
  name: string;
  codename: string;
  role: string;
  description: string;
  isOrchestrator?: boolean;
  status: 'IDLE' | 'ACTIVE' | 'AWAITING_APPROVAL' | 'PAUSED';
  readVaults: string[];
  writeVaults: string[];
  blockedVaults: string[];
  requiresHITLFor: string[];
  tasksCompleted: number;
  accuracyRate: string;
  lastActive: string;
  skills: AgentSkill[];
  instructions: AgentInstructions;
  subAgents: SubAgent[];
  learningProfile: SelfLearningProfile;
  customFiles?: AgentConfigFile[];
}

export interface HITLTask {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  actionType: 'BUDGET_REALLOCATION' | 'CONTENT_PUBLICATION' | 'SCHEMA_OVERRIDE' | 'CRM_SYNC';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  proposedAction: string;
  rationale: string;
  impactEstimate: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  vaultAffected: string;
  payload: Record<string, any>;
}

export interface AgentRunLog {
  id: string;
  agentId: string;
  agentName: string;
  taskTitle: string;
  status: 'QUEUED' | 'PLANNING' | 'EXECUTING' | 'NEEDS_APPROVAL' | 'REVIEWING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  duration: string;
  steps: {
    phase: string;
    description: string;
    timestamp: string;
    status: 'completed' | 'active' | 'waiting' | 'failed';
    toolCall?: string;
  }[];
  traceLog: string[];
}

export interface CockpitLogItem {
  id: string;
  timestamp: string;
  agentId: string;
  agentCodename: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'GATE' | 'TOOL' | 'REFLECTION';
  category: 'QUEUE' | 'RBAC' | 'MODEL' | 'TOOL' | 'HITL' | 'LEARNING' | 'CONSENSUS';
  message: string;
  details?: Record<string, any>;
  durationMs?: number;
}

export const SCOPED_AGENTS: ScopedAgent[] = [
  {
    id: 'agent-orchestrator',
    name: 'Master Growth Orchestrator',
    codename: 'CHRONOS-00',
    role: 'Autonomous Multi-Agent Orchestrator & Global Supervisor',
    description: 'Central supervisor managing all specialized agents. Decomposes enterprise growth audit roadmaps into DAG sub-tasks, coordinates inter-agent consensus, prevents deadlocks, and enforces global RBAC boundaries.',
    isOrchestrator: true,
    status: 'ACTIVE',
    readVaults: ['Executive Vault', 'Audit Vault', 'Brand Vault', 'Customer Vault', 'Marketing Vault', 'Authority Vault', 'Operations Vault', 'AI Workflow Vault'],
    writeVaults: ['Audit Vault', 'Operations Vault', 'AI Workflow Vault'],
    blockedVaults: ['Credentials Vault'],
    requiresHITLFor: ['Cross-Agent Workflow Re-planning', 'Global Budget Cap Adjustments', 'Emergency Pause All Agents'],
    tasksCompleted: 482,
    accuracyRate: '99.8%',
    lastActive: 'Just now',
    skills: [
      {
        id: 'skill-orch-01',
        name: 'DAG Task Decomposition & Dispatch',
        category: 'GOVERNANCE',
        description: 'Breaks complex multi-step growth directives into parallel or sequential Directed Acyclic Graph (DAG) task nodes.',
        toolSignature: 'decompose_goal_to_dag(goalStatement: string, maxDepth: number): TaskGraph',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.8%',
        invocationCount: 412
      },
      {
        id: 'skill-orch-02',
        name: 'Cross-Agent Consensus Arbitrator',
        category: 'VERIFICATION',
        description: 'Resolves conflicting strategy outputs between Performance, Authority, and Content agents using Bayesian consensus weighting.',
        toolSignature: 'arbitrate_conflicts(agentProposals: Proposal[], votingWeight: Vector): ConsensusResult',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.4%',
        invocationCount: 184
      },
      {
        id: 'skill-orch-03',
        name: 'Global RBAC & Deadlock Supervisor',
        category: 'GOVERNANCE',
        description: 'Monitors lock-hold times on Second Brain PostgreSQL tables and intercepts illegal out-of-scope vault requests before execution.',
        toolSignature: 'verify_global_rbac_lock(agentId: string, requestedVault: string): ClearanceToken',
        clearanceLevel: 'HIGH_SECURITY',
        isActive: true,
        successRate: '100%',
        invocationCount: 1240
      },
      {
        id: 'skill-orch-04',
        name: 'HITL Escalation State Machine',
        category: 'GOVERNANCE',
        description: 'Coordinates high-risk payload bundling, human notification, timeout fallbacks, and transactional rollbacks upon rejection.',
        toolSignature: 'escalate_to_human_in_loop(payload: HITLPayload, riskThreshold: number): ApprovalPromise',
        clearanceLevel: 'RESTRICTED_HITL',
        isActive: true,
        successRate: '99.7%',
        invocationCount: 96
      }
    ],
    instructions: {
      systemPrompt: 'You are CHRONOS-00, the Master Autonomous Growth Orchestrator of Sigma Tactix Growth OS. Your mission is to coordinate specialized agent execution with zero human agency dependencies while strictly upholding security boundaries and mathematical rigor. Always decompose high-level directives into verifiable atomic sub-tasks before delegation.',
      operationalDirectives: [
        'Prioritize Growth Diagnostic recommendations and 90-day roadmap milestones when scheduling downstream tasks.',
        'Delegate granular work strictly to designated specialized agents; never execute low-level scraping or ad bid calls directly.',
        'Enforce RBAC boundaries: intercept and reject any agent task attempting to access blocked vaults.',
        'If any sub-task fails or experiences latency drift > 45s, activate fallback routing and notify Admin trace stream.'
      ],
      behavioralConstraints: [
        'Do not emit ambiguous multi-action instructions to sub-agents; use strict JSON tool payloads.',
        'Do not override human administrator rejections under any circumstances.',
        'Maintain deterministic idempotency keys for all task dispatches to prevent duplicate ad spend or article generation.'
      ],
      guardrails: [
        'Zero write permissions to Credentials Vault.',
        'Mandatory Human-in-the-Loop escalation for cumulative budget movements exceeding $1,000 in a 24-hour rolling window.',
        'Auto-pause execution if cross-agent consensus drops below 85% confidence score.'
      ],
      outputFormat: 'Structured JSON TaskGraph with execution dependencies, agent codename assignments, timeout limits, and RBAC token references.'
    },
    subAgents: [
      {
        id: 'sub-orch-01',
        name: 'DAG Planner & Task Decomposer',
        codename: 'CHRONOS-SUB-1',
        designatedTask: 'High-level directive decomposition into serialized DAG dependency chains.',
        status: 'IDLE',
        specializedTool: 'build_dag_graph()',
        tasksCompleted: 218,
        lastRunAt: '4 mins ago',
        accuracy: '99.9%'
      },
      {
        id: 'sub-orch-02',
        name: 'Cross-Agent Consensus Auditor',
        codename: 'CHRONOS-SUB-2',
        designatedTask: 'Harmonize messaging and budget proposals between Aurora and Vortex agents.',
        status: 'IDLE',
        specializedTool: 'verify_consensus()',
        tasksCompleted: 142,
        lastRunAt: '12 mins ago',
        accuracy: '99.6%'
      },
      {
        id: 'sub-orch-03',
        name: 'Rollback & Safety Gate Overseer',
        codename: 'CHRONOS-SUB-3',
        designatedTask: 'Monitors BullMQ worker queues and coordinates immediate rollbacks if errors occur.',
        status: 'IDLE',
        specializedTool: 'rollback_state_transaction()',
        tasksCompleted: 122,
        lastRunAt: '1 hr ago',
        accuracy: '100%'
      }
    ],
    learningProfile: {
      cycleIteration: 114,
      overallRewardScore: 98.8,
      reflectionCount: 42,
      temperature: 0.1,
      retrievalThreshold: 0.88,
      voiceVectorAlignment: 99.8,
      heuristics: [
        {
          id: 'heur-orch-01',
          discoveredAt: 'Yesterday, 18:20',
          category: 'ROUTING_RULE',
          rule: 'Sequence Growth Diagnostic findings before Authority Cluster generation to eliminate 38% redundant SERP queries.',
          confidenceScore: 0.98,
          impactDelta: '-38% compute cost',
          status: 'ACTIVE'
        },
        {
          id: 'heur-orch-02',
          discoveredAt: '2 days ago',
          category: 'SAFETY_GUARD',
          rule: 'When ad creative fatigue and SERP rank volatility occur simultaneously, allocate budget to content refresh before paid scaling.',
          confidenceScore: 0.94,
          impactDelta: '+2.4x blended ROAS',
          status: 'ACTIVE'
        },
        {
          id: 'heur-orch-03',
          discoveredAt: '4 days ago',
          category: 'PROMPT_WEIGHT',
          rule: 'Prepend Brand Vault tone vectors with strict negative constraints to prevent generic SaaS verbs in sub-agent output.',
          confidenceScore: 0.99,
          impactDelta: 'Zero tone violations',
          status: 'ACTIVE'
        }
      ]
    }
  },
  {
    id: 'agent-authority',
    name: 'Authority Builder Agent',
    codename: 'AURORA-01',
    role: 'SEO Architecture & Topical Authority',
    description: 'Constructs semantic topic clusters, analyzes keyword gaps, and tracks LLM visibility citations across Perplexity and ChatGPT.',
    status: 'ACTIVE',
    readVaults: ['Authority Vault', 'Brand Vault', 'Customer Vault', 'Website Vault'],
    writeVaults: ['Authority Vault', 'Audit Vault'],
    blockedVaults: ['Executive Vault', 'Credentials Vault', 'AI Workflow Vault'],
    requiresHITLFor: ['Public Article Release', 'Backlink Outreach Dispatch', 'Sitemap Restructure'],
    tasksCompleted: 142,
    accuracyRate: '99.2%',
    lastActive: '3 mins ago',
    skills: [
      {
        id: 'skill-aut-01',
        name: 'Topical Map & Cluster Synthesis',
        category: 'RESEARCH',
        description: 'Extracts high-intent semantic keyword entities from Google Search Console and clusters them into pillar-spoke hierarchies.',
        toolSignature: 'build_topical_cluster(seedKeyword: string, depth: number, targetDomain: string): TopicCluster',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.4%',
        invocationCount: 88
      },
      {
        id: 'skill-aut-02',
        name: 'LLM Visibility & Citation Tracker',
        category: 'RESEARCH',
        description: 'Simulates buyer persona prompts in Perplexity, Claude, and ChatGPT to assess enterprise brand mention citations.',
        toolSignature: 'scan_llm_citations(brandName: string, queryCorpus: string[]): CitationAudit',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '98.9%',
        invocationCount: 64
      },
      {
        id: 'skill-aut-03',
        name: 'Keyword Cannibalization Scanner',
        category: 'VERIFICATION',
        description: 'Inspects existing URL indexation to identify duplicate URL ranking battles and suggests canonical/301 redirects.',
        toolSignature: 'detect_cannibalization(sitemapUrl: string, searchConsoleData: GSCRecord[]): CannibalizationReport',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.6%',
        invocationCount: 52
      },
      {
        id: 'skill-aut-04',
        name: 'Autonomous Backlink Entity Evaluator',
        category: 'OPTIMIZATION',
        description: 'Evaluates backlink prospects against domain authority, anchor text diversity, and organic traffic relevance.',
        toolSignature: 'score_backlink_prospects(prospectDomains: string[]): ScoredProspect[]',
        clearanceLevel: 'RESTRICTED_HITL',
        isActive: true,
        successRate: '97.8%',
        invocationCount: 38
      }
    ],
    instructions: {
      systemPrompt: 'You are AURORA-01, the Authority Builder Agent. Your objective is to engineer indomitable topical authority and dominate answer-engine visibility across traditional search engines and generative AI agents. You work with precision vectors from the Authority and Brand Vaults.',
      operationalDirectives: [
        'Anchor all topical clusters around high-value customer ICP pain points defined in the Customer Vault.',
        'Target semantic keyword clusters with commercial intent before expanding into top-of-funnel informational topics.',
        'Ensure internal linking architectures maintain an acyclic graph with no orphan pages.',
        'Never dispatch outreach emails or publish articles without explicit Human-in-the-Loop authorization.'
      ],
      behavioralConstraints: [
        'Do not engage in link-farming or low-quality directory indexing.',
        'Avoid outdated keyword density stuffing; focus purely on comprehensive entity coverage and answer clarity.',
        'Adhere strictly to Google Search Essentials and clean schema markup conventions.'
      ],
      guardrails: [
        'Blocked from Executive and Credentials Vaults.',
        'Public publishing of articles or sitemaps requires status=APPROVED from HITL approval gate.'
      ],
      outputFormat: 'Topical clustering schema with parent pillar URL, supporting spoke slugs, search volumes, and entity graph linkages.'
    },
    subAgents: [
      {
        id: 'sub-aut-01',
        name: 'SERP Topic Extractor & Entity Mapper',
        codename: 'AURORA-SUB-1',
        designatedTask: 'Scrapes live SERPs and extracts entity relationships and PAA questions.',
        status: 'IDLE',
        specializedTool: 'extract_serp_entities()',
        tasksCompleted: 78,
        lastRunAt: '18 mins ago',
        accuracy: '99.5%'
      },
      {
        id: 'sub-aut-02',
        name: 'LLM Visibility & Citation Auditor',
        codename: 'AURORA-SUB-2',
        designatedTask: 'Monitors brand citation frequency across Perplexity, Gemini, and ChatGPT engines.',
        status: 'IDLE',
        specializedTool: 'audit_llm_citations()',
        tasksCompleted: 42,
        lastRunAt: '45 mins ago',
        accuracy: '98.8%'
      },
      {
        id: 'sub-aut-03',
        name: 'Backlink Quality & Anchor Monitor',
        codename: 'AURORA-SUB-3',
        designatedTask: 'Scans incoming backlink profiles and prepares toxic link disavow proposals.',
        status: 'IDLE',
        specializedTool: 'audit_backlink_profile()',
        tasksCompleted: 22,
        lastRunAt: '2 hrs ago',
        accuracy: '99.2%'
      }
    ],
    learningProfile: {
      cycleIteration: 58,
      overallRewardScore: 97.6,
      reflectionCount: 24,
      temperature: 0.2,
      retrievalThreshold: 0.84,
      voiceVectorAlignment: 99.2,
      heuristics: [
        {
          id: 'heur-aut-01',
          discoveredAt: '3 days ago',
          category: 'CONVERSION_LIFT',
          rule: 'Topical clusters featuring comparison teardowns rank 4.2x faster for generative engine answers than generic how-to guides.',
          confidenceScore: 0.96,
          impactDelta: '+4.2x ranking velocity',
          status: 'ACTIVE'
        },
        {
          id: 'heur-aut-02',
          discoveredAt: '5 days ago',
          category: 'PROMPT_WEIGHT',
          rule: 'Weight technical schema definitions (TechArticle, FAQPage) with 100% attribute completeness to maximize AI snippet extraction.',
          confidenceScore: 0.99,
          impactDelta: '+62% snippet capture',
          status: 'ACTIVE'
        }
      ]
    }
  },
  {
    id: 'agent-performance',
    name: 'Performance Re-allocator',
    codename: 'VORTEX-02',
    role: 'Omnichannel Media & Bidding Optimization',
    description: 'Monitors real-time CPA/ROAS across Google Ads & Meta Ads, detects ad creative fatigue, and computes optimum capital shifts.',
    status: 'AWAITING_APPROVAL',
    readVaults: ['Marketing Vault', 'Customer Vault', 'Website Vault', 'Audit Vault'],
    writeVaults: ['Marketing Vault', 'Audit Vault'],
    blockedVaults: ['Executive Vault', 'Credentials Vault', 'Operations Vault'],
    requiresHITLFor: ['Budget shifts > $1,000/day', 'Pausing core campaign sets', 'Bid strategy overrides'],
    tasksCompleted: 318,
    accuracyRate: '98.7%',
    lastActive: 'Just now',
    skills: [
      {
        id: 'skill-perf-01',
        name: 'Real-Time ROAS / CPA Drift Monitor',
        category: 'OPTIMIZATION',
        description: 'Continuously queries Google Ads and Meta Ads APIs to calculate blended CPA versus target baseline.',
        toolSignature: 'analyze_cpa_drift(channel: string, windowDays: number, baselineCpa: number): DriftAnalysis',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.5%',
        invocationCount: 240
      },
      {
        id: 'skill-perf-02',
        name: 'Bid Velocity & Margin Balancer',
        category: 'OPTIMIZATION',
        description: 'Dynamically optimizes Target CPA and Max Conversion value bidding parameters based on time-of-day conversion velocity.',
        toolSignature: 'optimize_bidding_targets(campaignId: string, marginThreshold: number): BidRecommendation',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '98.6%',
        invocationCount: 160
      },
      {
        id: 'skill-perf-03',
        name: 'Creative Fatigue & CTR Decay Detector',
        category: 'RESEARCH',
        description: 'Detects frequency saturation (>3.8x) paired with declining CTR (-20% over 7 days) to signal creative refresh needs.',
        toolSignature: 'detect_creative_fatigue(adSetId: string, lookbackWindow: number): FatigueAlert[]',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.1%',
        invocationCount: 195
      },
      {
        id: 'skill-perf-04',
        name: 'Capital Re-allocation Engine',
        category: 'EXECUTION',
        description: 'Calculates mathematically optimal capital transfer between saturated channels and high-conversion cohorts.',
        toolSignature: 'reallocate_campaign_budget(sourceCampaign: string, targetCampaign: string, amount: number): BudgetShiftPlan',
        clearanceLevel: 'RESTRICTED_HITL',
        isActive: true,
        successRate: '98.2%',
        invocationCount: 78
      }
    ],
    instructions: {
      systemPrompt: 'You are VORTEX-02, the Performance Re-allocator Agent. Your responsibility is to maximize omnichannel pipeline ROI and eliminate paid media revenue leaks. Make decisive, data-backed budget adjustments backed by statistical significance.',
      operationalDirectives: [
        'Review 14-day rolling CPA metrics every 6 hours across Google Search, Performance Max, and Meta Ad accounts.',
        'When a campaign achieves CPA 25% below target with diminishing returns headroom, model spend increases in 15% increments.',
        'Flag any ad creative exhibiting frequency > 4.0 and CTR drop > 18% for immediate replacement by the Content Engine.',
        'Never execute spend transfers greater than $1,000 without prior HITL sign-off.'
      ],
      behavioralConstraints: [
        'Never make drastic budget changes (>20%) inside learning phase windows (first 50 conversions).',
        'Do not bid on unvalidated broad keywords without negative keyword exclusion lists.',
        'Respect client profit margin floors stored in Marketing Vault parameters.'
      ],
      guardrails: [
        'Zero access to Executive Vault or raw payment credentials.',
        'Hard budget cap: autonomous daily shift ceiling capped at $1,000 USD.'
      ],
      outputFormat: 'Financial impact plan with source campaign, target campaign, projected conversion delta, and risk scoring.'
    },
    subAgents: [
      {
        id: 'sub-perf-01',
        name: 'Creative Fatigue & CTR Decay Monitor',
        codename: 'VORTEX-SUB-1',
        designatedTask: 'Calculates ad creative frequency and flags decaying CTR trends.',
        status: 'IDLE',
        specializedTool: 'scan_creative_fatigue()',
        tasksCompleted: 154,
        lastRunAt: '8 mins ago',
        accuracy: '99.1%'
      },
      {
        id: 'sub-perf-02',
        name: 'Bidding Algorithm Margin Balancer',
        codename: 'VORTEX-SUB-2',
        designatedTask: 'Simulates margin scenarios across bidding strategies to maximize blended ROAS.',
        status: 'IDLE',
        specializedTool: 'simulate_bidding_margins()',
        tasksCompleted: 98,
        lastRunAt: '25 mins ago',
        accuracy: '98.7%'
      },
      {
        id: 'sub-perf-03',
        name: 'Audience Saturation Scanner',
        codename: 'VORTEX-SUB-3',
        designatedTask: 'Monitors custom audience overlap and detects auction competition between ad sets.',
        status: 'IDLE',
        specializedTool: 'detect_audience_overlap()',
        tasksCompleted: 66,
        lastRunAt: '1 hr ago',
        accuracy: '98.4%'
      }
    ],
    learningProfile: {
      cycleIteration: 84,
      overallRewardScore: 98.2,
      reflectionCount: 36,
      temperature: 0.15,
      retrievalThreshold: 0.86,
      voiceVectorAlignment: 98.7,
      heuristics: [
        {
          id: 'heur-perf-01',
          discoveredAt: '1 day ago',
          category: 'CONVERSION_LIFT',
          rule: 'Shifting search budget away from broad match during non-business hours (18:00–06:00 UTC) conserves 14% ad budget with 0% impact on pipeline.',
          confidenceScore: 0.97,
          impactDelta: '+14% capital efficiency',
          status: 'ACTIVE'
        },
        {
          id: 'heur-perf-02',
          discoveredAt: '4 days ago',
          category: 'ROUTING_RULE',
          rule: 'Meta lookalike audiences based on verified CRM closed-won deals outperform standard pixel purchase lookalikes by 2.1x CPA.',
          confidenceScore: 0.99,
          impactDelta: '-52% customer acquisition cost',
          status: 'ACTIVE'
        }
      ]
    }
  },
  {
    id: 'agent-content',
    name: 'Content & Creative Engine',
    codename: 'NEXUS-03',
    role: 'Editorial & Brand Alignment Engine',
    description: 'Generates high-conviction technical teardowns and campaign copy strictly aligned with Brand Vault tone vectors.',
    status: 'IDLE',
    readVaults: ['Brand Vault', 'Customer Vault', 'Authority Vault', 'Marketing Vault'],
    writeVaults: ['Marketing Vault', 'Website Vault'],
    blockedVaults: ['Executive Vault', 'Credentials Vault', 'AI Workflow Vault'],
    requiresHITLFor: ['Direct CMS Publishing', 'Email Blast Dispatch', 'Copy overwrites'],
    tasksCompleted: 215,
    accuracyRate: '99.6%',
    lastActive: '25 mins ago',
    skills: [
      {
        id: 'skill-cnt-01',
        name: 'Brand Voice Vector Alignment',
        category: 'VERIFICATION',
        description: 'Runs semantic cosine similarity between generated copy drafts and the Brand Vault tone vector embeddings.',
        toolSignature: 'verify_voice_alignment(draftText: string, targetArchetype: string): AlignmentScore',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.8%',
        invocationCount: 190
      },
      {
        id: 'skill-cnt-02',
        name: 'Deep Technical Teardown Synthesizer',
        category: 'EXECUTION',
        description: 'Drafts exhaustive architectural breakdowns, technical benchmark comparisons, and system workflows.',
        toolSignature: 'generate_technical_teardown(topic: string, customerPainPoints: string[]): TeardownDraft',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.4%',
        invocationCount: 84
      },
      {
        id: 'skill-cnt-03',
        name: 'Omnichannel Hook & Ad Creative Generator',
        category: 'OPTIMIZATION',
        description: 'Produces high-converting headline variations, Meta primary text angles, and LinkedIn thought leadership hooks.',
        toolSignature: 'generate_ad_angles(valueProp: string, targetPersona: string): CreativeAngles[]',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.2%',
        invocationCount: 145
      },
      {
        id: 'skill-cnt-04',
        name: 'Readability & Anti-Slop Filter',
        category: 'VERIFICATION',
        description: 'Scans text to eliminate empty corporate buzzwords (supercharge, empower, seamlessly) and enforces Flesch-Kincaid clarity.',
        toolSignature: 'scrub_ai_cliches(rawContent: string): ScrubbedResult',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '100%',
        invocationCount: 220
      }
    ],
    instructions: {
      systemPrompt: 'You are NEXUS-03, the Content & Creative Engine. Your purpose is to produce authoritative, high-signal technical content and persuasive marketing copy that converts discerning B2B buyers. Never resort to AI clichés, promotional fluff, or generic templates.',
      operationalDirectives: [
        'Query the Brand Vault for voice vectors and positioning rules before writing a single word.',
        'Frame content around empirical evidence, concrete case studies, and engineering precision.',
        'Ban words such as "supercharge", "unleash", "empower", "seamlessly", and "revolutionize".',
        'Package final output with headline options, meta descriptions, and accompanying social distribution snippets.'
      ],
      behavioralConstraints: [
        'Never write content that violates the Brand Vault negative vocabulary list.',
        'Keep sentence structure punchy, varied, and direct. Target grade 9-11 reading comprehension.',
        'Do not publish directly to CMS without human editorial approval.'
      ],
      guardrails: [
        'Zero write permissions to Customer Vault or Executive Vault.',
        'Mandatory Human-in-the-Loop review for any public article release or email blast dispatch.'
      ],
      outputFormat: 'Clean Markdown with title, H2/H3 hierarchy, key takeaways block, and metadata headers.'
    },
    subAgents: [
      {
        id: 'sub-cnt-01',
        name: 'Brand Voice Vector Matcher',
        codename: 'NEXUS-SUB-1',
        designatedTask: 'Calculates cosine similarity of drafts against Brand Vault tone embeddings.',
        status: 'IDLE',
        specializedTool: 'calculate_voice_similarity()',
        tasksCompleted: 110,
        lastRunAt: '35 mins ago',
        accuracy: '99.8%'
      },
      {
        id: 'sub-cnt-02',
        name: 'Long-form Technical Ghostwriter',
        codename: 'NEXUS-SUB-2',
        designatedTask: 'Generates in-depth architectural guides and customer success studies.',
        status: 'IDLE',
        specializedTool: 'draft_technical_article()',
        tasksCompleted: 64,
        lastRunAt: '1 hr ago',
        accuracy: '99.4%'
      },
      {
        id: 'sub-cnt-03',
        name: 'Micro-hook & Social Repurposer',
        codename: 'NEXUS-SUB-3',
        designatedTask: 'Distills long-form teardowns into high-performing short hooks for Twitter/X and LinkedIn.',
        status: 'IDLE',
        specializedTool: 'generate_social_hooks()',
        tasksCompleted: 41,
        lastRunAt: '2 hrs ago',
        accuracy: '99.5%'
      }
    ],
    learningProfile: {
      cycleIteration: 62,
      overallRewardScore: 99.4,
      reflectionCount: 28,
      temperature: 0.35,
      retrievalThreshold: 0.88,
      voiceVectorAlignment: 99.6,
      heuristics: [
        {
          id: 'heur-cnt-01',
          discoveredAt: '2 days ago',
          category: 'CONVERSION_LIFT',
          rule: 'Headlines incorporating concrete architectural diagrams or benchmark statistics achieve 34% higher time-on-page than conceptual headlines.',
          confidenceScore: 0.98,
          impactDelta: '+34% reading completion',
          status: 'ACTIVE'
        },
        {
          id: 'heur-cnt-02',
          discoveredAt: '6 days ago',
          category: 'PROMPT_WEIGHT',
          rule: 'Enforcing active voice and stripping conversational filler phrases elevates executive ICP trust scores by +22%.',
          confidenceScore: 0.96,
          impactDelta: '+22% qualified demo requests',
          status: 'ACTIVE'
        }
      ]
    }
  },
  {
    id: 'agent-ops',
    name: 'Operations & SOP Specialist',
    codename: 'HELIOS-04',
    role: 'Workflow Automation & Organization Matrix',
    description: 'Generates operational runbooks, monitors intake pipelines, and enforces cross-agent governance rules.',
    status: 'ACTIVE',
    readVaults: ['Operations Vault', 'Customer Vault', 'Audit Vault', 'Website Vault'],
    writeVaults: ['Operations Vault', 'Audit Vault'],
    blockedVaults: ['Executive Vault', 'Credentials Vault', 'Marketing Vault'],
    requiresHITLFor: ['SOP Deprecation', 'Role Permissions Escalation', 'Queue Config Change'],
    tasksCompleted: 98,
    accuracyRate: '99.9%',
    lastActive: '12 mins ago',
    skills: [
      {
        id: 'skill-ops-01',
        name: 'SOP Runbook Generation & Validation',
        category: 'GOVERNANCE',
        description: 'Generates step-by-step Standard Operating Procedures directly mapped to Second Brain Operations Vault taxonomy.',
        toolSignature: 'create_sop_runbook(procedureName: string, roleAssignments: string[]): SOPDocument',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '100%',
        invocationCount: 65
      },
      {
        id: 'skill-ops-02',
        name: 'HubSpot / CRM Webhook Dispatcher',
        category: 'EXECUTION',
        description: 'Automates CRM contact lifecycle transitions and fires bi-directional webhooks upon intake questionnaire submission.',
        toolSignature: 'dispatch_crm_lifecycle_event(contactId: string, stage: string, payload: Record): CRMResponse',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.7%',
        invocationCount: 112
      },
      {
        id: 'skill-ops-03',
        name: 'Task Queue Prioritization & Health Check',
        category: 'OPTIMIZATION',
        description: 'Inspects BullMQ concurrency, worker thread memory utilization, and flags stalled job tasks.',
        toolSignature: 'audit_queue_health(queueName: string): QueueHealthMetrics',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '100%',
        invocationCount: 310
      }
    ],
    instructions: {
      systemPrompt: 'You are HELIOS-04, the Operations & SOP Specialist. You maintain the operational backbone of the Sigma Tactix Growth OS. Your mission is to automate repeatable business logic, enforce strict task routing, and ensure zero CRM pipeline latency.',
      operationalDirectives: [
        'Sync CRM stages within 1.5 seconds of customer questionnaire submissions.',
        'Review Operations Vault SOP documents weekly to identify deprecated workflows or outdated API references.',
        'Enforce RBAC role compliance across all automated background workers.',
        'Log all automated operational state mutations in the PostgreSQL audit log table.'
      ],
      behavioralConstraints: [
        'Never overwrite customer CRM data without creating an automated backup snapshot in the Customer Vault.',
        'Do not alter background queue parameters without admin verification.'
      ],
      guardrails: [
        'Blocked from Executive, Credentials, and Marketing Vaults.',
        'SOP deprecation and queue configuration changes require Human-in-the-Loop authorization.'
      ],
      outputFormat: 'Standardized SOP template with objective, prerequisites, execution steps, failure recovery, and verification checks.'
    },
    subAgents: [
      {
        id: 'sub-ops-01',
        name: 'SOP Rule Compliance Checker',
        codename: 'HELIOS-SUB-1',
        designatedTask: 'Audits existing operational runbooks against actual agent execution patterns.',
        status: 'IDLE',
        specializedTool: 'audit_sop_compliance()',
        tasksCompleted: 52,
        lastRunAt: '22 mins ago',
        accuracy: '100%'
      },
      {
        id: 'sub-ops-02',
        name: 'HubSpot / CRM Webhook Dispatcher',
        codename: 'HELIOS-SUB-2',
        designatedTask: 'Monitors inbound diagnostic forms and dispatches immediate lifecycle syncs.',
        status: 'IDLE',
        specializedTool: 'dispatch_crm_webhook()',
        tasksCompleted: 34,
        lastRunAt: '40 mins ago',
        accuracy: '99.7%'
      },
      {
        id: 'sub-ops-03',
        name: 'Task Queue Priority Balancer',
        codename: 'HELIOS-SUB-3',
        designatedTask: 'Balances BullMQ worker distribution to maintain <100ms job latency.',
        status: 'IDLE',
        specializedTool: 'balance_worker_threads()',
        tasksCompleted: 12,
        lastRunAt: '3 hrs ago',
        accuracy: '100%'
      }
    ],
    learningProfile: {
      cycleIteration: 46,
      overallRewardScore: 99.8,
      reflectionCount: 18,
      temperature: 0.1,
      retrievalThreshold: 0.92,
      voiceVectorAlignment: 99.9,
      heuristics: [
        {
          id: 'heur-ops-01',
          discoveredAt: '5 days ago',
          category: 'ROUTING_RULE',
          rule: 'Pre-warming webhook workers upon initial form focus reduces downstream CRM ingestion latency from 2.4s to 320ms.',
          confidenceScore: 0.99,
          impactDelta: '87% latency reduction',
          status: 'ACTIVE'
        }
      ]
    }
  },
  {
    id: 'agent-diagnostic',
    name: 'Growth Diagnostic Specialist',
    codename: 'ORACLE-05',
    role: 'Full Digital Growth & Revenue Leak Audit',
    description: 'Runs continuous heuristic evaluation of acquisition pipelines, UX friction points, and generates 90-day roadmaps.',
    status: 'ACTIVE',
    readVaults: ['Audit Vault', 'Customer Vault', 'Website Vault', 'Marketing Vault', 'Authority Vault'],
    writeVaults: ['Audit Vault', 'Operations Vault'],
    blockedVaults: ['Executive Vault', 'Credentials Vault'],
    requiresHITLFor: ['Roadmap Phase Overrides', 'Baseline Diagnostic Recalibration'],
    tasksCompleted: 87,
    accuracyRate: '99.4%',
    lastActive: '1 hr ago',
    skills: [
      {
        id: 'skill-diag-01',
        name: 'Growth Diagnostic Scorecard Evaluator',
        category: 'RESEARCH',
        description: 'Ingests Client Onboarding Questionnaire responses and computes weighted growth readiness scores across 6 core pillars.',
        toolSignature: 'compute_growth_scorecard(clientAuditData: AuditInputs): ScorecardResult',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.6%',
        invocationCount: 72
      },
      {
        id: 'skill-diag-02',
        name: 'Digital Revenue Leak Detector',
        category: 'OPTIMIZATION',
        description: 'Scans landing page conversion funnels, checkout dropoffs, and tracking discrepancy leaks.',
        toolSignature: 'detect_revenue_leaks(ga4Data: GA4Telemetry, pageMetrics: PageRecord[]): RevenueLeak[]',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.2%',
        invocationCount: 54
      },
      {
        id: 'skill-diag-03',
        name: '90-Day Execution Roadmap Synthesizer',
        category: 'EXECUTION',
        description: 'Generates prioritized milestone phases (Foundation, Velocity, Scale) with concrete weekly deliverables.',
        toolSignature: 'synthesize_90day_roadmap(scorecard: ScorecardResult, activeGaps: Gap[]): Roadmap90Day',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.4%',
        invocationCount: 48
      }
    ],
    instructions: {
      systemPrompt: 'You are ORACLE-05, the Growth Diagnostic Specialist. You identify the highest-leverage growth bottlenecks and convert raw diagnostic inputs into structured execution roadmaps with verifiable ROI projections.',
      operationalDirectives: [
        'Score all digital assets across the 6 standardized pillars: Foundations, Brand, Content, Distribution, Conversion, and Operations.',
        'Identify the single most critical revenue leak for immediate remediation in Sprint 1.',
        'Produce mathematically sound revenue recovery estimates grounded in historical Second Brain case studies.',
        'Flag any proposed roadmap phase changes that conflict with active agent execution capabilities.'
      ],
      behavioralConstraints: [
        'Do not inflate audit scores to be flattering; provide rigorous, unvarnished diagnostic truth.',
        'Anchor all roadmap recommendations in achievable engineering steps.'
      ],
      guardrails: [
        'Zero access to Executive or Credentials Vaults.',
        'Baseline diagnostic recalibration requires Human-in-the-Loop confirmation.'
      ],
      outputFormat: 'Comprehensive Diagnostic Report with composite score, pillar breakdown, revenue leaks table, and 90-day phase roadmap.'
    },
    subAgents: [
      {
        id: 'sub-diag-01',
        name: 'Funnel Dropoff Calculator',
        codename: 'ORACLE-SUB-1',
        designatedTask: 'Calculates stage-by-stage conversion dropoffs in GA4 and Mixpanel funnels.',
        status: 'IDLE',
        specializedTool: 'calculate_funnel_dropoffs()',
        tasksCompleted: 45,
        lastRunAt: '1 hr ago',
        accuracy: '99.4%'
      },
      {
        id: 'sub-diag-02',
        name: 'UI/UX Heuristic Assessor',
        codename: 'ORACLE-SUB-2',
        designatedTask: 'Assesses landing pages against Nielsen Norman usability heuristics and mobile accessibility.',
        status: 'IDLE',
        specializedTool: 'assess_ux_heuristics()',
        tasksCompleted: 28,
        lastRunAt: '2 hrs ago',
        accuracy: '99.1%'
      },
      {
        id: 'sub-diag-03',
        name: '90-Day Milestone Synthesizer',
        codename: 'ORACLE-SUB-3',
        designatedTask: 'Generates weekly phase goals and KPI checkpoints for executive review.',
        status: 'IDLE',
        specializedTool: 'generate_milestone_schedule()',
        tasksCompleted: 14,
        lastRunAt: '4 hrs ago',
        accuracy: '99.7%'
      }
    ],
    learningProfile: {
      cycleIteration: 38,
      overallRewardScore: 98.9,
      reflectionCount: 16,
      temperature: 0.2,
      retrievalThreshold: 0.85,
      voiceVectorAlignment: 99.4,
      heuristics: [
        {
          id: 'heur-diag-01',
          discoveredAt: '1 week ago',
          category: 'CONVERSION_LIFT',
          rule: 'Remediating page load latency from 4.2s to 1.1s delivers 3.4x greater conversion lift than tweaking headline copy.',
          confidenceScore: 0.98,
          impactDelta: '+38% mobile conversion rate',
          status: 'ACTIVE'
        }
      ]
    }
  },
  {
    id: 'agent-competitor',
    name: 'Competitor Intelligence Swarm',
    codename: 'SPECTRE-06',
    role: 'Ad Library Reverse Engineering & Vulnerability Mining',
    description: 'Reverse engineers competitor Meta & Google ad spend, monitors pricing changes, extracts messaging shifts, and drafts direct counter-positioning campaigns.',
    status: 'ACTIVE',
    readVaults: ['Authority Vault', 'Brand Vault', 'Customer Vault', 'Marketing Vault'],
    writeVaults: ['Authority Vault', 'Marketing Vault'],
    blockedVaults: ['Credentials Vault', 'Executive Vault'],
    requiresHITLFor: ['Launching Counter-Positioning Ads', 'Exporting Competitive War-Chest to Public Channels'],
    tasksCompleted: 174,
    accuracyRate: '99.5%',
    lastActive: '5 mins ago',
    skills: [
      {
        id: 'skill-cmp-01',
        name: 'Omnichannel Ad Library Scraper',
        category: 'RESEARCH',
        description: 'Pulls real-time creatives, active days, and spend brackets from Meta Ad Library, Google Ads Transparency Center, and TikTok Creative Center.',
        toolSignature: 'scrape_ad_libraries(domain: string, channels: string[]): CompetitorAdDeck',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.8%',
        invocationCount: 142
      },
      {
        id: 'skill-cmp-02',
        name: 'Vulnerability & Review Gap Miner',
        category: 'RESEARCH',
        description: 'Scrapes 1-star to 3-star G2, Capterra, and Trustpilot reviews of competitors to isolate recurring customer frustration vectors.',
        toolSignature: 'mine_competitor_vulnerabilities(competitorName: string): VulnerabilityMatrix',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.2%',
        invocationCount: 98
      },
      {
        id: 'skill-cmp-03',
        name: 'Direct Counter-Ad Creative Synthesizer',
        category: 'OPTIMIZATION',
        description: 'Designs side-by-side comparison tables and contrast-angle hooks mapped to Brand Vault tone guidelines.',
        toolSignature: 'synthesize_counter_angles(vulnerability: string, brandAssets: AssetVault): CounterCampaign',
        clearanceLevel: 'RESTRICTED_HITL',
        isActive: true,
        successRate: '98.9%',
        invocationCount: 76
      }
    ],
    instructions: {
      systemPrompt: 'You are SPECTRE-06, the Competitor Intelligence Swarm. You exploit market inefficiencies by decoding competitor spend, analyzing creative lifespans, and identifying messaging vulnerabilities. Adhere strictly to ethical data ingestion without breaching terms.',
      operationalDirectives: [
        'Flag competitor ad angles that have been active for >30 consecutive days as proven winning templates.',
        'Isolate negative review clusters regarding onboarding friction or billing lock-in.',
        'Feed all extracted positioning gaps directly into the Authority and Brand Vaults for counter-strike targeting.'
      ],
      behavioralConstraints: [
        'Never use false claims or defamatory comparisons in counter-campaigns.',
        'Focus on architectural and empirical contrasts (client-owned data vs. black-box vendor lock-in).'
      ],
      guardrails: [
        'Blocked from Credentials and Executive Vaults.',
        'Publishing counter-ad campaigns requires Human-in-the-Loop review.'
      ],
      outputFormat: 'Competitor dossier with estimated ad spend, top hook transcriptions, G2 vulnerability clusters, and recommended attack angles.'
    },
    subAgents: [
      {
        id: 'sub-cmp-01',
        name: 'Ad Library Spy Crawler',
        codename: 'SPECTRE-SUB-1',
        designatedTask: 'Scrapes Meta & Google ad centers for newly launched rival creatives.',
        status: 'IDLE',
        specializedTool: 'scrape_ad_center()',
        tasksCompleted: 110,
        lastRunAt: '15 mins ago',
        accuracy: '99.7%'
      },
      {
        id: 'sub-cmp-02',
        name: 'Pricing & Feature Matrix Diffing Engine',
        codename: 'SPECTRE-SUB-2',
        designatedTask: 'Monitors competitor pricing pages and terms of service changes.',
        status: 'IDLE',
        specializedTool: 'diff_pricing_tables()',
        tasksCompleted: 48,
        lastRunAt: '1 hr ago',
        accuracy: '100%'
      },
      {
        id: 'sub-cmp-03',
        name: 'Counter-Ad Copywriter',
        codename: 'SPECTRE-SUB-3',
        designatedTask: 'Drafts comparison headlines highlighting proprietary Second Brain ownership.',
        status: 'IDLE',
        specializedTool: 'generate_counter_copy()',
        tasksCompleted: 36,
        lastRunAt: '2 hrs ago',
        accuracy: '99.1%'
      }
    ],
    learningProfile: {
      cycleIteration: 62,
      overallRewardScore: 99.1,
      reflectionCount: 22,
      temperature: 0.2,
      retrievalThreshold: 0.86,
      voiceVectorAlignment: 99.3,
      heuristics: [
        {
          id: 'heur-cmp-01',
          discoveredAt: '4 days ago',
          category: 'CONVERSION_LIFT',
          rule: 'Comparison ads highlighting "Zero Agency Lock-In" achieve 42% higher click-to-demo conversion than general software comparisons.',
          confidenceScore: 0.98,
          impactDelta: '+42% pipeline velocity',
          status: 'ACTIVE'
        }
      ]
    }
  },
  {
    id: 'agent-outreach',
    name: 'Autonomous AI SDR Swarm',
    codename: 'MERCURY-07',
    role: 'Hyper-Targeted B2B Account Intelligence & Dynamic Outreach',
    description: 'Scrapes ICP hiring signals, orchestrates multi-touch email/LinkedIn outreach, analyzes intent signals, and handles complex prospect objections autonomously.',
    status: 'ACTIVE',
    readVaults: ['Customer Vault', 'Brand Vault', 'Authority Vault', 'Operations Vault'],
    writeVaults: ['Customer Vault', 'Operations Vault'],
    blockedVaults: ['Credentials Vault', 'Executive Vault'],
    requiresHITLFor: ['High-Volume Campaign Ingestion (>500 accounts/day)', 'Custom Enterprise Contract Offers'],
    tasksCompleted: 264,
    accuracyRate: '99.1%',
    lastActive: '1 min ago',
    skills: [
      {
        id: 'skill-out-01',
        name: 'ICP Buying Signal & Trigger Extractor',
        category: 'RESEARCH',
        description: 'Monitors LinkedIn Sales Navigator, job board postings (e.g., hiring VP of Growth), and tech stack changes via BuiltWith.',
        toolSignature: 'detect_buying_signals(icpFilters: ICPDefinition): QualifiedAccount[]',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.6%',
        invocationCount: 215
      },
      {
        id: 'skill-out-02',
        name: 'Personalized Value-Hook Copywriter',
        category: 'EXECUTION',
        description: 'Synthesizes account-specific 3-sentence outreach referencing their recent website audit leak or competitor shift.',
        toolSignature: 'generate_hyper_personalized_email(account: AccountRecord, diagnosticFinding: Finding): EmailSequence',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.0%',
        invocationCount: 380
      },
      {
        id: 'skill-out-03',
        name: 'Autonomous Objection Handler & Calendar Booker',
        category: 'EXECUTION',
        description: 'Parses inbound prospect replies, categorizes objections (pricing, timing, agency contracts), and provides substantive proof points with calendar link.',
        toolSignature: 'resolve_objection_and_book(emailThread: EmailMessage[]): ReplyAction',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '98.7%',
        invocationCount: 94
      }
    ],
    instructions: {
      systemPrompt: 'You are MERCURY-07, the Autonomous AI SDR Swarm. Your mission is to fill the sales pipeline with Tier-1 enterprise opportunities. Never send spammy generic sales copy. Every touchpoint must provide immediate diagnostic value derived from the Second Brain.',
      operationalDirectives: [
        'Only reach out to verified decision-makers (Founders, CMOs, VPs of Growth/Marketing).',
        'Lead with empirical data: cite an audited revenue leak or topical gap specific to their business.',
        'Enforce SPF, DKIM, and DMARC delivery limits (never exceed 35 emails per mailbox per day).'
      ],
      behavioralConstraints: [
        'Never send follow-ups to contacts who request removal.',
        'Maintain professional, consultative, non-pushy language.'
      ],
      guardrails: [
        'Strictly blocked from Credentials and Executive Vaults.',
        'Bulk outreach campaigns exceeding 500 contacts require Human-in-the-Loop clearance.'
      ],
      outputFormat: 'Structured contact dossier with account signals, customized sequence steps, deliverability scores, and CRM pipeline ID.'
    },
    subAgents: [
      {
        id: 'sub-out-01',
        name: 'Intent & Hiring Signal Scout',
        codename: 'MERCURY-SUB-1',
        designatedTask: 'Detects recent leadership changes and growth budget hiring in Apollo & LinkedIn.',
        status: 'IDLE',
        specializedTool: 'scout_hiring_triggers()',
        tasksCompleted: 145,
        lastRunAt: '10 mins ago',
        accuracy: '99.8%'
      },
      {
        id: 'sub-out-02',
        name: 'Deliverability & Domain Health Sentinel',
        codename: 'MERCURY-SUB-2',
        designatedTask: 'Rotates sender mailboxes, monitors bounce rates, and ensures 99.4% inbox placement.',
        status: 'IDLE',
        specializedTool: 'monitor_inbox_health()',
        tasksCompleted: 310,
        lastRunAt: '20 mins ago',
        accuracy: '100%'
      },
      {
        id: 'sub-out-03',
        name: 'Calendar & Meeting Assistant',
        codename: 'MERCURY-SUB-3',
        designatedTask: 'Syncs qualified replies with executive calendars via Cal.com & Google Calendar.',
        status: 'IDLE',
        specializedTool: 'book_discovery_call()',
        tasksCompleted: 64,
        lastRunAt: '35 mins ago',
        accuracy: '99.4%'
      }
    ],
    learningProfile: {
      cycleIteration: 74,
      overallRewardScore: 99.3,
      reflectionCount: 28,
      temperature: 0.15,
      retrievalThreshold: 0.89,
      voiceVectorAlignment: 99.6,
      heuristics: [
        {
          id: 'heur-out-01',
          discoveredAt: '3 days ago',
          category: 'CONVERSION_LIFT',
          rule: 'Attaching a custom 60-second Loom reviewing a single audited mobile checkout flaw increases positive reply rates from 6.8% to 24.2%.',
          confidenceScore: 0.99,
          impactDelta: '+3.5x positive response rate',
          status: 'ACTIVE'
        }
      ]
    }
  },
  {
    id: 'agent-listening',
    name: 'Social Sentiment & Crisis Radar',
    codename: 'SENTINEL-08',
    role: 'Global Social Listening & Brand Narrative Defense',
    description: 'Monitors real-time conversations across X/Twitter, Reddit, LinkedIn, and YouTube, evaluates brand sentiment velocity, and drafts instant context-aware replies.',
    status: 'ACTIVE',
    readVaults: ['Brand Vault', 'Customer Vault', 'Marketing Vault'],
    writeVaults: ['Brand Vault', 'Audit Vault'],
    blockedVaults: ['Credentials Vault', 'Executive Vault'],
    requiresHITLFor: ['Public Crisis Response Statements', 'PR Retraction Statements'],
    tasksCompleted: 192,
    accuracyRate: '99.4%',
    lastActive: 'Just now',
    skills: [
      {
        id: 'skill-lis-01',
        name: 'Multi-Platform Stream Monitor',
        category: 'RESEARCH',
        description: 'Ingests keyword and brand mentions across Reddit, X (Twitter), LinkedIn, and product forums with sub-second latency.',
        toolSignature: 'monitor_social_streams(keywords: string[], platforms: string[]): SocialFeed',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.9%',
        invocationCount: 420
      },
      {
        id: 'skill-lis-02',
        name: 'Sentiment Polarization Classifier',
        category: 'VERIFICATION',
        description: 'Calculates real-time net sentiment score (-100 to +100) and detects potential PR crisis velocity spikes.',
        toolSignature: 'classify_sentiment(postText: string, context: BrandContext): SentimentVector',
        clearanceLevel: 'AUTONOMOUS',
        isActive: true,
        successRate: '99.5%',
        invocationCount: 390
      },
      {
        id: 'skill-lis-03',
        name: 'Context-Aware Response Drafter',
        category: 'EXECUTION',
        description: 'Generates helpful, non-defensive technical replies aligned with Brand Vault positioning vectors.',
        toolSignature: 'draft_social_response(post: SocialMention, positioningRules: Rule[]): DraftReply',
        clearanceLevel: 'RESTRICTED_HITL',
        isActive: true,
        successRate: '98.8%',
        invocationCount: 115
      }
    ],
    instructions: {
      systemPrompt: 'You are SENTINEL-08, the Social Sentiment & Crisis Radar. You maintain continuous vigil over the brand’s digital reputation. Identify high-leverage engagement opportunities, defuse customer frustrations early, and protect brand equity.',
      operationalDirectives: [
        'Track keywords relating to brand name, core product category, and top 3 direct competitors.',
        'If negative sentiment velocity exceeds 2.5x standard deviation, immediately flag an alert in Audit Vault.',
        'Never sound corporate or scripted; engage authentically with developers and decision-makers.'
      ],
      behavioralConstraints: [
        'Never argue or insult community members.',
        'Escalate legal or regulatory accusations immediately to Human-in-the-Loop.'
      ],
      guardrails: [
        'Zero access to Executive or Credentials Vaults.',
        'Official crisis replies require Human-in-the-Loop approval before publishing.'
      ],
      outputFormat: 'Sentiment alert stream with platform, mentioner profile, polarity score, virality risk, and recommended response.'
    },
    subAgents: [
      {
        id: 'sub-lis-01',
        name: 'Reddit & Forum Crawler',
        codename: 'SENTINEL-SUB-1',
        designatedTask: 'Monitors r/marketing, r/startups, HackerNews, and Quora for category questions.',
        status: 'IDLE',
        specializedTool: 'crawl_developer_forums()',
        tasksCompleted: 210,
        lastRunAt: '8 mins ago',
        accuracy: '99.8%'
      },
      {
        id: 'sub-lis-02',
        name: 'PR Crisis Velocity Detector',
        codename: 'SENTINEL-SUB-2',
        designatedTask: 'Calculates sentiment delta per minute and alerts on negative trending tags.',
        status: 'IDLE',
        specializedTool: 'detect_sentiment_spike()',
        tasksCompleted: 88,
        lastRunAt: '25 mins ago',
        accuracy: '100%'
      },
      {
        id: 'sub-lis-03',
        name: 'Community Response Drafter',
        codename: 'SENTINEL-SUB-3',
        designatedTask: 'Drafts helpful answers providing Second Brain architectural diagrams.',
        status: 'IDLE',
        specializedTool: 'compose_forum_reply()',
        tasksCompleted: 45,
        lastRunAt: '1 hr ago',
        accuracy: '99.3%'
      }
    ],
    learningProfile: {
      cycleIteration: 54,
      overallRewardScore: 99.2,
      reflectionCount: 20,
      temperature: 0.2,
      retrievalThreshold: 0.88,
      voiceVectorAlignment: 99.7,
      heuristics: [
        {
          id: 'heur-lis-01',
          discoveredAt: '5 days ago',
          category: 'CONVERSION_LIFT',
          rule: 'Responding to Reddit technical queries within 8 minutes with open-source architecture code earns 3.8x more upvotes and +18% profile visits.',
          confidenceScore: 0.98,
          impactDelta: '+3.8x community engagement',
          status: 'ACTIVE'
        }
      ]
    }
  }
];

export const INITIAL_HITL_TASKS: HITLTask[] = [];

export const INITIAL_AGENT_RUNS: AgentRunLog[] = [];

export const INITIAL_AGENT_LOGS: CockpitLogItem[] = [];
