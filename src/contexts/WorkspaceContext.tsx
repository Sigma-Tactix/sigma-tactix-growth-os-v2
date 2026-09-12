import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClientWorkspace } from '@/src/types';
import { useToast } from '@/src/contexts/ToastContext';

const WORKSPACES_STORAGE_KEY = 'sigmatactix_client_workspaces';
const ACTIVE_WORKSPACE_ID_KEY = 'sigmatactix_current_workspace_id';
const ACTIVE_PIPELINES_KEY = 'sigmatactix_active_pipelines';

export const DEFAULT_PRIMARY_WORKSPACE: ClientWorkspace = {
  id: 'ws-primary',
  name: 'Sigma Tactix (HQ)',
  domain: 'sigmatactix.com',
  industry: 'AI Growth Infrastructure & Autonomous Marketing OS',
  icp: 'B2B Founders, CMOs, and Revenue Leaders ($1M–$50M ARR)',
  geography: 'Global (NA & EMEA)',
  region: 'AWS eu-central-1 (Frankfurt)',
  tier: 'growth',
  status: 'ACTIVE',
  vaultSecurity: 'AES-256 GCM • Isolated pgvector',
  createdAt: '2026-08-01',
  activeModel: 'gemini-2.5-flash',
  brandVault: {
    corePositioning: 'Sovereign AI Growth Operating System that eliminates rented agency headcount by deploying client-owned Second Brain and autonomous multi-agent execution.',
    offersAndPricing: 'Starter OS ($499/mo), Growth OS ($1,499/mo), Enterprise / Agency OS ($3,499/mo). Includes real-time growth diagnostic and AEO topical authority.',
    voiceAndTone: 'Authoritative, empirical, anti-slop, engineering-grade, zero buzzwords. Grounded in unit economics and sovereign cloud infrastructure.'
  }
};

interface WorkspaceContextType {
  workspaces: ClientWorkspace[];
  currentWorkspace: ClientWorkspace;
  currentWorkspaceId: string;
  switchWorkspace: (workspaceId: string) => void;
  provisionWorkspace: (clientData: Partial<ClientWorkspace>) => ClientWorkspace;
  deleteWorkspace: (workspaceId: string) => void;
  updateWorkspaceTier: (workspaceId: string, tier: 'starter' | 'growth' | 'enterprise') => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { notifySuccess, notifyInfo, notifyWarning } = useToast();

  // Load workspaces from local storage or default to primary
  const [workspaces, setWorkspaces] = useState<ClientWorkspace[]>(() => {
    try {
      const stored = localStorage.getItem(WORKSPACES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load workspaces from localStorage', e);
    }
    return [DEFAULT_PRIMARY_WORKSPACE];
  });

  // Current active workspace ID
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_WORKSPACE_ID_KEY);
      if (stored) return stored;
    } catch (e) {
      console.error('Failed to load active workspace ID', e);
    }
    return 'ws-primary';
  });

  // Derive current workspace object
  const currentWorkspace = React.useMemo(() => {
    return workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0] || DEFAULT_PRIMARY_WORKSPACE;
  }, [workspaces, currentWorkspaceId]);

  // Persist workspaces
  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
    } catch (e) {
      console.error('Failed to persist workspaces', e);
    }
  }, [workspaces]);

  // Persist active ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, currentWorkspaceId);
    } catch (e) {
      console.error('Failed to persist active workspace ID', e);
    }
  }, [currentWorkspaceId]);

  // Switch workspace
  const switchWorkspace = (workspaceId: string) => {
    const target = workspaces.find(w => w.id === workspaceId);
    if (!target) {
      notifyWarning('Workspace Not Found', `No enclave found matching ID ${workspaceId}`);
      return;
    }
    setCurrentWorkspaceId(workspaceId);
    notifyInfo('Workspace Switched', `Switched active sovereign enclave to "${target.name}" (${target.domain}). All 15 modules re-scoped.`);
  };

  // Provision new client workspace
  const provisionWorkspace = (clientData: Partial<ClientWorkspace>): ClientWorkspace => {
    const rawDomain = clientData.domain || 'clientcompany.com';
    const cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const newId = `ws-${Date.now()}`;

    const newWorkspace: ClientWorkspace = {
      id: newId,
      name: clientData.name || clientData.domain || 'New Client Enclave',
      domain: cleanDomain,
      industry: clientData.industry || 'B2B Enterprise SaaS',
      icp: clientData.icp || 'Growth Directors & Revenue Leaders',
      geography: clientData.geography || 'Global (NA & EMEA)',
      region: clientData.region || 'AWS us-east-1 (N. Virginia)',
      tier: clientData.tier || 'growth',
      status: 'ACTIVE',
      vaultSecurity: 'AES-256 GCM • Isolated pgvector',
      createdAt: new Date().toISOString().split('T')[0],
      activeModel: clientData.activeModel || 'gemini-2.5-flash',
      brandVault: clientData.brandVault || {
        corePositioning: `${clientData.name || 'Client'} sovereign AI growth infrastructure.`,
        offersAndPricing: 'Custom Enterprise Retainer',
        voiceAndTone: 'Empirical, authoritative, high-converting.'
      },
      connectors: clientData.connectors || []
    };

    // If client specified connectors, automatically register into DataSources active pipelines
    if (clientData.connectors && clientData.connectors.length > 0) {
      try {
        const storedPipelines = localStorage.getItem(ACTIVE_PIPELINES_KEY);
        let currentPipelines = storedPipelines ? JSON.parse(storedPipelines) : [];
        if (!Array.isArray(currentPipelines)) currentPipelines = [];

        const newPipelines = clientData.connectors.map((c, i) => ({
          id: `pipe-${Date.now()}-${i}`,
          name: `${c.platform.toUpperCase()} (${c.accountName})`,
          platform: c.platform,
          accountName: c.accountName,
          propertyId: c.propertyId,
          targetVault: c.platform === 'gsc' || c.platform === 'ga4' ? 'Website Vault' : 'Marketing Vault',
          syncFrequency: 'Every 15 mins',
          protocol: 'Direct REST API (OAuth 2.0)',
          status: 'active' as const,
          lastPing: 'Just now',
          latencyMs: Math.floor(Math.random() * 30) + 25,
          credentialSnippet: '••••••••Auth-Token-Live',
          metricsCollected: ['Core Performance Streams', 'Attribution Deltas']
        }));

        localStorage.setItem(ACTIVE_PIPELINES_KEY, JSON.stringify([...newPipelines, ...currentPipelines]));
      } catch (e) {
        console.error('Failed to register initial connectors', e);
      }
    }

    // Add to workspaces and set active
    setWorkspaces(prev => [newWorkspace, ...prev]);
    setCurrentWorkspaceId(newId);

    notifySuccess(
      'Client Enclave Provisioned',
      `"${newWorkspace.name}" (${newWorkspace.domain}) successfully initialized with dedicated Second Brain vaults.`
    );

    return newWorkspace;
  };

  // Delete workspace
  const deleteWorkspace = (workspaceId: string) => {
    if (workspaceId === 'ws-primary') {
      notifyWarning('Protected Workspace', 'The primary sovereign HQ workspace cannot be deleted.');
      return;
    }

    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));

    if (currentWorkspaceId === workspaceId) {
      setCurrentWorkspaceId('ws-primary');
    }

    notifyInfo('Enclave Terminated', `Client enclave ${workspaceId} was removed from active provisioning.`);
  };

  // Update workspace tier
  const updateWorkspaceTier = (workspaceId: string, tier: 'starter' | 'growth' | 'enterprise') => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === workspaceId) {
        return { ...w, tier };
      }
      return w;
    }));
    notifySuccess('Plan Tier Updated', `Workspace plan updated to ${tier.toUpperCase()}.`);
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      switchWorkspace,
      provisionWorkspace,
      deleteWorkspace,
      updateWorkspaceTier
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
