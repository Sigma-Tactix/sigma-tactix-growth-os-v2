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
}

export interface MarketSimulationProvider {
  capabilities(): Promise<MarketSimulationCapabilities>;
  create(input: ScenarioEvidencePack): Promise<SimulationRef>;
}
