import { WorkspaceData } from '../types';

// ============================================================================
// Sigma Tactix's own demo dataset — a completed Growth Audit scoring 68 against
// sigmatactix.com, six credential rows, five uploaded files, nine connectors
// reporting 'Connected', and a populated team.
//
// This USED TO BE `initialWorkspaceData` in src/initialData.ts, which
// loadWorkspace() seeded into Postgres for every new tenant. A pilot client's
// first screen therefore showed another company's fabricated data as their own.
// (FEAT-005; docs/HARNESS_ADVISORY.md finding A-1 is why it survived being
// "fixed" twice.)
//
// It is retained deliberately, for sales demos and test fixtures, and is
// imported ONLY by tests and by the explicit SEED_DEMO_WORKSPACE demo path in
// src/lib/workspaceStore.ts. src/initialData.ts must never import it — that
// import is what made every workspace a demo workspace.
// ============================================================================
export const demoWorkspaceData: WorkspaceData = {
  secondBrain: {
    executiveVault: {
      financialsOverview: "Sigma Tactix operates at a highly profitable $2.4M ARR. Main operational run-rate is $45k/month. Core IP includes our proprietary 'Growth Diagnostic Audit Framework', automated acquisition workflows, and secure agentic execution sandboxes.",
      strategicPlans: "90-day plan: Expand high-ticket B2B enterprise consulting base to 15 active retainer accounts. Complete rollout of the self-service Sigma Growth OS client dashboard portal. Build dominate search authority around 'AI-native growth infrastructure'.",
      intellectualProperty: "Registered Trademark on 'Sigma Tactix Growth OS'. Proprietary automated B2B diagnostic matrix, and custom sandboxing schemas governing LLM execution."
    },
    credentialsVault: [
      { id: '1', platform: 'Directus Headless CMS', username: 'admin@sigmatactix.com', status: 'Connected', category: 'Website' },
      { id: '2', platform: 'HubSpot CRM', username: 'integrations@sigmatactix.com', status: 'Connected', category: 'CRM' },
      { id: '3', platform: 'LinkedIn Corporate Page', username: 'media@sigmatactix.com', status: 'Connected', category: 'Social' },
      { id: '4', platform: 'Google Analytics 4', username: 'analytics@sigmatactix.com', status: 'Connected', category: 'Analytics' },
      { id: '5', platform: 'Google Search Console', username: 'seo@sigmatactix.com', status: 'Connected', category: 'Analytics' },
      { id: '6', platform: 'Klaviyo Marketing Automation', username: 'marketing@sigmatactix.com', status: 'Needs Re-auth', category: 'Email' }
    ],
    brandVault: {
      voiceAndTone: "Highly strategic, consultative, authoritative, and clinically precise. We speak with the quiet confidence of tier-1 management consulting partners and world-class digital operators. Focus heavily on metrics, efficiency, and scale; avoid hyperbole, standard sales buzzwords, or emojis.",
      corePositioning: "The premier AI-native growth consultancy engineering high-performance acquisition engines, bespoke second brain hubs, and restricted, sandbox-safe execution agents for high-growth enterprises.",
      offersAndPricing: "Growth Audit & Diagnostic: $12,000 flat fee. Growth OS Implementation & Maintenance: $15,000/month retainer + 10% performance incentive on incremental growth.",
      brandSlogan: "Elite growth infrastructure and agentic execution for high-value enterprises.",
      keyMessages: [
        "Unifying fragmented operations and customer databases into a coordinated, client-owned Second Brain.",
        "Systematically diagnosing digital acquisition leaks through metric-driven growth diagnostics.",
        "Powering secure, restricted AI agent networks that automate content, outreach, and ops without risk."
      ]
    },
    customerVault: {
      idealCustomerProfile: "Mid-market B2B enterprise founders, high-growth SaaS executives, tier-1 digital agency owners, and elite consulting firms looking to eliminate traditional agency dependencies with automated growth systems.",
      targetSegments: [
        "High-Growth Enterprise SaaS",
        "Professional Services & Boutiques",
        "High-Ticket Consulting Agencies"
      ],
      customerObjections: [
        "Will sandbox-safe AI agents hallucinate or make errors in outbound customer communication?",
        "How secure is our client-owned intellectual property inside the Second Brain database?",
        "Can an automated growth operating system adapt to changing market dynamics without human overhead?"
      ],
      testimonials: [
        "\"Sigma Tactix completely replaced our traditional marketing agency of record, doubling our active sales pipeline in 60 days using their automated Growth OS.\" - Marcus Vance, Lead Growth Operator"
      ]
    },
    marketingVault: {
      campaignHistory: "Completed outbound campaign targeting mid-market B2B SaaS founders. Achieved a 54% cold email open rate and secured 18 enterprise demo consultations. Currently optimizing self-service diagnostic signups.",
      currentChannels: ["Direct LinkedIn Executive Outreach", "High-Authority Topical backlink SEO", "Automated Educational Email Series"],
      recentPerformance: "Active consulting waiting list expanded to 45 high-ticket corporate targets. Conversion rate from initial diagnostic to retainer implementation stands at a healthy 22%."
    },
    websiteVault: {
      siteUrl: "https://sigmatactix.com",
      cmsType: "Next.js Portal with Tailwind CSS integrated with Directus headless CMS",
      analyticsId: "G-SIGMA99X",
      pageHistory: "Corporate portal deployed April 2026. Interactive Growth OS visual demo and audit lab deployed July 2026."
    },
    authorityVault: {
      targetKeywords: [
        "automated growth infrastructure enterprise",
        "bespoke second brain business strategy",
        "AI-native growth consulting systems",
        "sandbox restricted marketing agents"
      ],
      backlinkProfileSummary: "Domain Rating (DR) 34. 120 referring domains. Steady organic referral growth from prominent enterprise technology blogs and management consulting publications.",
      seoFocusAreas: [
        "Programmatic target landing pages for corporate growth diagnostics",
        "Technical documentation and deep dives on AI agent constraints and sandbox security",
        "Case studies comparing automated Growth OS setups vs traditional human agency retainers"
      ]
    },
    operationsVault: {
      standardOperatingProcedures: [
        {
          id: 'sop-1',
          title: 'Client Intake & Data Parsing',
          department: 'Operations',
          steps: [
            'Ingest client onboarding questionnaire inputs automatically.',
            'Dissect response values and map brand attributes to the secure Brand Vault.',
            'Identify target audience parameters and commit directly to the Customer Vault.',
            'Assess current tech stack and log within the Website Vault.',
            'Generate a personalized initial growth audit record mapping findings to specific execution pipelines.'
          ]
        },
        {
          id: 'sop-2',
          title: 'High-Ticket Lead Nurturing',
          department: 'Sales',
          steps: [
            'Scrape waitlist sign-ups via LinkedIn Profile lookup API.',
            'Filter for executive titles (Founder, CEO, Managing Partner).',
            'Enrich HubSpot CRM with company metrics and historical site performance.',
            'Deploy personalized email outbound sequences via safe, restricted Sales Agents.'
          ]
        }
      ],
      orgHierarchy: "CEO: David Sterling | CTO: Elena Rostova | Chief Operating Officer: Marcus Vance | Lead Growth Operator: Sigma Tactix"
    },
    aiWorkflowVault: [
      {
        id: 'wf-1',
        agentType: 'Marketing Agent',
        systemPrompt: "You are the premium, highly intelligent Marketing Agent inside the Sigma Tactix Growth OS. Synthesize our core Growth Diagnostic Audit framework into a 5-step automated campaign calendar for next month. Style guidelines: Premium, precise, strategic, and secure.",
        modelRouterEndpoint: "gemini-3.5-flash",
        temperature: 0.2,
        maxTokens: 1500,
        agentConstraints: [
          "Zero access to Credentials Vault",
          "Zero access to Executive Financials",
          "Sandbox restricted execution"
        ]
      },
      {
        id: 'wf-2',
        agentType: 'AI SDR (Sales Agent)',
        systemPrompt: "You are the premium, highly intelligent AI SDR Agent inside the Sigma Tactix Growth OS. Target B2B enterprise executives on LinkedIn with custom diagnostic reference outbound templates. Style guidelines: Precise, high-level, consultative.",
        modelRouterEndpoint: "gemini-3.5-flash",
        temperature: 0.1,
        maxTokens: 1000,
        agentConstraints: [
          "Zero access to Credentials Vault",
          "Zero access to Executive Financials",
          "Human-in-the-Loop approval required for all communications"
        ]
      },
      {
        id: 'wf-3',
        agentType: 'Customer Success Agent',
        systemPrompt: "You are the premium, highly intelligent Customer Success Agent inside the Sigma Tactix Growth OS. Draft an onboarding objection-handling guide addressing enterprise database security concerns.",
        modelRouterEndpoint: "gemini-3.5-flash",
        temperature: 0.3,
        maxTokens: 1200,
        agentConstraints: [
          "Restricted to Customer Vault knowledge bases",
          "No public posting privileges"
        ]
      },
      {
        id: 'wf-4',
        agentType: 'Operations Agent',
        systemPrompt: "You are the premium, highly intelligent Operations Agent inside the Sigma Tactix Growth OS. Write an enrichment automation node script triggered on new registration waiting list events.",
        modelRouterEndpoint: "gemini-3.5-flash",
        temperature: 0.1,
        maxTokens: 2000,
        agentConstraints: [
          "Restricted to standard operating procedures",
          "No administrative or credential write access"
        ]
      }
    ],
    auditVault: {
      overallScore: 68,
      lastAuditedAt: '2026-07-15',
      findings: {
        websitePresence: "Highly polished visual consulting homepage, but conversion funnel is extremely weak. Calls-to-action are too vague, and the diagnostic signup flow has too many friction points, causing a 96% dropoff.",
        socialMediaPresence: "LinkedIn presence exists but lacks consistent updates. No active executive thought leadership or corporate brand authority posts to build institutional trust.",
        seoReadiness: "Indexing is configured properly, but target keywords are currently unranked. Completely lacking targeted landing pages for specific B2B growth niches.",
        aiVisibility: "Zero visibility on perplexity, gemini, or ChatGPT searches for high-value growth consulting terms. The entity profile is completely unrecognized by generative search engines.",
        offerClarity: "The pricing structure for bespoke Growth OS implementations is vague. Potential users do not understand the fee structure or the mathematical benefit of automated systems over agencies.",
        positioningStrength: "Strong security-first positioning, but needs more concrete, mathematical evidence of growth velocity and risk reduction to appeal to institutional stakeholders.",
        funnelQuality: "A heavy drop-off occurs at the detailed information collection stage. Need to introduce an 'instant qualification' wizard to keep users engaged before triggering compliance steps.",
        analyticsReadiness: "GA4 and GSC are installed, but funnel tracking events (Diagnostic Start, Diagnostic Fail, Ingest Successful) are not configured, leaving growth operators blind."
      }
    },
    uploadedFiles: [
      { id: 'f-1', name: 'Sigma_Brand_Voice_Guidelines_v3.pdf', size: '2.4 MB', uploadedAt: '2026-07-10', vaultId: 'brand', status: 'Ready' },
      { id: 'f-2', name: 'Enterprise_Ideal_Customer_Profiles.csv', size: '154 KB', uploadedAt: '2026-07-12', vaultId: 'customer', status: 'Ready' },
      { id: 'f-3', name: 'Corporate_SOP_Acquisition_Playbook.docx', size: '1.8 MB', uploadedAt: '2026-07-14', vaultId: 'operations', status: 'Ready' },
      { id: 'f-4', name: 'Website_Sitemap_Structure_2026.xml', size: '12 KB', uploadedAt: '2026-07-15', vaultId: 'website', status: 'Ready' },
      { id: 'f-5', name: 'Pending_Strategic_Retainer_Contracts.pdf', size: '4.1 MB', uploadedAt: '2026-07-16', vaultId: 'executive', status: 'Ready' }
    ],
    connectors: [
      { id: 'conn-1', platform: 'Slack', status: 'Connected', lastSyncedAt: '2026-07-17 12:00', connectedBy: 'Elena Rostova' },
      { id: 'conn-2', platform: 'Microsoft Teams', status: 'Connected', lastSyncedAt: '2026-07-17 11:30', connectedBy: 'David Sterling' },
      { id: 'conn-3', platform: 'Notion', status: 'Connected', lastSyncedAt: '2026-07-16 16:45', connectedBy: 'Elena Rostova' },
      { id: 'conn-4', platform: 'Confluence', status: 'Disconnected', connectedBy: 'Marcus Vance' },
      { id: 'conn-5', platform: 'Linear', status: 'Connected', lastSyncedAt: '2026-07-17 09:15', connectedBy: 'Elena Rostova' },
      { id: 'conn-6', platform: 'LinkedIn Ads', status: 'Connected', lastSyncedAt: '2026-07-17 14:20', connectedBy: 'Elena Rostova' },
      { id: 'conn-7', platform: 'TikTok Ads', status: 'Disconnected', connectedBy: 'David Sterling' },
      { id: 'conn-8', platform: 'Twitter (X) Ads', status: 'Connected', lastSyncedAt: '2026-07-17 10:15', connectedBy: 'Elena Rostova' },
      { id: 'conn-9', platform: 'Apple Search Ads', status: 'Connected', lastSyncedAt: '2026-07-16 18:30', connectedBy: 'David Sterling' },
      { id: 'conn-10', platform: 'Reddit Ads', status: 'Disconnected', connectedBy: 'Marcus Vance' },
      { id: 'conn-11', platform: 'Pinterest Ads', status: 'Connected', lastSyncedAt: '2026-07-17 15:40', connectedBy: 'Elena Rostova' },
      { id: 'conn-12', platform: 'HubSpot CRM', status: 'Disconnected', connectedBy: 'Marcus Vance' },
      { id: 'conn-13', platform: 'Meta Ads', status: 'Disconnected', connectedBy: 'David Sterling' },
      { id: 'conn-14', platform: 'Google Ads', status: 'Disconnected', connectedBy: 'David Sterling' }
    ],
    internalStack: [
      { id: 'st-1', name: 'Slack Communications Hub', category: 'Communication', status: 'Active', contextCoverage: 'All consulting, #growth-ops, #client-feed' },
      { id: 'st-2', name: 'Microsoft Teams Channels', category: 'Communication', status: 'Active', contextCoverage: 'Executive briefings, legal audits, partner calls' },
      { id: 'st-3', name: 'Notion Strategy Wiki', category: 'Knowledge Base', status: 'Active', contextCoverage: 'Brand books, messaging pillars, client onboarding drafts' },
      { id: 'st-4', name: 'Linear Engineering Board', category: 'Project Management', status: 'Active', contextCoverage: 'AI agent codebases, database sandbox triggers' },
      { id: 'st-5', name: 'Jira Software Tracking', category: 'Project Management', status: 'Inactive', contextCoverage: 'Legacy website migrations archive' },
      { id: 'st-6', name: 'Confluence Operations Library', category: 'Knowledge Base', status: 'Inactive', contextCoverage: 'SOP historical backups' }
    ]
  },
  growthAudit: {
    status: 'completed',
    score: 68,
    domain: 'sigmatactix.com',
    lastAuditedAt: '2026-07-15',
    findings: [
      {
        id: 'finding-websitePresence',
        category: 'websitePresence',
        title: 'Website Presence & CRO',
        text: "Highly polished visual consulting homepage, but conversion funnel is extremely weak. Calls-to-action are too vague, and the diagnostic signup flow has too many friction points, causing a 96% dropoff.",
        insight: "Conversion rates fall sharply on mobile devices.",
        impactPct: 18,
        quickSteps: [
          "Audit the signup flow and cut it to 3 steps max",
          "Replace vague CTAs with outcome-specific copy",
          "Add a mobile-first pass on every conversion page"
        ],
        dataSource: 'live'
      },
      {
        id: 'finding-socialMediaPresence',
        category: 'socialMediaPresence',
        title: 'Social Media Footprint',
        text: "LinkedIn presence exists but lacks consistent updates. No active executive thought leadership or corporate brand authority posts to build institutional trust.",
        insight: "LinkedIn engagement outperforms X by 3x.",
        impactPct: 12,
        quickSteps: [
          "Publish 2x/week executive LinkedIn posts",
          "Stand up a content calendar tied to the Growth OS roadmap",
          "Connect a social listening source for real engagement data"
        ],
        dataSource: 'placeholder'
      },
      {
        id: 'finding-seoReadiness',
        category: 'seoReadiness',
        title: 'SEO Keywords & Indices',
        text: "Indexing is configured properly, but target keywords are currently unranked. Completely lacking targeted landing pages for specific B2B growth niches.",
        insight: "Missing core commercial intent keywords.",
        impactPct: 25,
        quickSteps: [
          "Build dedicated landing pages per priority keyword cluster",
          "Fix internal linking to those pages from the homepage",
          "Ship structured data for each service page"
        ],
        dataSource: 'live'
      },
      {
        id: 'finding-aiVisibility',
        category: 'aiVisibility',
        title: 'Generative Engine Visibility (AEO)',
        text: "Not referenced by Gemini or ChatGPT for core services — the entity profile is unrecognized by generative search engines.",
        insight: "Zero citations across major LLM answer engines.",
        impactPct: 40,
        quickSteps: [
          "Publish FAQ-format content answering high-intent questions",
          "Add Organization/Service schema markup site-wide",
          "Connect a citation-tracking source for real AEO measurement"
        ],
        dataSource: 'placeholder'
      },
      {
        id: 'finding-offerClarity',
        category: 'offerClarity',
        title: 'Offer Positioning',
        text: "Pricing tiers are confusing for entry-level buyers. The fee structure and ROI math aren't obvious on first read.",
        insight: "Pricing tiers are confusing for entry-level buyers.",
        impactPct: 15,
        quickSteps: [
          "Add a plain-language pricing comparison table",
          "State the ROI math explicitly next to each tier",
          "A/B test a single clear entry offer above the fold"
        ],
        dataSource: 'live'
      },
      {
        id: 'finding-positioningStrength',
        category: 'positioningStrength',
        title: 'Brand Slogan Effectiveness',
        text: "Slogan lacks a clear value proposition — strong security-first positioning needs concrete evidence of growth velocity.",
        insight: "Slogan lacks clear value proposition.",
        impactPct: 5,
        quickSteps: [
          "Pair the slogan with one concrete proof point",
          "Add a case-study strip directly below the hero"
        ],
        dataSource: 'live'
      },
      {
        id: 'finding-funnelQuality',
        category: 'funnelQuality',
        title: 'KYC & Compliance Funnel Drops',
        text: "Users drop off at the ID verification step — the funnel front-loads compliance before demonstrating value.",
        insight: "Users drop off at ID verification step.",
        impactPct: 22,
        quickSteps: [
          "Move ID verification after the first value moment",
          "Add a progress indicator through the funnel",
          "Send a re-engagement email to funnel abandoners"
        ],
        dataSource: 'live'
      },
      {
        id: 'finding-analyticsReadiness',
        category: 'analyticsReadiness',
        title: 'Analytics Instrumentation',
        text: "GA4 is installed but checkout/diagnostic events aren't firing — growth operators are flying blind on where users drop off.",
        insight: "GA4 events not firing on checkout.",
        impactPct: 10,
        quickSteps: [
          "Wire GTM triggers for Diagnostic Start / Fail / Complete",
          "Verify events in GA4 DebugView before shipping",
          "Add a funnel-drop-off report to the Reporting tab"
        ],
        dataSource: 'live'
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        category: 'Website Funnel',
        title: 'Optimize the Client Intake Friction Point',
        impact: 'High',
        effort: 'Medium',
        description: 'Implement a multi-step pre-qualification wizard that qualifies leads on target scale first, then guides them into detailed diagnostics with immediate brand value outputs.',
        quickSteps: [
          "Map the current intake flow and mark every drop-off point",
          "Design a 3-question pre-qualification wizard",
          "Ship it behind a feature flag and measure completion rate"
        ]
      },
      {
        id: 'rec-2',
        category: 'AI Search Optimization',
        title: 'Build Entity Footprint for Generative AI (AEO)',
        impact: 'High',
        effort: 'Low',
        description: 'Publish structured Schema markup (Organization, Product, Service) and seed comparison assets to help AI engines cite Sigma Tactix as the top automated consulting alternative.',
        quickSteps: [
          "Add Organization + Service schema to every core page",
          "Publish 3 comparison articles vs. traditional agencies",
          "Submit updated sitemap to Google Search Console"
        ]
      },
      {
        id: 'rec-3',
        category: 'Content Strategy',
        title: 'Launch CEO Executive LinkedIn Thought Leadership',
        impact: 'Medium',
        effort: 'Medium',
        description: 'Generate high-authority strategic essays under David Sterling\'s name exploring traditional marketing agency overhead, operational drag, and AI-native growth execution.',
        quickSteps: [
          "Draft a 4-week executive content calendar",
          "Write and schedule the first 2 essays",
          "Track engagement and iterate on angle"
        ]
      }
    ],
    roadmap90Day: [
      {
        phase: "Days 1-30: Core Funnel & Tracking",
        title: "Foundation & Friction Removal",
        tasks: [
          "Install custom GTM event tracking for active intake funnel dropoffs.",
          "Redesign landing page intake wizard flow to pre-qualify and capture emails first.",
          "Generate first set of structured organizational schemas and publish to CMS."
        ]
      },
      {
        phase: "Days 31-60: SEO & Topical Authority",
        title: "Content & SEO Footprint Expansion",
        tasks: [
          "Publish 5 targeted niche articles on B2B SaaS growth tactics.",
          "Begin LinkedIn executive authority program (2 articles/week).",
          "Deploy custom landing page templates targeting 'automated growth infrastructure'."
        ]
      },
      {
        phase: "Days 61-90: High-Value Direct Acquisition",
        title: "Active Outbound & Automation",
        tasks: [
          "Deploy AI SDR outbound sequences targeting enterprise software executives.",
          "Launch interactive self-service consulting calculator tool on the homepage.",
          "Optimize SDR workflows to sync directly with HubSpot deals."
        ]
      }
    ]
  },
  uiuxAudit: {
    url: "https://sigmatactix.com/diagnostic",
    lastAuditedAt: "2026-07-16",
    frictionRating: "High",
    overallScore: 58,
    findings: {
      usability: "Form fields are too crowded, and lack real-time error validation. The user is forced to upload a strategy questionnaire before knowing if their business profile qualifies.",
      accessibility: "Text contrast in the dark theme forms has a 2.8:1 ratio (fails WCAG AA). Placeholders are barely visible in charcoal input fields.",
      navigation: "Back-navigation from validation steps resets the entire form, causing immediate user abandonment.",
      mobileResponse: "The multi-column layout does not stack cleanly on mobile. Input fields are cut off on typical iOS/Android devices.",
      conversionFriction: "Requires strategic revenue data instantly. Lacks a 'Save Progress & Continue Later' feature, which is vital for enterprise onboarding."
    },
    pageLevelRecommendations: [
      {
        page: "Intake Screen 1",
        issue: "Mandatory PDF upload upfront is causing 72% of users to bounce.",
        solution: "Make the document upload optional during first sign-up, and request it during the diagnostic execution screen.",
        impact: "High"
      },
      {
        page: "Verification Panel",
        issue: "Insufficient color contrast for input labels and helpers.",
        solution: "Change charcoal-grey labels (#5A5A5C) to premium silver (#E0E0E0) to improve legibility and visual prestige.",
        impact: "High"
      }
    ]
  },
  contentAssets: [
    {
      id: 'content-1',
      title: 'Automated Growth Infrastructure: Bypassing Legacy Agency Overhead',
      channel: 'Blog',
      assetType: 'Text',
      createdAt: '2026-07-14',
      status: 'Approved',
      brief: {
        context: 'A strategic, highly analytical essay demonstrating how automated Growth OS execution is 10x more cost-efficient than traditional marketing agencies.',
        direction: 'Authoritative, analytical, critical of legacy systems.',
        emotions: 'Urgency, relief, professional trust.',
        objective: 'Educate enterprise buyers on the value of a client-owned Growth OS.',
        offer: 'Schedule a Growth Audit'
      },
      content: 'In mid-market enterprise acquisition, the most critical bottleneck isn\'t creative talent—it is execution drag. While traditional marketing agencies require weekly alignments, project managers, and manual handoffs, automated growth infrastructures rely on secure, client-owned Second Brains to execute campaigns in seconds...'
    },
    {
      id: 'content-2',
      title: 'Eliminating the Agency Retainer: Why Strategic Founders Are Moving to Growth OS',
      channel: 'LinkedIn',
      assetType: 'Text',
      createdAt: '2026-07-15',
      status: 'Pending Approval',
      brief: {
        context: 'Short executive thought-leadership post criticizing legacy marketing agency operational retainers.',
        direction: 'Punchy, executive, visionary.',
        emotions: 'Frustration with status quo, excitement for the future.',
        objective: 'Drive engagement and profile views from SaaS founders.',
        offer: 'Link to Sigma Tactix landing page'
      },
      content: 'B2B enterprise scales at the speed of modern cloud systems, yet corporate growth efforts are still hostage to 30-day agency review cycles and manual retainers. If your team is chasing enterprise accounts, why should you wait 4 weeks to coordinate a campaign? Sigma Tactix is shifting the paradigm. Dynamic diagnostics. Continuous, secure execution. Uncompromising speed.'
    }
  ],
  keywords: [
    { id: 'kw-1', keyword: 'automated growth infrastructure B2B', searchVolume: 1200, difficulty: 35, intent: 'Commercial', topicalAuthorityStatus: 'Low Visibility', backlinkTargetCount: 3 },
    { id: 'kw-2', keyword: 'client owned second brain business', searchVolume: 450, difficulty: 18, intent: 'Transactional', topicalAuthorityStatus: 'Unranked', backlinkTargetCount: 1 },
    { id: 'kw-3', keyword: 'sandbox safe marketing AI agents', searchVolume: 800, difficulty: 45, intent: 'Informational', topicalAuthorityStatus: 'Unranked', backlinkTargetCount: 5 },
    { id: 'kw-4', keyword: 'enterprise growth diagnostic software', searchVolume: 3200, difficulty: 58, intent: 'Commercial', topicalAuthorityStatus: 'Low Visibility', backlinkTargetCount: 12 }
  ],
  agentTasks: [
    {
      id: 'task-1',
      agentName: 'AI SDR (Sales Agent)',
      goal: 'Enrich new diagnostic signs with LinkedIn profile insights and draft highly personalized first-touch strategy emails.',
      timestamp: '2026-07-16 14:32',
      status: 'Success',
      steps: [
        'Fetched raw waitlist emails (e.g. marcus@sovereignwealth.com).',
        'Initiated target company lookups to identify corporate scale and industry.',
        'Extracted managing partner LinkedIn history.',
        'Drafted custom hyper-personalized message linking brand Voice guidelines and automated SDR execution limits.'
      ],
      output: 'Successfully enriched 12 high-value B2B contacts and sent outreach drafts to HubSpot CRM staging.'
    }
  ],
  teamMembers: [
    { id: 'tm-1', name: 'David Sterling', email: 'david@sigmatactix.com', role: 'Admin', department: 'Executive' },
    { id: 'tm-2', name: 'Elena Rostova', email: 'elena@sigmatactix.com', role: 'Admin', department: 'Engineering' },
    { id: 'tm-3', name: 'Marcus Vance', email: 'marcus@sigmatactix.com', role: 'Editor', department: 'Operations' }
  ],
  invitations: [
    { id: 'inv-1', email: 'growth-lead@sigmatactix.com', role: 'Editor', status: 'Pending', invitedAt: '2026-07-17 09:00' }
  ],
  analyticsAudit: {
    url: 'https://sigmatactix.com',
    lastAuditedAt: '2026-07-18',
    score: 82,
    tagsFound: ['Google Tag Manager', 'Meta Pixel', 'LinkedIn Insight Tag'],
    pixelsFound: ['Meta', 'LinkedIn', 'Twitter'],
    eventsTracking: ['page_view', 'scroll', 'form_start', 'diagnostic_complete'],
    findings: {
      tagManager: 'GTM is installed and firing correctly on all main paths. However, duplicate containers were detected on the /pricing page.',
      pixels: 'Meta and LinkedIn pixels are firing. Advanced matching is enabled for Meta but missing for LinkedIn.',
      events: 'Basic events track well. Critical drop-off points in the diagnostic questionnaire lack custom event triggers.',
      dataLayer: 'DataLayer is mostly flat. Missing structured e-commerce or lead value pushes.'
    },
    recommendations: [
      { id: 'ar-1', category: 'Tracking', title: 'Implement Custom DataLayer Push on Diagnostic Steps', impact: 'High', description: 'Push step-specific details to the dataLayer to identify exactly where enterprise buyers abandon the form.' },
      { id: 'ar-2', category: 'Pixels', title: 'Enable LinkedIn Advanced Matching', impact: 'Medium', description: 'Pass hashed emails to the LinkedIn Insight Tag to improve B2B audience retargeting.' }
    ]
  },
  settings: {
    technical: { customDomain: 'app.sigmatactix.com', sslStatus: 'Active' },
    integrations: [
      { id: 'int-1', name: 'HubSpot', status: 'Connected' },
      { id: 'int-2', name: 'Stripe', status: 'Disconnected' }
    ],
    // MCP servers grouped by the module whose agents need them (#task10).
    // Only MCPs that map to a capability this product actually uses are
    // listed — this is not a catalogue of every MCP in existence.
    mcps: [
      { id: 'mcp-brain-1', name: 'Filesystem MCP', moduleKey: 'brain', purpose: 'Read/write vault documents and uploaded context files', enabled: true },
      { id: 'mcp-brain-2', name: 'Supabase MCP', moduleKey: 'brain', purpose: 'Query the Second Brain vault tables and pgvector RAG store', enabled: true },

      { id: 'mcp-growth-1', name: 'Fetch / Web MCP', moduleKey: 'growth', purpose: 'Fetch and parse target site pages during diagnostic audits', enabled: true },
      { id: 'mcp-growth-2', name: 'Lighthouse MCP', moduleKey: 'growth', purpose: 'Core Web Vitals and performance scoring for audits', enabled: true },

      { id: 'mcp-uiux-1', name: 'Chrome DevTools MCP', moduleKey: 'uiux', purpose: 'Live DOM inspection, screenshots and accessibility tree audits', enabled: true },
      { id: 'mcp-uiux-2', name: 'Figma MCP', moduleKey: 'uiux', purpose: 'Pull design specs and compare implementation against them', enabled: false },

      { id: 'mcp-content-1', name: 'Canva MCP', moduleKey: 'content', purpose: 'Generate and export creative assets for campaigns', enabled: false },
      { id: 'mcp-content-2', name: 'WordPress MCP', moduleKey: 'content', purpose: 'Publish and update content assets on the client CMS', enabled: false },

      { id: 'mcp-perf-1', name: 'Meta Ads API MCP', moduleKey: 'performance', purpose: 'Campaign, ad set and creative performance data', enabled: true },
      { id: 'mcp-perf-2', name: 'Google Ads MCP', moduleKey: 'performance', purpose: 'Search/PMax campaign metrics and keyword performance', enabled: true },
      { id: 'mcp-perf-3', name: 'Windsor.ai Connector', moduleKey: 'performance', purpose: 'Unified multi-channel ad spend and attribution data', enabled: true },

      { id: 'mcp-report-1', name: 'Google Analytics (GA4) MCP', moduleKey: 'reporting', purpose: 'Session, conversion and funnel data for reports', enabled: true },
      { id: 'mcp-report-2', name: 'Google Sheets MCP', moduleKey: 'reporting', purpose: 'Export report data and read client-supplied spreadsheets', enabled: false },

      { id: 'mcp-authority-1', name: 'Google Search Console MCP', moduleKey: 'authority', purpose: 'Query impressions, clicks, positions and indexation issues', enabled: true },
      { id: 'mcp-authority-2', name: 'Ahrefs MCP', moduleKey: 'authority', purpose: 'Backlink profile, domain rating and keyword difficulty', enabled: false },

      { id: 'mcp-crm-1', name: 'HubSpot API Connector', moduleKey: 'crm', purpose: 'Sync contacts, deals and pipeline stages', enabled: false },
      { id: 'mcp-crm-2', name: 'Klaviyo Connector', moduleKey: 'crm', purpose: 'Lifecycle email flows and segment membership', enabled: true },

      { id: 'mcp-comp-1', name: 'Firecrawl MCP', moduleKey: 'competitors', purpose: 'Scrape and monitor competitor sites for positioning changes', enabled: true },
      { id: 'mcp-comp-2', name: 'Meta Ad Library MCP', moduleKey: 'competitors', purpose: 'Track competitor paid creative and messaging', enabled: false },

      { id: 'mcp-social-1', name: 'X / Twitter MCP', moduleKey: 'social', purpose: 'Monitor brand mentions and conversation volume', enabled: false },
      { id: 'mcp-social-2', name: 'Reddit MCP', moduleKey: 'social', purpose: 'Track subreddit sentiment and organic brand discussion', enabled: false },

      { id: 'mcp-agents-1', name: 'Sequential Thinking MCP', moduleKey: 'agents', purpose: 'Structured multi-step reasoning for complex agent runs', enabled: true },
      { id: 'mcp-agents-2', name: 'Memory MCP', moduleKey: 'agents', purpose: 'Persistent cross-run agent memory scoped to the workspace', enabled: true },

      { id: 'mcp-sim-1', name: 'Sequential Thinking MCP', moduleKey: 'simulation', purpose: 'Branch and compare what-if scenario chains', enabled: true },
      { id: 'mcp-sim-2', name: 'Memory MCP', moduleKey: 'simulation', purpose: 'Recall prior scenario runs when projecting a new one', enabled: true }
    ],
    // Custom skills are user-added (or uploaded as .md/.txt) in the Cockpit.
    skills: [],
    agentTeams: {},
    // Plugins, grouped per module like mcps above. Deliberately distinct
    // names from the MCP list (no Lighthouse/GA4/Ahrefs/Search Console
    // duplicates) — a plugin here is a lightweight calculator/generator/
    // checklist an agent invokes inline, not a protocol server connection.
    plugins: [
      { id: 'plg-brain-1', name: 'Vault Tagging Assistant', moduleKey: 'brain', purpose: 'Auto-suggests which vault an uploaded document belongs in', enabled: true },
      { id: 'plg-brain-2', name: 'Document OCR', moduleKey: 'brain', purpose: 'Extracts text from scanned/image-based uploads', enabled: false },

      { id: 'plg-growth-1', name: 'Core Web Vitals Calculator', moduleKey: 'growth', purpose: 'Scores LCP/CLS/INP against pass thresholds', enabled: true },
      { id: 'plg-growth-2', name: 'Diagnostic Score Benchmarker', moduleKey: 'growth', purpose: 'Compares this audit\'s score against prior runs', enabled: true },

      { id: 'plg-uiux-1', name: 'Contrast Ratio Checker', moduleKey: 'uiux', purpose: 'Flags text/background pairs failing WCAG AA', enabled: true },
      { id: 'plg-uiux-2', name: 'Heuristic Evaluation Checklist', moduleKey: 'uiux', purpose: 'Nielsen 10-heuristics pass for a given screen', enabled: false },

      { id: 'plg-content-1', name: 'Headline A/B Generator', moduleKey: 'content', purpose: 'Produces headline variants for a content asset', enabled: true },
      { id: 'plg-content-2', name: 'Brand Voice Consistency Checker', moduleKey: 'content', purpose: 'Flags copy drifting from the Brand Vault\'s tone rules', enabled: false },

      { id: 'plg-perf-1', name: 'CPA / ROAS Calculator', moduleKey: 'performance', purpose: 'Computes blended CPA and ROAS across channels', enabled: true },
      { id: 'plg-perf-2', name: 'Budget Pacing Alert', moduleKey: 'performance', purpose: 'Flags campaigns over/under-pacing against monthly budget', enabled: true },

      { id: 'plg-report-1', name: 'PDF Report Exporter', moduleKey: 'reporting', purpose: 'Renders a report view to a branded PDF', enabled: true },
      { id: 'plg-report-2', name: 'Chart Template Library', moduleKey: 'reporting', purpose: 'Reusable chart layouts for recurring report sections', enabled: false },

      { id: 'plg-authority-1', name: 'Keyword Difficulty Estimator', moduleKey: 'authority', purpose: 'Scores target keywords for realistic ranking effort', enabled: true },
      { id: 'plg-authority-2', name: 'Content Gap Finder', moduleKey: 'authority', purpose: 'Diffs ranked competitor topics against owned content', enabled: false },

      { id: 'plg-crm-1', name: 'Lead Scoring Calculator', moduleKey: 'crm', purpose: 'Weights contact fields into a qualification score', enabled: true },
      { id: 'plg-crm-2', name: 'Deal Stage Reminder', moduleKey: 'crm', purpose: 'Flags deals stalled past a stage\'s typical duration', enabled: false },

      { id: 'plg-comp-1', name: 'Pricing Comparison Builder', moduleKey: 'competitors', purpose: 'Builds a side-by-side pricing table from tracked competitors', enabled: true },
      { id: 'plg-comp-2', name: 'SWOT Generator', moduleKey: 'competitors', purpose: 'Drafts a SWOT from a competitor\'s tracked findings', enabled: false },

      { id: 'plg-social-1', name: 'Hashtag Trend Finder', moduleKey: 'social', purpose: 'Surfaces rising hashtags relevant to tracked keywords', enabled: false },
      { id: 'plg-social-2', name: 'Mention Sentiment Scorer', moduleKey: 'social', purpose: 'Scores logged mentions as positive/neutral/negative', enabled: true },

      { id: 'plg-agents-1', name: 'Prompt Template Library', moduleKey: 'agents', purpose: 'Reusable prompt scaffolds for common agent tasks', enabled: true },
      { id: 'plg-agents-2', name: 'Token Usage Estimator', moduleKey: 'agents', purpose: 'Estimates cost/tokens before dispatching a run', enabled: false },

      { id: 'plg-sim-1', name: 'Monte Carlo Projection', moduleKey: 'simulation', purpose: 'Runs randomized trials across a scenario\'s input ranges', enabled: true },
      { id: 'plg-sim-2', name: 'Scenario Comparison Matrix', moduleKey: 'simulation', purpose: 'Side-by-side outcome comparison across saved scenarios', enabled: false }
    ]
  }
};
