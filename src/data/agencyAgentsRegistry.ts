// Auto-generated Agency-Agents Registry for Growth OS
// Curated set — pruned from the original 223 auto-discovered agents down to
// 182 that are actually relevant to a growth/marketing agency
// SaaS (dropped niche verticals — healthcare, real estate, legal, government,
// embedded/IoT/XR engineering — that never matched this product), fixed
// module-key mismatches (second_brain/social_listening/competitor did not
// match the real activeTab keys, so per-module filtering silently missed
// them), and retagged a few existing agents into the two modules (Reporting,
// Simulation) that previously had zero agents at all. One new agent
// (Growth Scenario Simulator) was added because nothing in the original set
// covered OS Simulation Center's actual job — everything else here is a
// curated/retagged subset of the original discovery, not invented.

export interface DiscoveredAgent {
  id: string;
  folder: string;
  name: string;
  role: string;
  description: string;
  category: "marketing" | "sales" | "design" | "engineering" | "product" | "security" | "support" | "operations" | "specialized" | "testing" | "general";
  targetModules: string[];
  skills: string[];
}

export const DISCOVERED_AGENCY_AGENTS: DiscoveredAgent[] = [
  {
    "id": "agency-accounts-payable-agent",
    "folder": "accounts-payable-agent",
    "name": "Accounts Payable Agent Agent",
    "role": "Accounts Payable",
    "description": "Autonomous payment processing specialist that executes vendor payments, contractor invoices, and recurring bills across any payment rail — crypto, fiat, stablecoins. Integrates with AI agent workflows via tool calls.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Accounts Payable"
    ]
  },
  {
    "id": "agency-agentic-identity-trust-architect",
    "folder": "agentic-identity-trust",
    "name": "Agentic Identity Trust Architect Agent",
    "role": "Agentic Identity Trust Architect",
    "description": "Designs identity, authentication, and trust verification systems for autonomous AI agents operating in multi-agent environments. Ensures agents can prove who they are, what they're authorized to do, and what they actually did.",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Agentic Identity Trust Architect"
    ]
  },
  {
    "id": "agency-agents-orchestrator",
    "folder": "agents-orchestrator",
    "name": "Agents Orchestrator Agent",
    "role": "Agents Orchestrator",
    "description": "Autonomous pipeline manager that orchestrates the entire development workflow. You are the leader of this process.",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Agents Orchestrator"
    ]
  },
  {
    "id": "agency-automation-governance-architect",
    "folder": "automation-governance-architect",
    "name": "Automation Governance Architect Agent",
    "role": "Automation Governance Architect",
    "description": "Governance-first architect for business automations (n8n-first) who audits value, risk, and maintainability before implementation.",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Automation Governance Architect"
    ]
  },
  {
    "id": "agency-business-strategist",
    "folder": "business-strategist",
    "name": "Business Strategist Agent",
    "role": "Business Strategist",
    "description": "Senior management consulting specialist for competitive analysis, market entry strategy, business model design, growth planning, organizational strategy, and strategic decision-making — translating complex market dynamics into clear, actionable strategies that create sustainable competitive advantage",
    "category": "general",
    "targetModules": [
      "growth"
    ],
    "skills": [
      "General",
      "Business Strategist"
    ]
  },
  {
    "id": "agency-change-management-consultant",
    "folder": "change-management-consultant",
    "name": "Change Management Consultant Agent",
    "role": "Change Management Consultant",
    "description": "Expert change management specialist using ADKAR, Kotter, and Prosci frameworks to guide organizations through technology implementations, restructuring, culture transformation, and M&A integration — managing resistance, building adoption, and ensuring changes stick long after go-live",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Change Management Consultant"
    ]
  },
  {
    "id": "agency-chief-financial-officer",
    "folder": "chief-financial-officer",
    "name": "Chief Financial Officer Agent",
    "role": "Chief Financial Officer",
    "description": "Strategic finance executive who governs capital allocation, treasury operations, financial planning, M&A finance, investor relations, and board reporting — translating financial complexity into clear decisions that drive business performance and stakeholder confidence.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Chief Financial Officer"
    ]
  },
  {
    "id": "agency-corporate-training-designer",
    "folder": "corporate-training-designer",
    "name": "Corporate Training Designer Agent",
    "role": "Corporate Training Designer",
    "description": "Expert in enterprise training system design and curriculum development — proficient in training needs analysis, instructional design methodology, blended learning program design, internal trainer development, leadership programs, and training effectiveness evaluation and continuous optimization.",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Corporate Training Designer",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-customer-service",
    "folder": "customer-service",
    "name": "Customer Service Agent",
    "role": "Customer Service",
    "description": "Friendly, professional customer service specialist for any industry — handling inquiries, complaints, account support, FAQs, and seamless escalation with warmth, efficiency, and a genuine commitment to customer satisfaction",
    "category": "support",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Support",
      "Customer Service"
    ]
  },
  {
    "id": "agency-customer-success-manager",
    "folder": "customer-success-manager",
    "name": "Customer Success Manager Agent",
    "role": "Customer Success Manager",
    "description": "Strategic customer success specialist for onboarding, health scoring, QBR facilitation, churn prevention, expansion identification, and renewal management — driving net revenue retention by turning customers into long-term partners who achieve measurable outcomes",
    "category": "support",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Support",
      "Customer Success Manager"
    ]
  },
  {
    "id": "agency-data-consolidation-agent",
    "folder": "data-consolidation-agent",
    "name": "Data Consolidation Agent Agent",
    "role": "Data Consolidation",
    "description": "AI agent that consolidates extracted sales data into live reporting dashboards with territory, rep, and pipeline summaries",
    "category": "general",
    "targetModules": [
      "growth"
    ],
    "skills": [
      "General",
      "Data Consolidation"
    ]
  },
  {
    "id": "agency-data-privacy-officer",
    "folder": "data-privacy-officer",
    "name": "Data Privacy Officer Agent",
    "role": "Data Privacy Officer",
    "description": "Corporate data privacy specialist and DPO who builds GDPR, CCPA, and global privacy compliance programs — covering data mapping, privacy impact assessments, consent management, breach response, vendor due diligence, and regulatory engagement.",
    "category": "security",
    "targetModules": [
      "brain"
    ],
    "skills": [
      "Security",
      "Data Privacy Officer"
    ]
  },
  {
    "id": "agency-brand-guardian",
    "folder": "design-brand-guardian",
    "name": "Brand Guardian Agent",
    "role": "Brand Guardian",
    "description": "Expert brand strategist and guardian specializing in brand identity development, consistency maintenance, and strategic brand positioning",
    "category": "design",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Design",
      "Brand Guardian",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-image-prompt-engineer",
    "folder": "design-image-prompt-engineer",
    "name": "Image Prompt Engineer Agent",
    "role": "Image Prompt Engineer",
    "description": "Expert photography prompt engineer specializing in crafting detailed, evocative prompts for AI image generation. Masters the art of translating visual concepts into precise language that produces stunning, professional-quality photography through generative AI tools.",
    "category": "design",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Design",
      "Image Prompt Engineer",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-inclusive-visuals-specialist",
    "folder": "design-inclusive-visuals-specialist",
    "name": "Inclusive Visuals Specialist Agent",
    "role": "Inclusive Visuals Specialist",
    "description": "Representation expert who defeats systemic AI biases to generate culturally accurate, affirming, and non-stereotypical images and video.",
    "category": "design",
    "targetModules": [
      "uiux"
    ],
    "skills": [
      "Design",
      "Inclusive Visuals Specialist",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-persona-walkthrough-specialist",
    "folder": "design-persona-walkthrough",
    "name": "Persona Walkthrough Specialist Agent",
    "role": "Persona Walkthrough Specialist",
    "description": "Simulate cognitive walkthroughs of web pages from a defined persona's psychological perspective — captures emotional reactions and rational thought at each scroll position, then delivers structured CRO reports grounded in LIFT, Cialdini, and Fogg frameworks",
    "category": "design",
    "targetModules": [
      "uiux"
    ],
    "skills": [
      "Design",
      "Persona Walkthrough Specialist",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-ui-designer",
    "folder": "design-ui-designer",
    "name": "Ui Designer Agent",
    "role": "Ui Designer",
    "description": "Expert UI designer specializing in visual design systems, component libraries, and pixel-perfect interface creation. Creates beautiful, consistent, accessible user interfaces that enhance UX and reflect brand identity",
    "category": "design",
    "targetModules": [
      "uiux"
    ],
    "skills": [
      "Design",
      "Ui Designer",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-ui-finish-gate-reviewer",
    "folder": "design-ui-finish-gate-reviewer",
    "name": "Ui Finish Gate Reviewer Agent",
    "role": "Ui Finish Gate Reviewer",
    "description": "Product-interface reviewer who catches generic, interchangeable UI before it ships by grounding critique in real product evidence, a written design contract, and a hard implementation finish gate.",
    "category": "design",
    "targetModules": [
      "uiux"
    ],
    "skills": [
      "Design",
      "Ui Finish Gate Reviewer",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-ux-architect",
    "folder": "design-ux-architect",
    "name": "Ux Architect Agent",
    "role": "Ux Architect",
    "description": "Technical architecture and UX specialist who provides developers with solid foundations, CSS systems, and clear implementation guidance",
    "category": "design",
    "targetModules": [
      "uiux"
    ],
    "skills": [
      "Design",
      "Ux Architect",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-ux-researcher",
    "folder": "design-ux-researcher",
    "name": "Ux Researcher Agent",
    "role": "Ux Researcher",
    "description": "Expert user experience researcher specializing in user behavior analysis, usability testing, and data-driven design insights. Provides actionable research findings that improve product usability and user satisfaction",
    "category": "design",
    "targetModules": [
      "uiux"
    ],
    "skills": [
      "Design",
      "Ux Researcher",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-visual-storyteller",
    "folder": "design-visual-storyteller",
    "name": "Visual Storyteller Agent",
    "role": "Visual Storyteller",
    "description": "Expert visual communication specialist focused on creating compelling visual narratives, multimedia content, and brand storytelling through design. Specializes in transforming complex information into engaging visual stories that connect with audiences and drive emotional engagement.",
    "category": "design",
    "targetModules": [
      "uiux"
    ],
    "skills": [
      "Design",
      "Visual Storyteller",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-whimsy-injector",
    "folder": "design-whimsy-injector",
    "name": "Whimsy Injector Agent",
    "role": "Whimsy Injector",
    "description": "Expert creative specialist focused on adding personality, delight, and playful elements to brand experiences. Creates memorable, joyful interactions that differentiate brands through unexpected moments of whimsy",
    "category": "design",
    "targetModules": [
      "uiux"
    ],
    "skills": [
      "Design",
      "Whimsy Injector",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-ai-data-remediation-engineer",
    "folder": "engineering-ai-data-remediation-engineer",
    "name": "Ai Data Remediation Engineer Agent",
    "role": "Ai Data Remediation Engineer",
    "description": "\"Specialist in self-healing data pipelines — uses air-gapped local SLMs and semantic clustering to automatically detect, classify, and fix data anomalies at scale. Focuses exclusively on the remediation layer: intercepting bad data, generating deterministic fix logic via Ollama, and guaranteeing zero data loss. Not a general data engineer — a surgical specialist for when your data is broken and the pipeline can't stop.\"",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Ai Data Remediation Engineer"
    ]
  },
  {
    "id": "agency-ai-engineer",
    "folder": "engineering-ai-engineer",
    "name": "Ai Engineer Agent",
    "role": "Ai Engineer",
    "description": "Expert AI/ML engineer specializing in machine learning model development, deployment, and integration into production systems. Focused on building intelligent features, data pipelines, and AI-powered applications with emphasis on practical, scalable solutions.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Ai Engineer"
    ]
  },
  {
    "id": "agency-api-platform-engineer",
    "folder": "engineering-api-platform-engineer",
    "name": "Api Platform Engineer Agent",
    "role": "Api Platform Engineer",
    "description": "Expert API platform engineer for public and partner APIs — contract-first design (OpenAPI/gRPC), versioning and deprecation policy, SDK generation, API gateway concerns (auth, rate limiting, quotas), and developer-portal DX.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Api Platform Engineer"
    ]
  },
  {
    "id": "agency-autonomous-optimization-architect",
    "folder": "engineering-autonomous-optimization-architect",
    "name": "Autonomous Optimization Architect Agent",
    "role": "Autonomous Optimization Architect",
    "description": "Intelligent system governor that continuously shadow-tests APIs for performance while enforcing strict financial and security guardrails against runaway costs.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Autonomous Optimization Architect"
    ]
  },
  {
    "id": "agency-backend-architect",
    "folder": "engineering-backend-architect",
    "name": "Backend Architect Agent",
    "role": "Backend Architect",
    "description": "Senior backend architect specializing in scalable system design, database architecture, API development, and cloud infrastructure. Builds robust, secure, performant server-side applications and microservices",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Backend Architect"
    ]
  },
  {
    "id": "agency-cms-developer",
    "folder": "engineering-cms-developer",
    "name": "Cms Developer Agent",
    "role": "Cms Developer",
    "description": "Drupal and WordPress specialist for theme development, custom plugins/modules, content architecture, and code-first CMS implementation",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Cms Developer"
    ]
  },
  {
    "id": "agency-code-reviewer",
    "folder": "engineering-code-reviewer",
    "name": "Code Reviewer Agent",
    "role": "Code Reviewer",
    "description": "Expert code reviewer who provides constructive, actionable feedback focused on correctness, maintainability, security, and performance — not style preferences.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Code Reviewer"
    ]
  },
  {
    "id": "agency-codebase-onboarding-engineer",
    "folder": "engineering-codebase-onboarding-engineer",
    "name": "Codebase Onboarding Engineer Agent",
    "role": "Codebase Onboarding Engineer",
    "description": "Expert developer onboarding specialist who helps new engineers understand unfamiliar codebases fast by reading source code, tracing code paths, and stating only facts grounded in the code.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Codebase Onboarding Engineer"
    ]
  },
  {
    "id": "agency-data-engineer",
    "folder": "engineering-data-engineer",
    "name": "Data Engineer Agent",
    "role": "Data Engineer",
    "description": "Expert data engineer specializing in building reliable data pipelines, lakehouse architectures, and scalable data infrastructure. Masters ETL/ELT, Apache Spark, dbt, streaming systems, and cloud data platforms to turn raw data into trusted, analytics-ready assets.",
    "category": "engineering",
    "targetModules": [
      "brain"
    ],
    "skills": [
      "Engineering",
      "Data Engineer"
    ]
  },
  {
    "id": "agency-data-visualization-engineer",
    "folder": "engineering-data-visualization-engineer",
    "name": "Data Visualization Engineer Agent",
    "role": "Data Visualization Engineer",
    "description": "Expert data visualization engineer — chart-type selection by data and question, perceptually honest encodings, colorblind-safe data palettes, accessible and interactive charts, and rendering large datasets performantly with D3, Vega, and charting libraries.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Data Visualization Engineer"
    ]
  },
  {
    "id": "agency-database-reliability-engineer",
    "folder": "engineering-database-reliability-engineer",
    "name": "Database Reliability Engineer Agent",
    "role": "Database Reliability Engineer",
    "description": "Expert database reliability engineer (DBRE) — high availability and replication, automated failover, backup and point-in-time recovery, zero-downtime online schema migrations, connection pooling, and disaster-recovery drills. Focused on keeping data safe and available, not query tuning.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Database Reliability Engineer"
    ]
  },
  {
    "id": "agency-desktop-app-engineer",
    "folder": "engineering-desktop-app-engineer",
    "name": "Desktop App Engineer Agent",
    "role": "Desktop App Engineer",
    "description": "Expert desktop application engineer for Electron and Tauri — secure IPC and process isolation, code signing and notarization, auto-update pipelines, native OS integration, and resource-footprint discipline.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Desktop App Engineer"
    ]
  },
  {
    "id": "agency-devops-automator",
    "folder": "engineering-devops-automator",
    "name": "Devops Automator Agent",
    "role": "Devops Automator",
    "description": "Expert DevOps engineer specializing in infrastructure automation, CI/CD pipeline development, and cloud operations",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Devops Automator"
    ]
  },
  {
    "id": "agency-drupal-performance-engineer",
    "folder": "engineering-drupal-performance",
    "name": "Drupal Performance Engineer Agent",
    "role": "Drupal Performance Engineer",
    "description": "Expert Drupal 10/11 performance engineer specializing in Core Web Vitals, render and dynamic page caching, BigPipe, cache tags and contexts, database query and Views optimization, CSS/JS aggregation, responsive images and lazy loading, CDN integration, and opcache/PHP-FPM tuning for fast, audit-passing sites",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Drupal Performance Engineer"
    ]
  },
  {
    "id": "agency-drupal-shopping-cart-engineer",
    "folder": "engineering-drupal-shopping-cart",
    "name": "Drupal Shopping Cart Engineer Agent",
    "role": "Drupal Shopping Cart Engineer",
    "description": "Expert Drupal e-commerce engineer specializing in Drupal Commerce for product catalog management, payment gateway integration, checkout workflow design, order management, tax and promotion configuration, and high-reliability storefront delivery on Drupal 10/11",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Drupal Shopping Cart Engineer"
    ]
  },
  {
    "id": "agency-email-intelligence-engineer",
    "folder": "engineering-email-intelligence-engineer",
    "name": "Email Intelligence Engineer Agent",
    "role": "Email Intelligence Engineer",
    "description": "Expert in extracting structured, reasoning-ready data from raw email threads for AI agents and automation systems",
    "category": "engineering",
    "targetModules": [
      "brain"
    ],
    "skills": [
      "Engineering",
      "Email Intelligence Engineer"
    ]
  },
  {
    "id": "agency-filament-optimization-specialist",
    "folder": "engineering-filament-optimization-specialist",
    "name": "Filament Optimization Specialist Agent",
    "role": "Filament Optimization Specialist",
    "description": "Expert in restructuring and optimizing Filament PHP admin interfaces for maximum usability and efficiency. Focuses on impactful structural changes — not just cosmetic tweaks.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Filament Optimization Specialist"
    ]
  },
  {
    "id": "agency-finops-engineer",
    "folder": "engineering-finops-engineer",
    "name": "Finops Engineer Agent",
    "role": "Finops Engineer",
    "description": "Expert cloud cost engineer for AWS/GCP/Azure — cost allocation and tagging, rightsizing, commitment planning (reserved instances/savings plans), egress and storage optimization, and unit-economics dashboards that tie spend to business value.",
    "category": "engineering",
    "targetModules": [
      "performance"
    ],
    "skills": [
      "Engineering",
      "Finops Engineer"
    ]
  },
  {
    "id": "agency-frontend-developer",
    "folder": "engineering-frontend-developer",
    "name": "Frontend Developer Agent",
    "role": "Frontend Developer",
    "description": "Expert frontend developer specializing in modern web technologies, React/Vue/Angular frameworks, UI implementation, and performance optimization",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Frontend Developer"
    ]
  },
  {
    "id": "agency-git-workflow-master",
    "folder": "engineering-git-workflow-master",
    "name": "Git Workflow Master Agent",
    "role": "Git Workflow Master",
    "description": "Expert in Git workflows, branching strategies, and version control best practices including conventional commits, rebasing, worktrees, and CI-friendly branch management.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Git Workflow Master"
    ]
  },
  {
    "id": "agency-internationalization-engineer",
    "folder": "engineering-i18n-engineer",
    "name": "Internationalization Engineer Agent",
    "role": "Internationalization Engineer",
    "description": "Expert i18n engineer for ICU MessageFormat, CLDR plural rules, RTL and bidirectional layouts, locale-aware date/number/currency formatting, string extraction pipelines, and pseudo-localization testing.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Internationalization Engineer"
    ]
  },
  {
    "id": "agency-identity-access-engineer",
    "folder": "engineering-identity-access-engineer",
    "name": "Identity Access Engineer Agent",
    "role": "Identity Access Engineer",
    "description": "Expert identity engineer for OAuth 2.0/OIDC flows, enterprise SSO (SAML/OIDC) and SCIM provisioning, passkeys/WebAuthn, session architecture, and multi-tenant authorization with RBAC/ABAC.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Identity Access Engineer"
    ]
  },
  {
    "id": "agency-incident-response-commander",
    "folder": "engineering-incident-response-commander",
    "name": "Incident Response Commander Agent",
    "role": "Incident Response Commander",
    "description": "Expert incident commander specializing in production incident management, structured response coordination, post-mortem facilitation, SLO/SLI tracking, and on-call process design for reliable engineering organizations.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Incident Response Commander"
    ]
  },
  {
    "id": "agency-it-service-manager",
    "folder": "engineering-it-service-manager",
    "name": "It Service Manager Agent",
    "role": "It Service Manager",
    "description": "Expert IT service management specialist using ITIL 4 framework for service catalog design, incident and problem management, change control, SLA governance, CMDB maintenance, and continual service improvement — ensuring IT delivers reliable, measurable business value across any organization size",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "It Service Manager"
    ]
  },
  {
    "id": "agency-llm-post-training-engineer",
    "folder": "engineering-llm-post-training-engineer",
    "name": "Llm Post Training Engineer Agent",
    "role": "Llm Post Training Engineer",
    "description": "Evidence-driven owner for SFT, preference optimization, RLHF/RLVR, MoE post-training, and the release gates that turn a checkpoint into a defensible model change.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Llm Post Training Engineer"
    ]
  },
  {
    "id": "agency-minimal-change-engineer",
    "folder": "engineering-minimal-change-engineer",
    "name": "Minimal Change Engineer Agent",
    "role": "Minimal Change Engineer",
    "description": "Engineering specialist focused on minimum-viable diffs — fixes only what was asked, refuses scope creep, prefers three similar lines over a premature abstraction. The discipline that prevents bug-fix PRs from becoming refactor avalanches.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Minimal Change Engineer"
    ]
  },
  {
    "id": "agency-mobile-app-builder",
    "folder": "engineering-mobile-app-builder",
    "name": "Mobile App Builder Agent",
    "role": "Mobile App Builder",
    "description": "Specialized mobile application developer with expertise in native iOS/Android development and cross-platform frameworks",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Mobile App Builder",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-mobile-release-engineer",
    "folder": "engineering-mobile-release-engineer",
    "name": "Mobile Release Engineer Agent",
    "role": "Mobile Release Engineer",
    "description": "Expert mobile release and distribution engineer for iOS and Android — code signing, provisioning, fastlane pipelines, App Store Connect and Play Console submission, phased rollouts, and crash-triaged release health.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Mobile Release Engineer"
    ]
  },
  {
    "id": "agency-multi-agent-systems-architect",
    "folder": "engineering-multi-agent-systems-architect",
    "name": "Multi Agent Systems Architect Agent",
    "role": "Multi Systems Architect",
    "description": "Systems architect specializing in the design, coordination, and governance of multi-agent AI pipelines — covering topology selection, context management, inter-agent trust, failure recovery, human-in-the-loop gating, and observability for production-grade agent systems.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Multi Systems Architect"
    ]
  },
  {
    "id": "agency-orgscript-engineer",
    "folder": "engineering-orgscript-engineer",
    "name": "Orgscript Engineer Agent",
    "role": "Orgscript Engineer",
    "description": "Expert in designing, parsing, and implementing OrgScript grammar, AST validation, and business logic definitions.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Orgscript Engineer"
    ]
  },
  {
    "id": "agency-payments-billing-engineer",
    "folder": "engineering-payments-billing-engineer",
    "name": "Payments Billing Engineer Agent",
    "role": "Payments Billing Engineer",
    "description": "Expert payments engineer for PSP integrations (Stripe, Adyen, Braintree, PayPal), idempotent payment flows, webhook processing, subscription billing, SCA/3DS, PCI scope reduction, and financial reconciliation.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Payments Billing Engineer"
    ]
  },
  {
    "id": "agency-privacy-engineer",
    "folder": "engineering-privacy-engineer",
    "name": "Privacy Engineer Agent",
    "role": "Privacy Engineer",
    "description": "Expert privacy engineer who implements privacy in code — PII discovery and classification, data minimization, consent enforcement at the API layer, automated DSAR and deletion across services, pseudonymization/tokenization, and retention automation. Builds the technical controls a privacy policy only promises.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Privacy Engineer"
    ]
  },
  {
    "id": "agency-prompt-engineer",
    "folder": "engineering-prompt-engineer",
    "name": "Prompt Engineer Agent",
    "role": "Prompt Engineer",
    "description": "Specialist in crafting, testing, and systematically optimizing prompts for LLMs — turning vague instructions into reliable, production-grade AI behaviors.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Prompt Engineer"
    ]
  },
  {
    "id": "agency-rag-pipeline-engineer",
    "folder": "engineering-rag-pipeline-engineer",
    "name": "Rag Pipeline Engineer Agent",
    "role": "Rag Pipeline Engineer",
    "description": "Production RAG specialist focused on chunking strategy, retrieval quality, hybrid search, re-ranking, and eval-driven iteration. Builds pipelines that actually retrieve the right context — not just pipelines that run.",
    "category": "engineering",
    "targetModules": [
      "crm",
      "brain"
    ],
    "skills": [
      "Engineering",
      "Rag Pipeline Engineer"
    ]
  },
  {
    "id": "agency-rapid-prototyper",
    "folder": "engineering-rapid-prototyper",
    "name": "Rapid Prototyper Agent",
    "role": "Rapid Prototyper",
    "description": "Specialized in ultra-fast proof-of-concept development and MVP creation using efficient tools and frameworks",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Rapid Prototyper"
    ]
  },
  {
    "id": "agency-realtime-collaboration-engineer",
    "folder": "engineering-realtime-collaboration-engineer",
    "name": "Realtime Collaboration Engineer Agent",
    "role": "Realtime Collaboration Engineer",
    "description": "Expert realtime systems engineer for WebSocket/SSE infrastructure, presence, CRDT and OT-based collaborative editing, offline-first sync engines, and fan-out scaling with reconnect-safe protocols.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Realtime Collaboration Engineer"
    ]
  },
  {
    "id": "agency-rust-refactoring-specialist",
    "folder": "engineering-rust-refactoring-specialist",
    "name": "Rust Refactoring Specialist Agent",
    "role": "Rust Refactoring Specialist",
    "description": "Expert Rust engineer for repository-scale refactoring, safe renames, module restructuring, duplication removal, panic hardening, ownership improvements, and compiler or Clippy remediation.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Rust Refactoring Specialist"
    ]
  },
  {
    "id": "agency-search-relevance-engineer",
    "folder": "engineering-search-relevance-engineer",
    "name": "Search Relevance Engineer Agent",
    "role": "Search Relevance Engineer",
    "description": "Expert search engineer for Elasticsearch and OpenSearch — index and analyzer design, BM25 query tuning, hybrid lexical+vector retrieval, and judgment-based relevance evaluation with nDCG and online experiments.",
    "category": "engineering",
    "targetModules": [
      "authority",
      "brain"
    ],
    "skills": [
      "Engineering",
      "Search Relevance Engineer"
    ]
  },
  {
    "id": "agency-section-508-accessibility-specialist",
    "folder": "engineering-section-508-specialist",
    "name": "Section 508 Accessibility Specialist Agent",
    "role": "Section 508 Accessibility Specialist",
    "description": "Expert U.S. federal Section 508 accessibility engineer (the 508 legal baseline is WCAG 2.0 Level AA; WCAG 2.1/2.2 AA are recommended best practice, and ADA Title II requires WCAG 2.1 AA for state/local government) specializing in accessible web development, ARIA implementation, screen reader testing (JAWS/NVDA/VoiceOver), keyboard navigation, color contrast, accessible forms and PDFs, VPAT/ACR authoring, automated and manual auditing (axe/WAVE/Lighthouse), and remediation for government and enterprise sites",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Section 508 Accessibility Specialist"
    ]
  },
  {
    "id": "agency-senior-developer",
    "folder": "engineering-senior-developer",
    "name": "Senior Developer Agent",
    "role": "Senior Developer",
    "description": "Premium implementation specialist - Masters Laravel/Livewire/FluxUI, advanced CSS, Three.js integration",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Senior Developer"
    ]
  },
  {
    "id": "agency-software-architect",
    "folder": "engineering-software-architect",
    "name": "Software Architect Agent",
    "role": "Software Architect",
    "description": "Expert software architect specializing in system design, domain-driven design, architectural patterns, and technical decision-making for scalable, maintainable systems.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Software Architect"
    ]
  },
  {
    "id": "agency-sre-site-reliability-engineer",
    "folder": "engineering-sre",
    "name": "Sre Site Reliability Engineer Agent",
    "role": "Sre Site Reliability Engineer",
    "description": "Expert site reliability engineer specializing in SLOs, error budgets, observability, chaos engineering, and toil reduction for production systems at scale.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Sre Site Reliability Engineer"
    ]
  },
  {
    "id": "agency-technical-writer",
    "folder": "engineering-technical-writer",
    "name": "Technical Writer Agent",
    "role": "Technical Writer",
    "description": "Expert technical writer specializing in developer documentation, API references, README files, and tutorials. Transforms complex engineering concepts into clear, accurate, and engaging docs that developers actually read and use.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Technical Writer"
    ]
  },
  {
    "id": "agency-uswds-developer",
    "folder": "engineering-uswds-developer",
    "name": "Uswds Developer Agent",
    "role": "Uswds Developer",
    "description": "Expert U.S. Web Design System frontend developer specializing in USWDS components and design tokens, accessible-by-default patterns, responsive government UI, Sass settings/theming, the federal design language, integration into CMS platforms (Drupal/WordPress), and compliance with 21st Century IDEA and the Federal Website Standards",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Uswds Developer"
    ]
  },
  {
    "id": "agency-video-streaming-engineer",
    "folder": "engineering-video-streaming-engineer",
    "name": "Video Streaming Engineer Agent",
    "role": "Video Streaming Engineer",
    "description": "Expert video streaming engineer for adaptive bitrate delivery — HLS/DASH packaging, ffmpeg transcode ladders, CMAF low-latency, DRM, CDN delivery, and QoE-driven player tuning.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Video Streaming Engineer"
    ]
  },
  {
    "id": "agency-voice-ai-integration-engineer",
    "folder": "engineering-voice-ai-integration-engineer",
    "name": "Voice Ai Integration Engineer Agent",
    "role": "Voice Ai Integration Engineer",
    "description": "Expert in building end-to-end speech transcription pipelines using Whisper-style models and cloud ASR services — from raw audio ingestion through preprocessing, transcript cleanup, subtitle generation, speaker diarization, and structured downstream integration into apps, APIs, and CMS platforms.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Voice Ai Integration Engineer"
    ]
  },
  {
    "id": "agency-webassembly-engineer",
    "folder": "engineering-webassembly-engineer",
    "name": "Webassembly Engineer Agent",
    "role": "Webassembly Engineer",
    "description": "Expert WebAssembly engineer — compiling Rust/C++/Go to Wasm, JS interop and the boundary marshalling cost, WASI and server-side runtimes (Wasmtime/Wasmer), the component model, and near-native performance tuning.",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Webassembly Engineer"
    ]
  },
  {
    "id": "agency-wordpress-performance-engineer",
    "folder": "engineering-wordpress-performance",
    "name": "Wordpress Performance Engineer Agent",
    "role": "Wordpress Performance Engineer",
    "description": "Expert WordPress performance engineer specializing in Core Web Vitals, object caching (Redis/Memcached), page caching, database and WP_Query optimization, the Transients API, asset minification/deferral/critical CSS, image optimization and lazy loading, CDN integration, plugin performance auditing, and PHP-FPM/opcache tuning for fast, audit-passing sites",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Wordpress Performance Engineer"
    ]
  },
  {
    "id": "agency-wordpress-shopping-cart-engineer",
    "folder": "engineering-wordpress-shopping-cart",
    "name": "Wordpress Shopping Cart Engineer Agent",
    "role": "Wordpress Shopping Cart Engineer",
    "description": "Expert WordPress e-commerce engineer specializing in WooCommerce for product catalog management, payment gateway integration, checkout customization, order management, tax and coupon configuration, and conversion-optimized storefront delivery on WordPress",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Wordpress Shopping Cart Engineer"
    ]
  },
  {
    "id": "agency-esg-sustainability-officer",
    "folder": "esg-sustainability-officer",
    "name": "Esg Sustainability Officer Agent",
    "role": "Esg Sustainability Officer",
    "description": "Corporate sustainability strategist and ESG reporting specialist who builds environmental, social, and governance programs, manages disclosures, drives decarbonization initiatives, and aligns business strategy with stakeholder and regulatory expectations.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Esg Sustainability Officer"
    ]
  },
  {
    "id": "gemini-api-dev",
    "folder": "gemini-api-dev",
    "name": "Gemini Api Dev Agent",
    "role": "Gemini Api Dev",
    "description": "Use this skill when building applications with Gemini API hosted models, including Gemini and Gemma 4, working with multimodal content (text, images, audio, video), implementing function calling, using structured outputs, or needing current model specifications. Covers SDK usage (google-genai for Python, @google/genai for JavaScript/TypeScript, com.google.genai:google-genai for Java, google.golang.org/genai for Go), model selection, and API capabilities.",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Gemini Api Dev"
    ]
  },
  {
    "id": "gemini-interactions-api",
    "folder": "gemini-interactions-api",
    "name": "Gemini Interactions Api Agent",
    "role": "Gemini Interactions Api",
    "description": "Use this skill when writing code that calls the Gemini API for text generation, multi-turn chat, multimodal understanding, image generation, video generation, streaming responses, background research tasks, function calling, structured output, or migrating from the old generateContent API. This skill covers the Interactions API, the recommended way to use Gemini models and agents in Python and TypeScript.",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Gemini Interactions Api"
    ]
  },
  {
    "id": "agency-identity-graph-operator",
    "folder": "identity-graph-operator",
    "name": "Identity Graph Operator Agent",
    "role": "Identity Graph Operator",
    "description": "Operates a shared identity graph that multiple AI agents resolve against. Ensures every agent in a multi-agent system gets the same canonical answer for \"who is this entity?\" - deterministically, even under concurrent writes.",
    "category": "general",
    "targetModules": [
      "brain"
    ],
    "skills": [
      "General",
      "Identity Graph Operator"
    ]
  },
  {
    "id": "agency-language-translator",
    "folder": "language-translator",
    "name": "Language Translator Agent",
    "role": "Language Translator",
    "description": "Real-time Spanish ↔ English translation specialist with cultural context, regional dialect awareness, travel phrase guidance, and tone-appropriate communication for everyday, business, and emergency situations",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Language Translator"
    ]
  },
  {
    "id": "agency-m-a-integration-manager",
    "folder": "ma-integration-manager",
    "name": "M A Integration Manager Agent",
    "role": "M A Integration Manager",
    "description": "Mergers and acquisitions integration specialist who designs and executes post-merger integration programs — covering Day 1 readiness, 100-day planning, synergy tracking, cultural integration, functional workstream coordination, and transition service agreement management.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "M A Integration Manager"
    ]
  },
  {
    "id": "agency-aeo-foundations-architect",
    "folder": "marketing-aeo-foundations",
    "name": "Aeo Foundations Architect Agent",
    "role": "Aeo Foundations Architect",
    "description": "Expert in AI Engine Optimization infrastructure — implements llms.txt, AI-aware robots.txt, token-budgeted content, structured Markdown availability, and agent discovery files so AI crawlers, citation engines, and browsing agents can find, parse, and act on your site",
    "category": "marketing",
    "targetModules": [
      "growth",
      "authority"
    ],
    "skills": [
      "Marketing",
      "Aeo Foundations Architect"
    ]
  },
  {
    "id": "agency-agentic-search-optimizer",
    "folder": "marketing-agentic-search-optimizer",
    "name": "Agentic Search Optimizer Agent",
    "role": "Agentic Search Optimizer",
    "description": "Expert in WebMCP readiness and agentic task completion — audits whether AI agents can actually accomplish tasks on your site (book, buy, register, subscribe), implements WebMCP declarative and imperative patterns, and measures task completion rates across AI browsing agents",
    "category": "marketing",
    "targetModules": [
      "authority"
    ],
    "skills": [
      "Marketing",
      "Agentic Search Optimizer"
    ]
  },
  {
    "id": "agency-ai-citation-strategist",
    "folder": "marketing-ai-citation-strategist",
    "name": "Ai Citation Strategist Agent",
    "role": "Ai Citation Strategist",
    "description": "Expert in AI recommendation engine optimization (AEO/GEO) — audits brand visibility across ChatGPT, Claude, Gemini, and Perplexity, identifies why competitors get cited instead, and delivers content fixes that improve AI citations",
    "category": "marketing",
    "targetModules": [
      "growth",
      "authority"
    ],
    "skills": [
      "Marketing",
      "Ai Citation Strategist"
    ]
  },
  {
    "id": "agency-app-store-optimizer",
    "folder": "marketing-app-store-optimizer",
    "name": "App Store Optimizer Agent",
    "role": "App Store Optimizer",
    "description": "Expert app store marketing specialist focused on App Store Optimization (ASO), conversion rate optimization, and app discoverability",
    "category": "marketing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Marketing",
      "App Store Optimizer"
    ]
  },
  {
    "id": "agency-baidu-seo-specialist",
    "folder": "marketing-baidu-seo-specialist",
    "name": "Baidu Seo Specialist Agent",
    "role": "Baidu Seo Specialist",
    "description": "Expert Baidu search optimization specialist focused on Chinese search engine ranking, Baidu ecosystem integration, ICP compliance, Chinese keyword research, and mobile-first indexing for the China market.",
    "category": "marketing",
    "targetModules": [
      "authority"
    ],
    "skills": [
      "Marketing",
      "Baidu Seo Specialist",
      "Technical SEO",
      "AEO",
      "Keyword Research"
    ]
  },
  {
    "id": "agency-bilibili-content-strategist",
    "folder": "marketing-bilibili-content-strategist",
    "name": "Bilibili Content Strategist Agent",
    "role": "Bilibili Content Strategist",
    "description": "Expert Bilibili marketing specialist focused on UP主 growth, danmaku culture mastery, B站 algorithm optimization, community building, and branded content strategy for China's leading video community platform.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Bilibili Content Strategist",
      "Copywriting",
      "Content Strategy"
    ]
  },
  {
    "id": "agency-book-co-author",
    "folder": "marketing-book-co-author",
    "name": "Book Co Author Agent",
    "role": "Book Co Author",
    "description": "Strategic thought-leadership book collaborator for founders, experts, and operators turning voice notes, fragments, and positioning into structured first-person chapters.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Book Co Author"
    ]
  },
  {
    "id": "agency-carousel-growth-engine",
    "folder": "marketing-carousel-growth-engine",
    "name": "Carousel Growth Engine Agent",
    "role": "Carousel Growth Engine",
    "description": "Autonomous TikTok and Instagram carousel generation specialist. Analyzes any website URL with Playwright, generates viral 6-slide carousels via Gemini image generation, publishes directly to feed via Upload-Post API with auto trending music, fetches analytics, and iteratively improves through a data-driven learning loop.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Carousel Growth Engine"
    ]
  },
  {
    "id": "agency-china-market-localization-strategist",
    "folder": "marketing-china-market-localization-strategist",
    "name": "China Market Localization Strategist Agent",
    "role": "China Market Localization Strategist",
    "description": "Full-stack China market localization expert who transforms real-time trend signals into executable go-to-market strategies across Douyin, Xiaohongshu, WeChat, Bilibili, and beyond",
    "category": "marketing",
    "targetModules": [
      "competitors"
    ],
    "skills": [
      "Marketing",
      "China Market Localization Strategist"
    ]
  },
  {
    "id": "agency-content-creator",
    "folder": "marketing-content-creator",
    "name": "Content Creator Agent",
    "role": "Content Creator",
    "description": "Expert content strategist and creator for multi-platform campaigns. Develops editorial calendars, creates compelling copy, manages brand storytelling, and optimizes content for engagement across all digital channels.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Content Creator",
      "Copywriting",
      "Content Strategy"
    ]
  },
  {
    "id": "agency-douyin-strategist",
    "folder": "marketing-douyin-strategist",
    "name": "Douyin Strategist Agent",
    "role": "Douyin Strategist",
    "description": "Short-video marketing expert specializing in the Douyin platform, with deep expertise in recommendation algorithm mechanics, viral video planning, livestream commerce workflows, and full-funnel brand growth through content matrix strategies.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Douyin Strategist"
    ]
  },
  {
    "id": "agency-email-marketing-strategist",
    "folder": "marketing-email-strategist",
    "name": "Email Marketing Strategist Agent",
    "role": "Email Marketing Strategist",
    "description": "Expert email marketing strategist for CRM-driven campaigns, lifecycle automation, segmentation architecture, and deliverability. Designs sequences (welcome, nurture, reactivation, win-back, review, referral) grounded in 2025-2026 benchmarks, AI-driven personalization, and post-Apple MPP measurement.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Email Marketing Strategist"
    ]
  },
  {
    "id": "agency-growth-hacker",
    "folder": "marketing-growth-hacker",
    "name": "Growth Hacker Agent",
    "role": "Growth Hacker",
    "description": "Expert growth strategist specializing in rapid user acquisition through data-driven experimentation. Develops viral loops, optimizes conversion funnels, and finds scalable growth channels for exponential business growth.",
    "category": "marketing",
    "targetModules": [
      "growth"
    ],
    "skills": [
      "Marketing",
      "Growth Hacker"
    ]
  },
  {
    "id": "agency-instagram-curator",
    "folder": "marketing-instagram-curator",
    "name": "Instagram Curator Agent",
    "role": "Instagram Curator",
    "description": "Expert Instagram marketing specialist focused on visual storytelling, community building, and multi-format content optimization. Masters aesthetic development and drives meaningful engagement.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Instagram Curator"
    ]
  },
  {
    "id": "agency-kuaishou-strategist",
    "folder": "marketing-kuaishou-strategist",
    "name": "Kuaishou Strategist Agent",
    "role": "Kuaishou Strategist",
    "description": "Expert Kuaishou marketing strategist specializing in short-video content for China's lower-tier city markets, live commerce operations, community trust building, and grassroots audience growth on 快手.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Kuaishou Strategist"
    ]
  },
  {
    "id": "agency-linkedin-content-creator",
    "folder": "marketing-linkedin-content-creator",
    "name": "Linkedin Content Creator Agent",
    "role": "Linkedin Content Creator",
    "description": "Expert LinkedIn content strategist focused on thought leadership, personal brand building, and high-engagement professional content. Masters LinkedIn's algorithm and culture to drive inbound opportunities for founders, job seekers, developers, and anyone building a professional presence.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Linkedin Content Creator",
      "Copywriting",
      "Content Strategy"
    ]
  },
  {
    "id": "agency-multi-platform-publisher",
    "folder": "marketing-multi-platform-publisher",
    "name": "Multi Platform Publisher Agent",
    "role": "Multi Platform Publisher",
    "description": "Expert orchestrator for one-click Chinese blog publishing. Routes a single article to 知乎 / 小红书 / CSDN / B站 / 公众号 / 掘金 via Wechatsync (main channel) with xhs-mcp and biliup as specialized fallbacks. Handles per-platform content adaptation, draft-first publishing, rate control, and risk-avoidance. Does NOT auto-publish — always stops at draft for human review.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Multi Platform Publisher"
    ]
  },
  {
    "id": "agency-pr-communications-manager",
    "folder": "marketing-pr-communications-manager",
    "name": "Pr Communications Manager Agent",
    "role": "Pr Communications Manager",
    "description": "Strategic public relations and communications specialist for media relations, press releases, crisis communications, executive thought leadership, brand reputation management, and integrated communications planning — building and protecting reputations through earned media, storytelling, and proactive narrative control",
    "category": "marketing",
    "targetModules": [
      "authority"
    ],
    "skills": [
      "Marketing",
      "Pr Communications Manager"
    ]
  },
  {
    "id": "agency-private-domain-operator",
    "folder": "marketing-private-domain-operator",
    "name": "Private Domain Operator Agent",
    "role": "Private Domain Operator",
    "description": "Expert in building enterprise WeChat (WeCom) private domain ecosystems, with deep expertise in SCRM systems, segmented community operations, Mini Program commerce integration, user lifecycle management, and full-funnel conversion optimization.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Private Domain Operator"
    ]
  },
  {
    "id": "agency-reddit-community-builder",
    "folder": "marketing-reddit-community-builder",
    "name": "Reddit Community Builder Agent",
    "role": "Reddit Community Builder",
    "description": "Expert Reddit marketing specialist focused on authentic community engagement, value-driven content creation, and long-term relationship building. Masters Reddit culture navigation.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Reddit Community Builder",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-seo-specialist",
    "folder": "marketing-seo-specialist",
    "name": "Seo Specialist Agent",
    "role": "Seo Specialist",
    "description": "Expert search engine optimization strategist specializing in technical SEO, content optimization, link authority building, and organic search growth. Drives sustainable traffic through data-driven search strategies.",
    "category": "marketing",
    "targetModules": [
      "authority"
    ],
    "skills": [
      "Marketing",
      "Seo Specialist",
      "Technical SEO",
      "AEO",
      "Keyword Research"
    ]
  },
  {
    "id": "agency-short-video-editing-coach",
    "folder": "marketing-short-video-editing-coach",
    "name": "Short Video Editing Coach Agent",
    "role": "Short Video Editing Coach",
    "description": "Hands-on short-video editing coach covering the full post-production pipeline, with mastery of CapCut Pro, Premiere Pro, DaVinci Resolve, and Final Cut Pro across composition and camera language, color grading, audio engineering, motion graphics and VFX, subtitle design, multi-platform export optimization, editing workflow efficiency, and AI-assisted editing.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Short Video Editing Coach"
    ]
  },
  {
    "id": "agency-social-media-strategist",
    "folder": "marketing-social-media-strategist",
    "name": "Social Media Strategist Agent",
    "role": "Social Media Strategist",
    "description": "Expert social media strategist for LinkedIn, Twitter, and professional platforms. Creates cross-platform campaigns, builds communities, manages real-time engagement, and develops thought leadership strategies.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Social Media Strategist"
    ]
  },
  {
    "id": "agency-tiktok-strategist",
    "folder": "marketing-tiktok-strategist",
    "name": "Tiktok Strategist Agent",
    "role": "Tiktok Strategist",
    "description": "Expert TikTok marketing specialist focused on viral content creation, algorithm optimization, and community building. Masters TikTok's unique culture and features for brand growth.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Tiktok Strategist"
    ]
  },
  {
    "id": "agency-twitter-engager",
    "folder": "marketing-twitter-engager",
    "name": "Twitter Engager Agent",
    "role": "Twitter Engager",
    "description": "Expert Twitter marketing specialist focused on real-time engagement, thought leadership building, and community-driven growth. Builds brand authority through authentic conversation participation and viral thread creation.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Twitter Engager"
    ]
  },
  {
    "id": "agency-video-optimization-specialist",
    "folder": "marketing-video-optimization-specialist",
    "name": "Video Optimization Specialist Agent",
    "role": "Video Optimization Specialist",
    "description": "Video marketing strategist specializing in YouTube algorithm optimization, audience retention, chaptering, thumbnail concepts, and cross-platform video syndication.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Video Optimization Specialist"
    ]
  },
  {
    "id": "agency-wechat-official-account-manager",
    "folder": "marketing-wechat-official-account",
    "name": "Wechat Official Account Manager Agent",
    "role": "Wechat Official Account Manager",
    "description": "Expert WeChat Official Account (OA) strategist specializing in content marketing, subscriber engagement, and conversion optimization. Masters multi-format content and builds loyal communities through consistent value delivery.",
    "category": "marketing",
    "targetModules": [
      "content"
    ],
    "skills": [
      "Marketing",
      "Wechat Official Account Manager"
    ]
  },
  {
    "id": "agency-weibo-strategist",
    "folder": "marketing-weibo-strategist",
    "name": "Weibo Strategist Agent",
    "role": "Weibo Strategist",
    "description": "Full-spectrum operations expert for Sina Weibo, with deep expertise in trending topic mechanics, Super Topic community management, public sentiment monitoring, fan economy strategies, and Weibo advertising, helping brands achieve viral reach and sustained growth on China's leading public discourse platform.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Weibo Strategist"
    ]
  },
  {
    "id": "agency-x-twitter-intelligence-analyst",
    "folder": "marketing-x-twitter-intelligence-analyst",
    "name": "X Twitter Intelligence Analyst Agent",
    "role": "X Twitter Intelligence Analyst",
    "description": "Social intelligence specialist for X/Twitter research, trend detection, account monitoring, and evidence-backed audience insights using public signals and structured data workflows.",
    "category": "marketing",
    "targetModules": [
      "competitors",
      "social"
    ],
    "skills": [
      "Marketing",
      "X Twitter Intelligence Analyst"
    ]
  },
  {
    "id": "agency-xiaohongshu-specialist",
    "folder": "marketing-xiaohongshu-specialist",
    "name": "Xiaohongshu Specialist Agent",
    "role": "Xiaohongshu Specialist",
    "description": "Expert Xiaohongshu marketing specialist focused on lifestyle content, trend-driven strategies, and authentic community engagement. Masters micro-content creation and drives viral growth through aesthetic storytelling.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Xiaohongshu Specialist"
    ]
  },
  {
    "id": "agency-zhihu-strategist",
    "folder": "marketing-zhihu-strategist",
    "name": "Zhihu Strategist Agent",
    "role": "Zhihu Strategist",
    "description": "Expert Zhihu marketing specialist focused on thought leadership, community credibility, and knowledge-driven engagement. Masters question-answering strategy and builds brand authority through authentic expertise sharing.",
    "category": "marketing",
    "targetModules": [
      "social"
    ],
    "skills": [
      "Marketing",
      "Zhihu Strategist"
    ]
  },
  {
    "id": "agency-operations-manager",
    "folder": "operations-manager",
    "name": "Operations Manager Agent",
    "role": "Operations Manager",
    "description": "Business operations specialist who applies Lean, Six Sigma, and systems thinking to process mapping, capacity planning, KPI governance, vendor management, and organizational efficiency — turning operational complexity into repeatable, measurable performance.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Operations Manager"
    ]
  },
  {
    "id": "agency-organizational-psychologist",
    "folder": "organizational-psychologist",
    "name": "Organizational Psychologist Agent",
    "role": "Organizational Psychologist",
    "description": "Applied organizational psychologist who diagnoses team dynamics, psychological safety, burnout risk, and culture health — using evidence-based frameworks to help leaders build high-performing, resilient, and psychologically safe organizations.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Organizational Psychologist"
    ]
  },
  {
    "id": "agency-paid-media-auditor",
    "folder": "paid-media-auditor",
    "name": "Paid Media Auditor Agent",
    "role": "Paid Media Auditor",
    "description": "Comprehensive paid media auditor who systematically evaluates Google Ads, Microsoft Ads, and Meta accounts across 200+ checkpoints spanning account structure, tracking, bidding, creative, audiences, and competitive positioning. Produces actionable audit reports with prioritized recommendations and projected impact.",
    "category": "marketing",
    "targetModules": [
      "growth",
      "performance",
      "competitors"
    ],
    "skills": [
      "Marketing",
      "Paid Media Auditor",
      "Paid Media",
      "ROAS Optimization"
    ]
  },
  {
    "id": "agency-ad-creative-strategist",
    "folder": "paid-media-creative-strategist",
    "name": "Ad Creative Strategist Agent",
    "role": "Ad Creative Strategist",
    "description": "Paid media creative specialist focused on ad copywriting, RSA optimization, asset group design, and creative testing frameworks across Google, Meta, Microsoft, and programmatic platforms. Bridges the gap between performance data and persuasive messaging.",
    "category": "marketing",
    "targetModules": [
      "content",
      "performance"
    ],
    "skills": [
      "Marketing",
      "Ad Creative Strategist",
      "Paid Media",
      "ROAS Optimization"
    ]
  },
  {
    "id": "agency-paid-social-strategist",
    "folder": "paid-media-paid-social-strategist",
    "name": "Paid Social Strategist Agent",
    "role": "Paid Social Strategist",
    "description": "Cross-platform paid social advertising specialist covering Meta (Facebook/Instagram), LinkedIn, TikTok, Pinterest, X, and Snapchat. Designs full-funnel social ad programs from prospecting through retargeting with platform-specific creative and audience strategies.",
    "category": "marketing",
    "targetModules": [
      "performance"
    ],
    "skills": [
      "Marketing",
      "Paid Social Strategist",
      "Paid Media",
      "ROAS Optimization"
    ]
  },
  {
    "id": "agency-ppc-campaign-strategist",
    "folder": "paid-media-ppc-strategist",
    "name": "Ppc Campaign Strategist Agent",
    "role": "Ppc Campaign Strategist",
    "description": "Senior paid media strategist specializing in large-scale search, shopping, and performance max campaign architecture across Google, Microsoft, and Amazon ad platforms. Designs account structures, budget allocation frameworks, and bidding strategies that scale from $10K to $10M+ monthly spend.",
    "category": "marketing",
    "targetModules": [
      "performance"
    ],
    "skills": [
      "Marketing",
      "Ppc Campaign Strategist",
      "Paid Media",
      "ROAS Optimization"
    ]
  },
  {
    "id": "agency-programmatic-display-buyer",
    "folder": "paid-media-programmatic-buyer",
    "name": "Programmatic Display Buyer Agent",
    "role": "Programmatic Display Buyer",
    "description": "Display advertising and programmatic media buying specialist covering managed placements, Google Display Network, DV360, trade desk platforms, partner media (newsletters, sponsored content), and ABM display strategies via platforms like Demandbase and 6Sense.",
    "category": "marketing",
    "targetModules": [
      "performance"
    ],
    "skills": [
      "Marketing",
      "Programmatic Display Buyer",
      "Paid Media",
      "ROAS Optimization"
    ]
  },
  {
    "id": "agency-search-query-analyst",
    "folder": "paid-media-search-query-analyst",
    "name": "Search Query Analyst Agent",
    "role": "Search Query Analyst",
    "description": "Specialist in search term analysis, negative keyword architecture, and query-to-intent mapping. Turns raw search query data into actionable optimizations that eliminate waste and amplify high-intent traffic across paid search accounts.",
    "category": "marketing",
    "targetModules": [
      "performance"
    ],
    "skills": [
      "Marketing",
      "Search Query Analyst",
      "Paid Media",
      "ROAS Optimization"
    ]
  },
  {
    "id": "agency-tracking-measurement-specialist",
    "folder": "paid-media-tracking-specialist",
    "name": "Tracking Measurement Specialist Agent",
    "role": "Tracking Measurement Specialist",
    "description": "Expert in conversion tracking architecture, tag management, and attribution modeling across Google Tag Manager, GA4, Google Ads, Meta CAPI, LinkedIn Insight Tag, and server-side implementations. Ensures every conversion is counted correctly and every dollar of ad spend is measurable.",
    "category": "marketing",
    "targetModules": [
      "performance"
    ],
    "skills": [
      "Marketing",
      "Tracking Measurement Specialist",
      "Paid Media",
      "ROAS Optimization"
    ]
  },
  {
    "id": "agency-personal-growth-mentor",
    "folder": "personal-growth-mentor",
    "name": "Personal Growth Mentor Agent",
    "role": "Personal Growth Mentor",
    "description": "Cross-domain personal development mentor for goal clarity, habit design, strategic decisions, and accountability without motivational fluff.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Personal Growth Mentor"
    ]
  },
  {
    "id": "agency-behavioral-nudge-engine",
    "folder": "product-behavioral-nudge-engine",
    "name": "Behavioral Nudge Engine Agent",
    "role": "Behavioral Nudge Engine",
    "description": "Behavioral psychology specialist that adapts software interaction cadences and styles to maximize user motivation and success.",
    "category": "product",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Product",
      "Behavioral Nudge Engine"
    ]
  },
  {
    "id": "agency-feedback-synthesizer",
    "folder": "product-feedback-synthesizer",
    "name": "Feedback Synthesizer Agent",
    "role": "Feedback Synthesizer",
    "description": "Expert in collecting, analyzing, and synthesizing user feedback from multiple channels to extract actionable product insights. Transforms qualitative feedback into quantitative priorities and strategic recommendations.",
    "category": "product",
    "targetModules": [
      "growth"
    ],
    "skills": [
      "Product",
      "Feedback Synthesizer"
    ]
  },
  {
    "id": "agency-product-manager",
    "folder": "product-manager",
    "name": "Product Manager Agent",
    "role": "Product Manager",
    "description": "Holistic product leader who owns the full product lifecycle — from discovery and strategy through roadmap, stakeholder alignment, go-to-market, and outcome measurement. Bridges business goals, user needs, and technical reality to ship the right thing at the right time.",
    "category": "product",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Product",
      "Product Manager"
    ]
  },
  {
    "id": "agency-sprint-prioritizer",
    "folder": "product-sprint-prioritizer",
    "name": "Sprint Prioritizer Agent",
    "role": "Sprint Prioritizer",
    "description": "Expert product manager specializing in agile sprint planning, feature prioritization, and resource allocation. Focused on maximizing team velocity and business value delivery through data-driven prioritization frameworks.",
    "category": "product",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Product",
      "Sprint Prioritizer"
    ]
  },
  {
    "id": "agency-trend-researcher",
    "folder": "product-trend-researcher",
    "name": "Trend Researcher Agent",
    "role": "Trend Researcher",
    "description": "Expert market intelligence analyst specializing in identifying emerging trends, competitive analysis, and opportunity assessment. Focused on providing actionable insights that drive product strategy and innovation decisions.",
    "category": "product",
    "targetModules": [
      "growth",
      "competitors"
    ],
    "skills": [
      "Product",
      "Trend Researcher"
    ]
  },
  {
    "id": "agency-experiment-tracker",
    "folder": "project-management-experiment-tracker",
    "name": "Experiment Tracker Agent",
    "role": "Experiment Tracker",
    "description": "Expert project manager specializing in experiment design, execution tracking, and data-driven decision making. Focused on managing A/B tests, feature experiments, and hypothesis validation through systematic experimentation and rigorous analysis.",
    "category": "operations",
    "targetModules": [
      "simulation"
    ],
    "skills": [
      "Operations",
      "Experiment Tracker"
    ]
  },
  {
    "id": "agency-jira-workflow-steward",
    "folder": "project-management-jira-workflow-steward",
    "name": "Jira Workflow Steward Agent",
    "role": "Jira Workflow Steward",
    "description": "Expert delivery operations specialist who enforces Jira-linked Git workflows, traceable commits, structured pull requests, and release-safe branch strategy across software teams.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Jira Workflow Steward"
    ]
  },
  {
    "id": "agency-meeting-notes-specialist",
    "folder": "project-management-meeting-notes-specialist",
    "name": "Meeting Notes Specialist Agent",
    "role": "Meeting Notes Specialist",
    "description": "Extract structured decisions, action items, and open questions from meeting transcripts or rough notes into a clean 4-section summary.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Meeting Notes Specialist"
    ]
  },
  {
    "id": "agency-project-shepherd",
    "folder": "project-management-project-shepherd",
    "name": "Project Shepherd Agent",
    "role": "Project Shepherd",
    "description": "Expert project manager specializing in cross-functional project coordination, timeline management, and stakeholder alignment. Focused on shepherding projects from conception to completion while managing resources, risks, and communications across multiple teams and departments.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Project Shepherd"
    ]
  },
  {
    "id": "agency-studio-operations",
    "folder": "project-management-studio-operations",
    "name": "Studio Operations Agent",
    "role": "Studio Operations",
    "description": "Expert operations manager specializing in day-to-day studio efficiency, process optimization, and resource coordination. Focused on ensuring smooth operations, maintaining productivity standards, and supporting all teams with the tools and processes needed for success.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Studio Operations"
    ]
  },
  {
    "id": "agency-studio-producer",
    "folder": "project-management-studio-producer",
    "name": "Studio Producer Agent",
    "role": "Studio Producer",
    "description": "Senior strategic leader specializing in high-level creative and technical project orchestration, resource allocation, and multi-project portfolio management. Focused on aligning creative vision with business objectives while managing complex cross-functional initiatives and ensuring optimal studio operations.",
    "category": "operations",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Operations",
      "Studio Producer"
    ]
  },
  {
    "id": "agency-senior-project-manager",
    "folder": "project-manager-senior",
    "name": "Senior Project Manager Agent",
    "role": "Senior Project Manager",
    "description": "Converts specs to tasks and remembers previous projects. Focused on realistic scope, no background processes, exact spec requirements",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Senior Project Manager"
    ]
  },
  {
    "id": "agency-report-distribution-agent",
    "folder": "report-distribution-agent",
    "name": "Report Distribution Agent Agent",
    "role": "Report Distribution",
    "description": "AI agent that automates distribution of consolidated sales reports to representatives based on territorial parameters",
    "category": "general",
    "targetModules": [
      "reporting"
    ],
    "skills": [
      "General",
      "Report Distribution"
    ]
  },
  {
    "id": "agency-resume-tailor",
    "folder": "resume-tailor",
    "name": "Resume Tailor Agent",
    "role": "Resume Tailor",
    "description": "Candidate-side resume optimization specialist who analyzes job descriptions, maps real experience to role requirements, improves ATS keyword alignment, and rewrites bullets without fabricating qualifications.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Resume Tailor"
    ]
  },
  {
    "id": "agency-retail-customer-returns",
    "folder": "retail-customer-returns",
    "name": "Retail Customer Returns Agent",
    "role": "Retail Customer Returns",
    "description": "Comprehensive retail customer returns specialist for processing returns, exchanges, and refunds across in-store, online, and omnichannel retail — handling policy enforcement, fraud prevention, customer retention, vendor returns, and returns analytics to maximize recovery while preserving customer loyalty",
    "category": "support",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Support",
      "Retail Customer Returns"
    ]
  },
  {
    "id": "agency-account-strategist",
    "folder": "sales-account-strategist",
    "name": "Account Strategist Agent",
    "role": "Account Strategist",
    "description": "Expert post-sale account strategist specializing in land-and-expand execution, stakeholder mapping, QBR facilitation, and net revenue retention. Turns closed deals into long-term platform relationships through systematic expansion planning and multi-threaded account development.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Account Strategist",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-sales-coach",
    "folder": "sales-coach",
    "name": "Sales Coach Agent",
    "role": "Sales Coach",
    "description": "Expert sales coaching specialist focused on rep development, pipeline review facilitation, call coaching, deal strategy, and forecast accuracy. Makes every rep and every deal better through structured coaching methodology and behavioral feedback.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Sales Coach",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-sales-data-extraction-agent",
    "folder": "sales-data-extraction-agent",
    "name": "Sales Data Extraction Agent Agent",
    "role": "Sales Data Extraction",
    "description": "AI agent specialized in monitoring Excel files and extracting key sales metrics (MTD, YTD, Year End) for internal live reporting",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Sales Data Extraction",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-deal-strategist",
    "folder": "sales-deal-strategist",
    "name": "Deal Strategist Agent",
    "role": "Deal Strategist",
    "description": "Senior deal strategist specializing in MEDDPICC qualification, competitive positioning, and win planning for complex B2B sales cycles. Scores opportunities, exposes pipeline risk, and builds deal strategies that survive forecast review.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Deal Strategist",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-discovery-coach",
    "folder": "sales-discovery-coach",
    "name": "Discovery Coach Agent",
    "role": "Discovery Coach",
    "description": "Coaches sales teams on elite discovery methodology — question design, current-state mapping, gap quantification, and call structure that surfaces real buying motivation.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Discovery Coach",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-sales-engineer",
    "folder": "sales-engineer",
    "name": "Sales Engineer Agent",
    "role": "Sales Engineer",
    "description": "Senior pre-sales engineer specializing in technical discovery, demo engineering, POC scoping, competitive battlecards, and bridging product capabilities to business outcomes. Wins the technical decision so the deal can close.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Sales Engineer",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-offer-lead-gen-strategist",
    "folder": "sales-offer-lead-gen-strategist",
    "name": "Offer Lead Gen Strategist Agent",
    "role": "Offer Lead Gen Strategist",
    "description": "Top-of-funnel architect who designs irresistible offers and lead magnets that attract qualified buyers at scale. Specializes in value-equation offer construction, lead magnet typology, multi-channel lead generation, and compounding reach through customers, employees, agencies, and affiliates.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Offer Lead Gen Strategist",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-outbound-strategist",
    "folder": "sales-outbound-strategist",
    "name": "Outbound Strategist Agent",
    "role": "Outbound Strategist",
    "description": "Signal-based outbound specialist who designs multi-channel prospecting sequences, defines ICPs, and builds pipeline through research-driven personalization — not volume.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Outbound Strategist",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-sales-outreach",
    "folder": "sales-outreach",
    "name": "Sales Outreach Agent",
    "role": "Sales Outreach",
    "description": "Consultative B2B sales outreach specialist for cold prospecting, lead follow-up, objection handling, proposal writing, and pipeline management — combining data-driven targeting with genuine relationship-building to open doors and close deals",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Sales Outreach",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-pipeline-analyst",
    "folder": "sales-pipeline-analyst",
    "name": "Pipeline Analyst Agent",
    "role": "Pipeline Analyst",
    "description": "Revenue operations analyst specializing in pipeline health diagnostics, deal velocity analysis, forecast accuracy, and data-driven sales coaching. Turns CRM data into actionable pipeline intelligence that surfaces risks before they become missed quarters.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Pipeline Analyst",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-proposal-strategist",
    "folder": "sales-proposal-strategist",
    "name": "Proposal Strategist Agent",
    "role": "Proposal Strategist",
    "description": "Strategic proposal architect who transforms RFPs and sales opportunities into compelling win narratives. Specializes in win theme development, competitive positioning, executive summary craft, and building proposals that persuade rather than merely comply.",
    "category": "sales",
    "targetModules": [
      "crm"
    ],
    "skills": [
      "Sales",
      "Proposal Strategist",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-ai-generated-code-security-auditor",
    "folder": "security-ai-generated-code-auditor",
    "name": "Ai Generated Code Security Auditor Agent",
    "role": "Ai Generated Code Security Auditor",
    "description": "Security reviewer for AI-generated and vibe-coded apps — hunts the hardcoded secrets, broken row-level security, and prompt-injection sinks that coding assistants ship by default, then drives a scan, fix, and rescan loop with honest, CWE-mapped findings.",
    "category": "security",
    "targetModules": [
      "growth"
    ],
    "skills": [
      "Security",
      "Ai Generated Code Security Auditor",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-application-security-engineer",
    "folder": "security-appsec-engineer",
    "name": "Application Security Engineer Agent",
    "role": "Application Security Engineer",
    "description": "AppSec specialist who secures the software development lifecycle through threat modeling, secure code review, SAST/DAST integration, and developer security education that makes secure code the default.",
    "category": "security",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Security",
      "Application Security Engineer",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-security-architect",
    "folder": "security-architect",
    "name": "Security Architect Agent",
    "role": "Security Architect",
    "description": "Expert security architect specializing in threat modeling, secure-by-design architecture, trust-boundary analysis, defense-in-depth, and risk-based security reviews across web, API, cloud-native, and distributed systems. Designs the security model; hands code-level SAST/DAST and SDLC work to the AppSec Engineer.",
    "category": "security",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Security",
      "Security Architect",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-cloud-security-architect",
    "folder": "security-cloud-security-architect",
    "name": "Cloud Security Architect Agent",
    "role": "Cloud Security Architect",
    "description": "Cloud-native security specialist designing zero trust architectures, implementing defense-in-depth across AWS, Azure, and GCP, and securing infrastructure-as-code pipelines from day one.",
    "category": "security",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Security",
      "Cloud Security Architect",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-compliance-auditor",
    "folder": "security-compliance-auditor",
    "name": "Compliance Auditor Agent",
    "role": "Compliance Auditor",
    "description": "Expert technical compliance auditor specializing in SOC 2, ISO 27001, HIPAA, and PCI-DSS audits — from readiness assessment through evidence collection to certification.",
    "category": "security",
    "targetModules": [
      "growth"
    ],
    "skills": [
      "Security",
      "Compliance Auditor",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-incident-responder",
    "folder": "security-incident-responder",
    "name": "Incident Responder Agent",
    "role": "Incident Responder",
    "description": "Digital forensics and incident response specialist who leads breach investigations, contains active threats, coordinates crisis response, and writes post-mortems that prevent recurrence.",
    "category": "security",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Security",
      "Incident Responder",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-penetration-tester",
    "folder": "security-penetration-tester",
    "name": "Penetration Tester Agent",
    "role": "Penetration Tester",
    "description": "Offensive security specialist conducting authorized penetration tests, red team operations, and vulnerability assessments across networks, web applications, and cloud infrastructure.",
    "category": "security",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Security",
      "Penetration Tester",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-secrets-credential-hygiene-engineer",
    "folder": "security-secrets-credential-engineer",
    "name": "Secrets Credential Hygiene Engineer Agent",
    "role": "Secrets Credential Hygiene Engineer",
    "description": "Owns the full lifecycle of secrets and credentials — detection, prevention, vaulting, rotation, and leak response — so an application runs on short-lived, least-privilege credentials that are never in the code and are already rotated by the time a leak is found.",
    "category": "security",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Security",
      "Secrets Credential Hygiene Engineer",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-senior-secops-engineer",
    "folder": "security-senior-secops",
    "name": "Senior Secops Engineer Agent",
    "role": "Senior Secops Engineer",
    "description": "Defensive application security specialist who scans every code submission for secrets and sensitive data exposure before anything else, then implements or audits security controls following the organization's security standard — covering authentication, authorization, tokens, cookies, HTTP headers, CORS, rate limiting, CSP, secrets management, input validation, and secure logging.",
    "category": "security",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Security",
      "Senior Secops Engineer",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-threat-detection-engineer",
    "folder": "security-threat-detection-engineer",
    "name": "Threat Detection Engineer Agent",
    "role": "Threat Detection Engineer",
    "description": "Expert detection engineer specializing in SIEM rule development, MITRE ATT&CK coverage mapping, threat hunting, alert tuning, and detection-as-code pipelines for security operations teams.",
    "category": "security",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Security",
      "Threat Detection Engineer",
      "Security Audit",
      "Threat Detection"
    ]
  },
  {
    "id": "agency-chief-of-staff",
    "folder": "specialized-chief-of-staff",
    "name": "Chief Of Staff Agent",
    "role": "Chief Of Staff",
    "description": "Master coordinator for founders and executives — filters noise, owns processes, enforces consistency, routes decisions, and positions outputs for impact so the boss can think clearly.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Chief Of Staff"
    ]
  },
  {
    "id": "agency-cultural-intelligence-strategist",
    "folder": "specialized-cultural-intelligence-strategist",
    "name": "Cultural Intelligence Strategist Agent",
    "role": "Cultural Intelligence Strategist",
    "description": "CQ specialist that detects invisible exclusion, researches global context, and ensures software resonates authentically across intersectional identities.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Cultural Intelligence Strategist"
    ]
  },
  {
    "id": "agency-developer-advocate",
    "folder": "specialized-developer-advocate",
    "name": "Developer Advocate Agent",
    "role": "Developer Advocate",
    "description": "Expert developer advocate specializing in building developer communities, creating compelling technical content, optimizing developer experience (DX), and driving platform adoption through authentic engineering engagement. Bridges product and engineering teams with external developers.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Developer Advocate"
    ]
  },
  {
    "id": "agency-document-generator",
    "folder": "specialized-document-generator",
    "name": "Document Generator Agent",
    "role": "Document Generator",
    "description": "Expert document creation specialist who generates professional PDF, PPTX, DOCX, and XLSX files using code-based approaches with proper formatting, charts, and data visualization.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Document Generator"
    ]
  },
  {
    "id": "agency-fedramp-rmf-compliance-engineer",
    "folder": "specialized-fedramp-rmf-compliance",
    "name": "Fedramp Rmf Compliance Engineer Agent",
    "role": "Fedramp Rmf Compliance Engineer",
    "description": "Expert FedRAMP and NIST Risk Management Framework compliance engineer specializing in both FedRAMP authorization pathways — the traditional Rev5 path (NIST 800-53 Rev 5 control implementation, System Security Plans, 3PAO assessment, agency authorization) and the modernized FedRAMP 20x path (Key Security Indicators, automated machine-readable validation, compliance-as-code) — plus the ATO process, continuous monitoring (ConMon), POA&M management, FIPS 199 categorization, authorization boundary diagrams, OSCAL machine-readable packages, and cloud security compliance for government and regulated industries",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Fedramp Rmf Compliance Engineer"
    ]
  },
  {
    "id": "agency-mcp-builder",
    "folder": "specialized-mcp-builder",
    "name": "Mcp Builder Agent",
    "role": "Mcp Builder",
    "description": "Expert Model Context Protocol developer who designs, builds, and tests MCP servers that extend AI agent capabilities with custom tools, resources, and prompts.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Mcp Builder",
      "UI Design",
      "UX Architecture"
    ]
  },
  {
    "id": "agency-model-qa-specialist",
    "folder": "specialized-model-qa",
    "name": "Model Qa Specialist Agent",
    "role": "Model Qa Specialist",
    "description": "Independent model QA expert who audits ML and statistical models end-to-end - from documentation review and data reconstruction to replication, calibration testing, interpretability analysis, performance monitoring, and audit-grade reporting.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Model Qa Specialist"
    ]
  },
  {
    "id": "agency-pricing-analyst",
    "folder": "specialized-pricing-analyst",
    "name": "Pricing Analyst Agent",
    "role": "Pricing Analyst",
    "description": "Specialized pricing analyst who develops optimal pricing models through market research, competitor analysis, cost structure evaluation, and margin optimization — turning pricing from guesswork into a data-driven competitive advantage.",
    "category": "specialized",
    "targetModules": [
      "growth",
      "competitors"
    ],
    "skills": [
      "Specialized",
      "Pricing Analyst"
    ]
  },
  {
    "id": "agency-salesforce-architect",
    "folder": "specialized-salesforce-architect",
    "name": "Salesforce Architect Agent",
    "role": "Salesforce Architect",
    "description": "Solution architecture for Salesforce platform — multi-cloud design, integration patterns, governor limits, deployment strategy, and data model governance for enterprise-scale orgs",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Salesforce Architect",
      "B2B Pipeline",
      "Deal Strategy"
    ]
  },
  {
    "id": "agency-strategy-duel-agent",
    "folder": "specialized-strategy-duel-agent",
    "name": "Strategy Duel Agent Agent",
    "role": "Strategy Duel",
    "description": "Conducts live strategy duels using game theory and the 36 Chinese stratagems",
    "category": "specialized",
    "targetModules": [
      "competitors"
    ],
    "skills": [
      "Specialized",
      "Strategy Duel"
    ]
  },
  {
    "id": "agency-workflow-architect",
    "folder": "specialized-workflow-architect",
    "name": "Workflow Architect Agent",
    "role": "Workflow Architect",
    "description": "Workflow design specialist who maps complete workflow trees for every system, user journey, and agent interaction — covering happy paths, all branch conditions, failure modes, recovery paths, handoff contracts, and observable states to produce build-ready specs that agents can implement against and QA can test against.",
    "category": "specialized",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Specialized",
      "Workflow Architect"
    ]
  },
  {
    "id": "agency-supply-chain-strategist",
    "folder": "supply-chain-strategist",
    "name": "Supply Chain Strategist Agent",
    "role": "Supply Chain Strategist",
    "description": "Expert supply chain management and procurement strategy specialist — skilled in supplier development, strategic sourcing, quality control, and supply chain digitalization. Grounded in China's manufacturing ecosystem, helps companies build efficient, resilient, and sustainable supply chains.",
    "category": "general",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "General",
      "Supply Chain Strategist"
    ]
  },
  {
    "id": "agency-analytics-reporter",
    "folder": "support-analytics-reporter",
    "name": "Analytics Reporter Agent",
    "role": "Analytics Reporter",
    "description": "Expert data analyst transforming raw data into actionable business insights. Creates dashboards, performs statistical analysis, tracks KPIs, and provides strategic decision support through data visualization and reporting.",
    "category": "support",
    "targetModules": [
      "performance",
      "reporting"
    ],
    "skills": [
      "Support",
      "Analytics Reporter"
    ]
  },
  {
    "id": "agency-executive-summary-generator",
    "folder": "support-executive-summary-generator",
    "name": "Executive Summary Generator Agent",
    "role": "Executive Summary Generator",
    "description": "Consultant-grade AI specialist trained to think and communicate like a senior strategy consultant. Transforms complex business inputs into concise, actionable executive summaries using McKinsey SCQA, BCG Pyramid Principle, and Bain frameworks for C-suite decision-makers.",
    "category": "support",
    "targetModules": [
      "reporting"
    ],
    "skills": [
      "Support",
      "Executive Summary Generator"
    ]
  },
  {
    "id": "agency-finance-tracker",
    "folder": "support-finance-tracker",
    "name": "Finance Tracker Agent",
    "role": "Finance Tracker",
    "description": "Expert financial analyst and controller specializing in financial planning, budget management, and business performance analysis. Maintains financial health, optimizes cash flow, and provides strategic financial insights for business growth.",
    "category": "support",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Support",
      "Finance Tracker"
    ]
  },
  {
    "id": "agency-infrastructure-maintainer",
    "folder": "support-infrastructure-maintainer",
    "name": "Infrastructure Maintainer Agent",
    "role": "Infrastructure Maintainer",
    "description": "Expert infrastructure specialist focused on system reliability, performance optimization, and technical operations management. Maintains robust, scalable infrastructure supporting business operations with security, performance, and cost efficiency.",
    "category": "support",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Support",
      "Infrastructure Maintainer"
    ]
  },
  {
    "id": "agency-support-responder",
    "folder": "support-support-responder",
    "name": "Support Responder Agent",
    "role": "Support Responder",
    "description": "Expert customer support specialist delivering exceptional customer service, issue resolution, and user experience optimization. Specializes in multi-channel support, proactive customer care, and turning support interactions into positive brand experiences.",
    "category": "support",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Support",
      "Support Responder"
    ]
  },
  {
    "id": "agency-accessibility-auditor",
    "folder": "testing-accessibility-auditor",
    "name": "Accessibility Auditor Agent",
    "role": "Accessibility Auditor",
    "description": "Expert accessibility specialist who audits interfaces against WCAG standards, tests with assistive technologies, and ensures inclusive design. Defaults to finding barriers — if it's not tested with a screen reader, it's not accessible.",
    "category": "testing",
    "targetModules": [
      "growth",
      "uiux"
    ],
    "skills": [
      "Testing",
      "Accessibility Auditor"
    ]
  },
  {
    "id": "agency-api-tester",
    "folder": "testing-api-tester",
    "name": "Api Tester Agent",
    "role": "Api Tester",
    "description": "Expert API testing specialist focused on comprehensive API validation, performance testing, and quality assurance across all systems and third-party integrations",
    "category": "testing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Testing",
      "Api Tester"
    ]
  },
  {
    "id": "agency-evidence-collector",
    "folder": "testing-evidence-collector",
    "name": "Evidence Collector Agent",
    "role": "Evidence Collector",
    "description": "Screenshot-obsessed, fantasy-allergic QA specialist - Default to finding 3-5 issues, requires visual proof for everything",
    "category": "testing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Testing",
      "Evidence Collector"
    ]
  },
  {
    "id": "agency-performance-benchmarker",
    "folder": "testing-performance-benchmarker",
    "name": "Performance Benchmarker Agent",
    "role": "Performance Benchmarker",
    "description": "Expert performance testing and optimization specialist focused on measuring, analyzing, and improving system performance across all applications and infrastructure",
    "category": "testing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Testing",
      "Performance Benchmarker"
    ]
  },
  {
    "id": "agency-reality-checker",
    "folder": "testing-reality-checker",
    "name": "Reality Checker Agent",
    "role": "Reality Checker",
    "description": "Stops fantasy approvals, evidence-based certification - Default to \"NEEDS WORK\", requires overwhelming proof for production readiness",
    "category": "testing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Testing",
      "Reality Checker"
    ]
  },
  {
    "id": "agency-test-automation-engineer",
    "folder": "testing-test-automation-engineer",
    "name": "Test Automation Engineer Agent",
    "role": "Test Automation Engineer",
    "description": "Expert end-to-end test automation engineer for Playwright and Cypress — resilient selectors, flake elimination, isolated test data, CI parallelization, and trace-driven failure debugging.",
    "category": "testing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Testing",
      "Test Automation Engineer"
    ]
  },
  {
    "id": "agency-test-results-analyzer",
    "folder": "testing-test-results-analyzer",
    "name": "Test Results Analyzer Agent",
    "role": "Test Results Analyzer",
    "description": "Expert test analysis specialist focused on comprehensive test result evaluation, quality metrics analysis, and actionable insight generation from testing activities",
    "category": "testing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Testing",
      "Test Results Analyzer"
    ]
  },
  {
    "id": "agency-tool-evaluator",
    "folder": "testing-tool-evaluator",
    "name": "Tool Evaluator Agent",
    "role": "Tool Evaluator",
    "description": "Expert technology assessment specialist focused on evaluating, testing, and recommending tools, software, and platforms for business use and productivity optimization",
    "category": "testing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Testing",
      "Tool Evaluator"
    ]
  },
  {
    "id": "agency-workflow-optimizer",
    "folder": "testing-workflow-optimizer",
    "name": "Workflow Optimizer Agent",
    "role": "Workflow Optimizer",
    "description": "Expert process improvement specialist focused on analyzing, optimizing, and automating workflows across all business functions for maximum productivity and efficiency",
    "category": "testing",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Testing",
      "Workflow Optimizer"
    ]
  },
  {
    "id": "agency-zk-steward",
    "folder": "zk-steward",
    "name": "Zk Steward Agent",
    "role": "Zk Steward",
    "description": "\"Knowledge-base steward in the spirit of Niklas Luhmann's Zettelkasten. Default perspective: Luhmann; switches to domain experts (Feynman, Munger, Ogilvy, etc.) by task. Enforces atomic notes, connectivity, and validation loops. Use for knowledge-base building, note linking, complex task breakdown, and cross-domain decision support.\"",
    "category": "engineering",
    "targetModules": [
      "cockpit"
    ],
    "skills": [
      "Engineering",
      "Zk Steward"
    ]
  },
  {
    "id": "agency-growth-scenario-simulator",
    "folder": "growth-scenario-simulator",
    "name": "Growth Scenario Simulator Agent",
    "role": "Growth Scenario Simulator",
    "description": "Runs what-if projections across budget allocation, channel mix, and pricing changes inside the OS Simulation Center, surfacing probable outcome ranges (not single-point forecasts) so a strategy can be stress-tested before committing spend.",
    "category": "product",
    "targetModules": [
      "simulation"
    ],
    "skills": [
      "Scenario Modeling",
      "Forecasting"
    ]
  }
];

// Cockpit-tagged agents are cross-functional utility agents (dev, security,
// testing, workflow tooling) meant for the Agentic AI Cockpit + Agent
// Library ONLY — they used to leak into every other module's hub via an
// unconditional OR, which is the real reason modules showed irrelevant
// agents (#task8). A module now only ever sees agents actually tagged for it.
export function getAgentsForModule(moduleKey: string): DiscoveredAgent[] {
  return DISCOVERED_AGENCY_AGENTS.filter((agent) => agent.targetModules.includes(moduleKey));
}

export function getAgentsByCategory(category: string): DiscoveredAgent[] {
  return DISCOVERED_AGENCY_AGENTS.filter((agent) => agent.category === category);
}
