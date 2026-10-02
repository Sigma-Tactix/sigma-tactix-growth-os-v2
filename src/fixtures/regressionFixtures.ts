import { emptyWorkspaceData } from '../initialData';
import { WorkspaceData, Connector } from '../types';

export type ProviderDataState =
  | 'unconfigured'
  | 'checking'
  | 'incomplete'
  | 'verified_access'
  | 'current_data'
  | 'stale_data'
  | 'failed'
  | 'conflict'
  | 'unsupported';

export interface OperationalStatusReport {
  hasVerifiedStatus: boolean;
  providerState: ProviderDataState;
  isStale?: boolean;
  provenanceHash?: string;
  missingBaselines?: string[];
  errorDetails?: string;
  conflicts?: Array<{
    metric: string;
    sources: string[];
    values: any[];
    discrepancy: string;
  }>;
}

// 1. Empty Workspace Fixture: all connectors disconnected, no fake metrics
export const emptyWorkspaceFixture: WorkspaceData = {
  ...emptyWorkspaceData,
};

// 2. Incomplete Data Fixture: partially filled but missing critical baselines like denominator/MRR
export const incompleteDataFixture: WorkspaceData & { missingBaselines: string[] } = {
  ...emptyWorkspaceData,
  missingBaselines: ['mrr_denominator', 'customer_acquisition_cost_sample'],
  secondBrain: {
    ...emptyWorkspaceData.secondBrain,
    connectors: emptyWorkspaceData.secondBrain.connectors.map((c, idx) =>
      idx === 0
        ? {
            ...c,
            status: 'Connected' as const,
            lastSyncedAt: new Date().toISOString(),
            connectedBy: 'usr-analyst',
          }
        : c
    ),
  },
};

// 3. Approved Data Fixture: verified cryptographic hash, explicit approval, live connector
export const approvedDataFixture: WorkspaceData & {
  provenance: {
    hash: string;
    approvedBy: string;
    approvedAt: string;
    evidenceRecordId: string;
  };
} = {
  ...emptyWorkspaceData,
  provenance: {
    hash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    approvedBy: 'usr-admin-1',
    approvedAt: '2026-10-01T12:00:00Z',
    evidenceRecordId: 'ev-20261001-001',
  },
  secondBrain: {
    ...emptyWorkspaceData.secondBrain,
    connectors: emptyWorkspaceData.secondBrain.connectors.map((c, idx) =>
      idx === 0
        ? {
            ...c,
            status: 'Connected' as const,
            lastSyncedAt: new Date().toISOString(),
            connectedBy: 'usr-admin-1',
          }
        : c
    ),
  },
};

// 4. Stale Data Fixture: last sync older than 7 days threshold
export const staleDataFixture: WorkspaceData & { isStale: boolean } = {
  ...emptyWorkspaceData,
  isStale: true,
  secondBrain: {
    ...emptyWorkspaceData.secondBrain,
    connectors: emptyWorkspaceData.secondBrain.connectors.map((c, idx) =>
      idx === 0
        ? {
            ...c,
            status: 'Connected' as const,
            lastSyncedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            connectedBy: 'usr-admin-1',
          }
        : c
    ),
  },
};

// 5. Provider Failure Fixture: connector in error state with diagnostic detail
export const providerFailureFixture: WorkspaceData & { errorDetails: string } = {
  ...emptyWorkspaceData,
  errorDetails: 'HTTP 401 Unauthorized: Invalid API token or expired refresh lease for provider endpoint.',
  secondBrain: {
    ...emptyWorkspaceData.secondBrain,
    connectors: emptyWorkspaceData.secondBrain.connectors.map((c, idx) =>
      idx === 0
        ? {
            ...c,
            status: 'Disconnected' as const,
            verificationState: 'failed' as const,
            verificationError: 'HTTP 401 Unauthorized: Invalid API token',
            lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
            connectedBy: 'usr-admin-1',
          }
        : c
    ),
  },
};

// 6. Conflicting Data Fixture: two active channels report contradictory facts without provenance reconciliation
export const conflictingDataFixture: WorkspaceData & {
  conflicts: Array<{ metric: string; sources: string[]; values: any[]; discrepancy: string }>;
} = {
  ...emptyWorkspaceData,
  conflicts: [
    {
      metric: 'Monthly Recurring Revenue',
      sources: ['Stripe', 'GA4'],
      values: [8200, 12400],
      discrepancy: 'Revenue mismatch of $4,200 between billing transaction ledger and web conversion tracking.',
    },
  ],
  secondBrain: {
    ...emptyWorkspaceData.secondBrain,
    connectors: emptyWorkspaceData.secondBrain.connectors.map((c, idx) =>
      idx < 2
        ? {
            ...c,
            status: 'Connected' as const,
            lastSyncedAt: new Date().toISOString(),
            connectedBy: 'usr-admin-1',
          }
        : c
    ),
  },
};

/**
 * Evaluates operational status strictly against evidence and provenance.
 * Core Rule: No toast, AI assertion, cached preset, or client event can set a verified status.
 */
export function evaluateOperationalStatus(workspace: any): OperationalStatusReport {
  if (!workspace || !workspace.secondBrain) {
    return { hasVerifiedStatus: false, providerState: 'unconfigured' };
  }

  // Check for explicit conflicting data
  if (workspace.conflicts && workspace.conflicts.length > 0) {
    return {
      hasVerifiedStatus: false,
      providerState: 'conflict',
      conflicts: workspace.conflicts,
    };
  }

  // Check for provider failure
  if (
    workspace.errorDetails ||
    workspace.secondBrain.connectors?.some((c: Connector) => c.verificationState === 'failed')
  ) {
    return {
      hasVerifiedStatus: false,
      providerState: 'failed',
      errorDetails: workspace.errorDetails || 'One or more connectors encountered a sync error.',
    };
  }

  // Check for stale data (older than 7 days or explicitly marked stale)
  const connectedConnectors = workspace.secondBrain.connectors?.filter(
    (c: Connector) => c.status === 'Connected'
  ) || [];

  if (workspace.isStale) {
    return {
      hasVerifiedStatus: false,
      providerState: 'stale_data',
      isStale: true,
    };
  }

  const now = Date.now();
  const hasStaleConnector = connectedConnectors.some((c: Connector) => {
    if (!c.lastSyncedAt) return false;
    const diffDays = (now - new Date(c.lastSyncedAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  });

  if (hasStaleConnector) {
    return {
      hasVerifiedStatus: false,
      providerState: 'stale_data',
      isStale: true,
    };
  }

  // Check for incomplete data / missing baselines
  if (workspace.missingBaselines && workspace.missingBaselines.length > 0) {
    return {
      hasVerifiedStatus: false,
      providerState: 'incomplete',
      missingBaselines: workspace.missingBaselines,
    };
  }

  // Check for verified provenance
  if (
    workspace.provenance?.hash &&
    workspace.provenance?.approvedBy &&
    connectedConnectors.length > 0
  ) {
    return {
      hasVerifiedStatus: true,
      providerState: 'verified_access',
      provenanceHash: workspace.provenance.hash,
    };
  }

  if (connectedConnectors.length === 0) {
    return {
      hasVerifiedStatus: false,
      providerState: 'unconfigured',
    };
  }

  return {
    hasVerifiedStatus: false,
    providerState: 'current_data',
  };
}
