export interface MarketSimulationCapabilities {
  provider: 'mirofish';
  configured: boolean;
  verified: boolean;
  executionEligible: boolean;
  blockers: string[];
  detail: string;
}

export interface ScenarioEvidencePack {
  title: string;
  question: string;
  evidenceSnapshotIds: string[];
  assumptions: string[];
  excludedDataClasses: string[];
}

export interface SimulationLimits {
  maxRounds: number;
  timeoutMinutes: number;
  maxModelSpendUsd?: number;
}

export interface SimulationRef {
  provider: 'mirofish';
  projectId: string;
  simulationId?: string;
  status?: string;
}

export interface ScenarioReport {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  simulatedPersonas: string[];
  keyObjections: string[];
  predictedCounterMoves: string[];
  suggestedExperiments: Array<{
    title: string;
    targetSegment: string;
    metric: string;
  }>;
  generatedAt: string;
}

export interface MarketSimulationProvider {
  capabilities(): Promise<MarketSimulationCapabilities>;
  create(input: ScenarioEvidencePack): Promise<SimulationRef>;
  verify?(): Promise<boolean>;
  generateReport?(ref: SimulationRef): Promise<ScenarioReport>;
}

