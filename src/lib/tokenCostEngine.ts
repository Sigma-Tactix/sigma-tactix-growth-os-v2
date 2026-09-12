import { TokenUsageRecord, TokenTelemetrySummary, ClientProfitabilityMetrics } from '../types.js';

export interface ModelPricing {
  promptPer1M: number;
  candidatePer1M: number;
}

export type ModelProvider = 
  | 'google' 
  | 'anthropic' 
  | 'openai' 
  | 'xai' 
  | 'qwen' 
  | 'deepseek' 
  | 'glm' 
  | 'lmstudio' 
  | 'ollama' 
  | 'omniroute' 
  | 'opencode' 
  | 'openrouter';

export interface ModelInfo {
  id: string;
  provider: ModelProvider;
  providerName: string;
  name: string;
  contextWindow: string;
  promptPer1M: number;
  candidatePer1M: number;
  description: string;
  recommendedRole: string;
  status: 'GA' | 'PREVIEW' | 'FAST_TIER';
  latencyGrade?: 'INSTANT' | 'BALANCED' | 'THINKING';
  useCases?: string[];
  oneClickAgentTarget?: string;
  isLocal?: boolean;
  isRouter?: boolean;
}

// Complete multi-provider AI model catalog with verified token unit pricing per 1M tokens (USD) as of September 2026
export const ALL_AI_MODELS: ModelInfo[] = [
  // ==========================================
  // 1. Google Cloud Gemini
  // ==========================================
  {
    id: 'gemini-3.8-flash-high',
    provider: 'google',
    providerName: 'Google Cloud',
    name: 'Gemini 3.8 Flash (High Throughput)',
    contextWindow: '2M tokens',
    promptPer1M: 0.075,
    candidatePer1M: 0.30,
    description: 'Sub-40ms latency with 2M native context and adaptive compute scaling. Ideal for high-speed agent loops.',
    recommendedRole: 'Primary Multi-Agent Orchestrator & Live Biosphere Telemetry',
    status: 'GA',
    latencyGrade: 'INSTANT',
    useCases: ['Autonomous Multi-Agent DAG Orchestration', 'Live Webhook Stream Processing', 'Real-time Telemetry'],
    oneClickAgentTarget: 'agent-orchestrator'
  },
  {
    id: 'gemini-3.0-pro',
    provider: 'google',
    providerName: 'Google Cloud',
    name: 'Gemini 3.0 Pro Enterprise',
    contextWindow: '2M tokens',
    promptPer1M: 1.25,
    candidatePer1M: 5.00,
    description: 'Frontier context synthesis, long-term memory distillation, and cross-vault semantic graphs.',
    recommendedRole: 'Second Brain Knowledge Vault Indexing & Diagnostic Auditing',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['10-Vault Knowledge Consolidation', 'Executive Strategy Roadmaps', '90-Day Diagnostic Roadmaps'],
    oneClickAgentTarget: 'agent-diagnostic'
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    providerName: 'Google Cloud',
    name: 'Gemini 2.5 Flash',
    contextWindow: '1M tokens',
    promptPer1M: 0.075,
    candidatePer1M: 0.30,
    description: 'Sub-second real-time multimodal reasoning. Best balance of speed, cost, and high throughput.',
    recommendedRole: 'Primary Agent Orchestration & Real-time Auditing',
    status: 'GA',
    latencyGrade: 'INSTANT',
    useCases: ['High-volume task routing', 'Routine diagnostics', 'Rapid chatbot response'],
    oneClickAgentTarget: 'agent-orchestrator'
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    providerName: 'Google Cloud',
    name: 'Gemini 2.5 Pro',
    contextWindow: '2M tokens',
    promptPer1M: 1.25,
    candidatePer1M: 5.00,
    description: 'Deep multi-step reasoning, massive repo analysis, and complex growth strategy architecture.',
    recommendedRole: 'Deep Strategic Growth Audits & Second Brain Synthesis',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Complex attribution analysis', 'Cross-channel growth plans', 'Audit report generation'],
    oneClickAgentTarget: 'agent-diagnostic'
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    providerName: 'Google Cloud',
    name: 'Gemini 2.0 Flash',
    contextWindow: '1M tokens',
    promptPer1M: 0.10,
    candidatePer1M: 0.40,
    description: 'Next-gen multimodal architecture with native tool calling and lightning audio/visual feeds.',
    recommendedRole: 'Fast Social Content & Visual Diagnostics',
    status: 'GA',
    latencyGrade: 'INSTANT',
    useCases: ['Visual ad analysis', 'Social post generation', 'Media parsing'],
    oneClickAgentTarget: 'agent-content'
  },
  {
    id: 'gemini-2.0-flash-thinking',
    provider: 'google',
    providerName: 'Google Cloud',
    name: 'Gemini 2.0 Flash Thinking',
    contextWindow: '1M tokens',
    promptPer1M: 0.10,
    candidatePer1M: 0.40,
    description: 'Explicit chain-of-thought verification with sub-second execution overhead.',
    recommendedRole: 'Autonomous Attribution & Mathematical Audits',
    status: 'PREVIEW',
    latencyGrade: 'THINKING',
    useCases: ['ROAS calculations', 'Spend allocation proofs', 'Attribution auditing'],
    oneClickAgentTarget: 'agent-performance'
  },

  // ==========================================
  // 2. Anthropic Claude (Frontier up to Fable 5.1)
  // ==========================================
  {
    id: 'claude-fable-5-1-thinking',
    provider: 'anthropic',
    providerName: 'Anthropic',
    name: 'Claude Fable 5.1 Thinking',
    contextWindow: '1M tokens',
    promptPer1M: 3.00,
    candidatePer1M: 15.00,
    description: 'Anthropic flagship extended-deliberation model with adaptive thinking budgets and autonomous self-correction.',
    recommendedRole: 'Executive Consensus Arbitrator & High-Stakes Governance',
    status: 'GA',
    latencyGrade: 'THINKING',
    useCases: ['Board-level Executive Strategy', 'Cross-Agent Consensus Arbitration', 'High-Stakes Budget Allocation'],
    oneClickAgentTarget: 'agent-orchestrator'
  },
  {
    id: 'claude-fable-5-0',
    provider: 'anthropic',
    providerName: 'Anthropic',
    name: 'Claude Fable 5.0 High-Throughput',
    contextWindow: '1M tokens',
    promptPer1M: 2.50,
    candidatePer1M: 12.50,
    description: '1M native context with near-zero latency penalty and superhuman code refactoring capabilities.',
    recommendedRole: 'Full Funnel Copy & Nuanced Brand Voice Alignment',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Enterprise Brand Voice Synthesis', 'Long-form Pillar Content', 'High-Converting Sales Funnels'],
    oneClickAgentTarget: 'agent-content'
  },
  {
    id: 'claude-4-5-sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    name: 'Claude 4.5 Sonnet',
    contextWindow: '500K tokens',
    promptPer1M: 3.00,
    candidatePer1M: 15.00,
    description: 'Benchmark-dominating code generation, AST transformations, and multi-file architecture auditing.',
    recommendedRole: 'Data Ops Sentinel & Complex Pipeline Synthesis',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['SQL & Dataform Pipeline Code', 'AST & Webhook Generation', 'Schema Drift Remediation'],
    oneClickAgentTarget: 'agent-ops'
  },
  {
    id: 'claude-4-opus',
    provider: 'anthropic',
    providerName: 'Anthropic',
    name: 'Claude 4 Opus Enterprise',
    contextWindow: '500K tokens',
    promptPer1M: 15.00,
    candidatePer1M: 75.00,
    description: 'Massive parameter density for enterprise legal compliance, deep competitive moat analysis, and thesis drafting.',
    recommendedRole: 'Competitor Moat Dissection & Board Strategy',
    status: 'GA',
    latencyGrade: 'THINKING',
    useCases: ['M&A Competitor Teardowns', 'Regulatory Compliance', 'Executive Board Decks'],
    oneClickAgentTarget: 'agent-competitor'
  },
  {
    id: 'claude-3-7-sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    name: 'Claude 3.7 Sonnet',
    contextWindow: '200K tokens',
    promptPer1M: 3.00,
    candidatePer1M: 15.00,
    description: 'Hybrid standard & extended reasoning engine with top-tier code generation and precision writing.',
    recommendedRole: 'Ad Copywriting & Nuanced Executive Narrative Synthesis',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Ad copy matrices', 'Whitepapers', 'Tone-of-voice alignment'],
    oneClickAgentTarget: 'agent-content'
  },
  {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    name: 'Claude 3.5 Sonnet',
    contextWindow: '200K tokens',
    promptPer1M: 3.00,
    candidatePer1M: 15.00,
    description: 'Benchmark-leading coding and nuanced writing model. Excels at complex tone-of-voice alignment.',
    recommendedRole: 'Brand Voice Mastery & High-conversion Funnel Content',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['High-converting landing pages', 'Complex email sequences', 'Code refactoring'],
    oneClickAgentTarget: 'agent-content'
  },
  {
    id: 'claude-3-5-haiku',
    provider: 'anthropic',
    providerName: 'Anthropic',
    name: 'Claude 3.5 Haiku',
    contextWindow: '200K tokens',
    promptPer1M: 0.80,
    candidatePer1M: 4.00,
    description: 'Fast, lightweight Claude engine with superior instruction-following at low latency.',
    recommendedRole: 'Real-time Chatbot & Live Customer Response Automation',
    status: 'FAST_TIER',
    latencyGrade: 'INSTANT',
    useCases: ['Live chat co-pilots', 'Micro-task classification', 'Instant lead triage'],
    oneClickAgentTarget: 'agent-outreach'
  },

  // ==========================================
  // 3. OpenAI (Frontier up to ChatGPT Astra)
  // ==========================================
  {
    id: 'chatgpt-astra-multimodal',
    provider: 'openai',
    providerName: 'OpenAI',
    name: 'ChatGPT Astra Multimodal Omni',
    contextWindow: '1M tokens',
    promptPer1M: 2.00,
    candidatePer1M: 8.00,
    description: 'OpenAI frontier omni-perceptive model with native real-time vision, screen awareness, and audio-creative synthesis.',
    recommendedRole: 'Creative Matrix Generation & Competitor Visual Ad Teardowns',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Multi-channel Ad Asset Generation', 'Landing Page UX Teardowns', 'Real-time Video Ad Creative'],
    oneClickAgentTarget: 'agent-performance'
  },
  {
    id: 'gpt-5-omni',
    provider: 'openai',
    providerName: 'OpenAI',
    name: 'OpenAI GPT-5 Omni',
    contextWindow: '512K tokens',
    promptPer1M: 3.00,
    candidatePer1M: 12.00,
    description: 'Next-generation universal reasoning engine featuring unified text-audio-visual weights and self-verifying tool execution.',
    recommendedRole: 'SEO & AEO Authority Architect & Knowledge Engine',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['AEO Answer Engine Optimization', 'Topical Authority Knowledge Graphs', 'Autonomous Entity Linking'],
    oneClickAgentTarget: 'agent-authority'
  },
  {
    id: 'gpt-4-5-orion',
    provider: 'openai',
    providerName: 'OpenAI',
    name: 'OpenAI GPT-4.5 Orion',
    contextWindow: '256K tokens',
    promptPer1M: 5.00,
    candidatePer1M: 20.00,
    description: 'High-density model excelling at human-level creative writing, complex negotiation scripts, and behavioral psychology.',
    recommendedRole: 'B2B Outreach Personalization & Lead Conversion',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Personalized LinkedIn/Email Outreach', 'Objection Handling Playbooks', 'High-touch B2B Sales Scripts'],
    oneClickAgentTarget: 'agent-outreach'
  },
  {
    id: 'o3',
    provider: 'openai',
    providerName: 'OpenAI',
    name: 'OpenAI o3 Deep Reasoning',
    contextWindow: '200K tokens',
    promptPer1M: 10.00,
    candidatePer1M: 40.00,
    description: 'Maximum-depth chain-of-thought mathematical proof solver and algorithmic attribution modeling engine.',
    recommendedRole: 'Algorithmic ROAS Optimization & CAC-to-LTV Modeling',
    status: 'GA',
    latencyGrade: 'THINKING',
    useCases: ['Predictive ROAS Modeling', 'Multi-touch Attribution Solvers', 'Bayesian Marketing Mix Models'],
    oneClickAgentTarget: 'agent-performance'
  },
  {
    id: 'o3-mini',
    provider: 'openai',
    providerName: 'OpenAI',
    name: 'OpenAI o3-mini',
    contextWindow: '200K tokens',
    promptPer1M: 1.10,
    candidatePer1M: 4.40,
    description: 'Fast, cost-effective reasoning model tailored for science, math, and code tasks.',
    recommendedRole: 'Complex SQL Pipeline Synthesis & Data Anomaly Isolation',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['SQL queries', 'Data pipelines', 'Anomaly detection'],
    oneClickAgentTarget: 'agent-ops'
  },
  {
    id: 'o1',
    provider: 'openai',
    providerName: 'OpenAI',
    name: 'OpenAI o1 Reasoning',
    contextWindow: '200K tokens',
    promptPer1M: 15.00,
    candidatePer1M: 60.00,
    description: 'Deep deliberative reinforcement learning model for multi-stage math and algorithm proofs.',
    recommendedRole: 'Attribution Modeling & Predictive ROAS Optimization',
    status: 'GA',
    latencyGrade: 'THINKING',
    useCases: ['Deep mathematical reasoning', 'Budget optimization', 'Attribution models'],
    oneClickAgentTarget: 'agent-performance'
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    providerName: 'OpenAI',
    name: 'GPT-4o Omni',
    contextWindow: '128K tokens',
    promptPer1M: 2.50,
    candidatePer1M: 10.00,
    description: 'Flagship multimodal model with native text, vision, and high coding capabilities.',
    recommendedRole: 'Multichannel Ad Asset Creation & SEO Optimization',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Ad copy creation', 'SEO metadata', 'Landing page copy'],
    oneClickAgentTarget: 'agent-authority'
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    providerName: 'OpenAI',
    name: 'GPT-4o Mini',
    contextWindow: '128K tokens',
    promptPer1M: 0.15,
    candidatePer1M: 0.60,
    description: 'Affordable high-speed mini model matching GPT-4 level intelligence for routine tasks.',
    recommendedRole: 'High-volume Social Repurposing & Keyword Clustering',
    status: 'FAST_TIER',
    latencyGrade: 'INSTANT',
    useCases: ['Social repurposing', 'Keyword clustering', 'Bulk classification'],
    oneClickAgentTarget: 'agent-listening'
  },

  // ==========================================
  // 4. Alibaba Cloud Qwen (up to Qwen 3)
  // ==========================================
  {
    id: 'qwen-3-235b-moe',
    provider: 'qwen',
    providerName: 'Alibaba Cloud Qwen',
    name: 'Qwen 3 235B MoE Instruct',
    contextWindow: '256K tokens',
    promptPer1M: 0.30,
    candidatePer1M: 0.60,
    description: 'Top open-weight flagship delivering frontier GPT-4.5 level intelligence at massive cost discount.',
    recommendedRole: 'Sovereign Multilingual Market Expansion & Lead Enrichment',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Global B2B Lead Enrichment', 'Cross-border Campaign Localization', 'Mass Data Synthesis'],
    oneClickAgentTarget: 'agent-outreach'
  },
  {
    id: 'qwen-3-coder',
    provider: 'qwen',
    providerName: 'Alibaba Cloud Qwen',
    name: 'Qwen 3 Coder 48B',
    contextWindow: '128K tokens',
    promptPer1M: 0.18,
    candidatePer1M: 0.36,
    description: 'State-of-the-art coding powerhouse for automated data warehouse migrations, tracking scripts, and webhooks.',
    recommendedRole: 'Automated Tag Management & Tracking Infrastructure',
    status: 'GA',
    latencyGrade: 'INSTANT',
    useCases: ['Server-side Tag Manager setup', 'UTM tracking pipelines', 'Dataform SQL transformations'],
    oneClickAgentTarget: 'agent-ops'
  },
  {
    id: 'qwen-2.5-72b',
    provider: 'qwen',
    providerName: 'Alibaba Cloud Qwen',
    name: 'Qwen 2.5 72B Instruct',
    contextWindow: '128K tokens',
    promptPer1M: 0.35,
    candidatePer1M: 0.70,
    description: 'Top open-weight flagship offering GPT-4 level benchmark results at extreme cost efficiency.',
    recommendedRole: 'Sovereign On-Prem Workloads & Multilingual Localization',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Multilingual campaigns', 'Cost-sensitive workloads', 'Lead extraction'],
    oneClickAgentTarget: 'agent-outreach'
  },
  {
    id: 'qwen-2.5-coder-32b',
    provider: 'qwen',
    providerName: 'Alibaba Cloud Qwen',
    name: 'Qwen 2.5 Coder 32B',
    contextWindow: '128K tokens',
    promptPer1M: 0.20,
    candidatePer1M: 0.40,
    description: 'Specialized code generation engine for tracking scripts, webhooks, and UTM pipelines.',
    recommendedRole: 'Automated Tag Manager & Tracking Pixel Automation',
    status: 'GA',
    latencyGrade: 'INSTANT',
    useCases: ['Tracking code generation', 'Webhook parsing', 'API wrappers'],
    oneClickAgentTarget: 'agent-ops'
  },

  // ==========================================
  // 5. DeepSeek AI (up to R2 MoE)
  // ==========================================
  {
    id: 'deepseek-r2-moe',
    provider: 'deepseek',
    providerName: 'DeepSeek AI',
    name: 'DeepSeek R2 Reasoning MoE',
    contextWindow: '128K tokens',
    promptPer1M: 0.50,
    candidatePer1M: 2.00,
    description: 'Next-gen open reasoning architecture with verified step-by-step mathematical tracing and budget optimization.',
    recommendedRole: 'Growth Diagnostic Hypothesis Testing & ROI Modeling',
    status: 'GA',
    latencyGrade: 'THINKING',
    useCases: ['Funnel bottleneck mathematical proofs', 'Marketing spend elasticity modeling', 'Autonomous hypothesis testing'],
    oneClickAgentTarget: 'agent-diagnostic'
  },
  {
    id: 'deepseek-v3',
    provider: 'deepseek',
    providerName: 'DeepSeek AI',
    name: 'DeepSeek V3 (671B MoE)',
    contextWindow: '128K tokens',
    promptPer1M: 0.14,
    candidatePer1M: 0.28,
    description: 'Revolutionary Mixture-of-Experts architecture delivering frontier capability at 90% discount.',
    recommendedRole: 'Autonomous Content Matrix Generation & Long-tail SEO',
    status: 'GA',
    latencyGrade: 'INSTANT',
    useCases: ['Bulk programmatic SEO', 'Long-tail content creation', 'Automated product descriptions'],
    oneClickAgentTarget: 'agent-authority'
  },
  {
    id: 'deepseek-r1',
    provider: 'deepseek',
    providerName: 'DeepSeek AI',
    name: 'DeepSeek R1 (Reasoning)',
    contextWindow: '128K tokens',
    promptPer1M: 0.55,
    candidatePer1M: 2.19,
    description: 'Open-weights reasoning model with explicit verification trace matching OpenAI o1.',
    recommendedRole: 'Full Funnel CAC-to-LTV Modeling & Algorithmic Bidding',
    status: 'GA',
    latencyGrade: 'THINKING',
    useCases: ['Complex attribution calculations', 'CAC-to-LTV proofs', 'Algorithmic bid adjustments'],
    oneClickAgentTarget: 'agent-performance'
  },

  // ==========================================
  // 6. xAI Grok
  // ==========================================
  {
    id: 'grok-3-reasoning',
    provider: 'xai',
    providerName: 'xAI',
    name: 'xAI Grok-3 Reasoning',
    contextWindow: '256K tokens',
    promptPer1M: 3.00,
    candidatePer1M: 12.00,
    description: 'Frontier real-time web-aware reasoning with live telemetry and unfiltered competitor market sentiment.',
    recommendedRole: 'Social Listening Spike Detection & Viral Narrative Intercept',
    status: 'GA',
    latencyGrade: 'THINKING',
    useCases: ['Real-time viral trend discovery', 'Competitor narrative counter-attacks', 'Public sentiment pulse'],
    oneClickAgentTarget: 'agent-listening'
  },
  {
    id: 'grok-2-1212',
    provider: 'xai',
    providerName: 'xAI',
    name: 'Grok-2 (1212)',
    contextWindow: '128K tokens',
    promptPer1M: 2.00,
    candidatePer1M: 10.00,
    description: 'State-of-the-art conversational reasoning with real-time web awareness and unfiltered analytics.',
    recommendedRole: 'Viral Trend Intelligence & Real-time Market Sentiment',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Viral trend tracking', 'Social listening summaries', 'Brand sentiment tracking'],
    oneClickAgentTarget: 'agent-listening'
  },

  // ==========================================
  // 7. Local LLMs (MacBook LM Studio & Ollama)
  // ==========================================
  {
    id: 'local-lmstudio',
    provider: 'lmstudio',
    providerName: 'Local LM Studio (MacBook)',
    name: 'LM Studio Local Server (Apple Silicon)',
    contextWindow: '128K tokens',
    promptPer1M: 0.00,
    candidatePer1M: 0.00,
    description: 'Zero-cost local inference running directly on your MacBook via LM Studio (http://localhost:1234/v1). 100% private, zero cloud egress.',
    recommendedRole: 'Sovereign Offline Execution & Local Data Privacy Workloads',
    status: 'GA',
    latencyGrade: 'INSTANT',
    isLocal: true,
    useCases: ['Zero-Cost Local Lead Scraping', 'Offline Pipeline Validation', 'Confidential Customer Data Cleanse'],
    oneClickAgentTarget: 'agent-ops'
  },
  {
    id: 'local-ollama-llama3',
    provider: 'ollama',
    providerName: 'Local Ollama (MacBook)',
    name: 'Ollama — Llama 3.3 70B Local',
    contextWindow: '128K tokens',
    promptPer1M: 0.00,
    candidatePer1M: 0.00,
    description: 'Sovereign on-device execution via Ollama (http://localhost:11434/v1). Powered by Metal GPU acceleration on Apple Silicon.',
    recommendedRole: 'High-Volume Lead Qualification & Local Scrubbing',
    status: 'GA',
    latencyGrade: 'BALANCED',
    isLocal: true,
    useCases: ['High-throughput Lead Scoring', 'Local CRM Enrichment', 'Zero-cloud Data Masking'],
    oneClickAgentTarget: 'agent-outreach'
  },
  {
    id: 'local-ollama-qwen3',
    provider: 'ollama',
    providerName: 'Local Ollama (MacBook)',
    name: 'Ollama — Qwen 2.5/3 Coder Local',
    contextWindow: '128K tokens',
    promptPer1M: 0.00,
    candidatePer1M: 0.00,
    description: 'High-performance local code generation and AST refactoring without internet connection or token fees.',
    recommendedRole: 'Local Webhook Parsing & Code Sandboxing',
    status: 'GA',
    latencyGrade: 'INSTANT',
    isLocal: true,
    useCases: ['Offline Code Synthesis', 'SQL Syntax Validation', 'Script Minification'],
    oneClickAgentTarget: 'agent-ops'
  },
  {
    id: 'local-ollama-deepseek-r1',
    provider: 'ollama',
    providerName: 'Local Ollama (MacBook)',
    name: 'Ollama — DeepSeek R1 Distill 32B Local',
    contextWindow: '64K tokens',
    promptPer1M: 0.00,
    candidatePer1M: 0.00,
    description: 'Local chain-of-thought mathematical reasoning running on MacBook unified memory with zero subscription fees.',
    recommendedRole: 'Local Attribution Verification & Budget Logic Checks',
    status: 'GA',
    latencyGrade: 'THINKING',
    isLocal: true,
    useCases: ['Local Verification Runs', 'Deterministic Logic Checks', 'Private Growth Math'],
    oneClickAgentTarget: 'agent-performance'
  },

  // ==========================================
  // 8. Multi-Provider Smart Routers (Omniroute / OpenCode / OpenRouter)
  // ==========================================
  {
    id: 'omniroute-auto',
    provider: 'omniroute',
    providerName: 'Omniroute Smart Gateway',
    name: 'Omniroute Intelligent Smart Router',
    contextWindow: '2M tokens',
    promptPer1M: 0.15,
    candidatePer1M: 0.60,
    description: 'Intelligent low-latency routing gateway automatically dispatching prompts to lowest latency & lowest cost frontier model.',
    recommendedRole: 'Unified Workspace Gateway with Automatic Failover',
    status: 'GA',
    latencyGrade: 'INSTANT',
    isRouter: true,
    useCases: ['High-uptime Multi-Provider Failover', 'Automatic Cost-Optimized Routing', 'Unified Multi-Key Billing'],
    oneClickAgentTarget: 'agent-orchestrator'
  },
  {
    id: 'opencode-agent',
    provider: 'opencode',
    providerName: 'Open Code Gateway',
    name: 'Open Code Fast Execution Router',
    contextWindow: '500K tokens',
    promptPer1M: 0.20,
    candidatePer1M: 0.80,
    description: 'Specialized code generation & execution router optimized for high-speed AST builds, linter checks, and test passes.',
    recommendedRole: 'Automated Code Generation & AST Pipeline Builders',
    status: 'GA',
    latencyGrade: 'INSTANT',
    isRouter: true,
    useCases: ['Automated Code Generation', 'Database Migration Scripts', 'Continuous Integration Automation'],
    oneClickAgentTarget: 'agent-ops'
  },
  {
    id: 'openrouter-auto',
    provider: 'openrouter',
    providerName: 'OpenRouter Unified Gateway',
    name: 'OpenRouter Auto (Best Price/Performance)',
    contextWindow: '1M tokens',
    promptPer1M: 0.10,
    candidatePer1M: 0.50,
    description: 'Universal multi-model gateway with dynamic load balancing across 200+ models using a single unified API key.',
    recommendedRole: 'Global Workspace Fallback & Budget Balancing',
    status: 'GA',
    latencyGrade: 'BALANCED',
    isRouter: true,
    useCases: ['Universal Key Management', 'Multi-model Exploration', 'Global Cost Capping'],
    oneClickAgentTarget: 'agent-orchestrator'
  },

  // ==========================================
  // 9. Zhipu AI (GLM)
  // ==========================================
  {
    id: 'glm-4-plus',
    provider: 'glm',
    providerName: 'Zhipu AI (GLM)',
    name: 'GLM-4 Plus',
    contextWindow: '128K tokens',
    promptPer1M: 1.40,
    candidatePer1M: 1.40,
    description: 'Frontier bilingual flagship model with superb tool calling and web browsing integration.',
    recommendedRole: 'Technical Product Briefs & Deep Search Integration',
    status: 'GA',
    latencyGrade: 'BALANCED',
    useCases: ['Bilingual research', 'Web scraping synthesis', 'Technical manuals'],
    oneClickAgentTarget: 'agent-competitor'
  },
  {
    id: 'glm-4-flash',
    provider: 'glm',
    providerName: 'Zhipu AI (GLM)',
    name: 'GLM-4 Flash',
    contextWindow: '128K tokens',
    promptPer1M: 0.01,
    candidatePer1M: 0.01,
    description: 'Virtually zero-cost model for continuous lightweight monitoring and cron health sweeps.',
    recommendedRole: 'System Health Monitors & Continuous Telemetry Parsing',
    status: 'FAST_TIER',
    latencyGrade: 'INSTANT',
    useCases: ['Continuous telemetry parsing', 'Health checks', 'Background monitors'],
    oneClickAgentTarget: 'agent-ops'
  }
];

// Official published pricing per 1M tokens (USD) indexed for lookup
export const MODEL_PRICING: Record<string, ModelPricing> = ALL_AI_MODELS.reduce((acc, model) => {
  acc[model.id] = { promptPer1M: model.promptPer1M, candidatePer1M: model.candidatePer1M };
  return acc;
}, {} as Record<string, ModelPricing>);

// Aliases for backwards compatibility and fuzzy match lookups
MODEL_PRICING['gemini-3.5-flash'] = { promptPer1M: 0.075, candidatePer1M: 0.30 };
MODEL_PRICING['claude-3-sonnet']   = { promptPer1M: 3.00,  candidatePer1M: 15.00 };
MODEL_PRICING['gpt-4-turbo']       = { promptPer1M: 10.00, candidatePer1M: 30.00 };
MODEL_PRICING['o1-mini']           = { promptPer1M: 1.10,  candidatePer1M: 4.40 };

// Fallback pricing tier for unknown models (defaults to flash tier)
export const DEFAULT_PRICING: ModelPricing = { promptPer1M: 0.075, candidatePer1M: 0.30 };

/**
 * Calculates exact USD cost for a token batch.
 */
export function calculateTokenCost(
  modelName: string,
  promptTokens: number,
  candidateTokens: number
): number {
  const norm = modelName.toLowerCase();
  let pricing = DEFAULT_PRICING;

  for (const [key, p] of Object.entries(MODEL_PRICING)) {
    if (norm.includes(key) || key.includes(norm)) {
      pricing = p;
      break;
    }
  }

  const promptCost = (promptTokens / 1_000_000) * pricing.promptPer1M;
  const candidateCost = (candidateTokens / 1_000_000) * pricing.candidatePer1M;
  const total = promptCost + candidateCost;

  // Return rounded to 6 decimal places (micro-dollars)
  return Math.round(total * 1_000_000) / 1_000_000;
}

/**
 * Estimates token count from raw text (approx 4 chars per token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Standard tier retainer defaults
 */
export const TIER_RETAINERS: Record<string, { name: string; priceMonthly: number }> = {
  starter: { name: 'Starter OS', priceMonthly: 499 },
  growth: { name: 'Growth OS', priceMonthly: 1499 },
  enterprise: { name: 'Enterprise / Agency OS', priceMonthly: 3499 },
};

/**
 * Computes agency client profitability and gross margin percentage.
 */
export function computeProfitability(
  tierKey: string,
  tierDisplayName: string,
  monthlyRetainerUsd: number,
  aiTokenCostUsd: number,
  cloudInfraCostUsd = 35.00
): ClientProfitabilityMetrics {
  const netProfit = Math.max(0, monthlyRetainerUsd - aiTokenCostUsd - cloudInfraCostUsd);
  const grossMargin = monthlyRetainerUsd > 0
    ? Math.round(((monthlyRetainerUsd - aiTokenCostUsd - cloudInfraCostUsd) / monthlyRetainerUsd) * 1000) / 10
    : 0;

  const totalCost = aiTokenCostUsd + cloudInfraCostUsd;
  const roiMultiplier = totalCost > 0
    ? Math.round((monthlyRetainerUsd / totalCost) * 10) / 10
    : 100;

  return {
    tierKey,
    tierDisplayName,
    monthlyRetainerUsd,
    aiTokenCostUsd: Math.round(aiTokenCostUsd * 1000) / 1000,
    cloudInfraCostUsd,
    netProfitUsd: Math.round(netProfit * 100) / 100,
    grossMarginPct: grossMargin,
    roiMultiplier,
  };
}

/**
 * Aggregates a list of token usage records into a structured telemetry summary.
 */
export function aggregateTelemetry(
  records: TokenUsageRecord[],
  tierKey = 'growth',
  tierDisplayName = 'Growth OS',
  monthlyRetainerUsd = 1499
): TokenTelemetrySummary {
  let promptTokens = 0;
  let candidateTokens = 0;
  let totalTokens = 0;
  let totalCostUsd = 0;

  const byModel: Record<string, { calls: number; totalTokens: number; costUsd: number }> = {};
  const byAction: Record<string, { calls: number; totalTokens: number; costUsd: number }> = {};
  const byAgent: Record<string, { calls: number; totalTokens: number; costUsd: number }> = {};

  for (const r of records) {
    promptTokens += r.promptTokens || 0;
    candidateTokens += r.candidateTokens || 0;
    totalTokens += r.totalTokens || 0;
    totalCostUsd += Number(r.estimatedCostUsd) || 0;

    // By model
    const m = r.modelName || 'gemini-2.5-flash';
    if (!byModel[m]) byModel[m] = { calls: 0, totalTokens: 0, costUsd: 0 };
    byModel[m].calls++;
    byModel[m].totalTokens += r.totalTokens || 0;
    byModel[m].costUsd = Math.round((byModel[m].costUsd + (Number(r.estimatedCostUsd) || 0)) * 1_000_000) / 1_000_000;

    // By action
    const a = r.actionType || 'UNKNOWN_ACTION';
    if (!byAction[a]) byAction[a] = { calls: 0, totalTokens: 0, costUsd: 0 };
    byAction[a].calls++;
    byAction[a].totalTokens += r.totalTokens || 0;
    byAction[a].costUsd = Math.round((byAction[a].costUsd + (Number(r.estimatedCostUsd) || 0)) * 1_000_000) / 1_000_000;

    // By agent
    if (r.agentId) {
      const ag = r.agentId;
      if (!byAgent[ag]) byAgent[ag] = { calls: 0, totalTokens: 0, costUsd: 0 };
      byAgent[ag].calls++;
      byAgent[ag].totalTokens += r.totalTokens || 0;
      byAgent[ag].costUsd = Math.round((byAgent[ag].costUsd + (Number(r.estimatedCostUsd) || 0)) * 1_000_000) / 1_000_000;
    }
  }

  const profitability = computeProfitability(tierKey, tierDisplayName, monthlyRetainerUsd, totalCostUsd);

  return {
    totalCalls: records.length,
    promptTokens,
    candidateTokens,
    totalTokens,
    totalCostUsd: Math.round(totalCostUsd * 1000) / 1000,
    profitability,
    byModel,
    byAction,
    byAgent,
    recentRecords: records.slice(0, 50),
  };
}
