import type {
  MarketSimulationCapabilities,
  MarketSimulationProvider,
  ScenarioEvidencePack,
  ScenarioReport,
  SimulationRef,
} from './types';

export class FixtureMarketSimulationAdapter implements MarketSimulationProvider {
  async capabilities(): Promise<MarketSimulationCapabilities> {
    return {
      provider: 'mirofish',
      configured: true,
      verified: true,
      executionEligible: false,
      blockers: [],
      detail: 'Fixture market simulation adapter active for deterministic testing and local development.',
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }

  async create(input: ScenarioEvidencePack): Promise<SimulationRef> {
    const timestamp = Date.now();
    return {
      provider: 'mirofish',
      projectId: `sim-proj-${timestamp}`,
      simulationId: `sim-run-${timestamp}`,
      status: 'READY',
    };
  }

  async generateReport(ref: SimulationRef): Promise<ScenarioReport> {
    return {
      id: `report-${ref.projectId}`,
      projectId: ref.projectId,
      title: 'Simulated Market Rehearsal & Buyer Response',
      summary: 'Simulated 10 rounds across 3 buyer archetypes (Mid-market CTO, Growth Lead, Enterprise Procurement). High sensitivity to upfront implementation cost observed.',
      simulatedPersonas: ['B2B SaaS Growth Lead', 'VP of Engineering', 'Finance / Procurement Director'],
      keyObjections: [
        'Security / compliance posture on AI data retention',
        'Time to value vs. existing established tools',
      ],
      predictedCounterMoves: [
        'Incumbents likely to bundle entry-level intelligence features within 90 days',
      ],
      suggestedExperiments: [
        {
          title: 'Offer self-serve 14-day ROI trial with zero migration friction',
          targetSegment: 'Mid-market Growth Teams',
          metric: 'Trial-to-Paid Conversion +18%',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
