import { SECOND_BRAIN_VAULTS } from './secondBrainVaults';
import { SCOPED_AGENTS } from './agentCockpitData';
import { DIAGNOSTIC_CATEGORIES } from './growthDiagnosticsData';

export type SystemElementType = 
  | 'CORE' 
  | 'VAULT' 
  | 'FILE' 
  | 'AGENT' 
  | 'PIPELINE' 
  | 'AUDIT';

export interface SystemDependency {
  sourceId: string;
  targetId: string;
  type: 'INGESTS_TO' | 'STORES_FILE' | 'READS_VAULT' | 'EXECUTES_AGENT' | 'GOVERNS' | 'FEEDS_ROADMAP' | 'HITL_GATE';
  label: string;
  strength: number; // 0.1 to 1.0 for visual glow
}

export interface SystemElementNode {
  id: string;
  name: string;
  shortName: string;
  type: SystemElementType;
  category: string;
  description: string;
  status: 'OPTIMAL' | 'SYNCING' | 'ATTENTION' | 'ACTIVE';
  healthScore: number; // 0 - 100
  securityZone?: string;
  sizeOrVolume: string;
  latencyOrCycle: string;
  accessCount24h: number;
  lastUpdated: string;
  dependencies: string[]; // IDs this node depends on (upstream)
  dependents: string[];   // IDs that depend on this node (downstream)
  linkUrl: string;
  color: string;
  orbitRadius: number;    // Orbital distance from center
  angle?: number;         // Angle in radians
  depth?: number;         // Z-depth for 3D illusion
  metadata?: Record<string, any>;
}

// Generate the complete unified registry of system elements created across the Growth OS
export function getLivingSystemGraph(): { nodes: SystemElementNode[]; dependencies: SystemDependency[] } {
  const nodes: SystemElementNode[] = [];
  const dependencies: SystemDependency[] = [];

  // 1. THE CENTRAL LIVING SECOND BRAIN NUCLEUS
  nodes.push({
    id: 'second-brain-core',
    name: 'Second Brain Knowledge Core',
    shortName: 'BRAIN CORE',
    type: 'CORE',
    category: 'Central Intelligence Hub',
    description: 'The master relational and vector knowledge nucleus connecting all vaults, agents, and execution layers.',
    status: 'OPTIMAL',
    healthScore: 99.8,
    securityZone: 'ZONE_MASTER_KERNEL',
    sizeOrVolume: '10 Vaults • 48 Records',
    latencyOrCycle: '4.2ms avg retrieval',
    accessCount24h: 3420,
    lastUpdated: 'Live Active',
    dependencies: [],
    dependents: [
      'executive-vault', 'credentials-vault', 'brand-vault', 'customer-vault', 
      'marketing-vault', 'website-vault', 'authority-vault', 'operations-vault', 
      'ai-workflow-vault', 'audit-vault', 'sigma-orchestrator'
    ],
    linkUrl: '/vaults',
    color: '#FF6B00',
    orbitRadius: 0
  });

  // 2. THE 10 SECOND BRAIN VAULTS (Inner Orbit Ring 1)
  const vaultColors: Record<string, string> = {
    'executive-vault': '#F59E0B',
    'credentials-vault': '#EF4444',
    'brand-vault': '#EC4899',
    'customer-vault': '#8B5CF6',
    'marketing-vault': '#3B82F6',
    'website-vault': '#06B6D4',
    'authority-vault': '#10B981',
    'operations-vault': '#6366F1',
    'ai-workflow-vault': '#F97316',
    'audit-vault': '#EAB308'
  };

  SECOND_BRAIN_VAULTS.forEach((vault, idx) => {
    const angle = (idx / SECOND_BRAIN_VAULTS.length) * Math.PI * 2;
    const vId = vault.id;
    
    // Dependencies & dependents for this vault
    const upstream = ['second-brain-core'];
    const downstream: string[] = [];

    // Map which agents read this vault
    if (vId === 'executive-vault') downstream.push('sigma-orchestrator');
    if (vId === 'brand-vault') downstream.push('content-agent');
    if (vId === 'marketing-vault') downstream.push('perf-marketing-agent');
    if (vId === 'customer-vault') downstream.push('lead-gen-agent', 'perf-marketing-agent');
    if (vId === 'authority-vault') downstream.push('content-agent');
    if (vId === 'operations-vault') downstream.push('operations-agent');
    if (vId === 'ai-workflow-vault') downstream.push('sigma-orchestrator');
    if (vId === 'audit-vault') downstream.push('growth-diagnostic-audit', 'sigma-orchestrator');

    nodes.push({
      id: vId,
      name: vault.name,
      shortName: vault.name.replace(' Vault', ''),
      type: 'VAULT',
      category: `Zone: ${vault.securityZone}`,
      description: vault.description,
      status: vId === 'credentials-vault' ? 'OPTIMAL' : 'OPTIMAL',
      healthScore: 95 + (idx % 5),
      securityZone: vault.securityZone,
      sizeOrVolume: `${vault.recordCount} Records`,
      latencyOrCycle: 'AES-256 Encrypted',
      accessCount24h: 120 + idx * 45,
      lastUpdated: '12m ago',
      dependencies: upstream,
      dependents: downstream,
      linkUrl: `/vaults?id=${vault.id}`,
      color: vaultColors[vId] || '#FFA500',
      orbitRadius: 140,
      angle
    });

    // Core -> Vault dependency
    dependencies.push({
      sourceId: 'second-brain-core',
      targetId: vId,
      type: 'INGESTS_TO',
      label: 'Relational Shard',
      strength: 0.9
    });
  });

  // 3. FILES IN SECOND BRAIN & AGENT SPECIFICATIONS (Middle Orbit Ring 2)
  const systemFiles = [
    {
      id: 'file-brand-matrix',
      name: 'brand_voice_matrix.json',
      vaultId: 'brand-vault',
      agentId: 'content-agent',
      desc: 'Vectorized brand tone, style bounds, and vocabulary guidelines.',
      size: '14.2 KB',
      tokens: '~3,400',
      color: '#EC4899'
    },
    {
      id: 'file-icp-personas',
      name: 'icp_tier1_enterprise.json',
      vaultId: 'customer-vault',
      agentId: 'lead-gen-agent',
      desc: 'Target account firmographics, decision-maker profiles, and pain points.',
      size: '28.6 KB',
      tokens: '~6,800',
      color: '#8B5CF6'
    },
    {
      id: 'file-topical-map',
      name: 'topical_map_seo.json',
      vaultId: 'authority-vault',
      agentId: 'content-agent',
      desc: 'High-intent keyword clusters, semantic entities, and backlink targets.',
      size: '42.1 KB',
      tokens: '~9,200',
      color: '#10B981'
    },
    {
      id: 'file-campaign-metrics',
      name: 'ad_campaign_benchmarks.json',
      vaultId: 'marketing-vault',
      agentId: 'perf-marketing-agent',
      desc: 'CPA, ROAS, and creative fatigue benchmarks across Google & Meta Ads.',
      size: '18.4 KB',
      tokens: '~4,100',
      color: '#3B82F6'
    },
    {
      id: 'file-internal-sop',
      name: 'sop_ops_execution.md',
      vaultId: 'operations-vault',
      agentId: 'operations-agent',
      desc: 'Standard operating procedures for asynchronous team handoffs.',
      size: '11.8 KB',
      tokens: '~2,900',
      color: '#6366F1'
    },
    {
      id: 'file-system-prompts',
      name: 'SYSTEM_PROMPT.md',
      vaultId: 'ai-workflow-vault',
      agentId: 'sigma-orchestrator',
      desc: 'Master orchestrator meta-prompts, task decomposition, and routing.',
      size: '16.5 KB',
      tokens: '~4,200',
      color: '#F97316'
    },
    {
      id: 'file-skills-catalog',
      name: 'SKILLS.json (MCP Tools)',
      vaultId: 'ai-workflow-vault',
      agentId: 'content-agent',
      desc: 'Declarative MCP tool interfaces, clearance tiers, and schemas.',
      size: '34.0 KB',
      tokens: '~8,100',
      color: '#F59E0B'
    },
    {
      id: 'file-guardrails',
      name: 'GUARDRAILS.json',
      vaultId: 'credentials-vault',
      agentId: 'sigma-orchestrator',
      desc: 'Negative constraints, blocked vaults, and mandatory HITL thresholds.',
      size: '9.4 KB',
      tokens: '~2,100',
      color: '#EF4444'
    },
    {
      id: 'file-diagnostic-audit',
      name: 'growth_diagnostic_audit.json',
      vaultId: 'audit-vault',
      agentId: 'growth-diagnostic-audit',
      desc: 'Audit scores (78/100), digital leak points, and UI/UX friction reports.',
      size: '22.3 KB',
      tokens: '~5,400',
      color: '#EAB308'
    },
    {
      id: 'file-heuristics-data',
      name: 'HEURISTICS_DATA.json',
      vaultId: 'ai-workflow-vault',
      agentId: 'operations-agent',
      desc: 'Distilled reinforcement heuristics learned from human feedback.',
      size: '15.1 KB',
      tokens: '~3,600',
      color: '#10B981'
    }
  ];

  systemFiles.forEach((file, idx) => {
    const angle = (idx / systemFiles.length) * Math.PI * 2 + 0.3;
    nodes.push({
      id: file.id,
      name: file.name,
      shortName: file.name.split('.')[0],
      type: 'FILE',
      category: `Stored in ${file.vaultId}`,
      description: file.desc,
      status: 'OPTIMAL',
      healthScore: 98,
      sizeOrVolume: file.size,
      latencyOrCycle: file.tokens,
      accessCount24h: 310 + idx * 80,
      lastUpdated: '1h ago',
      dependencies: [file.vaultId],
      dependents: [file.agentId],
      linkUrl: `/agents`,
      color: file.color,
      orbitRadius: 240,
      angle
    });

    // Vault -> File dependency
    dependencies.push({
      sourceId: file.vaultId,
      targetId: file.id,
      type: 'STORES_FILE',
      label: 'Contains File',
      strength: 0.7
    });

    // File -> Agent dependency
    dependencies.push({
      sourceId: file.id,
      targetId: file.agentId,
      type: 'EXECUTES_AGENT',
      label: 'Provides Context',
      strength: 0.8
    });
  });

  // 4. SCOPED AI AGENTS (Outer Orbit Ring 3)
  const agentColors: Record<string, string> = {
    'sigma-orchestrator': '#F59E0B',
    'content-agent': '#EC4899',
    'perf-marketing-agent': '#3B82F6',
    'lead-gen-agent': '#8B5CF6',
    'operations-agent': '#6366F1'
  };

  SCOPED_AGENTS.forEach((agent, idx) => {
    const angle = (idx / SCOPED_AGENTS.length) * Math.PI * 2 + 0.6;
    const aId = agent.id;

    const downstream: string[] = ['hitl-approval-queue'];
    if (agent.isOrchestrator) {
      downstream.push('content-agent', 'perf-marketing-agent', 'lead-gen-agent', 'operations-agent');
    }

    nodes.push({
      id: aId,
      name: agent.name,
      shortName: agent.codename,
      type: 'AGENT',
      category: agent.isOrchestrator ? 'Master DAG Orchestrator' : 'Specialized Worker Agent',
      description: agent.description,
      status: agent.status === 'IDLE' ? 'ACTIVE' : 'ACTIVE',
      healthScore: parseInt(agent.accuracyRate) || 98,
      securityZone: agent.requiresHITLFor.length > 0 ? 'HITL_GOVERNED' : 'AUTONOMOUS_ZONE',
      sizeOrVolume: `${agent.skills.length} Skills • ${agent.subAgents.length} Sub-agents`,
      latencyOrCycle: `${agent.tasksCompleted} completed tasks`,
      accessCount24h: 840 + idx * 120,
      lastUpdated: 'Active Runtime',
      dependencies: ['second-brain-core', ...agent.readVaults],
      dependents: downstream,
      linkUrl: `/agents`,
      color: agentColors[aId] || '#F59E0B',
      orbitRadius: 340,
      angle
    });

    // Vault -> Agent RBAC read connections
    agent.readVaults.forEach(rv => {
      dependencies.push({
        sourceId: rv,
        targetId: aId,
        type: 'READS_VAULT',
        label: 'RBAC Read',
        strength: 0.85
      });
    });

    // Orchestrator coordinates specialized agents
    if (!agent.isOrchestrator) {
      dependencies.push({
        sourceId: 'sigma-orchestrator',
        targetId: aId,
        type: 'EXECUTES_AGENT',
        label: 'Dispatches DAG Task',
        strength: 0.95
      });
    }

    // Agents feed into HITL approval queue
    dependencies.push({
      sourceId: aId,
      targetId: 'hitl-approval-queue',
      type: 'HITL_GATE',
      label: 'Submits for Approval',
      strength: 0.75
    });
  });

  // 5. DATA INTAKE & CONNECTORS (External Satellite Ingestion Ring 4)
  const connectors = [
    { id: 'connector-hubspot', name: 'HubSpot CRM Pipeline', targetVault: 'customer-vault', desc: 'Syncs lead lifecycle, deal pipelines, and client feedback.', color: '#FF7A59' },
    { id: 'connector-ga4', name: 'Google Analytics 4', targetVault: 'website-vault', desc: 'Real-time conversion events, drop-off funnels, and landing pages.', color: '#F9AB00' },
    { id: 'connector-gsc', name: 'Google Search Console', targetVault: 'authority-vault', desc: 'Search queries, impressions, CTR, and indexing status.', color: '#4285F4' },
    { id: 'connector-meta-ads', name: 'Meta Ads Marketing API', targetVault: 'marketing-vault', desc: 'Campaign spend, creative metrics, ROAS, and frequency data.', color: '#0668E1' },
    { id: 'connector-google-ads', name: 'Google Ads API', targetVault: 'marketing-vault', desc: 'Search and Performance Max bids, CTR, quality scores.', color: '#34A853' },
    { id: 'connector-directus', name: 'Directus CMS Engine', targetVault: 'operations-vault', desc: 'Headless content schema, editorial workflow states.', color: '#6644FF' },
    { id: 'connector-pgvector', name: 'PostgreSQL pgvector', targetVault: 'second-brain-core', desc: 'High-dimensional embedding store with HNSW index.', color: '#336791' }
  ];

  connectors.forEach((conn, idx) => {
    const angle = (idx / connectors.length) * Math.PI * 2 + 1.1;
    nodes.push({
      id: conn.id,
      name: conn.name,
      shortName: conn.name.split(' ')[0],
      type: 'PIPELINE',
      category: 'External Data Connector',
      description: conn.desc,
      status: 'OPTIMAL',
      healthScore: 99,
      sizeOrVolume: 'Webhooks & REST APIs',
      latencyOrCycle: 'Syncs every 15m',
      accessCount24h: 1840 + idx * 210,
      lastUpdated: '3m ago',
      dependencies: [],
      dependents: [conn.targetVault],
      linkUrl: `/sources`,
      color: conn.color,
      orbitRadius: 430,
      angle
    });

    // Connector -> Vault
    dependencies.push({
      sourceId: conn.id,
      targetId: conn.targetVault,
      type: 'INGESTS_TO',
      label: 'Ingests Data Stream',
      strength: 0.9
    });
  });

  // 6. GOVERNANCE, AUDITS & ROADMAPS (Outer Execution Nodes)
  nodes.push({
    id: 'growth-diagnostic-audit',
    name: 'Growth Diagnostic Engine',
    shortName: 'DIAGNOSTICS',
    type: 'AUDIT',
    category: 'Systemic Health & Leak Detection',
    description: 'Systemic score 78/100 identifying acquisition, CRO, and retention revenue leaks.',
    status: 'ATTENTION',
    healthScore: 78,
    sizeOrVolume: '6 Diagnostic Categories',
    latencyOrCycle: '$46.2k/mo leak identified',
    accessCount24h: 540,
    lastUpdated: '2h ago',
    dependencies: ['audit-vault', 'website-vault', 'marketing-vault'],
    dependents: ['roadmap-90-days'],
    linkUrl: '/diagnostics',
    color: '#F59E0B',
    orbitRadius: 380,
    angle: 0.1
  });

  nodes.push({
    id: 'roadmap-90-days',
    name: '90-Day Execution Roadmap',
    shortName: '90-DAY ROADMAP',
    type: 'AUDIT',
    category: 'Strategic Milestones',
    description: 'Autonomous execution roadmap across Foundation, Acceleration, and Autonomy phases.',
    status: 'OPTIMAL',
    healthScore: 92,
    sizeOrVolume: '3 Phases • 9 Milestones',
    latencyOrCycle: 'Day 24 of 90',
    accessCount24h: 620,
    lastUpdated: 'Today',
    dependencies: ['growth-diagnostic-audit', 'sigma-orchestrator'],
    dependents: ['content-agent', 'perf-marketing-agent'],
    linkUrl: '/diagnostics',
    color: '#10B981',
    orbitRadius: 410,
    angle: 1.8
  });

  nodes.push({
    id: 'hitl-approval-queue',
    name: 'Human-in-the-Loop (HITL) Queue',
    shortName: 'HITL QUEUE',
    type: 'AUDIT',
    category: 'Security & Safe Agent Execution',
    description: 'State machine intercepting high-risk agent actions before public or destructive dispatch.',
    status: 'OPTIMAL',
    healthScore: 100,
    securityZone: 'ZONE_HITL_VERIFY',
    sizeOrVolume: '3 Pending Checkpoints',
    latencyOrCycle: 'Guarded State Machine',
    accessCount24h: 910,
    lastUpdated: 'Live Active',
    dependencies: ['content-agent', 'perf-marketing-agent', 'lead-gen-agent'],
    dependents: [],
    linkUrl: '/agents',
    color: '#EC4899',
    orbitRadius: 360,
    angle: 3.4
  });

  // Cross-governance dependencies
  dependencies.push({
    sourceId: 'growth-diagnostic-audit',
    targetId: 'roadmap-90-days',
    type: 'FEEDS_ROADMAP',
    label: 'Directs Roadmap Priorities',
    strength: 0.95
  });

  dependencies.push({
    sourceId: 'roadmap-90-days',
    targetId: 'sigma-orchestrator',
    type: 'GOVERNS',
    label: 'Execution Target',
    strength: 0.85
  });

  // Compute node dependencies lists accurately
  nodes.forEach(n => {
    n.dependencies = dependencies.filter(d => d.targetId === n.id).map(d => d.sourceId);
    n.dependents = dependencies.filter(d => d.sourceId === n.id).map(d => d.targetId);
  });

  return { nodes, dependencies };
}
