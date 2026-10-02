import type {
  GrowthAudit,
  GrowthCapabilitySnapshot,
  GrowthStrategy,
  GrowthStrategyTask,
  SystemAgentName,
} from '../types';

type StrategyTemplate = {
  match: RegExp;
  title: string;
  outcome: string;
  metric: string;
  agents: Array<{ name: SystemAgentName; role: string }>;
};

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    match: /seo|aeo|generative|authority|schema|content|citation/i,
    title: 'Build discoverable authority',
    outcome: 'Turn weak search and AI visibility into a measurable authority pipeline.',
    metric: 'Organic visibility, qualified visits, and citation coverage',
    agents: [
      { name: 'SEO & Authority Agent', role: 'Own the authority plan and technical search fixes' },
      { name: 'Marketing Agent', role: 'Create the supporting content briefs and distribution plan' },
      { name: 'Audit Diagnostic Agent', role: 'Verify the baseline and measure movement' },
    ],
  },
  {
    match: /conversion|funnel|form|offer|position|cro|website|mobile/i,
    title: 'Remove conversion friction',
    outcome: 'Shorten the path from first visit to a qualified conversion.',
    metric: 'Visitor-to-lead rate and form completion rate',
    agents: [
      { name: 'Audit Diagnostic Agent', role: 'Define the leak and acceptance criteria' },
      { name: 'Creative Director Agent', role: 'Shape the message and experience changes' },
      { name: 'Operations Agent', role: 'Coordinate implementation and verification' },
    ],
  },
  {
    match: /paid|acquisition|media|roas|cac|keyword|campaign/i,
    title: 'Recover paid-media efficiency',
    outcome: 'Move budget and creative effort toward verified high-intent demand.',
    metric: 'Blended CAC, wasted spend, and qualified pipeline',
    agents: [
      { name: 'Audit Diagnostic Agent', role: 'Validate waste and opportunity segments' },
      { name: 'Marketing Agent', role: 'Draft the channel and creative test plan' },
      { name: 'Creative Director Agent', role: 'Review campaign assets before release' },
    ],
  },
  {
    match: /analytic|tracking|capi|signal|operation|data|instrument/i,
    title: 'Restore measurement confidence',
    outcome: 'Create a trustworthy signal layer before automating optimisation.',
    metric: 'Event coverage, match quality, and attribution completeness',
    agents: [
      { name: 'Operations Agent', role: 'Own instrumentation and data quality work' },
      { name: 'Audit Diagnostic Agent', role: 'Verify events against the measurement plan' },
      { name: 'Marketing Agent', role: 'Translate trusted signals into channel decisions' },
    ],
  },
];

const DEFAULT_TEMPLATE: StrategyTemplate = {
  match: /.*/,
  title: 'Resolve the highest-impact growth constraint',
  outcome: 'Convert the strongest diagnostic signal into a controlled execution plan.',
  metric: 'Agreed baseline and target KPI',
  agents: [
    { name: 'Audit Diagnostic Agent', role: 'Define the baseline and acceptance criteria' },
    { name: 'Operations Agent', role: 'Coordinate the execution sequence' },
    { name: 'Marketing Agent', role: 'Deliver the customer-facing growth work' },
  ],
};

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48);
}

function taskFor(
  strategyId: string,
  agent: StrategyTemplate['agents'][number],
  index: number,
  objective: string,
): GrowthStrategyTask {
  return {
    id: `${strategyId}-task-${index + 1}`,
    title: agent.role,
    agentName: agent.name,
    objective,
    status: 'recommended',
    requiresHitl: true,
  };
}

function providerStatus(
  provider: 'tinyfish' | 'mirofish',
  capabilities: GrowthCapabilitySnapshot[],
): GrowthStrategy['providers'][number] {
  const capability = capabilities.find(item => item.id === `provider-${provider}`);
  const label = provider === 'tinyfish' ? 'TinyFish' : 'MiroFish';
  const purpose = provider === 'tinyfish'
    ? 'Gather public web evidence for research tasks'
    : 'Challenge the strategy through governed market simulation';

  if (!capability) {
    return { provider, label, purpose, state: 'unknown', guidance: 'Capability status is unavailable. Keep this step manual.' };
  }
  if (capability.verified && capability.automationEligible) {
    return { provider, label, purpose, state: 'ready', guidance: 'Available for approved strategy tasks.' };
  }
  if (capability.verified) {
    return { provider, label, purpose, state: 'assisted', guidance: 'Verified for assisted use only. Human approval remains required.' };
  }
  return {
    provider,
    label,
    purpose,
    state: 'setup-required',
    guidance: capability.evidence[0] || 'Configuration and verification are required before use.',
  };
}

/**
 * Converts a diagnostic into a small, prioritised strategy portfolio. This is
 * the single interface used by the API and UI; agent/task complexity stays
 * behind it and every executable task is HITL-gated by default.
 */
export function buildGrowthStrategies(
  audit: Pick<GrowthAudit, 'findings' | 'recommendations' | 'roadmap90Day'>,
  capabilities: GrowthCapabilitySnapshot[] = [],
): GrowthStrategy[] {
  const recommendationInputs = audit.recommendations.map(recommendation => ({
        id: recommendation.id,
        title: recommendation.title,
        description: recommendation.description,
        quickSteps: recommendation.quickSteps,
        impact: recommendation.impact,
        evidenceIds: audit.findings
          .filter(finding => `${recommendation.category} ${recommendation.title}`.match(new RegExp(finding.category, 'i')))
          .map(finding => finding.id),
      }));
  const findingInputs = [...audit.findings]
    .sort((a, b) => b.impactPct - a.impactPct)
    .map(finding => ({
          id: finding.id,
          title: finding.title,
          description: finding.insight || finding.text,
          quickSteps: finding.quickSteps,
          impact: finding.impactPct >= 18 ? 'High' as const : 'Medium' as const,
          evidenceIds: [finding.id],
        }));
  const roadmapInputs = audit.roadmap90Day.map((phase, index) => ({
    id: `roadmap-${index + 1}`,
    title: `${phase.phase}: ${phase.title}`,
    description: `Roadmap-backed strategy derived from the completed diagnostic phase "${phase.title}".`,
    quickSteps: phase.tasks,
    impact: index === 0 ? 'High' as const : 'Medium' as const,
    evidenceIds: [],
  }));

  // Recommendations can describe different tactics within the same strategic
  // archetype. Presenting those as separate choices creates false variety, so
  // fill the portfolio from both recommendations and findings while keeping
  // each strategy outcome distinct.
  const selectedInputs: Array<(typeof recommendationInputs)[number] | (typeof findingInputs)[number]> = [];
  const selectedTitles = new Set<string>();
  for (const input of [...recommendationInputs, ...findingInputs, ...roadmapInputs]) {
    const searchable = `${input.title} ${input.description}`;
    const template = STRATEGY_TEMPLATES.find(candidate => candidate.match.test(searchable)) || DEFAULT_TEMPLATE;
    if (selectedTitles.has(template.title)) continue;
    selectedInputs.push(input);
    selectedTitles.add(template.title);
    if (selectedInputs.length === 3) break;
  }

  return selectedInputs.map((input, index) => {
    const searchable = `${input.title} ${input.description}`;
    const template = STRATEGY_TEMPLATES.find(candidate => candidate.match.test(searchable)) || DEFAULT_TEMPLATE;
    const strategyId = `strategy-${slug(input.id || input.title) || index + 1}`;
    const steps = input.quickSteps.length > 0 ? input.quickSteps : ['Confirm the baseline', 'Execute the approved intervention', 'Measure the result'];
    const objective = `${template.outcome} Start with: ${steps.slice(0, 2).join('; ')}.`;

    return {
      id: strategyId,
      rank: index + 1,
      title: template.title,
      objective,
      rationale: input.description,
      impact: input.impact,
      successMetric: template.metric,
      evidenceIds: input.evidenceIds,
      tasks: template.agents.map((agent, taskIndex) => taskFor(strategyId, agent, taskIndex, objective)),
      providers: [
        providerStatus('tinyfish', capabilities),
        providerStatus('mirofish', capabilities),
      ],
    };
  });
}
